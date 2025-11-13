'use server'

import { getDb } from '@/db'
import { appointments } from '@/db/schema/appointments'
import { vagaroCustomers } from '@/db/schema/vagaro_customers'
import { users } from '@/db/schema/auth'
import { eq, and, desc, gte } from 'drizzle-orm'
import { getVagaroClient } from '@/lib/vagaro-client'

/**
 * Fetch recent appointments from Vagaro API
 * Used for polling after booking to get the appointment immediately
 */
export async function pollRecentAppointments(params: {
  serviceId?: string
  employeeId?: string
  minutesAgo?: number
}) {
  try {
    const client = getVagaroClient()

    // Vagaro API might have a "get appointments" endpoint
    // This is a placeholder - you may need to adjust based on actual API
    // For now, we'll rely on webhooks primarily

    console.log('Polling for recent appointments:', params)

    // Return empty for now - webhooks will handle this
    // TODO: Implement actual API polling if Vagaro provides this endpoint
    return []
  } catch (error) {
    console.error('Failed to poll appointments:', error)
    return []
  }
}

/**
 * Get appointments for a specific user
 */
export async function getUserAppointments(userId: string) {
  const db = getDb()

  const userAppointments = await db
    .select()
    .from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(desc(appointments.startTime))

  return userAppointments
}

/**
 * Get upcoming appointments for a user
 */
export async function getUpcomingAppointments(userId: string) {
  const db = getDb()
  const now = new Date()

  const upcomingAppointments = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.userId, userId),
        gte(appointments.startTime, now)
      )
    )
    .orderBy(appointments.startTime)

  return upcomingAppointments
}

/**
 * Link a Vagaro appointment to a LashPop user
 * Called by webhook handler or polling system
 */
export async function linkAppointmentToUser(params: {
  vagaroAppointmentId: string
  userId: string
  isFriendBooking?: boolean
  friendBookingRequestId?: string
}) {
  const db = getDb()

  try {
    // Find the appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.vagaroAppointmentId, params.vagaroAppointmentId))
      .limit(1)

    if (!appointment) {
      console.warn(`Appointment ${params.vagaroAppointmentId} not found in database`)
      return null
    }

    // Update with user link
    await db
      .update(appointments)
      .set({
        userId: params.userId,
        bookedByUserId: params.userId,
        isFriendBooking: params.isFriendBooking || false,
        friendBookingRequestId: params.friendBookingRequestId || null,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointment.id))

    console.log(`✓ Linked appointment ${params.vagaroAppointmentId} to user ${params.userId}`)

    return appointment.id
  } catch (error) {
    console.error('Failed to link appointment to user:', error)
    throw error
  }
}

/**
 * Auto-link appointments to users based on phone number matching
 * Called by webhook handler when appointment is synced
 */
export async function autoLinkAppointmentByPhone(vagaroAppointmentId: string) {
  const db = getDb()

  try {
    // Get the appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.vagaroAppointmentId, vagaroAppointmentId))
      .limit(1)

    if (!appointment || !appointment.vagaroCustomerId) {
      return null
    }

    // Get the Vagaro customer to find their phone number
    const [vagaroCustomer] = await db
      .select()
      .from(vagaroCustomers)
      .where(eq(vagaroCustomers.vagaroCustomerId, appointment.vagaroCustomerId))
      .limit(1)

    if (!vagaroCustomer) {
      console.log(`No Vagaro customer found for appointment ${vagaroAppointmentId}`)
      return null
    }

    // Try to match by phone number
    // Vagaro customers have mobilePhone, dayPhone, nightPhone
    const phoneNumbers = [
      vagaroCustomer.mobilePhone,
      vagaroCustomer.dayPhone,
      vagaroCustomer.nightPhone,
    ].filter(Boolean)

    if (phoneNumbers.length === 0) {
      console.log(`No phone numbers found for Vagaro customer ${appointment.vagaroCustomerId}`)
      return null
    }

    // Find LashPop user with matching phone
    // Note: Your users table stores phone in the format from auth
    // You may need to normalize phone numbers for comparison
    for (const phone of phoneNumbers) {
      if (!phone) continue

      // Normalize phone number (remove formatting)
      const normalizedPhone = phone.replace(/\D/g, '')

      // Try to find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.phone, normalizedPhone))
        .limit(1)

      if (user) {
        // Found a match! Link the appointment
        await linkAppointmentToUser({
          vagaroAppointmentId,
          userId: user.id,
        })

        console.log(`✓ Auto-linked appointment ${vagaroAppointmentId} to user ${user.id} via phone ${normalizedPhone}`)
        return user.id
      }
    }

    console.log(`No LashPop user found matching phones:`, phoneNumbers)
    return null
  } catch (error) {
    console.error('Failed to auto-link appointment by phone:', error)
    return null
  }
}

/**
 * Get appointment by Vagaro ID
 */
export async function getAppointmentByVagaroId(vagaroAppointmentId: string) {
  const db = getDb()

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.vagaroAppointmentId, vagaroAppointmentId))
    .limit(1)

  return appointment || null
}
