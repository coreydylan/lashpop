export const ACTIVE_WEBSITE_SETTING_SECTIONS = [
  'founder_letter',
  'hero_content',
  'hero_archway',
  'hero_slideshow_assignments',
  'hero_slideshow_presets',
  'homepage_services',
  'instagram_carousel',
  'review_pipeline',
  'seo_metadata',
  'studio',
  'work_with_us_content',
] as const

export const LEGACY_WEBSITE_SETTING_SECTIONS = ['hero_copy', 'site_sections'] as const

export type WebsiteSettingSection = (typeof ACTIVE_WEBSITE_SETTING_SECTIONS)[number]
export type WebsiteSettingSource = 'admin' | 'history-restore' | 'migration' | 'system'
export type WebsiteSettingOwner =
  | 'website.story'
  | 'website.hero'
  | 'website.services'
  | 'website.social'
  | 'reviews.automation'
  | 'website.seo'
  | 'website.identity'
  | 'website.careers'

export interface SettingRevalidationTarget {
  path: string
  type?: 'page' | 'layout'
}

export interface SettingValidationResult {
  valid: boolean
  errors: string[]
}

export interface WebsiteSettingDefinition {
  section: WebsiteSettingSection
  label: string
  owner: WebsiteSettingOwner
  source: WebsiteSettingSource
  schemaVersion: number
  revalidate: readonly SettingRevalidationTarget[]
  validate: (config: unknown) => SettingValidationResult
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function finish(errors: string[]): SettingValidationResult {
  return { valid: errors.length === 0, errors }
}

function requireRecord(value: unknown, label: string, errors: string[]): UnknownRecord | null {
  if (!isRecord(value)) {
    errors.push(`${label} must be an object`)
    return null
  }
  return value
}

function requireString(record: UnknownRecord, key: string, errors: string[], label = key): void {
  if (!isString(record[key])) errors.push(`${label} must be a string`)
}

function requireBoolean(record: UnknownRecord, key: string, errors: string[], label = key): void {
  if (typeof record[key] !== 'boolean') errors.push(`${label} must be a boolean`)
}

function requireOneOf(
  record: UnknownRecord,
  key: string,
  allowed: readonly string[],
  errors: string[],
  label = key,
): void {
  if (!isString(record[key]) || !allowed.includes(record[key] as string)) {
    errors.push(`${label} must be one of: ${allowed.join(', ')}`)
  }
}

function requireNumber(
  record: UnknownRecord,
  key: string,
  errors: string[],
  options: { min?: number; max?: number; optional?: boolean } = {},
): void {
  const value = record[key]
  if (value === undefined && options.optional) return
  if (!isFiniteNumber(value)) {
    errors.push(`${key} must be a finite number`)
    return
  }
  if (options.min !== undefined && value < options.min) errors.push(`${key} must be at least ${options.min}`)
  if (options.max !== undefined && value > options.max) errors.push(`${key} must be at most ${options.max}`)
}

function validatePosition(value: unknown, label: string, errors: string[]): void {
  const position = requireRecord(value, label, errors)
  if (!position) return
  requireNumber(position, 'x', errors, { min: 0, max: 100 })
  requireNumber(position, 'y', errors, { min: 0, max: 100 })
}

function validateImage(
  value: unknown,
  label: string,
  errors: string[],
  options: { requireId?: boolean } = {},
): void {
  if (value === null) return
  const image = requireRecord(value, label, errors)
  if (!image) return
  if (options.requireId) requireString(image, 'id', errors, `${label}.id`)
  requireString(image, 'assetId', errors, `${label}.assetId`)
  requireString(image, 'url', errors, `${label}.url`)
  requireString(image, 'fileName', errors, `${label}.fileName`)
  validatePosition(image.position, `${label}.position`, errors)
  if (image.objectFit !== 'cover' && image.objectFit !== 'contain') {
    errors.push(`${label}.objectFit must be "cover" or "contain"`)
  }
}

function validateFounderLetter(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'founder_letter', errors)
  if (!value) return finish(errors)
  for (const key of ['heading', 'greeting', 'signOff', 'signature']) requireString(value, key, errors)
  if (!Array.isArray(value.paragraphs) || value.paragraphs.length === 0 || !value.paragraphs.every(isString)) {
    errors.push('paragraphs must be a non-empty array of strings')
  }
  return finish(errors)
}

