'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type {
  BookingOrchestratorState,
  BookingOrchestratorContextValue,
  OrchestratorActions,
  EventBus,
  OrchestratorEvent,
  EventHandler,
  Unsubscribe,
  Service,
  Provider,
  QuizResults,
  SelectProviderOptions,
  SelectServiceOptions,
  ScrollToSectionOptions,
  OpenPortfolioOptions,
  ViewportDimensions,
  PageSection,
} from '@/types/orchestrator';

// ============================================================================
// Context Creation
// ============================================================================

const BookingOrchestratorContext = createContext<BookingOrchestratorContextValue | null>(null);

// ============================================================================
// Initial State
// ============================================================================

const HEADER_HEIGHT = 64;
const DOCKED_DRAWER_HEIGHT = 72;

const initialState: BookingOrchestratorState = {
  selectedServices: [],
  selectedProviders: [],
  selectedCategories: [],
  quizResults: null,
  journey: {
    entryPoint: 'hero',
    currentStep: 'browsing',
    timestamp: Date.now(),
    breadcrumbs: [],
  },
  sections: [],
  portfolio: {
    state: 'closed',
    providerId: null,
    withBookingPanel: false,
  },
  scrollTarget: null,
  highlights: {
    services: [],
    providers: [],
    categories: [],
  },
  viewport: {
    availableHeight: 0,
    topOffset: HEADER_HEIGHT,
    bottomOffset: 0,
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  },
};

// ============================================================================
// Action Types
// ============================================================================

type Action =
  | { type: 'SELECT_SERVICE'; payload: Service }
  | { type: 'DESELECT_SERVICE'; payload: string }
  | { type: 'SELECT_PROVIDER'; payload: Provider }
  | { type: 'DESELECT_PROVIDER'; payload: string }
  | { type: 'TOGGLE_PROVIDER'; payload: Provider }
  | { type: 'SELECT_CATEGORY'; payload: string }
  | { type: 'DESELECT_CATEGORY'; payload: string }
  | { type: 'SET_QUIZ_RESULTS'; payload: QuizResults }
  | { type: 'CLEAR_SELECTIONS' }
  | { type: 'SET_JOURNEY_STEP'; payload: { step: BookingOrchestratorState['journey']['currentStep']; breadcrumb?: string } }
  | { type: 'OPEN_PORTFOLIO'; payload: { providerId: string; withBookingPanel: boolean } }
  | { type: 'CLOSE_PORTFOLIO' }
  | { type: 'COMPRESS_PORTFOLIO' }
  | { type: 'EXPAND_PORTFOLIO' }
  | { type: 'SET_SCROLL_TARGET'; payload: string | null }
  | { type: 'SET_HIGHLIGHTS'; payload: Partial<BookingOrchestratorState['highlights']> }
  | { type: 'REGISTER_SECTION'; payload: PageSection }
  | { type: 'UNREGISTER_SECTION'; payload: string }
  | { type: 'UPDATE_SECTION_BOUNDS'; payload: { id: string; bounds: DOMRect } }
  | { type: 'UPDATE_VIEWPORT'; payload: ViewportDimensions };

// ============================================================================
// Reducer
// ============================================================================

