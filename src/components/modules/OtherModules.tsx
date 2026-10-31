import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Coffee,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  Sparkles,
  MapPin,
  Clock,
  Check,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useTimetable } from '../../context/TimetableContext';
import { formatDuration } from '../../services/gapEngine/schedulingEngine';

export const MealsModule: React.FC = () => {
  const [plannedId, setPlannedId] = useState<string | null>('m1');

  const mealOptions = [
    {
      id: 'm1',
      title: 'Warm Quinoa Harvest Bowl',
      location: 'The Oval Courtyard Cafe (Tresidder 2nd Floor)',
      suggestedWindow: '12:45 – 13:30 (45m)',
      walkTime: '6 min walk',
      queue: 'Low Rush',
      nutrition: 'High Protein • Mediterranean',
      reason: 'Perfect fit for your 1h 45m midday gap between morning lectures.',
    },
    {
      id: 'm2',
      title: 'Handcrafted Sourdough Panini & Matcha',
      location: 'CoHo Stanford Coffee House',
      suggestedWindow: '13:00 – 13:40 (40m)',
      walkTime: '8 min walk',
      queue: 'Moderate Rush',
      nutrition: 'Artisanal • Sustained Energy',
      reason: 'Quiet indoor garden patio ideal for reading seminar notes.',
    },
    {
      id: 'm3',
      title: 'Macrobiotic Salmon Bento',
      location: 'Olives Gourmet at Main Quad',
      suggestedWindow: '12:15 – 13:00 (45m)',
      walkTime: '3 min walk',
      queue: 'Fast Grab & Go',
      nutrition: 'Omega-3 • Brain Fuel',
      reason: 'Directly adjacent to Gates Computer Science building.',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-3xl border border-blush/80 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-forest">Smart Meal Planner</h2>
            <Badge variant="gold" size="sm">Nutrition Windows</Badge>
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            Recommends balanced dining windows aligned with free periods so you never skip meals between classes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mealOptions.map((opt) => (
          <Card key={opt.id} elevated className="p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={plannedId === opt.id ? 'forest' : 'gold'} size="sm">
                  {plannedId === opt.id ? 'Selected Today' : opt.queue}
                </Badge>
                <span className="text-xs font-semibold text-charcoal-muted">{opt.walkTime}</span>
              </div>
              <h3 className="font-heading font-bold text-lg text-charcoal">{opt.title}</h3>
              <p className="text-xs text-charcoal-muted flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose shrink-0" />
                {opt.location}
              </p>
              <div className="p-2.5 rounded-xl bg-ivory-paper border border-blush/70 text-xs text-charcoal font-medium">
                <Clock className="w-3.5 h-3.5 text-forest inline mr-1" />
                {opt.suggestedWindow}
              </div>
              <p className="text-xs text-charcoal-muted pt-1 leading-relaxed">
                {opt.reason}
              </p>
            </div>

            <Button
              variant={plannedId === opt.id ? 'outline' : 'primary'}
              size="sm"
              className="w-full mt-4"
              onClick={() => setPlannedId(opt.id)}
            >
              {plannedId === opt.id ? 'Scheduled in Routine' : 'Select Meal Window'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const BreaksModule: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-3xl border border-blush/80 shadow-soft-sm flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-forest">Mindful Break Planner</h2>
          <p className="text-xs text-charcoal-muted mt-1">
            Restores attention and mental clarity around cognitive fatigue thresholds.
          </p>
        </div>
        <Badge variant="rose" size="sm">Circadian Calibration</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card elevated className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-forest-ultraLight text-forest flex items-center justify-center">
            <Coffee className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-charcoal">Campus Sunshine Stroll</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            15 minutes of outdoor natural sunlight at the Arizona Garden to reset adenosine receptors.
          </p>
          <Badge variant="forest" size="sm">Recommended at 2:00 PM</Badge>
        </Card>

        <Card elevated className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-gold/20 text-forest flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-charcoal">Box Breathing & Eye Rest</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            5-minute guided de-stress sequence to release visual strain after screen-heavy coding lectures.
          </p>
          <Badge variant="gold" size="sm">Micro Break (5m)</Badge>
        </Card>

        <Card elevated className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-rose/15 text-rose flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-charcoal">Hydration & Desk Reset</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Refill electrolyte water bottle and organize lecture notebooks before the next laboratory session.
          </p>
          <Badge variant="rose" size="sm">Daily Habit</Badge>
        </Card>
      </div>
    </div>
  );
};

export const GoalsModule: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-3xl border border-blush/80 shadow-soft-sm">
        <h2 className="font-heading font-extrabold text-2xl text-forest">Academic & Lifestyle Goals</h2>
        <p className="text-xs text-charcoal-muted mt-1">
          Keep your term deliverables, assignments, and wellness commitments prioritized.
        </p>
      </div>
      <Card elevated className="p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest mx-auto flex items-center justify-center">
          <CheckSquare className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-lg text-charcoal">Integrated Task Tracker</h3>
        <p className="text-xs text-charcoal-muted max-w-md mx-auto">
          Manage your daily goals directly on the Dashboard, where goals dynamically interact with detected class gaps.
        </p>
      </Card>
    </div>
  );
};

export const InsightsModule: React.FC = () => {
  const { classes } = useTimetable();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-3xl border border-blush/80 shadow-soft-sm">
        <h2 className="font-heading font-extrabold text-2xl text-forest">Productivity Insights</h2>
        <p className="text-xs text-charcoal-muted mt-1">
          Analytics on lecture attendance, study gaps, meal regularity, and weekly academic equilibrium.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card elevated className="p-6 text-center space-y-2">
          <span className="text-xs text-charcoal-muted font-medium">Weekly Academic Hours</span>
          <p className="font-heading font-extrabold text-3xl text-forest">16.5h</p>
          <span className="text-[11px] text-charcoal-muted">Target: 15–20h teaching</span>
        </Card>

        <Card elevated className="p-6 text-center space-y-2">
          <span className="text-xs text-charcoal-muted font-medium">Synthesized Free Gaps</span>
          <p className="font-heading font-extrabold text-3xl text-gold">14.2h</p>
          <span className="text-[11px] text-forest font-semibold">Available for deep study & meals</span>
        </Card>

        <Card elevated className="p-6 text-center space-y-2">
          <span className="text-xs text-charcoal-muted font-medium">Meal Consistency Score</span>
          <p className="font-heading font-extrabold text-3xl text-rose">94%</p>
          <span className="text-[11px] text-charcoal-muted">Optimal midday windows maintained</span>
        </Card>
      </div>
    </div>
  );
};

export const NotificationsModule: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-3xl border border-blush/80 shadow-soft-sm">
        <h2 className="font-heading font-extrabold text-2xl text-forest">Notification Center</h2>
        <p className="text-xs text-charcoal-muted mt-1">
          Configure real-time transition reminders, gap warnings, and hydration nudges.
        </p>
      </div>

      <Card elevated className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-blush/60">
          <div>
            <span className="font-heading font-semibold text-sm text-charcoal block">
              15-minute Classroom Transition Alert
            </span>
            <span className="text-xs text-charcoal-muted">
              Receive a calm notification with room location before each lecture begins.
            </span>
          </div>
          <Badge variant="forest" size="sm">Enabled</Badge>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-blush/60">
          <div>
            <span className="font-heading font-semibold text-sm text-charcoal block">
              Gap Detection Summary
            </span>
            <span className="text-xs text-charcoal-muted">
              Daily morning breakdown of available free periods and optimal lunch window.
            </span>
          </div>
          <Badge variant="forest" size="sm">Enabled</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-heading font-semibold text-sm text-charcoal block">
              Schedule Overlap Warning
            </span>
            <span className="text-xs text-charcoal-muted">
              Instant alerts when adding intersecting lectures or discussions.
            </span>
          </div>
          <Badge variant="rose" size="sm">Active Guard</Badge>
        </div>
      </Card>
    </div>
  );
};

