/**
 * Undo/Redo Hook for DAM
 *
 * Provides undo/redo functionality for DAM actions with state snapshots
 * Tracks: tag, untag, delete, teamAssign, teamRemove
 */

import { useState, useCallback, useEffect } from 'react'
import { nanoid } from 'nanoid'

export type ActionType = 'tag' | 'untag' | 'delete' | 'teamAssign' | 'teamRemove'

export interface ActionSnapshot {
  id: string
  type: ActionType
  timestamp: string
  description: string

  // What was affected
  affectedAssetIds: string[]

  // State for reverting
  previousState: any
  newState: any

  // Optional metadata
  commandId?: string
}

export interface UndoRedoState {
  enabled: boolean
  maxStackSize: number
  stack: ActionSnapshot[]
  currentIndex: number // Points to the last executed action (-1 if empty)
}

interface UseUndoRedoOptions {
  maxStackSize?: number
  enabled?: boolean
  onUndo?: (action: ActionSnapshot) => Promise<void> | void
  onRedo?: (action: ActionSnapshot) => Promise<void> | void
  persistence?: {
    save: (state: UndoRedoState) => Promise<void> | void
    load: () => Promise<UndoRedoState | null> | UndoRedoState | null
  }
}

export function useUndoRedo({
  maxStackSize = 50,
  enabled = true,
  onUndo,
  onRedo,
  persistence
}: UseUndoRedoOptions = {}) {
  const [state, setState] = useState<UndoRedoState>({
    enabled,
    maxStackSize,
    stack: [],
    currentIndex: -1
  })

  const [isProcessing, setIsProcessing] = useState(false)

  // Load persisted state on mount
  useEffect(() => {
    if (persistence?.load) {
      const loadState = async () => {
        try {
          const loaded = await persistence.load()
          if (loaded) {
            setState(loaded)
          }
        } catch (error) {
          console.error('Failed to load undo/redo state:', error)
        }
      }
      loadState()
    }
  }, [persistence])

  // Save state when it changes
  useEffect(() => {
    if (persistence?.save) {
      const saveState = async () => {
        try {
          await persistence.save(state)
        } catch (error) {
          console.error('Failed to save undo/redo state:', error)
        }
      }
      saveState()
    }
  }, [state, persistence])

  /**
   * Add a new action to the history
   */
  const addAction = useCallback((
    type: ActionType,
    affectedAssetIds: string[],
    previousState: any,
    newState: any,
    description: string,
    commandId?: string
  ) => {
    if (!state.enabled) return

    const action: ActionSnapshot = {
      id: nanoid(),
      type,
      timestamp: new Date().toISOString(),
      description,
      affectedAssetIds,
      previousState,
      newState,
      commandId
    }

    setState(prev => {
      // Remove any actions after the current index (redo branch)
      const newStack = prev.stack.slice(0, prev.currentIndex + 1)

      // Add the new action
      newStack.push(action)

      // Trim stack to max size (remove oldest)
      if (newStack.length > prev.maxStackSize) {
        newStack.shift()
        return {
          ...prev,
          stack: newStack,
          currentIndex: newStack.length - 1
        }
      }

      return {
        ...prev,
        stack: newStack,
        currentIndex: newStack.length - 1
      }
    })
  }, [state.enabled])

  /**
   * Undo the last action
   */
  const undo = useCallback(async () => {
    if (state.currentIndex < 0 || isProcessing) {
      return false
    }

    setIsProcessing(true)

    try {
      const action = state.stack[state.currentIndex]

      // Call the undo handler if provided
      if (onUndo) {
        await onUndo(action)
      }

      // Move the index back
      setState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1
      }))

      return true
    } catch (error) {
      console.error('Failed to undo action:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [state.currentIndex, state.stack, isProcessing, onUndo])

  /**
   * Redo the next action
   */
  const redo = useCallback(async () => {
    if (state.currentIndex >= state.stack.length - 1 || isProcessing) {
      return false
    }

    setIsProcessing(true)

    try {
      const action = state.stack[state.currentIndex + 1]

      // Call the redo handler if provided
      if (onRedo) {
        await onRedo(action)
      }

      // Move the index forward
      setState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1
      }))

      return true
    } catch (error) {
      console.error('Failed to redo action:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [state.currentIndex, state.stack, isProcessing, onRedo])

  /**
   * Clear the entire history
   */
  const clear = useCallback(() => {
    setState(prev => ({
      ...prev,
      stack: [],
      currentIndex: -1
    }))
  }, [])

  /**
   * Enable or disable undo/redo
   */
  const setEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, enabled }))
  }, [])

  /**
   * Get the current action that can be undone
   */
  const getCurrentAction = useCallback((): ActionSnapshot | null => {
    if (state.currentIndex < 0) return null
    return state.stack[state.currentIndex]
  }, [state.currentIndex, state.stack])

  /**
   * Get the next action that can be redone
   */
  const getNextAction = useCallback((): ActionSnapshot | null => {
    if (state.currentIndex >= state.stack.length - 1) return null
    return state.stack[state.currentIndex + 1]
  }, [state.currentIndex, state.stack])

  const canUndo = state.currentIndex >= 0 && !isProcessing
  const canRedo = state.currentIndex < state.stack.length - 1 && !isProcessing

  return {
    // State
    history: state.stack,
    currentIndex: state.currentIndex,
    canUndo,
    canRedo,
    isProcessing,
    enabled: state.enabled,

    // Actions
    addAction,
    undo,
    redo,
    clear,
    setEnabled,

    // Queries
    getCurrentAction,
    getNextAction
  }
}

