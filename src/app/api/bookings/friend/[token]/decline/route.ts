/**
 * Decline Friend Booking API
 *
 * Declines a friend booking request
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/db'
import { friendBookingRequests } from '@/db/schema/friend_booking_requests'
import { user as userSchema } from '@/db/schema/auth_user'
import { eq } from 'drizzle-orm'
import { sendSMS } from '@/lib/sms-provider'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  try {
    // Get session
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Get booking request
    const [request] = await db.select().from(friendBookingRequests).where(eq(friendBookingRequests.consentToken, token)).limit(1)

    if (!request) {
      return NextResponse.json({ error: 'Booking request not found' }, { status: 404 })
    }

    // Validate request
    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: 'Booking request already processed' },
        { status: 400 }
      )
    }

    // Get the user's phone number from database
    const [currentUser] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, session.user.id))
      .limit(1)

    // Verify the user declining is the friend
    if (currentUser?.phoneNumber !== request.friendPhone) {
      return NextResponse.json(
        { error: 'You are not authorized to decline this booking' },
        { status: 403 }
      )
    }

    // Update booking request
    await db
      .update(friendBookingRequests)
      .set({
        status: 'declined',
        friendUserId: session.user.id,
        declinedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(friendBookingRequests.id, request.id))

    // Notify the requester
    try {
      await sendSMS({
        to: request.requesterPhone,
        message: `Your friend has declined the booking request for LashPop. You can try booking again or contact them directly.`
      })
    } catch (smsError) {
      console.error('Failed to send decline notification:', smsError)
      // Don't fail the whole request if SMS fails
    }

    return NextResponse.json({
      success: true,
      message: 'Booking declined'
    })
  } catch (error: any) {
    console.error('Decline booking error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to decline booking' },
      { status: 500 }
    )
  }
}
