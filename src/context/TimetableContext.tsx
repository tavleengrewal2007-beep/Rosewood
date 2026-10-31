import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  AcademicClass,
  ClassConflict,
  DetectedGap,
  SchedulerConfig,
  Weekday,
  WEEKDAYS,
} from '../types/timetable';
import { SchedulingEngine, timeToMinutes } from '../services/gapEngine/schedulingEngine';

interface TimetableContextType {
  classes: AcademicClass[];
  addClass: (cls: Omit<AcademicClass, 'id'>) => { success: boolean; error?: string; created?: AcademicClass };
  editClass: (id: string, updated: Partial<AcademicClass>) => { success: boolean; error?: string };
  deleteClass: (id: string) => void;
  duplicateClass: (id: string, targetDay?: Weekday) => AcademicClass | undefined;
  selectedDay: Weekday;
  setSelectedDay: (day: Weekday) => void;
  viewMode: 'daily' | 'weekly';
  setViewMode: (mode: 'daily' | 'weekly') => void;
  schedulerConfig: SchedulerConfig;
  updateSchedulerConfig: (config: Partial<SchedulerConfig>) => void;
  getClassesForDay: (day: Weekday) => AcademicClass[];
  getGapsForDay: (day: Weekday) => DetectedGap[];
  getConflictsForDay: (day: Weekday) => ClassConflict[];
  weeklyConflicts: ClassConflict[];
  isClassModalOpen: boolean;
  setIsClassModalOpen: (open: boolean) => void;
  editingClass: AcademicClass | null;
  openCreateModal: (defaultDay?: Weekday, defaultTime?: string) => void;
  openEditModal: (cls: AcademicClass) => void;
  isDiagnosticsOpen: boolean;
  setIsDiagnosticsOpen: (open: boolean) => void;
  resetToSampleTimetable: () => void;
}

const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  dayStartHour: 8,
  dayEndHour: 20,
  travelBufferMinutes: 10,
  includeDayBoundaries: false,
};

