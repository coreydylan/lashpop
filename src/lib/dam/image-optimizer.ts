import sharp from 'sharp';

export interface OptimizedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: 'webp' | 'jpeg';
  mimeType: string;
  originalWidth: number;
  originalHeight: number;
}

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'auto';
}

const DEFAULT_OPTIONS: Required<OptimizationOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 85,
  format: 'webp',
};

/**
 * Optimize an image buffer for web delivery
 * - Resizes to fit within max dimensions while preserving aspect ratio
 * - Converts to WebP (or JPEG as fallback)
 * - Compresses with specified quality
 * - Returns dimensions for database storage
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  options: OptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Get original image metadata
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // Start with the input buffer
  let pipeline = sharp(inputBuffer);

  // Resize if larger than max dimensions
  if (originalWidth > opts.maxWidth || originalHeight > opts.maxHeight) {
    pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to optimized format
  let format: 'webp' | 'jpeg' = opts.format === 'auto' ? 'webp' : opts.format;
  let mimeType: string;

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality: opts.quality });
    mimeType = 'image/webp';
  } else {
    pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
    mimeType = 'image/jpeg';
  }

  // Process the image
  const outputBuffer = await pipeline.toBuffer();

  // Get final dimensions
  const outputMetadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: outputMetadata.width || 0,
    height: outputMetadata.height || 0,
    format,
    mimeType,
    originalWidth,
    originalHeight,
  };
}

/**
 * Generate multiple optimized versions of an image
 * Returns full-size and thumbnail versions
 */
export async function generateOptimizedVersions(
  inputBuffer: Buffer
): Promise<{
  full: OptimizedImageResult;
  thumbnail: OptimizedImageResult;
}> {
  const [full, thumbnail] = await Promise.all([
    // Full size - max 1600px
    optimizeImage(inputBuffer, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 85,
      format: 'webp',
    }),
    // Thumbnail - max 400px
    optimizeImage(inputBuffer, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 80,
      format: 'webp',
    }),
  ]);

  return { full, thumbnail };
}

/**
 * Check if a file is an image that can be optimized
 */
export function isOptimizableImage(mimeType: string): boolean {
  const optimizableTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/tiff',
    'image/heic',
    'image/heif',
  ];
  return optimizableTypes.includes(mimeType.toLowerCase());
}

/**
 * Get the optimized filename (changes extension to .webp)
 */
export function getOptimizedFilename(originalFilename: string, format: 'webp' | 'jpeg' = 'webp'): string {
  const ext = format === 'webp' ? '.webp' : '.jpg';
  const baseName = originalFilename.replace(/\.[^.]+$/, '');
  return `${baseName}${ext}`;
}
