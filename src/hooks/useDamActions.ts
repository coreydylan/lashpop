/**
 * React Hook for DAM Action Tracking
 *
 * Provides helper functions to log user actions in the DAM
 */

import { useCallback } from 'react'
import type {
  UploadActionData,
  TagActionData,
  DeleteActionData,
  FilterActionData,
  SearchActionData,
  CollectionActionData,
  ViewChangeActionData,
  GroupChangeActionData
} from '@/db/schema/dam_user_actions'

export function useDamActions() {
  const logAction = useCallback(async (actionType: string, actionData: any) => {
    try {
      // Fire and forget - don't wait for response
      fetch('/api/dam/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ actionType, actionData })
      }).catch(error => {
        // Silently fail - action tracking shouldn't break the UI
        console.warn('Failed to log action:', error)
      })
    } catch (error) {
      // Silently fail
      console.warn('Failed to log action:', error)
    }
  }, [])

  // Helper functions for specific actions
  const logUpload = useCallback((data: UploadActionData) => {
    logAction('upload', data)
  }, [logAction])

  const logTagAdd = useCallback((data: TagActionData) => {
    logAction('tag_add', data)
  }, [logAction])

  const logTagRemove = useCallback((data: TagActionData) => {
    logAction('tag_remove', data)
  }, [logAction])

  const logDelete = useCallback((data: DeleteActionData) => {
    logAction('delete', data)
  }, [logAction])

  const logFilterChange = useCallback((data: FilterActionData) => {
    logAction('filter_change', data)
  }, [logAction])

  const logSearch = useCallback((data: SearchActionData) => {
    logAction('search', data)
  }, [logAction])

  const logCollectionCreate = useCallback((data: CollectionActionData) => {
    logAction('collection_create', data)
  }, [logAction])

  const logCollectionAdd = useCallback((data: CollectionActionData) => {
    logAction('collection_add', data)
  }, [logAction])

  const logViewChange = useCallback((data: ViewChangeActionData) => {
    logAction('view_change', data)
  }, [logAction])

  const logGroupChange = useCallback((data: GroupChangeActionData) => {
    logAction('group_change', data)
  }, [logAction])

  return {
    logUpload,
    logTagAdd,
    logTagRemove,
    logDelete,
    logFilterChange,
    logSearch,
    logCollectionCreate,
    logCollectionAdd,
    logViewChange,
    logGroupChange
  }
}