function validateHeroArchway(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'hero_archway', errors)
  if (!value) return finish(errors)
  validateImage(value.desktop, 'desktop', errors)
  validateImage(value.mobile, 'mobile', errors)
  return finish(errors)
}

function validateHeroContent(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'hero_content', errors)
  if (!value) return finish(errors)
  for (const key of ['heading', 'subheading', 'primaryCta', 'quizCta', 'careersCta', 'reviewsLabel']) {
    requireString(value, key, errors)
  }
  return finish(errors)
}

function validateWorkWithUsContent(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'work_with_us_content', errors)
  if (!value) return finish(errors)
  for (const key of ['heroEyebrow', 'heroTitle', 'heroDescription']) requireString(value, key, errors)
  for (const key of ['employee', 'booth', 'training']) {
    const card = requireRecord(value[key], key, errors)
    if (card) {
      requireString(card, 'title', errors, `${key}.title`)
      requireString(card, 'description', errors, `${key}.description`)
    }
  }
  return finish(errors)
}

function validateSlideshowAssignments(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'hero_slideshow_assignments', errors)
  if (!value) return finish(errors)
  for (const key of ['desktop', 'mobile']) {
    if (value[key] !== null && !isString(value[key])) errors.push(`${key} must be a string or null`)
  }
  requireBoolean(value, 'mobileSameAsDesktop', errors)
  return finish(errors)
}

function validateSlideshowPresets(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'hero_slideshow_presets', errors)
  if (!value) return finish(errors)
  if (!Array.isArray(value.presets)) {
    errors.push('presets must be an array')
    return finish(errors)
  }

  const presetIds = new Set<string>()
  value.presets.forEach((candidate, index) => {
    const preset = requireRecord(candidate, `presets[${index}]`, errors)
    if (!preset) return
    requireString(preset, 'id', errors, `presets[${index}].id`)
    requireString(preset, 'name', errors, `presets[${index}].name`)
    if (isString(preset.id)) {
      if (presetIds.has(preset.id)) errors.push(`presets[${index}].id duplicates ${preset.id}`)
      presetIds.add(preset.id)
    }
    if (!Array.isArray(preset.images)) {
      errors.push(`presets[${index}].images must be an array`)
    } else {
      preset.images.forEach((image, imageIndex) => validateImage(
        image,
        `presets[${index}].images[${imageIndex}]`,
        errors,
        { requireId: true },
      ))
    }
    const transition = requireRecord(preset.transition, `presets[${index}].transition`, errors)
    if (transition) {
      requireOneOf(transition, 'type', [
        'fade', 'slide', 'slideUp', 'slideDown', 'kenBurns', 'zoom', 'blur',
        'wipeLeft', 'wipeRight', 'wipeUp', 'wipeDown', 'circleReveal', 'pixelate',
        'ripple', 'morph', 'crosswarp', 'directionalWarp', 'glitch', 'cube',
      ], errors, `presets[${index}].transition.type`)
      requireNumber(transition, 'duration', errors, { min: 0, max: 30_000 })
      requireOneOf(transition, 'easing', [
        'linear', 'ease', 'easeIn', 'easeOut', 'easeInOut', 'easeInQuad',
        'easeOutQuad', 'easeInOutQuad', 'easeInCubic', 'easeOutCubic',
        'easeInOutCubic', 'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
      ], errors, `presets[${index}].transition.easing`)
    }
    const timing = requireRecord(preset.timing, `presets[${index}].timing`, errors)
    if (timing) {
      for (const key of ['autoAdvance', 'pauseOnHover', 'pauseOnInteraction']) {
        requireBoolean(timing, key, errors, `presets[${index}].timing.${key}`)
      }
      for (const key of ['interval', 'resumeDelay', 'startDelay']) {
        requireNumber(timing, key, errors, { min: 0, max: 60_000 })
      }
    }
    const navigation = requireRecord(preset.navigation, `presets[${index}].navigation`, errors)
    if (navigation) {
      for (const key of ['scrollEnabled', 'swipeEnabled', 'dragEnabled', 'looping', 'showIndicators']) {
        requireBoolean(navigation, key, errors, `presets[${index}].navigation.${key}`)
      }
      requireNumber(navigation, 'scrollSensitivity', errors, { min: 0, max: 10 })
      requireOneOf(navigation, 'snapBehavior', ['immediate', 'momentum'], errors, `presets[${index}].navigation.snapBehavior`)
      requireOneOf(
        navigation,
        'indicatorPosition',
        ['bottom', 'bottomLeft', 'bottomRight', 'side', 'hidden'],
        errors,
        `presets[${index}].navigation.indicatorPosition`,
      )
      requireOneOf(navigation, 'indicatorStyle', ['dots', 'lines', 'numbers'], errors, `presets[${index}].navigation.indicatorStyle`)
    }
  })
  return finish(errors)
}

