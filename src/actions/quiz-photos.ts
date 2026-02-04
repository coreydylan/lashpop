"use server"

import { getDb } from "@/db"
import { quizPhotos, quizResultSettings, type QuizPhotoCropData } from "@/db/schema/quiz_photos"
import { assets } from "@/db/schema/assets"
import { eq, and, asc } from "drizzle-orm"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

// Sanitize env values to remove trailing newlines
const sanitizeEnv = (value?: string) => value?.trim()

// Lash style type (matches the enum in the schema)
export type LashStyle = "classic" | "hybrid" | "wetAngel" | "volume"

// Quiz photo with asset data
export interface QuizPhotoWithAsset {
  id: string
  assetId: string
  lashStyle: LashStyle
  cropData: QuizPhotoCropData | null
  cropUrl: string | null
  isEnabled: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  // Asset data
  filePath: string
  fileName: string
}

// Get all quiz photos (for admin panel)
export async function getAllQuizPhotos(): Promise<QuizPhotoWithAsset[]> {
  const db = getDb()

  const results = await db
    .select({
      id: quizPhotos.id,
      assetId: quizPhotos.assetId,
      lashStyle: quizPhotos.lashStyle,
      cropData: quizPhotos.cropData,
      cropUrl: quizPhotos.cropUrl,
      isEnabled: quizPhotos.isEnabled,
      sortOrder: quizPhotos.sortOrder,
      createdAt: quizPhotos.createdAt,
      updatedAt: quizPhotos.updatedAt,
      filePath: assets.filePath,
      fileName: assets.fileName,
    })
    .from(quizPhotos)
    .innerJoin(assets, eq(quizPhotos.assetId, assets.id))
    .orderBy(asc(quizPhotos.lashStyle), asc(quizPhotos.sortOrder))

  return results as QuizPhotoWithAsset[]
}

// Get quiz photos for the quiz (enabled only, grouped by style)
export async function getQuizPhotosForQuiz(): Promise<Record<LashStyle, QuizPhotoWithAsset[]>> {
  const db = getDb()

  const results = await db
    .select({
      id: quizPhotos.id,
      assetId: quizPhotos.assetId,
      lashStyle: quizPhotos.lashStyle,
      cropData: quizPhotos.cropData,
      cropUrl: quizPhotos.cropUrl,
      isEnabled: quizPhotos.isEnabled,
      sortOrder: quizPhotos.sortOrder,
      createdAt: quizPhotos.createdAt,
      updatedAt: quizPhotos.updatedAt,
      filePath: assets.filePath,
      fileName: assets.fileName,
    })
    .from(quizPhotos)
    .innerJoin(assets, eq(quizPhotos.assetId, assets.id))
    .where(eq(quizPhotos.isEnabled, true))
    .orderBy(asc(quizPhotos.sortOrder))

  // Group by style
  const grouped: Record<LashStyle, QuizPhotoWithAsset[]> = {
    classic: [],
    hybrid: [],
    wetAngel: [],
    volume: [],
  }

  for (const photo of results) {
    grouped[photo.lashStyle as LashStyle].push(photo as QuizPhotoWithAsset)
  }

  return grouped
}

// Add a new quiz photo
export async function addQuizPhoto({
  assetId,
  lashStyle,
}: {
  assetId: string
  lashStyle: LashStyle
}) {
  const db = getDb()

  // Get the max sort order for this style
  const existing = await db
    .select({ sortOrder: quizPhotos.sortOrder })
    .from(quizPhotos)
    .where(eq(quizPhotos.lashStyle, lashStyle))
    .orderBy(asc(quizPhotos.sortOrder))

  const maxSortOrder = existing.length > 0 ? Math.max(...existing.map((e) => e.sortOrder)) : -1

  const [newPhoto] = await db
    .insert(quizPhotos)
    .values({
      assetId,
      lashStyle,
      sortOrder: maxSortOrder + 1,
    })
    .returning()

  return newPhoto
}

