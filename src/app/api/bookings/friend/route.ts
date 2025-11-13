/**
 * Friend Booking API
 *
 * Create booking requests for friends
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/db'
import { friendBookingRequests } from '@/db/schema/friend_booking_requests'
import { user as userSchema } from '@/db/schema/auth_user'
import { services } from '@/db/schema/services'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { sendFriendBookingInvite } from '@/lib/sms-provider'
import { toE164 } from '@/lib/phone-utils'

export async function POST(req: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Get request body
    const { friendPhone, friendName, serviceId, teamMemberId, dateTime } = await req.json()

    // Validate required fields
    if (!friendPhone || !serviceId || !dateTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if friend already has account
    const [existingUser] = await db.select().from(userSchema).where(eq(userSchema.phoneNumber, toE164(friendPhone))).limit(1)

    // Get requester's details
    const [requester] = await db.select().from(userSchema).where(eq(userSchema.id, session.user.id)).limit(1)

    // Get service details
    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1)

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Generate consent token
    const consentToken = nanoid(32)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create friend booking request
    const [request] = await db
      .insert(friendBookingRequests)
      .values({
        requesterUserId: session.user.id,
        requesterPhone: requester?.phoneNumber || '',
        friendPhone: toE164(friendPhone),
        friendName,
        friendUserId: existingUser?.id,
        serviceId,
        teamMemberId,
        requestedDateTime: new Date(dateTime),
        consentToken,
        consentTokenExpiresAt: expiresAt,
        status: 'pending'
      })
      .returning()

    // Send SMS to friend
    const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/confirm/${consentToken}`
    const requesterName = requester?.name || 'A friend'

    await sendFriendBookingInvite({
      friendPhone: toE164(friendPhone),
      requesterName,
      serviceName: service.name,
      dateTime: new Date(dateTime).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      confirmUrl
    })

    return NextResponse.json({
      success: true,
      requestId: request.id,
      message: existingUser
        ? 'Confirmation sent to your friend!'
        : 'Invitation sent to your friend!'
    })
  } catch (error: any) {
    console.error('Friend booking error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create booking request' },
      { status: 500 }
    )
  }
}
