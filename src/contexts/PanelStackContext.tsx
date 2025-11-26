'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  PanelStackState,
  PanelStackContextValue,
  PanelStackActions,
  Panel,
  PanelType,
  PanelLevel,
  PanelState,
  OpenPanelOptions,
  PanelStackEvent,
  HEADER_HEIGHT,
} from '@/types/panel-stack';

// ============================================================================
// Context
// ============================================================================

const PanelStackContext = createContext<PanelStackContextValue | null>(null);

// ============================================================================
// Initial State
// ============================================================================

const getInitialState = (services: any[] = []): PanelStackState => ({
  panels: [],
  expandedByLevel: {},
  categorySelections: [],
  totalPanelHeight: 0,
  pageTopPadding: 0,
  visiblePanelIds: [],
  maxVisiblePanels: 8, // Will be updated based on viewport
  isUserInteracting: false,
  services,
});

// ============================================================================
// Action Types
// ============================================================================

type Action =
  | { type: 'OPEN_PANEL'; payload: Panel }
  | { type: 'CLOSE_PANEL'; payload: string }
  | { type: 'DOCK_PANEL'; payload: string }
  | { type: 'EXPAND_PANEL'; payload: string }
  | { type: 'CLOSE_ALL' }
  | { type: 'DOCK_ALL' }
  | { type: 'CLOSE_PANELS_FROM_LEVEL'; payload: PanelLevel }
  | { type: 'SELECT_CATEGORY'; payload: { categoryId: string; categoryName: string } }
  | { type: 'DESELECT_CATEGORY'; payload: string }
  | { type: 'UPDATE_PANEL_DATA'; payload: { panelId: string; data: any } }
  | { type: 'UPDATE_PANEL_SUMMARY'; payload: { panelId: string; summary: string } }
  | { type: 'UPDATE_TOTAL_HEIGHT'; payload: number }
  | { type: 'SET_INTERACTING'; payload: boolean };

// ============================================================================
// Reducer
// ============================================================================

