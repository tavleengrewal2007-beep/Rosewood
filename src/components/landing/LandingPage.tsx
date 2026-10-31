import React from 'react';
import {
  Leaf,
  ArrowRight,
  Sparkles,
  Calendar,
  UtensilsCrossed,
  Coffee,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Compass,
  Layers,
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { ProductMockup } from './ProductMockup';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const LandingPage: React.FC = () => {
  const { setViewMode, setActiveModule } = useNavigation();

  const handleLaunchDashboard = () => {
    setActiveModule('dashboard');
    setViewMode('app');
  };

  const handleLaunchTimetable = () => {
    setActiveModule('timetable');
    setViewMode('app');
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal font-sans selection:bg-rose/20 selection:text-forest">
      {/* 1. Global Editorial Navigation */}
      <nav className="sticky top-0 z-40 bg-ivory/85 backdrop-blur-md border-b border-blush/60 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-ivory shadow-soft">
              <Leaf className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg tracking-wider text-forest uppercase">
                ROSEWOOD
              </span>
              <span className="hidden sm:block text-[11px] text-charcoal-muted tracking-tight font-medium">
                Academic & Lifestyle Architecture
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-heading font-medium text-charcoal-muted">
            <a href="#preview" className="hover:text-forest transition-colors">
              Interface
            </a>
            <a href="#features" className="hover:text-forest transition-colors">
              Capabilities
            </a>
            <a href="#gap-engine" className="hover:text-forest transition-colors">
              Gap Engine
            </a>
            <a href="#how-it-works" className="hover:text-forest transition-colors">
              How It Works
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLaunchTimetable}
              className="hidden sm:inline-flex"
            >
              Timetable Grid
            </Button>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleLaunchDashboard}
            >
              Open Dashboard
            </Button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-32 px-6 sm:px-8 max-w-7xl mx-auto relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest/10 border border-forest/15">
            <Sparkles className="w-3.5 h-3.5 text-forest" />
            <span className="text-xs font-heading font-semibold text-forest uppercase tracking-wider">
              An Academic Sanity Engine
            </span>
          </div>

          <h1 className="font-heading font-extrabold text-4xl sm:text-6xl text-forest tracking-tight leading-[1.12]">
            Make time for <br className="hidden sm:inline" />
            <span className="text-rose italic font-serif font-normal">what matters.</span>
          </h1>

          <p className="text-base sm:text-xl text-charcoal-muted max-w-2xl mx-auto font-normal leading-relaxed">
            A thoughtful space to organize your classes, meals, breaks and everyday goals.
            Rosewood transforms the scattered college schedule into an intentional rhythm.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-soft-lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleLaunchDashboard}
            >
              Enter Student Workspace
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleLaunchTimetable}
            >
              Manage Academic Timetable
            </Button>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-charcoal-muted font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-forest" /> Automatic Gap Detection
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-forest" /> Monday–Saturday Weekly Grid
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-forest" /> Transit Buffers & Conflict Guard
            </span>
          </div>
        </div>

        {/* 3. Product Preview Interactive Card Showcase */}
        <div id="preview" className="mt-16 sm:mt-20">
          <ProductMockup
            onOpenDashboard={handleLaunchDashboard}
            onOpenTimetable={handleLaunchTimetable}
          />
        </div>
      </section>

      {/* 4. Feature Overview Grid */}
      <section id="features" className="py-20 sm:py-28 bg-blush-subtle/50 border-y border-blush/70">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mb-16">
            <Badge variant="forest" size="sm">CORE CAPABILITIES</Badge>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-forest mt-3 tracking-tight">
              Calibrated for the real realities of university life.
            </h2>
            <p className="text-charcoal-muted mt-3 text-base leading-relaxed">
              Standard corporate calendar tools don't understand erratic classroom buildings, irregular gap hours,
              and cognitive fatigue. Rosewood is engineered from the ground up for university scholars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Smart Timetable */}
            <div className="rounded-3xl bg-white border border-blush/80 p-8 shadow-soft-sm hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading font-semibold text-xl text-charcoal mb-2">
                Smart Academic Timetable
              </h3>
              <p className="text-sm text-charcoal-muted leading-relaxed">
                Daily and weekly Monday-to-Saturday calendar grids with geometric time positioning,
                custom colors, classroom venues, professor notes, and recurring sections.
              </p>
            </div>

            {/* Feature 2: Automatic Gap Detection */}
            <div id="gap-engine" className="rounded-3xl bg-white border border-blush/80 p-8 shadow-soft-sm hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gold/25 text-charcoal flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-forest" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading font-semibold text-xl text-charcoal mb-2">
                Automatic Gap Detection
              </h3>
              <p className="text-sm text-charcoal-muted leading-relaxed">
                An independent TypeScript scheduling engine that analyzes intervals between lectures,
                deducts campus travel buffers, and classifies free windows into micro, short, medium, and long breaks.
              </p>
            </div>

            {/* Feature 3: Smart Meal Planner */}
            <div className="rounded-3xl bg-white border border-blush/80 p-8 shadow-soft-sm hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose/15 text-rose flex items-center justify-center mb-6">
                <UtensilsCrossed className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading font-semibold text-xl text-charcoal mb-2">
                Intelligent Meal Windowing
              </h3>
              <p className="text-sm text-charcoal-muted leading-relaxed">
                Detects appropriate dining periods between classes with walking transit and cafeteria queue status
                factored into your daily rhythm so you never skip nourishing meals.
              </p>
            </div>

            {/* Feature 4: Break Planner */}
            <div className="rounded-3xl bg-white border border-blush/80 p-8 shadow-soft-sm hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center mb-6">
                <Coffee className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading font-semibold text-xl text-charcoal mb-2">
                Mindful Study Breaks
              </h3>
              <p className="text-sm text-charcoal-muted leading-relaxed">
                Cognitive stamina decays after sustained study. Receive non-intrusive prompts for campus strolls,
                hydration checks, and visual eye rests.
              </p>
            </div>

            {/* Feature 5: Daily Goals */}
            <div className="rounded-3xl bg-white border border-blush/80 p-8 shadow-soft-sm hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose/15 text-rose flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading font-semibold text-xl text-charcoal mb-2">
                Daily Goals & Micro-Tasks
              </h3>
              <p className="text-sm text-charcoal-muted leading-relaxed">
                Prioritize problem sets, readings, and thesis milestones alongside your class schedule
                with interactive completion tracking.
              </p>
            </div>

            {/* Feature 6: Conflict & Buffer Guard */}
            <div className="rounded-3xl bg-white border border-blush/80 p-8 shadow-soft-sm hover:shadow-soft transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-forest-ultraLight text-forest flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading font-semibold text-xl text-charcoal mb-2">
                Collision Guard & Test Suite
              </h3>
              <p className="text-sm text-charcoal-muted leading-relaxed">
                Detects overlapping class sections instantly and validates calculations with a built-in
                unit test runner for mathematical correctness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="gold" size="sm">THE WORKFLOW</Badge>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-forest mt-3 tracking-tight">
            How Rosewood brings calm to your university week.
          </h2>
          <p className="text-charcoal-muted mt-2 text-base">
            From fragmented class syllabi to intentional academic rhythm in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 p-6 rounded-2xl bg-white border border-blush/70 shadow-soft-sm">
            <span className="font-heading font-extrabold text-3xl text-forest/30">01</span>
            <h4 className="font-heading font-semibold text-lg text-charcoal">Add Your Classes</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Schedule lectures, discussions, and labs with times, room locations, and assigned weekdays.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-2xl bg-white border border-blush/70 shadow-soft-sm">
            <span className="font-heading font-extrabold text-3xl text-gold/50">02</span>
            <h4 className="font-heading font-semibold text-lg text-charcoal">Automatic Gap Synthesis</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              The engine scans chronological class intervals and deducts travel buffers to reveal usable free time.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-2xl bg-white border border-blush/70 shadow-soft-sm">
            <span className="font-heading font-extrabold text-3xl text-rose/40">03</span>
            <h4 className="font-heading font-semibold text-lg text-charcoal">Smart Meal & Break Match</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Accept recommended meal times and study breaks suited for each gap's length and campus location.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-2xl bg-white border border-blush/70 shadow-soft-sm">
            <span className="font-heading font-extrabold text-3xl text-forest/30">04</span>
            <h4 className="font-heading font-semibold text-lg text-charcoal">Live Student Dashboard</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Track your day with a real-time chronological timeline, upcoming class indicator, and goals progress.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Philosophy / Editorial Quote */}
      <section className="py-20 bg-forest text-ivory">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <Leaf className="w-8 h-8 text-gold mx-auto opacity-80" />
          <blockquote className="font-heading text-2xl sm:text-3xl font-light leading-relaxed tracking-tight text-ivory/95">
            "We believe students don't need another stress-inducing productivity tracker.
            They need a calm sanctuary that honors their natural energy, makes space for good meals,
            and turns scattered gaps into peaceful clarity."
          </blockquote>
          <div className="pt-2 text-xs uppercase tracking-widest text-gold font-medium font-heading">
            The Rosewood Academic Philosophy
          </div>
        </div>
      </section>

      {/* 7. Call To Action */}
      <section className="py-20 sm:py-28 px-6 sm:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl bg-white border border-blush p-10 sm:p-16 shadow-soft-lg space-y-6">
          <Badge variant="rose" size="md">START YOUR TERM WITH INTENTION</Badge>
          <h2 className="font-heading font-bold text-3xl sm:text-5xl text-forest tracking-tight">
            Ready to reclaim your semester?
          </h2>
          <p className="text-base text-charcoal-muted max-w-xl mx-auto leading-relaxed">
            Open the student workspace now. Experience your classes, meals, and free time
            seamlessly synchronized.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleLaunchDashboard}
            >
              Enter Rosewood Dashboard
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleLaunchTimetable}
            >
              Open Timetable Grid
            </Button>
          </div>
        </div>
      </section>

      {/* 8. Elegant Editorial Footer */}
      <footer className="border-t border-blush/80 bg-ivory-paper py-12 px-6 sm:px-8 text-xs text-charcoal-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-forest text-ivory flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <span className="font-heading font-bold text-sm text-forest uppercase tracking-wider">
              ROSEWOOD
            </span>
            <span className="text-charcoal-faded pl-2">
              © {new Date().getFullYear()} — Make time for what matters.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={handleLaunchDashboard}
              className="hover:text-forest transition-colors font-medium cursor-pointer"
            >
              Student Dashboard
            </button>
            <button
              onClick={handleLaunchTimetable}
              className="hover:text-forest transition-colors font-medium cursor-pointer"
            >
              Smart Timetable
            </button>
            <a href="#gap-engine" className="hover:text-forest transition-colors font-medium">
              Gap Detection
            </a>
            <span className="text-rose font-medium">Built for Higher Education</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
