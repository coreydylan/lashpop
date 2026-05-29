import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

/**
 * Lightweight identity probe for inline admin mode.
 *
 * Returns the current admin's identity if the global `auth_token` session is
 * valid AND has damAccess; otherwise 401. The inline `AdminModeProvider` calls
 * this (with redirect:'manual') only when admin mode is requested via
 * `?admin=1`/localStorage, so public visitors never hit it.
 *
 * Server-side `requireAdminApi()` on every write remains the real authorization
 * boundary — this endpoint only decides whether to render edit chrome.
 */
export async function GET() {
  const sess = await getAdminSession()
  if (!sess || !sess.isAdmin) {
    return NextResponse.json({ isAdmin: false }, { status: 401 })
  }
  return NextResponse.json({
    isAdmin: true,
    userId: sess.userId,
    name: sess.name,
    email: sess.email,
  })
}