function panelStackReducer(state: PanelStackState, action: Action): PanelStackState {
  switch (action.type) {
    case 'OPEN_PANEL': {
      const newPanel = action.payload;

      // Check if panel of same type already exists at same level
      const existingIndex = state.panels.findIndex(
        p => p.type === newPanel.type && p.level === newPanel.level && p.data.categoryId === newPanel.data.categoryId
      );

      let panels = [...state.panels];

      if (existingIndex >= 0) {
        // Replace existing panel
        panels[existingIndex] = { ...newPanel, state: 'expanded' };
      } else {
        // Add new panel
        panels.push(newPanel);
      }

      // Update expanded tracking
      const expandedByLevel = { ...state.expandedByLevel };
      if (newPanel.state === 'expanded') {
        expandedByLevel[newPanel.level] = newPanel.id;
      }

      return {
        ...state,
        panels,
        expandedByLevel,
      };
    }

    case 'CLOSE_PANEL': {
      const panelId = action.payload;
      const panel = state.panels.find(p => p.id === panelId);

      if (!panel) return state;

      // Find all children recursively
      const findChildren = (parentId: string): string[] => {
        const children = state.panels.filter(p => p.parentId === parentId);
        return children.flatMap(child => [child.id, ...findChildren(child.id)]);
      };

      const panelsToClose = [panelId, ...findChildren(panelId)];

      // Remove closed panels
      const panels = state.panels.filter(p => !panelsToClose.includes(p.id));

      // Update expanded tracking
      const expandedByLevel = { ...state.expandedByLevel };
      panelsToClose.forEach(id => {
        const p = state.panels.find(panel => panel.id === id);
        if (p && expandedByLevel[p.level] === id) {
          delete expandedByLevel[p.level];
        }
      });

      // If closed panel was expanded, expand most recent sibling at same level
      if (panel.state === 'expanded') {
        const siblings = panels.filter(p =>
          p.level === panel.level &&
          p.state === 'docked'
        );

        if (siblings.length > 0) {
          const mostRecent = siblings.sort((a, b) =>
            b.lastInteractedAt - a.lastInteractedAt
          )[0];

          mostRecent.state = 'expanded';
          expandedByLevel[mostRecent.level] = mostRecent.id;
        }
      }

      return {
        ...state,
        panels,
        expandedByLevel,
      };
    }

    case 'DOCK_PANEL': {
      const panelId = action.payload;

      return {
        ...state,
        panels: state.panels.map(p =>
          p.id === panelId ? { ...p, state: 'docked' as PanelState } : p
        ),
        expandedByLevel: {
          ...state.expandedByLevel,
          [state.panels.find(p => p.id === panelId)?.level || 1]: undefined,
        },
      };
    }

    case 'EXPAND_PANEL': {
      const panelId = action.payload;
      const panel = state.panels.find(p => p.id === panelId);

      if (!panel) return state;

      let panels = [...state.panels];

      // 1. Expand target panel
      panels = panels.map(p =>
        p.id === panelId
          ? { ...p, state: 'expanded' as PanelState, lastInteractedAt: Date.now() }
          : p
      );

      // 2. Dock siblings at same level
      panels = panels.map(p =>
        p.level === panel.level && p.id !== panelId
          ? { ...p, state: 'docked' as PanelState }
          : p
      );

      // 3. Dock all panels below (higher level numbers)
      panels = panels.map(p =>
        p.level > panel.level
          ? { ...p, state: 'docked' as PanelState }
          : p
      );

      // Update expanded tracking
      const expandedByLevel = { ...state.expandedByLevel };
      expandedByLevel[panel.level] = panelId;

      return {
        ...state,
        panels,
        expandedByLevel,
      };
    }

    case 'CLOSE_ALL':
      return {
        ...state,
        panels: [],
        expandedByLevel: {},
        categorySelections: [],
      };

    case 'DOCK_ALL':
      return {
        ...state,
        panels: state.panels.map(p => ({ ...p, state: 'docked' as PanelState })),
        expandedByLevel: {},
      };

    case 'CLOSE_PANELS_FROM_LEVEL':
      return {
        ...state,
        panels: state.panels.filter(p => p.level < action.payload),
        expandedByLevel: Object.fromEntries(
          Object.entries(state.expandedByLevel).filter(([level]) => Number(level) < action.payload)
        ) as PanelStackState['expandedByLevel'],
      };

    case 'SELECT_CATEGORY':
      return {
        ...state,
        categorySelections: [
          ...state.categorySelections.filter(c => c.categoryId !== action.payload.categoryId),
          action.payload,
        ],
      };

    case 'DESELECT_CATEGORY':
      return {
        ...state,
        categorySelections: state.categorySelections.filter(c => c.categoryId !== action.payload),
      };

    case 'UPDATE_PANEL_DATA':
      return {
        ...state,
        panels: state.panels.map(p =>
          p.id === action.payload.panelId
            ? { ...p, data: { ...p.data, ...action.payload.data } }
            : p
        ),
      };

    case 'UPDATE_PANEL_SUMMARY': {
      // Check if summary is actually different to avoid loops
      const panelToUpdate = state.panels.find(p => p.id === action.payload.panelId);
      if (panelToUpdate && panelToUpdate.summary === action.payload.summary) {
        return state;
      }

      return {
        ...state,
        panels: state.panels.map(p =>
          p.id === action.payload.panelId
            ? { ...p, summary: action.payload.summary }
            : p
        ),
      };
    }

    case 'UPDATE_TOTAL_HEIGHT':
      return {
        ...state,
        totalPanelHeight: action.payload,
        pageTopPadding: action.payload,
      };

    case 'SET_INTERACTING':
      return {
        ...state,
        isUserInteracting: action.payload,
      };

    default:
      return state;
  }
}

// ============================================================================
// Event Bus
// ============================================================================

type EventHandler = (event: PanelStackEvent) => void;

function createEventBus() {
  const subscribers = new Map<string, Set<EventHandler>>();

  const emit = (event: PanelStackEvent) => {
    const typeSubscribers = subscribers.get(event.type);
    if (typeSubscribers) {
      typeSubscribers.forEach(handler => handler(event));
    }

    const wildcardSubscribers = subscribers.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach(handler => handler(event));
    }
  };

  const subscribe = (type: string, handler: EventHandler) => {
    if (!subscribers.has(type)) {
      subscribers.set(type, new Set());
    }
    subscribers.get(type)!.add(handler);

    return () => {
      const typeSubscribers = subscribers.get(type);
      if (typeSubscribers) {
        typeSubscribers.delete(handler);
        if (typeSubscribers.size === 0) {
          subscribers.delete(type);
        }
      }
    };
  };

  return { emit, subscribe };
}

