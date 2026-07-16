import {
  Activity,
  BriefcaseBusiness,
  Building2,
  FileText,
  FolderOpen,
  HelpCircle,
  History,
  Image as ImageIcon,
  Inbox,
  Instagram,
  LayoutDashboard,
  Mail,
  MessageCircleQuestion,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Star,
  Users,
  Wand2,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export type ContentOwner = 'LashPop' | 'Vagaro' | 'Automation' | 'System' | 'Mixed'

export interface AdminSection {
  id: string
  label: string
  href: string
  icon: LucideIcon
  description: string
  owner: ContentOwner
}

export interface AdminArea {
  id: 'today' | 'website' | 'reputation' | 'media' | 'inbox' | 'settings'
  label: string
  shortLabel: string
  href: string
  icon: LucideIcon
  description: string
  sections: AdminSection[]
}

/**
 * The admin is organized around six operator jobs. Existing URLs stay intact,
 * while the shell reveals only the tools relevant to the active job.
 */
export const ADMIN_AREAS: AdminArea[] = [
  {
    id: 'today',
    label: 'Today',
    shortLabel: 'Today',
    href: '/admin/overview',
    icon: LayoutDashboard,
    description: 'What needs attention and whether the site is healthy.',
    sections: [
      {
        id: 'overview',
        label: 'Operations overview',
        href: '/admin/overview',
        icon: Activity,
        description: 'Tasks, health, and recent changes',
        owner: 'System',
      },
    ],
  },
  {
    id: 'website',
    label: 'Website',
    shortLabel: 'Website',
    href: '/admin/website',
    icon: Sparkles,
    description: 'Publish the public LashPop experience with clear ownership.',
    sections: [
      { id: 'website-home', label: 'Website overview', href: '/admin/website', icon: LayoutDashboard, description: 'Publishing map and ownership', owner: 'LashPop' },
      { id: 'service-launch', label: 'Launch a service', href: '/admin/workflows/service-launch', icon: Workflow, description: 'Guided launch and verification', owner: 'LashPop' },
      { id: 'studio-info', label: 'Studio information', href: '/admin/content/studio-info', icon: Building2, description: 'Location, contact, hours, and social', owner: 'LashPop' },
      { id: 'hero', label: 'Homepage hero', href: '/admin/website/hero', icon: ImageIcon, description: 'Message, arch, and slideshow', owner: 'LashPop' },
      { id: 'services', label: 'Services & booking', href: '/admin/website/services', icon: Sparkles, description: 'Vagaro taxonomy and local presentation', owner: 'Mixed' },
      { id: 'homepage-services', label: 'Homepage service cards', href: '/admin/website/homepage-services', icon: Sparkles, description: 'Choose-a-service copy and order', owner: 'LashPop' },
      { id: 'team', label: 'Team & stylists', href: '/admin/website/team', icon: Users, description: 'Profiles, service chips, and visibility', owner: 'Mixed' },
      { id: 'founder-letter', label: 'Founder letter', href: '/admin/content/founder-letter', icon: FileText, description: "Emily's homepage message", owner: 'LashPop' },
      { id: 'instagram', label: 'Instagram', href: '/admin/website/instagram', icon: Instagram, description: 'Homepage social feed', owner: 'Automation' },
      { id: 'faq', label: 'FAQ', href: '/admin/website/faq', icon: HelpCircle, description: 'Questions, categories, and featured items', owner: 'LashPop' },
      { id: 'quiz', label: 'Find Your Look', href: '/admin/website/quiz', icon: MessageCircleQuestion, description: 'Quiz photos and results', owner: 'LashPop' },
      { id: 'work-with-us', label: 'Work With Us', href: '/admin/website/work-with-us', icon: BriefcaseBusiness, description: 'Careers content and photography', owner: 'LashPop' },
      { id: 'seo', label: 'Search & sharing', href: '/admin/website/seo', icon: Search, description: 'Metadata, social cards, and schema', owner: 'LashPop' },
    ],
  },
  {
    id: 'reputation',
    label: 'Reviews & reputation',
    shortLabel: 'Reviews',
    href: '/admin/website/reviews',
    icon: Star,
    description: 'Curate proof and manage the automated review pipeline.',
    sections: [
      { id: 'reviews', label: 'Review library', href: '/admin/website/reviews', icon: Star, description: 'Moderation, attribution, and homepage pins', owner: 'Mixed' },
      { id: 'review-settings', label: 'Automation', href: '/admin/website/review-settings', icon: Wand2, description: 'Scoring and rotation rules', owner: 'Automation' },
    ],
  },
  {
    id: 'media',
    label: 'Media',
    shortLabel: 'Media',
    href: '/admin/assets',
    icon: FolderOpen,
    description: 'Organize the image library and profile photography.',
    sections: [
      { id: 'dam-library', label: 'Asset library', href: '/admin/assets', icon: FolderOpen, description: 'All photos, videos, tags, and assignments', owner: 'LashPop' },
      { id: 'dam-team', label: 'Team photography', href: '/admin/assets/team', icon: Users, description: 'Profile albums and crops', owner: 'LashPop' },
    ],
  },
  {
    id: 'inbox',
    label: 'Inbox',
    shortLabel: 'Inbox',
    href: '/admin/inbox',
    icon: Inbox,
    description: 'Triage people who have raised their hand.',
    sections: [
      { id: 'inbox-home', label: 'Inbox overview', href: '/admin/inbox', icon: Inbox, description: 'Prioritized inbound activity', owner: 'System' },
      { id: 'inbox-newsletter', label: 'Newsletter subscribers', href: '/admin/inbox/newsletter', icon: Mail, description: 'Consent-based subscriber list', owner: 'LashPop' },
      { id: 'inbox-work-with-us', label: 'Applications', href: '/admin/inbox/work-with-us', icon: BriefcaseBusiness, description: 'Employment and booth inquiries', owner: 'LashPop' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Access, integrations, sync health, and accountability.',
    sections: [
      { id: 'settings-home', label: 'Settings overview', href: '/admin/settings', icon: Settings, description: 'Access and system health', owner: 'System' },
      { id: 'users', label: 'Admin access', href: '/admin/dam-users', icon: Users, description: 'Roles and permissions', owner: 'System' },
      { id: 'syncs', label: 'Vagaro sync', href: '/admin/system/syncs', icon: RefreshCw, description: 'Freshness, runs, and manual sync', owner: 'Vagaro' },
      { id: 'audit-log', label: 'Activity history', href: '/admin/system/audit-log', icon: Activity, description: 'Persistent admin changes', owner: 'System' },
      { id: 'website-history', label: 'Website versions', href: '/admin/system/website-history', icon: History, description: 'Restore versioned settings', owner: 'System' },
    ],
  },
]

export const ALL_SECTIONS = ADMIN_AREAS.flatMap((area) => area.sections)

export function findSectionByPath(pathname: string | null | undefined): AdminSection | undefined {
  if (!pathname) return undefined
  return [...ALL_SECTIONS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((section) => pathname === section.href || pathname.startsWith(`${section.href}/`))
}

export function findAreaByPath(pathname: string | null | undefined): AdminArea | undefined {
  if (!pathname) return undefined
  const section = findSectionByPath(pathname)
  if (section) return ADMIN_AREAS.find((area) => area.sections.some((candidate) => candidate.id === section.id))
  return [...ADMIN_AREAS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((area) => pathname === area.href || pathname.startsWith(`${area.href}/`))
}
