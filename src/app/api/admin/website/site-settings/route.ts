import { NextResponse } from 'next/server'
import { getAllSiteSettings } from '@/actions/site-settings'

/**
 * GET /api/admin/website/site-settings
 * Fetch all site settings
 */
export async function GET() {
  try {
    const settings = await getAllSiteSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    )
  }
}
