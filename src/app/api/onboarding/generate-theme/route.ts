/**
 * POST /api/onboarding/generate-theme
 *
 * Generates a custom theme based on brand data
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db, onboardingBrandData, onboardingCustomThemes } from '@/db'
import { eq } from 'drizzle-orm'
import { generateColorScheme } from '@/lib/ai/brand-extractor'

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
    const { baseColor, themeName, applyBrandColors } = body

    // Get brand data
    const [brandData] = await db
      .select()
      .from(onboardingBrandData)
      .where(eq(onboardingBrandData.userId, session.user.id))
      .limit(1)

    let primaryColor = baseColor || brandData?.primaryColor || '#A19781' // Default sage
    let secondaryColor = brandData?.secondaryColor
    let accentColor = brandData?.accentColor
    let colorPalette: any = {}

    // Generate complementary colors if needed
    if (!secondaryColor || !accentColor) {
      const generatedScheme = await generateColorScheme(primaryColor)
      if (!secondaryColor) secondaryColor = generatedScheme.palette[1]
      if (!accentColor) accentColor = generatedScheme.palette[2]
    }

    // If applying brand colors, use extracted palette
    if (applyBrandColors && brandData?.colorPalette) {
      const palette = brandData.colorPalette as any
      colorPalette = {
        sage: palette.colors[0],
        dustyRose: palette.colors[1],
        warmSand: palette.colors[2],
        golden: palette.colors[3],
        terracotta: palette.colors[4],
        oceanMist: palette.colors[5],
        cream: palette.colors[6],
        dune: palette.colors[7]
      }
    } else {
      // Use default Desert Ocean palette
      colorPalette = {
        sage: '#A19781',
        dustyRose: '#CDA89E',
        warmSand: '#EBE0CB',
        golden: '#D4AF75',
        terracotta: '#BD8878',
        oceanMist: '#BCC9C2',
        cream: '#FAF7F1',
        dune: '#8A7C69'
      }
    }

    // Generate theme
    const theme = {
      userId: session.user.id,
      themeName: themeName || `${brandData?.brandPersonality || 'Custom'} Theme`,
      themeDescription: `Custom theme based on ${applyBrandColors ? 'your brand colors' : 'complementary colors'}`,
      generationSource: applyBrandColors ? ('ai_generated' as const) : ('user_selected' as const),
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor: colorPalette.cream,
      surfaceColor: colorPalette.warmSand,
      textColor: colorPalette.dune,
      textSecondaryColor: colorPalette.sage,
      colorPalette,
      colorHarmony: (brandData?.colorPalette as any)?.colorHarmony || 'complementary',
      colorTemperature: (brandData?.colorPalette as any)?.colorTemperature || 'warm',
      logoUrl: brandData?.logoUrl,
      headingFont: brandData?.primaryFont,
      bodyFont: brandData?.secondaryFont,
      isActive: true,
      userApproved: false
    }

    // Store theme
    const [customTheme] = await db
      .insert(onboardingCustomThemes)
      .values(theme)
      .onConflictDoUpdate({
        target: onboardingCustomThemes.userId,
        set: {
          ...theme,
          updatedAt: new Date()
        }
      })
      .returning()

    return NextResponse.json({
      success: true,
      theme: customTheme
    })
  } catch (error) {
    console.error('Generate theme error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate theme' },
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

    // Get theme
    const [theme] = await db
      .select()
      .from(onboardingCustomThemes)
      .where(eq(onboardingCustomThemes.userId, session.user.id))
      .limit(1)

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      theme
    })
  } catch (error) {
    console.error('Get theme error:', error)
    return NextResponse.json({ error: 'Failed to get theme' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Update theme
    const [theme] = await db
      .update(onboardingCustomThemes)
      .set({
        ...body,
        userModified: true,
        lastModifiedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(onboardingCustomThemes.userId, session.user.id))
      .returning()

    return NextResponse.json({
      success: true,
      theme
    })
  } catch (error) {
    console.error('Update theme error:', error)
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 })
  }
}
