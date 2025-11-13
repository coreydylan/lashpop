/**
 * DAM User Actions API
 *
 * POST: Log a user action in the DAM
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/db'
import { damUserActions, type DamActionData } from '@/db/schema/dam_user_actions'
import { user as userSchema } from '@/db/schema/auth_user'
import { session as sessionSchema } from '@/db/schema/auth_session'
import { eq, and, gt } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = getDb()

    // Validate session and check DAM access
    const result = await db
      .select({
        userId: userSchema.id,
        damAccess: userSchema.damAccess
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

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check DAM access
    if (!session.damAccess) {
      return NextResponse.json(
        { error: 'Access denied - DAM access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { actionType, actionData } = body

    if (!actionType || typeof actionType !== 'string') {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      )
    }

    // Insert action log
    await db.insert(damUserActions).values({
      id: `dam_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.userId,
      actionType,
      actionData: actionData as DamActionData,
      createdAt: new Date()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging DAM action:', error)
    // Don't fail the request if logging fails - it's not critical
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
