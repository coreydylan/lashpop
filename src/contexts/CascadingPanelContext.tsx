'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  CascadingPanelState,
  CascadingPanelContextValue,
  CascadingPanelActions,
  PanelStackItem,
  PanelType,
  PanelLevel,
  OpenPanelOptions,
  CategorySelection,
  CascadingPanelEvent,
} from '@/types/cascading-panels';

// ============================================================================
// Context
// ============================================================================

const CascadingPanelContext = createContext<CascadingPanelContextValue | null>(null);

// ============================================================================
// Initial State
// ============================================================================

const getInitialState = (services: any[] = []): CascadingPanelState => ({
  panels: [],
  activeLevel: 0,
  scrollPosition: 0,
  categorySelections: [],
  services,
});

// ============================================================================
// Action Types
// ============================================================================

type Action =
  | { type: 'OPEN_PANEL'; payload: PanelStackItem }
  | { type: 'CLOSE_PANEL'; payload: { panelId: string; closeChildren: boolean } }
  | { type: 'COLLAPSE_PANEL'; payload: string }
  | { type: 'EXPAND_PANEL'; payload: string }
  | { type: 'SET_CLOSING'; payload: string }
  | { type: 'REMOVE_PANEL'; payload: string }
  | { type: 'TOGGLE_CATEGORY'; payload: CategorySelection }
  | { type: 'SELECT_SUBCATEGORY'; payload: { categoryId: string; subcategoryId: string; subcategoryName: string } }
  | { type: 'CLEAR_CATEGORIES' }
  | { type: 'SELECT_SERVICE'; payload: string }
  | { type: 'SELECT_PROVIDER'; payload: string }
  | { type: 'SET_SCROLL_POSITION'; payload: number }
  | { type: 'CLOSE_ALL_PANELS' }
  | { type: 'CLOSE_PANELS_FROM_LEVEL'; payload: number };

// ============================================================================
// Reducer
// ============================================================================

function cascadingPanelReducer(state: CascadingPanelState, action: Action): CascadingPanelState {
  switch (action.type) {
    case 'OPEN_PANEL': {
      const newPanel = action.payload;
      return {
        ...state,
        panels: [...state.panels, newPanel],
        activeLevel: Math.max(state.activeLevel, newPanel.level),
      };
    }

    case 'CLOSE_PANEL': {
      const { panelId, closeChildren } = action.payload;
      const panel = state.panels.find(p => p.id === panelId);

      if (!panel) return state;

      let panelsToClose = [panelId];

      if (closeChildren) {
        // Recursively find all child panels
        const findChildren = (parentId: string): string[] => {
          const children = state.panels.filter(p => p.parentId === parentId);
          return children.flatMap(child => [child.id, ...findChildren(child.id)]);
        };
        panelsToClose = [panelId, ...findChildren(panelId)];
      }

      return {
        ...state,
        panels: state.panels.filter(p => !panelsToClose.includes(p.id)),
        activeLevel: Math.max(
          ...state.panels.filter(p => !panelsToClose.includes(p.id)).map(p => p.level),
          0
        ),
      };
    }

    case 'COLLAPSE_PANEL':
      return {
        ...state,
        panels: state.panels.map(p =>
          p.id === action.payload ? { ...p, isCollapsed: true } : p
        ),
      };

    case 'EXPAND_PANEL':
      return {
        ...state,
        panels: state.panels.map(p =>
          p.id === action.payload ? { ...p, isCollapsed: false } : p
        ),
      };

    case 'SET_CLOSING':
      return {
        ...state,
        panels: state.panels.map(p =>
          p.id === action.payload ? { ...p, isClosing: true } : p
        ),
      };

    case 'REMOVE_PANEL':
      return {
        ...state,
        panels: state.panels.filter(p => p.id !== action.payload),
      };

    case 'TOGGLE_CATEGORY': {
      const exists = state.categorySelections.find(
        c => c.categoryId === action.payload.categoryId
      );

      return {
        ...state,
        categorySelections: exists
          ? state.categorySelections.filter(c => c.categoryId !== action.payload.categoryId)
          : [...state.categorySelections, action.payload],
      };
    }

    case 'SELECT_SUBCATEGORY':
      return {
        ...state,
        categorySelections: state.categorySelections.map(c =>
          c.categoryId === action.payload.categoryId
            ? { ...c, subcategoryId: action.payload.subcategoryId, subcategoryName: action.payload.subcategoryName }
            : c
        ),
      };

    case 'CLEAR_CATEGORIES':
      return {
        ...state,
        categorySelections: [],
      };

    case 'SELECT_SERVICE':
      return {
        ...state,
        selectedServiceId: action.payload,
      };

    case 'SELECT_PROVIDER':
      return {
        ...state,
        selectedProviderId: action.payload,
      };

    case 'SET_SCROLL_POSITION':
      return {
        ...state,
        scrollPosition: action.payload,
      };

    case 'CLOSE_ALL_PANELS':
      return {
        ...state,
        panels: [],
        activeLevel: 0,
      };

    case 'CLOSE_PANELS_FROM_LEVEL':
      return {
        ...state,
        panels: state.panels.filter(p => p.level < action.payload),
        activeLevel: Math.max(
          ...state.panels.filter(p => p.level < action.payload).map(p => p.level),
          0
        ),
      };

    default:
      return state;
  }
}

// ============================================================================
// Event Bus
// ============================================================================

type EventHandler = (event: CascadingPanelEvent) => void;

