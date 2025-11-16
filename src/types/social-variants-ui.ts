/**
 * Social Media Variants UI Types
 *
 * Shared type definitions for the social media variant generation,
 * preview, and editing components.
 */

// ============================================================================
// Platform Definitions
// ============================================================================

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "pinterest"
  | "tiktok"

export interface PlatformVariantSize {
  id: string
  platform: SocialPlatform
  name: string // e.g., "Square Post", "Story", "Reel"
  displayName: string // e.g., "Instagram Square (1:1)"
  width: number
  height: number
  description?: string
}

// Standard variant sizes for each platform
export const PLATFORM_VARIANTS: Record<SocialPlatform, PlatformVariantSize[]> = {
  instagram: [
    { id: "ig-square", platform: "instagram", name: "Square Post", displayName: "Square (1:1)", width: 1080, height: 1080 },
    { id: "ig-portrait", platform: "instagram", name: "Portrait Post", displayName: "Portrait (4:5)", width: 1080, height: 1350 },
    { id: "ig-landscape", platform: "instagram", name: "Landscape Post", displayName: "Landscape (1.91:1)", width: 1080, height: 566 },
    { id: "ig-story", platform: "instagram", name: "Story/Reel", displayName: "Story (9:16)", width: 1080, height: 1920 },
    { id: "ig-profile", platform: "instagram", name: "Profile Picture", displayName: "Profile (1:1)", width: 320, height: 320 },
    { id: "ig-carousel", platform: "instagram", name: "Carousel", displayName: "Carousel (1:1)", width: 1080, height: 1080 }
  ],
  facebook: [
    { id: "fb-post", platform: "facebook", name: "Post", displayName: "Post (1.91:1)", width: 1200, height: 630 },
    { id: "fb-story", platform: "facebook", name: "Story", displayName: "Story (9:16)", width: 1080, height: 1920 },
    { id: "fb-cover", platform: "facebook", name: "Cover Photo", displayName: "Cover (2.7:1)", width: 820, height: 312 },
    { id: "fb-profile", platform: "facebook", name: "Profile Picture", displayName: "Profile (1:1)", width: 180, height: 180 },
    { id: "fb-event", platform: "facebook", name: "Event Cover", displayName: "Event (1.91:1)", width: 1920, height: 1005 }
  ],
  twitter: [
    { id: "tw-post", platform: "twitter", name: "Post", displayName: "Post (16:9)", width: 1200, height: 675 },
    { id: "tw-header", platform: "twitter", name: "Header", displayName: "Header (3:1)", width: 1500, height: 500 },
    { id: "tw-profile", platform: "twitter", name: "Profile Picture", displayName: "Profile (1:1)", width: 400, height: 400 }
  ],
  linkedin: [
    { id: "li-post", platform: "linkedin", name: "Post", displayName: "Post (1.91:1)", width: 1200, height: 627 },
    { id: "li-article", platform: "linkedin", name: "Article Cover", displayName: "Article (1.91:1)", width: 1200, height: 627 },
    { id: "li-banner", platform: "linkedin", name: "Banner", displayName: "Banner (4:1)", width: 1584, height: 396 },
    { id: "li-profile", platform: "linkedin", name: "Profile Picture", displayName: "Profile (1:1)", width: 400, height: 400 }
  ],
  youtube: [
    { id: "yt-thumbnail", platform: "youtube", name: "Thumbnail", displayName: "Thumbnail (16:9)", width: 1280, height: 720 },
    { id: "yt-banner", platform: "youtube", name: "Channel Banner", displayName: "Banner (6.2:1)", width: 2560, height: 1440 },
    { id: "yt-profile", platform: "youtube", name: "Profile Picture", displayName: "Profile (1:1)", width: 800, height: 800 }
  ],
  pinterest: [
    { id: "pin-standard", platform: "pinterest", name: "Pin", displayName: "Pin (2:3)", width: 1000, height: 1500 },
    { id: "pin-long", platform: "pinterest", name: "Long Pin", displayName: "Long Pin (1:2.1)", width: 1000, height: 2100 },
    { id: "pin-square", platform: "pinterest", name: "Square Pin", displayName: "Square (1:1)", width: 1000, height: 1000 },
    { id: "pin-profile", platform: "pinterest", name: "Profile Picture", displayName: "Profile (1:1)", width: 165, height: 165 }
  ],
  tiktok: [
    { id: "tt-video", platform: "tiktok", name: "Video", displayName: "Video (9:16)", width: 1080, height: 1920 },
    { id: "tt-profile", platform: "tiktok", name: "Profile Picture", displayName: "Profile (1:1)", width: 200, height: 200 }
  ]
}

// ============================================================================
// Crop Strategy
// ============================================================================

export type CropStrategy = "smart-ai" | "center" | "letterbox"

export type LetterboxStyle = "blur" | "solid" | "extend"

export interface CropOptions {
  strategy: CropStrategy
  letterboxStyle?: LetterboxStyle
  letterboxColor?: string // hex color for solid letterbox
}

