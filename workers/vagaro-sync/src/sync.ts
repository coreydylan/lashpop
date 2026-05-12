import { eq, isNotNull } from 'drizzle-orm'
import type { Db } from './db'
import { services, teamMembers } from './schema'
import type { VagaroClient } from './vagaro-client'

export interface SyncStats {
  synced: number
  failed: number
  total: number
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
