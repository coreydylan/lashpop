import { and, eq, isNotNull, sql } from 'drizzle-orm'
import type { Db } from './db'
import { services, teamMembers, teamMemberServicesVagaro } from './schema'
import type { VagaroClient } from './vagaro-client'
import { fetchPublicStaff, nameKey, originalPhotoUrl } from './public-staff'
import {
  fetchPublicServicesForProvider,
  fetchPublicServicesFull,
  serviceTitleKey,
  type PublicServiceRecord,
} from './public-services'

/**
 * Map Vagaro's free-text mainCategory string to a `service_categories.slug`.
 * The Service Browser filters by slug, so an unrecognised Vagaro category
 * silently disappears from the UI until this map is updated. Keep this
 * conservative — when in doubt, fall through to null so the row stays
 * unlinked rather than mapping to the wrong category.
 */
const VAGARO_CATEGORY_TO_SLUG: Record<string, string> = {
  // Lashes
  'lash services': 'lashes',
  'eyelash extension services': 'lashes',
  'lashes': 'lashes',
  // Brows
  'brow services': 'brows',
  'brows': 'brows',
  // Skincare / facials
  'facials & skin care': 'facials',
  'facials and skin care': 'facials',
  'skin care and facial services': 'facials',
  'skincare': 'facials',
  'facials': 'facials',
  // Waxing
  'waxing': 'waxing',
  // Permanent makeup
  'permanent makeup': 'permanent-makeup',
  // Permanent jewelry / specialty
  'permanent jewelry': 'specialty',
  'specialty': 'specialty',
  // Lashpop Pro Training — was falling through to NULL FK because the category
  // title from the composite ("Lashpop Pro Training") wasn't mapped. Without a
  // mapping the row stuck on whatever categoryId the previous sync wrote (which
  // happened to be `specialty` from an earlier mis-classification), so the
  // training course showed up under Permanent Jewelry on the booking flow.
  'lashpop pro training': 'lashpop-pro-training',
  // Injectables / botox
  'injectables': 'injectables',
  'botox': 'injectables',
  // Bundles
  'bundles': 'bundles',
  // Nails
  'nails': 'nails',
}

let categoryIdBySlugCache: Map<string, string> | null = null

async function resolveCategoryId(db: Db, parentTitle: string | null | undefined): Promise<string | null> {
  if (!parentTitle) return null
  const slug = VAGARO_CATEGORY_TO_SLUG[parentTitle.trim().toLowerCase()]
  if (!slug) return null

  if (!categoryIdBySlugCache) {
    const rows = await db.execute<{ id: string; slug: string }>(
      sql`SELECT id, slug FROM service_categories`
    )
    categoryIdBySlugCache = new Map(rows.map(r => [r.slug, r.id]))
  }
  return categoryIdBySlugCache.get(slug) ?? null
}

