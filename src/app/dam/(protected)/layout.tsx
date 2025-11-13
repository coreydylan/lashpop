import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DAMProviders } from '../components/DAMProviders'
import { AccessDenied } from './AccessDenied'
import { getDb } from '@/db'
import { user as userSchema } from '@/db/schema/auth_user'
import { session as sessionSchema } from '@/db/schema/auth_session'
import { eq, and, gt } from 'drizzle-orm'

// This layout protects all DAM routes except login
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth_token')

  // If no auth token, redirect to login
  if (!authToken) {
    redirect('/dam/login')
  }

  // Validate session and check DAM access
  const db = getDb()

  const result = await db
    .select({
      userId: userSchema.id,
      damAccess: userSchema.damAccess,
      sessionExpires: sessionSchema.expiresAt
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

  const session = result[0]

  // If session is invalid or expired, redirect to login
  if (!session) {
    redirect('/dam/login')
  }

  // If user doesn't have DAM access, show access denied
  if (!session.damAccess) {
    return <AccessDenied />
  }

  return <DAMProviders>{children}</DAMProviders>
}
