/**
 * Vagaro Sync Functions
 *
 * Syncs data from Vagaro API to local database, merging with local enrichments
 */

import { getDb } from '@/db'
import { services } from '@/db/schema/services'
import { teamMembers } from '@/db/schema/team_members'
import { getVagaroClient } from './vagaro-client'
import { fetchPublicServicePhotos, serviceTitleKey } from './vagaro-public-services'
import { eq, isNotNull } from 'drizzle-orm'

/**
 * Sync a single service from Vagaro to local DB.
 *
 * `photosByTitle` is an optional title→URL map from the public booking-page
 * composite endpoint. When omitted (or empty), vagaroImageUrl is left alone
 * on updates so we don't clobber an existing URL with null.
 */
export async function syncService(vagaroService: any, photosByTitle?: Map<string, string>) {
  const db = getDb()

  // Extract key fields from Vagaro
  const serviceId = vagaroService.serviceId
  const title = vagaroService.serviceTitle || vagaroService.name
  const parentTitle = vagaroService.parentServiceTitle || vagaroService.category
  const description = vagaroService.serviceDescription || vagaroService.description || ''

  // Get pricing - Vagaro has per-provider pricing
  const performers = vagaroService.servicePerformedBy || []
  const prices = performers.map((p: any) => p.price || p.priceWithTax).filter(Boolean)
  const priceStarting = prices.length > 0 ? Math.min(...prices) : 0

  // Get duration - average across providers
  const durations = performers.map((p: any) => p.durationMinutes).filter(Boolean)
  const durationMinutes =
    durations.length > 0
      ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
      : 60

  // Generate slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Photo from the public composite endpoint, matched by service title.
  // The v2 API itself returns no image fields, so this is the only source.
  const photoUrl = photosByTitle?.get(serviceTitleKey(title)) ?? null
  const photosAvailable = (photosByTitle?.size ?? 0) > 0

  // Check if service already exists
  const [existing] = await db
    .select()
    .from(services)
    .where(eq(services.vagaroServiceId, serviceId))
    .limit(1)

  if (existing) {
    // Update existing service - preserve local enrichments.
    // Mirror the worker: never overwrite `description` (admin owns it). Write
    // Vagaro's copy to `vagaroDescription`; read sites COALESCE the two.
    await db
      .update(services)
      .set({
        name: title,
        vagaroDescription: description,
        durationMinutes,
        priceStarting: Math.round(priceStarting * 100), // Convert to cents
        vagaroParentServiceId: vagaroService.parentServiceId,
        vagaroData: vagaroService,
        ...(photosAvailable ? { vagaroImageUrl: photoUrl } : {}),
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(services.id, existing.id))

    console.log(`✓ Updated service: ${title}`)
    return existing.id
  } else {
    // Insert new service - set defaults for local enrichments
    // Infer mainCategory from parentTitle or default to "Other Services"
    const mainCategory = parentTitle || "Other Services"

    const [newService] = await db
      .insert(services)
      .values({
        vagaroServiceId: serviceId,
        vagaroParentServiceId: vagaroService.parentServiceId,
        vagaroData: vagaroService,
        vagaroImageUrl: photoUrl,
        name: title,
        slug,
        subtitle: parentTitle,
        // Seed `description` with Vagaro's copy at insert so newly-synced
        // services aren't blank on the public site. After insert this column
        // is admin-only — updates write to `vagaroDescription` only.
        description: description || null,
        vagaroDescription: description,
        durationMinutes,
        priceStarting: Math.round(priceStarting * 100), // Convert to cents
        displayOrder: 0,
        isActive: true,
        mainCategory,
        lastSyncedAt: new Date()
      })
      .returning({ id: services.id })

    console.log(`✓ Created service: ${title}`)
    return newService.id
  }
}

/**
 * Sync all services from Vagaro.
 * Returns counts and throws if every service failed (signals a broken connection
 * rather than per-row failures we should ignore).
 */
export async function syncAllServices(): Promise<{ synced: number; failed: number; total: number }> {
  console.log('🔄 Syncing all services from Vagaro...')

  const client = getVagaroClient()
  const vagaroServices = await client.getServices()

  console.log(`  Found ${vagaroServices?.length || 0} services in Vagaro`)

  if (!Array.isArray(vagaroServices)) {
    throw new Error(`Invalid response from Vagaro getServices(): ${JSON.stringify(vagaroServices)}`)
  }

  // Fetch service photos from the public composite endpoint once. The v2 API
  // doesn't expose them, so this is the only source. A failure here is logged
  // but non-fatal — services still sync, existing vagaroImageUrl values are kept.
  let photosByTitle = new Map<string, string>()
  const publicBusinessId = process.env.VAGARO_PUBLIC_BUSINESS_ID
  if (publicBusinessId) {
    try {
      photosByTitle = await fetchPublicServicePhotos(publicBusinessId)
      console.log(`  Fetched ${photosByTitle.size} service photos from public endpoint`)
    } catch (err) {
      console.error('  ⚠️ Public service photos fetch failed — keeping existing vagaroImageUrl values:', err)
    }
  } else {
    console.warn('  ⚠️ VAGARO_PUBLIC_BUSINESS_ID not set — service photos will not be synced')
  }

  const total = vagaroServices.length
  let synced = 0
  let failed = 0
  let lastError: unknown = null

  for (const service of vagaroServices) {
    try {
      await syncService(service, photosByTitle)
      synced++
    } catch (error) {
      failed++
      lastError = error
      const serviceName = (service as any)?.serviceTitle ?? (service as any)?.name ?? 'service'
      console.error(`  ❌ Failed to sync service ${serviceName}:`, error)
    }
  }

  console.log(`✅ Service sync: ${synced} synced, ${failed} failed, ${total} total`)

  // If we had services to sync but none succeeded, the connection is broken — fail loudly.
  if (total > 0 && synced === 0) {
    throw new Error(
      `All ${total} service upserts failed — likely a DB connection issue. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    )
  }

  return { synced, failed, total }
}

/**
 * Sync a single team member from Vagaro to local DB
 */
export async function syncTeamMember(vagaroEmployee: any) {
  const db = getDb()

  // Extract key fields from Vagaro
  const employeeId = vagaroEmployee.serviceProviderId || vagaroEmployee.employee_id
  const firstName = vagaroEmployee.employeeFirstName || vagaroEmployee.firstName || vagaroEmployee.first_name || ''
  const lastName = vagaroEmployee.employeeLastName || vagaroEmployee.lastName || vagaroEmployee.last_name || ''
  const name = `${firstName} ${lastName}`.trim()
  const email = vagaroEmployee.email || vagaroEmployee.emailId || ''
  const phone = vagaroEmployee.phone || vagaroEmployee.phoneNumber || ''

  if (!employeeId) {
    console.warn('  ⚠️ No employee ID found, skipping')
    return null
  }

  // Check if team member already exists
  const [existing] = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.vagaroEmployeeId, employeeId))
    .limit(1)

  if (existing) {
    // Update existing team member - preserve local enrichments
    await db
      .update(teamMembers)
      .set({
        name,
        phone,
        email,
        vagaroData: vagaroEmployee,
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(teamMembers.id, existing.id))

    console.log(`✓ Updated team member: ${name}`)
    return existing.id
  } else {
    // Insert new team member - set defaults for local enrichments
    const [newMember] = await db
      .insert(teamMembers)
      .values({
        vagaroEmployeeId: employeeId,
        vagaroData: vagaroEmployee,
        name,
        phone,
        email,
        role: 'Lash Artist', // Default role
        type: 'employee',
        bookingUrl: `https://www.vagaro.com/lashpop32`,
        usesLashpopBooking: true,
        imageUrl: '/placeholder-team.svg', // Branded "photo coming soon" placeholder
        displayOrder: '0',
        isActive: true,
        lastSyncedAt: new Date()
      })
      .returning({ id: teamMembers.id})

    console.log(`✓ Created team member: ${name}`)
    return newMember.id
  }
}

