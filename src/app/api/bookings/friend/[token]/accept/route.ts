/**
 * Accept Friend Booking API
 *
 * Confirms a friend booking request and creates the appointment
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/db'
import { friendBookingRequests } from '@/db/schema/friend_booking_requests'
import { appointments } from '@/db/schema/appointments'
import { user as userSchema } from '@/db/schema/auth_user'
import { eq } from 'drizzle-orm'
import { sendAppointmentConfirmation } from '@/lib/sms-provider'

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

    if (request.consentTokenExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Booking request expired' }, { status: 400 })
    }

    // Get the user's phone number from database
    const [currentUser] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, session.user.id))
      .limit(1)

    // Verify the user confirming is the friend (check phone number)
    if (currentUser?.phoneNumber !== request.friendPhone) {
      return NextResponse.json(
        { error: 'You are not authorized to confirm this booking' },
        { status: 403 }
      )
    }

    // TODO: Create appointment in Vagaro via API
    // For now, create a placeholder appointment
    const [appointment] = await db
      .insert(appointments)
      .values({
        vagaroAppointmentId: `temp-${request.id}`, // Temporary until Vagaro sync
        userId: session.user.id,
        bookedByUserId: request.requesterUserId,
        isFriendBooking: true,
        friendBookingRequestId: request.id,
        serviceTitle: 'Friend Booking - Pending Vagaro Sync',
        startTime: request.requestedDateTime || new Date(),
        endTime: request.requestedDateTime || new Date(),
        bookingStatus: 'Pending'
      })
      .returning()

    // Update booking request
    await db
      .update(friendBookingRequests)
      .set({
        status: 'accepted',
        friendUserId: session.user.id,
        consentedAt: new Date(),
        appointmentId: appointment.id,
        updatedAt: new Date()
      })
      .where(eq(friendBookingRequests.id, request.id))

    // Send confirmation SMS
    try {
      if (currentUser?.phoneNumber) {
        await sendAppointmentConfirmation({
          phoneNumber: currentUser.phoneNumber,
          serviceName: 'Lash Service', // TODO: Get actual service name
          dateTime: request.requestedDateTime?.toLocaleString() || '',
          teamMemberName: 'LashPop' // TODO: Get actual team member
        })
      }
    } catch (smsError) {
      console.error('Failed to send confirmation SMS:', smsError)
      // Don't fail the whole request if SMS fails
    }

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      message: 'Appointment confirmed!'
    })
  } catch (error: any) {
    console.error('Accept booking error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept booking' },
      { status: 500 }
    )
  }
}
