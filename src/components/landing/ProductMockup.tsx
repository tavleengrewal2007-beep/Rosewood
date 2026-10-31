import React from 'react';
import { Sparkles, Clock, UtensilsCrossed, Calendar, CheckSquare, ArrowUpRight, Footprints } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const ProductMockup: React.FC<{ onOpenDashboard: () => void; onOpenTimetable: () => void }> = ({
  onOpenDashboard,
  onOpenTimetable,
}) => {
  return (
    <div className="rounded-3xl border border-blush/90 bg-white shadow-soft-lg overflow-hidden transition-all duration-300 hover:border-blush-border">
      {/* Editorial Mockup Window Bar */}
      <div className="bg-ivory-paper px-6 py-4 border-b border-blush/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose/40" />
          <span className="w-3 h-3 rounded-full bg-gold/50" />
          <span className="w-3 h-3 rounded-full bg-forest/30" />
          <span className="ml-3 text-xs font-heading font-medium text-charcoal-muted">
            ROSEWOOD Workspace • Timetable & Gap Engine Preview
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenTimetable}
            rightIcon={<Calendar className="w-3.5 h-3.5 text-forest" />}
            className="text-xs text-forest hover:bg-forest/10"
          >
            Open Timetable Grid
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDashboard}
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            className="text-xs text-forest hover:bg-forest/10"
          >
            Launch Dashboard
          </Button>
        </div>
      </div>

      {/* Mockup Body */}
      <div className="p-6 sm:p-8 bg-ivory/40 space-y-6">
        {/* Banner Preview */}
        <div className="rounded-2xl bg-forest p-6 sm:p-8 text-ivory flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="gold" size="sm">Tuesday Schedule</Badge>
              <span className="text-xs text-ivory/70">Stanford University • Term 2</span>
            </div>
            <h3 className="font-heading font-bold text-xl sm:text-2xl text-ivory">
              Good morning, Elena.
            </h3>
            <p className="text-xs sm:text-sm text-ivory/80 mt-1 max-w-lg leading-relaxed">
              Upcoming: <strong>CS 161 (Algorithms)</strong> at 09:00 AM. 
              Synthesized midday gap: <strong>1h 45m free window</strong> perfectly matched for lunch at Oval Courtyard.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="gold"
              size="sm"
              onClick={onOpenTimetable}
              className="shrink-0"
            >
              Explore Timetable
            </Button>
          </div>
        </div>

        {/* 3-Column Mini Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Timetable Flow */}
          <div className="rounded-2xl border border-blush/80 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-semibold text-charcoal">
                Smart Timetable
              </span>
              <Badge variant="forest" size="sm">Mon – Sat</Badge>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-forest-ultraLight border border-forest/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-forest">CS 161: Algorithms</div>
                  <div className="text-charcoal-muted text-[11px]">09:00 – 10:20 • Gates B01</div>
                </div>
                <Badge variant="forest" size="sm">Lecture</Badge>
              </div>
              <div className="p-2.5 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-forest">Detected Free Period</div>
                  <div className="text-charcoal-muted text-[11px]">10:20 – 11:45 (85m free)</div>
                </div>
                <Badge variant="gold" size="sm">Auto Gap</Badge>
              </div>
              <div className="p-2.5 rounded-xl bg-rose/10 border border-rose/20 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-charcoal">DES 204: Design Systems</div>
                  <div className="text-charcoal-muted text-[11px]">11:45 – 13:15 • d.school</div>
                </div>
                <Badge variant="rose" size="sm">Studio</Badge>
              </div>
            </div>
          </div>

          {/* Card 2: Automatic Gap Engine */}
          <div className="rounded-2xl border border-blush/80 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-semibold text-charcoal">
                Gap Detection Engine
              </span>
              <Badge variant="gold" size="sm">10m Buffer</Badge>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-gold/15 border border-gold/30">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-forest">Midday Rejuvenation</span>
                  <span className="text-[10px] uppercase font-bold text-charcoal-muted">Long Break</span>
                </div>
                <p className="text-[11px] text-charcoal-muted mt-1">
                  12:30 – 14:15 (105m gross, 95m usable)
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-charcoal font-medium">
                  <Footprints className="w-3 h-3 text-rose" /> 10m walk buffer to next classroom
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-ivory-paper border border-blush/60 text-charcoal-muted text-[11px]">
                Recommended: Nutritious sit-down meal + 20m reading sprint.
              </div>
            </div>
          </div>

          {/* Card 3: Daily Goals & Rhythm */}
          <div className="rounded-2xl border border-blush/80 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-semibold text-charcoal">
                Daily Focus & Goals
              </span>
              <Badge variant="rose" size="sm">2 of 4 Done</Badge>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-charcoal-muted line-through p-1.5 rounded-lg bg-ivory-paper">
                <CheckSquare className="w-3.5 h-3.5 text-forest shrink-0" />
                <span className="truncate">Submit CS 161 Dynamic Programming</span>
              </div>
              <div className="flex items-center gap-2 text-charcoal font-medium p-1.5 rounded-lg bg-white border border-blush/60">
                <div className="w-3.5 h-3.5 rounded border border-blush shrink-0" />
                <span className="truncate">Read 2 chapters Policy brief</span>
              </div>
              <div className="flex items-center gap-2 text-charcoal-muted line-through p-1.5 rounded-lg bg-ivory-paper">
                <CheckSquare className="w-3.5 h-3.5 text-forest shrink-0" />
                <span className="truncate">Hydration goal: 2.0 Liters</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
