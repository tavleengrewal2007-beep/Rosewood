import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Sparkles, User, Plus, Trash2, Edit2, ArrowRight } from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { useNavigation } from '../../context/NavigationContext';
import { WEEKDAYS, Weekday, AcademicClass, DetectedGap } from '../../types/timetable';
import { formatDuration, timeToMinutes } from '../../services/gapEngine/schedulingEngine';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export const TodayTimeline: React.FC = () => {
  const { getClassesForDay, getGapsForDay, openCreateModal, openEditModal, deleteClass } = useTimetable();
  const { setActiveModule } = useNavigation();

  // Current weekday
  const todayIndex = new Date().getDay();
  const currentWeekday: Weekday =
    todayIndex === 0 ? 'monday' : (WEEKDAYS[todayIndex - 1] || 'monday');

  const todayClasses = getClassesForDay(currentWeekday);
  const todayGaps = getGapsForDay(currentWeekday).filter((g) => !g.isDayBoundary);

  // Current time in minutes for highlighting
  const [nowMinutes, setNowMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Merge classes and gaps into chronological stream
  type TimelineEntry =
    | { type: 'class'; item: AcademicClass; time: number }
    | { type: 'gap'; item: DetectedGap; time: number };

  const entries: TimelineEntry[] = [
    ...todayClasses.map((c) => ({
      type: 'class' as const,
      item: c,
      time: timeToMinutes(c.startTime),
    })),
    ...todayGaps.map((g) => ({
      type: 'gap' as const,
      item: g,
      time: timeToMinutes(g.startTime),
    })),
  ].sort((a, b) => a.time - b.time);

  return (
    <Card elevated className="p-6">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <CardTitle>Today's Academic & Lifestyle Rhythm</CardTitle>
          <CardDescription>
            Chronological stream of scheduled lectures, detected gaps, and mindful breaks.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveModule('timetable')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs text-charcoal-muted hover:text-forest"
          >
            Full Timetable
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => openCreateModal(currentWeekday)}
          >
            Add Class
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-blush rounded-2xl">
            <Clock className="w-8 h-8 text-charcoal-muted mx-auto mb-2" />
            <p className="text-sm font-heading font-medium text-charcoal">No events today</p>
            <p className="text-xs text-charcoal-muted mt-1">
              Add your classes to begin generating intelligent gap schedules.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blush">
            {entries.map((entry) => {
              if (entry.type === 'class') {
                const cls = entry.item;
                const startM = timeToMinutes(cls.startTime);
                const endM = timeToMinutes(cls.endTime);
                const isPast = nowMinutes > endM;
                const isCurrent = nowMinutes >= startM && nowMinutes <= endM;
                const isUpcoming = nowMinutes < startM;
                const duration = endM - startM;

                return (
                  <div key={cls.id} className="relative group">
                    {/* Node Dot */}
                    <div
                      className={cn(
                        'absolute -left-6 top-4 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 transition-all',
                        isCurrent
                          ? 'bg-rose ring-rose/50 scale-125'
                          : isPast
                          ? 'bg-charcoal-muted ring-blush'
                          : 'bg-forest ring-forest/30'
                      )}
                    />

                    {/* Class Card */}
                    <div
                      className={cn(
                        'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                        isCurrent
                          ? 'bg-forest-ultraLight border-forest/30 shadow-soft'
                          : isPast
                          ? 'bg-white/60 border-blush/60 opacity-75'
                          : 'bg-white border-blush/80 hover:border-forest/30 shadow-soft-sm'
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="forest" size="sm">{cls.code}</Badge>
                          <span className="font-heading font-bold text-sm sm:text-base text-charcoal">
                            {cls.subject}
                          </span>
                          {isCurrent && (
                            <Badge variant="rose" size="sm">Happening Now</Badge>
                          )}
                          {isUpcoming && (
                            <Badge variant="gold" size="sm">Upcoming</Badge>
                          )}
                          {isPast && (
                            <span className="text-[10px] text-charcoal-muted uppercase font-semibold">Done</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-muted">
                          <span className="flex items-center gap-1 font-medium text-charcoal">
                            <Clock className="w-3.5 h-3.5 text-forest" />
                            {cls.startTime} – {cls.endTime} ({formatDuration(duration)})
                          </span>
                          {cls.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose" />
                              {cls.location}
                            </span>
                          )}
                          {cls.professor && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-charcoal-muted" />
                              {cls.professor}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Item Quick Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(cls)}
                          className="p-1.5 rounded-lg text-charcoal-muted hover:text-forest hover:bg-blush/30 cursor-pointer"
                          title="Edit Class"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteClass(cls.id)}
                          className="p-1.5 rounded-lg text-charcoal-muted hover:text-rose hover:bg-rose/10 cursor-pointer"
                          title="Delete Class"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Gap
                const gap = entry.item;
                const startM = timeToMinutes(gap.startTime);
                const isPast = nowMinutes > timeToMinutes(gap.endTime);

                return (
                  <div key={gap.id} className="relative">
                    {/* Gap Node Dot */}
                    <div
                      className={cn(
                        'absolute -left-6 top-4 w-3.5 h-3.5 rounded-full border-2 border-white ring-2',
                        isPast ? 'bg-blush ring-blush' : 'bg-gold ring-gold/40'
                      )}
                    />

                    {/* Gap Card */}
                    <div className="p-3.5 rounded-2xl border border-dashed border-gold/60 bg-gold/10 hover:bg-gold/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-xs text-forest flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
                            Free Window: {gap.rawDurationMinutes} mins
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/25 text-charcoal uppercase font-semibold">
                            {gap.classification} break
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-muted mt-0.5">
                          {gap.startTime} – {gap.endTime}
                          {gap.bufferMinutesDeducted > 0 && ` (${gap.usableDurationMinutes}m usable after walk buffer)`}
                        </p>
                      </div>

                      <div className="text-[11px] text-charcoal-muted flex items-center gap-2">
                        <span>{gap.recommendedActivities[0]}</span>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
