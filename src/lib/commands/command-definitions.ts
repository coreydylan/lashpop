/**
 * Extended Command Definitions for DAM Command Palette
 *
 * Tier 1, Tier 2, and Tier 3 commands for Phases 5-7
 */

import type { CommandItem } from '@/app/dam/components/OmniCommandPalette'

export interface CommandDefinitionContext {
  // Asset state
  selectedAssets: any[]
  allAssets: any[]
  currentAsset?: any

  // Filter/view state
  activeFilters: any[]
  groupByCategories: string[]
  sortBy?: string
  sortOrder?: string

  // Data
  tagCategories: any[]
  teamMembers: any[]
  collections: any[]

  // Handlers
  onSelectAssets: (assetIds: string[]) => void
  onDeselectAssets: (assetIds: string[]) => void
  onInvertSelection: () => void
  onClearSelection: () => void

  onApplyFilters: (filters: any[]) => void
  onClearFilters: () => void

  onSort: (by: string, order: string) => void
  onGroup: (categories: string[]) => void

  onDownload: (assetIds: string[], filename?: string) => void
  onExportMetadata: (assetIds: string[]) => void

  onEditCaption: (assetIds: string[], caption: string) => void
  onEditAltText: (assetIds: string[], altText: string) => void

  onSearch: (query: string, field?: string) => void

  onUndo?: () => void
  onRedo?: () => void

  onSaveWorkspace?: (workspace: any) => void
  onLoadWorkspace?: (workspaceId: string) => void

  // State
  canUndo?: boolean
  canRedo?: boolean
  workspaces?: any[]
}

/**
 * Generate Tier 1 Commands: Search, Smart Selection, Quick Actions
 */
export function getTier1Commands(context: CommandDefinitionContext): CommandItem[] {
  const commands: CommandItem[] = []

  // ===================================
  // SEARCH & DISCOVERY
  // ===================================

  commands.push({
    id: 'search-filename',
    label: 'Search by filename...',
    group: 'Quick Actions',
    description: 'Find assets by filename',
    onSelect: () => {
      const query = prompt('Enter filename to search:')
      if (query) {
        context.onSearch(query, 'filename')
      }
    }
  })

  commands.push({
    id: 'search-caption',
    label: 'Search by caption...',
    group: 'Quick Actions',
    description: 'Find assets by caption text',
    onSelect: () => {
      const query = prompt('Enter caption text to search:')
      if (query) {
        context.onSearch(query, 'caption')
      }
    }
  })

  // ===================================
  // SMART SELECTION
  // ===================================

  // Select untagged assets
  const untaggedAssets = context.allAssets.filter(
    asset => !asset.tags || asset.tags.length === 0
  )
  if (untaggedAssets.length > 0) {
    commands.push({
      id: 'select-untagged',
      label: 'Select untagged assets',
      group: 'Smart Selection',
      description: `${untaggedAssets.length} assets without tags`,
      badge: `${untaggedAssets.length}`,
      onSelect: () => {
        context.onSelectAssets(untaggedAssets.map(a => a.id))
      }
    })
  }

  // Select assets without team member
  const unassignedAssets = context.allAssets.filter(
    asset => !asset.teamMemberId
  )
  if (unassignedAssets.length > 0) {
    commands.push({
      id: 'select-unassigned',
      label: 'Select assets without team member',
      group: 'Smart Selection',
      description: `${unassignedAssets.length} unassigned assets`,
      badge: `${unassignedAssets.length}`,
      onSelect: () => {
        context.onSelectAssets(unassignedAssets.map(a => a.id))
      }
    })
  }

  // Invert selection
  if (context.selectedAssets.length > 0) {
    commands.push({
      id: 'select-invert',
      label: 'Invert selection',
      group: 'Smart Selection',
      description: 'Select unselected, deselect selected',
      onSelect: () => {
        context.onInvertSelection()
      }
    })
  }

  // Select similar (based on tags)
  if (context.selectedAssets.length === 1) {
    const selectedAsset = context.selectedAssets[0]
    if (selectedAsset.tags && selectedAsset.tags.length > 0) {
      const tagIds = new Set(selectedAsset.tags.map((t: any) => t.id))
      const similarAssets = context.allAssets.filter(asset => {
        if (asset.id === selectedAsset.id) return false
        if (!asset.tags || asset.tags.length === 0) return false
        return asset.tags.some((t: any) => tagIds.has(t.id))
      })

      if (similarAssets.length > 0) {
        commands.push({
          id: 'select-similar',
          label: 'Select similar assets',
          group: 'Smart Selection',
          description: `${similarAssets.length} assets with similar tags`,
          badge: `${similarAssets.length}`,
          onSelect: () => {
            context.onSelectAssets(similarAssets.map((a: any) => a.id))
          }
        })
      }
    }
  }

  // ===================================
  // QUICK ACTIONS (UNDO/REDO)
  // ===================================

  if (context.onUndo && context.canUndo) {
    commands.push({
      id: 'undo',
      label: 'Undo last action',
      group: 'Quick Actions',
      description: 'Revert the last change',
      onSelect: () => {
        context.onUndo!()
      }
    })
  }

  if (context.onRedo && context.canRedo) {
    commands.push({
      id: 'redo',
      label: 'Redo last action',
      group: 'Quick Actions',
      description: 'Reapply the last undone change',
      onSelect: () => {
        context.onRedo!()
      }
    })
  }

  return commands
}

