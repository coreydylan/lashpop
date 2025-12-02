"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

// Tutorial step definitions
export type DesktopTutorialStep =
  | 'welcome'
  | 'command-palette-intro'
  | 'filtering-demo'
  | 'selection-demo'
  | 'bulk-tagging-demo'
  | 'collections-organization'
  | 'completion'

export type MobileTutorialStep =
  | 'welcome'
  | 'action-button-intro'
  | 'command-palette-intro'
  | 'command-palette-explore'
  | 'selection-demo'
  | 'bulk-actions'
  | 'completion'

export type TutorialStep = DesktopTutorialStep | MobileTutorialStep

interface TutorialState {
  // Overall state
  isActive: boolean
  isMobile: boolean

  // Current progress
  currentStep: TutorialStep | null
  currentStepIndex: number
  totalSteps: number

  // Completion tracking
  completedSteps: Set<string>
  completedDesktop: boolean
  completedMobile: boolean
  dismissed: boolean
  promptedDesktop: boolean
  promptedMobile: boolean

  // UI state
  showOverlay: boolean
  highlightElement: string | null
  showPromptDialog: boolean
}

interface TutorialContextType extends TutorialState {
  // Tutorial controls
  startTutorial: (deviceType: 'desktop' | 'mobile') => void
  nextStep: () => void
  previousStep: () => void
  skipTutorial: () => void
  completeTutorial: () => void
  restartTutorial: () => void

  // Step management
  goToStep: (step: TutorialStep) => void
  markStepComplete: (step: TutorialStep) => void

  // Prompt management
  dismissPrompt: () => void
  acceptPrompt: () => void

  // Helpers
  highlightElementById: (elementId: string | null) => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

const DESKTOP_STEPS: DesktopTutorialStep[] = [
  'welcome',
  'command-palette-intro',
  'filtering-demo',
  'selection-demo',
  'bulk-tagging-demo',
  'collections-organization',
  'completion'
]

const MOBILE_STEPS: MobileTutorialStep[] = [
  'welcome',
  'action-button-intro',
  'command-palette-intro',
  'command-palette-explore',
  'selection-demo',
  'bulk-actions',
  'completion'
]

const TUTORIAL_STORAGE_KEY = 'lashpop-dam-tutorial'

interface StoredTutorialState {
  completedDesktop: boolean
  completedMobile: boolean
  dismissed: boolean
  promptedDesktop: boolean
  promptedMobile: boolean
  completedSteps: string[]
}

function loadTutorialFromStorage(): Partial<StoredTutorialState> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load tutorial state from localStorage:', error)
  }
  return {}
}

function saveTutorialToStorage(state: StoredTutorialState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save tutorial state to localStorage:', error)
  }
}