export const SettingsModule: React.FC = () => {
  const { resetToSampleTimetable, setIsDiagnosticsOpen } = useTimetable();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-3xl border border-blush/80 shadow-soft-sm">
        <h2 className="font-heading font-extrabold text-2xl text-forest">Settings & Preferences</h2>
        <p className="text-xs text-charcoal-muted mt-1">
          Manage local-first storage, Firebase integration readiness, and academic parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card elevated className="p-6 space-y-4">
          <CardTitle className="text-base">Persistence & Data</CardTitle>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Rosewood uses an offline-first localStorage architecture that cleanly mirrors Google Cloud Firestore documents.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetToSampleTimetable();
                alert('Sample Stanford timetable data has been refreshed!');
              }}
            >
              Reset to Sample Timetable
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDiagnosticsOpen(true)}
            >
              Run Engine Diagnostics
            </Button>
          </div>
        </Card>

        <Card elevated className="p-6 space-y-4">
          <CardTitle className="text-base">Student Profile</CardTitle>
          <div className="text-xs space-y-2 text-charcoal-muted">
            <div className="flex justify-between">
              <span>Full Name:</span>
              <strong className="text-charcoal">Elena Lin</strong>
            </div>
            <div className="flex justify-between">
              <span>Major:</span>
              <strong className="text-charcoal">Computer Science & Design</strong>
            </div>
            <div className="flex justify-between">
              <span>Institution:</span>
              <strong className="text-charcoal">Stanford University</strong>
            </div>
            <div className="flex justify-between">
              <span>Academic Term:</span>
              <strong className="text-charcoal">Term 2 (Spring)</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
