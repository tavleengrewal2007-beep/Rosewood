import React, { useState } from 'react';
import { StatsOverview } from './StatsOverview';
import { TodayTimeline } from './TodayTimeline';
import { SmartMealCard } from './SmartMealCard';
import { NextFreePeriodCard } from './NextFreePeriodCard';
import { DailyGoalsWidget } from './DailyGoalsWidget';
import { QuickActionsBar } from './QuickActionsBar';
import { ClassModal } from '../timetable/ClassModal';
import { GapDiagnosticsModal } from '../timetable/GapDiagnosticsModal';

export const StudentDashboard: React.FC = () => {
  const [completedGoals, setCompletedGoals] = useState(2);
  const [totalGoals, setTotalGoals] = useState(4);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Quick Action Bar */}
      <QuickActionsBar />

      {/* 2. Top-Level Derived Statistics */}
      <StatsOverview
        completedGoalsCount={completedGoals}
        totalGoalsCount={totalGoals}
      />

      {/* 3. Main Dashboard 2-Column Split: Left Schedule, Right Contextual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Chronological Today's Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <TodayTimeline />
        </div>

        {/* Right Column: Next Free Period, Smart Meal, Daily Goals (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <NextFreePeriodCard />
          <SmartMealCard />
          <DailyGoalsWidget
            onGoalsChange={(completed, total) => {
              setCompletedGoals(completed);
              setTotalGoals(total);
            }}
          />
        </div>
      </div>

      {/* Global Modals */}
      <ClassModal />
      <GapDiagnosticsModal />
    </div>
  );
};
