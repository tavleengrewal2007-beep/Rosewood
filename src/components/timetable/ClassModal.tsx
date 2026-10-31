import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { AcademicClass, ClassColorToken, WEEKDAYS, WEEKDAY_LABELS, Weekday } from '../../types/timetable';
import { timeToMinutes, formatDuration, validateClassTimes } from '../../services/gapEngine/schedulingEngine';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Copy, Trash2, Clock, Check, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const COLOR_OPTIONS: { token: ClassColorToken; label: string; previewClass: string }[] = [
  { token: 'forest', label: 'Deep Forest', previewClass: 'bg-forest text-ivory border-forest' },
  { token: 'rose', label: 'Dusty Rose', previewClass: 'bg-rose text-white border-rose' },
  { token: 'gold', label: 'Muted Gold', previewClass: 'bg-gold text-forest border-gold' },
  { token: 'blush', label: 'Blush Beige', previewClass: 'bg-blush text-charcoal border-blush-border' },
  { token: 'slate', label: 'Charcoal Slate', previewClass: 'bg-charcoal text-ivory border-charcoal' },
];

export const ClassModal: React.FC = () => {
  const {
    isClassModalOpen,
    setIsClassModalOpen,
    editingClass,
    addClass,
    editClass,
    deleteClass,
    duplicateClass,
    selectedDay,
  } = useTimetable();

  const [subject, setSubject] = useState('');
  const [code, setCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [location, setLocation] = useState('');
  const [days, setDays] = useState<Weekday[]>([selectedDay]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:20');
  const [color, setColor] = useState<ClassColorToken>('forest');
  const [isRecurring, setIsRecurring] = useState(true);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Populate form when editing or opening
  useEffect(() => {
    if (editingClass) {
      setSubject(editingClass.subject);
      setCode(editingClass.code);
      setProfessor(editingClass.professor || '');
      setLocation(editingClass.location || '');
      setDays(editingClass.days);
      setStartTime(editingClass.startTime);
      setEndTime(editingClass.endTime);
      setColor(editingClass.color);
      setIsRecurring(editingClass.isRecurring ?? true);
      setNotes(editingClass.notes || '');
      setFormError(null);
    } else {
      setSubject('');
      setCode('');
      setProfessor('');
      setLocation('');
      setDays([selectedDay]);
      setStartTime('10:00');
      setEndTime('11:20');
      setColor('forest');
      setIsRecurring(true);
      setNotes('');
      setFormError(null);
    }
  }, [editingClass, isClassModalOpen, selectedDay]);

  const toggleDay = (day: Weekday) => {
    setDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev // keep at least 1 day
        : [...prev, day]
    );
  };

  const durationMinutes = Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateClassTimes(startTime, endTime);
    if (!validation.isValid) {
      setFormError(validation.error || 'Invalid time interval');
      return;
    }

    if (!subject.trim()) {
      setFormError('Please enter a subject name.');
      return;
    }

    if (days.length === 0) {
      setFormError('Please assign at least one weekday.');
      return;
    }

    if (editingClass) {
      const res = editClass(editingClass.id, {
        subject: subject.trim(),
        code: code.trim() || 'CLASS',
        professor: professor.trim(),
        location: location.trim(),
        days,
        startTime,
        endTime,
        color,
        isRecurring,
        notes: notes.trim(),
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to update class.');
        return;
      }
    } else {
      const res = addClass({
        subject: subject.trim(),
        code: code.trim() || 'CLASS',
        professor: professor.trim(),
        location: location.trim(),
        days,
        startTime,
        endTime,
        color,
        isRecurring,
        notes: notes.trim(),
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to create class.');
        return;
      }
    }

    setIsClassModalOpen(false);
  };

  const handleDelete = () => {
    if (!editingClass) return;
    deleteClass(editingClass.id);
    setIsClassModalOpen(false);
  };

  const handleDuplicate = () => {
    if (!editingClass) return;
    duplicateClass(editingClass.id);
    setIsClassModalOpen(false);
  };

  return (
    <Modal
      isOpen={isClassModalOpen}
      onClose={() => setIsClassModalOpen(false)}
      title={editingClass ? 'Edit Academic Class' : 'Schedule New Class'}
      description="Configure lecture times, room venues, professor details, and recurring weekly schedule."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {formError && (
          <div className="p-3 rounded-xl border border-rose/30 bg-rose/10 flex items-center gap-2 text-xs text-rose font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Row 1: Code & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <Input
              label="Course Code *"
              placeholder="e.g. CS 161"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Subject Title *"
              placeholder="e.g. Design & Analysis of Algorithms"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Row 2: Professor & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Professor / Instructor"
            placeholder="e.g. Prof. Dan Boneh"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
          />
          <Input
            label="Classroom Location"
            placeholder="e.g. Gates CS, Room B01"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Row 3: Weekdays Multi-selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-heading font-medium text-charcoal">
            Assigned Weekdays *
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {WEEKDAYS.map((day) => {
              const isChecked = days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'py-2 px-2 rounded-xl text-xs font-heading font-semibold capitalize border transition-all text-center cursor-pointer',
                    isChecked
                      ? 'bg-forest text-ivory border-forest shadow-soft'
                      : 'border-blush bg-white text-charcoal hover:bg-blush/30'
                  )}
                >
                  {WEEKDAY_LABELS[day].slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 4: Times & Duration Counter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Input
            label="Start Time *"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
          <Input
            label="End Time *"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
          <div className="p-2.5 rounded-xl bg-ivory-paper border border-blush/80 flex items-center justify-between text-xs">
            <span className="text-charcoal-muted flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-forest" /> Duration:
            </span>
            <span className="font-heading font-bold text-forest">
              {formatDuration(durationMinutes)}
            </span>
          </div>
        </div>

        {/* Row 5: Color Palette Picker */}
        <div className="space-y-1.5">
          <label className="block text-xs font-heading font-medium text-charcoal">
            Class Color Palette
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((col) => {
              const isSelected = color === col.token;
              return (
                <button
                  key={col.token}
                  type="button"
                  onClick={() => setColor(col.token)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl border text-xs font-heading font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                    col.previewClass,
                    isSelected ? 'ring-2 ring-forest/40 ring-offset-1 scale-105' : 'opacity-85 hover:opacity-100'
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{col.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 6: Recurrence & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-blush/70 bg-ivory-paper">
            <input
              type="checkbox"
              id="recurring-check"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded text-forest accent-forest cursor-pointer"
            />
            <label htmlFor="recurring-check" className="text-xs font-heading font-medium text-charcoal cursor-pointer">
              Repeats weekly through academic term
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="text"
              placeholder="Syllabus notes or reminder..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-blush bg-white px-3.5 py-2.5 text-xs text-charcoal placeholder:text-charcoal-faded focus:border-forest focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-blush/80">
          <div>
            {editingClass && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  onClick={handleDuplicate}
                >
                  Duplicate
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose hover:bg-rose/10 hover:text-rose-hover"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsClassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingClass ? 'Save Changes' : 'Add to Timetable'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
