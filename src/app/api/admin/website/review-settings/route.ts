import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

const SECTION = 'review_pipeline'

interface ReviewSettings {
  homepage_capacity: number
  editor_pass_interval_days: number
  auto_promote_min_quality_score: number
  auto_promote_min_text_length: number
  auto_promote_recency_months: number
  diversity_cap_per_source: number
  diversity_cap_per_stylist: number
  highlights_per_stylist: number
  editor_pass_enabled: boolean
  recency_decay_days_per_point: number
}

const DEFAULTS: ReviewSettings = {
  homepage_capacity: 9,
  editor_pass_interval_days: 7,
  auto_promote_min_quality_score: 5,
  auto_promote_min_text_length: 80,
  auto_promote_recency_months: 18,
  diversity_cap_per_source: 3,
  diversity_cap_per_stylist: 2,
  highlights_per_stylist: 3,
  editor_pass_enabled: true,
  recency_decay_days_per_point: 180,
}

function coerce(raw: Record<string, unknown>): ReviewSettings {
  const c = (v: unknown, fallback: number): number => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  return {
    homepage_capacity: c(raw.homepage_capacity, DEFAULTS.homepage_capacity),
    editor_pass_interval_days: c(raw.editor_pass_interval_days, DEFAULTS.editor_pass_interval_days),
    auto_promote_min_quality_score: c(raw.auto_promote_min_quality_score, DEFAULTS.auto_promote_min_quality_score),
    auto_promote_min_text_length: c(raw.auto_promote_min_text_length, DEFAULTS.auto_promote_min_text_length),
    auto_promote_recency_months: c(raw.auto_promote_recency_months, DEFAULTS.auto_promote_recency_months),
    diversity_cap_per_source: c(raw.diversity_cap_per_source, DEFAULTS.diversity_cap_per_source),
    diversity_cap_per_stylist: c(raw.diversity_cap_per_stylist, DEFAULTS.diversity_cap_per_stylist),
    highlights_per_stylist: c(raw.highlights_per_stylist, DEFAULTS.highlights_per_stylist),
    editor_pass_enabled: raw.editor_pass_enabled !== false,
    recency_decay_days_per_point: c(raw.recency_decay_days_per_point, DEFAULTS.recency_decay_days_per_point),
  }
}

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const [row] = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, SECTION))
    .limit(1)
  const config = coerce((row?.config ?? {}) as Record<string, unknown>)
  return NextResponse.json({ settings: config, defaults: DEFAULTS })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const settings = coerce(body?.settings ?? {})

  const db = getDb()
  // Drizzle's `config` column expects Record<string, unknown>; cast through
  // unknown because the typed ReviewSettings interface doesn't carry an
  // index signature.
  const configBlob = settings as unknown as Record<string, unknown>
  await db
    .insert(websiteSettings)
    .values({ section: SECTION, config: configBlob })
    .onConflictDoUpdate({
      target: websiteSettings.section,
      set: { config: configBlob, updatedAt: new Date() },
    })

  return NextResponse.json({ success: true, settings })
}

/**
 * POST → manually trigger the Worker's editor pass. Proxies to
 * https://lashpop-reviews.<...>.workers.dev/run?editor=1
 *
 * The Worker URL + manual trigger secret live in env vars on the Next.js side:
 *   REVIEWS_WORKER_URL
 *   REVIEWS_WORKER_TRIGGER_SECRET
 */
export async function POST() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const workerUrl = process.env.REVIEWS_WORKER_URL
  const triggerSecret = process.env.REVIEWS_WORKER_TRIGGER_SECRET
  if (!workerUrl || !triggerSecret) {
    return NextResponse.json(
      { error: 'REVIEWS_WORKER_URL or REVIEWS_WORKER_TRIGGER_SECRET not set' },
      { status: 500 },
    )
  }

  // Don't await — editor passes can take 5-15 minutes. Fire and forget,
  // admin UI polls /state or just refreshes after the timer ticks.
  fetch(`${workerUrl.replace(/\/$/, '')}/run?editor=1`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${triggerSecret}` },
  }).catch(err => console.error('[admin] worker trigger failed:', err))

  return NextResponse.json({ triggered: true, note: 'Editor pass started in background. Check back in 5-15 min.' })
}
