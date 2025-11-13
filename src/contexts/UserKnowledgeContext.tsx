'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '@/lib/auth-client';
import { nanoid } from 'nanoid';

// ============================================================================
// Types
// ============================================================================

export interface ServiceInteraction {
  serviceId: string;
  serviceName: string;
  categoryId: string;
  timestamp: Date;
  action: 'viewed' | 'selected' | 'provider_selected';
  metadata?: Record<string, any>;
}

export interface InferredPreference {
  preferredStyle?: string;
  confidenceScore: number; // 0-1
  inferredFrom: string[];
  lastUpdated: Date;
  firstInferred: Date;
}

export interface StatedPreference {
  value: string;
  statedAt: Date;
  context: string; // Where/how it was stated (e.g., 'discovery-quiz', 'inline-prompt')
}

export interface DiscoveryProgress {
  questionsAnswered: string[];
  completionPercentage: number;
  lastUpdated: Date;
}

export interface SessionMetadata {
  id: string;
  startedAt: Date;
  lastActivityAt: Date;
  pageViews: number;
  interactions: number;
}

export interface BehaviorSignals {
  browsingPatterns: {
    mostViewedCategory?: string;
    sessionCount: number;
    avgTimePerSession?: number;
  };
  decisionSpeed: 'quick' | 'deliberate' | 'researcher' | 'unknown';
  engagementLevel: 'low' | 'medium' | 'high';
}

export interface UserKnowledge {
  // Linked to auth user (when logged in)
  userId?: string;
  phoneNumber?: string;

  // Service interaction history
  serviceInteractions: ServiceInteraction[];

  // Inferred preferences (learned passively)
  inferredPreferences: {
    [categoryId: string]: InferredPreference;
  };

  // Explicitly stated preferences
  statedPreferences: {
    lookGoal?: StatedPreference;
    maintenanceWillingness?: StatedPreference;
    budgetRange?: StatedPreference;
  };

  // Discovery progress
  discoveryProgress: {
    [categoryId: string]: DiscoveryProgress;
  };

  // Behavioral signals
  behaviorSignals: BehaviorSignals;

  // Session metadata
  sessions: SessionMetadata[];
  currentSession?: SessionMetadata;

  // Last save nudge dismissal
  lastNudgeDismissal?: Date;
  nudgeDismissalCount: number;
}

export interface UserKnowledgeContextValue {
  knowledge: UserKnowledge;

  // Tracking methods
  trackServiceView: (serviceId: string, serviceName: string, categoryId: string) => void;
  trackServiceSelection: (serviceId: string, serviceName: string, categoryId: string) => void;
  trackProviderSelection: (serviceId: string, providerId: string) => void;

  // Preference methods
  setStatedPreference: (key: keyof UserKnowledge['statedPreferences'], value: string, context: string) => void;
  updateDiscoveryProgress: (categoryId: string, questionId: string, completed: boolean) => void;

  // Nudge management
  shouldShowSaveNudge: () => boolean;
  dismissSaveNudge: () => void;

  // Sync methods
  syncToServer: () => Promise<void>;

  // Utilities
  getServiceHistory: (categoryId?: string) => ServiceInteraction[];
  getMostViewedCategory: () => string | undefined;
  getEngagementScore: () => number; // 0-100
}

// ============================================================================
// Context
// ============================================================================

const UserKnowledgeContext = createContext<UserKnowledgeContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

const STORAGE_KEY = 'lashpop_knowledge';
const AUTOSAVE_DEBOUNCE_MS = 2000;

function getInitialKnowledge(): UserKnowledge {
  if (typeof window === 'undefined') {
    return createEmptyKnowledge();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Hydrate dates
      return {
        ...parsed,
        serviceInteractions: parsed.serviceInteractions.map((si: any) => ({
          ...si,
          timestamp: new Date(si.timestamp)
        })),
        sessions: parsed.sessions.map((s: any) => ({
          ...s,
          startedAt: new Date(s.startedAt),
          lastActivityAt: new Date(s.lastActivityAt)
        })),
        currentSession: parsed.currentSession ? {
          ...parsed.currentSession,
          startedAt: new Date(parsed.currentSession.startedAt),
          lastActivityAt: new Date(parsed.currentSession.lastActivityAt)
        } : undefined,
        lastNudgeDismissal: parsed.lastNudgeDismissal ? new Date(parsed.lastNudgeDismissal) : undefined
      };
    }
  } catch (error) {
    console.error('Failed to load user knowledge from localStorage:', error);
  }

  return createEmptyKnowledge();
}

