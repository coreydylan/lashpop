/**
 * POST /api/onboarding/extract-brand
 *
 * Uses AI to extract brand information from imported assets
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db, onboardingImportedAssets, onboardingBrandData } from '@/db'
import { eq } from 'drizzle-orm'
import { extractBrandFromImage, extractBrandFromMultipleImages } from '@/lib/ai/brand-extractor'

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
    const { assetIds, singleAssetId } = body

    // Get imported assets
    let assets
    if (singleAssetId) {
      assets = await db
        .select()
        .from(onboardingImportedAssets)
        .where(eq(onboardingImportedAssets.id, singleAssetId))
        .limit(1)
    } else {
      // Get all user's imported assets or specific ones
      assets = await db
        .select()
        .from(onboardingImportedAssets)
        .where(eq(onboardingImportedAssets.userId, session.user.id))
        .limit(10) // Limit to 10 for performance
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json({ error: 'No assets found' }, { status: 404 })
    }

    // Extract brand information
    let brandResult

    if (assets.length === 1) {
      brandResult = await extractBrandFromImage(assets[0].s3Url)
    } else {
      brandResult = await extractBrandFromMultipleImages(
        assets.map((a) => ({ url: a.s3Url }))
      )
    }

    // Store brand data
    const [brandData] = await db
      .insert(onboardingBrandData)
      .values({
        userId: session.user.id,
        primaryColor: brandResult.colors.primary,
        secondaryColor: brandResult.colors.secondary,
        accentColor: brandResult.colors.accent,
        colorPalette: {
          colors: brandResult.colors.palette,
          dominantColors: brandResult.colors.dominantColors,
          complementaryColors: brandResult.colors.complementaryColors,
          source: 'ai_extracted'
        },
        primaryFont: brandResult.typography?.primaryFont,
        secondaryFont: brandResult.typography?.secondaryFont,
        fontPairings: brandResult.typography
          ? {
              heading: brandResult.typography.primaryFont,
              body: brandResult.typography.secondaryFont
            }
          : undefined,
        brandKeywords: brandResult.aesthetic.keywords,
        brandPersonality: brandResult.aesthetic.personality,
        industryCategory: brandResult.aesthetic.industry,
        aiExtractionStatus: 'completed',
        aiModel: 'claude-3-5-sonnet-20241022',
        aiConfidenceScore: String(brandResult.confidence),
        rawAiResponse: brandResult as any,
        logoDetectionSource: brandResult.logo?.detected ? 'ai_detected' : undefined,
        logoDetectionConfidence: brandResult.logo?.confidence
      })
      .onConflictDoUpdate({
        target: onboardingBrandData.userId,
        set: {
          primaryColor: brandResult.colors.primary,
          secondaryColor: brandResult.colors.secondary,
          accentColor: brandResult.colors.accent,
          colorPalette: {
            colors: brandResult.colors.palette,
            dominantColors: brandResult.colors.dominantColors,
            complementaryColors: brandResult.colors.complementaryColors,
            source: 'ai_extracted'
          },
          updatedAt: new Date()
        }
      })
      .returning()

    // Update assets with AI analysis
    for (const asset of assets) {
      await db
        .update(onboardingImportedAssets)
        .set({
          aiAnalysis: {
            tags: brandResult.aesthetic.keywords,
            dominantColors: brandResult.colors.dominantColors,
            description: brandResult.aesthetic.personality
          },
          updatedAt: new Date()
        })
        .where(eq(onboardingImportedAssets.id, asset.id))
    }

    return NextResponse.json({
      success: true,
      brandData,
      brandResult
    })
  } catch (error) {
    console.error('Brand extraction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract brand' },
      { status: 500 }
    )
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

    // Get brand data
    const [brandData] = await db
      .select()
      .from(onboardingBrandData)
      .where(eq(onboardingBrandData.userId, session.user.id))
      .limit(1)

    if (!brandData) {
      return NextResponse.json({ error: 'Brand data not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      brandData
    })
  } catch (error) {
    console.error('Get brand data error:', error)
    return NextResponse.json({ error: 'Failed to get brand data' }, { status: 500 })
  }
}
