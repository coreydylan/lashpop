/**
 * Collection-related TypeScript types
 */

export interface CollectionPermissions {
  [tagName: string]: {
    viewers?: string[] // Email addresses or "*" for everyone
    editors?: string[] // Email addresses or "*" for everyone
  }
}

export interface CollectionDefaultViewConfig {
  [tagName: string]: {
    groupBy?: string[] // e.g. ["team", "lash_style"]
    hideTags?: string[] // Tag category names to hide in filter UI
    showTags?: string[] // Tag category names to show (if specified, only these shown)
    sortBy?: 'uploadedAt' | 'fileName' // Default sort order
    sortDirection?: 'asc' | 'desc'
    viewMode?: 'square' | 'aspect-ratio' // Default view mode
  }
}

export interface CollectionCategory {
  id: string
  name: string
  displayName: string
  description: string | null
  color: string | null
  icon: string | null
  sortOrder: number
  isCollection: boolean
  permissions: CollectionPermissions | null
  defaultViewConfig: CollectionDefaultViewConfig | null
  createdAt: Date
  updatedAt: Date
}

export interface CollectionTag {
  id: string
  categoryId: string
  name: string
  displayName: string
  description: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Helper type for active collection context
 */
export interface ActiveCollection {
  categoryId: string
  tagId: string
  tagName: string
  displayName: string
  permissions?: {
    viewers?: string[]
    editors?: string[]
  }
  viewConfig?: {
    groupBy?: string[]
    hideTags?: string[]
    showTags?: string[]
    sortBy?: 'uploadedAt' | 'fileName'
    sortDirection?: 'asc' | 'desc'
    viewMode?: 'square' | 'aspect-ratio'
  }
}