function orchestratorReducer(state: BookingOrchestratorState, action: Action): BookingOrchestratorState {
  switch (action.type) {
    case 'SELECT_SERVICE':
      return {
        ...state,
        selectedServices: [...state.selectedServices, action.payload],
      };

    case 'DESELECT_SERVICE':
      return {
        ...state,
        selectedServices: state.selectedServices.filter((s) => s.id !== action.payload),
      };

    case 'SELECT_PROVIDER':
      if (state.selectedProviders.find((p) => p.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        selectedProviders: [...state.selectedProviders, action.payload],
      };

    case 'DESELECT_PROVIDER':
      return {
        ...state,
        selectedProviders: state.selectedProviders.filter((p) => p.id !== action.payload),
      };

    case 'TOGGLE_PROVIDER':
      const exists = state.selectedProviders.find((p) => p.id === action.payload.id);
      return {
        ...state,
        selectedProviders: exists
          ? state.selectedProviders.filter((p) => p.id !== action.payload.id)
          : [...state.selectedProviders, action.payload],
      };

    case 'SELECT_CATEGORY':
      if (state.selectedCategories.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        selectedCategories: [...state.selectedCategories, action.payload],
      };

    case 'DESELECT_CATEGORY':
      return {
        ...state,
        selectedCategories: state.selectedCategories.filter((c) => c !== action.payload),
      };

    case 'SET_QUIZ_RESULTS':
      return {
        ...state,
        quizResults: action.payload,
      };

    case 'CLEAR_SELECTIONS':
      return {
        ...state,
        selectedServices: [],
        selectedProviders: [],
        selectedCategories: [],
        highlights: {
          services: [],
          providers: [],
          categories: [],
        },
      };

    case 'SET_JOURNEY_STEP':
      return {
        ...state,
        journey: {
          ...state.journey,
          currentStep: action.payload.step,
          breadcrumbs: action.payload.breadcrumb
            ? [...state.journey.breadcrumbs, action.payload.breadcrumb]
            : state.journey.breadcrumbs,
        },
      };

    case 'OPEN_PORTFOLIO':
      return {
        ...state,
        portfolio: {
          state: 'expanded',
          providerId: action.payload.providerId,
          withBookingPanel: action.payload.withBookingPanel,
        },
        journey: {
          ...state.journey,
          currentStep: 'viewing-portfolio',
        },
      };

    case 'CLOSE_PORTFOLIO':
      return {
        ...state,
        portfolio: {
          state: 'closed',
          providerId: null,
          withBookingPanel: false,
        },
      };

    case 'COMPRESS_PORTFOLIO':
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          state: 'compressed',
          withBookingPanel: true,
        },
      };

    case 'EXPAND_PORTFOLIO':
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          state: 'expanded',
          withBookingPanel: false,
        },
      };

    case 'SET_SCROLL_TARGET':
      return {
        ...state,
        scrollTarget: action.payload,
      };

    case 'SET_HIGHLIGHTS':
      return {
        ...state,
        highlights: {
          ...state.highlights,
          ...action.payload,
        },
      };

    case 'REGISTER_SECTION':
      return {
        ...state,
        sections: [...state.sections.filter((s) => s.id !== action.payload.id), action.payload],
      };

    case 'UNREGISTER_SECTION':
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.payload),
      };

    case 'UPDATE_SECTION_BOUNDS':
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === action.payload.id
            ? {
                ...section,
                bounds: {
                  top: action.payload.bounds.top,
                  bottom: action.payload.bounds.bottom,
                  height: action.payload.bounds.height,
                },
              }
            : section
        ),
      };

    case 'UPDATE_VIEWPORT':
      return {
        ...state,
        viewport: action.payload,
      };

    default:
      return state;
  }
}

// ============================================================================
// Event Bus Implementation
// ============================================================================

