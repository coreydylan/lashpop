/**
 * Smart Collections for Social Media Variants
 *
 * Auto-populated collections that dynamically update based on rules.
 * These collections organize social variants by platform, status, quality, and other criteria.
 */

export interface CollectionRule {
  field: string
  operator: 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'contains' | 'in' | 'notIn'
  value: any
}

export interface CollectionRules {
  platform?: string
  exported?: boolean
  validationScore?: { gte?: number; lte?: number; gt?: number; lt?: number }
  assetType?: string
  ratio?: string
  variant?: string
  createdAfter?: { days?: number; date?: Date }
  createdBefore?: { days?: number; date?: Date }
  validationWarnings?: { contains?: string }
  // Support for complex AND/OR logic
  and?: CollectionRules[]
  or?: CollectionRules[]
}

export interface SmartCollection {
  id: string
  name: string
  description: string
  icon?: string
  rules: CollectionRules
  autoUpdate: boolean
  sortBy?: 'uploadedAt' | 'createdAt' | 'exportedAt' | 'validationScore' | 'fileName'
  sortDirection?: 'asc' | 'desc'
  highlight?: 'warning' | 'success' | 'info'
  color?: string
}

/**
 * Predefined smart collections for social variants
 */
export const SOCIAL_VARIANT_COLLECTIONS: SmartCollection[] = [
  {
    id: 'instagram-ready',
    name: 'Instagram Posts - Ready to Export',
    description: 'Validated Instagram variants not yet exported',
    icon: 'instagram',
    rules: {
      platform: 'instagram',
      exported: false,
      validationScore: { gte: 80 }
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    highlight: 'success',
    color: '#E4405F'
  },

  {
    id: 'facebook-ready',
    name: 'Facebook Posts - Ready to Export',
    description: 'Validated Facebook variants not yet exported',
    icon: 'facebook',
    rules: {
      platform: 'facebook',
      exported: false,
      validationScore: { gte: 80 }
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    highlight: 'success',
    color: '#1877F2'
  },

  {
    id: 'twitter-ready',
    name: 'Twitter/X Posts - Ready to Export',
    description: 'Validated Twitter/X variants not yet exported',
    icon: 'twitter',
    rules: {
      platform: 'twitter',
      exported: false,
      validationScore: { gte: 80 }
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    color: '#1DA1F2'
  },

  {
    id: 'linkedin-ready',
    name: 'LinkedIn Posts - Ready to Export',
    description: 'Validated LinkedIn variants not yet exported',
    icon: 'linkedin',
    rules: {
      platform: 'linkedin',
      exported: false,
      validationScore: { gte: 80 }
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    color: '#0A66C2'
  },

  {
    id: 'social-this-week',
    name: 'Social Variants - This Week',
    description: 'All social variants created in the last 7 days',
    icon: 'calendar',
    rules: {
      createdAfter: { days: 7 }
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    color: '#6366F1'
  },

  {
    id: 'social-today',
    name: 'Social Variants - Today',
    description: 'All social variants created today',
    icon: 'clock',
    rules: {
      createdAfter: { days: 1 }
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    color: '#8B5CF6'
  },

  {
    id: 'needs-recrop',
    name: 'Needs Re-crop (Face Issues)',
    description: 'Variants with face cropping warnings',
    icon: 'alert-triangle',
    rules: {
      validationWarnings: { contains: 'face' }
    },
    autoUpdate: true,
    sortBy: 'validationScore',
    sortDirection: 'asc',
    highlight: 'warning',
    color: '#F59E0B'
  },

  {
    id: 'low-quality',
    name: 'Low Quality Variants',
    description: 'Variants with validation score below 70',
    icon: 'alert-circle',
    rules: {
      validationScore: { lt: 70 }
    },
    autoUpdate: true,
    sortBy: 'validationScore',
    sortDirection: 'asc',
    highlight: 'warning',
    color: '#EF4444'
  },

  {
    id: 'exported-social',
    name: 'Exported Social Content',
    description: 'All exported social media variants',
    icon: 'download',
    rules: {
      exported: true
    },
    autoUpdate: true,
    sortBy: 'exportedAt',
    sortDirection: 'desc',
    color: '#10B981'
  },

  {
    id: 'high-quality-variants',
    name: 'High Quality Variants',
    description: 'Variants with validation score >= 90',
    icon: 'star',
    rules: {
      validationScore: { gte: 90 }
    },
    autoUpdate: true,
    sortBy: 'validationScore',
    sortDirection: 'desc',
    color: '#FBBF24'
  },

  {
    id: 'all-stories',
    name: 'All Story Formats',
    description: 'Vertical story formats across all platforms (9:16)',
    icon: 'smartphone',
    rules: {
      ratio: '9:16'
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    color: '#EC4899'
  },

  {
    id: 'all-squares',
    name: 'All Square Posts',
    description: 'Square format posts across all platforms (1:1)',
    icon: 'square',
    rules: {
      ratio: '1:1'
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    color: '#14B8A6'
  },

  {
    id: 'all-landscape',
    name: 'All Landscape Posts',
    description: 'Landscape format posts (16:9)',
    icon: 'monitor',
    rules: {
      ratio: '16:9'
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    color: '#06B6D4'
  },

  {
    id: 'instagram-stories',
    name: 'Instagram Stories',
    description: 'Instagram story format (9:16)',
    icon: 'instagram',
    rules: {
      and: [
        { platform: 'instagram' },
        { ratio: '9:16' }
      ]
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    color: '#E4405F'
  },

  {
    id: 'instagram-posts',
    name: 'Instagram Square Posts',
    description: 'Instagram square posts (1:1)',
    icon: 'instagram',
    rules: {
      and: [
        { platform: 'instagram' },
        { ratio: '1:1' }
      ]
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    color: '#E4405F'
  },

  {
    id: 'recently-exported',
    name: 'Recently Exported',
    description: 'Social variants exported in the last 7 days',
    icon: 'download-cloud',
    rules: {
      and: [
        { exported: true },
        { createdAfter: { days: 7 } }
      ]
    },
    autoUpdate: true,
    sortBy: 'exportedAt',
    sortDirection: 'desc',
    color: '#10B981'
  },

  {
    id: 'never-exported',
    name: 'Never Exported',
    description: 'High quality variants that have never been exported',
    icon: 'archive',
    rules: {
      and: [
        { exported: false },
        { validationScore: { gte: 80 } }
      ]
    },
    autoUpdate: true,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    color: '#6366F1'
  }
]

/**
 * Get a smart collection by ID
 */
export function getSmartCollection(id: string): SmartCollection | undefined {
  return SOCIAL_VARIANT_COLLECTIONS.find(c => c.id === id)
}

/**
 * Get all smart collections for a specific platform
 */
export function getCollectionsByPlatform(platform: string): SmartCollection[] {
  return SOCIAL_VARIANT_COLLECTIONS.filter(c =>
    c.rules.platform === platform ||
    (c.rules.and && c.rules.and.some((r: any) => r.platform === platform))
  )
}

/**
 * Get all smart collections with warning highlights
 */
export function getWarningCollections(): SmartCollection[] {
  return SOCIAL_VARIANT_COLLECTIONS.filter(c => c.highlight === 'warning')
}

/**
 * Get collections suitable for the sidebar (most commonly used)
 */
export function getSidebarCollections(): SmartCollection[] {
  const priorityIds = [
    'instagram-ready',
    'facebook-ready',
    'social-this-week',
    'needs-recrop',
    'exported-social',
    'high-quality-variants',
    'all-stories',
    'all-squares'
  ]

  return SOCIAL_VARIANT_COLLECTIONS.filter(c => priorityIds.includes(c.id))
}
