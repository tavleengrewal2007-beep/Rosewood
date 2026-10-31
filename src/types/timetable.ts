export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
};

export type ClassColorToken = 'forest' | 'rose' | 'gold' | 'blush' | 'slate';

export interface AcademicClass {
  id: string;
  subject: string;
  code: string;
  professor: string;
  location: string;
  days: Weekday[];
  startTime: string; // "HH:mm" (24-hour format)
  endTime: string;   // "HH:mm"
  color: ClassColorToken;
  isRecurring?: boolean;
  notes?: string;
}

export type GapClassification = 'micro' | 'short' | 'medium' | 'long';

export interface DetectedGap {
  id: string;
  day: Weekday;
  startTime: string;
  endTime: string;
  rawDurationMinutes: number;
  usableDurationMinutes: number; // Duration after subtracting transit buffers
  bufferMinutesDeducted: number;
  classification: GapClassification;
  isDayBoundary?: boolean;
  precedingClass?: {
    id: string;
    code: string;
    subject: string;
    location: string;
    endTime: string;
  };
  succeedingClass?: {
    id: string;
    code: string;
    subject: string;
    location: string;
    startTime: string;
  };
  recommendedActivities: string[];
}

export interface ClassConflict {
  id: string;
  classA: AcademicClass;
  classB: AcademicClass;
  day: Weekday;
  overlapMinutes: number;
  overlapWindow: string;
}

export interface SchedulerConfig {
  dayStartHour: number;        // e.g. 8 (08:00 AM)
  dayEndHour: number;          // e.g. 20 (08:00 PM)
  travelBufferMinutes: number; // e.g. 10 minutes between buildings
  includeDayBoundaries: boolean;
}

export interface DayScheduleSummary {
  classes: AcademicClass[];
  gaps: DetectedGap[];
  conflicts: ClassConflict[];
  totalClassMinutes: number;
  totalFreeMinutes: number;
}
