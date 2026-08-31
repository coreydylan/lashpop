const LEGACY_TATTOO_LABEL = 'Fine Line Tattoos'
export const TINY_TATTOOS_LABEL = 'Tiny Tattoos'

const HIDDEN_PUBLIC_SUBTITLE_SLUGS = new Set([
  'classic-fill',
  'classic-mini',
  'hybrid-fill',
  'hybrid-mini',
  'angel-fill',
  'angel-mini',
])

const HIDDEN_PUBLIC_SUBTITLE_NAMES = new Set([
  'Classic Fill',
  'Classic Mini Fill',
  'Hybrid Fill',
  'Hybrid Mini Fill',
  'Wet/Angel Fill',
  'Wet/Angel Mini Fill',
])

export function publicServiceLabel(value: string): string {
  return value.trim() === LEGACY_TATTOO_LABEL ? TINY_TATTOOS_LABEL : value
}

export function publicServiceLabels(values: readonly string[]): string[] {
  return values.map(publicServiceLabel)
}

export function presentPublicService<
  T extends {
    name: string
    slug?: string | null
    subtitle?: string | null
    categoryName?: string | null
  },
>(service: T): T {
  const hideSubtitle =
    (service.slug ? HIDDEN_PUBLIC_SUBTITLE_SLUGS.has(service.slug) : false)
    || HIDDEN_PUBLIC_SUBTITLE_NAMES.has(service.name)

  return {
    ...service,
    name: publicServiceLabel(service.name),
    subtitle: hideSubtitle ? null : service.subtitle,
    categoryName: service.categoryName
      ? publicServiceLabel(service.categoryName)
      : service.categoryName,
  }
}

export function presentPublicServiceCategory<
  T extends { name: string; slug?: string | null },
>(category: T): T {
  return {
    ...category,
    name: category.slug === 'fine-line-tattoos'
      ? TINY_TATTOOS_LABEL
      : publicServiceLabel(category.name),
  }
}
