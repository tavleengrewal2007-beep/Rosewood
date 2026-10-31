import React from 'react';
import { LayoutDashboard, Calendar, Sparkles, CheckSquare, MoreHorizontal, X, Leaf, ArrowLeft } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { navItems } from './Sidebar';
import { cn } from '../../utils/cn';

export const MobileNav: React.FC = () => {
  const { activeModule, setActiveModule, isMobileDrawerOpen, setIsMobileDrawerOpen, setViewMode } = useNavigation();

  return (
    <>
      {/* Bottom Sticky Tab Bar for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-blush/80 px-2 py-2 flex items-center justify-around shadow-soft-lg">
        <button
          onClick={() => setActiveModule('dashboard')}
          className={cn(
            'flex flex-col items-center py-1 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer',
            activeModule === 'dashboard' ? 'text-forest font-semibold' : 'text-charcoal-muted'
          )}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" strokeWidth={activeModule === 'dashboard' ? 2 : 1.75} />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveModule('timetable')}
          className={cn(
            'flex flex-col items-center py-1 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer',
            activeModule === 'timetable' ? 'text-forest font-semibold' : 'text-charcoal-muted'
          )}
        >
          <Calendar className="w-5 h-5 mb-0.5" strokeWidth={activeModule === 'timetable' ? 2 : 1.75} />
          <span>Timetable</span>
        </button>

        <button
          onClick={() => setActiveModule('gaps')}
          className={cn(
            'flex flex-col items-center py-1 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer',
            activeModule === 'gaps' ? 'text-forest font-semibold' : 'text-charcoal-muted'
          )}
        >
          <Sparkles className="w-5 h-5 mb-0.5" strokeWidth={activeModule === 'gaps' ? 2 : 1.75} />
          <span>Gaps</span>
        </button>

        <button
          onClick={() => setActiveModule('goals')}
          className={cn(
            'flex flex-col items-center py-1 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer',
            activeModule === 'goals' ? 'text-forest font-semibold' : 'text-charcoal-muted'
          )}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" strokeWidth={activeModule === 'goals' ? 2 : 1.75} />
          <span>Goals</span>
        </button>

        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex flex-col items-center py-1 px-3 rounded-xl text-xs font-medium text-charcoal-muted cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" strokeWidth={1.75} />
          <span>More</span>
        </button>
      </nav>

      {/* Slide-out Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-forest/40 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-ivory-paper h-full p-6 flex flex-col justify-between shadow-modal z-10 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-blush/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-forest text-ivory flex items-center justify-center">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <span className="font-heading font-bold text-forest">ROSEWOOD</span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-charcoal-muted hover:bg-blush/40 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer',
                      activeModule === item.id
                        ? 'bg-forest text-ivory font-semibold'
                        : 'text-charcoal-muted hover:bg-blush/40'
                    )}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blush/40 text-charcoal">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-blush/80 space-y-3">
              <button
                onClick={() => {
                  setViewMode('landing');
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full flex items-center gap-2 text-xs font-medium text-forest hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Landing Page</span>
              </button>
              <div className="text-xs text-charcoal-faded text-center">
                Make time for what matters.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