export interface SyncStats {
  synced: number
  failed: number
  total: number
  /** Services deactivated this run because Vagaro no longer offers them. */
  deactivated?: number
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

/**
 * Upsert a single service row.
 *
 * Sources:
 *  - `publicRecord`: REQUIRED. Comes from the public composite endpoint and
 *    is the canonical source of truth for the service list (the v2 API caps
 *    at 10 rows so we can't drive the sync off it).
 *  - `v2Service`: OPTIONAL enrichment from /api/v2/services. Only the first
 *    ~10 services in each sync run will have this. It's the only source for
 *    `priceStarting`, `durationMinutes`, and `vagaroDescription`, so when it's
 *    missing we DO NOT touch those fields on existing rows (preserve whatever
 *    the previous sync wrote).
 */
async function syncService(
  db: Db,
  publicRecord: PublicServiceRecord,
  v2Service: any | null,
  photosByTitle: Map<string, string>,
  photosByServiceId: Map<string, string>,
  photosAvailable: boolean,
  // Position in the composite walk — used as `display_order` so the frontend's
  // sort by displayOrder reflects Vagaro's own ordering on the booking page.
  positionalOrder: number,
  // Every Vagaro serviceId present in THIS sync run. Used to stop the slug/name
  // fallback below from merging two genuinely-distinct services that happen to
  // share a title (see the guard comment in the lookup block).
  runServiceIds: Set<string>
): Promise<string | null> {
  const serviceId = publicRecord.serviceId
  // Prefer v2's title when available (it's the authenticated, canonical name);
  // fall back to the public record's title otherwise.
  const title = (v2Service?.serviceTitle || v2Service?.name || publicRecord.serviceTitle || '').trim()
  const parentTitle =
    v2Service?.parentServiceTitle || v2Service?.category || publicRecord.parentServiceTitle || null
  const parentServiceId = v2Service?.parentServiceId ?? publicRecord.parentServiceId ?? null

  // Enrichment-only fields. Leave them undefined when v2 didn't return this
  // service so the update keeps whatever the DB already has.
  let vagaroDescription: string | undefined
  let priceStartingCents: number | undefined
  let durationMinutes: number | undefined
  if (v2Service) {
    vagaroDescription = v2Service.serviceDescription || v2Service.description || ''
    const performers = v2Service.servicePerformedBy || []
    const prices: number[] = performers.map((p: any) => p.price || p.priceWithTax).filter(Boolean)
    if (prices.length > 0) priceStartingCents = Math.round(Math.min(...prices) * 100)
    const durations: number[] = performers.map((p: any) => p.durationMinutes).filter(Boolean)
    if (durations.length > 0) {
      durationMinutes = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    }
  }

  const slug = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Photo lookup: primary by Vagaro serviceId (stable identifier), fallback to
  // title (older sync mapped by string match). When the public fetch failed
  // entirely (photosAvailable=false) we skip writing photo fields so we don't
  // clobber existing values with nulls.
  const photoById = photosByServiceId.get(serviceId) ?? null
  const photoByTitle = photosByTitle.get(serviceTitleKey(title)) ?? null
  const photoUrl = photoById ?? photoByTitle
  if (!photoById && photoByTitle) {
    console.log(`photo match for "${title}" was by title only, not serviceId — verify mapping`)
  }

  // FK resolution: turn Vagaro's free-text category into a service_categories.id
  // so the Service Browser actually sees the row. New categories that aren't
  // mapped fall through to NULL (row still syncs, just no UI surface).
  const categoryId = await resolveCategoryId(db, parentTitle)
  if (!categoryId && parentTitle) {
    console.log(`unmapped Vagaro category "${parentTitle}" — service "${title}" will sync without category FK`)
  }

  // Only persist `vagaro_data` when v2 returned the service. The previous
  // fallback to `publicRecord.raw` was actively harmful: the composite record
  // doesn't include `servicePerformedBy`, so writing it overwrote any v2-era
  // performer info with a record that has no performer info — which is how
  // we lost stylist→service tag wiring for the 80+ services v2 didn't enrich
  // on a given sync. Performer mapping is now sourced from the per-stylist
  // composite call (see syncStylistServices), so `vagaro_data` no longer
  // needs to carry it for non-v2 services.
  const vagaroDataPatch = v2Service ? { vagaroData: v2Service } : {}

  // ID format mismatch: composite returns a NUMERIC ServiceID, v2 returns a
  // base64-encoded "kz7n9RCCVUyfkLbj~6DTPw==" string. All DB rows synced
  // before this rewrite have the v2-format ID stored in `vagaro_service_id`,
  // so a lookup by composite-format ID would miss every existing service and
  // INSERT would then fail on the `slug` unique constraint (the 73 failures
  // observed on the first composite-driven sync). Fall back to slug-based
  // lookup; when we find a match that way, also migrate the row's
  // vagaroServiceId to whichever format the v2 enrichment provided (if any)
  // so future runs keep bridging cleanly.
  //
  // 3rd fallback: case-insensitive NAME match. Legacy rows sometimes have
  // hand-edited slugs (e.g. "volume" instead of the auto-generated
  // "volume-full-set") so the slug fallback misses them and we end up
  // double-inserting. Matching by name catches those before we INSERT.
  // All three lookups filter to is_active=true. Inactive rows are tombstones
  // from the dedupe pass — we don't want syncs to revive them or write updates
  // into the dead row instead of the live one. If every match is inactive, we
  // fall through to INSERT, which is the correct behavior (Vagaro has a
  // service we don't have a live row for).
  let existing = await db
    .select()
    .from(services)
    .where(and(eq(services.vagaroServiceId, serviceId), eq(services.isActive, true)))
    .limit(1)
  const matchedByExactId = existing.length > 0
  if (existing.length === 0 && slug) {
    existing = await db
      .select()
      .from(services)
      .where(and(eq(services.slug, slug), eq(services.isActive, true)))
      .limit(1)
  }
  if (existing.length === 0 && title) {
    existing = await db
      .select()
      .from(services)
      .where(and(sql`lower(${services.name}) = lower(${title})`, eq(services.isActive, true)))
      .limit(1)
  }

  // Guard against MERGING two distinct, both-live Vagaro services that share a
  // title. The slug/name fallbacks above are meant to bridge id-format
  // migrations (composite numeric id vs v2 base64 id — the same logical service
  // under a different id representation, where the old id is NOT in this run)
  // and legacy hand-edited slugs. But e.g. "Brow Shaping (Wax + Tweeze + Trim)"
  // exists as TWO separate Vagaro services — one under Brows, one under Waxing —
  // with identical titles → identical slugs. Without this guard the second one
  // matches the first by slug/name and UPDATEs it instead of inserting, so the
  // service only ever appears in one category (and the single row flip-flops
  // categories every sync depending on composite order). If a fallback matched
  // a row whose vagaro_service_id is a DIFFERENT id that is itself live in this
  // run, it belongs to another service — discard the match and INSERT instead.
  if (!matchedByExactId && existing.length > 0) {
    const candidateVagaroId = existing[0].vagaroServiceId
    if (candidateVagaroId && candidateVagaroId !== serviceId && runServiceIds.has(candidateVagaroId)) {
      existing = []
    }
  }

  const v2ServiceIdString = v2Service?.serviceId ? String(v2Service.serviceId) : null

  if (existing.length > 0) {
    const currentVagaroId = existing[0].vagaroServiceId
    // Prefer v2's id when we have it (long-lived format used everywhere else
    // in the codebase). Only overwrite an existing id if it differs from what
    // we'd write — avoids no-op churn on rows already in the right shape.
    const preferredVagaroId = v2ServiceIdString ?? serviceId
    const migrateVagaroId = currentVagaroId !== preferredVagaroId
      ? { vagaroServiceId: preferredVagaroId }
      : {}
    await db
      .update(services)
      .set({
        name: title,
        ...migrateVagaroId,
        // NEVER write the local `description` column on update — admin owns it.
        // vagaroDescription / duration / price only come from v2 — leave them
        // alone when the v2 response didn't include this service.
        ...(vagaroDescription !== undefined ? { vagaroDescription } : {}),
        ...(durationMinutes !== undefined ? { durationMinutes } : {}),
        ...(priceStartingCents !== undefined ? { priceStarting: priceStartingCents } : {}),
        vagaroParentServiceId: parentServiceId,
        ...vagaroDataPatch,
        ...(photosAvailable ? { vagaroImageUrl: photoUrl } : {}),
        ...(categoryId ? { categoryId } : {}),
        // Mirror Vagaro's own order on the booking page so the frontend's
        // `ORDER BY display_order` shows services in the same order Vagaro does.
        displayOrder: positionalOrder,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(services.id, existing[0].id))
    return existing[0].id
  } else {
    // Insert path. duration_minutes and price_starting are NOT NULL in the
    // schema so we have to provide *something* when v2 didn't enrich. Use
    // sane sentinels (60 min / $0) that admins can correct in the UI.
    const insertDuration = durationMinutes ?? 60
    const insertPriceCents = priceStartingCents ?? 0

    // `slug` has a UNIQUE constraint. Two distinct services that share a title
    // (the identical-title case guarded above) generate the same base slug, so
    // the second INSERT would throw on the constraint. When the base slug is
    // already owned by another row, suffix with the Vagaro serviceId so both
    // can coexist. Deterministic (id, not a counter) so re-syncs never churn it.
    let insertSlug = slug
    if (slug) {
      const slugOwner = await db
        .select({ id: services.id })
        .from(services)
        .where(eq(services.slug, slug))
        .limit(1)
      if (slugOwner.length > 0) insertSlug = `${slug}-${serviceId}`
    }

    const inserted = await db.insert(services).values({
      vagaroServiceId: serviceId,
      vagaroParentServiceId: parentServiceId,
      ...vagaroDataPatch,
      vagaroImageUrl: photoUrl,
      categoryId,
      name: title,
      slug: insertSlug,
      subtitle: parentTitle,
      // Seed `description` with the Vagaro copy at insert time so freshly-
      // synced services aren't blank on the public site before any admin
      // edit. After insert, only `vagaroDescription` ever updates.
      description: vagaroDescription || null,
      vagaroDescription: vagaroDescription ?? '',
      durationMinutes: insertDuration,
      priceStarting: insertPriceCents,
      // Position in the composite walk — keeps insertion order aligned with
      // Vagaro's booking-page order on first sync.
      displayOrder: positionalOrder,
      isActive: true,
      mainCategory: parentTitle || 'Other Services',
      lastSyncedAt: new Date(),
    }).returning({ id: services.id })
    return inserted[0]?.id ?? null
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

export async function syncAllServices(
  db: Db,
  client: VagaroClient,
  numericBusinessId: string
): Promise<SyncStats> {
  // PUBLIC COMPOSITE is the canonical source of the service LIST. Vagaro's
  // authenticated v2 /api/v2/services endpoint caps at 10 rows regardless of
  // pageSize/pageNumber (verified by hand), so driving the sync off v2 means
  // 85+ services never get revisited — that's why brow/nanobrow/microblading
  // photos went stale for months.
  const publicPayload = await fetchPublicServicesFull(numericBusinessId)
  const photosByTitle = publicPayload.photosByTitle
  const photosByServiceId = publicPayload.photosByServiceId
  const photosAvailable = photosByTitle.size > 0 || photosByServiceId.size > 0

  // Filter out soft-deleted rows — Vagaro's composite returns them with a
  // flag so we mirror that intent rather than overwriting active=true on
  // deleted services. We don't toggle existing rows to inactive here
  // (admins may want to keep them visible during transitions); we just
  // skip syncing them on this pass.
  const publicRecords = publicPayload.records.filter(r => !r.isSoftDeleted)

  console.log(
    `public composite: ${publicPayload.records.length} services` +
    ` (${publicRecords.length} non-deleted, ${photosByTitle.size} photos by title,` +
    ` ${photosByServiceId.size} photos by serviceId)`
  )

  // v2 enrichment: returns ~10 rows with full detail (price, duration,
  // description, per-staff performer data). Build a lookup by serviceId so
  // we can attach the rich data to whichever ~10 public records overlap.
  // A failure here is non-fatal — we still sync the full list, just without
  // updates to price/duration/description on this pass.
  const v2ById = new Map<string, any>()
  try {
    const v2List = await client.getServices()
    if (!Array.isArray(v2List)) {
      throw new Error(`Invalid Vagaro getServices() response: ${JSON.stringify(v2List).slice(0, 200)}`)
    }
    for (const s of v2List) {
      const id = s?.serviceId ?? s?.id
      if (id != null) v2ById.set(String(id), s)
    }
    console.log(`v2 enrichment: ${v2ById.size} services with full detail`)
  } catch (err) {
    console.error(
      'v2 getServices() enrichment failed — proceeding with public-only sync',
      err instanceof Error ? err.message : err
    )
  }

  const total = publicRecords.length
  let synced = 0
  let failed = 0
  let lastError: unknown = null
  // Local service IDs touched (inserted or updated) this run. Used by the
  // reconciliation pass below to deactivate rows Vagaro no longer offers.
  const touchedServiceIds = new Set<string>()

  // Every Vagaro serviceId in this run — lets syncService tell "same service,
  // different id format" (safe to merge) apart from "different service, same
  // title" (must NOT merge — see the guard inside syncService).
  const runServiceIds = new Set(publicRecords.map(r => r.serviceId))

  // positionalOrder mirrors Vagaro's booking-page order — the composite walks
  // categories in the order they're displayed and services within them in the
  // order Vagaro arranged them. Writing the loop index into display_order is
  // the cleanest way to keep the frontend's `ORDER BY display_order` aligned
  // with what customers see in the Vagaro UI.
  for (let i = 0; i < publicRecords.length; i++) {
    const rec = publicRecords[i]
    try {
      const v2Match = v2ById.get(rec.serviceId) ?? null
      const touchedId = await syncService(db, rec, v2Match, photosByTitle, photosByServiceId, photosAvailable, i, runServiceIds)
      if (touchedId) touchedServiceIds.add(touchedId)
      synced++
    } catch (err) {
      failed++
      lastError = err
      console.error(`service sync failed: ${rec.serviceTitle || rec.serviceId}`, err)
    }
  }

  if (total > 0 && synced === 0) {
    throw new Error(
      `All ${total} service upserts failed — connection issue. Last: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    )
  }

  // ── Reconciliation: deactivate services Vagaro no longer offers ──
  // Without this, services removed/renamed in Vagaro lingered as active rows
  // forever (the website showed 26 "facials" when Vagaro only had 16 — the 10
  // generic facials replaced by the Hydrafacial line were never tombstoned).
  // We deactivate any ACTIVE, Vagaro-sourced service (vagaro_service_id set)
  // that this run's composite didn't touch. Heavily guarded so a transient
  // Vagaro error can't wipe the catalog:
  //   • only when the composite returned a healthy list (MIN_HEALTHY_TOTAL)
  //   • only when zero services failed to sync (a failed row is in Vagaro but
  //     absent from touchedServiceIds — we must not mistake it for "removed")
  //   • capped per run, both absolute and proportional, else we treat the
  //     mismatch as an anomaly and skip (mirrors the staff-sync safety cap)
  // Manually-created services (vagaro_service_id IS NULL, e.g. "Botox
  // Treatment") are never eligible — admin owns those.
  const MIN_HEALTHY_TOTAL = 50
  const MAX_DEACTIVATE_PER_RUN = 25
  const MAX_DEACTIVATE_FRACTION = 0.3
  let deactivated = 0
  if (total >= MIN_HEALTHY_TOTAL && failed === 0) {
    const activeVagaroRows = await db
      .select({ id: services.id, name: services.name })
      .from(services)
      .where(and(eq(services.isActive, true), isNotNull(services.vagaroServiceId)))
    const stale = activeVagaroRows.filter(r => !touchedServiceIds.has(r.id))
    const cap = Math.min(
      MAX_DEACTIVATE_PER_RUN,
      Math.floor(activeVagaroRows.length * MAX_DEACTIVATE_FRACTION)
    )
    if (stale.length === 0) {
      // nothing to do
    } else if (stale.length > cap) {
      console.warn(
        `reconciliation: ${stale.length} active Vagaro services were absent from this run's ` +
        `composite (cap ${cap}) — treating as an anomaly and skipping deactivation. ` +
        `Names: ${stale.map(s => s.name).join(', ')}`
      )
    } else {
      for (const row of stale) {
        await db
          .update(services)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(services.id, row.id))
        deactivated++
      }
      console.log(
        `reconciliation: deactivated ${deactivated} service(s) absent from Vagaro — ` +
        stale.map(s => s.name).join(', ')
      )
    }
  } else if (total > 0) {
    console.log(
      `reconciliation skipped (total=${total} < ${MIN_HEALTHY_TOTAL} or failed=${failed} > 0) — ` +
      `not safe to deactivate this run`
    )
  }

  return { synced, failed, total, deactivated }
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
      usesLashpopBooking: teamMembers.usesLashpopBooking,
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
        // CRITICAL: dual-mode gate. usesLashpopBooking=false means the stylist
        // is external-booking — they belong to their own business, Vagaro
        // doesn't represent their actual data, and admin entry is the sole
        // source of truth for every field. Skip ALL writes for these rows
        // (photo, bio, contact, order, active flag — all of it). We still
        // mark them as "matched" so the deactivation phase below doesn't
        // tombstone them just because Vagaro's staff endpoint happens to
        // list them.
        if (matchByName.usesLashpopBooking === false) {
          matchedExistingIds.add(matchByName.id)
          stats.matched++
          continue
        }

        matchedExistingIds.add(matchByName.id)
        // Normalize empty bio strings to null so the frontend's vagaroBio || bio
        // fallback works cleanly (empty string is technically falsy but ugly to store).
        const cleanBio = p.BusinessSummary?.trim() || null
        await db
          .update(teamMembers)
          .set({
            vagaroPublicProviderId: p.ServiceProviderID,
            // photoUrl is null when Vagaro returns a generic silhouette placeholder
            // (see originalPhotoUrl). Writing null lets the local imageUrl win on the
            // frontend until a real photo is uploaded in Vagaro.
            vagaroPhotoUrl: photoUrl,
            vagaroBio: cleanBio,
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
        // Auto-create. If Vagaro hasn't uploaded a real photo yet (placeholder
        // was filtered to null), still create the row using the local branded
        // "photo coming soon" placeholder. The frontend's vagaroPhotoUrl ||
        // imageUrl fallback then shows the placeholder until a real photo
        // appears in Vagaro.
        // Auto-created rows are always usesLashpopBooking=true — they came
        // from the Vagaro staff endpoint, so by definition they're on Vagaro.
        const PLACEHOLDER = '/placeholder-team.svg'
        await db.insert(teamMembers).values({
          vagaroPublicProviderId: p.ServiceProviderID,
          vagaroPhotoUrl: photoUrl, // null when only a Vagaro placeholder is available
          vagaroBio: p.BusinessSummary?.trim() || null,
          name: fullName || `Provider ${p.ServiceProviderID}`,
          phone: phone || '',
          email: email || null,
          role: 'Lash Artist', // sane default; can be edited manually after creation
          type: 'employee',
          bookingUrl: 'https://www.vagaro.com/lashpop32',
          usesLashpopBooking: true,
          imageUrl: photoUrl ?? PLACEHOLDER, // notNull — seed local with vagaro photo or branded placeholder
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
      // Dual-mode gate (belt-and-suspenders): external-booking stylists must
      // never be tombstoned by the Vagaro sync even if Vagaro doesn't list
      // them at all. Admin owns their isActive flag.
      if (row.usesLashpopBooking === false) continue
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
  // Dual-mode gate: external-booking rows should never be touched by Vagaro
  // sync. In practice they don't carry a vagaroEmployeeId, so the IS NOT NULL
  // filter already excludes them — the explicit equality below keeps the
  // intent obvious and survives future schema drift.
  const rows = await db
    .select({
      id: teamMembers.id,
      name: teamMembers.name,
      vagaroEmployeeId: teamMembers.vagaroEmployeeId,
    })
    .from(teamMembers)
    .where(and(isNotNull(teamMembers.vagaroEmployeeId), eq(teamMembers.usesLashpopBooking, true)))

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

export interface StylistServicesStats {
  stylists: number
  succeeded: number
  failed: number
  mappingsWritten: number
  unmatchedVagaroServiceIds: string[]
  errors: string[]
}

/**
 * Walk every active Vagaro-mode stylist and populate `team_member_services_vagaro`
 * with the services that stylist performs, sourced from the per-stylist
 * composite endpoint (one HTTP call per stylist). Truncate-and-replace per
 * stylist so stale mappings can never linger past a single sync cycle.
 *
 * Only stylists with usesLashpopBooking=true AND vagaroPublicProviderId set
 * are walked. External-booking stylists are deliberately excluded — their
 * service tags come from team_members.external_service_categories.
 *
 * Must run AFTER syncAllServices (so services rows exist to FK to) and
 * AFTER syncPublicStaff (so providerIDs are present on the team_members rows).
 */
export async function syncStylistServices(
  db: Db,
  numericBusinessId: string
): Promise<StylistServicesStats> {
  const stats: StylistServicesStats = {
    stylists: 0,
    succeeded: 0,
    failed: 0,
    mappingsWritten: 0,
    unmatchedVagaroServiceIds: [],
    errors: [],
  }

  const stylists = await db
    .select({
      id: teamMembers.id,
      name: teamMembers.name,
      providerId: teamMembers.vagaroPublicProviderId,
    })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.isActive, true),
        eq(teamMembers.usesLashpopBooking, true),
        isNotNull(teamMembers.vagaroPublicProviderId)
      )
    )

  stats.stylists = stylists.length
  if (stylists.length === 0) return stats

  // Build a single map of Vagaro numeric ServiceID → local services.id so
  // each per-stylist composite walk turns into in-memory lookups instead of
  // 13+ DB round trips per stylist.
  const serviceRows = await db
    .select({
      id: services.id,
      vagaroServiceId: services.vagaroServiceId,
    })
    .from(services)
    .where(eq(services.isActive, true))
  const serviceIdByVagaroId = new Map<string, string>()
  for (const row of serviceRows) {
    if (row.vagaroServiceId) serviceIdByVagaroId.set(row.vagaroServiceId, row.id)
  }

  const unmatchedAcrossRun = new Set<string>()

  for (const stylist of stylists) {
    try {
      const records = await fetchPublicServicesForProvider(numericBusinessId, stylist.providerId!)

      // Truncate-then-insert per stylist inside a transaction so the table never
      // has a partial view during the swap. If the insert phase throws after the
      // delete commits, the cron retry covers it on the next pass.
      const inserts: Array<{
        teamMemberId: string
        serviceId: string
        vagaroParentTitle: string | null
      }> = []
      for (const rec of records) {
        const localServiceId = serviceIdByVagaroId.get(rec.serviceId)
        if (!localServiceId) {
          unmatchedAcrossRun.add(rec.serviceId)
          continue
        }
        inserts.push({
          teamMemberId: stylist.id,
          serviceId: localServiceId,
          vagaroParentTitle: rec.vagaroCategoryTitle,
        })
      }

      await db.transaction(async (tx) => {
        await tx
          .delete(teamMemberServicesVagaro)
          .where(eq(teamMemberServicesVagaro.teamMemberId, stylist.id))
        if (inserts.length > 0) {
          await tx.insert(teamMemberServicesVagaro).values(inserts)
        }
      })

      stats.succeeded++
      stats.mappingsWritten += inserts.length
      console.log(
        `stylist services: ${stylist.name} (#${stylist.providerId}) → ${inserts.length} services` +
        (records.length !== inserts.length ? ` (${records.length - inserts.length} unmatched)` : '')
      )
    } catch (err) {
      stats.failed++
      const msg = err instanceof Error ? err.message : String(err)
      stats.errors.push(`${stylist.name}: ${msg}`)
      console.error(`stylist services sync failed for ${stylist.name}:`, err)
    }
  }

  stats.unmatchedVagaroServiceIds = Array.from(unmatchedAcrossRun)
  return stats
}
