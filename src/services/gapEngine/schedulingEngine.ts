import {
  AcademicClass,
  ClassConflict,
  DetectedGap,
  GapClassification,
  SchedulerConfig,
  Weekday,
} from '../../types/timetable';

// ==========================================
// TIME CONVERSION UTILITIES
// ==========================================

export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const totalMinutes = timeToMinutes(timeStr);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function validateClassTimes(
  startTime: string,
  endTime: string
): { isValid: boolean; error?: string } {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (isNaN(start) || isNaN(end)) {
    return { isValid: false, error: 'Invalid time format. Please use HH:mm.' };
  }
  if (end <= start) {
    return { isValid: false, error: 'Class end time must be after the start time.' };
  }
  if (end - start < 15) {
    return { isValid: false, error: 'Class duration must be at least 15 minutes.' };
  }
  if (end - start > 480) {
    return { isValid: false, error: 'Class duration cannot exceed 8 hours in a single session.' };
  }
  return { isValid: true };
}

export function classifyGap(durationMinutes: number): GapClassification {
  if (durationMinutes < 15) return 'micro';
  if (durationMinutes < 30) return 'short';
  if (durationMinutes < 60) return 'medium';
  return 'long';
}

export function getGapActivities(
  classification: GapClassification,
  usableMinutes: number
): string[] {
  switch (classification) {
    case 'micro':
      return [
        'Hydrate & quick shoulder stretch',
        'Check classroom venue for next lecture',
        'Quick breathing exercise or reset',
      ];
    case 'short':
      return [
        'Review key takeaways from preceding lecture',
        'Grab tea or water refill at student center',
        'Quick flashcard quiz or concept review',
      ];
    case 'medium':
      return [
        'Nutritious balanced snack or light lunch',
        'Complete readings for the next seminar',
        'Calm outdoor walk in the courtyard',
      ];
    case 'long':
      return [
        'Sit-down meal with friends or study group',
        'Deep study block in library quiet zone',
        'Assignment draft or problem set focus',
        'Physical recharge or fitness session',
      ];
  }
}

// ==========================================
// SCHEDULING ENGINE CORE
// ==========================================

export class SchedulingEngine {
  /**
   * Filter and sort classes chronologically by start time for a specific weekday.
   */
  public static getSortedClassesForDay(
    classes: AcademicClass[],
    day: Weekday
  ): AcademicClass[] {
    return classes
      .filter((c) => c.days.includes(day))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }

