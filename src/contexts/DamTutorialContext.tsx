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
  isMinimized: boolean
  isWaitingForAction: boolean
  currentSubAction?: string  // Track multi-part actions within a step

  // Auto-open command palette for demos
  shouldOpenCommandPalette: boolean
  commandPaletteQuery: string
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

  // Interactive tutorial
  minimizeTutorial: () => void
  maximizeTutorial: () => void
  startWaitingForAction: (subAction?: string) => void
  updateSubAction: (subAction: string) => void
  completeAction: () => void

  // Helpers
  openCommandPaletteForDemo: (query?: string) => void
  closeCommandPaletteForDemo: () => void
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
    showPromptDialog: false,
    isMinimized: false,
    isWaitingForAction: false,
    currentSubAction: undefined,
    shouldOpenCommandPalette: false,
    commandPaletteQuery: ''
  })

  // Load tutorial state from database on mount
  useEffect(() => {
    async function loadTutorialState() {
      try {
        const response = await fetch('/api/dam/settings')
        if (response.ok) {
          const data = await response.json()
          const tutorial = data.settings?.tutorial

          if (tutorial) {
            setState(prev => ({
              ...prev,
              completedSteps: new Set(tutorial.completedSteps || []),
              completedDesktop: tutorial.completedDesktop || false,
              completedMobile: tutorial.completedMobile || false,
              dismissed: tutorial.dismissed || false,
              promptedDesktop: tutorial.promptedDesktop || false,
              promptedMobile: tutorial.promptedMobile || false
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load tutorial state:', error)
      }
    }

    loadTutorialState()
  }, [])

  // Save tutorial state to database
  const saveTutorialState = useCallback(async (updates: Partial<TutorialState>) => {
    try {
      const tutorial = {
        completed: updates.completedDesktop && updates.completedMobile,
        dismissed: updates.dismissed ?? state.dismissed,
        completedDesktop: updates.completedDesktop ?? state.completedDesktop,
        completedMobile: updates.completedMobile ?? state.completedMobile,
        promptedDesktop: updates.promptedDesktop ?? state.promptedDesktop,
        promptedMobile: updates.promptedMobile ?? state.promptedMobile,
        currentStep: updates.currentStepIndex ?? state.currentStepIndex,
        completedSteps: Array.from(updates.completedSteps ?? state.completedSteps),
        lastStepAt: new Date().toISOString()
      }

      await fetch('/api/dam/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorial
        })
      })
    } catch (error) {
      console.error('Failed to save tutorial state:', error)
    }
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

  const openCommandPaletteForDemo = useCallback((query = '') => {
    setState(prev => ({
      ...prev,
      shouldOpenCommandPalette: true,
      commandPaletteQuery: query
    }))
  }, [])

  const closeCommandPaletteForDemo = useCallback(() => {
    setState(prev => ({
      ...prev,
      shouldOpenCommandPalette: false,
      commandPaletteQuery: ''
    }))
  }, [])

  const highlightElementById = useCallback((elementId: string | null) => {
    setState(prev => ({
      ...prev,
      highlightElement: elementId
    }))
  }, [])

  const minimizeTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: true,
      showOverlay: false
    }))
  }, [])

  const maximizeTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: false,
      showOverlay: prev.isMobile // Mobile always has overlay
    }))
  }, [])

  const startWaitingForAction = useCallback((subAction?: string) => {
    setState(prev => ({
      ...prev,
      isWaitingForAction: true,
      isMinimized: true,
      showOverlay: false,
      currentSubAction: subAction
    }))
  }, [])

  const updateSubAction = useCallback((subAction: string) => {
    setState(prev => ({
      ...prev,
      currentSubAction: subAction
    }))
  }, [])

  const completeAction = useCallback(() => {
    setState(prev => ({
      ...prev,
      isWaitingForAction: false,
      currentSubAction: undefined
    }))
    // Auto-advance after a short delay, then reopen tutorial
    setTimeout(() => {
      nextStep()
      // Wait for step transition, then show tutorial card again
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isMinimized: false,
          showOverlay: prev.isMobile
        }))
      }, 300)
    }, 800)
  }, [nextStep])

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
        minimizeTutorial,
        maximizeTutorial,
        startWaitingForAction,
        updateSubAction,
        completeAction,
        openCommandPaletteForDemo,
        closeCommandPaletteForDemo,
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