// Update quiz photo crop data
export async function updateQuizPhotoCrop(
  photoId: string,
  cropData: QuizPhotoCropData
) {
  const db = getDb()

  // First get the photo to access the asset
  const [photo] = await db
    .select({
      id: quizPhotos.id,
      assetId: quizPhotos.assetId,
      filePath: assets.filePath,
      fileName: assets.fileName,
    })
    .from(quizPhotos)
    .innerJoin(assets, eq(quizPhotos.assetId, assets.id))
    .where(eq(quizPhotos.id, photoId))
    .limit(1)

  if (!photo) {
    throw new Error("Quiz photo not found")
  }

  // Generate the cropped image
  let cropUrl: string | null = null

  try {
    // Fetch original image
    const response = await fetch(photo.filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch original image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const originalBuffer = Buffer.from(arrayBuffer)

    // Generate square crop (800x800 for quiz display)
    const targetSize = 800
    const processedBuffer = await generateSquareCrop(
      originalBuffer,
      cropData,
      targetSize
    )

    // Upload to S3
    const s3Client = new S3Client({
      region: sanitizeEnv(process.env.AWS_REGION)!,
      credentials: {
        accessKeyId: sanitizeEnv(process.env.AWS_ACCESS_KEY_ID)!,
        secretAccessKey: sanitizeEnv(process.env.AWS_SECRET_ACCESS_KEY)!,
      },
    })

    const BUCKET_NAME = sanitizeEnv(process.env.AWS_S3_BUCKET_NAME)!
    const fileName = photo.fileName.replace(/\.[^/.]+$/, "")
    const key = `quiz-crops/${photoId}/${fileName}-square-${Date.now()}.jpg`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: processedBuffer,
        ContentType: "image/jpeg",
        CacheControl: "max-age=31536000",
      })
    )

    cropUrl = process.env.NEXT_PUBLIC_S3_BUCKET_URL
      ? `${process.env.NEXT_PUBLIC_S3_BUCKET_URL}/${key}`
      : `https://${BUCKET_NAME}.s3.${sanitizeEnv(process.env.AWS_REGION)}.amazonaws.com/${key}`
  } catch (err) {
    console.error("Failed to generate quiz photo crop:", err)
    // Continue without cropUrl - will use cropData on client
  }

  // Update database
  await db
    .update(quizPhotos)
    .set({
      cropData,
      cropUrl,
      updatedAt: new Date(),
    })
    .where(eq(quizPhotos.id, photoId))

  return { success: true, cropUrl }
}

// Toggle quiz photo enabled status
export async function toggleQuizPhotoEnabled(photoId: string) {
  const db = getDb()

  // Get current status
  const [photo] = await db
    .select({ isEnabled: quizPhotos.isEnabled })
    .from(quizPhotos)
    .where(eq(quizPhotos.id, photoId))
    .limit(1)

  if (!photo) {
    throw new Error("Quiz photo not found")
  }

  // Toggle
  await db
    .update(quizPhotos)
    .set({
      isEnabled: !photo.isEnabled,
      updatedAt: new Date(),
    })
    .where(eq(quizPhotos.id, photoId))

  return { success: true, isEnabled: !photo.isEnabled }
}

// Delete quiz photo
export async function deleteQuizPhoto(photoId: string) {
  const db = getDb()

  await db.delete(quizPhotos).where(eq(quizPhotos.id, photoId))

  return { success: true }
}

