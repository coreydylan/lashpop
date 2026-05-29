'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useDevMode } from '@/contexts/DevModeContext'
import { smoothScrollTo, smoothScrollToElement, getScroller } from '@/lib/smoothScroll'
import { DEFAULT_NAVIGATION, type NavigationContent } from '@/types/navigation'
import {
  DEFAULT_SITE_SECTIONS,
  type SiteSection,
  type SiteSectionsContent,
} from '@/types/site-sections'
import { Editable } from '@/components/admin-mode/Editable'

interface NavigationProps {
  /** Inline-editable navigation copy (logo alt + CTAs). Falls back to DEFAULT_NAVIGATION. */
  content?: NavigationContent
  /**
   * Canonical homepage sections — the single source of truth for the nav
   * links (label + anchor + order + visibility). The nav DERIVES its links
   * from this; editing a label edits the section's navLabel. Falls back to
   * DEFAULT_SITE_SECTIONS so render is identical when absent.
   */
  sections?: SiteSectionsContent
}

export function Navigation({ content, sections }: NavigationProps = {}) {
  // Navigation copy source of truth: `website_settings.section = 'navigation'`.
  // Inline admin edits PUT the whole nav object; local state keeps the bar
  // reflecting edits immediately (optimistic).
  const [nav, setNav] = useState<NavigationContent>(content ?? DEFAULT_NAVIGATION)
  const navRef = useRef(nav)
  navRef.current = nav

  useEffect(() => {
    if (content) {
      setNav(content)
      navRef.current = content
    }
  }, [content])

  // Serialize PUTs so two near-simultaneous field saves can't race.
  const navWriteChain = useRef<Promise<void>>(Promise.resolve())

  const putNav = useCallback((update: (current: NavigationContent) => NavigationContent) => {
    const run = navWriteChain.current.catch(() => {}).then(async () => {
      const merged = update(navRef.current)
      const res = await fetch('/api/admin/website/navigation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...merged, baseUpdatedAt: navRef.current.updatedAt }),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => null)
        if (res.status === 409 || msg?.conflict) {
          throw new Error(msg?.error || 'This changed in another tab — reload and redo.')
        }
        throw new Error(msg?.error || 'Failed to save navigation')
      }
      const data = await res.json()
      const saved = (data.content ?? merged) as NavigationContent
      setNav(saved)
      navRef.current = saved
    })
    navWriteChain.current = run.catch(() => {})
    return run
  }, [])

  const saveNavField = useCallback(
    (field: keyof NavigationContent) => async (value: string) => {
      await putNav(current => ({ ...current, [field]: value }))
    },
    [putNav]
  )

  // Canonical homepage sections: source of truth at
  // `website_settings.section = 'site_sections'`. The nav DERIVES its links
  // from here. Local state keeps the bar reflecting edits immediately.
  const [siteSections, setSiteSections] = useState<SiteSectionsContent>(
    sections ?? DEFAULT_SITE_SECTIONS
  )
  const sectionsRef = useRef(siteSections)
  sectionsRef.current = siteSections

  useEffect(() => {
    if (sections) {
      setSiteSections(sections)
      sectionsRef.current = sections
    }
  }, [sections])

  // Serialize PUTs to /api/admin/website/site-sections.
  const sectionsWriteChain = useRef<Promise<void>>(Promise.resolve())

  const putSections = useCallback(
    (update: (current: SiteSectionsContent) => SiteSectionsContent) => {
      const run = sectionsWriteChain.current.catch(() => {}).then(async () => {
        const merged = update(sectionsRef.current)
        const res = await fetch('/api/admin/website/site-sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...merged, baseUpdatedAt: sectionsRef.current.updatedAt }),
        })
        if (!res.ok) {
          const msg = await res.json().catch(() => null)
          if (res.status === 409 || msg?.conflict) {
            throw new Error(msg?.error || 'This changed in another tab — reload and redo.')
          }
          throw new Error(msg?.error || 'Failed to save sections')
        }
        const data = await res.json()
        const saved = (data.content ?? merged) as SiteSectionsContent
        setSiteSections(saved)
        sectionsRef.current = saved
      })
      sectionsWriteChain.current = run.catch(() => {})
      return run
    },
    []
  )

  // Editing a nav label edits the canonical SiteSection.navLabel (the single
  // place this concept is stored), then PUTs the whole site_sections object.
  const saveSectionNavLabel = useCallback(
    (sectionId: string) => async (value: string) => {
      await putSections(current => ({
        ...current,
        sections: current.sections.map(s =>
          s.id === sectionId ? { ...s, navLabel: value } : s
        ),
      }))
    },
    [putSections]
  )

  // Derive the nav links: only visible sections, ordered by `order`.
  const navSections: SiteSection[] = [...siteSections.sections]
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order)

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(true) // Start true to prevent flash
  const { registerLogoClick } = useDevMode()
  const pathname = usePathname()
  const router = useRouter()

  // Check if we're on the home/landing page
  const isHomePage = pathname === '/' || pathname === '/landing-v2'

  // Check if nav has already animated this session
  useEffect(() => {
    const alreadyAnimated = sessionStorage.getItem('navAnimated')
    if (alreadyAnimated) {
      setHasAnimated(true)
    } else {
      setHasAnimated(false)
      sessionStorage.setItem('navAnimated', 'true')
    }
  }, [])

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // On non-home pages, always show the compact frosted header
    if (!isHomePage) {
      setIsScrolled(true)
      return
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHomePage])

  const handleNavClick = (item: any, e: React.MouseEvent) => {
    // Handle Logo click (home link)
    if (item.href === '/') {
      // Register click for dev mode activation (5 clicks = activate)
      registerLogoClick()

      // If we're on the landing page (v2) or home page, scroll to top
      if (isHomePage) {
        e.preventDefault()
        smoothScrollTo(0, 1000, getScroller())
        setIsMobileMenuOpen(false)
        return
      }
      return
    }

    if (item.href?.startsWith('#')) {
      e.preventDefault()

      // If not on home page, navigate there with the anchor
      if (!isHomePage) {
        router.push('/' + item.href)
        setIsMobileMenuOpen(false)
        return
      }

      // On home page, smooth scroll to the section. Keep this aligned with
      // scrollToHomepageSection in lib/smoothScroll.ts.
      if (item.href === '#faq') {
        // FAQ needs a touch more clearance for its category chips below the h2.
        smoothScrollToElement(item.href, 110, 1000, 'top')
      } else {
        smoothScrollToElement(item.href, 80, 1000, 'top')
      }
    }
    setIsMobileMenuOpen(false)
  }

    const handleBookNow = () => {
      const target = nav.bookNowTarget || DEFAULT_NAVIGATION.bookNowTarget
      // If not on home page, navigate there with the anchor
      if (!isHomePage) {
        router.push('/' + target)
        return
      }
      // Scroll to the booking target section
      smoothScrollToElement(target, 80, 1000, 'top')
    }
  
  // Mobile header shrinks from py-6 (24px each side = 48px padding) to py-2 (8px each side = 16px padding)
  // Logo shrinks from h-8 to h-5 on mobile when scrolled
  const mobileScrolled = isMobile && isScrolled

  return (
    <>
      {/* Desktop Navigation - hidden on mobile where MobileHeader takes over */}
      <motion.nav
        initial={hasAnimated ? false : { y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: hasAnimated ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 hidden md:block glass backdrop-blur-md shadow-lg ${
          isScrolled ? 'py-4' : 'py-6'
        }`}
      >
        <div className="w-full px-6 md:px-12">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              onClick={(e) => handleNavClick({ href: '/' }, e)}
              className={`relative flex items-center transition-all duration-300 ${mobileScrolled ? 'h-5' : 'h-8'}`}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2"
              >
                <picture>
                  <source srcSet="/lashpop-images/branding/logo-terracotta.webp" type="image/webp" />
                  <img
                    src="/lashpop-images/branding/logo-terracotta.png"
                    alt={nav.logoAlt}
                    width={120}
                    height={42}
                    className={`w-auto transition-all duration-300 ${mobileScrolled ? 'h-5' : 'h-8'}`}
                  />
                </picture>
              </motion.div>
            </Link>
            
            {/* Desktop Nav — only at lg+ (1024px). Below that the hamburger
                takes over so the 6 items + 2 long-labeled CTAs don't wrap
                into a squished mess in the 768–1023 range. */}
            {/* Links DERIVE from the canonical `site_sections` model: editing a
                label edits SiteSection.navLabel (the single source of truth),
                href is the section's anchor and never drifts. Add/remove/reorder
                + visibility are managed via /admin/website. */}
            <div className="hidden lg:flex items-center gap-8">
              {navSections.map((section) => (
                <Link
                  key={section.id}
                  href={section.anchor}
                  onClick={(e) => handleNavClick({ href: section.anchor }, e)}
                  className="caption hover:opacity-80 transition-colors duration-300 leading-none flex items-center h-8"
                  style={{ color: '#b14e33' }}
                >
                  <Editable id={`nav-item-d-${section.id}`} label={`Nav — ${section.navLabel} label`} kind="text" as="span" value={section.navLabel} onSave={saveSectionNavLabel(section.id)} />
                </Link>
              ))}
              <Link
                href={nav.workWithUsHref}
                className="btn ml-4 transition-colors duration-300 hover:opacity-90"
                style={{
                  backgroundColor: 'transparent',
                  border: '1.5px solid #b14e33',
                  color: '#b14e33'
                }}
              >
                <Editable id="nav-workwithus-d" label="Nav — Work With Us label" kind="text" as="span" value={nav.workWithUsLabel} onSave={saveNavField('workWithUsLabel')} />
              </Link>
              <button
                className="btn text-cream transition-colors duration-300 hover:opacity-90"
                style={{ backgroundColor: '#b14e33' }}
                onClick={handleBookNow}
              >
                <Editable id="nav-booknow-d" label="Nav — Book Now label" kind="text" as="span" value={nav.bookNowLabel} onSave={saveNavField('bookNowLabel')} />
              </button>
            </div>
            
            {/* Hamburger — shows below lg (1024). Outer nav hides below md so
                MobileHeader owns <768; this hamburger fills the 768–1023 gap. */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-8 h-8 flex flex-col justify-center gap-1.5"
            >
              <motion.span
                animate={{ 
                  rotate: isMobileMenuOpen ? 45 : 0,
                  y: isMobileMenuOpen ? 6 : 0
                }}
                className="w-full h-0.5 bg-dune block"
              />
              <motion.span
                animate={{ 
                  opacity: isMobileMenuOpen ? 0 : 1
                }}
                className="w-full h-0.5 bg-dune block"
              />
              <motion.span
                animate={{ 
                  rotate: isMobileMenuOpen ? -45 : 0,
                  y: isMobileMenuOpen ? -6 : 0
                }}
                className="w-full h-0.5 bg-dune block"
              />
            </button>
          </div>
        </div>
      </motion.nav>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-cream z-30 lg:hidden"
          >
            <div className="flex flex-col justify-center items-center h-full space-y-8">
              {navSections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={section.anchor}
                    onClick={(e) => handleNavClick({ href: section.anchor }, e)}
                    className="text-2xl font-light text-dune"
                  >
                    <Editable id={`nav-item-m-${section.id}`} label={`Nav — ${section.navLabel} label`} kind="text" as="span" value={section.navLabel} onSave={saveSectionNavLabel(section.id)} />
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href={nav.workWithUsHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn mt-8"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1.5px solid #b14e33',
                    color: '#b14e33'
                  }}
                >
                  <Editable id="nav-workwithus-m" label="Nav — Work With Us label" kind="text" as="span" value={nav.workWithUsLabel} onSave={saveNavField('workWithUsLabel')} />
                </Link>
              </motion.div>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="btn btn-primary"
                onClick={() => {
                  handleBookNow();
                  setIsMobileMenuOpen(false);
                }}
              >
                <Editable id="nav-booknow-m" label="Nav — Book Now label" kind="text" as="span" value={nav.bookNowLabel} onSave={saveNavField('bookNowLabel')} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