function validateHomepageServices(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'homepage_services', errors)
  if (!value) return finish(errors)
  if (!Array.isArray(value.cards)) {
    errors.push('cards must be an array')
    return finish(errors)
  }

  const ids = new Set<string>()
  value.cards.forEach((candidate, index) => {
    const card = requireRecord(candidate, `cards[${index}]`, errors)
    if (!card) return
    for (const key of ['id', 'slug', 'title', 'tagline', 'description', 'icon']) {
      requireString(card, key, errors, `cards[${index}].${key}`)
    }
    requireBoolean(card, 'enabled', errors, `cards[${index}].enabled`)
    if (isString(card.id)) {
      if (ids.has(card.id)) errors.push(`cards[${index}].id duplicates ${card.id}`)
      ids.add(card.id)
    }
  })
  return finish(errors)
}

function validateInstagram(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'instagram_carousel', errors)
  if (!value) return finish(errors)
  requireNumber(value, 'maxPosts', errors, { min: 4, max: 24 })
  requireBoolean(value, 'autoScroll', errors)
  requireNumber(value, 'scrollSpeed', errors, { min: 10, max: 40 })
  requireBoolean(value, 'showCaptions', errors)
  return finish(errors)
}

function validateReviewPipeline(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'review_pipeline', errors)
  if (!value) return finish(errors)
  const requiredNumbers = [
    'homepage_capacity',
    'editor_pass_interval_days',
    'auto_promote_min_quality_score',
    'auto_promote_min_text_length',
    'auto_promote_recency_months',
    'diversity_cap_per_source',
    'diversity_cap_per_stylist',
    'highlights_per_stylist',
  ]
  for (const key of requiredNumbers) requireNumber(value, key, errors, { min: 0 })
  requireNumber(value, 'recency_decay_days_per_point', errors, { min: 1, optional: true })
  requireBoolean(value, 'editor_pass_enabled', errors)
  return finish(errors)
}

function validateSeo(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'seo_metadata', errors)
  if (!value) return finish(errors)
  const site = requireRecord(value.site, 'site', errors)
  const pages = requireRecord(value.pages, 'pages', errors)
  if (site) {
    for (const key of ['businessName', 'businessDescription', 'businessType', 'siteUrl', 'siteName']) {
      requireString(site, key, errors, `site.${key}`)
    }
    requireRecord(site.socialProfiles, 'site.socialProfiles', errors)
  }
  if (pages) {
    for (const key of ['homepage', 'services', 'workWithUs']) requireRecord(pages[key], `pages.${key}`, errors)
  }
  return finish(errors)
}