function createEventBus() {
  const subscribers = new Map<string, Set<EventHandler>>();

  const emit = (event: CascadingPanelEvent) => {
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

interface CascadingPanelProviderProps {
  children: React.ReactNode;
  services?: any[];
}

export function CascadingPanelProvider({ children, services = [] }: CascadingPanelProviderProps) {
  const [state, dispatch] = useReducer(cascadingPanelReducer, getInitialState(services));
  const eventBusRef = useRef(createEventBus());
  const panelIdCounter = useRef(0);
  
  // Keep track of latest state for stable callbacks
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ============================================================================
  // Panel Operations
  // ============================================================================

  const openPanel = useCallback(
    (type: PanelType, data: any, options?: OpenPanelOptions): string => {
      const panelId = `panel-${++panelIdCounter.current}`;
      const currentState = stateRef.current;

      // Determine level based on type
      let level: PanelLevel = 1;
      if (type === 'category-picker') level = 2;
      if (type === 'subcategory-services') level = 3;
      if (['service-detail', 'provider-detail', 'provider-services', 'schedule'].includes(type)) level = 4;

      // Calculate position within level
      const panelsInLevel = currentState.panels.filter(p => p.level === level);
      const position = panelsInLevel.length;

      const newPanel: PanelStackItem = {
        id: panelId,
        type,
        level,
        parentId: options?.parentId,
        position,
        data,
        isCollapsed: false,
        isClosing: false,
        createdAt: Date.now(),
      };

      dispatch({ type: 'OPEN_PANEL', payload: newPanel });

      eventBusRef.current.emit({
        type: 'PANEL_OPENED',
        payload: { panelId, panelType: type },
      });

      return panelId;
    },
    [] // Stable callback - uses ref
  );

  const closePanel = useCallback((panelId: string, closeChildren = true) => {
    const currentState = stateRef.current;
    const panel = currentState.panels.find(p => p.id === panelId);
    if (!panel) return;

    dispatch({ type: 'SET_CLOSING', payload: panelId });

    setTimeout(() => {
      dispatch({ type: 'CLOSE_PANEL', payload: { panelId, closeChildren } });

      eventBusRef.current.emit({
        type: 'PANEL_CLOSED',
        payload: { panelId, panelType: panel.type },
      });
    }, 400); // Match animation duration
  }, []); // Stable callback - uses ref

  const collapsePanel = useCallback((panelId: string) => {
    dispatch({ type: 'COLLAPSE_PANEL', payload: panelId });
    eventBusRef.current.emit({
      type: 'PANEL_COLLAPSED',
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

  // ============================================================================
  // Category Management
  // ============================================================================

  const toggleCategory = useCallback((categoryId: string, categoryName: string) => {
    dispatch({
      type: 'TOGGLE_CATEGORY',
      payload: { categoryId, categoryName },
    });

    eventBusRef.current.emit({
      type: 'CATEGORY_SELECTED',
      payload: { categoryId, categoryName },
    });
  }, []);

  const selectSubcategory = useCallback((categoryId: string, subcategoryId: string, subcategoryName: string) => {
    dispatch({
      type: 'SELECT_SUBCATEGORY',
      payload: { categoryId, subcategoryId, subcategoryName },
    });
  }, []);

  const clearCategories = useCallback(() => {
    dispatch({ type: 'CLEAR_CATEGORIES' });
  }, []);

  // ============================================================================
  // Selection
  // ============================================================================

  const selectService = useCallback((serviceId: string) => {
    dispatch({ type: 'SELECT_SERVICE', payload: serviceId });
  }, []);

  const selectProvider = useCallback((providerId: string) => {
    dispatch({ type: 'SELECT_PROVIDER', payload: providerId });
  }, []);

  // ============================================================================
  // Navigation
  // ============================================================================

  const scrollToPanel = useCallback((panelId: string) => {
    const panelElement = document.getElementById(panelId);
    if (panelElement) {
      panelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const closeAllPanels = useCallback(() => {
    dispatch({ type: 'CLOSE_ALL_PANELS' });
  }, []);

  const closePanelsFromLevel = useCallback((level: number) => {
    dispatch({ type: 'CLOSE_PANELS_FROM_LEVEL', payload: level });
  }, []);

  // ============================================================================
  // Utility (use refs for stable callbacks)
  // ============================================================================

  const getPanelsByLevel = useCallback(
    (level: number) => stateRef.current.panels.filter(p => p.level === level),
    []
  );

  const getPanelById = useCallback(
    (id: string) => stateRef.current.panels.find(p => p.id === id),
    []
  );

  const getChildPanels = useCallback(
    (parentId: string) => stateRef.current.panels.filter(p => p.parentId === parentId),
    []
  );

  // ============================================================================
  // Actions Object (memoized to prevent infinite re-renders)
  // ============================================================================

  const actions: CascadingPanelActions = useMemo(() => ({
    openPanel,
    closePanel,
    collapsePanel,
    expandPanel,
    toggleCategory,
    selectSubcategory,
    clearCategories,
    selectService,
    selectProvider,
    scrollToPanel,
    closeAllPanels,
    closePanelsFromLevel,
    getPanelsByLevel,
    getPanelById,
    getChildPanels,
  }), [
    openPanel,
    closePanel,
    collapsePanel,
    expandPanel,
    toggleCategory,
    selectSubcategory,
    clearCategories,
    selectService,
    selectProvider,
    scrollToPanel,
    closeAllPanels,
    closePanelsFromLevel,
    getPanelsByLevel,
    getPanelById,
    getChildPanels,
  ]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: CascadingPanelContextValue = useMemo(() => ({
    state,
    actions,
  }), [state, actions]);

  return (
    <CascadingPanelContext.Provider value={contextValue}>
      {children}
    </CascadingPanelContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useCascadingPanels() {
  const context = useContext(CascadingPanelContext);
  if (!context) {
    throw new Error('useCascadingPanels must be used within CascadingPanelProvider');
  }
  return context;
}
