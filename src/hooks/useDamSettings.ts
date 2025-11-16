/**
 * React Hook for DAM User Settings
 *
 * Manages loading, updating, and persisting user settings for the DAM
 */

import { useState, useEffect, useCallback } from 'react'
import type { DamSettingsData } from '@/db/schema/dam_user_settings'

const DEFAULT_SETTINGS: DamSettingsData = {
  gridViewMode: 'square',
  thumbnailSize: 'md',
  activeFilters: [],
  groupByCategories: [],
  visibleCardTags: [],
  activeCollectionId: undefined,
  sortBy: 'uploadDate',
  sortOrder: 'desc'
}

export function useDamSettings() {
  const [settings, setSettings] = useState<DamSettingsData>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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

  // Save settings to database
  const saveSettings = useCallback(async (newSettings: Partial<DamSettingsData>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    setIsSaving(true)

    try {
      const response = await fetch('/api/dam/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings: updatedSettings })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save DAM settings:', error)
      // Revert on error
      setSettings(settings)
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  // Helper functions for common operations
  const updateGridViewMode = useCallback((mode: 'square' | 'aspect') => {
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

  const updateThumbnailSize = useCallback((size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    saveSettings({ thumbnailSize: size })
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
    updateActiveCollection,
    updateThumbnailSize
  }
}
