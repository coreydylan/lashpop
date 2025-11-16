/**
 * Type definitions for Social Media Variant Generation API
 *
 * These types define the structure for generating, managing, and exporting
 * social media variants of source assets.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Social media platform enum
 */
export enum SocialPlatform {
  INSTAGRAM = "instagram",
  FACEBOOK = "facebook",
  TWITTER = "twitter",
  LINKEDIN = "linkedin",
  YOUTUBE = "youtube",
  PINTEREST = "pinterest",
  TIKTOK = "tiktok"
}

/**
 * Crop strategy enum
 */
export enum CropStrategy {
  SMART_CROP = "smart_crop",      // AI-powered face/subject detection
  CENTER_CROP = "center_crop",     // Simple center crop
  LETTERBOX = "letterbox",         // Letterbox with fill
  EXTEND = "extend"                // Extend edges
}

/**
 * Safe zone definition for preserving important content areas
 */
export interface SafeZone {
  /** X coordinate (pixels from left) */
  x: number
  /** Y coordinate (pixels from top) */
  y: number
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Importance level for crop validation */
  importance: 'critical' | 'important' | 'optional'
  /** Type of content in the safe zone */
  type: 'face' | 'logo' | 'text' | 'product' | 'subject'
}

/**
 * Crop data containing coordinates and safe zones
 */
export interface CropData {
  /** X coordinate of crop (pixels from left) */
  x: number
  /** Y coordinate of crop (pixels from top) */
  y: number
  /** Crop width in pixels */
  width: number
  /** Crop height in pixels */
  height: number
  /** Validation score (0-100) based on safe zone preservation */
  score: number
  /** Safe zones within this crop */
  safeZones: SafeZone[]
}

/**
 * Letterbox method and settings
 */
export interface LetterboxData {
  /** Letterbox fill method */
  method: 'blur' | 'solid' | 'extend'
  /** Background color for solid method (hex format) */
  backgroundColor?: string
}

export interface SocialVariantSpec {
  platform: SocialPlatform
  variant: string
  width: number
  height: number
  aspectRatio: string
  displayName: string
  description?: string
}

// ============================================================================
// Request Types
// ============================================================================

export interface GenerateVariantsRequest {
  sourceAssetId: string
  platforms: SocialPlatform[]
  variants?: string[]             // Optional: specific variants, or all if omitted
  cropStrategy?: CropStrategy     // Defaults to SMART_CROP
  skipPreview?: boolean           // If true, auto-save without preview
}

export interface SaveVariantsRequest {
  sourceAssetId: string
  variants: Array<{
    platform: SocialPlatform
    variant: string
    s3Key: string
    cropData?: CropData
    validationScore: number
  }>
  collectionName?: string         // Optional: create/add to collection
  tags?: string[]                 // Optional: auto-tag variants
}

export interface AdjustCropRequest {
  cropData: CropData
  regenerate: boolean             // If true, regenerate image with new crop
}

export interface ExportVariantsRequest {
  assetIds: string[]
  format?: 'original' | 'jpg' | 'png'
  quality?: number                // 0-100 for JPEG
  organize?: 'flat' | 'by-variant' | 'by-platform' | 'by-source'
  includeMetadata?: boolean       // Include JSON metadata files
}

export interface BatchGenerateRequest {
  sourceAssetIds: string[]
  platforms: SocialPlatform[]
  cropStrategy?: CropStrategy
  autoSave?: boolean
}

// ============================================================================
// Response Types
// ============================================================================

export interface GeneratedVariant {
  id: string                      // temp ID if not saved yet
  platform: SocialPlatform
  variant: string
  width: number
  height: number
  ratio: string
  cropData?: CropData
  validationScore: number
  validationWarnings?: string[]
  previewUrl: string              // S3 presigned URL
}

export interface GenerateVariantsResponse {
  variants: GeneratedVariant[]
  sourceAsset: {
    id: string
    fileName: string
    width: number
    height: number
  }
  summary: {
    total: number
    byPlatform: Record<string, number>
  }
}

