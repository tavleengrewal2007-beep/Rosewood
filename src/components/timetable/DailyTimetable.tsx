import React from 'react';
import {
  Clock,
  MapPin,
  User,
  Sparkles,
  AlertTriangle,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Footprints,
  Coffee,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { Weekday, WEEKDAY_LABELS, AcademicClass, DetectedGap } from '../../types/timetable';
import { formatDuration, formatTime12h, timeToMinutes } from '../../services/gapEngine/schedulingEngine';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export const DailyTimetable: React.FC<{ selectedDay: Weekday }> = ({ selectedDay }) => {
  const {
    getClassesForDay,
    getGapsForDay,
    getConflictsForDay,
    openEditModal,
    openCreateModal,
    duplicateClass,
    deleteClass,
    schedulerConfig,
  } = useTimetable();

  const dayClasses = getClassesForDay(selectedDay);
  const dayGaps = getGapsForDay(selectedDay);
  const conflicts = getConflictsForDay(selectedDay);

  // Total class and free minutes
  const totalClassMinutes = dayClasses.reduce(
    (acc, c) => acc + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)),
    0
  );
  const totalGapMinutes = dayGaps.reduce((acc, g) => acc + g.rawDurationMinutes, 0);

  // Combine classes and gaps into a unified chronological day stream
  type StreamEvent =
    | { kind: 'class'; data: AcademicClass; time: number }
    | { kind: 'gap'; data: DetectedGap; time: number };

  const streamEvents: StreamEvent[] = [
    ...dayClasses.map((c) => ({
      kind: 'class' as const,
      data: c,
      time: timeToMinutes(c.startTime),
    })),
    ...dayGaps.map((g) => ({
      kind: 'gap' as const,
      data: g,
      time: timeToMinutes(g.startTime),
    })),
  ].sort((a, b) => a.time - b.time);

  return (
    <div className="space-y-6">
      {/* 1. Day Summary Bar */}
      <div className="bg-white p-5 rounded-3xl border border-blush/80 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-extrabold text-xl text-forest capitalize">
              {WEEKDAY_LABELS[selectedDay]} Schedule
            </h3>
            <Badge variant="forest" size="sm">
              {dayClasses.length} {dayClasses.length === 1 ? 'Class' : 'Classes'}
            </Badge>
          </div>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Detailed breakdown of scheduled lectures and automatically synthesized free gaps.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-ivory-paper border border-blush/70">
            <span className="text-charcoal-muted">Class Time: </span>
            <strong className="font-heading text-forest">{formatDuration(totalClassMinutes)}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/30">
            <span className="text-charcoal-muted">Free Gaps: </span>
            <strong className="font-heading text-forest">{formatDuration(totalGapMinutes)}</strong>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => openCreateModal(selectedDay)}
          >
            Add Class
          </Button>
        </div>
      </div>

      {/* 2. Overlap Conflicts Notification */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl border border-rose/40 bg-rose/10 space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-rose font-heading font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Class Overlap Detected</span>
          </div>
          {conflicts.map((c) => (
            <div key={c.id} className="text-xs text-charcoal-muted flex items-center justify-between">
              <span>
                • <strong>{c.classA.code}</strong> ({c.classA.startTime}–{c.classA.endTime}) overlaps with{' '}
                <strong>{c.classB.code}</strong> ({c.classB.startTime}–{c.classB.endTime}) by {c.overlapMinutes} mins ({c.overlapWindow}).
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 py-0 px-2.5"
                onClick={() => openEditModal(c.classB)}
              >
                Resolve
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 3. Empty State if no classes */}
      {streamEvents.length === 0 ? (
        <Card className="border-dashed border-2 border-blush bg-ivory/40 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blush/40 text-forest flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-bold text-lg text-forest">No Classes on {WEEKDAY_LABELS[selectedDay]}</h3>
          <p className="text-xs text-charcoal-muted max-w-sm mt-1 mb-6 leading-relaxed">
            Your schedule is currently clear on this day. Add a recurring lecture or seminar to calculate free periods.
          </p>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => openCreateModal(selectedDay)}
          >
            Schedule Class on {WEEKDAY_LABELS[selectedDay]}
          </Button>
        </Card>
      ) : (
        /* 4. Chronological Stream */
        <div className="space-y-4">
          {streamEvents.map((event, idx) => {
            if (event.kind === 'class') {
              const cls = event.data;
              const duration = timeToMinutes(cls.endTime) - timeToMinutes(cls.startTime);

              const colorPillStyles = {
                forest: 'bg-forest/10 text-forest border-forest/20',
                rose: 'bg-rose/15 text-rose border-rose/30',
                gold: 'bg-gold/25 text-charcoal border-gold/30',
                blush: 'bg-blush/60 text-charcoal border-blush-border',
                slate: 'bg-charcoal/10 text-charcoal border-charcoal/20',
              }[cls.color];

              return (
                <div
                  key={cls.id}
                  className="rounded-2xl border border-blush/80 bg-white p-5 shadow-soft-sm hover:shadow-soft transition-all duration-200 group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'text-xs px-2.5 py-0.5 rounded-full font-heading font-bold border',
                          colorPillStyles
                        )}
                      >
                        {cls.code}
                      </span>
                      <h4 className="font-heading font-bold text-base text-charcoal">
                        {cls.subject}
                      </h4>
                      {cls.isRecurring && (
                        <Badge variant="outline" size="sm">Weekly</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-charcoal-muted">
                      <span className="flex items-center gap-1 font-medium text-forest">
                        <Clock className="w-3.5 h-3.5" />
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

                    {cls.notes && (
                      <p className="text-xs text-charcoal-muted italic pt-1">
                        Note: {cls.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => openEditModal(cls)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Copy className="w-3.5 h-3.5" />}
                      onClick={() => duplicateClass(cls.id)}
                    >
                      Duplicate
                    </Button>
                    <button
                      onClick={() => deleteClass(cls.id)}
                      className="p-2 rounded-xl text-charcoal-muted hover:text-rose hover:bg-rose/10 transition-colors cursor-pointer"
                      title="Delete class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            } else {
              // GAP BLOCK
              const gap = event.data;
              const classificationBadge = {
                micro: { label: 'Micro Break (5-15m)', variant: 'blush' as const },
                short: { label: 'Short Break (15-30m)', variant: 'rose' as const },
                medium: { label: 'Medium Break (30-60m)', variant: 'gold' as const },
                long: { label: 'Long Break (60m+)', variant: 'forest' as const },
              }[gap.classification];

              return (
                <div
                  key={gap.id}
                  className={cn(
                    'rounded-2xl border border-dashed border-gold/70 bg-gradient-to-r from-gold/10 via-ivory to-white p-5 shadow-soft-sm transition-all',
                    gap.isDayBoundary && 'opacity-85 border-blush-border bg-ivory-paper/50'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blush/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gold/25 text-charcoal flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-forest" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-extrabold text-sm sm:text-base text-forest">
                            {gap.isDayBoundary ? 'Boundary Open Window' : 'Detected Free Period Gap'}
                          </span>
                          <Badge variant={classificationBadge.variant} size="sm">
                            {classificationBadge.label}
                          </Badge>
                        </div>
                        <span className="text-xs text-charcoal-muted flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-semibold text-charcoal">
                            {gap.startTime} – {gap.endTime}
                          </span>
                          <span>•</span>
                          <span>{gap.rawDurationMinutes} minutes gross</span>
                          {gap.bufferMinutesDeducted > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-rose font-medium">
                                <Footprints className="w-3 h-3" />
                                {gap.bufferMinutesDeducted}m walk buffer deducted ({gap.usableDurationMinutes}m usable)
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Badge variant="gold" size="sm">
                        {gap.usableDurationMinutes}m Focus / Rest
                      </Badge>
                    </div>
                  </div>

                  {/* Context of gap: between Class A and Class B */}
                  {(gap.precedingClass || gap.succeedingClass) && (
                    <div className="py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-muted border-b border-blush/40">
                      {gap.precedingClass && (
                        <span>
                          Leaves from <strong>{gap.precedingClass.code}</strong> ({gap.precedingClass.location || 'Campus'}) at {gap.precedingClass.endTime}
                        </span>
                      )}
                      {gap.precedingClass && gap.succeedingClass && <span>➔</span>}
                      {gap.succeedingClass && (
                        <span>
                          Next class is <strong>{gap.succeedingClass.code}</strong> at {gap.succeedingClass.startTime} ({gap.succeedingClass.location || 'Room'})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="pt-3">
                    <span className="text-[11px] font-heading font-semibold text-charcoal-muted uppercase tracking-wider block mb-1.5">
                      Intelligent Recommendations for this Window:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {gap.recommendedActivities.map((act, i) => (
                        <div
                          key={i}
                          className="px-3 py-1 rounded-xl bg-white border border-blush/70 text-xs text-charcoal flex items-center gap-1.5 shadow-soft-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};
