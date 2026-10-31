import React, { createContext, useContext, useState } from 'react';
import { ModuleId } from '../types/navigation';

interface NavigationContextType {
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
  viewMode: 'landing' | 'app';
  setViewMode: (mode: 'landing' | 'app') => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');

  const toggleMobileDrawer = () => setIsMobileDrawerOpen((prev) => !prev);

  return (
    <NavigationContext.Provider
      value={{
        activeModule,
        setActiveModule,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        toggleMobileDrawer,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
};
