import React, { useState, useRef, useEffect } from 'react';
import { Menu, Clock, Sparkles, Plus, Bell, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useTimetable } from '../../context/TimetableContext';
import { navItems } from './Sidebar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { WEEKDAYS, Weekday } from '../../types/timetable';
import { formatTime12h, timeToMinutes } from '../../services/gapEngine/schedulingEngine';
import { cn } from '../../utils/cn';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'gap' | 'conflict' | 'class';
}

export const Header: React.FC = () => {
  const { activeModule, toggleMobileDrawer, setViewMode } = useNavigation();
  const { openCreateModal, getGapsForDay, weeklyConflicts, selectedDay } = useTimetable();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Today's day index
  const todayIndex = new Date().getDay();
  const currentWeekday: Weekday =
    todayIndex === 0 ? 'monday' : (WEEKDAYS[todayIndex - 1] || 'monday');

  // Gaps today
  const todayGaps = getGapsForDay(currentWeekday).filter((g) => !g.isDayBoundary);
  const nextGap = todayGaps[0];

  // Dynamic Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const currentModuleTitle =
    navItems.find((n) => n.id === activeModule)?.label || 'Overview';

  // Live Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Midday Free Window Detected',
      message: '1h 45m gap detected between morning and afternoon lectures.',
      time: '10m ago',
      read: false,
      type: 'gap',
    },
    {
      id: 'notif-2',
      title: 'Nutrition Window Suggested',
      message: 'Oval Courtyard Cafe has low lines right now.',
      time: '30m ago',
      read: false,
      type: 'class',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length + (weeklyConflicts.length > 0 ? 1 : 0);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="h-20 bg-ivory-paper/90 backdrop-blur-md border-b border-blush/70 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & Contextual Heading */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileDrawer}
          className="lg:hidden p-2 rounded-xl text-charcoal hover:bg-blush/40 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-lg sm:text-xl text-forest tracking-tight">
              {currentModuleTitle}
            </h1>
            <Badge variant="gold" size="sm">Stanford Term 2</Badge>
          </div>
          <p className="text-xs text-charcoal-muted hidden sm:block">
            {getGreeting()}, Elena • {formattedDate}
          </p>
        </div>
      </div>

      {/* Right: Gap Indicator, Notification popover & Quick Action */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Real-time Free Period Pill */}
        {nextGap ? (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-ultraLight border border-forest/15">
            <Clock className="w-3.5 h-3.5 text-forest" />
            <span className="text-xs font-medium text-forest">
              Free from <strong>{nextGap.startTime}</strong> ({nextGap.rawDurationMinutes}m gap)
            </span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blush/30 border border-blush">
            <Sparkles className="w-3.5 h-3.5 text-charcoal-muted" />
            <span className="text-xs font-medium text-charcoal-muted">
              Timetable Synced
            </span>
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="View notifications"
            className="relative p-2.5 rounded-xl border border-blush bg-white text-charcoal-muted hover:text-forest hover:bg-blush/30 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose text-white text-[10px] font-bold flex items-center justify-center shadow-soft">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-blush/90 shadow-modal p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-blush/60">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-semibold text-sm text-charcoal">
                    Notification Center
                  </span>
                  {unreadCount > 0 && (
                    <Badge variant="rose" size="sm">{unreadCount} new</Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-charcoal-muted hover:text-forest font-medium cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                {weeklyConflicts.length > 0 && (
                  <div className="p-2.5 rounded-xl border border-rose/30 bg-rose/10 text-xs">
                    <div className="flex items-center gap-1.5 font-heading font-semibold text-rose">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Class Schedule Conflict</span>
                    </div>
                    <p className="text-charcoal-muted mt-1 leading-relaxed">
                      {weeklyConflicts.length} overlap(s) need attention in your weekly timetable.
                    </p>
                  </div>
                )}

                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                      );
                    }}
                    className={cn(
                      'p-2.5 rounded-xl border transition-all cursor-pointer text-left',
                      n.read
                        ? 'border-transparent bg-ivory/50 opacity-60'
                        : 'border-blush/80 bg-ivory-paper shadow-soft-sm'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-semibold text-xs text-charcoal">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-charcoal-muted">{n.time}</span>
                    </div>
                    <p className="text-xs text-charcoal-muted mt-1 leading-snug">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Class Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => openCreateModal(selectedDay)}
        >
          <span className="hidden sm:inline">Add</span> Class
        </Button>
      </div>
    </header>
  );
};
