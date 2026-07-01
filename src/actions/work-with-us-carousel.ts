'use server'

import { getDb } from '@/db'
import { workWithUsCarouselPhotos } from '@/db/schema/work_with_us_carousel'
import { assets } from '@/db/schema/assets'
import { eq, asc, and, isNull } from 'drizzle-orm'

const db = getDb()

export type CarouselPhotoWithAsset = {
  id: string
  assetId: string
  sortOrder: number
  isEnabled: boolean
  filePath: string
  fileName: string
}

/**
 * Get all carousel photos with asset data
 */
export async function getAllCarouselPhotos(): Promise<CarouselPhotoWithAsset[]> {
  const results = await db
    .select({
      id: workWithUsCarouselPhotos.id,
      assetId: workWithUsCarouselPhotos.assetId,
      sortOrder: workWithUsCarouselPhotos.sortOrder,
      isEnabled: workWithUsCarouselPhotos.isEnabled,
      filePath: assets.filePath,
      fileName: assets.fileName,
    })
    .from(workWithUsCarouselPhotos)
    .leftJoin(assets, eq(workWithUsCarouselPhotos.assetId, assets.id))
    .orderBy(asc(workWithUsCarouselPhotos.sortOrder))

  return results.filter(r => r.filePath !== null) as CarouselPhotoWithAsset[]
}

export type CarouselDisplayPhoto = {
  filePath: string
  width: number | null
  height: number | null
  blurDataUrl: string | null
}

/**
 * Get enabled carousel photos for display. Excludes any asset flagged in
 * recovery (missing/lost/superseded/removed) so broken slots never render —
 * a healthy asset has recovery_status = null. Returns dims + LQIP blur so the
 * carousel can reserve space and blur-up like the rest of the site.
 */
export async function getEnabledCarouselPhotos(): Promise<CarouselDisplayPhoto[]> {
  const results = await db
    .select({
      filePath: assets.filePath,
      width: assets.width,
      height: assets.height,
      blurDataUrl: assets.blurDataUrl,
    })
    .from(workWithUsCarouselPhotos)
    .leftJoin(assets, eq(workWithUsCarouselPhotos.assetId, assets.id))
    .where(
      and(
        eq(workWithUsCarouselPhotos.isEnabled, true),
        isNull(assets.recoveryStatus),
      ),
    )
    .orderBy(asc(workWithUsCarouselPhotos.sortOrder))

  return results.filter(r => r.filePath !== null) as CarouselDisplayPhoto[]
}

/**
 * Add a photo to the carousel
 */
export async function addCarouselPhoto(assetId: string): Promise<CarouselPhotoWithAsset> {
  // Get current max sort order
  const existing = await db
    .select({ sortOrder: workWithUsCarouselPhotos.sortOrder })
    .from(workWithUsCarouselPhotos)
    .orderBy(asc(workWithUsCarouselPhotos.sortOrder))

  const maxOrder = existing.length > 0 ? Math.max(...existing.map(e => e.sortOrder)) : -1

  const [newPhoto] = await db
    .insert(workWithUsCarouselPhotos)
    .values({
      assetId,
      sortOrder: maxOrder + 1,
      isEnabled: true,
    })
    .returning()

  // Get asset data
  const [asset] = await db
    .select({ filePath: assets.filePath, fileName: assets.fileName })
    .from(assets)
    .where(eq(assets.id, assetId))

  return {
    id: newPhoto.id,
    assetId: newPhoto.assetId,
    sortOrder: newPhoto.sortOrder,
    isEnabled: newPhoto.isEnabled,
    filePath: asset.filePath,
    fileName: asset.fileName,
  }
}

/**
 * Toggle a photo's enabled status
 */
export async function toggleCarouselPhotoEnabled(photoId: string): Promise<{ isEnabled: boolean }> {
  const [photo] = await db
    .select({ isEnabled: workWithUsCarouselPhotos.isEnabled })
    .from(workWithUsCarouselPhotos)
    .where(eq(workWithUsCarouselPhotos.id, photoId))

  const [updated] = await db
    .update(workWithUsCarouselPhotos)
    .set({
      isEnabled: !photo.isEnabled,
      updatedAt: new Date(),
    })
    .where(eq(workWithUsCarouselPhotos.id, photoId))
    .returning({ isEnabled: workWithUsCarouselPhotos.isEnabled })

  return { isEnabled: updated.isEnabled }
}

/**
 * Delete a photo from the carousel
 */
export async function deleteCarouselPhoto(photoId: string): Promise<void> {
  await db
    .delete(workWithUsCarouselPhotos)
    .where(eq(workWithUsCarouselPhotos.id, photoId))
}

/**
 * Reorder carousel photos
 */
export async function reorderCarouselPhotos(photoIds: string[]): Promise<void> {
  // Update each photo's sort order based on its position in the array
  await Promise.all(
    photoIds.map((id, index) =>
      db
        .update(workWithUsCarouselPhotos)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(workWithUsCarouselPhotos.id, id))
    )
  )
}
