const TINY_TATTOO_CATEGORY_SLUG = 'fine-line-tattoos'

const SUBTITLE_HIDDEN_SERVICES = new Set([
  'classic fill',
  'classic mini fill',
  'hybrid fill',
  'hybrid mini fill',
  'wet/angel fill',
  'wet/angel mini fill',
])

function normalized(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

/** Keep Vagaro/database identity stable while presenting the approved public label. */
export function publicServiceCategoryLabel(
  categorySlug: string | null | undefined,
  label: string,
): string {
  const isTinyTattoos = categorySlug === TINY_TATTOO_CATEGORY_SLUG
    || normalized(label) === 'fine line tattoos'

  if (!isTinyTattoos) return label
  return label === label.toUpperCase() ? 'TINY TATTOOS' : 'Tiny Tattoos'
}

export function publicTeamServiceCategoryLabel(label: string): string {
  return publicServiceCategoryLabel(undefined, label)
}

/** Client-approved fill cards intentionally omit the secondary pink descriptor. */
export function publicServiceSubtitle(
  serviceName: string,
  subtitle: string | null | undefined,
): string | null {
  if (SUBTITLE_HIDDEN_SERVICES.has(normalized(serviceName))) return null
  return subtitle?.trim() || null
}

