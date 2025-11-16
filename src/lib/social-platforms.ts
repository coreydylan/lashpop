/**
 * Social Media Platform Specifications & Constants
 *
 * Comprehensive specifications for all major social media platforms including
 * dimensions, file size limits, formats, and helper utilities.
 *
 * @example
 * ```typescript
 * import { getSpecsForPlatform, getSpecByVariant, findClosestSpec } from './social-platforms'
 *
 * // Get all Instagram specs
 * const instagramSpecs = getSpecsForPlatform('instagram')
 *
 * // Get specific variant
 * const storySpec = getSpecByVariant('instagram', 'story')
 *
 * // Find closest matching spec for custom dimensions
 * const closest = findClosestSpec(1080, 1920)
 * console.log(closest.displayName) // "Instagram Story"
 * ```
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'pinterest'
  | 'tiktok'

export interface PlatformSpec {
  platform: SocialPlatform
  variant: string
  displayName: string
  width: number
  height: number
  ratio: string
  maxFileSize?: number  // in bytes
  format?: string[]
  notes?: string
  category?: 'post' | 'story' | 'profile' | 'cover' | 'header' | 'thumbnail'
}

// ============================================================================
// Platform Specifications
// ============================================================================

export const PLATFORM_SPECS: PlatformSpec[] = [
  // INSTAGRAM (6 variants)
  {
    platform: 'instagram',
    variant: 'square',
    displayName: 'Instagram Square Post',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    maxFileSize: 8 * 1024 * 1024, // 8MB
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Classic Instagram square format, works for feed posts'
  },
  {
    platform: 'instagram',
    variant: 'portrait',
    displayName: 'Instagram Portrait Post',
    width: 1080,
    height: 1350,
    ratio: '4:5',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Vertical post format, maximizes screen real estate on mobile'
  },
  {
    platform: 'instagram',
    variant: 'landscape',
    displayName: 'Instagram Landscape Post',
    width: 1080,
    height: 566,
    ratio: '1.91:1',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Horizontal post format'
  },
  {
    platform: 'instagram',
    variant: 'story',
    displayName: 'Instagram Story',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png', 'mp4'],
    category: 'story',
    notes: 'Full-screen vertical story format'
  },
  {
    platform: 'instagram',
    variant: 'carousel',
    displayName: 'Instagram Carousel',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Multi-image carousel posts, square format recommended'
  },
  {
    platform: 'instagram',
    variant: 'profile',
    displayName: 'Instagram Profile Picture',
    width: 320,
    height: 320,
    ratio: '1:1',
    maxFileSize: 2 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'profile',
    notes: 'Profile picture, displayed as circle but uploaded as square'
  },

  // FACEBOOK (7 variants)
  {
    platform: 'facebook',
    variant: 'link',
    displayName: 'Facebook Link Post',
    width: 1200,
    height: 630,
    ratio: '1.91:1',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Link preview image, most common Facebook post format'
  },
  {
    platform: 'facebook',
    variant: 'square',
    displayName: 'Facebook Square Post',
    width: 1200,
    height: 1200,
    ratio: '1:1',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Square image post'
  },
  {
    platform: 'facebook',
    variant: 'portrait',
    displayName: 'Facebook Portrait Post',
    width: 1080,
    height: 1350,
    ratio: '4:5',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Vertical image post'
  },
  {
    platform: 'facebook',
    variant: 'story',
    displayName: 'Facebook Story',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png', 'mp4'],
    category: 'story',
    notes: 'Full-screen vertical story'
  },
  {
    platform: 'facebook',
    variant: 'cover',
    displayName: 'Facebook Cover Photo',
    width: 820,
    height: 312,
    ratio: '2.63:1',
    maxFileSize: 4 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'cover',
    notes: 'Profile cover photo for personal pages'
  },
  {
    platform: 'facebook',
    variant: 'profile',
    displayName: 'Facebook Profile Picture',
    width: 170,
    height: 170,
    ratio: '1:1',
    maxFileSize: 2 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'profile',
    notes: 'Profile picture, displayed as circle'
  },
  {
    platform: 'facebook',
    variant: 'event',
    displayName: 'Facebook Event Cover',
    width: 1920,
    height: 1005,
    ratio: '1.91:1',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'cover',
    notes: 'Event cover image'
  },

  // TWITTER (5 variants)
  {
    platform: 'twitter',
    variant: 'landscape',
    displayName: 'Twitter Post Landscape',
    width: 1200,
    height: 675,
    ratio: '16:9',
    maxFileSize: 5 * 1024 * 1024,
    format: ['jpg', 'png', 'gif'],
    category: 'post',
    notes: 'Standard landscape tweet image'
  },
  {
    platform: 'twitter',
    variant: 'square',
    displayName: 'Twitter Post Square',
    width: 1200,
    height: 1200,
    ratio: '1:1',
    maxFileSize: 5 * 1024 * 1024,
    format: ['jpg', 'png', 'gif'],
    category: 'post',
    notes: 'Square tweet image'
  },
  {
    platform: 'twitter',
    variant: 'portrait',
    displayName: 'Twitter Post Portrait',
    width: 1080,
    height: 1350,
    ratio: '4:5',
    maxFileSize: 5 * 1024 * 1024,
    format: ['jpg', 'png', 'gif'],
    category: 'post',
    notes: 'Vertical tweet image'
  },
  {
    platform: 'twitter',
    variant: 'header',
    displayName: 'Twitter Header',
    width: 1500,
    height: 500,
    ratio: '3:1',
    maxFileSize: 5 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'header',
    notes: 'Profile header banner image'
  },
  {
    platform: 'twitter',
    variant: 'profile',
    displayName: 'Twitter Profile Picture',
    width: 400,
    height: 400,
    ratio: '1:1',
    maxFileSize: 2 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'profile',
    notes: 'Profile picture, displayed as circle'
  },

  // LINKEDIN (6 variants)
  {
    platform: 'linkedin',
    variant: 'landscape',
    displayName: 'LinkedIn Post Landscape',
    width: 1200,
    height: 627,
    ratio: '1.91:1',
    maxFileSize: 10 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Standard LinkedIn post image'
  },
  {
    platform: 'linkedin',
    variant: 'square',
    displayName: 'LinkedIn Post Square',
    width: 1200,
    height: 1200,
    ratio: '1:1',
    maxFileSize: 10 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Square LinkedIn post'
  },
  {
    platform: 'linkedin',
    variant: 'personal-cover',
    displayName: 'LinkedIn Personal Cover',
    width: 1584,
    height: 396,
    ratio: '4:1',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'cover',
    notes: 'Personal profile background image'
  },
  {
    platform: 'linkedin',
    variant: 'company-cover',
    displayName: 'LinkedIn Company Cover',
    width: 1128,
    height: 191,
    ratio: '5.9:1',
    maxFileSize: 4 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'cover',
    notes: 'Company page cover image'
  },
  {
    platform: 'linkedin',
    variant: 'profile',
    displayName: 'LinkedIn Profile Picture',
    width: 400,
    height: 400,
    ratio: '1:1',
    maxFileSize: 8 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'profile',
    notes: 'Personal profile picture'
  },
  {
    platform: 'linkedin',
    variant: 'logo',
    displayName: 'LinkedIn Company Logo',
    width: 300,
    height: 300,
    ratio: '1:1',
    maxFileSize: 4 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'profile',
    notes: 'Company page logo'
  },

  // YOUTUBE (4 variants)
  {
    platform: 'youtube',
    variant: 'thumbnail',
    displayName: 'YouTube Video Thumbnail',
    width: 1280,
    height: 720,
    ratio: '16:9',
    maxFileSize: 2 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'thumbnail',
    notes: 'Video thumbnail, minimum 640x360'
  },
  {
    platform: 'youtube',
    variant: 'channel-cover',
    displayName: 'YouTube Channel Banner',
    width: 2560,
    height: 1440,
    ratio: '16:9',
    maxFileSize: 6 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'cover',
    notes: 'Channel banner art, safe area is 1546x423'
  },
  {
    platform: 'youtube',
    variant: 'profile',
    displayName: 'YouTube Profile Picture',
    width: 800,
    height: 800,
    ratio: '1:1',
    maxFileSize: 4 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'profile',
    notes: 'Channel profile picture, displayed as circle'
  },
  {
    platform: 'youtube',
    variant: 'community',
    displayName: 'YouTube Community Post',
    width: 1280,
    height: 720,
    ratio: '16:9',
    maxFileSize: 16 * 1024 * 1024,
    format: ['jpg', 'png', 'gif'],
    category: 'post',
    notes: 'Community tab post image'
  },

  // PINTEREST (4 variants)
  {
    platform: 'pinterest',
    variant: 'standard',
    displayName: 'Pinterest Standard Pin',
    width: 1000,
    height: 1500,
    ratio: '2:3',
    maxFileSize: 32 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Standard pin format, optimal for most content'
  },
  {
    platform: 'pinterest',
    variant: 'square',
    displayName: 'Pinterest Square Pin',
    width: 1000,
    height: 1000,
    ratio: '1:1',
    maxFileSize: 32 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Square pin format'
  },
  {
    platform: 'pinterest',
    variant: 'long',
    displayName: 'Pinterest Long Pin',
    width: 1000,
    height: 2100,
    ratio: '1:2.1',
    maxFileSize: 32 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'post',
    notes: 'Tall pin format, maximum recommended height'
  },
  {
    platform: 'pinterest',
    variant: 'profile',
    displayName: 'Pinterest Profile Picture',
    width: 165,
    height: 165,
    ratio: '1:1',
    maxFileSize: 2 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'profile',
    notes: 'Profile picture, displayed as circle'
  },

  // TIKTOK (2 variants)
  {
    platform: 'tiktok',
    variant: 'video-cover',
    displayName: 'TikTok Video Cover',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    maxFileSize: 50 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'thumbnail',
    notes: 'Full-screen vertical video cover'
  },
  {
    platform: 'tiktok',
    variant: 'profile',
    displayName: 'TikTok Profile Picture',
    width: 200,
    height: 200,
    ratio: '1:1',
    maxFileSize: 2 * 1024 * 1024,
    format: ['jpg', 'png'],
    category: 'profile',
    notes: 'Profile picture, displayed as circle'
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all specifications for a specific platform
 */
