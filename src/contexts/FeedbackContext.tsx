'use client';

/**
 * Feedback Context
 *
 * Provides a feedback overlay layer that allows users to click anywhere on the page
 * and leave feedback for that specific section/element.
 *
 * Activation: URL param ?feedback=true or typing "feedback" anywhere on the page
 *
 * Desktop: Right-click to place a feedback pin
 * Mobile: Press and hold (500ms) to place a feedback pin
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

// ============================================================================
// Types
// ============================================================================

export interface FeedbackPin {
  id: string;
  x: number; // Percentage from left
  y: number; // Absolute pixel position from top of document
  viewportY: number; // Y position relative to viewport when created
  sectionId: string | null; // Associated section if detectable
  elementInfo: string | null; // Description of element clicked
  feedback: string;
  timestamp: Date;
  resolved: boolean;
  authorName?: string;
}

interface FeedbackState {
  isEnabled: boolean;
  showTutorial: boolean;
  tutorialStep: number;
  pins: FeedbackPin[];
  activePinId: string | null; // Pin being edited
  pendingPin: { x: number; y: number; viewportY: number; sectionId: string | null; elementInfo: string | null } | null;
  isMobile: boolean;
  isPressActive: boolean; // For mobile long-press indicator
  pressPosition: { x: number; y: number } | null;
}

interface FeedbackContextValue {
  state: FeedbackState;
  actions: {
    enable: () => void;
    disable: () => void;
    toggle: () => void;
    showTutorial: () => void;
    dismissTutorial: () => void;
    nextTutorialStep: () => void;
    prevTutorialStep: () => void;
    setPendingPin: (pin: FeedbackState['pendingPin']) => void;
    confirmPin: (feedback: string, authorName?: string) => void;
    cancelPin: () => void;
    editPin: (id: string) => void;
    updatePin: (id: string, feedback: string) => void;
    deletePin: (id: string) => void;
    resolvePin: (id: string) => void;
    unresolvePin: (id: string) => void;
    exportFeedback: () => string;
    clearAllPins: () => void;
    setPressActive: (active: boolean, position?: { x: number; y: number }) => void;
  };
}

// ============================================================================
// Context
// ============================================================================

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'lashpop-feedback-pins';
const TUTORIAL_SEEN_KEY = 'lashpop-feedback-tutorial-seen';
const KONAMI_CODE = 'feedback'; // Type this anywhere to activate

// ============================================================================
// Provider
// ============================================================================

interface FeedbackProviderProps {
  children: React.ReactNode;
}

export function FeedbackProvider({ children }: FeedbackProviderProps) {
  const [state, setState] = useState<FeedbackState>({
    isEnabled: false,
    showTutorial: false,
    tutorialStep: 0,
    pins: [],
    activePinId: null,
    pendingPin: null,
    isMobile: false,
    isPressActive: false,
    pressPosition: null,
  });

  // Track typed characters for activation code
  const typedCharsRef = useRef<string>('');
  const typedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for mobile and URL param on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if mobile
    const checkMobile = () => {
      setState(prev => ({ ...prev, isMobile: window.innerWidth < 768 }));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get('feedback') === 'true') {
      const hasSeenTutorial = localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
      setState(prev => ({
        ...prev,
        isEnabled: true,
        showTutorial: !hasSeenTutorial,
      }));
    }

    // Load saved pins from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          pins: parsed.pins?.map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp),
          })) || [],
        }));
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    // Listen for typed activation code
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Clear timeout
      if (typedTimeoutRef.current) {
        clearTimeout(typedTimeoutRef.current);
      }

      // Add character
      typedCharsRef.current += e.key.toLowerCase();

      // Check for match
      if (typedCharsRef.current.includes(KONAMI_CODE)) {
        const hasSeenTutorial = localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
        setState(prev => ({
          ...prev,
          isEnabled: !prev.isEnabled,
          showTutorial: !prev.isEnabled && !hasSeenTutorial,
        }));
        typedCharsRef.current = '';
      } else {
        // Reset after 2 seconds of no typing
        typedTimeoutRef.current = setTimeout(() => {
          typedCharsRef.current = '';
        }, 2000);

        // Keep only last N characters
        if (typedCharsRef.current.length > KONAMI_CODE.length * 2) {
          typedCharsRef.current = typedCharsRef.current.slice(-KONAMI_CODE.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Save pins to localStorage when they change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ pins: state.pins })
      );
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [state.pins]);

  // Actions
  const enable = useCallback(() => {
    const hasSeenTutorial = typeof window !== 'undefined' &&
      localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
    setState(prev => ({
      ...prev,
      isEnabled: true,
      showTutorial: !hasSeenTutorial,
    }));
  }, []);

  const disable = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEnabled: false,
      showTutorial: false,
      pendingPin: null,
      activePinId: null,
    }));
  }, []);

  const toggle = useCallback(() => {
    setState(prev => {
      if (prev.isEnabled) {
        return { ...prev, isEnabled: false, showTutorial: false, pendingPin: null, activePinId: null };
      }
      const hasSeenTutorial = typeof window !== 'undefined' &&
        localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
      return { ...prev, isEnabled: true, showTutorial: !hasSeenTutorial };
    });
  }, []);

  const showTutorialAction = useCallback(() => {
    setState(prev => ({ ...prev, showTutorial: true, tutorialStep: 0 }));
  }, []);

  const dismissTutorial = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    }
    setState(prev => ({ ...prev, showTutorial: false }));
  }, []);

  const nextTutorialStep = useCallback(() => {
    setState(prev => ({ ...prev, tutorialStep: prev.tutorialStep + 1 }));
  }, []);

  const prevTutorialStep = useCallback(() => {
    setState(prev => ({ ...prev, tutorialStep: Math.max(0, prev.tutorialStep - 1) }));
  }, []);

  const setPendingPin = useCallback((pin: FeedbackState['pendingPin']) => {
    setState(prev => ({ ...prev, pendingPin: pin, activePinId: null }));
  }, []);

  const confirmPin = useCallback((feedback: string, authorName?: string) => {
    setState(prev => {
      if (!prev.pendingPin) return prev;

      const newPin: FeedbackPin = {
        id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x: prev.pendingPin.x,
        y: prev.pendingPin.y,
        viewportY: prev.pendingPin.viewportY,
        sectionId: prev.pendingPin.sectionId,
        elementInfo: prev.pendingPin.elementInfo,
        feedback,
        timestamp: new Date(),
        resolved: false,
        authorName,
      };

      return {
        ...prev,
        pins: [...prev.pins, newPin],
        pendingPin: null,
      };
    });
  }, []);

  const cancelPin = useCallback(() => {
    setState(prev => ({ ...prev, pendingPin: null, activePinId: null }));
  }, []);

  const editPin = useCallback((id: string) => {
    setState(prev => ({ ...prev, activePinId: id, pendingPin: null }));
  }, []);

  const updatePin = useCallback((id: string, feedback: string) => {
    setState(prev => ({
      ...prev,
      pins: prev.pins.map(p => (p.id === id ? { ...p, feedback } : p)),
      activePinId: null,
    }));
  }, []);

  const deletePin = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      pins: prev.pins.filter(p => p.id !== id),
      activePinId: prev.activePinId === id ? null : prev.activePinId,
    }));
  }, []);

  const resolvePin = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      pins: prev.pins.map(p => (p.id === id ? { ...p, resolved: true } : p)),
    }));
  }, []);

  const unresolvePin = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      pins: prev.pins.map(p => (p.id === id ? { ...p, resolved: false } : p)),
    }));
  }, []);

  const exportFeedback = useCallback((): string => {
    const exported = state.pins.map(p => ({
      section: p.sectionId || 'Unknown',
      element: p.elementInfo || 'General',
      feedback: p.feedback,
      position: { x: `${p.x.toFixed(1)}%`, y: `${p.y}px` },
      timestamp: p.timestamp.toISOString(),
      resolved: p.resolved,
      author: p.authorName || 'Anonymous',
    }));
    return JSON.stringify(exported, null, 2);
  }, [state.pins]);

  const clearAllPins = useCallback(() => {
    setState(prev => ({ ...prev, pins: [], activePinId: null }));
  }, []);

  const setPressActive = useCallback((active: boolean, position?: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      isPressActive: active,
      pressPosition: active && position ? position : null,
    }));
  }, []);

  const actions = useMemo(
    () => ({
      enable,
      disable,
      toggle,
      showTutorial: showTutorialAction,
      dismissTutorial,
      nextTutorialStep,
      prevTutorialStep,
      setPendingPin,
      confirmPin,
      cancelPin,
      editPin,
      updatePin,
      deletePin,
      resolvePin,
      unresolvePin,
      exportFeedback,
      clearAllPins,
      setPressActive,
    }),
    [
      enable,
      disable,
      toggle,
      showTutorialAction,
      dismissTutorial,
      nextTutorialStep,
      prevTutorialStep,
      setPendingPin,
      confirmPin,
      cancelPin,
      editPin,
      updatePin,
      deletePin,
      resolvePin,
      unresolvePin,
      exportFeedback,
      clearAllPins,
      setPressActive,
    ]
  );

  const value = useMemo(
    () => ({ state, actions }),
    [state, actions]
  );

  return (
    <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
}

export function useFeedbackEnabled(): boolean {
  const { state } = useFeedback();
  return state.isEnabled;
}