function validateStudio(config: unknown): SettingValidationResult {
  const errors: string[] = []
  const value = requireRecord(config, 'studio', errors)
  if (!value) return finish(errors)
  for (const key of ['name', 'tagline', 'phone', 'phoneE164', 'email', 'hoursShort', 'vagaroBookingUrl', 'inboundEmail']) {
    requireString(value, key, errors)
  }
  const address = requireRecord(value.address, 'address', errors)
  if (address) for (const key of ['street', 'city', 'state', 'zip']) requireString(address, key, errors, `address.${key}`)
  const coordinates = requireRecord(value.coordinates, 'coordinates', errors)
  if (coordinates) {
    requireNumber(coordinates, 'lat', errors, { min: -90, max: 90 })
    requireNumber(coordinates, 'lng', errors, { min: -180, max: 180 })
  }
  const social = requireRecord(value.social, 'social', errors)
  if (social) {
    for (const [key, socialValue] of Object.entries(social)) {
      if (socialValue !== undefined && !isString(socialValue)) errors.push(`social.${key} must be a string`)
    }
  }
  return finish(errors)
}

export const WEBSITE_SETTING_REGISTRY: Record<WebsiteSettingSection, WebsiteSettingDefinition> = {
  founder_letter: {
    section: 'founder_letter',
    label: 'Founder letter',
    owner: 'website.story',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [{ path: '/', type: 'page' }],
    validate: validateFounderLetter,
  },
  hero_content: {
    section: 'hero_content',
    label: 'Hero content',
    owner: 'website.hero',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [{ path: '/', type: 'page' }],
    validate: validateHeroContent,
  },
  hero_archway: {
    section: 'hero_archway',
    label: 'Hero archway',
    owner: 'website.hero',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [{ path: '/', type: 'page' }],
    validate: validateHeroArchway,
  },
  hero_slideshow_assignments: {
    section: 'hero_slideshow_assignments',
    label: 'Hero slideshow assignments',
    owner: 'website.hero',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [{ path: '/', type: 'page' }],
    validate: validateSlideshowAssignments,
  },
  hero_slideshow_presets: {
    section: 'hero_slideshow_presets',
    label: 'Hero slideshow presets',
    owner: 'website.hero',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [{ path: '/', type: 'page' }],
    validate: validateSlideshowPresets,
  },
  homepage_services: {
    section: 'homepage_services',
    label: 'Homepage service cards',
    owner: 'website.services',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [{ path: '/', type: 'page' }],
    validate: validateHomepageServices,
  },
  instagram_carousel: {
    section: 'instagram_carousel',
    label: 'Instagram carousel',
    owner: 'website.social',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [{ path: '/', type: 'page' }],
    validate: validateInstagram,
  },
  review_pipeline: {
    section: 'review_pipeline',
    label: 'Review automation',
    owner: 'reviews.automation',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [],
    validate: validateReviewPipeline,
  },
  seo_metadata: {
    section: 'seo_metadata',
    label: 'SEO metadata',
    owner: 'website.seo',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [
      { path: '/', type: 'page' },
      { path: '/services', type: 'page' },
      { path: '/work-with-us', type: 'page' },
    ],
    validate: validateSeo,
  },
  studio: {
    section: 'studio',
    label: 'Studio information',
    owner: 'website.identity',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [{ path: '/', type: 'layout' }],
    validate: validateStudio,
  },
  work_with_us_content: {
    section: 'work_with_us_content',
    label: 'Work With Us content',
    owner: 'website.careers',
    source: 'admin',
    schemaVersion: 1,
    revalidate: [{ path: '/work-with-us', type: 'page' }],
    validate: validateWorkWithUsContent,
  },
}

export function isWebsiteSettingSection(value: unknown): value is WebsiteSettingSection {
  return typeof value === 'string' && ACTIVE_WEBSITE_SETTING_SECTIONS.includes(value as WebsiteSettingSection)
}

export function isLegacyWebsiteSettingSection(value: unknown): value is (typeof LEGACY_WEBSITE_SETTING_SECTIONS)[number] {
  return typeof value === 'string' && LEGACY_WEBSITE_SETTING_SECTIONS.includes(value as (typeof LEGACY_WEBSITE_SETTING_SECTIONS)[number])
}

export function getWebsiteSettingDefinition(section: WebsiteSettingSection): WebsiteSettingDefinition {
  return WEBSITE_SETTING_REGISTRY[section]
}
