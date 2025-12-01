'use client';

/**
 * Vagaro Widget Context
 *
 * Provides React state management for Vagaro booking widget events.
 * Tracks booking flow step, customer info, and provides crop settings.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  subscribeToVagaroEvent,
  startVagaroEventListener,
  EVENT_TO_STEP,
  CROP_CONFIG,
  type VagaroEvent,
  type VagaroWidgetState,
  type BookingFlowStep,
  type CropSettings,
  type BookNowClickedData,
  type TimeSlotClickedData,
  type CustomerLoginData,
} from '@/lib/vagaro-events';

// ============================================================================
// Initial State
// ============================================================================

const initialState: VagaroWidgetState = {
  currentStep: 'idle',
  previousStep: null,
  customerId: null,
  selectedService: null,
  selectedProvider: null,
  selectedTimeSlot: null,
  lastEventTimestamp: null,
  isLoaded: false,
  hasError: false,
};

// ============================================================================
// Actions
// ============================================================================

type Action =
  | { type: 'SET_STEP'; payload: BookingFlowStep }
  | { type: 'SET_CUSTOMER_ID'; payload: string }
  | { type: 'SET_SERVICE'; payload: string }
  | { type: 'SET_PROVIDER'; payload: string }
  | { type: 'SET_TIME_SLOT'; payload: number }
  | { type: 'SET_LOADED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: boolean }
  | { type: 'UPDATE_TIMESTAMP'; payload: number }
  | { type: 'RESET' };

// ============================================================================
// Reducer
// ============================================================================

function vagaroWidgetReducer(
  state: VagaroWidgetState,
  action: Action
): VagaroWidgetState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        previousStep: state.currentStep,
        currentStep: action.payload,
      };

    case 'SET_CUSTOMER_ID':
      return {
        ...state,
        customerId: action.payload,
      };

    case 'SET_SERVICE':
      return {
        ...state,
        selectedService: action.payload,
      };

    case 'SET_PROVIDER':
      return {
        ...state,
        selectedProvider: action.payload,
      };

    case 'SET_TIME_SLOT':
      return {
        ...state,
        selectedTimeSlot: action.payload,
      };

    case 'SET_LOADED':
      return {
        ...state,
        isLoaded: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        hasError: action.payload,
      };

    case 'UPDATE_TIMESTAMP':
      return {
        ...state,
        lastEventTimestamp: action.payload,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// Context Value Type
// ============================================================================

interface VagaroWidgetContextValue {
  state: VagaroWidgetState;
  cropSettings: CropSettings;
  reset: () => void;
}

// ============================================================================
// Context
// ============================================================================

const VagaroWidgetContext = createContext<VagaroWidgetContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface VagaroWidgetProviderProps {
  children: React.ReactNode;
}

export function VagaroWidgetProvider({ children }: VagaroWidgetProviderProps) {
  const [state, dispatch] = useReducer(vagaroWidgetReducer, initialState);

  // Start the event listener immediately when the provider mounts
  // This ensures we catch events even before any subscribers are registered
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[VagaroWidgetProvider] Starting event listener on mount');
      startVagaroEventListener();

      // Also add a raw debug listener to catch ALL postMessages
      // This helps diagnose what messages are actually being sent
      const rawDebugListener = (event: MessageEvent) => {
        // Only log if it looks like it might be from an iframe (not internal React/Next.js)
        if (
          event.data &&
          typeof event.data === 'object' &&
          !event.data.type?.startsWith('webpack') &&
          !event.data.type?.startsWith('next') &&
          !event.data.source?.includes('react')
        ) {
          console.log('[Raw PostMessage]', {
            origin: event.origin,
            type: event.data.type,
            eventName: event.data.eventName,
            keys: Object.keys(event.data).slice(0, 10),
          });
        }
      };

      window.addEventListener('message', rawDebugListener);
      console.log('[VagaroWidgetProvider] Raw postMessage listener attached');

      return () => {
        window.removeEventListener('message', rawDebugListener);
      };
    }
  }, []);

  // Subscribe to all enabled Vagaro events
  useEffect(() => {
    const unsubscribe = subscribeToVagaroEvent('*', (event: VagaroEvent) => {
      // Update timestamp
      dispatch({ type: 'UPDATE_TIMESTAMP', payload: event.timestamp });

      // Update step based on event
      const newStep = EVENT_TO_STEP[event.eventName];
      if (newStep) {
        dispatch({ type: 'SET_STEP', payload: newStep });
      }

      // Extract additional data from specific events
      switch (event.eventName) {
        case 'WidgetLoaded':
          dispatch({ type: 'SET_LOADED', payload: true });
          break;

        case 'BookNowClicked': {
          const data = event.data as BookNowClickedData;
          if (data?.serviceName) {
            dispatch({ type: 'SET_SERVICE', payload: data.serviceName });
          }
          if (data?.customerId) {
            dispatch({ type: 'SET_CUSTOMER_ID', payload: data.customerId });
          }
          break;
        }

        case 'TimeSlotClicked': {
          const data = event.data as TimeSlotClickedData;
          if (data?.serviceProvider) {
            dispatch({ type: 'SET_PROVIDER', payload: data.serviceProvider });
          }
          if (data?.selectedTimeSlot) {
            dispatch({ type: 'SET_TIME_SLOT', payload: data.selectedTimeSlot });
          }
          if (data?.customerId) {
            dispatch({ type: 'SET_CUSTOMER_ID', payload: data.customerId });
          }
          break;
        }

        case 'CustomerLogin': {
          const data = event.data as CustomerLoginData;
          if (data?.customerId) {
            dispatch({ type: 'SET_CUSTOMER_ID', payload: data.customerId });
          }
          break;
        }

        case 'BookingCompleted':
          // Booking is complete - could trigger additional actions here
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Get crop settings based on current step
  const cropSettings = useMemo(() => {
    return CROP_CONFIG[state.currentStep];
  }, [state.currentStep]);

  // Reset function
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo(
    () => ({
      state,
      cropSettings,
      reset,
    }),
    [state, cropSettings, reset]
  );

  return (
    <VagaroWidgetContext.Provider value={value}>
      {children}
    </VagaroWidgetContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useVagaroWidget() {
  const context = useContext(VagaroWidgetContext);
  if (!context) {
    throw new Error('useVagaroWidget must be used within VagaroWidgetProvider');
  }
  return context;
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Get just the current booking flow step.
 */
export function useVagaroStep(): BookingFlowStep {
  const { state } = useVagaroWidget();
  return state.currentStep;
}

/**
 * Get just the crop settings for current step.
 */
export function useVagaroCropSettings(): CropSettings {
  const { cropSettings } = useVagaroWidget();
  return cropSettings;
}

/**
 * Check if the widget is loaded and ready.
 */
export function useVagaroIsLoaded(): boolean {
  const { state } = useVagaroWidget();
  return state.isLoaded;
}
