import React from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { TimetableProvider } from './context/TimetableContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './components/landing/LandingPage';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { TimetableModule } from './components/timetable/TimetableModule';
import { GapsModule } from './components/modules/GapsModule';
import {
  MealsModule,
  BreaksModule,
  GoalsModule,
  InsightsModule,
  NotificationsModule,
  SettingsModule,
} from './components/modules/OtherModules';

const MainAppContent: React.FC = () => {
  const { activeModule, viewMode } = useNavigation();

  if (viewMode === 'landing') {
    return <LandingPage />;
  }

  return (
    <AppLayout>
      {activeModule === 'dashboard' && <StudentDashboard />}
      {activeModule === 'timetable' && <TimetableModule />}
      {activeModule === 'gaps' && <GapsModule />}
      {activeModule === 'meals' && <MealsModule />}
      {activeModule === 'breaks' && <BreaksModule />}
      {activeModule === 'goals' && <GoalsModule />}
      {activeModule === 'insights' && <InsightsModule />}
      {activeModule === 'notifications' && <NotificationsModule />}
      {activeModule === 'settings' && <SettingsModule />}
    </AppLayout>
  );
};

export default function App() {
  return (
    <NavigationProvider>
      <TimetableProvider>
        <MainAppContent />
      </TimetableProvider>
    </NavigationProvider>
  );
}
