import { NextRequest, NextResponse } from 'next/server'
import { updateFounderLetter } from '@/actions/site-settings'
import { FounderLetterSettings } from '@/db/schema/site_settings'

/**
 * PUT /api/admin/website/site-settings/founder-letter
 * Update founder letter content
 */
export async function PUT(request: NextRequest) {
  try {
    const body: FounderLetterSettings = await request.json()

    const success = await updateFounderLetter(body)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to update founder letter' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating founder letter:', error)
    return NextResponse.json(
      { error: 'Failed to update founder letter' },
      { status: 500 }
    )
  }
}
