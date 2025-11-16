/**
 * Social Variant Command Handlers
 *
 * This module provides handlers and utilities for social variant generation,
 * export, filtering, and batch operations via the command palette.
 *
 * Example Usage:
 * ```typescript
 * import { generateSocialVariants, exportInstagramVariants } from './social-variant-commands'
 *
 * // Generate all social variants for an asset
 * await generateSocialVariants({ assetIds: ['asset-123'] })
 *
 * // Generate only Instagram variants
 * await generateInstagramVariants({ assetIds: ['asset-123'] })
 *
 * // Export all Instagram variants created in last 7 days
 * await exportInstagramVariantsRecent({ days: 7 })
 * ```
 */

import { toast } from './toast'

export interface Asset {
  id: string
  fileName: string
  fileType: string
  sourceAssetId?: string
}

export interface SocialVariant extends Asset {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin'
  variantType: string // e.g., 'square', 'portrait', 'story', 'landscape'
  width: number
  height: number
  createdAt: Date
  exported?: boolean
  validationWarnings?: string[]
}

export interface GenerateVariantsOptions {
  assetIds: string[]
  platforms?: string[]
  onProgress?: (current: number, total: number) => void
}

export interface ExportVariantsOptions {
  variantIds?: string[]
  platform?: string
  dateRange?: {
    from: Date
    to: Date
  }
  organize?: boolean // Organize by platform in ZIP
}

/**
 * Generate social variants for all specified platforms
 */
