'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Sparkles, ChevronRight } from 'lucide-react'
import { ADMIN_GROUPS, findSectionByPath, type SectionStatus } from './sections'

interface AdminShellProps {
  children: React.ReactNode
  user: {
    name: string | null
    phoneNumber: string | null
    email: string | null
  }
  /**
   * `constrained` (default): main content sits in a max-w-6xl, centered,
   * padded box — right for forms and dashboards.
   * `fullbleed`: main content stretches edge-to-edge with no inner padding
   * — used by the DAM grid + sticky omnibar, which manage their own layout.
   */
  contentMode?: 'constrained' | 'fullbleed'
}

const STATUS_BADGE: Record<SectionStatus, { label: string; className: string } | null> = {
  live: null,
  new: { label: 'New', className: 'bg-terracotta/10 text-terracotta border-terracotta/20' },
  'coming-soon': { label: 'Soon', className: 'bg-sage/10 text-sage border-sage/20' },
}

export function AdminShell({ children, user, contentMode = 'constrained' }: AdminShellProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const currentSection = findSectionByPath(pathname)

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-warm-sand/30 to-dusty-rose/10">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-xl border-b border-sage/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin/overview" className="flex items-center gap-2">
            <BrandMark />
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-dune font-medium text-sm">LashPop Admin</span>
              {currentSection && (
                <span className="text-xs text-dune/60 truncate max-w-[180px]">{currentSection.label}</span>
              )}
            </div>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(o => !o)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-sage/10"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-dune" /> : <Menu className="w-5 h-5 text-dune" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-sage/10 bg-cream/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto"
            >
              <Nav pathname={pathname} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-cream/90 backdrop-blur-xl border-r border-sage/10">
          <div className="px-6 pt-8 pb-4">
            <Link href="/admin/overview" className="flex items-center gap-3">
              <BrandMark />
              <div>
                <div className="font-serif text-lg text-dune font-medium leading-tight">LashPop Admin</div>
                <div className="text-xs text-dune/50">Studio control panel</div>
              </div>
            </Link>
          </div>

          <div className="flex-1 px-3 pb-6">
            <Nav pathname={pathname} />
          </div>

          {/* User footer */}
          <div className="border-t border-sage/10 px-6 py-4">
            <div className="text-xs text-dune/50 uppercase tracking-wider mb-1">Signed in as</div>
            <div className="text-sm text-dune truncate">{user.name || user.email || user.phoneNumber || 'admin'}</div>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1 text-xs text-dune/60 hover:text-terracotta transition-colors"
            >
              <ChevronRight className="w-3 h-3 rotate-180" />
              Back to lashpop.com
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:pl-72 pt-14 lg:pt-0 min-h-screen">
        {contentMode === 'fullbleed' ? (
          children
        ) : (
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-10 max-w-6xl mx-auto">{children}</div>
        )}
      </main>
    </div>
  )
}

function Nav({ pathname }: { pathname: string | null }) {
  return (
    <nav className="space-y-6 py-2">
      {ADMIN_GROUPS.map(group => (
        <div key={group.id}>
          {group.label && (
            <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.15em] text-dune/40 font-semibold">
              {group.label}
            </div>
          )}
          <ul className="space-y-0.5">
            {group.sections.map(section => {
              const isActive = pathname === section.href || (pathname?.startsWith(section.href + '/') ?? false)
              const badge = STATUS_BADGE[section.status]
              const Icon = section.icon
              const isComingSoon = section.status === 'coming-soon'

              const content = (
                <div
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all border ${
                    isActive
                      ? 'bg-gradient-to-r from-dusty-rose/15 to-terracotta/5 border-dusty-rose/30 shadow-sm'
                      : isComingSoon
                        ? 'border-transparent text-dune/40 cursor-not-allowed'
                        : 'hover:bg-sage/10 border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive
                        ? 'text-terracotta'
                        : isComingSoon
                          ? 'text-dune/30'
                          : 'text-dune/50 group-hover:text-dune/70'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium truncate flex items-center gap-2 ${
                        isActive ? 'text-dune' : isComingSoon ? 'text-dune/40' : 'text-dune/80'
                      }`}
                    >
                      <span className="truncate">{section.label}</span>
                      {badge && (
                        <span
                          className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] truncate ${isComingSoon ? 'text-dune/30' : 'text-dune/50'}`}>
                      {section.description}
                    </div>
                  </div>
                </div>
              )

              return (
                <li key={section.id}>
                  {isComingSoon ? (
                    content
                  ) : (
                    // `block` is load-bearing: without it, the <a> defaults to
                    // inline display, which can make the clickable region
                    // smaller than the visual row and produce phantom "click
                    // does nothing" behavior on parts of the row.
                    <Link href={section.href} prefetch={false} className="block">
                      {content}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function BrandMark() {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center shadow-md">
      <Sparkles className="w-4 h-4 text-cream" />
    </div>
  )
}
