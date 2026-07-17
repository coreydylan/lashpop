import 'server-only'

import { createHash } from 'node:crypto'
import { executeDatabaseBatch } from '@/db'

interface RateLimitOptions {
  scope: string
  identity: string
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

function privacySafeKey(scope: string, identity: string): string {
  const digest = createHash('sha256').update(identity.trim().toLowerCase()).digest('hex')
  return `${scope}:${digest}`
}

/** Durable, atomic D1 rate limiting that stores only a one-way identity digest. */
export async function consumeRateLimit({
  scope,
  identity,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now()
  const resetAt = now + windowMs
  const key = privacySafeKey(scope, identity || 'unknown')

  const results = await executeDatabaseBatch([
    {
      sql: `INSERT INTO request_rate_limits (key, count, reset_at, updated_at)
            VALUES (?, 1, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
              count = CASE
                WHEN request_rate_limits.reset_at <= ? THEN 1
                ELSE request_rate_limits.count + 1
              END,
              reset_at = CASE
                WHEN request_rate_limits.reset_at <= ? THEN excluded.reset_at
                ELSE request_rate_limits.reset_at
              END,
              updated_at = excluded.updated_at`,
      params: [key, resetAt, now, now, now],
      method: 'run',
    },
    {
      sql: 'SELECT count, reset_at FROM request_rate_limits WHERE key = ? LIMIT 1',
      params: [key],
      method: 'get',
    },
  ])

  // The D1 proxy's `get` contract returns one positional row, not an object.
  const row = results[1]?.rows
  const count = Number(row?.[0])
  const currentResetAt = Number(row?.[1])
  if (!Number.isFinite(count) || !Number.isFinite(currentResetAt)) {
    throw new Error('Rate limit state unavailable')
  }
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil((currentResetAt - now) / 1_000)),
  }
}

/** Vercel overwrites this header at the edge, so the first value is trusted. */
export function requestIp(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get('x-vercel-forwarded-for')
    || requestHeaders.get('x-forwarded-for')
    || requestHeaders.get('x-real-ip')
    || 'unknown'
  return forwardedFor.split(',')[0]?.trim().slice(0, 128) || 'unknown'
}