// Update sort orders for multiple photos
export async function updateQuizPhotoSortOrders(
  updates: Array<{ photoId: string; sortOrder: number }>
) {
  const db = getDb()

  for (const update of updates) {
    await db
      .update(quizPhotos)
      .set({
        sortOrder: update.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(quizPhotos.id, update.photoId))
  }

  return { success: true }
}

// Base width percent used in the crop editor (must match QuizPhotoCropEditor)
const BASE_WIDTH_PERCENT = 70

// Helper: Generate square crop
async function generateSquareCrop(
  originalBuffer: Buffer,
  data: QuizPhotoCropData,
  targetSize: number
): Promise<Buffer> {
  const { x, y, scale } = data

  const image = sharp(originalBuffer)
  const metadata = await image.metadata()
  const originalWidth = metadata.width || 1000
  const originalHeight = metadata.height || 1000

  // Calculate crop box size as percentage (matching the editor logic)
  const widthPercent = Math.min(95, Math.max(15, BASE_WIDTH_PERCENT / scale))

  // Calculate crop size based on width percentage
  let cropSize = Math.round((widthPercent / 100) * originalWidth)

  // For a square crop, ensure it fits within both dimensions
  // The crop box must fit within the image bounds
  cropSize = Math.min(cropSize, originalWidth, originalHeight)

  // Center of the crop box in pixels
  const centerX = Math.round((x / 100) * originalWidth)
  const centerY = Math.round((y / 100) * originalHeight)

  // Calculate extraction region (top-left corner)
  let extractLeft = centerX - Math.floor(cropSize / 2)
  let extractTop = centerY - Math.floor(cropSize / 2)

  // Clamp to image bounds
  extractLeft = Math.max(0, Math.min(extractLeft, originalWidth - cropSize))
  extractTop = Math.max(0, Math.min(extractTop, originalHeight - cropSize))

  console.log('Crop params:', {
    originalWidth,
    originalHeight,
    widthPercent,
    cropSize,
    centerX,
    centerY,
    extractLeft,
    extractTop,
  })

  return image
    .extract({
      left: extractLeft,
      top: extractTop,
      width: cropSize,
      height: cropSize,
    })
    .resize({
      width: targetSize,
      height: targetSize,
      fit: "fill",
    })
    .jpeg({ quality: 90 })
    .toBuffer()
}

// ============================================
// QUIZ RESULT SETTINGS
// ============================================

// Default values for each lash style
const DEFAULT_RESULT_SETTINGS: Record<LashStyle, {
  displayName: string
  description: string
  bestFor: string[]
  recommendedService: string
  bookingLabel: string
}> = {
  classic: {
    displayName: "Classic Lashes",
    description: "You love a natural, polished look that still makes your eyes stand out. Classic lashes add length and definition by placing one extension on each natural lash, while keeping things soft and effortless.",
    bestFor: [
      "First-time extension clients",
      "Natural makeup lovers",
      "Everyday wear",
    ],
    recommendedService: "Classic Lashes",
    bookingLabel: "Book Classic Full Set",
  },
  wetAngel: {
    displayName: "Wet / Angel Lashes",
    description: "You love a modern, clean, model-off-duty look. Wet and Angel sets give you glossy, defined lashes that feel natural but elevated with soft, wispy spikes.",
    bestFor: [
      "You like a soft but noticeable lash look",
      "You love a fresh, dewy vibe",
      "You love a minimal makeup routine",
    ],
    recommendedService: "Wet / Angel Set",
    bookingLabel: "Book Wet / Angel Set",
  },
  hybrid: {
    displayName: "Hybrid Lashes",
    description: "You like your lashes a little fuller and more textured but still a soft and everyday look. Hybrid lashes blend classic and volume techniques for the perfect balance.",
    bestFor: [
      "You want more fullness than classic",
      "You love a fluffy, textured finish",
      "You want a look that transitions day to night",
    ],
    recommendedService: "Hybrid Lashes",
    bookingLabel: "Book Hybrid Full Set",
  },
  volume: {
    displayName: "Volume Lashes",
    description: "You love bold, fluffy lashes that make a statement. Volume sets give you maximum fullness and drama for a high-impact look.",
    bestFor: [
      "Full glam fans",
      "Sparse natural lashes",
      "You love a dark and full lash line",
    ],
    recommendedService: "Volume Lashes",
    bookingLabel: "Book Volume Full Set",
  },
}

// Result settings with optional asset data
export interface QuizResultSettingsWithAsset {
  id: string
  lashStyle: LashStyle
  resultImageAssetId: string | null
  resultImageCropData: QuizPhotoCropData | null
  resultImageCropUrl: string | null
  displayName: string
  description: string
  bestFor: string[]
  recommendedService: string
  bookingLabel: string
  createdAt: Date
  updatedAt: Date
  // Asset data (if image selected)
  resultImageFilePath: string | null
  resultImageFileName: string | null
}

// Get all result settings (creates defaults if missing)
export async function getAllResultSettings(): Promise<QuizResultSettingsWithAsset[]> {
  const db = getDb()

  // First ensure all styles have settings
  const allStyles: LashStyle[] = ["classic", "hybrid", "wetAngel", "volume"]

  for (const style of allStyles) {
    const existing = await db
      .select({ id: quizResultSettings.id })
      .from(quizResultSettings)
      .where(eq(quizResultSettings.lashStyle, style))
      .limit(1)

    if (existing.length === 0) {
      const defaults = DEFAULT_RESULT_SETTINGS[style]
      await db.insert(quizResultSettings).values({
        lashStyle: style,
        displayName: defaults.displayName,
        description: defaults.description,
        bestFor: defaults.bestFor,
        recommendedService: defaults.recommendedService,
        bookingLabel: defaults.bookingLabel,
      })
    }
  }

  // Now fetch all with asset data
  const results = await db
    .select({
      id: quizResultSettings.id,
      lashStyle: quizResultSettings.lashStyle,
      resultImageAssetId: quizResultSettings.resultImageAssetId,
      resultImageCropData: quizResultSettings.resultImageCropData,
      resultImageCropUrl: quizResultSettings.resultImageCropUrl,
      displayName: quizResultSettings.displayName,
      description: quizResultSettings.description,
      bestFor: quizResultSettings.bestFor,
      recommendedService: quizResultSettings.recommendedService,
      bookingLabel: quizResultSettings.bookingLabel,
      createdAt: quizResultSettings.createdAt,
      updatedAt: quizResultSettings.updatedAt,
      resultImageFilePath: assets.filePath,
      resultImageFileName: assets.fileName,
    })
    .from(quizResultSettings)
    .leftJoin(assets, eq(quizResultSettings.resultImageAssetId, assets.id))

  return results as QuizResultSettingsWithAsset[]
}

// Update result settings text fields
export async function updateResultSettingsText(
  lashStyle: LashStyle,
  data: {
    displayName?: string
    description?: string
    bestFor?: string[]
    recommendedService?: string
    bookingLabel?: string
  }
) {
  const db = getDb()

  await db
    .update(quizResultSettings)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(quizResultSettings.lashStyle, lashStyle))

  return { success: true }
}

