import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { assets } from '@/db/schema/assets'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import { getRouteParam } from '@/lib/server/getRouteParam'

const ALT_TEXT_LIMIT = 500
const CAPTION_LIMIT = 2000

function readOptionalText(value: unknown, label: string, limit: number): string | null {
  if (value == null || value === '') return null
  if (typeof value !== 'string') throw new Error(`${label} must be text`)
  const normalized = value.trim()
  if (normalized.length > limit) throw new Error(`${label} must be ${limit} characters or fewer`)
  return normalized || null
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) {
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  try {
    const assetId = await getRouteParam(context, 'assetId')
    if (!assetId) return NextResponse.json({ error: 'Missing assetId' }, { status: 400 })

    const body = await request.json()
    const altText = readOptionalText(body.altText, 'Alt text', ALT_TEXT_LIMIT)
    const caption = readOptionalText(body.caption, 'Caption', CAPTION_LIMIT)
    const db = getDb()
    const before = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1)
    if (!before[0]) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    await db
      .update(assets)
      .set({ altText, caption, updatedAt: new Date() })
      .where(eq(assets.id, assetId))

    const after = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1)
    await recordAdminAction({
      action: 'dam.asset.metadata.update',
      surface: 'dam',
      targetType: 'asset',
      targetId: assetId,
      actorUserId: auth.userId,
      diff: {
        before: { altText: before[0].altText, caption: before[0].caption },
        after: { altText, caption },
      },
    })

    return NextResponse.json({ asset: after[0] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update asset details'
    const status = message.includes('must be') ? 400 : 500
    if (status === 500) console.error('Error updating asset details:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
