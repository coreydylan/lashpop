/**
 * Friend Booking Confirmation Page
 *
 * Handles consent flow for friend bookings
 */

import { getDb } from '@/db'
import { friendBookingRequests } from '@/db/schema/friend_booking_requests'
import { services } from '@/db/schema/services'
import { teamMembers } from '@/db/schema/team_members'
import { eq } from 'drizzle-orm'
import { FriendBookingConfirmation } from '@/components/bookings/FriendBookingConfirmation'
import { notFound } from 'next/navigation'

export default async function ConfirmFriendBookingPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const db = getDb()

  // Get booking request
  const [request] = await db.select().from(friendBookingRequests).where(eq(friendBookingRequests.consentToken, token)).limit(1)

  if (!request) {
    notFound()
  }

  // Check if expired
  if (request.consentTokenExpiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-gray-600">
            This booking invitation has expired. Please ask your friend to send a new one.
          </p>
        </div>
      </div>
    )
  }

  // Check if already processed
  if (request.status !== 'pending') {
    const statusEmoji = request.status === 'accepted' ? '✓' : '✗'
    const statusText = request.status === 'accepted' ? 'Confirmed' : 'Declined'

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">{statusEmoji}</div>
          <h1 className="text-2xl font-bold mb-2">Already {statusText}</h1>
          <p className="text-gray-600">
            You&apos;ve already {request.status} this booking request.
          </p>
        </div>
      </div>
    )
  }

  // Get service and team member details
  const [service] = request.serviceId
    ? await db.select().from(services).where(eq(services.id, request.serviceId)).limit(1)
    : [null]

  const [teamMember] = request.teamMemberId
    ? await db.select().from(teamMembers).where(eq(teamMembers.id, request.teamMemberId)).limit(1)
    : [null]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <FriendBookingConfirmation
        request={request}
        service={service}
        teamMember={teamMember}
      />
    </div>
  )
}
