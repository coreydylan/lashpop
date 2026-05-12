import { and, eq, isNotNull, ne, sql } from 'drizzle-orm'
import type { Db } from './db'
import { services, teamMembers } from './schema'
import type { VagaroClient } from './vagaro-client'
import { fetchPublicStaff, nameKey, originalPhotoUrl, type VagaroPublicProvider } from './public-staff'

export interface SyncStats {
  synced: number
  failed: number
  total: number
}

export interface PublicStaffStats {
  fetched: number
  matched: number
  updated: number
  created: number
  deactivated: number
  unmatchedInDb: string[]    // db rows with vagaroPublicProviderId set but absent from this run's fetch
  unmatchedInVagaro: string[] // providers in Vagaro response with no matching db row
  errors: string[]
}

async function syncService(db: Db, vagaroService: any): Promise<void> {
  const serviceId = vagaroService.serviceId
  const title = vagaroService.serviceTitle || vagaroService.name
  const parentTitle = vagaroService.parentServiceTitle || vagaroService.category
  const description = vagaroService.serviceDescription || vagaroService.description || ''

  const performers = vagaroService.servicePerformedBy || []
  const prices: number[] = performers.map((p: any) => p.price || p.priceWithTax).filter(Boolean)
  const priceStarting = prices.length > 0 ? Math.min(...prices) : 0

  const durations: number[] = performers.map((p: any) => p.durationMinutes).filter(Boolean)
  const durationMinutes =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 60

  const slug = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const existing = await db.select().from(services).where(eq(services.vagaroServiceId, serviceId)).limit(1)

  if (existing.length > 0) {
    await db
      .update(services)
      .set({
        name: title,
        description,
        durationMinutes,
        priceStarting: Math.round(priceStarting * 100),
        vagaroParentServiceId: vagaroService.parentServiceId,
        vagaroData: vagaroService,
        vagaroImageUrl: vagaroService.image_url || vagaroService.imageUrl || null,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(services.id, existing[0].id))
  } else {
    await db.insert(services).values({
      vagaroServiceId: serviceId,
      vagaroParentServiceId: vagaroService.parentServiceId,
      vagaroData: vagaroService,
      vagaroImageUrl: vagaroService.image_url || vagaroService.imageUrl || null,
      name: title,
      slug,
      subtitle: parentTitle,
      description,
      durationMinutes,
      priceStarting: Math.round(priceStarting * 100),
      displayOrder: 0,
      isActive: true,
      mainCategory: parentTitle || 'Other Services',
      lastSyncedAt: new Date(),
    })
  }
}

async function syncTeamMember(db: Db, vagaroEmployee: any): Promise<void> {
  const employeeId = vagaroEmployee.serviceProviderId || vagaroEmployee.employee_id
  const firstName = vagaroEmployee.employeeFirstName || vagaroEmployee.firstName || ''
  const lastName = vagaroEmployee.employeeLastName || vagaroEmployee.lastName || ''
  const name = `${firstName} ${lastName}`.trim()
  const email = vagaroEmployee.email || vagaroEmployee.emailId || ''
  const phone = vagaroEmployee.phone || vagaroEmployee.phoneNumber || ''

  if (!employeeId) return

  const existing = await db.select().from(teamMembers).where(eq(teamMembers.vagaroEmployeeId, employeeId)).limit(1)

  if (existing.length > 0) {
    await db
      .update(teamMembers)
      .set({
        name,
        phone,
        email,
        vagaroData: vagaroEmployee,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, existing[0].id))
  }
  // We intentionally don't insert new rows from the worker — new team members
  // need local enrichment (role, image, bio) before they show up. Matches the
  // main app's syncAllTeamMembers behavior of only syncing existing rows.
}

export async function syncAllServices(db: Db, client: VagaroClient): Promise<SyncStats> {
  const list = await client.getServices()
  if (!Array.isArray(list)) {
    throw new Error(`Invalid Vagaro getServices() response: ${JSON.stringify(list).slice(0, 200)}`)
  }

  const total = list.length
  let synced = 0
  let failed = 0
  let lastError: unknown = null

  for (const s of list) {
    try {
      await syncService(db, s)
      synced++
    } catch (err) {
      failed++
      lastError = err
      console.error(`service sync failed: ${s?.serviceTitle ?? s?.name ?? 'unknown'}`, err)
    }
  }

  if (total > 0 && synced === 0) {
    throw new Error(
      `All ${total} service upserts failed — connection issue. Last: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    )
  }

  return { synced, failed, total }
}

/**
 * Mirror the Vagaro public staff page to team_members:
 *   - Match by vagaroPublicProviderId (preferred) or lowercased first+last name
 *   - Update photo URL / bio / display order on matched rows
 *   - Create new rows for providers we don't have yet
 *   - Deactivate rows whose name/ID isn't in the Vagaro response
 *
 * Safety caps: refuses to deactivate everything if the Vagaro list is suspiciously
 * small (treats <3 providers as an API failure, not a real staff purge).
 */
export async function syncPublicStaff(
  db: Db,
  numericBusinessId: string
): Promise<PublicStaffStats> {
  const stats: PublicStaffStats = {
    fetched: 0,
    matched: 0,
    updated: 0,
    created: 0,
    deactivated: 0,
    unmatchedInDb: [],
    unmatchedInVagaro: [],
    errors: [],
  }

  const providers = await fetchPublicStaff(numericBusinessId)
  stats.fetched = providers.length

  if (providers.length === 0) {
    throw new Error('Vagaro public staff endpoint returned 0 providers — refusing to mirror an empty list')
  }
  if (providers.length < 3) {
    // Sanity check: don't trigger deactivations off a tiny response
    stats.errors.push(`Only ${providers.length} providers returned — skipping deactivation phase`)
  }

  // Load all existing team_members for matching
  const existing = await db
    .select({
      id: teamMembers.id,
      name: teamMembers.name,
      isActive: teamMembers.isActive,
      vagaroPublicProviderId: teamMembers.vagaroPublicProviderId,
    })
    .from(teamMembers)

  // Build lookup indexes
  const byProviderId = new Map<number, (typeof existing)[number]>()
  const byNameKey = new Map<string, (typeof existing)[number]>()
  for (const row of existing) {
    if (row.vagaroPublicProviderId != null) byProviderId.set(row.vagaroPublicProviderId, row)
    // Parse "First Last" out of the stored display name
    const parts = row.name.trim().split(/\s+/)
    const first = parts.shift() ?? ''
    const last = parts.join(' ')
    byNameKey.set(nameKey(first, last), row)
  }

  // Track which existing rows were touched this run (for deactivation step)
  const matchedExistingIds = new Set<string>()

  for (const p of providers) {
    try {
      const matchById = p.ServiceProviderID != null ? byProviderId.get(p.ServiceProviderID) : null
      const matchByName = matchById ?? byNameKey.get(nameKey(p.FirstName, p.LastName))

      const fullName = `${p.FirstName ?? ''} ${p.LastName ?? ''}`.trim()
      const photoUrl = originalPhotoUrl(p)
      const phone = (p.Cell || p.DayPhone || '').trim()
      const email = (p.EmailId || '').trim()
      const sortOrder = p.EmployeeSortOrder != null ? String(p.EmployeeSortOrder) : '0'

      if (matchByName) {
        matchedExistingIds.add(matchByName.id)
        await db
          .update(teamMembers)
          .set({
            vagaroPublicProviderId: p.ServiceProviderID,
            vagaroPhotoUrl: photoUrl,
            vagaroBio: p.BusinessSummary ?? null,
            displayOrder: sortOrder,
            // Re-activate if Vagaro is showing them again
            isActive: true,
            // Refresh contact data if Vagaro has it
            ...(phone ? { phone } : {}),
            ...(email ? { email } : {}),
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(teamMembers.id, matchByName.id))
        stats.matched++
        stats.updated++
      } else {
        // Auto-create
        if (!photoUrl) {
          stats.errors.push(`skipped create for ${fullName}: no photo URL`)
          continue
        }
        await db.insert(teamMembers).values({
          vagaroPublicProviderId: p.ServiceProviderID,
          vagaroPhotoUrl: photoUrl,
          vagaroBio: p.BusinessSummary ?? null,
          name: fullName || `Provider ${p.ServiceProviderID}`,
          phone: phone || '',
          email: email || null,
          role: 'Lash Artist', // sane default; can be edited manually after creation
          type: 'employee',
          bookingUrl: 'https://www.vagaro.com/lashpop32',
          usesLashpopBooking: true,
          imageUrl: photoUrl, // notNull — use vagaro photo as the seed local image
          specialties: [],
          displayOrder: sortOrder,
          isActive: true,
          lastSyncedAt: new Date(),
        })
        stats.created++
        stats.unmatchedInVagaro.push(fullName)
      }
    } catch (err) {
      stats.errors.push(
        `provider ${p.FirstName} ${p.LastName}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  // Deactivate any DB row that wasn't matched this run (only if we got a healthy fetch)
  if (providers.length >= 3) {
    for (const row of existing) {
      if (matchedExistingIds.has(row.id)) continue
      if (!row.isActive) continue
      try {
        await db
          .update(teamMembers)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(teamMembers.id, row.id))
        stats.deactivated++
        stats.unmatchedInDb.push(row.name)
      } catch (err) {
        stats.errors.push(`deactivate ${row.name}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  return stats
}

export async function syncAllTeamMembers(db: Db, client: VagaroClient): Promise<SyncStats> {
  const rows = await db
    .select({
      id: teamMembers.id,
      name: teamMembers.name,
      vagaroEmployeeId: teamMembers.vagaroEmployeeId,
    })
    .from(teamMembers)
    .where(isNotNull(teamMembers.vagaroEmployeeId))

  const total = rows.length
  let synced = 0
  let failed = 0
  let lastError: unknown = null

  for (const row of rows) {
    try {
      const employee = await client.getEmployee(row.vagaroEmployeeId!)
      if (employee) {
        await syncTeamMember(db, employee)
        synced++
      }
    } catch (err) {
      failed++
      lastError = err
      console.error(`team member sync failed: ${row.name}`, err instanceof Error ? err.message : err)
    }
  }

  if (total > 0 && synced === 0) {
    throw new Error(
      `All ${total} team member upserts failed — connection issue. Last: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    )
  }

  return { synced, failed, total }
}
