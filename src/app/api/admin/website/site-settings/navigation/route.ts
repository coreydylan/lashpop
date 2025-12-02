import { NextRequest, NextResponse } from 'next/server'
import { updateNavigation, updateFooter } from '@/actions/site-settings'
import { NavigationSettings, FooterSettings } from '@/db/schema/site_settings'

interface NavigationUpdatePayload {
  navigation?: NavigationSettings
  footer?: FooterSettings
}

/**
 * PUT /api/admin/website/site-settings/navigation
 * Update navigation and footer settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body: NavigationUpdatePayload = await request.json()

    const results = await Promise.all([
      body.navigation ? updateNavigation(body.navigation) : true,
      body.footer ? updateFooter(body.footer) : true
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
    console.error('Error updating navigation settings:', error)
    return NextResponse.json(
      { error: 'Failed to update navigation settings' },
      { status: 500 }
    )
  }
}
