import type { Db } from './db'
import { teamMembers } from './schema'

/**
 * Post-sync roster reconciliation.
 *
 * The roster has three write paths (this worker, the admin panel, the Vagaro
 * employee webhook) and, until now, nothing that compared them afterwards.
 * That is how a published stylist could sit hidden for months: every layer was
 * internally consistent and no one was looking across them.
 *
 * classifyRoster is pure so it can be tested without a database.
 */

export interface ReconcileRow {
  id: string
  name: string
  isActive: boolean
  showOnWebsite: boolean
  showOnWebsiteReason: string | null
  vagaroPublicProviderId: number | null
  usesLashpopBooking: boolean
}

export interface ReconcileProvider {
  providerId: number | null
  name: string
}

export interface RosterMember {
  id: string
  name: string
  reason?: string | null
}

export interface RosterReconciliation {
  generatedAt: string
  counts: {
    activePublished: number
    activeHiddenAcknowledged: number
    activeHiddenUnexplained: number
    inactivePublished: number
    inactiveHidden: number
    inVagaroMissingFromDb: number
  }
  activePublished: RosterMember[]
  activeHiddenAcknowledged: RosterMember[]
  /** Active in Vagaro, hidden on the site, with no recorded reason. The bug class from August 2026. */
  activeHiddenUnexplained: RosterMember[]
  /** Inactive rows still carrying show_on_website = 1: reactivation would publish them instantly. */
  inactivePublished: RosterMember[]
  /** Providers in the Vagaro response with no row here. */
  inVagaroMissingFromDb: string[]
  /** Rows sharing a name key, which is what makes the sync's name fallback ambiguous. */
  duplicateNames: { nameKey: string; ids: string[] }[]
  alerts: string[]
  warnings: string[]
  ok: boolean
}

function nameKeyOf(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function toMember(row: ReconcileRow): RosterMember {
  return { id: row.id, name: row.name, reason: row.showOnWebsiteReason }
}

export function classifyRoster(
  rows: ReconcileRow[],
  providers: ReconcileProvider[],
): RosterReconciliation {
  const activePublished: RosterMember[] = []
  const activeHiddenAcknowledged: RosterMember[] = []
  const activeHiddenUnexplained: RosterMember[] = []
  const inactivePublished: RosterMember[] = []
  let inactiveHidden = 0

  for (const row of rows) {
    if (row.isActive && row.showOnWebsite) {
      activePublished.push(toMember(row))
    } else if (row.isActive && !row.showOnWebsite) {
      const reason = row.showOnWebsiteReason?.trim()
      if (reason) activeHiddenAcknowledged.push(toMember(row))
      else activeHiddenUnexplained.push(toMember(row))
    } else if (!row.isActive && row.showOnWebsite) {
      inactivePublished.push(toMember(row))
    } else {
      inactiveHidden++
    }
  }

  // Providers Vagaro returned that we hold no row for. Match the way the sync
  // does: provider id first, then the name key.
  const knownProviderIds = new Set(
    rows.map(row => row.vagaroPublicProviderId).filter((id): id is number => id != null),
  )
  const knownNameKeys = new Set(rows.map(row => nameKeyOf(row.name)))
  const inVagaroMissingFromDb = providers
    .filter(provider => {
      if (provider.providerId != null && knownProviderIds.has(provider.providerId)) return false
      return !knownNameKeys.has(nameKeyOf(provider.name))
    })
    .map(provider => provider.name)

  const byNameKey = new Map<string, string[]>()
  for (const row of rows) {
    const key = nameKeyOf(row.name)
    byNameKey.set(key, [...(byNameKey.get(key) ?? []), row.id])
  }
  const duplicateNames = [...byNameKey.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([nameKey, ids]) => ({ nameKey, ids }))

  const alerts: string[] = []
  for (const member of activeHiddenUnexplained) {
    alerts.push(`Active Vagaro provider hidden with no recorded reason: ${member.name} (${member.id})`)
  }
  for (const member of inactivePublished) {
    alerts.push(
      `Inactive row still flagged for publication: ${member.name} (${member.id}) — reactivation would publish it immediately`,
    )
  }
  for (const name of inVagaroMissingFromDb) {
    alerts.push(`Provider in Vagaro with no team_members row: ${name}`)
  }

  const warnings: string[] = []
  for (const duplicate of duplicateNames) {
    warnings.push(
      `Duplicate name "${duplicate.nameKey}" across ${duplicate.ids.length} rows (${duplicate.ids.join(', ')}) — the sync's name fallback cannot resolve it`,
    )
  }

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      activePublished: activePublished.length,
      activeHiddenAcknowledged: activeHiddenAcknowledged.length,
      activeHiddenUnexplained: activeHiddenUnexplained.length,
      inactivePublished: inactivePublished.length,
      inactiveHidden,
      inVagaroMissingFromDb: inVagaroMissingFromDb.length,
    },
    activePublished,
    activeHiddenAcknowledged,
    activeHiddenUnexplained,
    inactivePublished,
    inVagaroMissingFromDb,
    duplicateNames,
    alerts,
    warnings,
    ok: alerts.length === 0,
  }
}

// --- database-backed entry point ---


export async function reconcileRoster(
  db: Db,
  providers: ReconcileProvider[],
): Promise<RosterReconciliation> {
  const rows = await db
    .select({
      id: teamMembers.id,
      name: teamMembers.name,
      isActive: teamMembers.isActive,
      showOnWebsite: teamMembers.showOnWebsite,
      showOnWebsiteReason: teamMembers.showOnWebsiteReason,
      vagaroPublicProviderId: teamMembers.vagaroPublicProviderId,
      usesLashpopBooking: teamMembers.usesLashpopBooking,
    })
    .from(teamMembers)

  return classifyRoster(rows, providers)
}
