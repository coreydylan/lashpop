import { NextRequest, NextResponse } from 'next/server'
import { updateBranding, updateSEO } from '@/actions/site-settings'
import { BrandingSettings, SEOSettings } from '@/db/schema/site_settings'

interface BrandingUpdatePayload {
  branding?: BrandingSettings
  seo?: SEOSettings
}

/**
 * PUT /api/admin/website/site-settings/branding
 * Update branding and SEO settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body: BrandingUpdatePayload = await request.json()

    const results = await Promise.all([
      body.branding ? updateBranding(body.branding) : true,
      body.seo ? updateSEO(body.seo) : true
    ])

    const allSuccessful = results.every(r => r === true)

    if (allSuccessful) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Some settings failed to update' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating branding settings:', error)
    return NextResponse.json(
      { error: 'Failed to update branding settings' },
      { status: 500 }
    )
  }
}
