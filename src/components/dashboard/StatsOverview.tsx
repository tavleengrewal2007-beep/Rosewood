import React from 'react';
import { BookOpen, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { WEEKDAYS, Weekday } from '../../types/timetable';
import { formatDuration, timeToMinutes } from '../../services/gapEngine/schedulingEngine';
import { Card } from '../ui/Card';

interface StatsOverviewProps {
  completedGoalsCount: number;
  totalGoalsCount: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  completedGoalsCount,
  totalGoalsCount,
}) => {
  const { getClassesForDay, getGapsForDay } = useTimetable();

  const todayIndex = new Date().getDay();
  const currentWeekday: Weekday =
    todayIndex === 0 ? 'monday' : (WEEKDAYS[todayIndex - 1] || 'monday');

  const todayClasses = getClassesForDay(currentWeekday);
  const todayGaps = getGapsForDay(currentWeekday).filter((g) => !g.isDayBoundary);

  // Total academic hours
  const totalClassMinutes = todayClasses.reduce(
    (acc, c) => acc + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)),
    0
  );
  const academicHours = (totalClassMinutes / 60).toFixed(1);

  // Total free gap minutes
  const totalGapMinutes = todayGaps.reduce((acc, g) => acc + g.rawDurationMinutes, 0);

  const goalPercentage =
    totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

  // Next upcoming class today
  const nextClass = todayClasses[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Metric 1: Classes Today */}
      <Card elevated className="space-y-1">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-heading font-medium text-charcoal-muted">
            Classes Today
          </span>
          <div className="p-1.5 rounded-lg bg-forest/10 text-forest">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-extrabold text-2xl text-charcoal">
            {todayClasses.length}
          </span>
          <span className="text-xs text-charcoal-muted">scheduled lectures</span>
        </div>
        <p className="text-[11px] text-forest font-medium pt-1 truncate">
          {nextClass ? `Next: ${nextClass.code} at ${nextClass.startTime}` : 'No further classes today'}
        </p>
      </Card>

      {/* Metric 2: Academic Hours */}
      <Card elevated className="space-y-1">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-heading font-medium text-charcoal-muted">
            Academic Hours
          </span>
          <div className="p-1.5 rounded-lg bg-rose/15 text-rose">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-extrabold text-2xl text-charcoal">
            {academicHours}h
          </span>
          <span className="text-xs text-charcoal-muted">contact teaching</span>
        </div>
        <p className="text-[11px] text-charcoal-muted pt-1">
          Balanced lecture load for {currentWeekday}
        </p>
      </Card>

      {/* Metric 3: Available Free Time */}
      <Card elevated className="space-y-1">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-heading font-medium text-charcoal-muted">
            Available Free Time
          </span>
          <div className="p-1.5 rounded-lg bg-gold/25 text-charcoal">
            <Sparkles className="w-3.5 h-3.5 text-forest" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-extrabold text-2xl text-forest">
            {formatDuration(totalGapMinutes)}
          </span>
          <span className="text-xs text-charcoal-muted">detected gaps</span>
        </div>
        <p className="text-[11px] text-forest font-medium pt-1">
          {todayGaps.length} free study/meal windows
        </p>
      </Card>

      {/* Metric 4: Completed Goals */}
      <Card elevated className="space-y-1">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-heading font-medium text-charcoal-muted">
            Goals Completed
          </span>
          <div className="p-1.5 rounded-lg bg-blush/60 text-charcoal">
            <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-extrabold text-2xl text-charcoal">
            {completedGoalsCount}/{totalGoalsCount}
          </span>
          <span className="text-xs text-charcoal-muted font-medium">({goalPercentage}%)</span>
        </div>
        <div className="w-full bg-blush/50 h-1.5 rounded-full overflow-hidden mt-1.5">
          <div
            className="bg-forest h-full rounded-full transition-all duration-300"
            style={{ width: `${goalPercentage}%` }}
          />
        </div>
      </Card>
    </div>
  );
};