/**
 * Helper function to create tag action state
 */
export function createTagActionState(
  assetIds: string[],
  tagIds: string[],
  previousTags: Record<string, string[]> // assetId -> tagIds before action
) {
  return {
    previousState: previousTags,
    newState: assetIds.reduce((acc, assetId) => {
      const prev = previousTags[assetId] || []
      acc[assetId] = [...new Set([...prev, ...tagIds])]
      return acc
    }, {} as Record<string, string[]>)
  }
}

/**
 * Helper function to create untag action state
 */
export function createUntagActionState(
  assetIds: string[],
  tagIds: string[],
  previousTags: Record<string, string[]> // assetId -> tagIds before action
) {
  return {
    previousState: previousTags,
    newState: assetIds.reduce((acc, assetId) => {
      const prev = previousTags[assetId] || []
      acc[assetId] = prev.filter(id => !tagIds.includes(id))
      return acc
    }, {} as Record<string, string[]>)
  }
}

/**
 * Helper function to create delete action state
 */
export function createDeleteActionState(
  assets: Array<{
    id: string
    fileName: string
    filePath: string
    fileType: string
    uploadedAt: Date
    teamMemberId?: string
    tags?: any[]
  }>
) {
  return {
    previousState: { assets },
    newState: { assets: [] }
  }
}

/**
 * Helper function to create team assign action state
 */
export function createTeamAssignActionState(
  assetIds: string[],
  teamMemberId: string,
  previousAssignments: Record<string, string | undefined> // assetId -> teamMemberId
) {
  return {
    previousState: previousAssignments,
    newState: assetIds.reduce((acc, assetId) => {
      acc[assetId] = teamMemberId
      return acc
    }, {} as Record<string, string>)
  }
}

/**
 * Helper function to create team remove action state
 */
export function createTeamRemoveActionState(
  assetIds: string[],
  previousAssignments: Record<string, string | undefined> // assetId -> teamMemberId
) {
  return {
    previousState: previousAssignments,
    newState: assetIds.reduce((acc, assetId) => {
      acc[assetId] = undefined
      return acc
    }, {} as Record<string, string | undefined>)
  }
}

/**
 * Format action description for display
 */
export function formatActionDescription(action: ActionSnapshot): string {
  const count = action.affectedAssetIds.length
  const plural = count > 1 ? 's' : ''

  switch (action.type) {
    case 'tag':
      return `Tagged ${count} asset${plural}`
    case 'untag':
      return `Removed tags from ${count} asset${plural}`
    case 'delete':
      return `Deleted ${count} asset${plural}`
    case 'teamAssign':
      return `Assigned ${count} asset${plural} to team member`
    case 'teamRemove':
      return `Removed team member from ${count} asset${plural}`
    default:
      return action.description
  }
}
