import React from 'react';
import { Sparkles, Clock, Footprints, CheckCircle2, ArrowRight, ShieldCheck, Filter } from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { useNavigation } from '../../context/NavigationContext';
import { WEEKDAYS, WEEKDAY_LABELS, Weekday, DetectedGap } from '../../types/timetable';
import { formatDuration } from '../../services/gapEngine/schedulingEngine';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export const GapsModule: React.FC = () => {
  const {
    getGapsForDay,
    getClassesForDay,
    schedulerConfig,
    updateSchedulerConfig,
    setSelectedDay,
    setViewMode,
    setIsDiagnosticsOpen,
  } = useTimetable();
  const { setActiveModule } = useNavigation();

  // Aggregate all gaps across the week
  const allWeekGaps = WEEKDAYS.flatMap((day) =>
    getGapsForDay(day).map((gap) => ({ ...gap, day }))
  ).filter((g) => !g.isDayBoundary);

  const microCount = allWeekGaps.filter((g) => g.classification === 'micro').length;
  const shortCount = allWeekGaps.filter((g) => g.classification === 'short').length;
  const mediumCount = allWeekGaps.filter((g) => g.classification === 'medium').length;
  const longCount = allWeekGaps.filter((g) => g.classification === 'long').length;

  const totalGrossMinutes = allWeekGaps.reduce((acc, g) => acc + g.rawDurationMinutes, 0);
  const totalUsableMinutes = allWeekGaps.reduce((acc, g) => acc + g.usableDurationMinutes, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-blush/80 shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-forest tracking-tight">
              Automatic Gap Detection Engine
            </h2>
            <Badge variant="gold" size="sm">Independent Core</Badge>
          </div>
          <p className="text-xs text-charcoal-muted mt-1 max-w-xl leading-relaxed">
            Continuously calculates interstitial windows between scheduled classes, deducts transit buffers,
            and classifies free periods into productive or restorative opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ShieldCheck className="w-4 h-4 text-forest" />}
            onClick={() => setIsDiagnosticsOpen(true)}
          >
            Run Engine Unit Tests
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveModule('timetable')}
          >
            Adjust Timetable
          </Button>
        </div>
      </div>

      {/* 2. Gap Metrics by Classification */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card elevated className="border-blush-border bg-ivory-paper">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-charcoal-muted block">
            Micro Breaks (5–15 min)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading font-extrabold text-2xl text-charcoal">{microCount}</span>
            <span className="text-xs text-charcoal-muted">occurrences</span>
          </div>
          <p className="text-[11px] text-charcoal-muted mt-1">
            Ideal for hydration, quick eye rests, and room transitions.
          </p>
        </Card>

        <Card elevated className="border-rose/30 bg-rose/10">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-rose block">
            Short Breaks (15–30 min)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading font-extrabold text-2xl text-charcoal">{shortCount}</span>
            <span className="text-xs text-charcoal-muted">occurrences</span>
          </div>
          <p className="text-[11px] text-charcoal-muted mt-1">
            Perfect for coffee walks, flashcards, or syllabus review.
          </p>
        </Card>

        <Card elevated className="border-gold/40 bg-gold/15">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-forest block">
            Medium Breaks (30–60 min)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading font-extrabold text-2xl text-charcoal">{mediumCount}</span>
            <span className="text-xs text-charcoal-muted">occurrences</span>
          </div>
          <p className="text-[11px] text-charcoal-muted mt-1">
            Nutritious light meals, reading chapters, and mindful reset.
          </p>
        </Card>

        <Card elevated className="border-forest/30 bg-forest-ultraLight">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-forest block">
            Long Blocks (60+ min)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading font-extrabold text-2xl text-forest">{longCount}</span>
            <span className="text-xs text-charcoal-muted">occurrences</span>
          </div>
          <p className="text-[11px] text-charcoal-muted mt-1">
            Deep library focus sprints, major lunch dining, or exercise.
          </p>
        </Card>
      </div>

      {/* 3. Engine Parameters Config Card */}
      <Card elevated className="p-6">
        <CardHeader className="pb-4">
          <CardTitle>Configurable Engine Parameters</CardTitle>
          <CardDescription>
            Tailor transit buffers and academic boundary hours to your physical campus dimensions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-2xl bg-ivory-paper border border-blush/80 space-y-1.5">
            <label className="text-xs font-heading font-semibold text-charcoal block">
              Walking Transit Buffer
            </label>
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-rose" />
              <select
                value={schedulerConfig.travelBufferMinutes}
                onChange={(e) => updateSchedulerConfig({ travelBufferMinutes: Number(e.target.value) })}
                className="w-full bg-white rounded-xl border border-blush p-2 text-xs font-medium text-charcoal focus:outline-none cursor-pointer"
              >
                <option value="0">0 minutes (Instant teleportation)</option>
                <option value="5">5 minutes (Close quad buildings)</option>
                <option value="10">10 minutes (Standard university campus)</option>
                <option value="15">15 minutes (Sprawling/cross-campus transit)</option>
              </select>
            </div>
            <p className="text-[10px] text-charcoal-muted">
              Deducted from gross gap times to preserve actual usable focus minutes.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-ivory-paper border border-blush/80 space-y-1.5">
            <label className="text-xs font-heading font-semibold text-charcoal block">
              Student Day Span
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-charcoal-muted block">Start Hour</span>
                <select
                  value={schedulerConfig.dayStartHour}
                  onChange={(e) => updateSchedulerConfig({ dayStartHour: Number(e.target.value) })}
                  className="w-full bg-white rounded-xl border border-blush p-1.5 text-xs font-medium text-charcoal focus:outline-none cursor-pointer"
                >
                  <option value="7">7:00 AM</option>
                  <option value="8">8:00 AM</option>
                  <option value="9">9:00 AM</option>
                </select>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-muted block">End Hour</span>
                <select
                  value={schedulerConfig.dayEndHour}
                  onChange={(e) => updateSchedulerConfig({ dayEndHour: Number(e.target.value) })}
                  className="w-full bg-white rounded-xl border border-blush p-1.5 text-xs font-medium text-charcoal focus:outline-none cursor-pointer"
                >
                  <option value="18">6:00 PM</option>
                  <option value="20">8:00 PM</option>
                  <option value="22">10:00 PM</option>
                </select>
              </div>
            </div>
            <p className="text-[10px] text-charcoal-muted">
              Used when calculating day-boundary morning and evening free windows.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-ivory-paper border border-blush/80 space-y-1.5">
            <label className="text-xs font-heading font-semibold text-charcoal block">
              Boundary Calculations
            </label>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="boundary-checkbox"
                checked={schedulerConfig.includeDayBoundaries}
                onChange={(e) => updateSchedulerConfig({ includeDayBoundaries: e.target.checked })}
                className="w-4 h-4 rounded text-forest accent-forest cursor-pointer"
              />
              <label htmlFor="boundary-checkbox" className="text-xs text-charcoal font-medium cursor-pointer">
                Include Morning & Evening Free Blocks
              </label>
            </div>
            <p className="text-[10px] text-charcoal-muted pt-1">
              When checked, includes free windows before your first class and after your last class.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Complete Weekday Gap Breakdown */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-lg text-forest">
          Weekly Free Periods Catalog (Monday – Saturday)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WEEKDAYS.map((day) => {
            const gaps = getGapsForDay(day).filter((g) => !g.isDayBoundary);
            const classes = getClassesForDay(day);

            return (
              <div
                key={day}
                className="rounded-2xl border border-blush/80 bg-white p-5 shadow-soft-sm space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-blush/50">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-base text-charcoal capitalize">
                      {WEEKDAY_LABELS[day]}
                    </span>
                    <Badge variant="forest" size="sm">
                      {classes.length} {classes.length === 1 ? 'class' : 'classes'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-charcoal-muted hover:text-forest"
                    onClick={() => {
                      setSelectedDay(day);
                      setViewMode('daily');
                      setActiveModule('timetable');
                    }}
                  >
                    View in Day Grid ➔
                  </Button>
                </div>

                {gaps.length === 0 ? (
                  <p className="text-xs text-charcoal-muted italic py-3">
                    {classes.length === 0
                      ? 'No classes scheduled on this day.'
                      : 'Classes on this day are contiguous with no open gaps.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {gaps.map((gap) => (
                      <div
                        key={gap.id}
                        className="p-3 rounded-xl border border-gold/40 bg-gold/10 text-xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-heading font-bold text-forest">
                            <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
                            <span>
                              {gap.startTime} – {gap.endTime} ({gap.rawDurationMinutes} mins)
                            </span>
                          </div>
                          <p className="text-[11px] text-charcoal-muted mt-0.5">
                            {gap.usableDurationMinutes}m usable • {gap.classification} break
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-charcoal px-2 py-0.5 rounded-full bg-white border border-blush">
                          {gap.recommendedActivities[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
