/**
 * Vagaro Sync Functions
 *
 * Syncs data from Vagaro API to local database, merging with local enrichments
 */

import { getDb } from '@/db'
import { services } from '@/db/schema/services'
import { teamMembers } from '@/db/schema/team_members'
import { getVagaroClient } from './vagaro-client'
import { eq, isNotNull } from 'drizzle-orm'

/**
 * Sync a single service from Vagaro to local DB
 */
export async function syncService(vagaroService: any) {
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

  // Check if service already exists
  const [existing] = await db
    .select()
    .from(services)
    .where(eq(services.vagaroServiceId, serviceId))
    .limit(1)

  if (existing) {
    // Update existing service - preserve local enrichments
    await db
      .update(services)
      .set({
        name: title,
        description,
        durationMinutes,
        priceStarting: Math.round(priceStarting * 100), // Convert to cents
        vagaroParentServiceId: vagaroService.parentServiceId,
        vagaroData: vagaroService,
        vagaroImageUrl: vagaroService.image_url || vagaroService.imageUrl || null,
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
        vagaroImageUrl: vagaroService.image_url || vagaroService.imageUrl || null,
        name: title,
        slug,
        subtitle: parentTitle,
        description,
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
 * Sync all services from Vagaro
 */
export async function syncAllServices() {
  console.log('🔄 Syncing all services from Vagaro...')

  const client = getVagaroClient()
  const vagaroServices = await client.getServices()

  console.log(`  Found ${vagaroServices?.length || 0} services in Vagaro`)

  if (!Array.isArray(vagaroServices)) {
    console.error('  ❌ Invalid response from Vagaro API')
    console.error('  Response:', vagaroServices)
    return
  }

  for (const service of vagaroServices) {
    try {
      await syncService(service)
    } catch (error) {
      const serviceName = (service as any)?.serviceTitle ?? (service as any)?.name ?? 'service'
      console.error(`  ❌ Failed to sync service ${serviceName}:`, error)
    }
  }

  console.log('✅ Service sync complete')
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
        imageUrl: '/placeholder-team.jpg', // Placeholder
        specialties: [],
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
export async function syncAllTeamMembers() {
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

  let syncedCount = 0
  let errorCount = 0

  for (const member of membersToSync) {
    try {
      // Fetch fresh data from Vagaro using their employee ID
      const vagaroEmployee = await client.getEmployee(member.vagaroEmployeeId!)

      if (vagaroEmployee) {
        await syncTeamMember(vagaroEmployee)
        syncedCount++
        console.log(`✓ Synced: ${member.name}`)
      }
    } catch (error) {
      errorCount++
      console.error(`  ❌ Failed to sync ${member.name}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log(`✅ Team member sync complete: ${syncedCount} synced, ${errorCount} errors`)
}
