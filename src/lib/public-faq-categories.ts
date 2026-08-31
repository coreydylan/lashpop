export const PENDING_TINY_TATTOOS_FAQ_ID = 'pending-tiny-tattoos'

type PublicFaqCategory = {
  id: string
  name: string
  displayName: string
  displayOrder: number
  contentPending?: boolean
}

function labelKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export function withPendingTinyTattoosFaqCategory<
  T extends PublicFaqCategory,
>(categories: readonly T[]): Array<T | PublicFaqCategory> {
  if (categories.some((category) => labelKey(category.displayName || category.name) === 'tiny-tattoos')) {
    return [...categories]
  }

  const jewelryIndex = categories.findIndex((category) =>
    labelKey(category.displayName || category.name) === 'permanent-jewelry')
  const botoxIndex = categories.findIndex((category) =>
    labelKey(category.displayName || category.name) === 'botox')

  const insertionIndex = jewelryIndex >= 0
    ? jewelryIndex + 1
    : botoxIndex >= 0
      ? botoxIndex
      : categories.length
  const beforeOrder = jewelryIndex >= 0
    ? categories[jewelryIndex].displayOrder
    : insertionIndex > 0
      ? categories[insertionIndex - 1].displayOrder
      : 0
  const afterOrder = botoxIndex >= 0
    ? categories[botoxIndex].displayOrder
    : beforeOrder + 2

  const pendingCategory: PublicFaqCategory = {
    id: PENDING_TINY_TATTOOS_FAQ_ID,
    name: 'tiny-tattoos',
    displayName: 'Tiny Tattoos',
    displayOrder: beforeOrder + ((afterOrder - beforeOrder) / 2),
    contentPending: true,
  }

  return [
    ...categories.slice(0, insertionIndex),
    pendingCategory,
    ...categories.slice(insertionIndex),
  ]
}