/**
 * Sync all team members from Vagaro
 *
 * Note: Vagaro API requires serviceProviderId for employee lookups, so we
 * fetch team members from our DB that have vagaro_employee_id and sync each individually
 */
export async function syncAllTeamMembers(): Promise<{ synced: number; failed: number; total: number }> {
  console.log('🔄 Syncing all team members from Vagaro...')

  const db = getDb()
  const client = getVagaroClient()

  // Get all team members that have a Vagaro employee ID
  const membersToSync = await db
    .select({
      id: teamMembers.id,
      name: teamMembers.name,
      vagaroEmployeeId: teamMembers.vagaroEmployeeId,
    })
    .from(teamMembers)
    .where(isNotNull(teamMembers.vagaroEmployeeId))

  console.log(`  Found ${membersToSync.length} team members with Vagaro IDs`)

  const total = membersToSync.length
  let synced = 0
  let failed = 0
  let lastError: unknown = null

  for (const member of membersToSync) {
    try {
      // Fetch fresh data from Vagaro using their employee ID
      const vagaroEmployee = await client.getEmployee(member.vagaroEmployeeId!)

      if (vagaroEmployee) {
        await syncTeamMember(vagaroEmployee)
        synced++
        console.log(`✓ Synced: ${member.name}`)
      }
    } catch (error) {
      failed++
      lastError = error
      console.error(`  ❌ Failed to sync ${member.name}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log(`✅ Team member sync: ${synced} synced, ${failed} failed, ${total} total`)

  // If we had members to sync but none succeeded, connection is broken — fail loudly.
  if (total > 0 && synced === 0) {
    throw new Error(
      `All ${total} team member upserts failed — likely a DB connection issue. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    )
  }

  return { synced, failed, total }
}