// Set result image from DAM
export async function setResultImage(lashStyle: LashStyle, assetId: string) {
  const db = getDb()

  await db
    .update(quizResultSettings)
    .set({
      resultImageAssetId: assetId,
      resultImageCropData: null,
      resultImageCropUrl: null,
      updatedAt: new Date(),
    })
    .where(eq(quizResultSettings.lashStyle, lashStyle))

  return { success: true }
}

// Update result image crop
export async function updateResultImageCrop(
  lashStyle: LashStyle,
  cropData: QuizPhotoCropData
) {
  const db = getDb()

  // Get the current settings to access the asset
  const [settings] = await db
    .select({
      resultImageAssetId: quizResultSettings.resultImageAssetId,
      filePath: assets.filePath,
      fileName: assets.fileName,
    })
    .from(quizResultSettings)
    .leftJoin(assets, eq(quizResultSettings.resultImageAssetId, assets.id))
    .where(eq(quizResultSettings.lashStyle, lashStyle))
    .limit(1)

  if (!settings || !settings.resultImageAssetId || !settings.filePath) {
    throw new Error("No result image set for this style")
  }

  // Generate cropped image
  let cropUrl: string | null = null

  try {
    const response = await fetch(settings.filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const originalBuffer = Buffer.from(arrayBuffer)

    const targetSize = 800
    const processedBuffer = await generateSquareCrop(originalBuffer, cropData, targetSize)

    const s3Client = new S3Client({
      region: sanitizeEnv(process.env.AWS_REGION)!,
      credentials: {
        accessKeyId: sanitizeEnv(process.env.AWS_ACCESS_KEY_ID)!,
        secretAccessKey: sanitizeEnv(process.env.AWS_SECRET_ACCESS_KEY)!,
      },
    })

    const BUCKET_NAME = sanitizeEnv(process.env.AWS_S3_BUCKET_NAME)!
    const fileName = settings.fileName?.replace(/\.[^/.]+$/, "") || "result"
    const key = `quiz-results/${lashStyle}/${fileName}-result-${Date.now()}.jpg`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: processedBuffer,
        ContentType: "image/jpeg",
        CacheControl: "max-age=31536000",
      })
    )

    cropUrl = process.env.NEXT_PUBLIC_S3_BUCKET_URL
      ? `${process.env.NEXT_PUBLIC_S3_BUCKET_URL}/${key}`
      : `https://${BUCKET_NAME}.s3.${sanitizeEnv(process.env.AWS_REGION)}.amazonaws.com/${key}`
  } catch (err) {
    console.error("Failed to generate result image crop:", err)
  }

  await db
    .update(quizResultSettings)
    .set({
      resultImageCropData: cropData,
      resultImageCropUrl: cropUrl,
      updatedAt: new Date(),
    })
    .where(eq(quizResultSettings.lashStyle, lashStyle))

  return { success: true, cropUrl }
}

// Remove result image
export async function removeResultImage(lashStyle: LashStyle) {
  const db = getDb()

  await db
    .update(quizResultSettings)
    .set({
      resultImageAssetId: null,
      resultImageCropData: null,
      resultImageCropUrl: null,
      updatedAt: new Date(),
    })
    .where(eq(quizResultSettings.lashStyle, lashStyle))

  return { success: true }
}