export interface SaveVariantsResponse {
  saved: number
  assetIds: string[]
  collectionId?: string
}

export interface QueryVariantsResponse {
  variants: SocialVariantAsset[]
  total: number
  filters: {
    platform?: SocialPlatform
    sourceAssetId?: string
    exported?: boolean
    createdAfter?: string
  }
}

export interface AdjustCropResponse {
  success: boolean
  updatedAsset: SocialVariantAsset
  newPreviewUrl?: string
}

export interface ExportVariantsResponse {
  downloadUrl: string
  expiresIn: number               // Seconds until URL expires
  fileCount: number
  totalSize: number               // bytes
}

export interface BatchGenerateResponse {
  jobId: string
  total: number
  estimated: number               // Estimated seconds
}

export interface BatchStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number                // 0-100
  completed: number
  total: number
  results?: Array<{
    sourceAssetId: string
    variantsCreated: number
    errors?: string[]
  }>
}

// ============================================================================
// Asset Types
// ============================================================================

/**
 * Social variant asset type
 * Extends the base asset with social media-specific fields
 */
export interface SocialVariantAsset {
  // Base asset fields
  id: string
  fileName: string
  filePath: string
  fileType: "image" | "video"
  mimeType: string
  fileSize: number
  width: number
  height: number

  // Social variant-specific fields
  sourceAssetId: string
  platform: SocialPlatform
  variant: string
  ratio: string
  cropStrategy: CropStrategy
  crop?: CropData
  letterbox?: LetterboxData
  validationScore: number
  validationWarnings?: string[]

  // Export tracking
  exported: boolean
  exportedAt?: Date
  exportedTo?: string

  // Timestamps
  uploadedAt: Date
  updatedAt: Date

  // Optional base asset fields
  altText?: string
  caption?: string
  teamMemberId?: string | null
  color?: string | null
  length?: string | null
  curl?: string | null

  // Optional relations
  tags?: Array<{
    id: string
    name: string
    displayName: string
  }>
}

/**
 * Filters for querying social variant assets
 */
export interface SocialVariantFilters {
  platform?: SocialPlatform | SocialPlatform[]
  variant?: string | string[]
  ratio?: string | string[]
  cropStrategy?: CropStrategy | CropStrategy[]
  exported?: boolean
  minValidationScore?: number
  sourceAssetId?: string | string[]
}

// ============================================================================
// Variant Specifications
// ============================================================================

