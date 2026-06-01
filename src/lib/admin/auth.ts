import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { eq, and, gt } from 'drizzle-orm'
import { getDb } from '@/db'
import { user as userSchema } from '@/db/schema/auth_user'
import { session as sessionSchema } from '@/db/schema/auth_session'

export interface AdminSession {
  userId: string
  sessionId: string
  sessionToken: string
  phoneNumber: string | null
  email: string | null
  name: string | null
  isAdmin: boolean
  expiresAt: Date
}

const LOGIN_REDIRECT = '/admin/login'

async function readSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth_token')
  if (!authToken?.value) return null

  const db = getDb()
  const result = await db
    .select({
      userId: userSchema.id,
      sessionId: sessionSchema.id,
      sessionToken: sessionSchema.token,
      phoneNumber: userSchema.phoneNumber,
      email: userSchema.email,
      name: userSchema.name,
      damAccess: userSchema.damAccess,
      expiresAt: sessionSchema.expiresAt,
    })
    .from(sessionSchema)
    .innerJoin(userSchema, eq(sessionSchema.userId, userSchema.id))
    .where(
      and(
        eq(sessionSchema.token, authToken.value),
        gt(sessionSchema.expiresAt, new Date())
      )
    )
    .limit(1)

  const row = result[0]
  if (!row) return null

  return {
    userId: row.userId,
    sessionId: row.sessionId,
    sessionToken: row.sessionToken,
    phoneNumber: row.phoneNumber,
    email: row.email,
    name: row.name,
    isAdmin: row.damAccess === true,
    expiresAt: row.expiresAt,
  }
}

/**
 * Soft check. Returns the session if one exists, or null.
 * Does not enforce admin access — caller decides.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  return readSession()
}

/**
 * For server components and server actions. Redirects to login if
 * unauthenticated, or to /admin/no-access if authenticated but not admin.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const sess = await readSession()
  if (!sess) redirect(LOGIN_REDIRECT)
  if (!sess.isAdmin) redirect('/admin/no-access')
  return sess
}

/**
 * For API route handlers. Returns either the session or a NextResponse
 * that the caller should return directly.
 *
 * Usage:
 *   const result = await requireAdminApi()
 *   if (result instanceof NextResponse) return result
 *   const { userId } = result
 */
export async function requireAdminApi(): Promise<AdminSession | NextResponse> {
  const sess = await readSession()
  if (!sess) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }
  if (!sess.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return sess
}
