import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  Plus,
  ShieldCheck,
  Clock,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { WEEKDAYS, WEEKDAY_LABELS, WEEKDAY_SHORT_LABELS, Weekday } from '../../types/timetable';
import { WeeklyTimetable } from './WeeklyTimetable';
import { DailyTimetable } from './DailyTimetable';
import { ClassModal } from './ClassModal';
import { GapDiagnosticsModal } from './GapDiagnosticsModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

export const TimetableModule: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    selectedDay,
    setSelectedDay,
    schedulerConfig,
    updateSchedulerConfig,
    openCreateModal,
    weeklyConflicts,
    setIsDiagnosticsOpen,
  } = useTimetable();

  const todayIndex = new Date().getDay(); // 0 is Sunday
  const todayWeekday: Weekday =
    todayIndex === 0 ? 'monday' : (WEEKDAYS[todayIndex - 1] || 'monday');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-blush/80 shadow-soft-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-xl text-forest tracking-tight">
              Academic Timetable & Gap Engine
            </h2>
            <Badge variant="forest" size="sm">Automated</Badge>
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            Real-time schedule synchronizer with dynamic gap synthesis and conflict detection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Buffer Control */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blush bg-ivory-paper text-xs">
            <Clock className="w-3.5 h-3.5 text-forest" />
            <span className="text-charcoal-muted font-medium">Walk Buffer:</span>
            <select
              value={schedulerConfig.travelBufferMinutes}
              onChange={(e) => updateSchedulerConfig({ travelBufferMinutes: Number(e.target.value) })}
              className="bg-transparent font-heading font-bold text-forest focus:outline-none cursor-pointer"
            >
              <option value="0">0m</option>
              <option value="5">5m</option>
              <option value="10">10m</option>
              <option value="15">15m</option>
            </select>
          </div>

          {/* Engine Inspector / Tests */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-forest" />}
            onClick={() => setIsDiagnosticsOpen(true)}
            className="text-xs"
          >
            Audit Engine
          </Button>

          {/* View Mode Toggle */}
          <div className="flex p-1 rounded-xl bg-ivory-paper border border-blush">
            <button
              onClick={() => setViewMode('weekly')}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all cursor-pointer',
                viewMode === 'weekly'
                  ? 'bg-forest text-ivory shadow-soft'
                  : 'text-charcoal-muted hover:text-forest'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Weekly Grid</span>
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all cursor-pointer',
                viewMode === 'daily'
                  ? 'bg-forest text-ivory shadow-soft'
                  : 'text-charcoal-muted hover:text-forest'
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Daily Flow</span>
            </button>
          </div>

          {/* Add Class Button */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => openCreateModal(selectedDay)}
          >
            Add Class
          </Button>
        </div>
      </div>

      {/* 2. Conflict Warning Alert (if any) */}
      {weeklyConflicts.length > 0 && (
        <div className="p-4 rounded-2xl border border-rose/40 bg-rose/10 flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-bold text-sm text-charcoal">
                {weeklyConflicts.length} Schedule Conflict Detected
              </p>
              <div className="text-xs text-charcoal-muted mt-0.5 space-y-0.5">
                {weeklyConflicts.map((c, i) => (
                  <span key={i} className="block">
                    • <strong>{c.classA.code}</strong> and <strong>{c.classB.code}</strong> overlap on{' '}
                    <span className="capitalize">{c.day}</span> by {c.overlapMinutes} mins ({c.overlapWindow}).
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Badge variant="rose" size="sm">Action Needed</Badge>
        </div>
      )}

      {/* 3. Weekday Tabs (Monday – Saturday) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {WEEKDAYS.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = todayWeekday === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                'flex-1 min-w-[100px] py-2.5 px-3 rounded-2xl border text-center transition-all duration-150 relative cursor-pointer',
                isSelected
                  ? 'bg-forest text-ivory border-forest shadow-soft'
                  : 'bg-white border-blush/70 text-charcoal hover:border-forest/30 hover:bg-ivory-paper'
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-heading font-semibold text-xs tracking-tight capitalize">
                  {WEEKDAY_LABELS[day]}
                </span>
                {isToday && (
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isSelected ? 'bg-gold' : 'bg-rose'
                    )}
                    title="Current Day"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Active Viewport */}
      {viewMode === 'weekly' ? (
        <WeeklyTimetable />
      ) : (
        <DailyTimetable selectedDay={selectedDay} />
      )}

      {/* 5. Modals */}
      <ClassModal />
      <GapDiagnosticsModal />
    </div>
  );
};