/**
 * Generate Tier 2 Commands: Metadata, Advanced Filtering, Sorting
 */
export function getTier2Commands(context: CommandDefinitionContext): CommandItem[] {
  const commands: CommandItem[] = []

  // ===================================
  // METADATA EDITING
  // ===================================

  if (context.selectedAssets.length > 0) {
    commands.push({
      id: 'edit-caption',
      label: 'Edit caption for selected',
      group: 'Metadata',
      description: `Edit caption for ${context.selectedAssets.length} assets`,
      onSelect: () => {
        const caption = prompt('Enter new caption:')
        if (caption !== null) {
          context.onEditCaption(
            context.selectedAssets.map(a => a.id),
            caption
          )
        }
      }
    })

    commands.push({
      id: 'edit-alttext',
      label: 'Edit alt text for selected',
      group: 'Metadata',
      description: `Edit alt text for ${context.selectedAssets.length} assets`,
      onSelect: () => {
        const altText = prompt('Enter new alt text:')
        if (altText !== null) {
          context.onEditAltText(
            context.selectedAssets.map(a => a.id),
            altText
          )
        }
      }
    })

    commands.push({
      id: 'clear-caption',
      label: 'Clear captions from selected',
      group: 'Metadata',
      description: `Remove captions from ${context.selectedAssets.length} assets`,
      onSelect: () => {
        if (confirm(`Clear captions from ${context.selectedAssets.length} assets?`)) {
          context.onEditCaption(
            context.selectedAssets.map(a => a.id),
            ''
          )
        }
      }
    })
  }

  // ===================================
  // ADVANCED FILTERING (TIME-BASED)
  // ===================================

  commands.push({
    id: 'filter-today',
    label: 'Filter › Uploaded today',
    group: 'Advanced Filtering',
    description: 'Show only today\'s uploads',
    onSelect: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      // Implement date filter
    }
  })

  commands.push({
    id: 'filter-this-week',
    label: 'Filter › Uploaded this week',
    group: 'Advanced Filtering',
    description: 'Show uploads from last 7 days',
    onSelect: () => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      // Implement date filter
    }
  })

  commands.push({
    id: 'filter-this-month',
    label: 'Filter › Uploaded this month',
    group: 'Advanced Filtering',
    description: 'Show this month\'s uploads',
    onSelect: () => {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      // Implement date filter
    }
  })

  // ===================================
  // SORTING
  // ===================================

  commands.push({
    id: 'sort-date-desc',
    label: 'Sort › Newest first',
    group: 'Organization',
    description: 'Sort by upload date (newest first)',
    isActive: context.sortBy === 'uploadDate' && context.sortOrder === 'desc',
    onSelect: () => {
      context.onSort('uploadDate', 'desc')
    }
  })

  commands.push({
    id: 'sort-date-asc',
    label: 'Sort › Oldest first',
    group: 'Organization',
    description: 'Sort by upload date (oldest first)',
    isActive: context.sortBy === 'uploadDate' && context.sortOrder === 'asc',
    onSelect: () => {
      context.onSort('uploadDate', 'asc')
    }
  })

  commands.push({
    id: 'sort-filename-asc',
    label: 'Sort › Filename (A-Z)',
    group: 'Organization',
    description: 'Sort alphabetically by filename',
    isActive: context.sortBy === 'fileName' && context.sortOrder === 'asc',
    onSelect: () => {
      context.onSort('fileName', 'asc')
    }
  })

  commands.push({
    id: 'sort-filename-desc',
    label: 'Sort › Filename (Z-A)',
    group: 'Organization',
    description: 'Sort reverse alphabetically',
    isActive: context.sortBy === 'fileName' && context.sortOrder === 'desc',
    onSelect: () => {
      context.onSort('fileName', 'desc')
    }
  })

  commands.push({
    id: 'sort-filesize-desc',
    label: 'Sort › Largest files first',
    group: 'Organization',
    description: 'Sort by file size (largest first)',
    isActive: context.sortBy === 'fileSize' && context.sortOrder === 'desc',
    onSelect: () => {
      context.onSort('fileSize', 'desc')
    }
  })

  commands.push({
    id: 'sort-filesize-asc',
    label: 'Sort › Smallest files first',
    group: 'Organization',
    description: 'Sort by file size (smallest first)',
    isActive: context.sortBy === 'fileSize' && context.sortOrder === 'asc',
    onSelect: () => {
      context.onSort('fileSize', 'asc')
    }
  })

  return commands
}

