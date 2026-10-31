import React, { useState } from 'react';
import { UtensilsCrossed, Clock, MapPin, Footprints, Sparkles, Check } from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { WEEKDAYS, Weekday } from '../../types/timetable';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const SmartMealCard: React.FC = () => {
  const { getGapsForDay } = useTimetable();
  const [isPlanned, setIsPlanned] = useState(false);

  const todayIndex = new Date().getDay();
  const currentWeekday: Weekday =
    todayIndex === 0 ? 'monday' : (WEEKDAYS[todayIndex - 1] || 'monday');

  const todayGaps = getGapsForDay(currentWeekday).filter((g) => !g.isDayBoundary);
  // Find a midday gap (between 11:30 and 14:30) or the largest available gap
  const lunchGap = todayGaps.find((g) => g.rawDurationMinutes >= 30) || todayGaps[0];

  const mealTime = lunchGap ? `${lunchGap.startTime} – ${lunchGap.endTime}` : '12:30 – 13:15';
  const duration = lunchGap ? lunchGap.usableDurationMinutes : 45;

  return (
    <Card elevated className="border-gold/40 bg-gradient-to-br from-white via-white to-gold/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gold/25 text-charcoal flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-forest" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Smart Meal Window</CardTitle>
              <span className="text-[11px] text-charcoal-muted font-medium">
                Context-aware dining recommendation
              </span>
            </div>
          </div>
          <Badge variant={isPlanned ? 'forest' : 'gold'} size="sm">
            {isPlanned ? 'Planned in Rhythm' : 'Suggested Slot'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5">
        <div>
          <h4 className="font-heading font-bold text-base text-forest">
            Warm Quinoa Harvest Bowl & Citrus Tea
          </h4>
          <p className="text-xs text-charcoal-muted flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-rose shrink-0" />
            The Oval Courtyard Cafe • Tresidder Union, 2nd Floor
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-ivory-paper border border-blush/60">
            <span className="text-[10px] text-charcoal-muted block font-medium">Window & Duration</span>
            <span className="font-heading font-semibold text-charcoal flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-forest" />
              {mealTime} ({duration}m)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-ivory-paper border border-blush/60">
            <span className="text-[10px] text-charcoal-muted block font-medium">Transit & Queue</span>
            <span className="font-heading font-semibold text-charcoal flex items-center gap-1 mt-0.5">
              <Footprints className="w-3.5 h-3.5 text-rose" />
              6 min walk • Low Rush
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gold/15 border border-gold/30 text-xs text-charcoal-muted leading-relaxed">
          <strong className="text-forest block mb-0.5 font-heading font-semibold">
            Why this time?
          </strong>
          {lunchGap ? (
            <span>
              Engine detected an optimal <strong>{lunchGap.rawDurationMinutes}m free period</strong> between your morning and afternoon lectures.
              Accounts for walking transit buffer without rushing your digestion.
            </span>
          ) : (
            <span>
              Configured around your daily academic rhythm to ensure consistent nutrition and sustained cognitive energy.
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Button
          variant={isPlanned ? 'outline' : 'gold'}
          size="sm"
          className="w-full"
          leftIcon={isPlanned ? <Check className="w-4 h-4 text-forest" /> : <Sparkles className="w-4 h-4" />}
          onClick={() => setIsPlanned(!isPlanned)}
        >
          {isPlanned ? 'Planned in Today’s Rhythm' : 'Accept Suggested Meal Window'}
        </Button>
      </CardFooter>
    </Card>
  );
};
