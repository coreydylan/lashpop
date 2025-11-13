"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useBookingOrchestrator } from '@/contexts/BookingOrchestratorContext';
import type { QuizResults as OrchestratorQuizResults } from '@/types/orchestrator';

// Types for drawer system
export type DrawerName = 'discover' | 'services';
export type DrawerState = 'invisible' | 'docked' | 'expanded';

export interface QuizResults {
  serviceCategory: string[];
  experience: string;
  style: string;
  timestamp: number;
}

interface DrawerStates {
  discover: DrawerState;
  services: DrawerState;
}

interface DrawerContextType {
  drawerStates: DrawerStates;
  activeDrawer: DrawerName | null;
  quizResults: QuizResults | null;
  setDrawerState: (drawer: DrawerName, state: DrawerState) => void;
  toggleDrawer: (drawer: DrawerName) => void;
  setQuizResults: (results: QuizResults) => void;
  closeAllDrawers: () => void;
  minimizeDrawer: (drawer: DrawerName) => void;
  expandDrawer: (drawer: DrawerName) => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [drawerStates, setDrawerStates] = useState<DrawerStates>({
    discover: 'invisible',
    services: 'invisible',
  });

  const [activeDrawer, setActiveDrawer] = useState<DrawerName | null>(null);
  const [quizResults, setQuizResultsState] = useState<QuizResults | null>(null);

  // Get orchestrator - now always available since we wrap at top level
  const orchestrator = useBookingOrchestrator();

  // Set drawer state
  const setDrawerState = useCallback((drawer: DrawerName, state: DrawerState) => {
    setDrawerStates(prev => ({
      ...prev,
      [drawer]: state,
    }));

    // Update active drawer
    if (state === 'expanded') {
      setActiveDrawer(drawer);
      // Minimize other drawers
      const otherDrawer = drawer === 'discover' ? 'services' : 'discover';
      if (drawerStates[otherDrawer] === 'expanded') {
        setDrawerStates(prev => ({
          ...prev,
          [otherDrawer]: 'docked',
        }));
      }
    } else if (state === 'invisible' && activeDrawer === drawer) {
      setActiveDrawer(null);
    }

    // Emit event to orchestrator
    if (orchestrator) {
      orchestrator.eventBus.emit({
        type: 'DRAWER_STATE_CHANGED',
        payload: { drawer, state },
      });
      // Update viewport dimensions when drawer state changes
      orchestrator.actions.updateViewportDimensions();
    }
  }, [drawerStates, activeDrawer, orchestrator]);

  // Toggle drawer between expanded and docked/invisible
  const toggleDrawer = useCallback((drawer: DrawerName) => {
    const currentState = drawerStates[drawer];

    if (currentState === 'expanded') {
      // If quiz is complete and this is the discover drawer, dock it
      if (drawer === 'discover' && quizResults) {
        setDrawerState(drawer, 'docked');
      } else {
        setDrawerState(drawer, 'invisible');
      }
    } else if (currentState === 'docked') {
      setDrawerState(drawer, 'expanded');
    } else {
      setDrawerState(drawer, 'expanded');
    }
  }, [drawerStates, quizResults, setDrawerState]);

  // Minimize drawer to docked state
  const minimizeDrawer = useCallback((drawer: DrawerName) => {
    if (drawerStates[drawer] === 'expanded') {
      // Keep discover drawer docked if quiz is complete
      if (drawer === 'discover' && quizResults) {
        setDrawerState(drawer, 'docked');
      } else {
        setDrawerState(drawer, 'invisible');
      }
    }
  }, [drawerStates, quizResults, setDrawerState]);

  // Expand drawer (or dock services drawer first if invisible)
  const expandDrawer = useCallback((drawer: DrawerName) => {
    const currentState = drawerStates[drawer];

    // For services drawer, dock it first if it's invisible (to show category selector)
    if (drawer === 'services' && currentState === 'invisible') {
      setDrawerState(drawer, 'docked');
    } else {
      setDrawerState(drawer, 'expanded');
    }
  }, [setDrawerState, drawerStates]);

  // Close all drawers
  const closeAllDrawers = useCallback(() => {
    setDrawerStates({
      discover: 'invisible',
      services: 'invisible',
    });
    setActiveDrawer(null);
  }, []);

  // Set quiz results
  const setQuizResults = useCallback((results: QuizResults) => {
    setQuizResultsState(results);
    // When quiz is complete, dock discover and expand services
    setDrawerState('discover', 'docked');
    setDrawerState('services', 'expanded');

    // Trigger orchestrated workflow
    if (orchestrator) {
      orchestrator.actions.completeQuizWorkflow(results as OrchestratorQuizResults);
    }
  }, [setDrawerState, orchestrator]);

  // Handle escape key to close drawers
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeDrawer) {
        minimizeDrawer(activeDrawer);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeDrawer, minimizeDrawer]);

  // Handle scroll-based drawer docking for services
  useEffect(() => {
    const handleScroll = () => {
      const servicesSection = document.getElementById('services-trigger');
      if (servicesSection) {
        const rect = servicesSection.getBoundingClientRect();
        const shouldDock = rect.top < 200 && rect.top > -rect.height;

        if (shouldDock && drawerStates.services === 'invisible') {
          setDrawerState('services', 'docked');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [drawerStates.services, setDrawerState]);

  return (
    <DrawerContext.Provider
      value={{
        drawerStates,
        activeDrawer,
        quizResults,
        setDrawerState,
        toggleDrawer,
        setQuizResults,
        closeAllDrawers,
        minimizeDrawer,
        expandDrawer,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
}