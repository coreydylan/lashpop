/**
 * Workspace Manager for DAM
 *
 * Provides utilities for saving, loading, and managing workspace presets
 * Workspaces save the current view state including filters, sorting, grouping, and collection
 */

import { nanoid } from 'nanoid'

export interface WorkspaceState {
  // View settings
  filters: Array<{
    categoryId: string
    categoryName: string
    categoryDisplayName: string
    categoryColor?: string
    optionId: string
    optionName: string
    optionDisplayName: string
    imageUrl?: string
  }>
  groupBy: string[]
  sortBy?: 'uploadDate' | 'fileName' | 'modified' | 'fileSize'
  sortOrder?: 'asc' | 'desc'
  activeCollection?: string
  gridViewMode: 'square' | 'aspect'
}

export interface Workspace {
  id: string
  name: string
  description?: string
  emoji?: string

  // Saved state
  state: WorkspaceState

  // Metadata
  createdAt: string
  lastUsed: string
  useCount: number
}

export interface WorkspaceManager {
  workspaces: Workspace[]
}

/**
 * Create a new workspace from current state
 */
export function createWorkspace(
  name: string,
  currentState: WorkspaceState,
  options: {
    description?: string
    emoji?: string
  } = {}
): Workspace {
  const now = new Date().toISOString()

  return {
    id: nanoid(),
    name,
    description: options.description,
    emoji: options.emoji,
    state: currentState,
    createdAt: now,
    lastUsed: now,
    useCount: 0
  }
}

/**
 * Save a workspace to the manager
 */
export function saveWorkspace(
  manager: WorkspaceManager,
  workspace: Workspace
): WorkspaceManager {
  // Check if workspace with same ID exists
  const existingIndex = manager.workspaces.findIndex(w => w.id === workspace.id)

  if (existingIndex >= 0) {
    // Update existing workspace
    const updated = [...manager.workspaces]
    updated[existingIndex] = workspace
    return { ...manager, workspaces: updated }
  } else {
    // Add new workspace
    return {
      ...manager,
      workspaces: [...manager.workspaces, workspace]
    }
  }
}

/**
 * Load a workspace by ID and update its usage stats
 */
export function loadWorkspace(
  manager: WorkspaceManager,
  workspaceId: string
): { workspace: Workspace; updatedManager: WorkspaceManager } | null {
  const workspace = manager.workspaces.find(w => w.id === workspaceId)

  if (!workspace) {
    return null
  }

  // Update usage stats
  const updated: Workspace = {
    ...workspace,
    lastUsed: new Date().toISOString(),
    useCount: workspace.useCount + 1
  }

  const updatedManager = saveWorkspace(manager, updated)

  return {
    workspace: updated,
    updatedManager
  }
}

/**
 * Delete a workspace by ID
 */
export function deleteWorkspace(
  manager: WorkspaceManager,
  workspaceId: string
): WorkspaceManager {
  return {
    ...manager,
    workspaces: manager.workspaces.filter(w => w.id !== workspaceId)
  }
}

/**
 * Rename a workspace
 */
export function renameWorkspace(
  manager: WorkspaceManager,
  workspaceId: string,
  newName: string
): WorkspaceManager {
  const workspace = manager.workspaces.find(w => w.id === workspaceId)

  if (!workspace) {
    return manager
  }

  const updated: Workspace = {
    ...workspace,
    name: newName
  }

  return saveWorkspace(manager, updated)
}

/**
 * Update workspace metadata (description, emoji)
 */
export function updateWorkspaceMetadata(
  manager: WorkspaceManager,
  workspaceId: string,
  metadata: {
    description?: string
    emoji?: string
  }
): WorkspaceManager {
  const workspace = manager.workspaces.find(w => w.id === workspaceId)

  if (!workspace) {
    return manager
  }

  const updated: Workspace = {
    ...workspace,
    ...metadata
  }

  return saveWorkspace(manager, updated)
}

/**
 * Update workspace state (save current view to existing workspace)
 */
export function updateWorkspaceState(
  manager: WorkspaceManager,
  workspaceId: string,
  newState: WorkspaceState
): WorkspaceManager {
  const workspace = manager.workspaces.find(w => w.id === workspaceId)

  if (!workspace) {
    return manager
  }

  const updated: Workspace = {
    ...workspace,
    state: newState,
    lastUsed: new Date().toISOString()
  }

  return saveWorkspace(manager, updated)
}

/**
 * List all workspaces sorted by various criteria
 */
export function listWorkspaces(
  manager: WorkspaceManager,
  sortBy: 'name' | 'createdAt' | 'lastUsed' | 'useCount' = 'lastUsed'
): Workspace[] {
  const workspaces = [...manager.workspaces]

  switch (sortBy) {
    case 'name':
      return workspaces.sort((a, b) => a.name.localeCompare(b.name))

    case 'createdAt':
      return workspaces.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

    case 'lastUsed':
      return workspaces.sort((a, b) =>
        new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      )

    case 'useCount':
      return workspaces.sort((a, b) => b.useCount - a.useCount)

    default:
      return workspaces
  }
}

/**
 * Get frequently used workspaces
 */
export function getFrequentWorkspaces(
  manager: WorkspaceManager,
  limit: number = 5
): Workspace[] {
  return listWorkspaces(manager, 'useCount').slice(0, limit)
}

/**
 * Get recently used workspaces
 */
export function getRecentWorkspaces(
  manager: WorkspaceManager,
  limit: number = 5
): Workspace[] {
  return listWorkspaces(manager, 'lastUsed').slice(0, limit)
}

/**
 * Search workspaces by name or description
 */