// ============================================================================
// Provider
// ============================================================================

interface PanelStackProviderProps {
  children: React.ReactNode;
  services?: any[];
}

let panelIdCounter = 0;

export function PanelStackProvider({ children, services = [] }: PanelStackProviderProps) {
  const [state, dispatch] = useReducer(panelStackReducer, getInitialState(services));
  const eventBusRef = useRef(createEventBus());
  
  // Keep track of latest state for stable callbacks
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Update max visible panels based on viewport
  useEffect(() => {
    const updateMaxPanels = () => {
      const isMobile = window.innerWidth < 768;
      dispatch({
        type: 'UPDATE_PANEL_DATA',
        payload: {
          panelId: 'viewport',
          data: { maxVisiblePanels: isMobile ? 4 : 8 },
        },
      });
    };

    updateMaxPanels();
    window.addEventListener('resize', updateMaxPanels);
    return () => window.removeEventListener('resize', updateMaxPanels);
  }, []);

  // ============================================================================
  // Panel Operations
  // ============================================================================

  const openPanel = useCallback(
    (type: PanelType, data: any, options?: OpenPanelOptions): string => {
      const panelId = `panel-${++panelIdCounter}`;
      const currentState = stateRef.current;

      // Determine level based on type
      let level: PanelLevel = 1;
      if (type === 'service-panel') level = 2;
      if (type === 'service-detail' || type === 'vagaro-widget') level = 3;
      if (type === 'schedule') level = 4;

      // Calculate position within level
      const panelsInLevel = currentState.panels.filter(p => p.level === level);
      const position = options?.insertAtPosition ?? panelsInLevel.length;

      const newPanel: Panel = {
        id: panelId,
        type,
        level,
        state: options?.autoExpand === false ? 'docked' : 'expanded',
        parentId: options?.parentId,
        position,
        data,
        createdAt: Date.now(),
        lastInteractedAt: Date.now(),
        swipeEnabled: level === 2, // Enable swipe on service panels
      };

      dispatch({ type: 'OPEN_PANEL', payload: newPanel });

      // Emit event
      eventBusRef.current.emit({
        type: 'PANEL_OPENED',
        payload: { panelId, panelType: type },
      });

      // Scroll to top only if explicitly requested (default: false)
      if (options?.scrollToTop === true) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      return panelId;
    },
    [] // Stable callback
  );

  const closePanel = useCallback((panelId: string) => {
    const currentState = stateRef.current;
    const panel = currentState.panels.find(p => p.id === panelId);
    if (!panel) return;

    dispatch({ type: 'CLOSE_PANEL', payload: panelId });

    eventBusRef.current.emit({
      type: 'PANEL_CLOSED',
      payload: { panelId, panelType: panel.type },
    });
  }, []); // Stable callback

  const dockPanel = useCallback((panelId: string) => {
    dispatch({ type: 'DOCK_PANEL', payload: panelId });
    eventBusRef.current.emit({
      type: 'PANEL_DOCKED',
      payload: { panelId },
    });
  }, []);

  const expandPanel = useCallback((panelId: string) => {
    dispatch({ type: 'EXPAND_PANEL', payload: panelId });
    eventBusRef.current.emit({
      type: 'PANEL_EXPANDED',
      payload: { panelId },
    });
  }, []);

  const togglePanel = useCallback((panelId: string) => {
    const currentState = stateRef.current;
    const panel = currentState.panels.find(p => p.id === panelId);
    if (!panel) return;

    if (panel.state === 'expanded') {
      dockPanel(panelId);
    } else {
      expandPanel(panelId);
    }
  }, [dockPanel, expandPanel]); // Stable dependencies

  const closeAll = useCallback(() => {
    dispatch({ type: 'CLOSE_ALL' });
  }, []);

  const dockAll = useCallback(() => {
    dispatch({ type: 'DOCK_ALL' });
  }, []);

  const closePanelsFromLevel = useCallback((level: PanelLevel) => {
    dispatch({ type: 'CLOSE_PANELS_FROM_LEVEL', payload: level });
  }, []);

  const selectCategory = useCallback((categoryId: string, categoryName: string) => {
    dispatch({ type: 'SELECT_CATEGORY', payload: { categoryId, categoryName } });
    eventBusRef.current.emit({
      type: 'CATEGORY_SELECTED',
      payload: { categoryId, categoryName },
    });
  }, []);

  const deselectCategory = useCallback((categoryId: string) => {
    dispatch({ type: 'DESELECT_CATEGORY', payload: categoryId });
  }, []);

  const expandNextServicePanel = useCallback(() => {
    const currentState = stateRef.current;
    const servicePanels = currentState.panels.filter(p => p.level === 2).sort((a, b) => a.position - b.position);
    const currentExpanded = servicePanels.find(p => p.state === 'expanded');

    if (!currentExpanded && servicePanels.length > 0) {
      expandPanel(servicePanels[0].id);
      return;
    }

    const currentIndex = servicePanels.findIndex(p => p.id === currentExpanded?.id);
    const nextIndex = (currentIndex + 1) % servicePanels.length;

    if (servicePanels[nextIndex]) {
      expandPanel(servicePanels[nextIndex].id);
    }
  }, [expandPanel]);

  const expandPreviousServicePanel = useCallback(() => {
    const currentState = stateRef.current;
    const servicePanels = currentState.panels.filter(p => p.level === 2).sort((a, b) => a.position - b.position);
    const currentExpanded = servicePanels.find(p => p.state === 'expanded');

    if (!currentExpanded && servicePanels.length > 0) {
      expandPanel(servicePanels[servicePanels.length - 1].id);
      return;
    }

    const currentIndex = servicePanels.findIndex(p => p.id === currentExpanded?.id);
    const prevIndex = currentIndex === 0 ? servicePanels.length - 1 : currentIndex - 1;

    if (servicePanels[prevIndex]) {
      expandPanel(servicePanels[prevIndex].id);
    }
  }, [expandPanel]);

  const getPanelById = useCallback((id: string) => {
    return stateRef.current.panels.find(p => p.id === id);
  }, []);

  const getPanelsByLevel = useCallback((level: PanelLevel) => {
    return stateRef.current.panels.filter(p => p.level === level);
  }, []);

  const getChildPanels = useCallback((parentId: string) => {
    return stateRef.current.panels.filter(p => p.parentId === parentId);
  }, []);

  const updatePanelData = useCallback((panelId: string, data: any) => {
    dispatch({ type: 'UPDATE_PANEL_DATA', payload: { panelId, data } });
  }, []);

  const updatePanelSummary = useCallback((panelId: string, summary: string) => {
    dispatch({ type: 'UPDATE_PANEL_SUMMARY', payload: { panelId, summary } });
  }, []);

  const actions: PanelStackActions = useMemo(() => ({
    openPanel,
    closePanel,
    dockPanel,
    expandPanel,
    togglePanel,
    closeAll,
    dockAll,
    closePanelsFromLevel,
    selectCategory,
    deselectCategory,
    expandNextServicePanel,
    expandPreviousServicePanel,
    getPanelById,
    getPanelsByLevel,
    getChildPanels,
    updatePanelData,
    updatePanelSummary,
  }), [
    openPanel,
    closePanel,
    dockPanel,
    expandPanel,
    togglePanel,
    closeAll,
    dockAll,
    closePanelsFromLevel,
    selectCategory,
    deselectCategory,
    expandNextServicePanel,
    expandPreviousServicePanel,
    getPanelById,
    getPanelsByLevel,
    getChildPanels,
    updatePanelData,
    updatePanelSummary,
  ]);

  const value: PanelStackContextValue = useMemo(() => ({
    state,
    actions,
  }), [state, actions]);

  return (
    <PanelStackContext.Provider value={value}>
      {children}
    </PanelStackContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function usePanelStack() {
  const context = useContext(PanelStackContext);
  if (!context) {
    throw new Error('usePanelStack must be used within PanelStackProvider');
  }
  return context;
}
