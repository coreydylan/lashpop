'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ExternalLink, Menu, X } from 'lucide-react'
import { ADMIN_AREAS, findAreaByPath, findSectionByPath, type ContentOwner } from './sections'
import { AdminWorkspaceProvider, useAdminWorkspace } from './AdminWorkspaceContext'
import { AdminActionBar } from './AdminActionBar'

interface AdminShellProps {
  children: React.ReactNode
  user: {
    name: string | null
    phoneNumber: string | null
    email: string | null
    role?: string | null
  }
  contentMode?: 'constrained' | 'fullbleed'
}

const OWNER_STYLES: Record<ContentOwner, string> = {
  LashPop: 'border-[#d99177]/30 bg-[#d99177]/10 text-[#9e5037]',
  Vagaro: 'border-[#7da3a0]/30 bg-[#7da3a0]/10 text-[#3d6d69]',
  Automation: 'border-[#ad8b4d]/30 bg-[#ad8b4d]/10 text-[#745a27]',
  System: 'border-[#8c8d86]/30 bg-[#8c8d86]/10 text-[#5d5e59]',
  Mixed: 'border-[#8b748f]/30 bg-[#8b748f]/10 text-[#654d6a]',
}

export function AdminShell({ children, user, contentMode = 'constrained' }: AdminShellProps) {
  return (
    <AdminWorkspaceProvider>
      <AdminShellContent user={user} contentMode={contentMode}>{children}</AdminShellContent>
      <AdminActionBar />
    </AdminWorkspaceProvider>
  )
}

function AdminShellContent({ children, user, contentMode = 'constrained' }: AdminShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const currentArea = findAreaByPath(pathname) ?? ADMIN_AREAS[0]
  const currentSection = findSectionByPath(pathname)
  const fullbleed = contentMode === 'fullbleed' || pathname?.startsWith('/admin/assets')

  useEffect(() => setMobileOpen(false), [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  return (
    <div className="admin-app min-h-screen bg-[#f5f0e9] text-[#292a27]">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-black/10 bg-[#f8f4ee]/95 px-4 backdrop-blur lg:hidden">
        <GuardedLink href="/admin/overview" className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]">
          <BrandMark />
          <span>
            <span className="block font-serif text-base leading-tight">LashPop Admin</span>
            <span className="block text-xs text-black/55">{currentArea.shortLabel}</span>
          </span>
        </GuardedLink>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex size-11 items-center justify-center rounded-lg border border-black/10 bg-white text-[#292a27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
          aria-label={mobileOpen ? 'Close admin navigation' : 'Open admin navigation'}
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-navigation"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/35 pt-16 lg:hidden" onMouseDown={() => setMobileOpen(false)}>
          <aside
            id="admin-mobile-navigation"
            className="h-full w-[min(92vw,22rem)] overflow-y-auto bg-[#20211f] text-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <AdminNav pathname={pathname} />
            <UserFooter user={user} />
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/10 bg-[#20211f] text-white lg:flex">
        <div className="px-5 pb-5 pt-7">
          <GuardedLink href="/admin/overview" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e38a69]">
            <BrandMark />
            <span>
              <span className="block font-serif text-lg leading-tight">LashPop Admin</span>
              <span className="block text-xs text-white/50">Studio operations</span>
            </span>
          </GuardedLink>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-5">
          <AdminNav pathname={pathname} />
        </div>
        <UserFooter user={user} />
      </aside>

      <main className="min-h-screen pt-16 lg:pl-72 lg:pt-0">
        <div className="border-b border-black/10 bg-[#f8f4ee] px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">{currentArea.label}</p>
                {currentSection && <OwnerBadge owner={currentSection.owner} />}
              </div>
              <p className="mt-1 truncate text-sm text-black/60">{currentSection?.description ?? currentArea.description}</p>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden min-h-11 shrink-0 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium hover:border-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] sm:inline-flex"
            >
              Preview site <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
        {fullbleed ? children : <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>}
      </main>
    </div>
  )
}

function AdminNav({ pathname }: { pathname: string | null }) {
  const currentArea = findAreaByPath(pathname) ?? ADMIN_AREAS[0]

  return (
    <nav aria-label="Admin navigation" className="py-2">
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Work areas</p>
      <ul className="space-y-1">
        {ADMIN_AREAS.map((area) => {
          const active = area.id === currentArea.id
          const Icon = area.icon
          return (
            <li key={area.id}>
              <GuardedLink
                href={area.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e38a69] ${active ? 'bg-white text-[#20211f]' : 'text-white/72 hover:bg-white/[0.08] hover:text-white'}`}
              >
                <Icon className={`size-4 shrink-0 ${active ? 'text-[#b75f42]' : 'text-white/45'}`} />
                <span className="truncate">{area.label}</span>
              </GuardedLink>

              {active && area.sections.length > 1 && (
                <ul className="mb-3 mt-1 space-y-0.5 border-l border-white/15 py-1 pl-3 ml-5">
                  {area.sections.map((section) => {
                    const sectionActive = pathname === section.href || pathname?.startsWith(`${section.href}/`)
                    return (
                      <li key={section.id}>
                        <GuardedLink
                          href={section.href}
                          aria-current={sectionActive ? 'page' : undefined}
                          className={`flex min-h-10 items-center justify-between gap-2 rounded-md px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e38a69] ${sectionActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white/85'}`}
                        >
                          <span className="truncate">{section.label}</span>
                          <span className="shrink-0 text-[9px] uppercase tracking-wide text-white/30">{section.owner === 'LashPop' ? 'Local' : section.owner}</span>
                        </GuardedLink>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function UserFooter({ user }: { user: AdminShellProps['user'] }) {
  return (
    <div className="border-t border-white/10 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/90">{user.name || user.email || user.phoneNumber || 'Admin'}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/35">{user.role || 'Administrator'}</p>
        </div>
        <GuardedLink href="/" className="rounded-md px-2 py-1 text-xs text-white/50 hover:bg-white/5 hover:text-white">Site</GuardedLink>
      </div>
    </div>
  )
}

function OwnerBadge({ owner }: { owner: ContentOwner }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${OWNER_STYLES[owner]}`}>{owner}</span>
}

function BrandMark() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#c96f50] font-serif text-lg text-white shadow-sm" aria-hidden="true">
      L
    </span>
  )
}

function GuardedLink({
  href,
  className,
  children,
  ...props
}: {
  href: string
  className?: string
  children: React.ReactNode
  'aria-current'?: 'page'
}) {
  const router = useRouter()
  const { confirmNavigation } = useAdminWorkspace()

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      {...props}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        void confirmNavigation().then((confirmed) => {
          if (confirmed) router.push(href)
        })
      }}
    >
      {children}
    </Link>
  )
}
