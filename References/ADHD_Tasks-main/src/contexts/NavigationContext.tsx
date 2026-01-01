"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Simplificando os modos de navegação
type NavMode = 'sidebar-expanded' | 'sidebar-collapsed' | 'mobile';

interface NavigationContextType {
  navMode: NavMode;
  setNavMode: React.Dispatch<React.SetStateAction<NavMode>>;
  isSidebarVisible: boolean;
  isSidebarCollapsed: boolean;
  isFooterNavVisible: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const DESKTOP_NAV_MODE_KEY = 'desktop_nav_mode';

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const [navMode, setNavMode] = useState<NavMode>(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      const savedMode = localStorage.getItem(DESKTOP_NAV_MODE_KEY);
      if (savedMode === 'sidebar-expanded' || savedMode === 'sidebar-collapsed') {
        return savedMode as NavMode;
      }
    }
    return isMobile ? 'mobile' : 'sidebar-expanded'; // Default para mobile ou desktop
  });

  // Ajusta o modo de navegação quando o estado mobile muda
  useEffect(() => {
    if (isMobile) {
      setNavMode('mobile');
    } else {
      const savedMode = localStorage.getItem(DESKTOP_NAV_MODE_KEY);
      if (savedMode === 'sidebar-expanded' || savedMode === 'sidebar-collapsed') {
        setNavMode(savedMode as NavMode);
      } else {
        setNavMode('sidebar-expanded'); // Padrão para desktop
      }
    }
  }, [isMobile]);

  // Persiste o modo de navegação do desktop no localStorage
  useEffect(() => {
    if (!isMobile && (navMode === 'sidebar-expanded' || navMode === 'sidebar-collapsed')) {
      localStorage.setItem(DESKTOP_NAV_MODE_KEY, navMode);
    }
  }, [navMode, isMobile]);

  const isSidebarVisible = !isMobile; // Sidebar visível apenas no desktop
  const isSidebarCollapsed = navMode === 'sidebar-collapsed';
  const isFooterNavVisible = isMobile; // Footer nav visível apenas no mobile

  const value = {
    navMode,
    setNavMode,
    isSidebarVisible,
    isSidebarCollapsed,
    isFooterNavVisible,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};