export function getSpecsForPlatform(platform: SocialPlatform): PlatformSpec[] {
  return PLATFORM_SPECS.filter(spec => spec.platform === platform)
}

/**
 * Get a specific variant spec for a platform
 */
export function getSpecByVariant(
  platform: SocialPlatform,
  variant: string
): PlatformSpec | undefined {
  return PLATFORM_SPECS.find(
    spec => spec.platform === platform && spec.variant === variant
  )
}

/**
 * Get all platform specifications
 */
export function getAllSpecs(): PlatformSpec[] {
  return [...PLATFORM_SPECS]
}

/**
 * Get the most commonly used variants across platforms
 */
export function getCommonVariants(): PlatformSpec[] {
  const commonVariantNames = ['square', 'landscape', 'story', 'profile']
  return PLATFORM_SPECS.filter(spec =>
    commonVariantNames.some(name => spec.variant.includes(name))
  )
}

/**
 * Calculate aspect ratio from dimensions
 * Returns simplified ratio string like "16:9", "1:1", "4:5"
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b)
  }

  const divisor = gcd(width, height)
  const w = width / divisor
  const h = height / divisor

  // Return common ratios with decimal notation if needed
  if (w === h) return '1:1'
  if (Math.abs(w / h - 16 / 9) < 0.01) return '16:9'
  if (Math.abs(w / h - 4 / 5) < 0.01) return '4:5'
  if (Math.abs(w / h - 9 / 16) < 0.01) return '9:16'
  if (Math.abs(w / h - 1.91) < 0.01) return '1.91:1'
  if (Math.abs(w / h - 2 / 3) < 0.01) return '2:3'

  // For other ratios, return the simplified version
  if (w > 100 || h > 100) {
    return `${(w / h).toFixed(2)}:1`
  }

  return `${w}:${h}`
}

/**
 * Find the closest matching spec for given dimensions
 * Uses aspect ratio similarity and resolution proximity
 */
