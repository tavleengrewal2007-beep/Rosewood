import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { useNavigation } from '../../context/NavigationContext';
import { WEEKDAYS, Weekday } from '../../types/timetable';
import { timeToMinutes } from '../../services/gapEngine/schedulingEngine';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const NextFreePeriodCard: React.FC = () => {
  const { getGapsForDay, setSelectedDay, setViewMode: setTimetableViewMode } = useTimetable();
  const { setActiveModule } = useNavigation();

  const todayIndex = new Date().getDay();
  const currentWeekday: Weekday =
    todayIndex === 0 ? 'monday' : (WEEKDAYS[todayIndex - 1] || 'monday');

  const todayGaps = getGapsForDay(currentWeekday).filter((g) => !g.isDayBoundary);
  const primaryGap = todayGaps[0];

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let startsInText = 'Midday Window';
  if (primaryGap) {
    const diff = timeToMinutes(primaryGap.startTime) - nowMinutes;
    if (diff > 0) {
      startsInText = `Starts in ${diff}m`;
    } else if (nowMinutes <= timeToMinutes(primaryGap.endTime)) {
      startsInText = 'Active Right Now';
    } else {
      startsInText = 'Scheduled Today';
    }
  }

  const handleExplore = () => {
    setSelectedDay(currentWeekday);
    setTimetableViewMode('daily');
    setActiveModule('timetable');
  };

  return (
    <Card elevated className="border-forest/20 bg-forest text-ivory">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-ivory/15 text-gold flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-ivory text-base sm:text-lg">
                Next Free Period
              </CardTitle>
              <span className="text-[11px] text-ivory/70">
                Automated academic gap detection
              </span>
            </div>
          </div>
          <Badge variant="gold" size="sm">
            {startsInText}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-ivory/70 block">Time Slot</span>
            <span className="font-heading font-bold text-2xl text-ivory">
              {primaryGap ? `${primaryGap.startTime} – ${primaryGap.endTime}` : 'No upcoming gap'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-ivory/70 block">Available Block</span>
            <span className="font-heading font-extrabold text-2xl text-gold">
              {primaryGap ? `${primaryGap.rawDurationMinutes} mins` : '—'}
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-1 border-t border-ivory/15">
          <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold block">
            Recommended Micro-Activities
          </span>
          <ul className="space-y-1.5 text-xs text-ivory/90">
            {primaryGap ? (
              primaryGap.recommendedActivities.map((act, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>{act}</span>
                </li>
              ))
            ) : (
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>Rest & mental clarity block</span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-ivory/15">
        <Button
          variant="gold"
          size="sm"
          className="w-full"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={handleExplore}
        >
          Explore Gap in Timetable
        </Button>
      </CardFooter>
    </Card>
  );
};
