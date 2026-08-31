import {
  Activity,
  BriefcaseBusiness,
  BookOpen,
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
    description: 'Tasks to complete and current website status.',
    sections: [
      {
        id: 'overview',
        label: 'Admin overview',
        href: '/admin/overview',
        icon: Activity,
        description: 'Tasks, website status and recent changes',
        owner: 'System',
      },
      {
        id: 'analytics',
        label: 'Website analytics',
        href: '/admin/analytics',
        icon: Activity,
        description: 'Visitors, page views and tracked actions',
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
    description: 'Update what clients see on the LashPop website.',
    sections: [
      { id: 'website-home', label: 'Website overview', href: '/admin/website', icon: LayoutDashboard, description: 'Pages, ownership and publishing status', owner: 'LashPop' },
      { id: 'service-launch', label: 'Launch a service', href: '/admin/workflows/service-launch', icon: Workflow, description: 'Add a service and check booking', owner: 'LashPop' },
      { id: 'studio-info', label: 'Studio information', href: '/admin/content/studio-info', icon: Building2, description: 'Location, contact, hours, and social', owner: 'LashPop' },
      { id: 'hero', label: 'Homepage hero', href: '/admin/website/hero', icon: ImageIcon, description: 'Homepage headline, arch photo and slideshow', owner: 'LashPop' },
      { id: 'services', label: 'Services and booking', href: '/admin/website/services', icon: Sparkles, description: 'Vagaro services and website details', owner: 'Mixed' },
      { id: 'homepage-services', label: 'Homepage service cards', href: '/admin/website/homepage-services', icon: Sparkles, description: 'Service card text and order', owner: 'LashPop' },
      { id: 'team', label: 'Team and stylists', href: '/admin/website/team', icon: Users, description: 'Profiles, services and website visibility', owner: 'Mixed' },
      { id: 'founder-letter', label: 'Founder letter', href: '/admin/content/founder-letter', icon: FileText, description: "Emily's homepage message", owner: 'LashPop' },
      { id: 'instagram', label: 'Instagram', href: '/admin/website/instagram', icon: Instagram, description: 'Homepage social feed', owner: 'LashPop' },
      { id: 'faq', label: 'Frequently asked questions', href: '/admin/website/faq', icon: HelpCircle, description: 'Questions, categories and featured items', owner: 'LashPop' },
      { id: 'quiz', label: 'Find Your Look', href: '/admin/website/quiz', icon: MessageCircleQuestion, description: 'Quiz photos and results', owner: 'LashPop' },
      { id: 'work-with-us', label: 'Work with us', href: '/admin/website/work-with-us', icon: BriefcaseBusiness, description: 'Careers text and photos', owner: 'LashPop' },
      { id: 'seo', label: 'Search and sharing', href: '/admin/website/seo', icon: Search, description: 'Search descriptions and social share images', owner: 'LashPop' },
    ],
  },
  {
    id: 'reputation',
    label: 'Reviews and reputation',
    shortLabel: 'Reviews',
    href: '/admin/website/reviews',
    icon: Star,
    description: 'Choose website reviews and set automatic scoring rules.',
    sections: [
      { id: 'reviews', label: 'Review library', href: '/admin/website/reviews', icon: Star, description: 'Show, hide, link and pin reviews', owner: 'Mixed' },
      { id: 'review-settings', label: 'Automation', href: '/admin/website/review-settings', icon: Wand2, description: 'Automatic scores and homepage rotation', owner: 'Automation' },
    ],
  },
  {
    id: 'media',
    label: 'Media',
    shortLabel: 'Media',
    href: '/admin/assets',
    icon: FolderOpen,
    description: 'Upload and organize website photos and videos.',
    sections: [
      { id: 'dam-library', label: 'Media library', href: '/admin/assets', icon: FolderOpen, description: 'All photos, videos, tags and assignments', owner: 'LashPop' },
      { id: 'dam-team', label: 'Team photography', href: '/admin/assets/team', icon: Users, description: 'Profile photos and website crops', owner: 'LashPop' },
    ],
  },
  {
    id: 'inbox',
    label: 'Inbox',
    shortLabel: 'Inbox',
    href: '/admin/inbox',
    icon: Inbox,
    description: 'Review newsletter signups and job or booth applications.',
    sections: [
      { id: 'inbox-home', label: 'Inbox overview', href: '/admin/inbox', icon: Inbox, description: 'New signups and applications', owner: 'System' },
      { id: 'inbox-newsletter', label: 'Newsletter subscribers', href: '/admin/inbox/newsletter', icon: Mail, description: 'Email addresses and consent status', owner: 'LashPop' },
      { id: 'inbox-work-with-us', label: 'Applications', href: '/admin/inbox/work-with-us', icon: BriefcaseBusiness, description: 'Employment and booth inquiries', owner: 'LashPop' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Manage Admin access, Vagaro sync and recorded activity.',
    sections: [
      { id: 'settings-home', label: 'Settings overview', href: '/admin/settings', icon: Settings, description: 'Access, Vagaro sync and recorded activity', owner: 'System' },
      { id: 'owner-guide', label: 'Owner guide', href: '/admin/owner-guide', icon: BookOpen, description: 'Searchable step-by-step help', owner: 'LashPop' },
      { id: 'users', label: 'Admin access', href: '/admin/dam-users', icon: Users, description: 'Roles and permissions', owner: 'System' },
      { id: 'syncs', label: 'Vagaro sync', href: '/admin/system/syncs', icon: RefreshCw, description: 'Last sync, results and run now', owner: 'Vagaro' },
      { id: 'audit-log', label: 'Activity history', href: '/admin/system/audit-log', icon: Activity, description: 'Who did what and when', owner: 'System' },
      { id: 'website-history', label: 'Website versions', href: '/admin/system/website-history', icon: History, description: 'View and restore saved website settings', owner: 'System' },
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