  /**
   * Detect overlapping classes on a given weekday.
   */
  public static detectConflicts(
    classes: AcademicClass[],
    day: Weekday
  ): ClassConflict[] {
    const dayClasses = this.getSortedClassesForDay(classes, day);
    const conflicts: ClassConflict[] = [];

    for (let i = 0; i < dayClasses.length; i++) {
      for (let j = i + 1; j < dayClasses.length; j++) {
        const a = dayClasses[i];
        const b = dayClasses[j];

        const aStart = timeToMinutes(a.startTime);
        const aEnd = timeToMinutes(a.endTime);
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);

        // Check if intervals overlap (strict intersection: start < otherEnd && otherStart < end)
        if (bStart < aEnd && aStart < bEnd) {
          const overlapStart = Math.max(aStart, bStart);
          const overlapEnd = Math.min(aEnd, bEnd);
          const overlapMinutes = overlapEnd - overlapStart;

          if (overlapMinutes > 0) {
            conflicts.push({
              id: `conflict-${day}-${a.id}-${b.id}`,
              classA: a,
              classB: b,
              day,
              overlapMinutes,
              overlapWindow: `${minutesToTime(overlapStart)} – ${minutesToTime(overlapEnd)}`,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Merge overlapping or contiguous occupied intervals to accurately calculate free time.
   */
  public static mergeOccupiedIntervals(
    classes: AcademicClass[]
  ): { start: number; end: number; sourceClassIds: string[] }[] {
    if (classes.length === 0) return [];

    const sorted = [...classes].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    const merged: { start: number; end: number; sourceClassIds: string[] }[] = [];

    for (const item of sorted) {
      const start = timeToMinutes(item.startTime);
      const end = timeToMinutes(item.endTime);

      if (merged.length === 0) {
        merged.push({ start, end, sourceClassIds: [item.id] });
      } else {
        const last = merged[merged.length - 1];
        if (start < last.end) {
          // Overlap: merge into union
          last.end = Math.max(last.end, end);
          if (!last.sourceClassIds.includes(item.id)) {
            last.sourceClassIds.push(item.id);
          }
        } else {
          merged.push({ start, end, sourceClassIds: [item.id] });
        }
      }
    }

    return merged;
  }

  /**
   * Calculates all free gaps for a given weekday, considering travel buffers
   * and optional day boundaries (day start / day end).
   */
  public static calculateGaps(
    classes: AcademicClass[],
    day: Weekday,
    config: SchedulerConfig
  ): DetectedGap[] {
    const dayClasses = this.getSortedClassesForDay(classes, day);
    const dayStartMinutes = config.dayStartHour * 60;
    const dayEndMinutes = config.dayEndHour * 60;
    const gaps: DetectedGap[] = [];

    // Case 1: No classes on this day
    if (dayClasses.length === 0) {
      if (config.includeDayBoundaries && dayEndMinutes > dayStartMinutes) {
        const totalDuration = dayEndMinutes - dayStartMinutes;
        gaps.push({
          id: `gap-${day}-full-day`,
          day,
          startTime: minutesToTime(dayStartMinutes),
          endTime: minutesToTime(dayEndMinutes),
          rawDurationMinutes: totalDuration,
          usableDurationMinutes: totalDuration,
          bufferMinutesDeducted: 0,
          classification: classifyGap(totalDuration),
          isDayBoundary: true,
          recommendedActivities: [
            'Full restorative day off classes',
            'Independent assignment block or thesis prep',
            'Recharge & lifestyle balance',
          ],
        });
      }
      return gaps;
    }

    // Merge occupied intervals to handle overlaps cleanly
    const mergedOccupied = this.mergeOccupiedIntervals(dayClasses);

    // Case 2: Morning boundary gap (from student dayStart up to first class)
    if (config.includeDayBoundaries) {
      const firstClassStart = mergedOccupied[0].start;
      if (firstClassStart > dayStartMinutes) {
        const rawDuration = firstClassStart - dayStartMinutes;
        const buffer = Math.min(config.travelBufferMinutes, rawDuration);
        const usable = rawDuration - buffer;

        if (usable >= 5) {
          const firstClass = dayClasses[0];
          gaps.push({
            id: `gap-${day}-morning`,
            day,
            startTime: minutesToTime(dayStartMinutes),
            endTime: minutesToTime(firstClassStart),
            rawDurationMinutes: rawDuration,
            usableDurationMinutes: usable,
            bufferMinutesDeducted: buffer,
            classification: classifyGap(usable),
            isDayBoundary: true,
            succeedingClass: {
              id: firstClass.id,
              code: firstClass.code,
              subject: firstClass.subject,
              location: firstClass.location,
              startTime: firstClass.startTime,
            },
            recommendedActivities: [
              'Morning breakfast & mental readiness',
              'Review notes before first class',
              'Travel buffer to classroom venue',
            ],
          });
        }
      }
    }

    // Case 3: Inter-class gaps between consecutive classes
    for (let i = 0; i < mergedOccupied.length - 1; i++) {
      const currentBlockEnd = mergedOccupied[i].end;
      const nextBlockStart = mergedOccupied[i + 1].start;

      // Only if there is a gap strictly greater than 0
      if (nextBlockStart > currentBlockEnd) {
        const rawDuration = nextBlockStart - currentBlockEnd;

        // Deduct travel buffer (e.g., 10 mins walk to next building), without exceeding raw duration
        const buffer = Math.min(config.travelBufferMinutes, Math.floor(rawDuration / 2));
        const usable = Math.max(0, rawDuration - buffer);

        // Find nearest preceding and succeeding class metadata
        const preceding = [...dayClasses]
          .reverse()
          .find((c) => timeToMinutes(c.endTime) <= currentBlockEnd);
        const succeeding = dayClasses.find(
          (c) => timeToMinutes(c.startTime) >= nextBlockStart
        );

        if (rawDuration >= 5) {
          const classification = classifyGap(usable > 0 ? usable : rawDuration);

          gaps.push({
            id: `gap-${day}-${currentBlockEnd}-${nextBlockStart}`,
            day,
            startTime: minutesToTime(currentBlockEnd),
            endTime: minutesToTime(nextBlockStart),
            rawDurationMinutes: rawDuration,
            usableDurationMinutes: usable,
            bufferMinutesDeducted: buffer,
            classification,
            isDayBoundary: false,
            precedingClass: preceding
              ? {
                  id: preceding.id,
                  code: preceding.code,
                  subject: preceding.subject,
                  location: preceding.location,
                  endTime: preceding.endTime,
                }
              : undefined,
            succeedingClass: succeeding
              ? {
                  id: succeeding.id,
                  code: succeeding.code,
                  subject: succeeding.subject,
                  location: succeeding.location,
                  startTime: succeeding.startTime,
                }
              : undefined,
            recommendedActivities: getGapActivities(classification, usable),
          });
        }
      }
    }

    // Case 4: Evening boundary gap (from last class until student dayEnd)
    if (config.includeDayBoundaries) {
      const lastClassEnd = mergedOccupied[mergedOccupied.length - 1].end;
      if (dayEndMinutes > lastClassEnd) {
        const rawDuration = dayEndMinutes - lastClassEnd;
        if (rawDuration >= 15) {
          const lastClass = dayClasses[dayClasses.length - 1];
          gaps.push({
            id: `gap-${day}-evening`,
            day,
            startTime: minutesToTime(lastClassEnd),
            endTime: minutesToTime(dayEndMinutes),
            rawDurationMinutes: rawDuration,
            usableDurationMinutes: rawDuration,
            bufferMinutesDeducted: 0,
            classification: classifyGap(rawDuration),
            isDayBoundary: true,
            precedingClass: {
              id: lastClass.id,
              code: lastClass.code,
              subject: lastClass.subject,
              location: lastClass.location,
              endTime: lastClass.endTime,
            },
            recommendedActivities: [
              'Post-lecture decompression',
              'Dinner & campus unwind',
              'Evening focus sprint or reading',
            ],
          });
        }
      }
    }

    return gaps;
  }
}
