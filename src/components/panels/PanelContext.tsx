"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useBookingOrchestrator } from '@/contexts/BookingOrchestratorContext';
import type { Provider } from '@/types/orchestrator';

// Panel Types
export type PanelType =
  | 'service-detail'
  | 'provider-detail'
  | 'schedule-comparison'
  | 'scheduling'
  | 'booking-confirmation';

export type EntryPoint =
  | 'category'
  | 'service-card'
  | 'team-member'
  | 'quiz-result';

// Panel State
export interface Panel {
  id: string;
  type: PanelType;
  data: any;
  entryPoint: EntryPoint;
}

interface PanelContext {
  serviceId?: string;
  providerId?: string;
  selectedProviders: string[];
  selectedService?: string;
  filters: string[];
  entryPoint?: EntryPoint;
}

interface PanelManagerContextType {
  // Panel Stack
  panelStack: Panel[];
  activePanel: Panel | null;

  // Context
  context: PanelContext;

  // Actions
  pushPanel: (panel: Panel) => void;
  popPanel: () => void;
  clearPanels: () => void;
  updateContext: (updates: Partial<PanelContext>) => void;

  // Provider Selection
  toggleProvider: (providerId: string) => void;
  selectAllProviders: (providerIds: string[]) => void;
  clearProviders: () => void;
}

const PanelManagerContext = createContext<PanelManagerContextType | undefined>(undefined);

export function PanelManagerProvider({ children }: { children: React.ReactNode }) {
  const [panelStack, setPanelStack] = useState<Panel[]>([]);
  const [localContext, setLocalContext] = useState<Omit<PanelContext, 'selectedProviders'>>({
    filters: [],
  });

  // Get orchestrator - now always available since we wrap at top level
  const orchestrator = useBookingOrchestrator();

  // Use orchestrator's selected providers (memoized to prevent infinite loops)
  const selectedProviders = useMemo(
    () => orchestrator.state.selectedProviders.map(p => p.id),
    [orchestrator.state.selectedProviders]
  );

  // Merge local context with orchestrator state
  const context: PanelContext = useMemo(() => ({
    ...localContext,
    selectedProviders,
  }), [localContext, selectedProviders]);

  const activePanel = panelStack.length > 0 ? panelStack[panelStack.length - 1] : null;

  const pushPanel = useCallback((panel: Panel) => {
    setPanelStack(prev => [...prev, panel]);

    // Emit event for panel opening
    if (orchestrator && panel.type === 'service-detail') {
      orchestrator.eventBus.emit({
        type: 'BOOKING_PANEL_OPENED',
        payload: { providerId: panel.data?.providerId || '' },
      });
    }
  }, [orchestrator]);

  const popPanel = useCallback(() => {
    const currentPanel = panelStack[panelStack.length - 1];
    setPanelStack(prev => prev.slice(0, -1));

    // Emit event for panel closing
    if (orchestrator && currentPanel?.type === 'service-detail') {
      orchestrator.eventBus.emit({
        type: 'BOOKING_PANEL_CLOSED',
        payload: {},
      });
    }
  }, [panelStack, orchestrator]);

  const clearPanels = useCallback(() => {
    setPanelStack([]);

    // Emit event for all panels closing
    if (orchestrator) {
      orchestrator.eventBus.emit({
        type: 'BOOKING_PANEL_CLOSED',
        payload: {},
      });
    }
  }, [orchestrator]);

  const updateContext = useCallback((updates: Partial<PanelContext>) => {
    // Extract selectedProviders from updates if present
    const { selectedProviders: _, ...rest } = updates;
    setLocalContext(prev => ({ ...prev, ...rest }));
  }, []);

  const toggleProvider = useCallback((providerId: string) => {
    // Use orchestrator's toggle (it needs full provider object)
    // We'll need to get the provider data from somewhere
    // For now, create a minimal provider object
    const provider: Provider = {
      id: providerId,
      name: '',
      role: '',
      imageUrl: '',
      specialties: [],
      type: 'employee'
    };
    orchestrator.actions.toggleProvider(provider);
  }, [orchestrator]);

  const selectAllProviders = useCallback((providerIds: string[]) => {
    // Clear and select all via orchestrator
    orchestrator.actions.clearSelections();
    providerIds.forEach(id => {
      const provider: Provider = {
        id,
        name: '',
        role: '',
        imageUrl: '',
        specialties: [],
        type: 'employee'
      };
      orchestrator.actions.selectProvider(provider);
    });
  }, [orchestrator]);

  const clearProviders = useCallback(() => {
    orchestrator.actions.clearSelections();
  }, [orchestrator]);

  return (
    <PanelManagerContext.Provider
      value={{
        panelStack,
        activePanel,
        context,
        pushPanel,
        popPanel,
        clearPanels,
        updateContext,
        toggleProvider,
        selectAllProviders,
        clearProviders,
      }}
    >
      {children}
    </PanelManagerContext.Provider>
  );
}

export function usePanelManager() {
  const context = useContext(PanelManagerContext);
  if (context === undefined) {
    throw new Error('usePanelManager must be used within a PanelManagerProvider');
  }
  return context;
}
