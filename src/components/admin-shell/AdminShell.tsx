'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ExternalLink, LogOut, Menu, X } from 'lucide-react'
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

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

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
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavigationRef = useRef<HTMLElement>(null)
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null)
  const currentArea = findAreaByPath(pathname) ?? ADMIN_AREAS[0]
  const currentSection = findSectionByPath(pathname)
  const currentTitle = currentSection?.label ?? currentArea.label
  const fullbleed = contentMode === 'fullbleed' || pathname?.startsWith('/admin/assets')
  const closeMobileNavigation = useCallback(() => setMobileOpen(false), [])

  useEffect(() => setMobileOpen(false), [pathname])

  useEffect(() => {
    if (!mobileOpen) return

    const body = document.body
    const root = document.documentElement
    const previousBodyOverflow = body.style.overflow
    const previousBodyOverscroll = body.style.overscrollBehavior
    const previousRootOverscroll = root.style.overscrollBehavior
    const menuButton = mobileMenuButtonRef.current
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    root.style.overscrollBehavior = 'none'

    const focusFrame = window.requestAnimationFrame(() => mobileCloseButtonRef.current?.focus())

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMobileNavigation()
        return
      }

      if (event.key !== 'Tab') return
      const navigation = mobileNavigationRef.current
      if (!navigation) return

      const focusable = Array.from(navigation.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true')

      if (focusable.length === 0) {
        event.preventDefault()
        navigation.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !navigation.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !navigation.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      body.style.overflow = previousBodyOverflow
      body.style.overscrollBehavior = previousBodyOverscroll
      root.style.overscrollBehavior = previousRootOverscroll
      window.requestAnimationFrame(() => menuButton?.focus())
    }
  }, [closeMobileNavigation, mobileOpen])

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMobileNavigation()
    }
    desktopQuery.addEventListener('change', handleViewportChange)
    return () => desktopQuery.removeEventListener('change', handleViewportChange)
  }, [closeMobileNavigation])

  return (
    <div className="admin-app min-h-screen bg-[#f5f0e9] text-[#292a27]">
      <header
        className="admin-mobile-header fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 border-b border-black/10 bg-[#f8f4ee]/95 backdrop-blur lg:hidden"
        aria-hidden={mobileOpen || undefined}
        inert={mobileOpen || undefined}
      >
        <GuardedLink href="/admin/overview" className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]">
          <BrandMark compact />
          <span className="min-w-0">
            <span className="block text-[9px] font-semibold uppercase leading-none tracking-[0.16em] text-black/45">LashPop Admin</span>
            <span className="mt-1 block truncate font-serif text-[15px] font-semibold leading-none text-[#292a27]">{currentTitle}</span>
          </span>
        </GuardedLink>
        <button
          ref={mobileMenuButtonRef}
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex size-11 items-center justify-center rounded-lg border border-black/10 bg-white text-[#292a27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
          aria-label="Open admin navigation"
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-navigation"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </header>

      {mobileOpen && (
        <div
          className="admin-mobile-navigation-backdrop fixed inset-0 z-[80] bg-black/35 lg:hidden"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) closeMobileNavigation()
          }}
        >
          <aside
            ref={mobileNavigationRef}
            id="admin-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-mobile-navigation-title"
            tabIndex={-1}
            className="admin-mobile-navigation-sheet flex h-full w-[min(90vw,22rem)] flex-col overflow-y-auto bg-[#20211f] text-white shadow-2xl"
          >
            <div className="admin-mobile-navigation-header sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#20211f] px-4">
              <div className="min-w-0">
                <h2 id="admin-mobile-navigation-title" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Navigation</h2>
                <p className="mt-0.5 truncate font-serif text-base font-semibold text-white">{currentTitle}</p>
              </div>
              <button
                ref={mobileCloseButtonRef}
                type="button"
                onClick={closeMobileNavigation}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white/75 hover:border-white/30 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e38a69]"
                aria-label="Close admin navigation"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 px-3 py-2">
              <AdminNav pathname={pathname} onNavigate={closeMobileNavigation} />
            </div>
            <UserFooter user={user} onNavigate={closeMobileNavigation} />
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

      <main
        id="admin-main-content"
        className="admin-mobile-main min-h-screen lg:pl-72 lg:pt-0"
        aria-hidden={mobileOpen || undefined}
        inert={mobileOpen || undefined}
      >
        <div className="hidden border-b border-black/10 bg-[#f8f4ee] px-4 py-4 sm:px-6 lg:block lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">{currentArea.label}</p>
                {currentSection && <OwnerBadge owner={currentSection.owner} />}
              </div>
              <p className="mt-1 truncate font-serif text-xl font-semibold leading-tight text-[#292a27]">{currentTitle}</p>
              <p className="mt-0.5 truncate text-sm text-black/60">{currentSection?.description ?? currentArea.description}</p>
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

function AdminNav({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
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
                onNavigate={onNavigate}
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
                          onNavigate={onNavigate}
                          className={`flex min-h-11 items-center justify-between gap-2 rounded-md px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e38a69] ${sectionActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white/85'}`}
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

function UserFooter({ user, onNavigate }: { user: AdminShellProps['user']; onNavigate?: () => void }) {
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
    <div className="border-t border-white/10 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/90">{user.name || user.email || user.phoneNumber || 'Admin'}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/35">{user.role || 'Administrator'}</p>
        </div>
        <GuardedLink href="/" onNavigate={onNavigate} className="inline-flex min-h-11 items-center rounded-md px-2 py-1 text-xs text-white/50 hover:bg-white/5 hover:text-white">Site</GuardedLink>
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/65 hover:border-white/20 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e38a69] disabled:cursor-wait disabled:opacity-50"
      >
        <LogOut className="size-3.5" aria-hidden="true" />
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
      <p className="mt-2 min-h-4 text-center text-[10px] text-[#e38a69]" role="status" aria-live="polite">{signOutError}</p>
    </div>
  )
}

function OwnerBadge({ owner }: { owner: ContentOwner }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${OWNER_STYLES[owner]}`}>{owner}</span>
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl bg-[#c96f50] font-serif text-white shadow-sm ${compact ? 'size-9 text-base' : 'size-10 text-lg'}`} aria-hidden="true">
      L
    </span>
  )
}

function GuardedLink({
  href,
  className,
  children,
  onNavigate,
  ...props
}: {
  href: string
  className?: string
  children: React.ReactNode
  onNavigate?: () => void
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
        if (dirtyCount === 0 || pathname === href) {
          onNavigate?.()
          return
        }

        event.preventDefault()
        onNavigate?.()
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
