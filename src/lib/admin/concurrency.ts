import { NextResponse } from 'next/server'

/**
 * Optimistic concurrency for website_settings section writes.
 *
 * Every section's content carries an `updatedAt` ISO string (set on each save).
 * The client sends the `updatedAt` it loaded as `baseUpdatedAt`. If the stored
 * row has been updated since (different stamp), someone else changed it — we 409
 * instead of silently clobbering (last-write-wins). The editor then tells the
 * user to reload. Version history (admin_audit_log) remains the recovery net.
 */
export function isStaleWrite(
  prevUpdatedAt: string | undefined | null,
  baseUpdatedAt: unknown
): boolean {
  // No basis sent (older client / first write) or no prior stamp → allow.
  if (typeof baseUpdatedAt !== 'string' || !baseUpdatedAt) return false
  if (!prevUpdatedAt) return false
  return prevUpdatedAt !== baseUpdatedAt
}

/** 409 response carrying the current content so the client can offer "reload". */
export function staleConflictResponse(current: unknown): NextResponse {
  return NextResponse.json(
    {
      error: 'This section was changed in another tab or by someone else. Reload to get the latest, then redo your edit.',
      conflict: true,
      current,
    },
    { status: 409 }
  )
}
