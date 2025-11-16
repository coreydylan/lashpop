/**
 * POST /api/onboarding/connect-account
 *
 * Connects a social media account or website to the user's onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db, onboardingConnectedAccounts } from '@/db'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accountType, accountIdentifier, displayName, profileUrl } = body

    if (!accountType || !accountIdentifier) {
      return NextResponse.json(
        { error: 'Account type and identifier are required' },
        { status: 400 }
      )
    }

    // Validate account type
    const validAccountTypes = [
      'instagram',
      'website',
      'facebook',
      'tiktok',
      'pinterest',
      'linkedin',
      'twitter'
    ]

    if (!validAccountTypes.includes(accountType)) {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })
    }

    // Create connected account
    const [connectedAccount] = await db
      .insert(onboardingConnectedAccounts)
      .values({
        userId: session.user.id,
        accountType,
        accountIdentifier,
        displayName: displayName || accountIdentifier,
        profileUrl: profileUrl || accountIdentifier,
        scrapingStatus: 'pending'
      })
      .returning()

    return NextResponse.json({
      success: true,
      account: connectedAccount
    })
  } catch (error) {
    console.error('Connect account error:', error)
    return NextResponse.json({ error: 'Failed to connect account' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all connected accounts
    const accounts = await db
      .select()
      .from(onboardingConnectedAccounts)
      .where(eq(onboardingConnectedAccounts.userId, session.user.id))

    return NextResponse.json({
      success: true,
      accounts
    })
  } catch (error) {
    console.error('Get connected accounts error:', error)
    return NextResponse.json({ error: 'Failed to get accounts' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Delete connected account
    await db
      .delete(onboardingConnectedAccounts)
      .where(eq(onboardingConnectedAccounts.id, accountId))

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Delete connected account error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
