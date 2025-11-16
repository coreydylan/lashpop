/**
 * Smart Image Processing and Cropping Engine
 *
 * Comprehensive image processing library for social media content optimization.
 * Includes AI-powered smart cropping, safe zone detection, and multiple cropping strategies.
 */

// Export all types
export * from './types'

// Export smart crop functions
export {
  aiSmartCrop,
  centerWeightedCrop,
  intelligentLetterbox,
  multiFocalCrop,
  generateOptimalCrop,
  getImageMetadata,
  extractDominantColor,
  resizeImage
} from './smart-crop'

// Export safe zone functions
export {
  detectSafeZones,
  validateCrop
} from './safe-zones'
