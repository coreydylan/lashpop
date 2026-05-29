import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { teamMemberPhotos } from '@/db/schema/team_member_photos'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import { getRouteParam } from '@/lib/server/getRouteParam'
import {
  downloadBuffer,
  uploadBuffer,
  deleteObject,
  getStorageBucketUrl,
  generateAssetKey,
} from '@/lib/dam/r2-client'

export const runtime = 'nodejs' // sharp needs the Node runtime
export const dynamic = 'force-dynamic'

/**
 * Rotate a stored portfolio/team photo by 90/180/270° (the sideways-phone-photo
 * case). Reads the original from R2, re-encodes rotated with sharp, writes a NEW
 * R2 key (so the CDN can't serve a stale cache), points the row at it, and nulls
 * the crop variants (their pixel coords are now wrong). Best-effort deletes the
 * old object. Only works for photos we own in R2 — not Vagaro-hosted URLs.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ photoId: string }> }) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const photoId = await getRouteParam(ctx, 'photoId')
  if (!photoId) {
    return NextResponse.json({ error: 'Missing photo id' }, { status: 400 })
  }
  let degrees: number
  try {
    degrees = (await req.json())?.degrees
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (![90, 180, 270].includes(degrees)) {
    return NextResponse.json({ error: 'degrees must be 90, 180, or 270' }, { status: 400 })
  }

  const db = getDb()
  const [photo] = await db
    .select()
    .from(teamMemberPhotos)
    .where(eq(teamMemberPhotos.id, photoId))
    .limit(1)
  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

  const bucketUrl = getStorageBucketUrl()
  if (!photo.filePath.startsWith(bucketUrl + '/')) {
    return NextResponse.json(
      { error: 'Only uploaded photos can be rotated (this one is hosted elsewhere).' },
      { status: 400 }
    )
  }
  const oldKey = photo.filePath.slice(bucketUrl.length + 1)

  try {
    const original = await downloadBuffer(oldKey)
    const rotated = await sharp(original).rotate(degrees).webp({ quality: 90 }).toBuffer()
    const newKey = generateAssetKey(photo.fileName || 'photo.webp', photo.teamMemberId)
    const { url } = await uploadBuffer({ key: newKey, buffer: rotated, contentType: 'image/webp' })

    await db
      .update(teamMemberPhotos)
      .set({
        filePath: url,
        // pre-rotation crop coordinates are now meaningless — clear them.
        cropFullVertical: null,
        cropFullHorizontal: null,
        cropMediumCircle: null,
        cropCloseUpCircle: null,
        cropSquare: null,
        cropFullVerticalUrl: null,
        cropFullHorizontalUrl: null,
        cropMediumCircleUrl: null,
        cropCloseUpCircleUrl: null,
        cropSquareUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(teamMemberPhotos.id, photoId))

    // Best-effort: remove the old object so we don't orphan R2 storage.
    try {
      await deleteObject(oldKey)
    } catch (e) {
      console.error('[rotate] old object cleanup failed (non-fatal)', e)
    }

    await recordAdminAction({
      action: 'team.photo.rotate',
      surface: 'inline',
      targetType: 'team_member_photo',
      targetId: photoId,
      diff: { degrees },
    })

    return NextResponse.json({ url, photoId })
  } catch (err) {
    console.error('[rotate] failed', err)
    return NextResponse.json({ error: 'Failed to rotate photo' }, { status: 500 })
  }
}