export function searchWorkspaces(
  manager: WorkspaceManager,
  query: string
): Workspace[] {
  const lowerQuery = query.toLowerCase()

  return manager.workspaces.filter(workspace => {
    const nameMatch = workspace.name.toLowerCase().includes(lowerQuery)
    const descMatch = workspace.description?.toLowerCase().includes(lowerQuery)

    return nameMatch || descMatch
  })
}

/**
 * Check if current state matches a workspace
 */
export function matchesWorkspace(
  currentState: WorkspaceState,
  workspace: Workspace
): boolean {
  const { state } = workspace

  // Compare each aspect of the state
  const filtersMatch = JSON.stringify(currentState.filters) === JSON.stringify(state.filters)
  const groupByMatch = JSON.stringify(currentState.groupBy) === JSON.stringify(state.groupBy)
  const sortByMatch = currentState.sortBy === state.sortBy
  const sortOrderMatch = currentState.sortOrder === state.sortOrder
  const collectionMatch = currentState.activeCollection === state.activeCollection
  const gridViewMatch = currentState.gridViewMode === state.gridViewMode

  return filtersMatch && groupByMatch && sortByMatch && sortOrderMatch && collectionMatch && gridViewMatch
}

/**
 * Find workspaces that partially match current state
 */
export function findSimilarWorkspaces(
  manager: WorkspaceManager,
  currentState: WorkspaceState,
  threshold: number = 0.7
): Array<{ workspace: Workspace; similarity: number }> {
  return manager.workspaces
    .map(workspace => ({
      workspace,
      similarity: calculateStateSimilarity(currentState, workspace.state)
    }))
    .filter(({ similarity }) => similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
}

/**
 * Calculate similarity between two workspace states (0-1)
 */
function calculateStateSimilarity(
  state1: WorkspaceState,
  state2: WorkspaceState
): number {
  let matches = 0
  let total = 6 // Number of comparable fields

  // Compare filters (check if same filters exist, regardless of order)
  const filters1Ids = state1.filters.map(f => `${f.categoryId}:${f.optionId}`).sort()
  const filters2Ids = state2.filters.map(f => `${f.categoryId}:${f.optionId}`).sort()
  if (JSON.stringify(filters1Ids) === JSON.stringify(filters2Ids)) {
    matches++
  }

  // Compare groupBy
  const group1 = [...state1.groupBy].sort()
  const group2 = [...state2.groupBy].sort()
  if (JSON.stringify(group1) === JSON.stringify(group2)) {
    matches++
  }

  // Compare sortBy
  if (state1.sortBy === state2.sortBy) {
    matches++
  }

  // Compare sortOrder
  if (state1.sortOrder === state2.sortOrder) {
    matches++
  }

  // Compare activeCollection
  if (state1.activeCollection === state2.activeCollection) {
    matches++
  }

  // Compare gridViewMode
  if (state1.gridViewMode === state2.gridViewMode) {
    matches++
  }

  return matches / total
}

/**
 * Duplicate a workspace with a new name
 */
export function duplicateWorkspace(
  manager: WorkspaceManager,
  workspaceId: string,
  newName?: string
): WorkspaceManager | null {
  const workspace = manager.workspaces.find(w => w.id === workspaceId)

  if (!workspace) {
    return null
  }

  const duplicated = createWorkspace(
    newName || `${workspace.name} (Copy)`,
    workspace.state,
    {
      description: workspace.description,
      emoji: workspace.emoji
    }
  )

  return saveWorkspace(manager, duplicated)
}

/**
 * Export workspaces as JSON
 */
export function exportWorkspaces(manager: WorkspaceManager): string {
  return JSON.stringify(manager.workspaces, null, 2)
}

/**
 * Import workspaces from JSON
 */
export function importWorkspaces(
  manager: WorkspaceManager,
  jsonString: string,
  options: {
    merge?: boolean // If true, merge with existing. If false, replace
    skipDuplicates?: boolean // Skip workspaces with duplicate names
  } = {}
): WorkspaceManager {
  const { merge = true, skipDuplicates = true } = options

  try {
    const imported: Workspace[] = JSON.parse(jsonString)

    // Validate imported data
    if (!Array.isArray(imported)) {
      throw new Error('Invalid workspace data')
    }

    let workspaces = merge ? [...manager.workspaces] : []

    for (const workspace of imported) {
      // Check for duplicate names if skipDuplicates is true
      if (skipDuplicates && workspaces.some(w => w.name === workspace.name)) {
        continue
      }

      // Assign new IDs to avoid conflicts
      workspaces.push({
        ...workspace,
        id: nanoid()
      })
    }

    return { workspaces }
  } catch (error) {
    console.error('Failed to import workspaces:', error)
    return manager
  }
}

/**
 * Get workspace statistics
 */
export function getWorkspaceStats(manager: WorkspaceManager) {
  const workspaces = manager.workspaces

  return {
    total: workspaces.length,
    totalUses: workspaces.reduce((sum, w) => sum + w.useCount, 0),
    mostUsed: workspaces.reduce((max, w) => w.useCount > max.useCount ? w : max, workspaces[0]),
    leastUsed: workspaces.reduce((min, w) => w.useCount < min.useCount ? w : min, workspaces[0]),
    newest: workspaces.reduce((newest, w) =>
      new Date(w.createdAt) > new Date(newest.createdAt) ? w : newest,
      workspaces[0]
    ),
    oldest: workspaces.reduce((oldest, w) =>
      new Date(w.createdAt) < new Date(oldest.createdAt) ? w : oldest,
      workspaces[0]
    ),
    averageUseCount: workspaces.length > 0
      ? workspaces.reduce((sum, w) => sum + w.useCount, 0) / workspaces.length
      : 0
  }
}
