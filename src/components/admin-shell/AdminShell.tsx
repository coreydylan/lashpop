'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, ExternalLink, LogOut, Menu, X } from 'lucide-react'
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

  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen])

  return (
    <div className="admin-app min-h-screen bg-[#f6f2ec] text-[#292a27]">
      <header className="admin-mobile-header fixed inset-x-0 top-0 z-50 flex h-[calc(4rem+env(safe-area-inset-top))] items-end justify-between border-b border-black/[0.08] bg-[#fbf8f3]/[0.96] px-4 pb-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
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
          className="flex size-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#292a27] shadow-[0_2px_10px_rgba(31,27,23,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
          aria-label={mobileOpen ? 'Close admin navigation' : 'Open admin navigation'}
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-navigation"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="admin-nav-scrim fixed inset-0 z-40 bg-[#1d1b18]/25 pt-[calc(4rem+env(safe-area-inset-top))] backdrop-blur-[1px] lg:hidden" onMouseDown={() => setMobileOpen(false)}>
          <aside
            id="admin-mobile-navigation"
            className="admin-mobile-drawer h-full w-[min(92vw,22rem)] overflow-y-auto bg-[#fbf8f3] text-[#292a27] shadow-[18px_0_56px_rgba(31,27,23,0.18)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <AdminNav pathname={pathname} />
            <UserFooter user={user} />
          </aside>
        </div>
      )}

      <aside className="admin-desktop-rail fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-black/[0.08] bg-[#fbf8f3] text-[#292a27] lg:flex">
        <div className="px-5 pb-5 pt-7">
          <GuardedLink href="/admin/overview" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e38a69]">
            <BrandMark />
            <span>
              <span className="block font-serif text-lg leading-tight">LashPop</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40">Studio desk</span>
            </span>
          </GuardedLink>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-5">
          <AdminNav pathname={pathname} />
        </div>
        <UserFooter user={user} />
      </aside>

      <main className="min-h-screen pt-[calc(4rem+env(safe-area-inset-top))] lg:pl-72 lg:pt-0">
        <div className="admin-context-bar border-b border-black/[0.08] bg-[#fbf8f3]/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/42">{currentArea.label}</p>
                {currentSection && <OwnerBadge owner={currentSection.owner} />}
              </div>
              <p className="mt-1 truncate text-sm text-black/60">{currentSection?.description ?? currentArea.description}</p>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden min-h-11 shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold shadow-[0_1px_6px_rgba(31,27,23,0.04)] hover:border-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] sm:inline-flex"
            >
              Preview site <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
        {fullbleed ? children : <div className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-28 lg:px-8 lg:py-9">{children}</div>}
      </main>
    </div>
  )
}

function AdminNav({ pathname }: { pathname: string | null }) {
  const currentArea = findAreaByPath(pathname) ?? ADMIN_AREAS[0]

  return (
    <nav aria-label="Admin navigation" className="py-2">
      <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/38">Work areas</p>
      <ul className="space-y-1 px-2">
        {ADMIN_AREAS.map((area) => {
          const active = area.id === currentArea.id
          const Icon = area.icon
          return (
            <li key={area.id}>
              <GuardedLink
                href={area.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] ${active ? 'bg-[#ebe1d7] text-[#292a27] shadow-[inset_0_0_0_1px_rgba(126,91,70,0.08)]' : 'text-black/60 hover:bg-black/[0.035] hover:text-[#292a27]'}`}
              >
                <Icon className={`size-4 shrink-0 ${active ? 'text-[#a84f35]' : 'text-black/35'}`} />
                <span className="truncate">{area.label}</span>
                {active && <ChevronRight className="ml-auto size-3.5 text-[#a84f35]/65" aria-hidden="true" />}
              </GuardedLink>

              {active && area.sections.length > 1 && (
                <ul className="mb-3 mt-1 space-y-0.5 border-l border-black/[0.09] py-1 pl-2 ml-5">
                  {area.sections.map((section) => {
                    const sectionActive = pathname === section.href || pathname?.startsWith(`${section.href}/`)
                    return (
                      <li key={section.id}>
                        <GuardedLink
                          href={section.href}
                          aria-current={sectionActive ? 'page' : undefined}
                          className={`flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] ${sectionActive ? 'bg-white text-[#292a27] shadow-[0_1px_4px_rgba(31,27,23,0.06)]' : 'text-black/48 hover:bg-white/60 hover:text-[#292a27]'}`}
                        >
                          <span className="truncate">{section.label}</span>
                          <span className="shrink-0 text-[9px] uppercase tracking-wide text-black/30">{section.owner === 'LashPop' ? 'Local' : section.owner}</span>
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
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')

  const handleSignOut = async () => {
    setSigningOut(true)
    setSignOutError('')
    try {
      const response = await fetch('/api/dam/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Sign out failed')
      router.push('/admin/login')
      router.refresh()
    } catch {
      setSignOutError('Could not sign out. Please try again.')
      setSigningOut(false)
    }
  }

  return (
    <div className="border-t border-black/[0.08] px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#292a27]">{user.name || user.email || user.phoneNumber || 'Admin'}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-black/38">{user.role || 'Administrator'}</p>
        </div>
        <GuardedLink href="/" className="rounded-md px-2 py-1 text-xs font-semibold text-black/45 hover:bg-black/[0.04] hover:text-[#292a27]">Site</GuardedLink>
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-xs font-semibold text-black/55 hover:border-black/20 hover:bg-black/[0.035] hover:text-[#292a27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] disabled:cursor-wait disabled:opacity-50"
      >
        <LogOut className="size-3.5" aria-hidden="true" />
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
      <p className="mt-2 min-h-4 text-center text-[10px] text-[#a84f35]" role="status" aria-live="polite">{signOutError}</p>
    </div>
  )
}

function OwnerBadge({ owner }: { owner: ContentOwner }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${OWNER_STYLES[owner]}`}>{owner}</span>
}

function BrandMark() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#a84f35]/20 bg-[#292a27] font-serif text-[13px] tracking-[0.08em] text-[#fbf8f3] shadow-sm" aria-hidden="true">
      LP
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
  const pathname = usePathname()
  const { confirmNavigation, dirtyCount } = useAdminWorkspace()

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      {...props}
      onClick={(event) => {
        if (
          event.defaultPrevented
          || event.button !== 0
          || event.metaKey
          || event.ctrlKey
          || event.shiftKey
          || event.altKey
        ) return

        // Leave ordinary links native. Intercepting every click and replaying
        // it through router.push made server redirects (especially an expired
        // admin session redirecting to login) look like a frozen navigation.
        if (dirtyCount === 0 || pathname === href) return

        event.preventDefault()
        void confirmNavigation().then((confirmed) => {
          // A confirmed discard is intentionally followed by a document
          // navigation. It gives auth redirects a clean boundary and ensures
          // no stale page state survives the abandoned draft.
          if (confirmed) window.location.assign(href)
        })
      }}
    >
      {children}
    </Link>
  )
}
