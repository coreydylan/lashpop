export interface CategoryOrderSource {
  websiteId: string
  sourceOrder: number
  active: boolean
}

/**
 * Assign effective booking positions while preserving local-only anchor slots.
 * Multiple source rows may intentionally map to one website category.
 */
export function computeEffectiveCategoryOrder(
  sources: CategoryOrderSource[],
  reservedOrders: Set<number>,
): Map<string, number> {
  const orderedIds: string[] = []
  const seen = new Set<string>()
  for (const source of sources.filter(item => item.active).sort((a, b) => a.sourceOrder - b.sourceOrder)) {
    if (seen.has(source.websiteId)) continue
    seen.add(source.websiteId)
    orderedIds.push(source.websiteId)
  }

  const result = new Map<string, number>()
  let position = 1
  for (const websiteId of orderedIds) {
    while (reservedOrders.has(position)) position++
    result.set(websiteId, position)
    position++
  }
  return result
}