export const SOCIAL_VARIANT_SPECS: Record<SocialPlatform, SocialVariantSpec[]> = {
  [SocialPlatform.INSTAGRAM]: [
    {
      platform: SocialPlatform.INSTAGRAM,
      variant: 'square',
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
      displayName: 'Instagram Square',
      description: 'Standard square post'
    },
    {
      platform: SocialPlatform.INSTAGRAM,
      variant: 'portrait',
      width: 1080,
      height: 1350,
      aspectRatio: '4:5',
      displayName: 'Instagram Portrait',
      description: 'Portrait post'
    },
    {
      platform: SocialPlatform.INSTAGRAM,
      variant: 'story',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      displayName: 'Instagram Story',
      description: 'Story/Reels format'
    },
    {
      platform: SocialPlatform.INSTAGRAM,
      variant: 'landscape',
      width: 1080,
      height: 566,
      aspectRatio: '1.91:1',
      displayName: 'Instagram Landscape',
      description: 'Landscape post'
    }
  ],
  [SocialPlatform.FACEBOOK]: [
    {
      platform: SocialPlatform.FACEBOOK,
      variant: 'feed',
      width: 1200,
      height: 630,
      aspectRatio: '1.91:1',
      displayName: 'Facebook Feed',
      description: 'Standard feed post'
    },
    {
      platform: SocialPlatform.FACEBOOK,
      variant: 'story',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      displayName: 'Facebook Story',
      description: 'Story format'
    },
    {
      platform: SocialPlatform.FACEBOOK,
      variant: 'square',
      width: 1200,
      height: 1200,
      aspectRatio: '1:1',
      displayName: 'Facebook Square',
      description: 'Square post'
    }
  ],
  [SocialPlatform.TWITTER]: [
    {
      platform: SocialPlatform.TWITTER,
      variant: 'post',
      width: 1200,
      height: 675,
      aspectRatio: '16:9',
      displayName: 'Twitter Post',
      description: 'Standard tweet image'
    },
    {
      platform: SocialPlatform.TWITTER,
      variant: 'header',
      width: 1500,
      height: 500,
      aspectRatio: '3:1',
      displayName: 'Twitter Header',
      description: 'Profile header image'
    }
  ],
  [SocialPlatform.LINKEDIN]: [
    {
      platform: SocialPlatform.LINKEDIN,
      variant: 'post',
      width: 1200,
      height: 627,
      aspectRatio: '1.91:1',
      displayName: 'LinkedIn Post',
      description: 'Standard post image'
    },
    {
      platform: SocialPlatform.LINKEDIN,
      variant: 'banner',
      width: 1584,
      height: 396,
      aspectRatio: '4:1',
      displayName: 'LinkedIn Banner',
      description: 'Profile banner image'
    }
  ],
  [SocialPlatform.PINTEREST]: [
    {
      platform: SocialPlatform.PINTEREST,
      variant: 'pin',
      width: 1000,
      height: 1500,
      aspectRatio: '2:3',
      displayName: 'Pinterest Pin',
      description: 'Standard pin format'
    },
    {
      platform: SocialPlatform.PINTEREST,
      variant: 'square',
      width: 1000,
      height: 1000,
      aspectRatio: '1:1',
      displayName: 'Pinterest Square',
      description: 'Square pin'
    }
  ],
  [SocialPlatform.TIKTOK]: [
    {
      platform: SocialPlatform.TIKTOK,
      variant: 'video',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      displayName: 'TikTok Video',
      description: 'Vertical video thumbnail'
    }
  ],
  [SocialPlatform.YOUTUBE]: [
    {
      platform: SocialPlatform.YOUTUBE,
      variant: 'thumbnail',
      width: 1280,
      height: 720,
      aspectRatio: '16:9',
      displayName: 'YouTube Thumbnail',
      description: 'Video thumbnail'
    },
    {
      platform: SocialPlatform.YOUTUBE,
      variant: 'banner',
      width: 2560,
      height: 1440,
      aspectRatio: '16:9',
      displayName: 'YouTube Banner',
      description: 'Channel banner'
    }
  ]
}

/**
 * Get all variant specifications for given platforms
 */
export function getVariantSpecs(platforms: SocialPlatform[], variantNames?: string[]): SocialVariantSpec[] {
  const specs: SocialVariantSpec[] = []

  for (const platform of platforms) {
    const platformSpecs = SOCIAL_VARIANT_SPECS[platform] || []

    if (variantNames && variantNames.length > 0) {
      // Filter to specific variants
      specs.push(...platformSpecs.filter(spec => variantNames.includes(spec.variant)))
    } else {
      // Include all variants for this platform
      specs.push(...platformSpecs)
    }
  }

  return specs
}

/**
 * Calculate validation score for a crop (0-100)
 * Higher score = better quality/composition
 */
export function calculateValidationScore(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  cropData?: CropData
): number {
  // Base score on how much of the source image is used
  const sourceAspect = sourceWidth / sourceHeight
  const targetAspect = targetWidth / targetHeight

  // Calculate what percentage of source image will be used
  let coverageScore = 0
  if (cropData) {
    coverageScore = cropData.width * cropData.height * 100
  } else {
    // Estimate coverage based on aspect ratios
    if (sourceAspect > targetAspect) {
      // Source is wider - height will be constrained
      coverageScore = (targetAspect / sourceAspect) * 100
    } else {
      // Source is taller - width will be constrained
      coverageScore = (sourceAspect / targetAspect) * 100
    }
  }

  // Penalize extreme crops (less than 30% of image used)
  if (coverageScore < 30) {
    coverageScore *= 0.7
  }

  return Math.min(100, Math.round(coverageScore))
}