function createEventBus(): EventBus {
  const subscribers = new Map<string, Set<EventHandler>>();

  const emit = (event: OrchestratorEvent) => {
    // Notify specific type subscribers
    const typeSubscribers = subscribers.get(event.type);
    if (typeSubscribers) {
      typeSubscribers.forEach((handler) => handler(event));
    }

    // Notify wildcard subscribers
    const wildcardSubscribers = subscribers.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach((handler) => handler(event));
    }
  };

  const subscribe = (type: string, handler: EventHandler): Unsubscribe => {
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
// Provider Component
// ============================================================================

interface BookingOrchestratorProviderProps {
  children: React.ReactNode;
}

export function BookingOrchestratorProvider({ children }: BookingOrchestratorProviderProps) {
  const [state, dispatch] = useReducer(orchestratorReducer, initialState);
  const eventBusRef = useRef<EventBus>(createEventBus());

  // ============================================================================
  // Viewport Management
  // ============================================================================

  const updateViewportDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;

    const windowHeight = window.innerHeight;
    let topOffset = HEADER_HEIGHT;

    // Calculate top offset based on docked drawers
    const discoverDrawer = document.querySelector('[data-drawer="discover"]');
    const servicesDrawer = document.querySelector('[data-drawer="services"]');

    if (discoverDrawer && discoverDrawer.getAttribute('data-state') === 'docked') {
      topOffset += DOCKED_DRAWER_HEIGHT;
    }
    if (servicesDrawer && servicesDrawer.getAttribute('data-state') === 'docked') {
      topOffset += DOCKED_DRAWER_HEIGHT;
    }

    const availableHeight = windowHeight - topOffset;

    const viewport: ViewportDimensions = {
      availableHeight,
      topOffset,
      bottomOffset: 0,
      windowHeight,
    };

    dispatch({ type: 'UPDATE_VIEWPORT', payload: viewport });
    eventBusRef.current.emit({ type: 'VIEWPORT_RESIZED', payload: viewport });
  }, []);

  // Use stateRef to avoid recreating this callback when viewport changes
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getAvailableHeight = useCallback(() => {
    return stateRef.current.viewport.availableHeight;
  }, []); // Stable callback - uses ref

  // Listen for window resize
  useEffect(() => {
    updateViewportDimensions();
    window.addEventListener('resize', updateViewportDimensions);
    return () => window.removeEventListener('resize', updateViewportDimensions);
  }, [updateViewportDimensions]);

  // ============================================================================
  // Section Registry
  // ============================================================================

  const registerSection = useCallback((id: string, element: HTMLElement): Unsubscribe => {
    const bounds = element.getBoundingClientRect();
    const section: PageSection = {
      id,
      element,
      bounds: {
        top: bounds.top,
        bottom: bounds.bottom,
        height: bounds.height,
      },
      isVisible: false,
    };

    dispatch({ type: 'REGISTER_SECTION', payload: section });
    eventBusRef.current.emit({ type: 'SECTION_REGISTERED', payload: { sectionId: id } });

    return () => {
      dispatch({ type: 'UNREGISTER_SECTION', payload: id });
    };
  }, []);

  const updateSectionBounds = useCallback((id: string, bounds: DOMRect) => {
    dispatch({ type: 'UPDATE_SECTION_BOUNDS', payload: { id, bounds } });
  }, []);

  // ============================================================================
  // Navigation Actions (Defined first because they are dependencies)
  // ============================================================================

  const scrollToSection = useCallback(
    (sectionId: string, options?: ScrollToSectionOptions) => {
      const currentState = stateRef.current;
      const section = currentState.sections.find((s) => s.id === sectionId);
      if (!section?.element) {
        console.warn(`Section "${sectionId}" not found in registry`);
        return;
      }

      const offset = options?.offset || currentState.viewport.topOffset + 20;
      const elementTop = section.element.getBoundingClientRect().top + window.scrollY;
      const scrollTo = elementTop - offset;

      window.scrollTo({
        top: scrollTo,
        behavior: options?.smooth !== false ? 'smooth' : 'auto',
      });

      dispatch({ type: 'SET_SCROLL_TARGET', payload: sectionId });
      eventBusRef.current.emit({
        type: 'SCROLL_REQUEST',
        payload: { targetId: sectionId, offset, smooth: options?.smooth },
      });

      if (options?.highlight) {
        dispatch({
          type: 'SET_HIGHLIGHTS',
          payload: { providers: options.highlight },
        });
      }

      // Clear scroll target after animation
      setTimeout(() => {
        dispatch({ type: 'SET_SCROLL_TARGET', payload: null });
        eventBusRef.current.emit({ type: 'SECTION_VISIBLE', payload: { sectionId } });
      }, 800);
    },
    [] // Stable callback - uses stateRef
  );

  const openPortfolio = useCallback((providerId: string, options?: OpenPortfolioOptions) => {
    dispatch({
      type: 'OPEN_PORTFOLIO',
      payload: { providerId, withBookingPanel: options?.withBookingPanel || false },
    });

    eventBusRef.current.emit({
      type: 'PORTFOLIO_OPENED',
      payload: { providerId },
    });

    if (options?.scrollToView) {
      setTimeout(() => scrollToSection('team'), 100);
    }
  }, [scrollToSection]);

  const closePortfolio = useCallback(() => {
    const providerId = stateRef.current.portfolio.providerId;
    dispatch({ type: 'CLOSE_PORTFOLIO' });

    if (providerId) {
      eventBusRef.current.emit({
        type: 'PORTFOLIO_CLOSED',
        payload: { providerId },
      });
    }
  }, []); // Stable callback - uses stateRef

  const compressPortfolio = useCallback(() => {
    const providerId = stateRef.current.portfolio.providerId;
    dispatch({ type: 'COMPRESS_PORTFOLIO' });

    if (providerId) {
      eventBusRef.current.emit({
        type: 'PORTFOLIO_COMPRESSED',
        payload: { providerId },
      });
    }
  }, []); // Stable callback - uses stateRef

  const expandPortfolio = useCallback(() => {
    const providerId = stateRef.current.portfolio.providerId;
    dispatch({ type: 'EXPAND_PORTFOLIO' });

    if (providerId) {
      eventBusRef.current.emit({
        type: 'PORTFOLIO_EXPANDED',
        payload: { providerId },
      });
    }
  }, []); // Stable callback - uses stateRef

  // ============================================================================
  // Selection Actions
  // ============================================================================

  const selectService = useCallback(
    (service: Service, options?: SelectServiceOptions) => {
      dispatch({ type: 'SELECT_SERVICE', payload: service });
      dispatch({ type: 'SET_JOURNEY_STEP', payload: { step: 'service-selected', breadcrumb: service.name } });

      eventBusRef.current.emit({
        type: 'SERVICE_SELECTED',
        payload: { service, source: options?.source || 'drawer' },
      });
    },
    []
  );

  const selectProvider = useCallback(
    (provider: Provider, options?: SelectProviderOptions) => {
      dispatch({ type: 'SELECT_PROVIDER', payload: provider });
      dispatch({ type: 'SET_JOURNEY_STEP', payload: { step: 'provider-selected', breadcrumb: provider.name } });

      eventBusRef.current.emit({
        type: 'PROVIDER_SELECTED',
        payload: { provider, source: options?.source || 'panel' },
      });

      // Handle side effects
      if (options?.scrollToTeam) {
        setTimeout(() => scrollToSection('team', { highlight: [provider.id] }), 100);
      }

      if (options?.openPortfolio) {
        setTimeout(() => openPortfolio(provider.id, { withBookingPanel: options.openBookingPanel }), 200);
      }

      if (options?.openBookingPanel) {
        setTimeout(() => compressPortfolio(), 300);
        eventBusRef.current.emit({
          type: 'BOOKING_PANEL_OPENED',
          payload: { providerId: provider.id },
        });
      }
    },
    [scrollToSection, openPortfolio, compressPortfolio]
  );

  const toggleProvider = useCallback((provider: Provider) => {
    dispatch({ type: 'TOGGLE_PROVIDER', payload: provider });
  }, []);

  const selectCategory = useCallback((category: string) => {
    dispatch({ type: 'SELECT_CATEGORY', payload: category });
    eventBusRef.current.emit({
      type: 'CATEGORY_FILTERED',
      payload: { categories: [category] },
    });
  }, []);

  const clearSelections = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTIONS' });
  }, []);

  // ============================================================================
  // Orchestrated Workflows
  // ============================================================================

  const initiateBookingFromTeamMember = useCallback(
    async (memberId: string) => {
      // This will be implemented when we integrate with actual team data
      // For now, emit the event so components can react
      eventBusRef.current.emit({
        type: 'TEAM_MEMBER_CLICKED',
        payload: { memberId, action: 'book-service' },
      });

      // Workflow: Open services drawer with provider pre-selected
      dispatch({ type: 'SET_JOURNEY_STEP', payload: { step: 'provider-selected' } });
    },
    []
  );

  const initiatePortfolioFromService = useCallback(
    async (serviceId: string, providerId: string) => {
      const currentState = stateRef.current;
      const section = currentState.sections.find((s) => s.id === 'team');
      if (!section?.element) {
        console.warn('Team section not found in registry');
        return;
      }

      // Close any open panels
      eventBusRef.current.emit({
        type: 'BOOKING_PANEL_CLOSED',
        payload: {},
      });

      // Scroll to team section
      const offset = currentState.viewport.topOffset + 20;
      const elementTop = section.element.getBoundingClientRect().top + window.scrollY;
      const scrollTo = elementTop - offset;

      window.scrollTo({
        top: scrollTo,
        behavior: 'smooth',
      });

      dispatch({ type: 'SET_HIGHLIGHTS', payload: { providers: [providerId] } });

      // Wait for scroll to complete
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Open portfolio
      dispatch({
        type: 'OPEN_PORTFOLIO',
        payload: { providerId, withBookingPanel: false },
      });

      eventBusRef.current.emit({
        type: 'PORTFOLIO_OPENED',
        payload: { providerId },
      });
    },
    [] // Stable callback - uses stateRef
  );

  const completeQuizWorkflow = useCallback(
    async (results: QuizResults) => {
      dispatch({ type: 'SET_QUIZ_RESULTS', payload: results });
      eventBusRef.current.emit({
        type: 'QUIZ_COMPLETED',
        payload: results,
      });

      // Set categories from quiz results
      results.serviceCategory.forEach((category) => {
        dispatch({ type: 'SELECT_CATEGORY', payload: category });
      });

      // Update journey
      dispatch({
        type: 'SET_JOURNEY_STEP',
        payload: { step: 'browsing', breadcrumb: 'Quiz Completed' },
      });

      // Orchestrated sequence will be handled by drawer context
    },
    []
  );

  // ============================================================================
  // Actions Object (memoized to prevent infinite re-renders)
  // ============================================================================

  const actions: OrchestratorActions = React.useMemo(() => ({
    selectService,
    selectProvider,
    toggleProvider,
    selectCategory,
    clearSelections,
    scrollToSection,
    openPortfolio,
    closePortfolio,
    compressPortfolio,
    expandPortfolio,
    initiateBookingFromTeamMember,
    initiatePortfolioFromService,
    completeQuizWorkflow,
    registerSection,
    updateSectionBounds,
    updateViewportDimensions,
    getAvailableHeight,
  }), [
    selectService,
    selectProvider,
    toggleProvider,
    selectCategory,
    clearSelections,
    scrollToSection,
    openPortfolio,
    closePortfolio,
    compressPortfolio,
    expandPortfolio,
    initiateBookingFromTeamMember,
    initiatePortfolioFromService,
    completeQuizWorkflow,
    registerSection,
    updateSectionBounds,
    updateViewportDimensions,
    getAvailableHeight,
  ]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: BookingOrchestratorContextValue = {
    state,
    actions,
    eventBus: eventBusRef.current,
  };

  return (
    <BookingOrchestratorContext.Provider value={contextValue}>{children}</BookingOrchestratorContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useBookingOrchestrator() {
  const context = useContext(BookingOrchestratorContext);
  if (!context) {
    throw new Error('useBookingOrchestrator must be used within BookingOrchestratorProvider');
  }
  return context;
}

// ============================================================================
// Convenience Hooks
// ============================================================================

export function useOrchestratorState() {
  const { state } = useBookingOrchestrator();
  return state;
}

export function useOrchestratorActions() {
  const { actions } = useBookingOrchestrator();
  return actions;
}

export function useOrchestratorEvents() {
  const { eventBus } = useBookingOrchestrator();
  return eventBus;
}