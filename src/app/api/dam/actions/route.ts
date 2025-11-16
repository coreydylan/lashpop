/**
 * DAM User Actions API
 *
 * POST: Log a user action in the DAM
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { damUserActions, type DamActionData } from '@/db/schema/dam_user_actions'
import { requireAuth, UnauthorizedError, ForbiddenError } from '@/lib/server/dam-auth'

export async function POST(request: NextRequest) {
  try {
    // Require authentication using our unified auth helper
    const user = await requireAuth()

    const body = await request.json()
    const { actionType, actionData } = body

    if (!actionType || typeof actionType !== 'string') {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Insert action log
    await db.insert(damUserActions).values({
      id: `dam_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      actionType,
      actionData: actionData as DamActionData,
      createdAt: new Date()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error logging DAM action:', error)
    // Don't fail the request if logging fails - it's not critical
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