export const INITIAL_SAMPLE_CLASSES: AcademicClass[] = [
  {
    id: 'cls-1',
    subject: 'Algorithms & Modern Heuristics',
    code: 'CS 161',
    professor: 'Prof. Dan Boneh',
    location: 'Gates CS, Room B01',
    days: ['monday', 'wednesday', 'friday'],
    startTime: '09:00',
    endTime: '10:20',
    color: 'forest',
    isRecurring: true,
    notes: 'Weekly problem set due each Friday before lecture.',
  },
  {
    id: 'cls-2',
    subject: 'Design Systems & Information Architecture',
    code: 'DES 204',
    professor: 'Sarah K. Vance',
    location: 'd.school, Studio 2',
    days: ['monday', 'wednesday'],
    startTime: '11:45',
    endTime: '13:15',
    color: 'rose',
    isRecurring: true,
    notes: 'Studio design critique every alternate Wednesday.',
  },
  {
    id: 'cls-3',
    subject: 'Environmental Systems & Climate Modeling',
    code: 'ENVRES 220',
    professor: 'Dr. Noah Diffenbaugh',
    location: 'Y2E2 Building, Room 111',
    days: ['monday', 'wednesday'],
    startTime: '15:00',
    endTime: '16:30',
    color: 'gold',
    isRecurring: true,
    notes: 'Bring laptop with Python climate datasets loaded.',
  },
  {
    id: 'cls-4',
    subject: 'Cognitive Neuroscience of Learning',
    code: 'PSYCH 135',
    professor: 'Dr. Anthony Wagner',
    location: 'Jordan Hall, Rm 040',
    days: ['tuesday', 'thursday'],
    startTime: '10:00',
    endTime: '11:30',
    color: 'slate',
    isRecurring: true,
  },
  {
    id: 'cls-5',
    subject: 'Advanced Interactive Typography',
    code: 'ART 130',
    professor: 'Eileen Wu',
    location: 'McMurtry Building, Rm 204',
    days: ['tuesday', 'thursday'],
    startTime: '13:30',
    endTime: '15:00',
    color: 'blush',
    isRecurring: true,
  },
  {
    id: 'cls-6',
    subject: 'Engineering Honors Colloquium',
    code: 'ENGR 199',
    professor: 'Dean Jennifer Widom',
    location: 'Packard EE, Rm 101',
    days: ['friday'],
    startTime: '14:00',
    endTime: '15:30',
    color: 'forest',
    isRecurring: true,
  },
];

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes, setClasses] = useState<AcademicClass[]>(() => {
    try {
      const saved = localStorage.getItem('rosewood_timetable_classes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved classes', e);
    }
    return INITIAL_SAMPLE_CLASSES;
  });

  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>(() => {
    try {
      const saved = localStorage.getItem('rosewood_scheduler_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved scheduler config', e);
    }
    return DEFAULT_SCHEDULER_CONFIG;
  });

  const [selectedDay, setSelectedDay] = useState<Weekday>(() => {
    const days: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = new Date().getDay(); // 0 is Sunday, 1 is Monday
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      return days[dayOfWeek - 1];
    }
    return 'monday';
  });

  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('weekly');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rosewood_timetable_classes', JSON.stringify(classes));
    } catch (e) {
      console.error('Failed to save classes to storage', e);
    }
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem('rosewood_scheduler_config', JSON.stringify(schedulerConfig));
    } catch (e) {
      console.error('Failed to save scheduler config to storage', e);
    }
  }, [schedulerConfig]);

  const addClass = (clsData: Omit<AcademicClass, 'id'>): { success: boolean; error?: string; created?: AcademicClass } => {
    if (!clsData.subject.trim()) {
      return { success: false, error: 'Subject title is required.' };
    }
    if (!clsData.days || clsData.days.length === 0) {
      return { success: false, error: 'Please select at least one weekday.' };
    }
    const startM = timeToMinutes(clsData.startTime);
    const endM = timeToMinutes(clsData.endTime);
    if (endM <= startM) {
      return { success: false, error: 'End time must be strictly after start time.' };
    }
    if (endM - startM < 15) {
      return { success: false, error: 'Class duration must be at least 15 minutes.' };
    }

    // Check for exact duplicate in days and code
    const isDuplicate = classes.some(
      (c) =>
        c.code.trim().toLowerCase() === clsData.code.trim().toLowerCase() &&
        c.startTime === clsData.startTime &&
        c.days.some((d) => clsData.days.includes(d))
    );
    if (isDuplicate) {
      return {
        success: false,
        error: 'A class with the same course code and start time already exists on that day.',
      };
    }

    const created: AcademicClass = {
      ...clsData,
      id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setClasses((prev) => [...prev, created]);
    return { success: true, created };
  };

  const editClass = (id: string, updated: Partial<AcademicClass>): { success: boolean; error?: string } => {
    if (updated.startTime && updated.endTime) {
      const startM = timeToMinutes(updated.startTime);
      const endM = timeToMinutes(updated.endTime);
      if (endM <= startM) {
        return { success: false, error: 'End time must be strictly after start time.' };
      }
    }

    setClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    return { success: true };
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  const duplicateClass = (id: string, targetDay?: Weekday): AcademicClass | undefined => {
    const source = classes.find((c) => c.id === id);
    if (!source) return undefined;

    const duplicated: AcademicClass = {
      ...source,
      id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subject: `${source.subject} (Copy)`,
      days: targetDay ? [targetDay] : [...source.days],
    };

    setClasses((prev) => [...prev, duplicated]);
    return duplicated;
  };

  const updateSchedulerConfig = (updates: Partial<SchedulerConfig>) => {
    setSchedulerConfig((prev) => ({ ...prev, ...updates }));
  };

  const getClassesForDay = (day: Weekday): AcademicClass[] => {
    return SchedulingEngine.getSortedClassesForDay(classes, day);
  };

  const getGapsForDay = (day: Weekday): DetectedGap[] => {
    return SchedulingEngine.calculateGaps(classes, day, schedulerConfig);
  };

  const getConflictsForDay = (day: Weekday): ClassConflict[] => {
    return SchedulingEngine.detectConflicts(classes, day);
  };

  const weeklyConflicts = useMemo(() => {
    return WEEKDAYS.flatMap((day) => SchedulingEngine.detectConflicts(classes, day));
  }, [classes]);

  const openCreateModal = (defaultDay?: Weekday, defaultTime?: string) => {
    setEditingClass(null);
    if (defaultDay) setSelectedDay(defaultDay);
    setIsClassModalOpen(true);
  };

  const openEditModal = (cls: AcademicClass) => {
    setEditingClass(cls);
    setIsClassModalOpen(true);
  };

  const resetToSampleTimetable = () => {
    setClasses(INITIAL_SAMPLE_CLASSES);
  };

  return (
    <TimetableContext.Provider
      value={{
        classes,
        addClass,
        editClass,
        deleteClass,
        duplicateClass,
        selectedDay,
        setSelectedDay,
        viewMode,
        setViewMode,
        schedulerConfig,
        updateSchedulerConfig,
        getClassesForDay,
        getGapsForDay,
        getConflictsForDay,
        weeklyConflicts,
        isClassModalOpen,
        setIsClassModalOpen,
        editingClass,
        openCreateModal,
        openEditModal,
        isDiagnosticsOpen,
        setIsDiagnosticsOpen,
        resetToSampleTimetable,
      }}
    >
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetable = (): TimetableContextType => {
  const ctx = useContext(TimetableContext);
  if (!ctx) throw new Error('useTimetable must be used inside a TimetableProvider');
  return ctx;
};
