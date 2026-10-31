import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  Leaf,
  ArrowLeft,
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useTimetable } from '../../context/TimetableContext';
import { ModuleId, NavItem } from '../../types/navigation';
import { cn } from '../../utils/cn';

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', iconName: 'LayoutDashboard' },
  { id: 'timetable', label: 'Smart Timetable', iconName: 'Calendar' },
  { id: 'gaps', label: 'Gap Detection', iconName: 'Sparkles', badge: 'Auto', badgeVariant: 'forest' },
  { id: 'meals', label: 'Meal Planner', iconName: 'UtensilsCrossed' },
  { id: 'breaks', label: 'Break Planner', iconName: 'Coffee' },
  { id: 'goals', label: 'Daily Goals', iconName: 'CheckSquare', badge: 3, badgeVariant: 'rose' },
  { id: 'insights', label: 'Productivity Insights', iconName: 'BarChart3' },
  { id: 'notifications', label: 'Notifications', iconName: 'Bell', badge: 2, badgeVariant: 'gold' },
  { id: 'settings', label: 'Settings', iconName: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule, setIsMobileDrawerOpen, setViewMode } = useNavigation();
  const { weeklyConflicts } = useTimetable();

  const handleSelect = (id: ModuleId) => {
    setActiveModule(id);
    setIsMobileDrawerOpen(false);
  };

  const renderIcon = (name: string, className: string) => {
    const iconProps = { className, strokeWidth: 1.75 };
    switch (name) {
      case 'LayoutDashboard': return <LayoutDashboard {...iconProps} />;
      case 'Calendar': return <Calendar {...iconProps} />;
      case 'Sparkles': return <Sparkles {...iconProps} />;
      case 'UtensilsCrossed': return <UtensilsCrossed {...iconProps} />;
      case 'Coffee': return <Coffee {...iconProps} />;
      case 'CheckSquare': return <CheckSquare {...iconProps} />;
      case 'BarChart3': return <BarChart3 {...iconProps} />;
      case 'Bell': return <Bell {...iconProps} />;
      case 'Settings': return <Settings {...iconProps} />;
      default: return <Sparkles {...iconProps} />;
    }
  };

  return (
    <aside className="w-64 shrink-0 border-r border-blush/80 bg-ivory-paper flex flex-col justify-between min-h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-blush/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center text-ivory shadow-soft">
              <Leaf className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <span className="font-heading font-extrabold text-base tracking-wider text-forest block uppercase">
                Rosewood
              </span>
              <span className="text-[10px] text-charcoal-muted tracking-tight block">
                Make time for what matters
              </span>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="p-4 space-y-1">
          <div className="px-3 pb-2 pt-1 text-[11px] font-heading font-semibold text-charcoal-faded uppercase tracking-widest">
            Academic & Lifestyle
          </div>

          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            const hasConflictWarning = item.id === 'timetable' && weeklyConflicts.length > 0;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 text-left cursor-pointer',
                  isActive
                    ? 'bg-forest text-ivory shadow-soft font-semibold'
                    : 'text-charcoal-muted hover:text-forest hover:bg-blush/40'
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  {renderIcon(
                    item.iconName,
                    cn('w-4 h-4 shrink-0', isActive ? 'text-ivory' : 'text-charcoal-muted')
                  )}
                  <span className="tracking-tight truncate">{item.label}</span>
                </div>

                {hasConflictWarning ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-rose/20 text-rose border border-rose/30">
                    !
                  </span>
                ) : item.badge ? (
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                      isActive
                        ? 'bg-ivory/20 text-ivory'
                        : item.badgeVariant === 'rose'
                        ? 'bg-rose/15 text-rose'
                        : item.badgeVariant === 'gold'
                        ? 'bg-gold/25 text-charcoal'
                        : 'bg-forest/10 text-forest'
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Landing page link */}
      <div className="p-4 border-t border-blush/60 space-y-3">
        <button
          onClick={() => setViewMode('landing')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-charcoal-muted hover:text-forest hover:bg-blush/30 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing Page</span>
        </button>

        <div className="p-3 rounded-2xl bg-white border border-blush/70 shadow-soft-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose/20 text-rose font-heading font-bold text-sm flex items-center justify-center border border-rose/30 shrink-0">
            EL
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-charcoal truncate">Elena Lin</p>
            <p className="text-[11px] text-charcoal-muted truncate">CS & Design • Stanford</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
