'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseSwipeTutorialOptions {
  /** Unique key for localStorage to track this specific tutorial */
  storageKey: string
  /** Distance in pixels required to complete the tutorial (default: 50) */
  completionThreshold?: number
  /** Delay before hiding the success indicator (default: 1400ms) */
  successDelay?: number
}

interface UseSwipeTutorialReturn {
  hasCompletedTutorial: boolean
  showTutorial: boolean
  tutorialSuccess: boolean
  triggerTutorial: () => void
  completeTutorial: () => void
  /** Call on touch/drag start to reset distance tracking */
  resetSwipeDistance: () => void
  /** Call on touch/drag move with the delta, returns total distance */
  addSwipeDistance: (distance: number) => number
  /** Call to check if threshold reached and auto-complete */
  checkAndComplete: (distance: number) => boolean
}

/**
 * Reusable hook for swipe tutorial hints with confirmations
 *
 * Usage:
 * ```tsx
 * const { showTutorial, triggerTutorial, checkAndComplete, ... } = useSwipeTutorial({
 *   storageKey: 'gallery-swipe-tutorial'
 * })
 *
 * // Trigger when element comes into view
 * useEffect(() => { if (isInView) triggerTutorial() }, [isInView])
 *
 * // On swipe/drag, call checkAndComplete with delta
 * onDrag={(delta) => checkAndComplete(delta)}
 * ```
 */
export function useSwipeTutorial({
  storageKey,
  completionThreshold = 50,
  successDelay = 1400
}: UseSwipeTutorialOptions): UseSwipeTutorialReturn {
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true) // Default true to prevent flash
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialSuccess, setTutorialSuccess] = useState(false)
  const swipeDistanceRef = useRef(0)

  useEffect(() => {
    const completed = localStorage.getItem(storageKey) === 'true'
    setHasCompletedTutorial(completed)
  }, [storageKey])

  const resetSwipeDistance = useCallback(() => {
    swipeDistanceRef.current = 0
  }, [])

  const addSwipeDistance = useCallback((distance: number) => {
    swipeDistanceRef.current += Math.abs(distance)
    return swipeDistanceRef.current
  }, [])

  const completeTutorial = useCallback(() => {
    if (tutorialSuccess) return // Prevent double completion
    setTutorialSuccess(true)
    localStorage.setItem(storageKey, 'true')
    setTimeout(() => {
      setHasCompletedTutorial(true)
      setShowTutorial(false)
    }, successDelay)
  }, [storageKey, successDelay, tutorialSuccess])

  const triggerTutorial = useCallback(() => {
    if (!hasCompletedTutorial && !showTutorial) {
      setShowTutorial(true)
    }
  }, [hasCompletedTutorial, showTutorial])

  const checkAndComplete = useCallback((distance: number): boolean => {
    if (!showTutorial || tutorialSuccess) return false
    const totalDistance = addSwipeDistance(distance)
    if (totalDistance >= completionThreshold) {
      completeTutorial()
      return true
    }
    return false
  }, [showTutorial, tutorialSuccess, addSwipeDistance, completionThreshold, completeTutorial])

  return {
    hasCompletedTutorial,
    showTutorial,
    tutorialSuccess,
    triggerTutorial,
    completeTutorial,
    resetSwipeDistance,
    addSwipeDistance,
    checkAndComplete
  }
}