function createEmptyKnowledge(): UserKnowledge {
  const sessionId = nanoid();
  const now = new Date();

  return {
    serviceInteractions: [],
    inferredPreferences: {},
    statedPreferences: {},
    discoveryProgress: {},
    behaviorSignals: {
      browsingPatterns: {
        sessionCount: 1
      },
      decisionSpeed: 'unknown',
      engagementLevel: 'low'
    },
    sessions: [],
    currentSession: {
      id: sessionId,
      startedAt: now,
      lastActivityAt: now,
      pageViews: 1,
      interactions: 0
    },
    nudgeDismissalCount: 0
  };
}

export function UserKnowledgeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [knowledge, setKnowledge] = useState<UserKnowledge>(getInitialKnowledge);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save to localStorage with debouncing
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledge));
      } catch (error) {
        console.error('Failed to save user knowledge:', error);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [knowledge]);

  // Link to authenticated user
  useEffect(() => {
    if (session?.user) {
      setKnowledge(prev => ({
        ...prev,
        userId: session.user.id,
        phoneNumber: session.user.phoneNumber || prev.phoneNumber
      }));
    }
  }, [session]);

  // Track service view
  const trackServiceView = useCallback((serviceId: string, serviceName: string, categoryId: string) => {
    setKnowledge(prev => {
      const interaction: ServiceInteraction = {
        serviceId,
        serviceName,
        categoryId,
        timestamp: new Date(),
        action: 'viewed'
      };

      return {
        ...prev,
        serviceInteractions: [...prev.serviceInteractions, interaction],
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          lastActivityAt: new Date(),
          interactions: prev.currentSession.interactions + 1
        } : prev.currentSession
      };
    });
  }, []);

  // Track service selection
  const trackServiceSelection = useCallback((serviceId: string, serviceName: string, categoryId: string) => {
    setKnowledge(prev => {
      const interaction: ServiceInteraction = {
        serviceId,
        serviceName,
        categoryId,
        timestamp: new Date(),
        action: 'selected'
      };

      return {
        ...prev,
        serviceInteractions: [...prev.serviceInteractions, interaction],
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          lastActivityAt: new Date(),
          interactions: prev.currentSession.interactions + 1
        } : prev.currentSession
      };
    });
  }, []);

  // Track provider selection
  const trackProviderSelection = useCallback((serviceId: string, providerId: string) => {
    setKnowledge(prev => {
      const lastInteraction = [...prev.serviceInteractions]
        .reverse()
        .find(si => si.serviceId === serviceId);

      if (!lastInteraction) return prev;

      const interaction: ServiceInteraction = {
        ...lastInteraction,
        timestamp: new Date(),
        action: 'provider_selected',
        metadata: { providerId }
      };

      return {
        ...prev,
        serviceInteractions: [...prev.serviceInteractions, interaction],
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          lastActivityAt: new Date(),
          interactions: prev.currentSession.interactions + 1
        } : prev.currentSession
      };
    });
  }, []);

  // Set stated preference
  const setStatedPreference = useCallback((
    key: keyof UserKnowledge['statedPreferences'],
    value: string,
    context: string
  ) => {
    setKnowledge(prev => ({
      ...prev,
      statedPreferences: {
        ...prev.statedPreferences,
        [key]: {
          value,
          statedAt: new Date(),
          context
        }
      }
    }));
  }, []);

  // Update discovery progress
  const updateDiscoveryProgress = useCallback((categoryId: string, questionId: string, completed: boolean) => {
    setKnowledge(prev => {
      const current = prev.discoveryProgress[categoryId] || {
        questionsAnswered: [],
        completionPercentage: 0,
        lastUpdated: new Date()
      };

      const questionsAnswered = completed
        ? [...new Set([...current.questionsAnswered, questionId])]
        : current.questionsAnswered.filter(q => q !== questionId);

      // Assuming 5 total questions per category
      const completionPercentage = (questionsAnswered.length / 5) * 100;

      return {
        ...prev,
        discoveryProgress: {
          ...prev.discoveryProgress,
          [categoryId]: {
            questionsAnswered,
            completionPercentage,
            lastUpdated: new Date()
          }
        }
      };
    });
  }, []);

  // Should show save nudge
  const shouldShowSaveNudge = useCallback((): boolean => {
    // Don't show if already authenticated
    if (session?.user) return false;

    // Don't show if dismissed recently (within 24 hours)
    if (knowledge.lastNudgeDismissal) {
      const hoursSinceDismissal = (Date.now() - knowledge.lastNudgeDismissal.getTime()) / (1000 * 60 * 60);
      if (hoursSinceDismissal < 24) return false;
    }

    // Don't show if dismissed too many times
    if (knowledge.nudgeDismissalCount >= 3) return false;

    // Show if user has browsed 2+ sessions
    if (knowledge.sessions.length < 2) return false;

    // Show if user has 3+ service interactions
    if (knowledge.serviceInteractions.length < 3) return false;

    return true;
  }, [knowledge, session]);

  // Dismiss save nudge
  const dismissSaveNudge = useCallback(() => {
    setKnowledge(prev => ({
      ...prev,
      lastNudgeDismissal: new Date(),
      nudgeDismissalCount: prev.nudgeDismissalCount + 1
    }));
  }, []);

  // Sync to server
  const syncToServer = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // TODO: Implement server sync
      // await fetch('/api/user-knowledge/sync', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(knowledge)
      // });
    } catch (error) {
      console.error('Failed to sync user knowledge to server:', error);
    }
  }, [knowledge, session]);

  // Get service history
  const getServiceHistory = useCallback((categoryId?: string): ServiceInteraction[] => {
    if (!categoryId) return knowledge.serviceInteractions;
    return knowledge.serviceInteractions.filter(si => si.categoryId === categoryId);
  }, [knowledge]);

  // Get most viewed category
  const getMostViewedCategory = useCallback((): string | undefined => {
    const categoryCounts: Record<string, number> = {};

    knowledge.serviceInteractions.forEach(si => {
      categoryCounts[si.categoryId] = (categoryCounts[si.categoryId] || 0) + 1;
    });

    const entries = Object.entries(categoryCounts);
    if (entries.length === 0) return undefined;

    return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }, [knowledge]);

  // Get engagement score (0-100)
  const getEngagementScore = useCallback((): number => {
    let score = 0;

    // Session count (max 20 points)
    score += Math.min(knowledge.sessions.length * 5, 20);

    // Service interactions (max 30 points)
    score += Math.min(knowledge.serviceInteractions.length * 2, 30);

    // Stated preferences (max 20 points)
    const statedCount = Object.keys(knowledge.statedPreferences).length;
    score += Math.min(statedCount * 10, 20);

    // Discovery progress (max 30 points)
    const discoveryScores = Object.values(knowledge.discoveryProgress).map(d => d.completionPercentage);
    const avgDiscovery = discoveryScores.length > 0
      ? discoveryScores.reduce((a, b) => a + b, 0) / discoveryScores.length
      : 0;
    score += Math.min(avgDiscovery * 0.3, 30);

    return Math.min(Math.round(score), 100);
  }, [knowledge]);

  const value: UserKnowledgeContextValue = {
    knowledge,
    trackServiceView,
    trackServiceSelection,
    trackProviderSelection,
    setStatedPreference,
    updateDiscoveryProgress,
    shouldShowSaveNudge,
    dismissSaveNudge,
    syncToServer,
    getServiceHistory,
    getMostViewedCategory,
    getEngagementScore
  };

  return (
    <UserKnowledgeContext.Provider value={value}>
      {children}
    </UserKnowledgeContext.Provider>
  );
}

export function useUserKnowledge() {
  const context = useContext(UserKnowledgeContext);
  if (!context) {
    throw new Error('useUserKnowledge must be used within UserKnowledgeProvider');
  }
  return context;
}