export function findClosestSpec(width: number, height: number): PlatformSpec {
  const targetRatio = width / height
  const targetPixels = width * height

  let closestSpec = PLATFORM_SPECS[0]
  let closestScore = Infinity

  for (const spec of PLATFORM_SPECS) {
    const specRatio = spec.width / spec.height
    const specPixels = spec.width * spec.height

    // Calculate ratio difference (more important)
    const ratioDiff = Math.abs(targetRatio - specRatio)

    // Calculate pixel difference (less important)
    const pixelDiff = Math.abs(targetPixels - specPixels) / specPixels

    // Combined score (ratio is weighted 3x more than pixel count)
    const score = ratioDiff * 3 + pixelDiff

    if (score < closestScore) {
      closestScore = score
      closestSpec = spec
    }
  }

  return closestSpec
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate if dimensions match the spec (with small tolerance)
 */
export function validateDimensions(
  spec: PlatformSpec,
  actualWidth: number,
  actualHeight: number,
  tolerancePercent: number = 1
): boolean {
  const widthTolerance = spec.width * (tolerancePercent / 100)
  const heightTolerance = spec.height * (tolerancePercent / 100)

  const widthMatch = Math.abs(actualWidth - spec.width) <= widthTolerance
  const heightMatch = Math.abs(actualHeight - spec.height) <= heightTolerance

  return widthMatch && heightMatch
}

/**
 * Validate if file size is within platform limits
 */
export function validateFileSize(
  spec: PlatformSpec,
  fileSizeBytes: number
): boolean {
  if (!spec.maxFileSize) {
    return true // No limit specified
  }

  return fileSizeBytes <= spec.maxFileSize
}

/**
 * Get optimal JPEG quality based on platform and use case
 * Returns quality value from 0-100
 */
export function getOptimalQuality(spec: PlatformSpec): number {
  // Profile pictures can use lower quality (smaller files)
  if (spec.category === 'profile') {
    return 85
  }

  // Stories are temporary, can use slightly lower quality
  if (spec.category === 'story') {
    return 88
  }

  // Thumbnails should be high quality for clarity
  if (spec.category === 'thumbnail') {
    return 92
  }

  // Posts and covers should use high quality
  return 90
}

/**
 * Check if file format is supported by spec
 */
export function validateFormat(spec: PlatformSpec, format: string): boolean {
  if (!spec.format) {
    return true // No format restriction
  }

  const normalizedFormat = format.toLowerCase().replace('.', '')
  return spec.format.includes(normalizedFormat)
}

/**
 * Get dimension requirements as a formatted string
 */
export function formatDimensions(spec: PlatformSpec): string {
  return `${spec.width}×${spec.height}px (${spec.ratio})`
}

/**
 * Get file size limit as a formatted string
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`
  }
  return `${bytes}B`
}

// ============================================================================
// Preset Collections
// ============================================================================

export const PRESET_COLLECTIONS = {
  // Platform-specific essentials
  INSTAGRAM_ESSENTIALS: PLATFORM_SPECS.filter(
    spec => spec.platform === 'instagram' &&
    ['square', 'portrait', 'story'].includes(spec.variant)
  ),

  FACEBOOK_ESSENTIALS: PLATFORM_SPECS.filter(
    spec => spec.platform === 'facebook' &&
    ['link', 'square', 'story'].includes(spec.variant)
  ),

  TWITTER_ESSENTIALS: PLATFORM_SPECS.filter(
    spec => spec.platform === 'twitter' &&
    ['landscape', 'square'].includes(spec.variant)
  ),

  LINKEDIN_ESSENTIALS: PLATFORM_SPECS.filter(
    spec => spec.platform === 'linkedin' &&
    ['landscape', 'square'].includes(spec.variant)
  ),

  // Category-based collections
  ALL_POSTS: PLATFORM_SPECS.filter(spec => spec.category === 'post'),

  ALL_STORIES: PLATFORM_SPECS.filter(spec => spec.category === 'story'),

  ALL_PROFILES: PLATFORM_SPECS.filter(spec => spec.category === 'profile'),

  ALL_COVERS: PLATFORM_SPECS.filter(spec =>
    spec.category === 'cover' || spec.category === 'header'
  ),

  ALL_THUMBNAILS: PLATFORM_SPECS.filter(spec => spec.category === 'thumbnail'),

  // Aspect ratio collections
  SQUARE_FORMATS: PLATFORM_SPECS.filter(spec => spec.ratio === '1:1'),

  VERTICAL_FORMATS: PLATFORM_SPECS.filter(spec => {
    const [w, h] = spec.ratio.split(':').map(Number)
    return h > w
  }),

  HORIZONTAL_FORMATS: PLATFORM_SPECS.filter(spec => {
    const [w, h] = spec.ratio.split(':').map(Number)
    return w > h
  }),

  // Popular combinations
  FEED_POSTS: PLATFORM_SPECS.filter(spec =>
    spec.category === 'post' &&
    ['instagram', 'facebook', 'twitter', 'linkedin'].includes(spec.platform)
  ),

  STORY_FORMATS: PLATFORM_SPECS.filter(spec =>
    spec.category === 'story' ||
    (spec.platform === 'tiktok' && spec.variant === 'video-cover')
  ),
}

// ============================================================================
// Advanced Query Functions
// ============================================================================

/**
 * Get specs by category across all platforms
 */
export function getSpecsByCategory(
  category: PlatformSpec['category']
): PlatformSpec[] {
  return PLATFORM_SPECS.filter(spec => spec.category === category)
}

/**
 * Get specs by aspect ratio
 */
export function getSpecsByRatio(ratio: string): PlatformSpec[] {
  return PLATFORM_SPECS.filter(spec => spec.ratio === ratio)
}

/**
 * Get specs that fit within maximum dimensions
 */
export function getSpecsWithinDimensions(
  maxWidth: number,
  maxHeight: number
): PlatformSpec[] {
  return PLATFORM_SPECS.filter(
    spec => spec.width <= maxWidth && spec.height <= maxHeight
  )
}

/**
 * Get specs that support a specific file format
 */
export function getSpecsByFormat(format: string): PlatformSpec[] {
  const normalizedFormat = format.toLowerCase().replace('.', '')
  return PLATFORM_SPECS.filter(spec =>
    spec.format?.includes(normalizedFormat) || !spec.format
  )
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: SocialPlatform): string {
  const names: Record<SocialPlatform, string> = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    pinterest: 'Pinterest',
    tiktok: 'TikTok',
  }
  return names[platform]
}

