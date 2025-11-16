/**
 * GET /api/user/profile
 *
 * Get current user's profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db, profiles } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1)

    if (!profile) {
      // Create default profile if doesn't exist
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId: session.user.id,
          onboardingCompleted: false,
          profileCompletionPercentage: 0
        })
        .returning()

      return NextResponse.json({
        success: true,
        profile: newProfile
      })
    }

    return NextResponse.json({
      success: true,
      profile
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}