export function DamTutorialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TutorialState>({
    isActive: false,
    isMobile: false,
    currentStep: null,
    currentStepIndex: 0,
    totalSteps: 0,
    completedSteps: new Set(),
    completedDesktop: false,
    completedMobile: false,
    dismissed: false,
    promptedDesktop: false,
    promptedMobile: false,
    showOverlay: false,
    highlightElement: null,
    showPromptDialog: false
  })

  // Load tutorial state from localStorage on mount (per-device tracking)
  useEffect(() => {
    const stored = loadTutorialFromStorage()

    if (Object.keys(stored).length > 0) {
      setState(prev => ({
        ...prev,
        completedSteps: new Set(stored.completedSteps || []),
        completedDesktop: stored.completedDesktop || false,
        completedMobile: stored.completedMobile || false,
        dismissed: stored.dismissed || false,
        promptedDesktop: stored.promptedDesktop || false,
        promptedMobile: stored.promptedMobile || false
      }))
    }
  }, [])

  // Save tutorial state to localStorage (per-device tracking)
  const saveTutorialState = useCallback((updates: Partial<TutorialState>) => {
    const stateToSave: StoredTutorialState = {
      dismissed: updates.dismissed ?? state.dismissed,
      completedDesktop: updates.completedDesktop ?? state.completedDesktop,
      completedMobile: updates.completedMobile ?? state.completedMobile,
      promptedDesktop: updates.promptedDesktop ?? state.promptedDesktop,
      promptedMobile: updates.promptedMobile ?? state.promptedMobile,
      completedSteps: Array.from(updates.completedSteps ?? state.completedSteps)
    }

    saveTutorialToStorage(stateToSave)
  }, [state])

  const startTutorial = useCallback((deviceType: 'desktop' | 'mobile') => {
    const isMobile = deviceType === 'mobile'
    const steps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS

    setState(prev => ({
      ...prev,
      isActive: true,
      isMobile,
      currentStep: steps[0],
      currentStepIndex: 0,
      totalSteps: steps.length,
      // Show overlay for mobile (always) or desktop welcome screen (will be managed by component)
      showOverlay: isMobile
    }))

    saveTutorialState({
      isActive: true,
      isMobile,
      currentStepIndex: 0
    })
  }, [saveTutorialState])

  const nextStep = useCallback(() => {
    setState(prev => {
      const steps = prev.isMobile ? MOBILE_STEPS : DESKTOP_STEPS
      const nextIndex = prev.currentStepIndex + 1

      if (nextIndex >= steps.length) {
        // Tutorial complete
        return {
          ...prev,
          isActive: false,
          currentStep: null,
          showOverlay: false,
          completedDesktop: !prev.isMobile,
          completedMobile: prev.isMobile
        }
      }

      const newState = {
        ...prev,
        currentStep: steps[nextIndex],
        currentStepIndex: nextIndex
      }

      saveTutorialState(newState)
      return newState
    })
  }, [saveTutorialState])

  const previousStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStepIndex === 0) return prev

      const steps = prev.isMobile ? MOBILE_STEPS : DESKTOP_STEPS
      const prevIndex = prev.currentStepIndex - 1

      const newState = {
        ...prev,
        currentStep: steps[prevIndex],
        currentStepIndex: prevIndex
      }

      saveTutorialState(newState)
      return newState
    })
  }, [saveTutorialState])

  const skipTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      currentStep: null,
      showOverlay: false,
      dismissed: true
    }))

    saveTutorialState({
      dismissed: true,
      isActive: false
    })
  }, [saveTutorialState])

  const completeTutorial = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        isActive: false,
        currentStep: null,
        showOverlay: false,
        completedDesktop: !prev.isMobile ? true : prev.completedDesktop,
        completedMobile: prev.isMobile ? true : prev.completedMobile
      }

      saveTutorialState(newState)
      return newState
    })
  }, [saveTutorialState])

  const restartTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      completedSteps: new Set(),
      completedDesktop: false,
      completedMobile: false,
      dismissed: false,
      promptedDesktop: false,
      promptedMobile: false
    }))

    saveTutorialState({
      completedSteps: new Set(),
      completedDesktop: false,
      completedMobile: false,
      dismissed: false,
      promptedDesktop: false,
      promptedMobile: false
    })
  }, [saveTutorialState])

  const dismissPrompt = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        showPromptDialog: false,
        promptedDesktop: prev.isMobile ? prev.promptedDesktop : true,
        promptedMobile: prev.isMobile ? true : prev.promptedMobile
      }
      saveTutorialState(newState)
      return newState
    })
  }, [saveTutorialState])

  const acceptPrompt = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        showPromptDialog: false,
        promptedDesktop: prev.isMobile ? prev.promptedDesktop : true,
        promptedMobile: prev.isMobile ? true : prev.promptedMobile
      }
      saveTutorialState(newState)
      return newState
    })
    // Start tutorial after accepting
    setTimeout(() => {
      startTutorial(state.isMobile ? 'mobile' : 'desktop')
    }, 100)
  }, [saveTutorialState, startTutorial, state.isMobile])

  const goToStep = useCallback((step: TutorialStep) => {
    setState(prev => {
      const steps = prev.isMobile ? MOBILE_STEPS : DESKTOP_STEPS
      const index = steps.indexOf(step as any)

      if (index === -1) return prev

      return {
        ...prev,
        currentStep: step,
        currentStepIndex: index
      }
    })
  }, [])

  const markStepComplete = useCallback((step: TutorialStep) => {
    setState(prev => {
      const newCompletedSteps = new Set(prev.completedSteps)
      newCompletedSteps.add(step)

      const newState = {
        ...prev,
        completedSteps: newCompletedSteps
      }

      saveTutorialState(newState)
      return newState
    })
  }, [saveTutorialState])

  const highlightElementById = useCallback((elementId: string | null) => {
    setState(prev => ({
      ...prev,
      highlightElement: elementId
    }))
  }, [])

  // Check if we should show the prompt on mount
  useEffect(() => {
    // Detect device type
    const isMobileDevice = window.innerWidth < 768

    // Check if we should show prompt for current device (only check once on mount)
    const shouldPrompt = isMobileDevice
      ? !state.promptedMobile && !state.completedMobile && !state.dismissed
      : !state.promptedDesktop && !state.completedDesktop && !state.dismissed

    if (shouldPrompt) {
      setState(prev => ({ ...prev, isMobile: isMobileDevice }))
      // Small delay to let the page load first
      setTimeout(() => {
        setState(prev => ({ ...prev, showPromptDialog: true }))
      }, 1000)
    } else {
      setState(prev => ({ ...prev, isMobile: isMobileDevice }))
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  return (
    <TutorialContext.Provider
      value={{
        ...state,
        startTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        completeTutorial,
        restartTutorial,
        goToStep,
        markStepComplete,
        dismissPrompt,
        acceptPrompt,
        highlightElementById
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}

export function useDamTutorial() {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error('useDamTutorial must be used within a DamTutorialProvider')
  }
  return context
}
