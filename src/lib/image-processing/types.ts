/**
 * Type definitions for smart cropping engine
 */

import type { FaceLandmarks } from '../mediapipe-face'

/**
 * Crop data with position and scale
 */
export interface CropData {
  x: number // Pixel X coordinate (top-left)
  y: number // Pixel Y coordinate (top-left)
  width: number // Crop width in pixels
  height: number // Crop height in pixels
  scale?: number // Optional scale multiplier used
}

/**
 * Letterbox data for non-crop strategies
 */
export interface LetterboxData {
  method: 'blur' | 'solid' | 'extend'
  backgroundColor?: string // Hex color for solid method
  originalWidth: number
  originalHeight: number
  finalWidth: number
  finalHeight: number
}

/**
 * Safe zone importance levels
 */
export enum SafeZoneImportance {
  CRITICAL = 'critical', // Must be 95%+ visible (e.g., faces)
  IMPORTANT = 'important', // Should be 80%+ visible (e.g., text)
  PREFERRED = 'preferred' // Nice to have visible
}

/**
 * Safe zone definition
 */
export interface SafeZone {
  x: number // Top-left X coordinate (pixels)
  y: number // Top-left Y coordinate (pixels)
  width: number // Zone width (pixels)
  height: number // Zone height (pixels)
  importance: SafeZoneImportance
  type: 'face' | 'text' | 'custom'
  label?: string
}

/**
 * Platform specification for social media
 */
export interface PlatformSpec {
  name: string
  width: number
  height: number
  quality?: number // JPEG quality 1-100
}

/**
 * Crop strategy options
 */
export enum CropStrategy {
  SMART_CROP = 'smart_crop', // AI-based with face detection
  CENTER_WEIGHTED = 'center_weighted', // Simple center crop
  LETTERBOX_BLUR = 'letterbox_blur', // Blur background
  LETTERBOX_SOLID = 'letterbox_solid', // Solid color background
  LETTERBOX_EXTEND = 'letterbox_extend', // Extend edge pixels
  MULTI_FOCAL = 'multi_focal' // Multiple focal points
}

/**
 * Focal point for multi-focal cropping
 */
export interface FocalPoint {
  x: number // X coordinate in pixels
  y: number // Y coordinate in pixels
  weight?: number // Importance weight (0-1)
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  width: number
  height: number
  format: string
  hasAlpha?: boolean
  aspectRatio?: number
}

/**
 * Crop validation result
 */
export interface CropValidation {
  valid: boolean
  violations: SafeZone[] // Safe zones that are not sufficiently visible
  score: number // Validation score 0-100
  warnings: string[]
}

/**
 * Crop scoring result
 */
export interface CropScore {
  total: number // Total score 0-100
  faceScore: number // Face coverage and positioning
  compositionScore: number // Rule of thirds
  safeZoneScore: number // Safe zone preservation
}

/**
 * Options for AI smart crop
 */
export interface SmartCropOptions {
  faceLandmarks?: FaceLandmarks[]
  safeZones?: SafeZone[]
  preferredFocalPoint?: FocalPoint
}

/**
 * Result from crop operation
 */
export interface CropResult {
  croppedImage: Buffer
  cropData: CropData
  score: number
  metadata?: ImageMetadata
}

/**
 * Result from letterbox operation
 */
export interface LetterboxResult {
  croppedImage: Buffer
  letterboxData: LetterboxData
  metadata?: ImageMetadata
}

/**
 * Complete crop generation result
 */
export interface OptimalCropResult {
  croppedImage: Buffer
  cropData?: CropData
  letterboxData?: LetterboxData
  validationScore: number
  validationWarnings: string[]
  metadata?: ImageMetadata
}
