"use server"

import { getDb } from "@/db"
import { quizPhotos, quizResultSettings, type QuizPhotoCropData } from "@/db/schema/quiz_photos"
import { assets } from "@/db/schema/assets"
import { tags } from "@/db/schema/tags"
import { assetTags } from "@/db/schema/asset_tags"
import { services } from "@/db/schema/services"
import { serviceSubcategories } from "@/db/schema/service_subcategories"
import { eq, and, asc, inArray, isNull, sql } from "drizzle-orm"
import sharp from "sharp"
import { uploadBufferWithOptions } from "@/lib/dam/r2-client"
import { requireAdminRole } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

// Lash style → lash_type tag name used by import-quiz-photos.ts
const LASH_STYLE_TO_TAG_NAME: Record<LashStyle, string> = {
  classic: "classic",
  hybrid: "hybrid",
  wetAngel: "wet",
  volume: "volume",
}

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
  const auth = await requireAdminRole("owner", "publisher")
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

  await recordAdminAction({
    action: "quiz.photo.add",
    targetType: "quiz-photo",
    targetId: newPhoto.id,
    actorUserId: auth.userId,
    diff: {
      before: null,
      after: quizPhotoAuditSnapshot(newPhoto),
    },
  })

  return newPhoto
}

// Update quiz photo crop data
export async function updateQuizPhotoCrop(
  photoId: string,
  cropData: QuizPhotoCropData
) {
  const auth = await requireAdminRole("owner", "publisher")
  const db = getDb()

  // First get the photo to access the asset
  const [photo] = await db
    .select({
      id: quizPhotos.id,
      assetId: quizPhotos.assetId,
      lashStyle: quizPhotos.lashStyle,
      cropData: quizPhotos.cropData,
      cropUrl: quizPhotos.cropUrl,
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

    // Upload to R2
    const fileName = photo.fileName.replace(/\.[^/.]+$/, "")
    const key = `quiz-crops/${photoId}/${fileName}-square-${Date.now()}.jpg`

    const result = await uploadBufferWithOptions({
      buffer: processedBuffer,
      key,
      contentType: "image/jpeg",
      cacheControl: "max-age=31536000",
    })

    cropUrl = result.url
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

  await recordAdminAction({
    action: "quiz.photo.crop.update",
    targetType: "quiz-photo",
    targetId: photoId,
    actorUserId: auth.userId,
    diff: {
      before: {
        cropData: photo.cropData,
        cropUrl: photo.cropUrl,
      },
      after: {
        cropData,
        cropUrl,
      },
      assetId: photo.assetId,
      lashStyle: photo.lashStyle,
    },
  })

  return { success: true, cropUrl }
}

// Toggle quiz photo enabled status
export async function toggleQuizPhotoEnabled(photoId: string) {
  const auth = await requireAdminRole("owner", "publisher")
  const db = getDb()

  // Get current status
  const [photo] = await db
    .select({
      assetId: quizPhotos.assetId,
      lashStyle: quizPhotos.lashStyle,
      isEnabled: quizPhotos.isEnabled,
    })
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

  await recordAdminAction({
    action: "quiz.photo.enabled.update",
    targetType: "quiz-photo",
    targetId: photoId,
    actorUserId: auth.userId,
    diff: {
      before: { isEnabled: photo.isEnabled },
      after: { isEnabled: !photo.isEnabled },
      assetId: photo.assetId,
      lashStyle: photo.lashStyle,
    },
  })

  return { success: true, isEnabled: !photo.isEnabled }
}

// Delete quiz photo
export async function deleteQuizPhoto(photoId: string) {
  const auth = await requireAdminRole("owner", "publisher")
  const db = getDb()

  const [photo] = await db
    .select()
    .from(quizPhotos)
    .where(eq(quizPhotos.id, photoId))
    .limit(1)

  if (!photo) {
    throw new Error("Quiz photo not found")
  }

  await db.delete(quizPhotos).where(eq(quizPhotos.id, photoId))

  await recordAdminAction({
    action: "quiz.photo.delete",
    targetType: "quiz-photo",
    targetId: photoId,
    actorUserId: auth.userId,
    diff: {
      before: quizPhotoAuditSnapshot(photo),
      after: null,
    },
  })

  return { success: true }
}

// Update sort orders for multiple photos
export async function updateQuizPhotoSortOrders(
  updates: Array<{ photoId: string; sortOrder: number }>
) {
  const auth = await requireAdminRole("owner", "publisher")
  const db = getDb()

  if (updates.length === 0) {
    return { success: true }
  }

  const photoIds = Array.from(new Set(updates.map((update) => update.photoId)))
  const beforeRows = await db
    .select()
    .from(quizPhotos)
    .where(inArray(quizPhotos.id, photoIds))

  for (const update of updates) {
    await db
      .update(quizPhotos)
      .set({
        sortOrder: update.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(quizPhotos.id, update.photoId))
  }

  const afterRows = await db
    .select()
    .from(quizPhotos)
    .where(inArray(quizPhotos.id, photoIds))

  await recordAdminAction({
    action: "quiz.photo.reorder",
    targetType: "quiz-photo-collection",
    targetId: "comparison-photos",
    actorUserId: auth.userId,
    diff: {
      before: beforeRows.map(({ id, lashStyle, sortOrder }) => ({ id, lashStyle, sortOrder })),
      after: afterRows.map(({ id, lashStyle, sortOrder }) => ({ id, lashStyle, sortOrder })),
    },
  })

  return { success: true }
}

function quizPhotoAuditSnapshot(photo: typeof quizPhotos.$inferSelect) {
  return {
    id: photo.id,
    assetId: photo.assetId,
    lashStyle: photo.lashStyle,
    cropData: photo.cropData,
    cropUrl: photo.cropUrl,
    isEnabled: photo.isEnabled,
    sortOrder: photo.sortOrder,
  }
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

const ALL_LASH_STYLES: LashStyle[] = ["classic", "hybrid", "wetAngel", "volume"]

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

function quizResultSettingAuditSnapshot(
  settings: typeof quizResultSettings.$inferSelect,
) {
  return {
    id: settings.id,
    lashStyle: settings.lashStyle,
    resultImageAssetId: settings.resultImageAssetId,
    resultImageCropData: settings.resultImageCropData,
    resultImageCropUrl: settings.resultImageCropUrl,
    displayName: settings.displayName,
    description: settings.description,
    bestFor: settings.bestFor,
    recommendedService: settings.recommendedService,
    bookingLabel: settings.bookingLabel,
  }
}

// Get all result settings. Missing database rows resolve to in-memory defaults;
// public reads must never bootstrap or otherwise mutate production data.
export async function getAllResultSettings(): Promise<QuizResultSettingsWithAsset[]> {
  const db = getDb()
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

  const rowsByStyle = new Map(
    results.map((row) => [row.lashStyle as LashStyle, row as QuizResultSettingsWithAsset]),
  )

  return ALL_LASH_STYLES.map((style) => {
    const existing = rowsByStyle.get(style)
    if (existing) return existing

    const defaults = DEFAULT_RESULT_SETTINGS[style]
    return {
      id: `default:${style}`,
      lashStyle: style,
      resultImageAssetId: null,
      resultImageCropData: null,
      resultImageCropUrl: null,
      ...defaults,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      resultImageFilePath: null,
      resultImageFileName: null,
    }
  })
}

// Find an appropriate DAM image for each persisted result row that is missing
// one. This helper is read-only; the authorized bootstrap action owns every
// resulting write and the consolidated audit record.
async function findMissingResultImageSeeds(db: ReturnType<typeof getDb>) {
  const missingRows = await db
    .select({
      id: quizResultSettings.id,
      lashStyle: quizResultSettings.lashStyle,
    })
    .from(quizResultSettings)
    .where(isNull(quizResultSettings.resultImageAssetId))

  if (missingRows.length === 0) return []

  // quiz_result tag is shared across all styles
  const [quizResultTag] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, "quiz_result"))
    .limit(1)
  if (!quizResultTag) return []

  const quizResultAssetRows = await db
    .select({ assetId: assetTags.assetId })
    .from(assetTags)
    .where(eq(assetTags.tagId, quizResultTag.id))
  const quizResultAssetIds = new Set(quizResultAssetRows.map((r) => r.assetId))
  if (quizResultAssetIds.size === 0) return []

  const seeds: Array<{ settingsId: string; lashStyle: LashStyle; assetId: string }> = []

  for (const row of missingRows) {
    const tagName = LASH_STYLE_TO_TAG_NAME[row.lashStyle as LashStyle]
    if (!tagName) continue

    const [styleTag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, tagName))
      .limit(1)
    if (!styleTag) continue

    const styleAssetRows = await db
      .select({ assetId: assetTags.assetId })
      .from(assetTags)
      .where(eq(assetTags.tagId, styleTag.id))

    const candidateId = styleAssetRows.find((r) => quizResultAssetIds.has(r.assetId))?.assetId
    if (!candidateId) continue

    seeds.push({
      settingsId: row.id,
      lashStyle: row.lashStyle as LashStyle,
      assetId: candidateId,
    })
  }

  return seeds
}

/**
 * Explicit, authorized bootstrap for result-setting rows and DAM image links.
 * This is intentionally separate from all public read paths.
 */
export async function bootstrapQuizResultSettings() {
  const auth = await requireAdminRole("owner", "publisher")
  const db = getDb()

  const beforeRows = await db.select().from(quizResultSettings)

  for (const style of ALL_LASH_STYLES) {
    const defaults = DEFAULT_RESULT_SETTINGS[style]
    await db
      .insert(quizResultSettings)
      .values({
        lashStyle: style,
        ...defaults,
      })
      .onConflictDoNothing({ target: quizResultSettings.lashStyle })
  }

  const imageSeeds = await findMissingResultImageSeeds(db)
  for (const seed of imageSeeds) {
    await db
      .update(quizResultSettings)
      .set({ resultImageAssetId: seed.assetId, updatedAt: new Date() })
      .where(eq(quizResultSettings.id, seed.settingsId))
  }

  const afterRows = await db.select().from(quizResultSettings)

  await recordAdminAction({
    action: "quiz.result-settings.bootstrap",
    targetType: "quiz-result-settings",
    targetId: "all-styles",
    actorUserId: auth.userId,
    diff: {
      before: beforeRows.map(quizResultSettingAuditSnapshot),
      after: afterRows.map(quizResultSettingAuditSnapshot),
      linkedImages: imageSeeds.map(({ lashStyle, assetId }) => ({ lashStyle, assetId })),
    },
  })

  return {
    success: true,
    createdCount: Math.max(0, afterRows.length - beforeRows.length),
    linkedImageCount: imageSeeds.length,
  }
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
  const auth = await requireAdminRole("owner", "publisher")
  const db = getDb()

  const [before] = await db
    .select()
    .from(quizResultSettings)
    .where(eq(quizResultSettings.lashStyle, lashStyle))
    .limit(1)

  const defaults = DEFAULT_RESULT_SETTINGS[lashStyle]
  const now = new Date()

  const [after] = await db
    .insert(quizResultSettings)
    .values({
      lashStyle,
      ...defaults,
      ...data,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: quizResultSettings.lashStyle,
      set: {
        ...data,
        updatedAt: now,
      },
    })
    .returning()

  await recordAdminAction({
    action: "quiz.result-settings.text.update",
    targetType: "quiz-result-settings",
    targetId: lashStyle,
    actorUserId: auth.userId,
    diff: {
      before: before ? quizResultSettingAuditSnapshot(before) : null,
      after: quizResultSettingAuditSnapshot(after),
      changedFields: Object.keys(data),
    },
  })

  return { success: true }
}

// Set result image from DAM
export async function setResultImage(lashStyle: LashStyle, assetId: string) {
  const auth = await requireAdminRole("owner", "publisher")
  const db = getDb()

  const [before] = await db
    .select()
    .from(quizResultSettings)
    .where(eq(quizResultSettings.lashStyle, lashStyle))
    .limit(1)

  const defaults = DEFAULT_RESULT_SETTINGS[lashStyle]
  const now = new Date()

  const [after] = await db
    .insert(quizResultSettings)
    .values({
      lashStyle,
      ...defaults,
      resultImageAssetId: assetId,
      resultImageCropData: null,
      resultImageCropUrl: null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: quizResultSettings.lashStyle,
      set: {
        resultImageAssetId: assetId,
        resultImageCropData: null,
        resultImageCropUrl: null,
        updatedAt: now,
      },
    })
    .returning()

  await recordAdminAction({
    action: "quiz.result-image.update",
    targetType: "quiz-result-settings",
    targetId: lashStyle,
    actorUserId: auth.userId,
    diff: {
      before: before ? quizResultSettingAuditSnapshot(before) : null,
      after: quizResultSettingAuditSnapshot(after),
    },
  })

  return { success: true }
}

// Update result image crop
export async function updateResultImageCrop(
  lashStyle: LashStyle,
  cropData: QuizPhotoCropData
) {
  const auth = await requireAdminRole("owner", "publisher")
  const db = getDb()

  // Get the current settings to access the asset
  const [settings] = await db
    .select({
      id: quizResultSettings.id,
      resultImageAssetId: quizResultSettings.resultImageAssetId,
      resultImageCropData: quizResultSettings.resultImageCropData,
      resultImageCropUrl: quizResultSettings.resultImageCropUrl,
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

    const fileName = settings.fileName?.replace(/\.[^/.]+$/, "") || "result"
    const key = `quiz-results/${lashStyle}/${fileName}-result-${Date.now()}.jpg`

    const result = await uploadBufferWithOptions({
      buffer: processedBuffer,
      key,
      contentType: "image/jpeg",
      cacheControl: "max-age=31536000",
    })

    cropUrl = result.url
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

  await recordAdminAction({
    action: "quiz.result-image.crop.update",
    targetType: "quiz-result-settings",
    targetId: lashStyle,
    actorUserId: auth.userId,
    diff: {
      before: {
        resultImageAssetId: settings.resultImageAssetId,
        resultImageCropData: settings.resultImageCropData,
        resultImageCropUrl: settings.resultImageCropUrl,
      },
      after: {
        resultImageAssetId: settings.resultImageAssetId,
        resultImageCropData: cropData,
        resultImageCropUrl: cropUrl,
      },
    },
  })

  return { success: true, cropUrl }
}

// Shape consumed by the public quiz ResultScreen
export interface QuizResultForDisplay {
  displayName: string
  description: string
  bestFor: string[]
  recommendedService: string
  bookingLabel: string
  resultImage: string | null
}

// Public read for the quiz result screen — keyed by lash style. Missing rows
// resolve to defaults without writes. resultImage prefers cropUrl, falls back
// to filePath, and is null if no image is set (caller should provide a fallback).
export async function getResultSettingsForQuiz(): Promise<Record<LashStyle, QuizResultForDisplay>> {
  const rows = await getAllResultSettings()

  const out: Record<LashStyle, QuizResultForDisplay> = {
    classic: emptyResultDisplay("classic"),
    hybrid: emptyResultDisplay("hybrid"),
    wetAngel: emptyResultDisplay("wetAngel"),
    volume: emptyResultDisplay("volume"),
  }

  for (const row of rows) {
    out[row.lashStyle] = {
      displayName: row.displayName,
      description: row.description,
      bestFor: row.bestFor,
      recommendedService: row.recommendedService,
      bookingLabel: row.bookingLabel,
      resultImage: row.resultImageCropUrl || row.resultImageFilePath || null,
    }
  }

  return out
}

function emptyResultDisplay(style: LashStyle): QuizResultForDisplay {
  const d = DEFAULT_RESULT_SETTINGS[style]
  return {
    displayName: d.displayName,
    description: d.description,
    bestFor: d.bestFor,
    recommendedService: d.recommendedService,
    bookingLabel: d.bookingLabel,
    resultImage: null,
  }
}

// Quiz lash style → service_subcategories.slug mapping.
// Each style maps to a subcategory that holds the bookable Vagaro services
// (Full Set / Fill / Mini Fill) for that style.
const LASH_STYLE_TO_SUBCATEGORY_SLUG: Record<LashStyle, string> = {
  classic: "classic-extensions",
  hybrid: "hybrid-extensions",
  wetAngel: "wet-angel-extensions",
  volume: "volume-extensions",
}

export interface QuizResultService {
  id: string
  name: string
  slug: string
  priceStarting: number       // cents
  durationMinutes: number
  vagaroServiceCode: string | null
  vagaroServiceId: string | null
}

export interface QuizResultServices {
  subcategorySlug: string
  subcategoryName: string | null
  services: QuizResultService[]
  /**
   * Booking-flow image for the matched lash style. Pulled from the "Full Set"
   * service in the subcategory (slug: classic / hybrid / angel / volume) using
   * the same COALESCE(vagaro_image_url, image_url) resolution the booking flow
   * uses. The quiz result screen renders this so the hero photo matches the
   * service card shown in the booking flow.
   *
   * null if no Full Set is found or it has no image. The result screen falls
   * back to the admin-managed quiz_result_settings image (and then to the
   * hardcoded R2 fallback) in that case.
   */
  bookingImage: string | null
}

// Each lash style's "Full Set" service slug. The Full Set is the canonical
// service used for that style in the booking flow, so its image is what we
// surface on the quiz result screen.
const LASH_STYLE_TO_FULL_SET_SLUG: Record<LashStyle, string> = {
  classic: "classic",
  hybrid: "hybrid",
  wetAngel: "angel",
  volume: "volume",
}

// Fetch the Vagaro-synced services for a quiz result, keyed by lash style.
// Returns the matched subcategory + its services (Full Set / Fill / Mini Fill),
// sorted by services.displayOrder so the Full Set lands first, plus the
// booking-flow image for the Full Set so the result-screen hero matches what
// the user sees on the booking page.
export async function getQuizResultServices(
  lashStyle: LashStyle,
): Promise<QuizResultServices | null> {
  const subcategorySlug = LASH_STYLE_TO_SUBCATEGORY_SLUG[lashStyle]
  if (!subcategorySlug) return null

  const fullSetSlug = LASH_STYLE_TO_FULL_SET_SLUG[lashStyle]
  const db = getDb()

  const rows = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      priceStarting: services.priceStarting,
      durationMinutes: services.durationMinutes,
      vagaroServiceCode: services.vagaroServiceCode,
      vagaroServiceId: services.vagaroServiceId,
      // Match the booking-flow resolution: Vagaro is source of truth, fall
      // back to the local override.
      bookingImageUrl: sql<string | null>`COALESCE(${services.vagaroImageUrl}, ${services.imageUrl})`,
      subcategoryName: serviceSubcategories.name,
    })
    .from(services)
    .innerJoin(
      serviceSubcategories,
      eq(services.subcategoryId, serviceSubcategories.id),
    )
    .where(
      and(
        eq(serviceSubcategories.slug, subcategorySlug),
        eq(services.isActive, true),
      ),
    )
    .orderBy(asc(services.displayOrder))

  if (rows.length === 0) {
    return {
      subcategorySlug,
      subcategoryName: null,
      services: [],
      bookingImage: null,
    }
  }

  // Prefer the explicit Full Set slug; fall back to the first row (which is
  // sorted by displayOrder, so it's the Full Set in practice).
  const fullSetRow =
    rows.find((r) => r.slug === fullSetSlug && r.bookingImageUrl) ??
    rows.find((r) => r.bookingImageUrl) ??
    null

  return {
    subcategorySlug,
    subcategoryName: rows[0].subcategoryName,
    services: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      priceStarting: r.priceStarting,
      durationMinutes: r.durationMinutes,
      vagaroServiceCode: r.vagaroServiceCode,
      vagaroServiceId: r.vagaroServiceId,
    })),
    bookingImage: fullSetRow?.bookingImageUrl ?? null,
  }
}

// Remove result image
export async function removeResultImage(lashStyle: LashStyle) {
  const auth = await requireAdminRole("owner", "publisher")
  const db = getDb()

  const [before] = await db
    .select()
    .from(quizResultSettings)
    .where(eq(quizResultSettings.lashStyle, lashStyle))
    .limit(1)

  if (!before) {
    return { success: true }
  }

  const [after] = await db
    .update(quizResultSettings)
    .set({
      resultImageAssetId: null,
      resultImageCropData: null,
      resultImageCropUrl: null,
      updatedAt: new Date(),
    })
    .where(eq(quizResultSettings.lashStyle, lashStyle))
    .returning()

  await recordAdminAction({
    action: "quiz.result-image.remove",
    targetType: "quiz-result-settings",
    targetId: lashStyle,
    actorUserId: auth.userId,
    diff: {
      before: quizResultSettingAuditSnapshot(before),
      after: quizResultSettingAuditSnapshot(after),
    },
  })

  return { success: true }
}
