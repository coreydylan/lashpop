"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type TutorialStep =
  | 'selection-methods'
  | 'command-palette'
  | 'tagging-filtering'
  | 'batch-actions'

interface TutorialState {
  completedSteps: Set<TutorialStep>
  currentStep: TutorialStep | null
  tutorialEnabled: boolean
}

interface TutorialContextType {
  completedSteps: Set<TutorialStep>
  currentStep: TutorialStep | null
  tutorialEnabled: boolean
  completeStep: (step: TutorialStep) => void
  startStep: (step: TutorialStep) => void
  dismissStep: () => void
  resetTutorial: () => void
  enableTutorial: () => void
  disableTutorial: () => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

const STORAGE_KEY = 'lashpop-dam-tutorial'

function loadTutorialState(): TutorialState {
  if (typeof window === 'undefined') {
    return {
      completedSteps: new Set(),
      currentStep: null,
      tutorialEnabled: true,
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        completedSteps: new Set(parsed.completedSteps || []),
        currentStep: parsed.currentStep || null,
        tutorialEnabled: parsed.tutorialEnabled !== false, // Default to true
      }
    }
  } catch (error) {
    console.error('Failed to load tutorial state:', error)
  }

  return {
    completedSteps: new Set(),
    currentStep: null,
    tutorialEnabled: true,
  }
}

function saveTutorialState(state: TutorialState) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completedSteps: Array.from(state.completedSteps),
        currentStep: state.currentStep,
        tutorialEnabled: state.tutorialEnabled,
      })
    )
  } catch (error) {
    console.error('Failed to save tutorial state:', error)
  }
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TutorialState>(loadTutorialState)

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveTutorialState(state)
  }, [state])

  const completeStep = (step: TutorialStep) => {
    setState((prev) => {
      const newCompletedSteps = new Set(prev.completedSteps)
      newCompletedSteps.add(step)
      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: prev.currentStep === step ? null : prev.currentStep,
      }
    })
  }

  const startStep = (step: TutorialStep) => {
    setState((prev) => {
      // Don't show if already completed or tutorial is disabled
      if (prev.completedSteps.has(step) || !prev.tutorialEnabled) {
        return prev
      }
      return {
        ...prev,
        currentStep: step,
      }
    })
  }

  const dismissStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: null,
    }))
  }

  const resetTutorial = () => {
    setState({
      completedSteps: new Set(),
      currentStep: null,
      tutorialEnabled: true,
    })
  }

  const enableTutorial = () => {
    setState((prev) => ({
      ...prev,
      tutorialEnabled: true,
    }))
  }

  const disableTutorial = () => {
    setState((prev) => ({
      ...prev,
      tutorialEnabled: false,
      currentStep: null,
    }))
  }

  return (
    <TutorialContext.Provider
      value={{
        completedSteps: state.completedSteps,
        currentStep: state.currentStep,
        tutorialEnabled: state.tutorialEnabled,
        completeStep,
        startStep,
        dismissStep,
        resetTutorial,
        enableTutorial,
        disableTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}
