'use client';

/**
 * Dev Mode Context
 *
 * Provides development tools overlay for debugging and configuration.
 * Activated by clicking the LashPop logo 5 times in quick succession.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import type { BookingFlowStep, CropSettings, VagaroEvent } from '@/lib/vagaro-events';
import { CROP_CONFIG } from '@/lib/vagaro-events';

// ============================================================================
// Types
// ============================================================================

export interface DevModeEvent {
  id: string;
  eventName: string;
  timestamp: number;
  data: any;
  receivedAt: Date;
}

interface DevModeState {
  isEnabled: boolean;
  isPanelOpen: boolean;
  activeTab: 'events' | 'crops';
  events: DevModeEvent[];
  cropOverrides: Partial<Record<BookingFlowStep, CropSettings>>;
  isLivePreview: boolean;
  simulatedStep: BookingFlowStep | null; // Manual step override for testing crops
}

interface DevModeContextValue {
  state: DevModeState;
  actions: {
    enable: () => void;
    disable: () => void;
    toggle: () => void;
    openPanel: () => void;
    closePanel: () => void;
    setActiveTab: (tab: 'events' | 'crops') => void;
    logEvent: (event: VagaroEvent) => void;
    clearEvents: () => void;
    setCropOverride: (step: BookingFlowStep, settings: CropSettings) => void;
    resetCropOverride: (step: BookingFlowStep) => void;
    resetAllCropOverrides: () => void;
    setLivePreview: (enabled: boolean) => void;
    getCropSettings: (step: BookingFlowStep) => CropSettings;
    exportCropConfig: () => string;
    setSimulatedStep: (step: BookingFlowStep | null) => void;
  };
  registerLogoClick: () => void;
}

// ============================================================================
// Context
// ============================================================================

// Exported for direct useContext access (e.g., from VagaroWidgetPanel)
export const DevModeContext = createContext<DevModeContextValue | null>(null);

// ============================================================================
// Constants
// ============================================================================

const CLICK_THRESHOLD = 5;
const CLICK_TIMEOUT_MS = 2000;
const MAX_EVENTS = 100;
const STORAGE_KEY = 'lashpop-dev-mode';

// ============================================================================
// Provider
// ============================================================================

interface DevModeProviderProps {
  children: React.ReactNode;
}

export function DevModeProvider({ children }: DevModeProviderProps) {
  const [state, setState] = useState<DevModeState>({
    isEnabled: false,
    isPanelOpen: false,
    activeTab: 'events',
    events: [],
    cropOverrides: {},
    isLivePreview: true,
    simulatedStep: null,
  });

  // Track logo clicks for activation
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          isEnabled: parsed.isEnabled || false,
          cropOverrides: parsed.cropOverrides || {},
          isLivePreview: parsed.isLivePreview ?? true,
        }));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isEnabled: state.isEnabled,
          cropOverrides: state.cropOverrides,
          isLivePreview: state.isLivePreview,
        })
      );
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [state.isEnabled, state.cropOverrides, state.isLivePreview]);

  // Register logo click for activation sequence
  const registerLogoClick = useCallback(() => {
    // Clear existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickCountRef.current += 1;

    if (clickCountRef.current >= CLICK_THRESHOLD) {
      // Activate dev mode
      setState(prev => ({
        ...prev,
        isEnabled: true,
        isPanelOpen: true,
      }));
      clickCountRef.current = 0;

      // Visual feedback
      if (typeof window !== 'undefined') {
        console.log(
          '%c[Dev Mode] Activated!',
          'background: #C9A9A6; color: #1C1917; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
        );
      }
    } else {
      // Set timeout to reset click count
      clickTimeoutRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, CLICK_TIMEOUT_MS);
    }
  }, []);

  // Actions
  const enable = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: true }));
  }, []);

  const disable = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: false, isPanelOpen: false }));
  }, []);

  const toggle = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled,
      isPanelOpen: !prev.isEnabled ? true : prev.isPanelOpen,
    }));
  }, []);

  const openPanel = useCallback(() => {
    setState(prev => ({ ...prev, isPanelOpen: true }));
  }, []);

  const closePanel = useCallback(() => {
    setState(prev => ({ ...prev, isPanelOpen: false }));
  }, []);

  const setActiveTab = useCallback((tab: 'events' | 'crops') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const logEvent = useCallback((event: VagaroEvent) => {
    const devEvent: DevModeEvent = {
      id: `${event.eventName}-${event.timestamp}-${Math.random().toString(36).slice(2, 7)}`,
      eventName: event.eventName,
      timestamp: event.timestamp,
      data: event.data,
      receivedAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      events: [devEvent, ...prev.events].slice(0, MAX_EVENTS),
    }));
  }, []);

  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, events: [] }));
  }, []);

  const setCropOverride = useCallback(
    (step: BookingFlowStep, settings: CropSettings) => {
      setState(prev => ({
        ...prev,
        cropOverrides: {
          ...prev.cropOverrides,
          [step]: settings,
        },
      }));
    },
    []
  );

  const resetCropOverride = useCallback((step: BookingFlowStep) => {
    setState(prev => {
      const { [step]: _, ...rest } = prev.cropOverrides;
      return {
        ...prev,
        cropOverrides: rest,
      };
    });
  }, []);

  const resetAllCropOverrides = useCallback(() => {
    setState(prev => ({ ...prev, cropOverrides: {} }));
  }, []);

  const setLivePreview = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, isLivePreview: enabled }));
  }, []);

  const setSimulatedStep = useCallback((step: BookingFlowStep | null) => {
    setState(prev => ({ ...prev, simulatedStep: step }));
  }, []);

  const getCropSettings = useCallback(
    (step: BookingFlowStep): CropSettings => {
      if (state.isLivePreview && state.cropOverrides[step]) {
        return state.cropOverrides[step]!;
      }
      return CROP_CONFIG[step];
    },
    [state.isLivePreview, state.cropOverrides]
  );

  const exportCropConfig = useCallback((): string => {
    const config = { ...CROP_CONFIG };

    // Apply overrides
    for (const [step, settings] of Object.entries(state.cropOverrides)) {
      config[step as BookingFlowStep] = settings;
    }

    return `export const CROP_CONFIG: Record<BookingFlowStep, CropSettings> = ${JSON.stringify(
      config,
      null,
      2
    )};`;
  }, [state.cropOverrides]);

  const actions = useMemo(
    () => ({
      enable,
      disable,
      toggle,
      openPanel,
      closePanel,
      setActiveTab,
      logEvent,
      clearEvents,
      setCropOverride,
      resetCropOverride,
      resetAllCropOverrides,
      setLivePreview,
      getCropSettings,
      exportCropConfig,
      setSimulatedStep,
    }),
    [
      enable,
      disable,
      toggle,
      openPanel,
      closePanel,
      setActiveTab,
      logEvent,
      clearEvents,
      setCropOverride,
      resetCropOverride,
      resetAllCropOverrides,
      setLivePreview,
      getCropSettings,
      exportCropConfig,
      setSimulatedStep,
    ]
  );

  const value = useMemo(
    () => ({
      state,
      actions,
      registerLogoClick,
    }),
    [state, actions, registerLogoClick]
  );

  return (
    <DevModeContext.Provider value={value}>{children}</DevModeContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevMode must be used within DevModeProvider');
  }
  return context;
}

export function useDevModeEnabled(): boolean {
  const { state } = useDevMode();
  return state.isEnabled;
}

export function useDevModeCropSettings(step: BookingFlowStep): CropSettings {
  const { actions } = useDevMode();
  return actions.getCropSettings(step);
}
