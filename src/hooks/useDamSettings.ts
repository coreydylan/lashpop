/**
 * React Hook for DAM User Settings
 *
 * Manages loading, updating, and persisting user settings for the DAM
 * Settings saves are debounced to reduce database writes
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { DamSettingsData } from '@/db/schema/dam_user_settings'

const DEFAULT_SETTINGS: DamSettingsData = {
  gridViewMode: 'square',
  activeFilters: [],
  groupByCategories: [],
  visibleCardTags: [],
  activeCollectionId: undefined,
  sortBy: 'uploadDate',
  sortOrder: 'desc'
}

const DEBOUNCE_DELAY = 500 // 500ms debounce

export function useDamSettings() {
  const [settings, setSettings] = useState<DamSettingsData>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingSettingsRef = useRef<DamSettingsData | null>(null)

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/dam/settings', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings)
        } else if (response.status === 401 || response.status === 403) {
          // Not authenticated or no access - use defaults
          setSettings(DEFAULT_SETTINGS)
        }
      } catch (error) {
        console.error('Failed to load DAM settings:', error)
        // Use defaults on error
        setSettings(DEFAULT_SETTINGS)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Debounced save to database
  const saveToDatabase = useCallback(async (settingsToSave: DamSettingsData) => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/dam/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings: settingsToSave })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save DAM settings:', error)
    } finally {
      setIsSaving(false)
      pendingSettingsRef.current = null
    }
  }, [])

  // Save settings with debouncing
  const saveSettings = useCallback((newSettings: Partial<DamSettingsData>) => {
    const updatedSettings = { ...settings, ...newSettings }

    // Update UI immediately (optimistic update)
    setSettings(updatedSettings)
    pendingSettingsRef.current = updatedSettings

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce the actual save
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingSettingsRef.current) {
        saveToDatabase(pendingSettingsRef.current)
      }
    }, DEBOUNCE_DELAY)
  }, [settings, saveToDatabase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // Save any pending changes immediately on unmount
      if (pendingSettingsRef.current) {
        saveToDatabase(pendingSettingsRef.current)
      }
    }
  }, [saveToDatabase])

  // Helper functions for common operations
  const updateGridViewMode = useCallback((mode: 'square' | 'aspect' | 'masonry') => {
    saveSettings({ gridViewMode: mode })
  }, [saveSettings])

  const updateActiveFilters = useCallback((filters: DamSettingsData['activeFilters']) => {
    saveSettings({ activeFilters: filters })
  }, [saveSettings])

  const updateGroupByCategories = useCallback((categories: string[]) => {
    saveSettings({ groupByCategories: categories })
  }, [saveSettings])

  const updateVisibleCardTags = useCallback((tags: string[]) => {
    saveSettings({ visibleCardTags: tags })
  }, [saveSettings])

  const updateActiveCollection = useCallback((collectionId: string | undefined) => {
    saveSettings({ activeCollectionId: collectionId })
  }, [saveSettings])

  return {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    updateGridViewMode,
    updateActiveFilters,
    updateGroupByCategories,
    updateVisibleCardTags,
    updateActiveCollection
  }
}
