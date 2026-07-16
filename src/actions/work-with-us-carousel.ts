'use server'

import { getDb } from '@/db'
import { workWithUsCarouselPhotos } from '@/db/schema/work_with_us_carousel'
import { assets } from '@/db/schema/assets'
import { requireAdminRole } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import { eq, asc, and, inArray, isNull } from 'drizzle-orm'

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
  const auth = await requireAdminRole('owner', 'publisher')

  const [asset] = await db
    .select({ filePath: assets.filePath, fileName: assets.fileName })
    .from(assets)
    .where(eq(assets.id, assetId))

  if (!asset) throw new Error('Asset not found')

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

  await recordAdminAction({
    action: 'careers.carousel.add',
    targetType: 'careers-carousel-photo',
    targetId: newPhoto.id,
    actorUserId: auth.userId,
    diff: {
      before: null,
      after: {
        assetId: newPhoto.assetId,
        sortOrder: newPhoto.sortOrder,
        isEnabled: newPhoto.isEnabled,
      },
    },
  })

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
  const auth = await requireAdminRole('owner', 'publisher')
  const [photo] = await db
    .select({
      assetId: workWithUsCarouselPhotos.assetId,
      isEnabled: workWithUsCarouselPhotos.isEnabled,
    })
    .from(workWithUsCarouselPhotos)
    .where(eq(workWithUsCarouselPhotos.id, photoId))

  if (!photo) throw new Error('Carousel photo not found')

  const [updated] = await db
    .update(workWithUsCarouselPhotos)
    .set({
      isEnabled: !photo.isEnabled,
      updatedAt: new Date(),
    })
    .where(eq(workWithUsCarouselPhotos.id, photoId))
    .returning({ isEnabled: workWithUsCarouselPhotos.isEnabled })

  await recordAdminAction({
    action: 'careers.carousel.toggle',
    targetType: 'careers-carousel-photo',
    targetId: photoId,
    actorUserId: auth.userId,
    diff: {
      before: { assetId: photo.assetId, isEnabled: photo.isEnabled },
      after: { assetId: photo.assetId, isEnabled: updated.isEnabled },
    },
  })

  return { isEnabled: updated.isEnabled }
}

/**
 * Delete a photo from the carousel
 */
export async function deleteCarouselPhoto(photoId: string): Promise<void> {
  const auth = await requireAdminRole('owner', 'publisher')
  const [before] = await db
    .select({
      assetId: workWithUsCarouselPhotos.assetId,
      sortOrder: workWithUsCarouselPhotos.sortOrder,
      isEnabled: workWithUsCarouselPhotos.isEnabled,
    })
    .from(workWithUsCarouselPhotos)
    .where(eq(workWithUsCarouselPhotos.id, photoId))

  if (!before) throw new Error('Carousel photo not found')

  await db
    .delete(workWithUsCarouselPhotos)
    .where(eq(workWithUsCarouselPhotos.id, photoId))

  await recordAdminAction({
    action: 'careers.carousel.delete',
    targetType: 'careers-carousel-photo',
    targetId: photoId,
    actorUserId: auth.userId,
    diff: { before, after: null },
  })
}

/**
 * Reorder carousel photos
 */
export async function reorderCarouselPhotos(photoIds: string[]): Promise<void> {
  const auth = await requireAdminRole('owner', 'publisher')
  if (photoIds.length === 0) return

  const before = await db
    .select({
      photoId: workWithUsCarouselPhotos.id,
      sortOrder: workWithUsCarouselPhotos.sortOrder,
    })
    .from(workWithUsCarouselPhotos)
    .where(inArray(workWithUsCarouselPhotos.id, photoIds))
    .orderBy(asc(workWithUsCarouselPhotos.sortOrder))

  // Update each photo's sort order based on its position in the array
  await Promise.all(
    photoIds.map((id, index) =>
      db
        .update(workWithUsCarouselPhotos)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(workWithUsCarouselPhotos.id, id))
    )
  )

  await recordAdminAction({
    action: 'careers.carousel.reorder',
    targetType: 'careers-carousel',
    targetId: 'work-with-us',
    actorUserId: auth.userId,
    diff: {
      before,
      after: photoIds.map((photoId, sortOrder) => ({ photoId, sortOrder })),
    },
  })
}
