/**
 * Profile Actions
 *
 * Server actions for managing user profiles
 */

'use server'

import { getDb } from '@/db'
import { profiles } from '@/db/schema/profiles'
import { vagaroSyncMappings } from '@/db/schema/vagaro_sync_mappings'
import { user as userSchema } from '@/db/schema/auth_user'
import { vagaroCustomers } from '@/db/schema/vagaro_customers'
import { appointments } from '@/db/schema/appointments'
import { eq, sql, and } from 'drizzle-orm'

/**
 * Create a profile for a new user
 */
export async function createProfile(userId: string) {
  const db = getDb()

  // Check if profile already exists
  const [existingProfile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)

  if (existingProfile) {
    console.log('Profile already exists for user:', userId)
    return existingProfile
  }

  // Get user data to check for phone number
  const [user] = await db.select().from(userSchema).where(eq(userSchema.id, userId)).limit(1)

  if (!user) {
    throw new Error('User not found')
  }

  // Create new profile
  const [newProfile] = await db.insert(profiles).values({
    userId,
    profileCompletionPercentage: 20, // Started with phone only
    onboardingCompleted: false
  }).returning()

  console.log('✓ Profile created for user:', userId)

  return newProfile
}

/**
 * Get profile by user ID
 */
export async function getProfile(userId: string) {
  const db = getDb()

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)

  return profile
}

/**
 * Update profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<typeof profiles.$inferInsert>
) {
  const db = getDb()

  const [updatedProfile] = await db
    .update(profiles)
    .set({
      ...updates as any,
      updatedAt: new Date()
    })
    .where(eq(profiles.userId, userId))
    .returning()

  // Recalculate profile completion percentage
  const completionPercentage = await calculateProfileCompletion(userId)

  await db
    .update(profiles)
    .set({ profileCompletionPercentage: completionPercentage })
    .where(eq(profiles.userId, userId))

  return updatedProfile
}

/**
 * Calculate profile completion percentage
 */
export async function calculateProfileCompletion(userId: string): Promise<number> {
  const db = getDb()

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)

  const [user] = await db.select().from(userSchema).where(eq(userSchema.id, userId)).limit(1)

  if (!profile || !user) return 0

  let score = 0

  // Phone verified (required - 20 points)
  if (user.phoneNumberVerified) score += 20

  // Basic info (40 points total)
  if (profile.firstName) score += 10
  if (profile.lastName) score += 10
  if (user.email) score += 20

  // Preferences (20 points)
  if (profile.preferredLocationId) score += 10
  if (profile.preferredTeamMemberId) score += 10

  // Additional details (20 points)
  if (profile.dateOfBirth) score += 10
  if (profile.lashType || profile.lashCurl || profile.lashLength) score += 10

  return Math.min(score, 100)
}

/**
 * Match and link user to Vagaro customer
 *
 * Tries to find an existing Vagaro customer with matching phone number
 */
export async function matchAndLinkVagaroCustomer(userId: string) {
  const db = getDb()

  // Check if already linked
  const [existingMapping] = await db.select().from(vagaroSyncMappings).where(eq(vagaroSyncMappings.userId, userId)).limit(1)

  if (existingMapping) {
    console.log('User already linked to Vagaro customer:', existingMapping.vagaroCustomerId)
    return existingMapping
  }

  // Get user's phone number
  const [user] = await db.select().from(userSchema).where(eq(userSchema.id, userId)).limit(1)

  if (!user?.phoneNumber) {
    console.log('User has no phone number, cannot match with Vagaro')
    return null
  }

  // Search for Vagaro customer with matching phone
  const matchingCustomers = await db.select().from(vagaroCustomers).where(sql`phones @> ${JSON.stringify([user.phoneNumber])}`)

  if (matchingCustomers.length === 0) {
    console.log('No matching Vagaro customer found for phone:', user.phoneNumber)
    return null
  }

  if (matchingCustomers.length === 1) {
    // Perfect match - create mapping
    const vagaroCustomer = matchingCustomers[0]

    const profile = await getProfile(userId)

    const [mapping] = await db.insert(vagaroSyncMappings).values({
      userId,
      profileId: profile?.id,
      vagaroCustomerId: vagaroCustomer.vagaroCustomerId,
      vagaroBusinessIds: Array.isArray(vagaroCustomer.vagaroBusinessIds)
        ? vagaroCustomer.vagaroBusinessIds
        : (vagaroCustomer.vagaroBusinessIds ? [vagaroCustomer.vagaroBusinessIds] : []),
      syncStatus: 'active',
      lastSyncedAt: new Date()
    }).returning()

    console.log('✓ User linked to Vagaro customer:', vagaroCustomer.vagaroCustomerId)

    // Import appointment history
    await syncAppointmentHistory(mapping.id)

    return mapping
  }

  // Multiple matches - flag for manual review
  console.log(`Multiple Vagaro customers found for phone ${user.phoneNumber}, manual review needed`)

  // TODO: Create manual review record
  // For now, just log it

  return null
}

/**
 * Sync appointment history for a user
 *
 * Links existing Vagaro appointments to the user
 */
async function syncAppointmentHistory(mappingId: string) {
  const db = getDb()

  const [mapping] = await db.select().from(vagaroSyncMappings).where(eq(vagaroSyncMappings.id, mappingId)).limit(1)

  if (!mapping) {
    throw new Error('Mapping not found')
  }

  // Find all appointments for this Vagaro customer
  const customerAppointments = await db.select().from(appointments).where(eq(appointments.vagaroCustomerId, mapping.vagaroCustomerId))

  if (customerAppointments.length === 0) {
    console.log('No appointment history to sync')
    return
  }

  // Link appointments to user
  for (const appointment of customerAppointments) {
    await db
      .update(appointments)
      .set({
        userId: mapping.userId,
        bookedByUserId: mapping.userId,
        isFriendBooking: false
      })
      .where(eq(appointments.id, appointment.id))
  }

  console.log(`✓ Synced ${customerAppointments.length} appointments to user`)
}

/**
 * Get user's full profile with user data
 */
export async function getFullProfile(userId: string) {
  const db = getDb()

  const [user] = await db.select().from(userSchema).where(eq(userSchema.id, userId)).limit(1)

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)

  const [vagaroMapping] = await db.select().from(vagaroSyncMappings).where(eq(vagaroSyncMappings.userId, userId)).limit(1)

  return {
    user,
    profile,
    vagaroMapping,
    isLinkedToVagaro: !!vagaroMapping
  }
}
