import {
  Activity,
  Building2,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Inbox,
  Instagram,
  Layers,
  MapPin,
  MessageCircleQuestion,
  Search,
  Settings,
  Sparkles,
  Star,
  Users,
  Wand2,
  FolderOpen,
  RefreshCw,
  Mail,
  Briefcase,
  Quote,
  type LucideIcon,
} from 'lucide-react'

export type SectionStatus = 'live' | 'new' | 'coming-soon'

export interface AdminSection {
  id: string
  label: string
  href: string
  icon: LucideIcon
  description: string
  status: SectionStatus
}

export interface AdminGroup {
  id: string
  label: string
  sections: AdminSection[]
}

/**
 * Master admin sidebar config. Order here = order shown.
 * Each section has a `status` so the shell can render badges
 * for new/coming-soon items during the rebuild.
 */
export const ADMIN_GROUPS: AdminGroup[] = [
  {
    id: 'top',
    label: '',
    sections: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/admin/overview',
        icon: Activity,
        description: 'Recent activity & status',
        status: 'new',
      },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    sections: [
      {
        id: 'studio-info',
        label: 'Studio Info',
        href: '/admin/content/studio-info',
        icon: Building2,
        description: 'Name, address, phone, social',
        status: 'new',
      },
      {
        id: 'hero',
        label: 'Hero',
        href: '/admin/website/hero',
        icon: ImageIcon,
        description: 'Arch & slideshow',
        status: 'live',
      },
      {
        id: 'welcome-cards',
        label: 'Welcome Cards',
        href: '/admin/content/welcome-cards',
        icon: Quote,
        description: 'Mobile swipeable intro',
        status: 'coming-soon',
      },
      {
        id: 'services',
        label: 'Services',
        href: '/admin/website/services',
        icon: Sparkles,
        description: 'Categories & hero images',
        status: 'live',
      },
      {
        id: 'homepage-services',
        label: 'Homepage Cards',
        href: '/admin/website/homepage-services',
        icon: Sparkles,
        description: '"Choose a Service" cards',
        status: 'live',
      },
      {
        id: 'team',
        label: 'Team',
        href: '/admin/website/team',
        icon: Users,
        description: 'Members & visibility',
        status: 'live',
      },
      {
        id: 'founder-letter',
        label: 'Founder Letter',
        href: '/admin/content/founder-letter',
        icon: FileText,
        description: "Emily's message",
        status: 'new',
      },
      {
        id: 'reviews',
        label: 'Reviews',
        href: '/admin/website/reviews',
        icon: Star,
        description: 'Moderation & pins',
        status: 'live',
      },
      {
        id: 'review-settings',
        label: 'Reviews Pipeline',
        href: '/admin/website/review-settings',
        icon: Wand2,
        description: 'Worker scoring & cron',
        status: 'live',
      },
      {
        id: 'instagram',
        label: 'Instagram',
        href: '/admin/website/instagram',
        icon: Instagram,
        description: 'Carousel feed',
        status: 'live',
      },
      {
        id: 'faq',
        label: 'FAQ',
        href: '/admin/website/faq',
        icon: HelpCircle,
        description: 'Questions & answers',
        status: 'live',
      },
      {
        id: 'quiz',
        label: 'Find Your Look',
        href: '/admin/website/quiz',
        icon: MessageCircleQuestion,
        description: 'Quiz photos & results',
        status: 'live',
      },
      {
        id: 'work-with-us',
        label: 'Work With Us',
        href: '/admin/website/work-with-us',
        icon: Briefcase,
        description: 'Careers page & carousel',
        status: 'live',
      },
      {
        id: 'seo',
        label: 'SEO',
        href: '/admin/website/seo',
        icon: Search,
        description: 'Metadata & schema',
        status: 'live',
      },
      {
        id: 'footer',
        label: 'Footer',
        href: '/admin/content/footer',
        icon: MapPin,
        description: 'Bottom links & newsletter',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'assets',
    label: 'Assets',
    sections: [
      {
        id: 'dam-library',
        label: 'Library',
        href: '/admin/assets',
        icon: FolderOpen,
        description: 'All photos & videos',
        status: 'live',
      },
      {
        id: 'dam-team',
        label: 'Team Photos',
        href: '/admin/assets/team',
        icon: Users,
        description: 'Member photos & crops',
        status: 'live',
      },
    ],
  },
  {
    id: 'inbox',
    label: 'Inbox',
    sections: [
      {
        id: 'inbox-newsletter',
        label: 'Newsletter',
        href: '/admin/inbox/newsletter',
        icon: Mail,
        description: 'Subscribers',
        status: 'live',
      },
      {
        id: 'inbox-work-with-us',
        label: 'Applications',
        href: '/admin/inbox/work-with-us',
        icon: Inbox,
        description: 'Work-with-us submissions',
        status: 'live',
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    sections: [
      {
        id: 'users',
        label: 'Admin Users',
        href: '/admin/dam-users',
        icon: Users,
        description: 'Phone allowlist',
        status: 'live',
      },
      {
        id: 'audit-log',
        label: 'Activity Log',
        href: '/admin/system/audit-log',
        icon: Layers,
        description: 'All admin actions',
        status: 'live',
      },
      {
        id: 'syncs',
        label: 'Syncs',
        href: '/admin/system/syncs',
        icon: RefreshCw,
        description: 'Vagaro sync status',
        status: 'live',
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/admin/system/settings',
        icon: Settings,
        description: 'Site-wide preferences',
        status: 'coming-soon',
      },
    ],
  },
]

/** Flat list, for breadcrumbs / lookups. */
export const ALL_SECTIONS: AdminSection[] = ADMIN_GROUPS.flatMap(g => g.sections)

export function findSectionByPath(pathname: string | null | undefined): AdminSection | undefined {
  if (!pathname) return undefined
  // Prefer the longest matching href so /admin/content/studio-info wins over /admin
  return [...ALL_SECTIONS]
    .sort((a, b) => b.href.length - a.href.length)
    .find(s => pathname === s.href || pathname.startsWith(s.href + '/'))
}