// ============================================================================
// Detection & Safe Zones
// ============================================================================

export interface DetectedElement {
  type: "face" | "logo" | "text" | "product"
  confidence: number // 0-1
  boundingBox: {
    x: number // percentage from left
    y: number // percentage from top
    width: number // percentage
    height: number // percentage
  }
  label?: string // e.g., "Brand logo", "Person 1"
}

export interface SafeZone {
  elementType: "face" | "logo" | "text" | "product"
  visibility: number // 0-100% how much is visible in crop
  status: "perfect" | "warning" | "error"
  message?: string // e.g., "Face 15% cropped"
}

// ============================================================================
// Crop Data
// ============================================================================

export interface CropData {
  x: number // top-left x coordinate (percentage)
  y: number // top-left y coordinate (percentage)
  width: number // crop width (percentage)
  height: number // crop height (percentage)
  scale?: number // zoom level (1 = 100%)
}

// ============================================================================
// Generated Variants
// ============================================================================

export type VariantStatus = "perfect" | "warning" | "error" | "pending"

export interface GeneratedVariant {
  id: string
  sourceAssetId: string
  platform: SocialPlatform
  variantType: string // e.g., "ig-square", "fb-story"
  displayName: string // e.g., "Instagram Square (1:1)"
  width: number
  height: number

  // Crop information
  cropData: CropData
  cropStrategy: CropStrategy
  letterboxStyle?: LetterboxStyle

  // Quality & validation
  status: VariantStatus
  qualityScore: number // 0-100
  warnings: string[]
  safeZones?: SafeZone[]

  // Generated output
  previewUrl?: string // preview thumbnail
  fullUrl?: string // full-size generated image
  fileName?: string
  fileSize?: number // in bytes

  // Metadata
  createdAt: Date
  exported?: boolean
  exportedAt?: Date
}

// ============================================================================
// Social Variant Asset (for DAM integration)
// ============================================================================

export interface SocialVariantAsset {
  id: string
  fileName: string
  filePath: string
  fileType: "image"

  // Link to source
  sourceAssetId: string
  sourceAssetPath?: string

  // Variant metadata
  platform: SocialPlatform
  variantType: string
  displayName: string
  width: number
  height: number

  // Status
  status: VariantStatus
  qualityScore: number

  // Timestamps
  createdAt: Date
  uploadedAt: Date
  exported?: boolean
  exportedAt?: Date
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

export interface SocialVariantGeneratorProps {
  sourceAsset: {
    id: string
    fileName: string
    filePath: string
    width: number
    height: number
  }
  open: boolean
  onClose: () => void
  onGenerate: (variants: GeneratedVariant[]) => void
}

export interface VariantPreviewGridProps {
  variants: GeneratedVariant[]
  onApprove: (variantIds: string[]) => void
  onReject: (variantIds: string[]) => void
  onAdjust: (variantId: string) => void
  onClose: () => void
}

export interface VariantEditorProps {
  variant: GeneratedVariant
  sourceImage: string
  open: boolean
  onClose: () => void
  onSave: (adjustedCrop: CropData) => void
}

export interface SocialVariantCardProps {
  variant: SocialVariantAsset
  selected?: boolean
  onSelect?: () => void
  onClick?: () => void
}

// ============================================================================
// Generation Settings
// ============================================================================

export interface GenerationSettings {
  selectedPlatforms: SocialPlatform[]
  cropStrategy: CropStrategy
  letterboxStyle?: LetterboxStyle
  letterboxColor?: string
  namingConvention: "platform-size" | "platform-name" | "custom"
  customNaming?: string // template string with {platform}, {size}, {original}
  autoSave: boolean
  createCollection: boolean
  autoTag: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getPlatformLabel(platform: SocialPlatform): string {
  const labels: Record<SocialPlatform, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    twitter: "Twitter",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    pinterest: "Pinterest",
    tiktok: "TikTok"
  }
  return labels[platform]
}

export function getPlatformIcon(platform: SocialPlatform): string {
  // Returns lucide-react icon name
  const icons: Record<SocialPlatform, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    twitter: "Twitter",
    linkedin: "Linkedin",
    youtube: "Youtube",
    pinterest: "PinIcon",
    tiktok: "Music" // TikTok uses music note as closest icon
  }
  return icons[platform]
}

export function getStatusColor(status: VariantStatus): string {
  const colors: Record<VariantStatus, string> = {
    perfect: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
    pending: "text-gray-400"
  }
  return colors[status]
}

export function getStatusBgColor(status: VariantStatus): string {
  const colors: Record<VariantStatus, string> = {
    perfect: "bg-green-100",
    warning: "bg-yellow-100",
    error: "bg-red-100",
    pending: "bg-gray-100"
  }
  return colors[status]
}

export function estimateGenerationTime(variantCount: number): number {
  // Rough estimate: 2 seconds per variant
  return variantCount * 2
}

export function estimateTotalSize(variantCount: number, avgSizeKB: number = 500): number {
  // Returns size in MB
  return (variantCount * avgSizeKB) / 1024
}
