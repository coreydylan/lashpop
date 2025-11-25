"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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

  // Use refs to access current state without adding dependencies
  const drawerStatesRef = useRef(drawerStates);
  const quizResultsRef = useRef(quizResults);
  
  // Keep refs in sync
  useEffect(() => {
    drawerStatesRef.current = drawerStates;
  }, [drawerStates]);
  
  useEffect(() => {
    quizResultsRef.current = quizResults;
  }, [quizResults]);

  // Get orchestrator - now always available since we wrap at top level
  const orchestrator = useBookingOrchestrator();
  const orchestratorRef = useRef(orchestrator);
  useEffect(() => {
    orchestratorRef.current = orchestrator;
  }, [orchestrator]);

  // Set drawer state - use functional updates to avoid stale closures and infinite loops
  const setDrawerState = useCallback((drawer: DrawerName, newState: DrawerState) => {
    setDrawerStates(prev => {
      const updated = { ...prev, [drawer]: newState };
      
      // Minimize other drawers if this one is being expanded
      if (newState === 'expanded') {
        const otherDrawer = drawer === 'discover' ? 'services' : 'discover';
        if (prev[otherDrawer] === 'expanded') {
          updated[otherDrawer] = 'docked';
        }
      }
      
      return updated;
    });

    // Update active drawer
    if (newState === 'expanded') {
      setActiveDrawer(drawer);
    } else if (newState === 'invisible') {
      setActiveDrawer(prev => prev === drawer ? null : prev);
    }

    // Emit event to orchestrator (use ref to avoid dependency)
    const orch = orchestratorRef.current;
    if (orch) {
      orch.eventBus.emit({
        type: 'DRAWER_STATE_CHANGED',
        payload: { drawer, state: newState },
      });
      // Update viewport dimensions when drawer state changes
      orch.actions.updateViewportDimensions();
    }
  }, []); // No dependencies - uses refs

  // Toggle drawer between expanded and docked/invisible
  const toggleDrawer = useCallback((drawer: DrawerName) => {
    const currentState = drawerStatesRef.current[drawer];
    const hasQuizResults = quizResultsRef.current !== null;

    if (currentState === 'expanded') {
      // If quiz is complete and this is the discover drawer, dock it
      if (drawer === 'discover' && hasQuizResults) {
        setDrawerState(drawer, 'docked');
      } else {
        setDrawerState(drawer, 'invisible');
      }
    } else {
      setDrawerState(drawer, 'expanded');
    }
  }, [setDrawerState]);

  // Minimize drawer to docked state
  const minimizeDrawer = useCallback((drawer: DrawerName) => {
    const currentState = drawerStatesRef.current[drawer];
    const hasQuizResults = quizResultsRef.current !== null;
    
    if (currentState === 'expanded') {
      // Keep discover drawer docked if quiz is complete
      if (drawer === 'discover' && hasQuizResults) {
        setDrawerState(drawer, 'docked');
      } else {
        setDrawerState(drawer, 'invisible');
      }
    }
  }, [setDrawerState]);

  // Expand drawer (or dock services drawer first if invisible)
  const expandDrawer = useCallback((drawer: DrawerName) => {
    const currentState = drawerStatesRef.current[drawer];
    
    // For services drawer, dock it first if it's invisible (to show category selector)
    if (drawer === 'services' && currentState === 'invisible') {
      setDrawerState(drawer, 'docked');
    } else {
      setDrawerState(drawer, 'expanded');
    }
  }, [setDrawerState]);

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

        setDrawerStates(prev => {
          if (shouldDock && prev.services === 'invisible') {
            return {
               ...prev,
               services: 'docked'
            }
          }
          // IMPORTANT: Do NOT update state if conditions aren't met to avoid re-render loops
          return prev;
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array as we use functional state update

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