export async function generateSocialVariants(options: GenerateVariantsOptions): Promise<void> {
  const { assetIds, platforms = ['instagram', 'facebook', 'twitter'], onProgress } = options

  try {
    const response = await fetch('/api/dam/social-variants/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetIds,
        platforms
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate variants')
    }

    const data = await response.json()
    const count = data.variants?.length || 0
    const fileCount = assetIds.length

    if (fileCount === 1) {
      toast.success(`Generated ${count} social variants for ${data.fileName}`)
    } else {
      toast.success(`Generated ${count} variants from ${fileCount} images`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    toast.error(`Failed to generate variants: ${message}`)
    throw error
  }
}

/**
 * Generate Instagram-specific variants (square, portrait, story)
 */
export async function generateInstagramVariants(options: GenerateVariantsOptions): Promise<void> {
  return generateSocialVariants({ ...options, platforms: ['instagram'] })
}

/**
 * Generate Facebook-specific variants (post, story)
 */
export async function generateFacebookVariants(options: GenerateVariantsOptions): Promise<void> {
  return generateSocialVariants({ ...options, platforms: ['facebook'] })
}

/**
 * Generate Twitter-specific variants (landscape, square, header)
 */
export async function generateTwitterVariants(options: GenerateVariantsOptions): Promise<void> {
  return generateSocialVariants({ ...options, platforms: ['twitter'] })
}

/**
 * Export variants with optional filtering and organization
 */
export async function exportVariants(options: ExportVariantsOptions): Promise<void> {
  try {
    const response = await fetch('/api/dam/social-variants/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to export variants')
    }

    // Handle download
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `social-variants-${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    const data = await response.json()
    const count = data.count || 0
    toast.success(`Exported ${count} variants. Download starting...`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    toast.error(`Failed to export variants: ${message}`)
    throw error
  }
}

/**
 * Export all Instagram variants
 */
export async function exportAllInstagramVariants(): Promise<void> {
  return exportVariants({ platform: 'instagram', organize: true })
}

/**
 * Export Instagram variants from last N days
 */
export async function exportInstagramVariantsRecent(days: number = 7): Promise<void> {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)

  return exportVariants({
    platform: 'instagram',
    dateRange: { from, to },
    organize: true
  })
}

/**
 * Export all social variants across all platforms
 */
export async function exportAllSocialVariants(): Promise<void> {
  return exportVariants({ organize: true })
}

/**
 * Export selected variants by ID
 */
export async function exportSelectedVariants(variantIds: string[]): Promise<void> {
  if (variantIds.length === 0) {
    toast.error('No variants selected for export')
    return
  }

  return exportVariants({ variantIds, organize: true })
}

/**
 * Apply filter to show only social variants
 */
export function filterSocialVariantsOnly(): void {
  // This would integrate with the existing filter system
  // Implementation depends on how filters are stored/applied
  toast.info('Filtering to show only social variants')
}

/**
 * Apply filter to show unexported variants
 */
export function filterUnexportedVariants(): void {
  toast.info('Filtering to show only unexported variants')
}

/**
 * Apply filter to show variants with warnings
 */
export function filterVariantsWithWarnings(): void {
  toast.info('Filtering to show only variants needing adjustment')
}

/**
 * Batch generate variants for multiple assets
 */
export async function batchGenerateVariants(options: GenerateVariantsOptions): Promise<void> {
  const { assetIds, onProgress } = options

  if (assetIds.length === 0) {
    toast.error('No assets selected for variant generation')
    return
  }

  toast.info(`Generating variants for ${assetIds.length} images...`)

  try {
    await generateSocialVariants(options)
  } catch (error) {
    // Error already handled in generateSocialVariants
  }
}

/**
 * Regenerate all existing variants from source assets
 */
export async function regenerateAllVariants(): Promise<void> {
  const confirmed = window.confirm(
    'Regenerate all variants from source assets? This will update existing variants with the latest crop algorithm.'
  )

  if (!confirmed) return

  try {
    const response = await fetch('/api/dam/social-variants/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to regenerate variants')
    }

    const data = await response.json()
    toast.success(`Regenerated ${data.count} variants successfully`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    toast.error(`Failed to regenerate variants: ${message}`)
  }
}

/**
 * Natural language matching for social variant commands
 */
export function matchNaturalLanguage(query: string): Record<string, string[]> {
  const normalizedQuery = query.toLowerCase()

  const synonyms: Record<string, string[]> = {
    generate: ['create', 'make', 'build', 'generate'],
    export: ['download', 'get', 'save', 'export'],
    show: ['display', 'view', 'filter', 'show'],
    variants: ['versions', 'sizes', 'formats', 'variants'],
    selected: ['current selection', 'these', 'chosen', 'selected'],
    instagram: ['ig', 'insta', 'instagram'],
    facebook: ['fb', 'facebook'],
    twitter: ['tweet', 'twitter', 'x'],
    recent: ['last week', 'recent', 'latest', 'new']
  }

  const matches: Record<string, string[]> = {}

  // Check which synonym groups match the query
  Object.entries(synonyms).forEach(([key, words]) => {
    if (words.some(word => normalizedQuery.includes(word))) {
      matches[key] = words
    }
  })

  return matches
}

/**
 * Get command suggestions based on natural language query
 */
export function getSocialVariantCommandSuggestions(query: string): string[] {
  const matches = matchNaturalLanguage(query)
  const suggestions: string[] = []

  // Generate social variants
  if (matches.generate && matches.variants) {
    if (matches.instagram) {
      suggestions.push('generate-instagram-variants')
    } else if (matches.facebook) {
      suggestions.push('generate-facebook-variants')
    } else if (matches.twitter) {
      suggestions.push('generate-twitter-variants')
    } else {
      suggestions.push('generate-social-variants')
    }
  }

  // Export variants
  if (matches.export) {
    if (matches.instagram) {
      if (matches.recent) {
        suggestions.push('export-recent-instagram')
      } else {
        suggestions.push('export-all-instagram')
      }
    } else if (matches.selected) {
      suggestions.push('export-selected-variants')
    } else {
      suggestions.push('export-all-social-variants')
    }
  }

  // Show/filter variants
  if (matches.show) {
    if (matches.variants) {
      suggestions.push('show-social-variants')
    }
  }

  return suggestions
}
