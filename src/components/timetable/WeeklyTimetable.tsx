import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Sparkles, AlertCircle, Plus, User } from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { WEEKDAYS, WEEKDAY_LABELS, WEEKDAY_SHORT_LABELS, Weekday, AcademicClass } from '../../types/timetable';
import { timeToMinutes, formatTime12h, formatDuration } from '../../services/gapEngine/schedulingEngine';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

export const WeeklyTimetable: React.FC = () => {
  const {
    getClassesForDay,
    getGapsForDay,
    getConflictsForDay,
    schedulerConfig,
    openEditModal,
    openCreateModal,
    setSelectedDay,
    setViewMode,
  } = useTimetable();

  const startHour = schedulerConfig.dayStartHour;
  const endHour = schedulerConfig.dayEndHour;
  const totalHours = Math.max(1, endHour - startHour);
  const totalMinutesInGrid = totalHours * 60;
  const hourRowHeight = 68; // Height in pixels per hour block

  // Current real-time marker
  const [currentMinutesFromDayStart, setCurrentMinutesFromDayStart] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const gridStartMinutes = startHour * 60;
      const gridEndMinutes = endHour * 60;

      if (currentTotalMinutes >= gridStartMinutes && currentTotalMinutes <= gridEndMinutes) {
        setCurrentMinutesFromDayStart(currentTotalMinutes - gridStartMinutes);
      } else {
        setCurrentMinutesFromDayStart(null);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [startHour, endHour]);

  const hoursArray = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

  // Compute today's weekday
  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
  const currentWeekday: Weekday =
    todayIndex === 0 ? 'monday' : (WEEKDAYS[todayIndex - 1] || 'monday');

  return (
    <div className="rounded-3xl border border-blush/80 bg-white shadow-soft-sm overflow-hidden flex flex-col">
      {/* Top Banner with Instructions */}
      <div className="px-5 py-3 bg-ivory-paper border-b border-blush/70 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-heading font-semibold text-charcoal flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
            Live Weekly Time Grid (Mon–Sat)
          </span>
          <span className="text-charcoal-muted hidden sm:inline">
            Double-click any open slot to schedule a class. Click any class to edit.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-charcoal-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-forest" /> Lecture
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-gold/30 border border-gold" /> Detected Gap
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-rose" /> Current Time
          </span>
        </div>
      </div>

      {/* Overflow Container for Grid */}
      <div className="overflow-x-auto min-w-full">
        <div className="min-w-[840px]">
          {/* Header row: Days */}
          <div className="grid grid-cols-[70px_repeat(6,1fr)] border-b border-blush/80 bg-ivory-paper select-none">
            <div className="p-3 border-r border-blush/60 text-[11px] font-heading font-semibold text-charcoal-muted text-center flex items-center justify-center">
              Time
            </div>

            {WEEKDAYS.map((day) => {
              const isToday = currentWeekday === day;
              const conflicts = getConflictsForDay(day);

              return (
                <div
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                  }}
                  className={cn(
                    'p-2.5 border-r border-blush/60 last:border-r-0 text-center transition-all cursor-pointer group',
                    isToday ? 'bg-forest/10 border-b-2 border-b-forest' : 'hover:bg-blush/20'
                  )}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={cn(
                        'font-heading font-extrabold text-xs uppercase tracking-wider',
                        isToday ? 'text-forest' : 'text-charcoal'
                      )}
                    >
                      {WEEKDAY_SHORT_LABELS[day]}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose" title="Today" />
                    )}
                  </div>
                  <div className="text-[10px] text-charcoal-muted mt-0.5 flex items-center justify-center gap-1">
                    <span>{WEEKDAY_LABELS[day]}</span>
                    {conflicts.length > 0 && (
                      <span className="text-rose font-bold" title="Overlap conflict">
                        ⚠
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Canvas */}
          <div
            className="grid grid-cols-[70px_repeat(6,1fr)] relative select-none"
            style={{ height: `${totalHours * hourRowHeight}px` }}
          >
            {/* Left Axis: Hours */}
            <div className="border-r border-blush/60 bg-ivory-paper/40 relative">
              {hoursArray.map((hour, idx) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 pr-2.5 text-right text-[10px] font-mono text-charcoal-muted"
                  style={{ top: `${idx * hourRowHeight - 7}px` }}
                >
                  {hour % 12 === 0 ? 12 : hour % 12}:00
                  <span className="text-[8px] ml-0.5">{hour >= 12 ? 'PM' : 'AM'}</span>
                </div>
              ))}
            </div>

            {/* 6 Weekday Columns */}
            {WEEKDAYS.map((day) => {
              const dayClasses = getClassesForDay(day);
              const dayGaps = getGapsForDay(day);
              const isToday = currentWeekday === day;

              return (
                <div
                  key={day}
                  onDoubleClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const fraction = clickY / (totalHours * hourRowHeight);
                    const clickedMinutes = startHour * 60 + fraction * totalMinutesInGrid;
                    const hours = Math.floor(clickedMinutes / 60);
                    const roundedMins = Math.floor((clickedMinutes % 60) / 15) * 15;
                    const timeString = `${String(hours).padStart(2, '0')}:${String(roundedMins).padStart(2, '0')}`;
                    openCreateModal(day, timeString);
                  }}
                  className={cn(
                    'relative border-r border-blush/60 last:border-r-0 h-full transition-colors',
                    isToday ? 'bg-forest/[0.02]' : 'hover:bg-ivory-paper/30'
                  )}
                >
                  {/* Horizontal Hour Lines */}
                  {hoursArray.map((_, idx) => (
                    <div
                      key={idx}
                      className="absolute left-0 right-0 border-b border-blush/25 pointer-events-none"
                      style={{ top: `${idx * hourRowHeight}px` }}
                    />
                  ))}

                  {/* Current Time Horizontal Line */}
                  {isToday && currentMinutesFromDayStart !== null && (
                    <div
                      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                      style={{
                        top: `${(currentMinutesFromDayStart / totalMinutesInGrid) * (totalHours * hourRowHeight)}px`,
                      }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-rose -ml-1.5 shadow-soft ring-2 ring-rose/30" />
                      <div className="h-0.5 bg-rose w-full shadow-soft" />
                    </div>
                  )}

                  {/* Render Detected Gaps (Inter-class free windows) */}
                  {dayGaps
                    .filter((g) => !g.isDayBoundary)
                    .map((gap) => {
                      const gapStartMins = timeToMinutes(gap.startTime) - startHour * 60;
                      const top = (gapStartMins / totalMinutesInGrid) * (totalHours * hourRowHeight);
                      const height = (gap.rawDurationMinutes / totalMinutesInGrid) * (totalHours * hourRowHeight);

                      if (top < 0 || height <= 8) return null;

                      return (
                        <div
                          key={gap.id}
                          onClick={() => {
                            setSelectedDay(day);
                            setViewMode('daily');
                          }}
                          className={cn(
                            'absolute left-1 right-1 rounded-xl border border-dashed border-gold/70 bg-gold/15 p-1.5 overflow-hidden transition-all hover:bg-gold/25 hover:border-gold cursor-pointer z-10 flex flex-col justify-between group'
                          )}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          title={`Free Gap: ${gap.startTime} – ${gap.endTime} (${gap.rawDurationMinutes}m)`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-heading font-bold text-[10px] text-forest flex items-center gap-1 truncate">
                              <Sparkles className="w-3 h-3 text-gold shrink-0" />
                              {gap.rawDurationMinutes}m Free
                            </span>
                            <span className="text-[9px] uppercase font-semibold text-charcoal-muted hidden group-hover:inline">
                              {gap.classification}
                            </span>
                          </div>
                          {height >= 34 && (
                            <span className="text-[9px] text-charcoal-muted truncate font-mono">
                              {gap.startTime}–{gap.endTime}
                            </span>
                          )}
                        </div>
                      );
                    })}

                  {/* Render Scheduled Classes */}
                  {dayClasses.map((cls) => {
                    const classStartMins = timeToMinutes(cls.startTime) - startHour * 60;
                    const duration = timeToMinutes(cls.endTime) - timeToMinutes(cls.startTime);
                    const top = (classStartMins / totalMinutesInGrid) * (totalHours * hourRowHeight);
                    const height = (duration / totalMinutesInGrid) * (totalHours * hourRowHeight);

                    if (top < 0 || height <= 0) return null;

                    const colorStyles = {
                      forest: 'bg-forest text-ivory border-forest hover:bg-forest-hover shadow-soft',
                      rose: 'bg-rose text-white border-rose hover:bg-rose-hover shadow-soft',
                      gold: 'bg-gold text-forest border-gold hover:bg-gold-hover shadow-soft',
                      blush: 'bg-blush text-charcoal border-blush-border hover:bg-blush-subtle shadow-soft-sm',
                      slate: 'bg-charcoal text-ivory border-charcoal hover:bg-black shadow-soft',
                    }[cls.color];

                    return (
                      <div
                        key={cls.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(cls);
                        }}
                        className={cn(
                          'absolute left-1 right-1 rounded-xl p-2 cursor-pointer transition-all duration-150 z-20 border flex flex-col justify-between overflow-hidden group select-none',
                          colorStyles
                        )}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${cls.code} - ${cls.subject} (${cls.startTime} - ${cls.endTime})`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 leading-tight">
                            <span className="font-heading font-extrabold text-[11px] tracking-tight truncate">
                              {cls.code}
                            </span>
                            <span className="text-[9px] opacity-80 shrink-0 font-mono">
                              {formatDuration(duration)}
                            </span>
                          </div>
                          {height >= 44 && (
                            <p className="text-[10px] opacity-90 truncate font-medium mt-0.5 leading-snug">
                              {cls.subject}
                            </p>
                          )}
                        </div>

                        {height >= 60 && cls.location && (
                          <div className="flex items-center gap-1 text-[9px] opacity-85 truncate mt-auto">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{cls.location}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
