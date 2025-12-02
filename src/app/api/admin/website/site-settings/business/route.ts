import { NextRequest, NextResponse } from 'next/server'
import {
  updateBusinessContact,
  updateBusinessLocation,
  updateBusinessHours,
  updateSocialMedia
} from '@/actions/site-settings'
import {
  BusinessContactSettings,
  BusinessLocationSettings,
  BusinessHoursSettings,
  SocialMediaSettings
} from '@/db/schema/site_settings'

interface BusinessUpdatePayload {
  contact?: BusinessContactSettings
  location?: BusinessLocationSettings
  hours?: BusinessHoursSettings
  social?: SocialMediaSettings
}

/**
 * PUT /api/admin/website/site-settings/business
 * Update business information settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body: BusinessUpdatePayload = await request.json()

    const results = await Promise.all([
      body.contact ? updateBusinessContact(body.contact) : true,
      body.location ? updateBusinessLocation(body.location) : true,
      body.hours ? updateBusinessHours(body.hours) : true,
      body.social ? updateSocialMedia(body.social) : true
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
    console.error('Error updating business settings:', error)
    return NextResponse.json(
      { error: 'Failed to update business settings' },
      { status: 500 }
    )
  }
}
