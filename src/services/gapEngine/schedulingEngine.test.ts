import {
  SchedulingEngine,
  timeToMinutes,
  minutesToTime,
  classifyGap,
  validateClassTimes,
} from './schedulingEngine';
import { AcademicClass, SchedulerConfig } from '../../types/timetable';

export interface TestResult {
  id: string;
  name: string;
  category: 'core' | 'overlap' | 'buffers' | 'validation' | 'classification';
  passed: boolean;
  expected: string;
  received: string;
  details?: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  executionTimeMs: number;
  results: TestResult[];
}

export function runSchedulingEngineUnitTests(): TestSuiteSummary {
  const startTime = performance.now();
  const results: TestResult[] = [];

  const baseConfig: SchedulerConfig = {
    dayStartHour: 8,
    dayEndHour: 18,
    travelBufferMinutes: 0,
    includeDayBoundaries: false,
  };

  // -------------------------------------------------------------
  // Test 1: Exact User Example from Prompt
  // Physics: 09:00–10:00
  // Mathematics: 11:30–12:30
  // Chemistry: 14:00–15:00
  // Expected free periods: 10:00–11:30 = 90 mins; 12:30–14:00 = 90 mins.
  // -------------------------------------------------------------
  try {
    const classes: AcademicClass[] = [
      {
        id: 't1-1',
        subject: 'Physics',
        code: 'PHYS 101',
        professor: 'Dr. Richard Feynman',
        location: 'Hall A',
        days: ['monday'],
        startTime: '09:00',
        endTime: '10:00',
        color: 'forest',
      },
      {
        id: 't1-2',
        subject: 'Mathematics',
        code: 'MATH 201',
        professor: 'Dr. Leonhard Euler',
        location: 'Hall B',
        days: ['monday'],
        startTime: '11:30',
        endTime: '12:30',
        color: 'rose',
      },
      {
        id: 't1-3',
        subject: 'Chemistry',
        code: 'CHEM 101',
        professor: 'Dr. Marie Curie',
        location: 'Lab 3',
        days: ['monday'],
        startTime: '14:00',
        endTime: '15:00',
        color: 'gold',
      },
    ];

    const gaps = SchedulingEngine.calculateGaps(classes, 'monday', baseConfig);
    const passed =
      gaps.length === 2 &&
      gaps[0].startTime === '10:00' &&
      gaps[0].endTime === '11:30' &&
      gaps[0].rawDurationMinutes === 90 &&
      gaps[1].startTime === '12:30' &&
      gaps[1].endTime === '14:00' &&
      gaps[1].rawDurationMinutes === 90;

    results.push({
      id: 'test-1',
      name: 'Exact Prompt Spec: Physics, Math, Chemistry gaps calculation',
      category: 'core',
      passed,
      expected: '10:00–11:30 (90m) and 12:30–14:00 (90m)',
      received: gaps.map((g) => `${g.startTime}–${g.endTime} (${g.rawDurationMinutes}m)`).join(', ') || 'No gaps',
      details: 'Evaluates chronological inter-class free period duration calculations without day boundary offsets.',
    });
  } catch (err: any) {
    results.push({
      id: 'test-1',
      name: 'Exact Prompt Spec: Physics, Math, Chemistry gaps calculation',
      category: 'core',
      passed: false,
      expected: '10:00–11:30 (90m) and 12:30–14:00 (90m)',
      received: `Threw error: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 2: Back-to-Back Classes (0-minute gap handling)
  // -------------------------------------------------------------
  try {
    const backToBackClasses: AcademicClass[] = [
      {
        id: 't2-1',
        subject: 'Class One',
        code: 'CLS 1',
        professor: '',
        location: '',
        days: ['tuesday'],
        startTime: '10:00',
        endTime: '11:15',
        color: 'forest',
      },
      {
        id: 't2-2',
        subject: 'Class Two',
        code: 'CLS 2',
        professor: '',
        location: '',
        days: ['tuesday'],
        startTime: '11:15',
        endTime: '12:30',
        color: 'rose',
      },
    ];

    const gaps = SchedulingEngine.calculateGaps(backToBackClasses, 'tuesday', baseConfig);
    const passed = gaps.length === 0;

    results.push({
      id: 'test-2',
      name: 'Back-to-back classes exclude 0-minute false gaps',
      category: 'core',
      passed,
      expected: '0 gaps detected',
      received: `${gaps.length} gap(s) detected`,
      details: 'Ensures contiguous classes do not create zero-minute or negative gap entries.',
    });
  } catch (err: any) {
    results.push({
      id: 'test-2',
      name: 'Back-to-back classes exclude 0-minute false gaps',
      category: 'core',
      passed: false,
      expected: '0 gaps detected',
      received: `Error: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 3: Overlapping Classes Detection & Occupied Interval Union
  // -------------------------------------------------------------
  try {
    const overlappingClasses: AcademicClass[] = [
      {
        id: 't3-1',
        subject: 'Algorithms Lecture',
        code: 'CS 161',
        professor: '',
        location: '',
        days: ['wednesday'],
        startTime: '10:00',
        endTime: '11:30',
        color: 'forest',
      },
      {
        id: 't3-2',
        subject: 'Discussion Lab',
        code: 'CS 161L',
        professor: '',
        location: '',
        days: ['wednesday'],
        startTime: '11:00',
        endTime: '12:00',
        color: 'rose',
      },
      {
        id: 't3-3',
        subject: 'Afternoon Seminar',
        code: 'SEM 300',
        professor: '',
        location: '',
        days: ['wednesday'],
        startTime: '13:00',
        endTime: '14:30',
        color: 'gold',
      },
    ];

    const conflicts = SchedulingEngine.detectConflicts(overlappingClasses, 'wednesday');
    const gaps = SchedulingEngine.calculateGaps(overlappingClasses, 'wednesday', baseConfig);

    const conflictPassed = conflicts.length === 1 && conflicts[0].overlapMinutes === 30;
    // Overlap merges 10:00-11:30 and 11:00-12:00 into union 10:00-12:00.
    // The gap to the 13:00 seminar must begin at 12:00, with length 60 mins.
    const gapPassed = gaps.length === 1 && gaps[0].startTime === '12:00' && gaps[0].rawDurationMinutes === 60;

    results.push({
      id: 'test-3',
      name: 'Overlap detection & occupied interval merging',
      category: 'overlap',
      passed: conflictPassed && gapPassed,
      expected: '1 conflict (30m overlap: 11:00–11:30); 1 gap from 12:00–13:00 (60m)',
      received: `${conflicts.length} conflict(s), Gap: ${gaps[0]?.startTime}–${gaps[0]?.endTime} (${gaps[0]?.rawDurationMinutes}m)`,
      details: 'Confirms that overlapping occupied hours merge into a union so students are not told they are free while in class.',
    });
  } catch (err: any) {
    results.push({
      id: 'test-3',
      name: 'Overlap detection & occupied interval merging',
      category: 'overlap',
      passed: false,
      expected: '1 conflict, merged gap',
      received: `Error: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 4: Configurable Travel Buffer Deduction
  // -------------------------------------------------------------
  try {
    const configWithBuffer: SchedulerConfig = {
      ...baseConfig,
      travelBufferMinutes: 10,
    };

    const classes: AcademicClass[] = [
      {
        id: 't4-1',
        subject: 'Biology',
        code: 'BIO 101',
        professor: '',
        location: 'West Science Quad',
        days: ['thursday'],
        startTime: '10:00',
        endTime: '11:00',
        color: 'forest',
      },
      {
        id: 't4-2',
        subject: 'Art History',
        code: 'ART 150',
        professor: '',
        location: 'East Arts Hall',
        days: ['thursday'],
        startTime: '11:40',
        endTime: '13:00',
        color: 'rose',
      },
    ];

    const gaps = SchedulingEngine.calculateGaps(classes, 'thursday', configWithBuffer);
    // Raw gap: 11:00-11:40 = 40m. Buffer deducted = 10m. Usable = 30m.
    const passed =
      gaps.length === 1 &&
      gaps[0].rawDurationMinutes === 40 &&
      gaps[0].bufferMinutesDeducted === 10 &&
      gaps[0].usableDurationMinutes === 30;

    results.push({
      id: 'test-4',
      name: 'Configurable transit/travel buffer subtraction',
      category: 'buffers',
      passed,
      expected: 'Raw: 40m, Deducted buffer: 10m, Usable: 30m',
      received: `Raw: ${gaps[0]?.rawDurationMinutes}m, Deducted: ${gaps[0]?.bufferMinutesDeducted}m, Usable: ${gaps[0]?.usableDurationMinutes}m`,
      details: 'Verifies campus travel time is deducted from the usable study/leisure window.',
    });
  } catch (err: any) {
    results.push({
      id: 'test-4',
      name: 'Configurable transit/travel buffer subtraction',
      category: 'buffers',
      passed: false,
      expected: 'Usable: 30m',
      received: `Error: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 5: Day Boundaries Calculation (Morning & Evening Free Slots)
  // -------------------------------------------------------------
  try {
    const configWithBoundaries: SchedulerConfig = {
      dayStartHour: 8,
      dayEndHour: 18,
      travelBufferMinutes: 10,
      includeDayBoundaries: true,
    };

    const classes: AcademicClass[] = [
      {
        id: 't5-1',
        subject: 'Cognitive Science',
        code: 'COG 110',
        professor: '',
        location: '',
        days: ['friday'],
        startTime: '10:00',
        endTime: '12:00',
        color: 'forest',
      },
      {
        id: 't5-2',
        subject: 'Statistics',
        code: 'STAT 200',
        professor: '',
        location: '',
        days: ['friday'],
        startTime: '13:30',
        endTime: '15:00',
        color: 'rose',
      },
    ];

    const gaps = SchedulingEngine.calculateGaps(classes, 'friday', configWithBoundaries);
    // Morning: 08:00 - 10:00 (120m raw)
    // Middle: 12:00 - 13:30 (90m raw)
    // Evening: 15:00 - 18:00 (180m raw)
    const passed =
      gaps.length === 3 &&
      gaps[0].startTime === '08:00' &&
      gaps[0].isDayBoundary === true &&
      gaps[1].startTime === '12:00' &&
      gaps[1].isDayBoundary === false &&
      gaps[2].startTime === '15:00' &&
      gaps[2].isDayBoundary === true;

    results.push({
      id: 'test-5',
      name: 'Boundary gaps (day start & day end integration)',
      category: 'core',
      passed,
      expected: '3 gaps: morning (08:00-10:00), middle (12:00-13:30), evening (15:00-18:00)',
      received: `${gaps.length} gaps: ${gaps.map((g) => `${g.startTime}–${g.endTime}`).join(', ')}`,
      details: 'Calculates morning prep time and evening study hours against student configured day span.',
    });
  } catch (err: any) {
    results.push({
      id: 'test-5',
      name: 'Boundary gaps',
      category: 'core',
      passed: false,
      expected: '3 gaps',
      received: `Error: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 6: Gap Classification Boundaries
  // -------------------------------------------------------------
  const c1 = classifyGap(10) === 'micro';
  const c2 = classifyGap(20) === 'short';
  const c3 = classifyGap(45) === 'medium';
  const c4 = classifyGap(75) === 'long';
  const allClassified = c1 && c2 && c3 && c4;

  results.push({
    id: 'test-6',
    name: 'Gap classifications match specified durations',
    category: 'classification',
    passed: allClassified,
    expected: '10m -> micro, 20m -> short, 45m -> medium, 75m -> long',
    received: `10m -> ${classifyGap(10)}, 20m -> ${classifyGap(20)}, 45m -> ${classifyGap(45)}, 75m -> ${classifyGap(75)}`,
    details: 'Validates classification thresholds according to specified categories.',
  });

  // -------------------------------------------------------------
  // Test 7: Validation Functions (Invalid ranges, end <= start)
  // -------------------------------------------------------------
  const v1 = validateClassTimes('10:00', '09:00').isValid === false;
  const v2 = validateClassTimes('10:00', '10:05').isValid === false; // Under 15m
  const v3 = validateClassTimes('09:00', '10:30').isValid === true;
  const valPassed = v1 && v2 && v3;

  results.push({
    id: 'test-7',
    name: 'Time range validation catches inverse and sub-15m times',
    category: 'validation',
    passed: valPassed,
    expected: 'Reject end <= start, reject < 15m, accept valid ranges',
    received: `Rejects invalid: ${v1 && v2}, Accepts valid: ${v3}`,
    details: 'Ensures strict input sanitation to prevent corrupted schedule models.',
  });

  // -------------------------------------------------------------
  // Test 8: Empty Day Handling (Days without classes)
  // -------------------------------------------------------------
  try {
    const gapsWithoutBoundaries = SchedulingEngine.calculateGaps([], 'saturday', baseConfig);
    const gapsWithBoundaries = SchedulingEngine.calculateGaps([], 'saturday', {
      ...baseConfig,
      includeDayBoundaries: true,
    });

    const passed =
      gapsWithoutBoundaries.length === 0 &&
      gapsWithBoundaries.length === 1 &&
      gapsWithBoundaries[0].rawDurationMinutes === 600; // 08:00 to 18:00 = 10h = 600m

    results.push({
      id: 'test-8',
      name: 'Empty day handling without crashing or false overlaps',
      category: 'core',
      passed,
      expected: '0 gaps when boundaries disabled, 1 full-day gap (600m) when enabled',
      received: `Without boundaries: ${gapsWithoutBoundaries.length}, With boundaries: ${gapsWithBoundaries.length} (${gapsWithBoundaries[0]?.rawDurationMinutes}m)`,
      details: 'Ensures weekend or free days are safely presented.',
    });
  } catch (err: any) {
    results.push({
      id: 'test-8',
      name: 'Empty day handling',
      category: 'core',
      passed: false,
      expected: 'Safe empty state',
      received: `Error: ${err.message}`,
    });
  }

  const endTime = performance.now();
  const passedCount = results.filter((r) => r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    results,
  };
}
