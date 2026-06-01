// Homepage "Choose a Service" marketing cards.
//
// These are curated marketing content, intentionally DECOUPLED from the Vagaro
// booking taxonomy (`service_categories`). The booking taxonomy drives the
// ServiceBrowser modal; these cards drive the homepage Services section copy,
// icons, order, and per-card link behavior. Stored in
// website_settings(section='homepage_services'); admins edit them at
// /admin/website/services (Homepage Cards). Missing fields fall back to
// DEFAULT_HOMEPAGE_SERVICES, which mirrors the historical hardcoded copy.

export const HOMEPAGE_SERVICES_SECTION = 'homepage_services'

export interface HomepageServiceCard {
  // Stable id used as a React key and for ordering.
  id: string
  // Slug drives click behavior in ServicesSection (e.g. 'injectables' opens
  // Naturtox, 'lash-lifts' opens the lashes modal on the lash-lifts subcategory,
  // otherwise opens the ServiceBrowser modal for this slug).
  slug: string
  title: string
  tagline: string
  description: string
  // Icon path (SVG in /lashpop-images/services/thin/...).
  icon: string
  // Hidden cards are kept for easy re-enable but not rendered on the homepage.
  enabled: boolean
}

export interface HomepageServicesContent {
  cards: HomepageServiceCard[]
}

export const DEFAULT_HOMEPAGE_SERVICES: HomepageServicesContent = {
  cards: [
    {
      id: 'lashes',
      slug: 'lashes',
      title: 'LASH EXTENSIONS',
      tagline: 'Wake up ready.',
      description:
        'From soft and natural to full and fluffy, every lash look is personalized to your eye shape, natural lashes and your preferences, so getting ready feels like a breeze (and way more fun).',
      icon: '/lashpop-images/services/thin/lashes-icon.svg',
      enabled: true,
    },
    {
      id: 'lash-lifts',
      slug: 'lash-lifts',
      title: 'LASH LIFTS',
      tagline: 'Your lashes, but better.',
      description:
        'A lash lift gives your lashes a natural lifted and tinted look for effortless definition. A low-maintenance lash look that lasts 6–8 weeks.',
      icon: '/lashpop-images/services/thin/lash-lifts-icon.svg',
      enabled: true,
    },
    {
      id: 'brows',
      slug: 'brows',
      title: 'BROWS',
      tagline: 'Frame your face.',
      description:
        'Customized brow services that shape, define and enhance what you already have. Each service tailored so you leave looking refreshed and effortlessly put together. Choose from brow laminations, waxing, tinting, microblading and nano-brows.',
      icon: '/lashpop-images/services/thin/brows-icon.svg',
      enabled: true,
    },
    {
      id: 'facials',
      slug: 'facials',
      title: 'SKINCARE',
      tagline: 'Glow-y and fresh.',
      description:
        'Personalized skincare treatments designed to support your skin, restore your glow, and leave you feeling refreshed and radiant. Choose from basic facials, hydrafacials, dermaplaning, fibroblast, jet plasma and more.',
      icon: '/lashpop-images/services/thin/skincare-icon.svg',
      enabled: true,
    },
    {
      id: 'waxing',
      slug: 'waxing',
      title: 'WAXING',
      tagline: 'Smooth + effortless.',
      description:
        'Low maintenance waxing services that keep your skin smooth and your routine effortless.',
      icon: '/lashpop-images/services/thin/waxing-icon.svg',
      enabled: true,
    },
    {
      id: 'permanent-makeup',
      slug: 'permanent-makeup',
      title: 'PERMANENT MAKEUP',
      tagline: 'High impact, low maintenance.',
      description:
        'Natural looking results that streamline your routine and elevate your look without feeling overdone. Choose from microblading and nano-brow services, lip blushing, and faux freckles/beauty marks.',
      icon: '/lashpop-images/services/thin/permanent-makeup-icon.svg',
      enabled: true,
    },
    {
      id: 'specialty',
      slug: 'specialty',
      title: 'PERMANENT JEWELRY',
      tagline: 'No clasps. No fuss.',
      description:
        "Custom, minimal chains welded in place so that you never have to think about it. A personal keepsake you'll wear every day, whether you're diving into the ocean, traveling, or simply going about your life.",
      icon: '/lashpop-images/services/thin/permanent-jewelry-icon.svg',
      enabled: true,
    },
    {
      id: 'injectables',
      slug: 'injectables',
      title: 'BOTOX',
      tagline: 'The subtle glow up.',
      description:
        'Natural looking results that keep your face looking smooth, relaxed, effortlessly refreshed + still you.',
      icon: '/lashpop-images/services/thin/injectables-icon.svg',
      enabled: true,
    },
  ],
}

// Merge stored config over defaults. If no stored cards exist, return defaults.
// Stored cards are matched to defaults by id so per-field fallback works; any
// extra stored cards (admin-added) are appended.
export function mergeHomepageServices(
  stored: Partial<HomepageServicesContent> | null | undefined
): HomepageServicesContent {
  if (!stored || !Array.isArray(stored.cards) || stored.cards.length === 0) {
    return DEFAULT_HOMEPAGE_SERVICES
  }

  const defaultsById = new Map(DEFAULT_HOMEPAGE_SERVICES.cards.map((c) => [c.id, c]))

  const cards: HomepageServiceCard[] = stored.cards.map((raw) => {
    const base = (raw?.id && defaultsById.get(raw.id)) || null
    return {
      id: raw?.id ?? base?.id ?? cryptoRandomId(),
      slug: raw?.slug ?? base?.slug ?? '',
      title: raw?.title ?? base?.title ?? '',
      tagline: raw?.tagline ?? base?.tagline ?? '',
      description: raw?.description ?? base?.description ?? '',
      icon: raw?.icon ?? base?.icon ?? '',
      enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : base?.enabled ?? true,
    }
  })

  return { cards }
}

// Deterministic-enough id for admin-added cards. Avoids Math.random in shared
// code paths; the admin client passes its own ids, so this is a rarely-hit
// fallback for malformed stored rows.
function cryptoRandomId(): string {
  return `card-${Date.now().toString(36)}`
}