/**
 * Group specs by platform
 */
export function groupSpecsByPlatform(): Record<SocialPlatform, PlatformSpec[]> {
  const grouped = {} as Record<SocialPlatform, PlatformSpec[]>

  for (const spec of PLATFORM_SPECS) {
    if (!grouped[spec.platform]) {
      grouped[spec.platform] = []
    }
    grouped[spec.platform].push(spec)
  }

  return grouped
}

/**
 * Get summary statistics about all specs
 */
export function getSpecsStats() {
  return {
    totalSpecs: PLATFORM_SPECS.length,
    platformCount: new Set(PLATFORM_SPECS.map(s => s.platform)).size,
    byPlatform: Object.entries(groupSpecsByPlatform()).map(([platform, specs]) => ({
      platform,
      count: specs.length
    })),
    byCategory: {
      post: PLATFORM_SPECS.filter(s => s.category === 'post').length,
      story: PLATFORM_SPECS.filter(s => s.category === 'story').length,
      profile: PLATFORM_SPECS.filter(s => s.category === 'profile').length,
      cover: PLATFORM_SPECS.filter(s => s.category === 'cover').length,
      header: PLATFORM_SPECS.filter(s => s.category === 'header').length,
      thumbnail: PLATFORM_SPECS.filter(s => s.category === 'thumbnail').length,
    },
    commonRatios: [...new Set(PLATFORM_SPECS.map(s => s.ratio))].sort(),
  }
}

// ============================================================================
// Export all constants and functions
// ============================================================================

export default PLATFORM_SPECS
