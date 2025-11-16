/**
 * GET/POST /api/onboarding/progress
 *
 * Track and update user's onboarding progress
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db, onboardingProgress, profiles } from '@/db'
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

    // Get onboarding progress
    const [progress] = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, session.user.id))
      .limit(1)

    if (!progress) {
      // Create initial progress
      const [newProgress] = await db
        .insert(onboardingProgress)
        .values({
          userId: session.user.id,
          currentStep: 0,
          status: 'not_started',
          stepsCompleted: {},
          stepData: {}
        })
        .returning()

      return NextResponse.json({
        success: true,
        progress: newProgress
      })
    }

    return NextResponse.json({
      success: true,
      progress
    })
  } catch (error) {
    console.error('Get onboarding progress error:', error)
    return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 })
  }
}

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
    const {
      currentStep,
      status,
      stepsCompleted,
      stepData,
      completionPercentage,
      connectedAccountsCount,
      importedAssetsCount,
      generatedExamplesCount
    } = body

    // Get existing progress
    const [existingProgress] = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, session.user.id))
      .limit(1)

    const now = new Date()

    if (!existingProgress) {
      // Create new progress
      const [progress] = await db
        .insert(onboardingProgress)
        .values({
          userId: session.user.id,
          currentStep: currentStep || 0,
          status: status || 'in_progress',
          stepsCompleted: stepsCompleted || {},
          stepData: stepData || {},
          startedAt: now,
          lastActiveAt: now,
          completionPercentage: completionPercentage || 0,
          connectedAccountsCount: connectedAccountsCount || 0,
          importedAssetsCount: importedAssetsCount || 0,
          generatedExamplesCount: generatedExamplesCount || 0
        })
        .returning()

      return NextResponse.json({
        success: true,
        progress
      })
    }

    // Update existing progress
    const updateData: any = {
      lastActiveAt: now,
      updatedAt: now
    }

    if (currentStep !== undefined) updateData.currentStep = currentStep
    if (status !== undefined) updateData.status = status
    if (stepsCompleted !== undefined) updateData.stepsCompleted = stepsCompleted
    if (stepData !== undefined) updateData.stepData = stepData
    if (completionPercentage !== undefined) updateData.completionPercentage = completionPercentage
    if (connectedAccountsCount !== undefined) updateData.connectedAccountsCount = connectedAccountsCount
    if (importedAssetsCount !== undefined) updateData.importedAssetsCount = importedAssetsCount
    if (generatedExamplesCount !== undefined) updateData.generatedExamplesCount = generatedExamplesCount

    // If completing onboarding
    if (status === 'completed' && !existingProgress.completedAt) {
      updateData.completedAt = now

      // Also update profile
      await db
        .update(profiles)
        .set({
          onboardingCompleted: true,
          updatedAt: now
        })
        .where(eq(profiles.userId, session.user.id))
    }

    const [progress] = await db
      .update(onboardingProgress)
      .set(updateData)
      .where(eq(onboardingProgress.userId, session.user.id))
      .returning()

    return NextResponse.json({
      success: true,
      progress
    })
  } catch (error) {
    console.error('Update onboarding progress error:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
