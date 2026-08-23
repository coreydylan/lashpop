/**
 * Shared payload contract for the admin team publication + order save.
 *
 * The admin UI builds the payload with `buildTeamPresentationUpdates` and
 * `PUT /api/admin/website/team` reads it with `parseTeamPresentationUpdates`.
 * Both sides import this module on purpose: the UI used to send
 * `displayOrder` as a string while the route required an integer, which made
 * every Save Changes return 400. One module, one shape, no drift.
 */

export interface TeamPresentationUpdate {
  id: string
  showOnWebsite: boolean
  displayOrder: number
}

export interface TeamPresentationSource {
  id: string
  showOnWebsite: boolean
}

/** Build the save payload from the admin list, in its current display order. */
export function buildTeamPresentationUpdates(
  members: readonly TeamPresentationSource[]
): TeamPresentationUpdate[] {
  return members.map((member, index) => ({
    id: member.id,
    showOnWebsite: member.showOnWebsite,
    displayOrder: index,
  }))
}

export type ParsedTeamPresentation =
  | { ok: true; updates: TeamPresentationUpdate[] }
  | { ok: false; error: string }

/**
 * Validate the whole payload before anything is written. Callers must not
 * apply a partial batch: either every update is valid or the request fails.
 */
export function parseTeamPresentationUpdates(body: unknown): ParsedTeamPresentation {
  if (typeof body !== 'object' || body === null || !('updates' in body)) {
    return { ok: false, error: 'Request body must be an object with an "updates" array' }
  }

  const { updates } = body as { updates: unknown }
  if (!Array.isArray(updates)) {
    return { ok: false, error: 'Request body must be an object with an "updates" array' }
  }

  const parsed: TeamPresentationUpdate[] = []
  const seen = new Set<string>()

  for (let index = 0; index < updates.length; index++) {
    const update = updates[index] as Record<string, unknown> | null
    const where = `updates[${index}]`

    if (typeof update !== 'object' || update === null) {
      return { ok: false, error: `${where} must be an object` }
    }
    if (typeof update.id !== 'string' || update.id.trim() === '') {
      return { ok: false, error: `${where}.id must be a non-empty string` }
    }
    if (seen.has(update.id)) {
      return { ok: false, error: `${where}.id is a duplicate of an earlier update (${update.id})` }
    }
    if (typeof update.showOnWebsite !== 'boolean') {
      return { ok: false, error: `${where}.showOnWebsite must be a boolean` }
    }
    if (
      typeof update.displayOrder !== 'number' ||
      !Number.isInteger(update.displayOrder) ||
      update.displayOrder < 0
    ) {
      return {
        ok: false,
        error: `${where}.displayOrder must be a non-negative integer (received ${JSON.stringify(update.displayOrder)})`,
      }
    }

    seen.add(update.id)
    parsed.push({
      id: update.id,
      showOnWebsite: update.showOnWebsite,
      displayOrder: update.displayOrder,
    })
  }

  return { ok: true, updates: parsed }
}
