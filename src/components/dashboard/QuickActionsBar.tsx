import React from 'react';
import { PlusCircle, Calendar, Sparkles, Coffee, ShieldCheck } from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { useNavigation } from '../../context/NavigationContext';
import { Button } from '../ui/Button';

export const QuickActionsBar: React.FC = () => {
  const { openCreateModal, setIsDiagnosticsOpen, selectedDay } = useTimetable();
  const { setActiveModule } = useNavigation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-blush/80 shadow-soft-sm">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-xs font-heading font-semibold text-charcoal uppercase tracking-wider mr-1">
          Quick Actions:
        </span>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4 text-forest" />}
          onClick={() => openCreateModal(selectedDay)}
        >
          Add Class
        </Button>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Calendar className="w-4 h-4 text-forest" />}
          onClick={() => setActiveModule('timetable')}
        >
          Manage Timetable
        </Button>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Sparkles className="w-4 h-4 text-gold" />}
          onClick={() => setActiveModule('gaps')}
        >
          Scan Free Gaps
        </Button>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Coffee className="w-4 h-4 text-rose" />}
          onClick={() => setActiveModule('breaks')}
        >
          Plan Break
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ShieldCheck className="w-4 h-4 text-forest" />}
        onClick={() => setIsDiagnosticsOpen(true)}
        className="text-xs text-charcoal-muted hover:text-forest"
      >
        Audit Engine (Unit Tests)
      </Button>
    </div>
  );
};