/**
 * Generate Tier 3 Commands: Export, Workspace, Tag Management
 */
export function getTier3Commands(context: CommandDefinitionContext): CommandItem[] {
  const commands: CommandItem[] = []

  // ===================================
  // EXPORT & DOWNLOAD
  // ===================================

  if (context.selectedAssets.length > 0) {
    commands.push({
      id: 'download-selected',
      label: 'Download selected as ZIP',
      group: 'Export & Download',
      description: `Download ${context.selectedAssets.length} assets`,
      badge: `${context.selectedAssets.length}`,
      onSelect: () => {
        context.onDownload(
          context.selectedAssets.map(a => a.id),
          'selected-assets.zip'
        )
      }
    })

    commands.push({
      id: 'export-metadata',
      label: 'Export metadata as CSV',
      group: 'Export & Download',
      description: `Export ${context.selectedAssets.length} asset details`,
      onSelect: () => {
        context.onExportMetadata(context.selectedAssets.map(a => a.id))
      }
    })
  }

  if (context.allAssets.length > 0) {
    commands.push({
      id: 'download-all',
      label: 'Download all as ZIP',
      group: 'Export & Download',
      description: `Download all ${context.allAssets.length} assets`,
      badge: `${context.allAssets.length}`,
      onSelect: () => {
        if (context.allAssets.length > 100) {
          if (!confirm(`Download ${context.allAssets.length} assets? This may take a while.`)) {
            return
          }
        }
        context.onDownload(
          context.allAssets.map(a => a.id),
          'all-assets.zip'
        )
      }
    })
  }

  // ===================================
  // WORKSPACE MANAGEMENT
  // ===================================

  if (context.onSaveWorkspace) {
    commands.push({
      id: 'save-workspace',
      label: 'Save current view as workspace',
      group: 'Workspaces',
      description: 'Save filters, sort, and grouping',
      onSelect: () => {
        const name = prompt('Workspace name:')
        if (name) {
          const workspace = {
            id: `workspace-${Date.now()}`,
            name,
            filters: context.activeFilters,
            groupBy: context.groupByCategories,
            sortBy: context.sortBy,
            sortOrder: context.sortOrder,
            createdAt: new Date().toISOString()
          }
          context.onSaveWorkspace!(workspace)
        }
      }
    })
  }

  if (context.onLoadWorkspace && context.workspaces && context.workspaces.length > 0) {
    context.workspaces.forEach(workspace => {
      commands.push({
        id: `load-workspace-${workspace.id}`,
        label: `${workspace.emoji || '📁'} ${workspace.name}`,
        group: 'Workspaces',
        description: workspace.description || 'Load saved workspace',
        onSelect: () => {
          context.onLoadWorkspace!(workspace.id)
        }
      })
    })
  }

  return commands
}

/**
 * Generate all extended commands
 */
export function getAllExtendedCommands(
  context: CommandDefinitionContext
): CommandItem[] {
  return [
    ...getTier1Commands(context),
    ...getTier2Commands(context),
    ...getTier3Commands(context)
  ]
}
