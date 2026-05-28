'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useDevMode } from '@/contexts/DevModeContext'
import { smoothScrollToElement, smoothScrollTo, getScroller } from '@/lib/smoothScroll'

// Section mapping for display names and navigation
const SECTIONS = [
  { id: 'services', label: 'SERVICES', href: '#services' },
  { id: 'team', label: 'TEAM', href: '#team' },
  { id: 'reviews', label: 'REVIEWS', href: '#reviews' },
  { id: 'instagram', label: 'GALLERY', href: '#gallery' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
  { id: 'map', label: 'FIND US', href: '#find-us' },
  { id: 'footer', label: 'FIND US', href: '#find-us' }, // Footer shows same as map
] as const

// Menu item type
interface MenuItem {
  id: string
  label: string
  href: string
}

// Menu items - ordered to match page flow
const MENU_ITEMS: MenuItem[] = [
  { id: 'services', label: 'SERVICES', href: '#services' },
  { id: 'team', label: 'TEAM', href: '#team' },
  { id: 'reviews', label: 'REVIEWS', href: '#reviews' },
  { id: 'instagram', label: 'GALLERY', href: '#gallery' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
  { id: 'map', label: 'FIND US', href: '#find-us' },
  { id: 'work-with-us', label: 'WORK WITH US', href: '/work-with-us' },
]

// Sections that should show the header (team and below)
const HEADER_VISIBLE_SECTIONS = ['team', 'instagram', 'reviews', 'faq', 'map', 'footer']

interface MobileHeaderProps {
  currentSection?: string
}

export function MobileHeader({ currentSection = '' }: MobileHeaderProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 56, left: 0 })
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { registerLogoClick } = useDevMode()
  const pathname = usePathname()
  const router = useRouter()

  // Check if we're on the home/landing page
  const isHomePage = pathname === '/' || pathname === '/landing-v2'

  // Get current section label for display
  const currentSectionLabel = SECTIONS.find(s => s.id === currentSection)?.label || ''

  // Determine if we're in a section that should show the header
  const shouldShowHeader = HEADER_VISIBLE_SECTIONS.includes(currentSection)

  // Get the scroll container (mobile uses .mobile-scroll-container)
  const getScrollContainer = useCallback(() => {
    return document.querySelector('.mobile-scroll-container') as HTMLElement | null
  }, [])

  // Track scroll position for transparent/frosted glass transition
  // On non-home pages, always show the frosted background
  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true)
      return
    }

    const scrollContainer = getScrollContainer()
    if (!scrollContainer) return

    // Guard against firing setState every scroll frame — only update when
    // the boolean actually transitions. Avoids pushing identical values
    // through React's reconciler during fast momentum scrolls.
    let lastScrolled = scrollContainer.scrollTop > 20
    setIsScrolled(lastScrolled)

    const handleScroll = () => {
      const next = scrollContainer.scrollTop > 20
      if (next !== lastScrolled) {
        lastScrolled = next
        setIsScrolled(next)
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [getScrollContainer, isHomePage])

  // Update menu position when opened - align to right with padding
  useEffect(() => {
    if (isMenuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      const menuWidth = 140 // minWidth of menu
      const rightPadding = 20 // padding from right edge of screen
      setMenuPosition({
        top: rect.bottom + 8,
        left: window.innerWidth - menuWidth - rightPadding
      })
    }
  }, [isMenuOpen])

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    // Small delay to prevent immediate close on open
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside as any)
    }, 10)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [isMenuOpen])

  // Close menu on scroll
  useEffect(() => {
    if (!isMenuOpen) return

    const scrollContainer = getScrollContainer()
    if (!scrollContainer) return

    const handleScroll = () => setIsMenuOpen(false)
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [isMenuOpen, getScrollContainer])

  // Handle logo click - scroll to top + register for dev mode
  const handleLogoClick = useCallback(() => {
    // Register click for dev mode activation (5 clicks = activate)
    registerLogoClick()

    // If not on home page, navigate there
    if (!isHomePage) {
      router.push('/')
      return
    }

    const scrollContainer = getScrollContainer()
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      smoothScrollTo(0, 1000, getScroller())
    }
  }, [getScrollContainer, registerLogoClick, isHomePage, router])

  // Handle menu item click
  // Header height is 60px - use consistent offsets based on this
  const HEADER_HEIGHT = 60
  const handleMenuItemClick = useCallback((item: MenuItem) => {
    setIsMenuOpen(false)

    // Handle page links (non-hash links)
    if (!item.href.startsWith('#')) {
      router.push(item.href)
      return
    }

    // If not on home page, navigate there with the anchor
    if (!isHomePage) {
      router.push('/' + item.href)
      return
    }

    // On home page, smooth scroll. All sections use the bare header height —
    // the previous +20 padding on gallery/reviews was over-shooting their
    // titles. Keep aligned with scrollToHomepageSection in lib/smoothScroll.ts.
    smoothScrollToElement(item.href, HEADER_HEIGHT, 800, 'top')
  }, [isHomePage, router])

  // Render the dropdown menu (inline, not portal - portal was breaking on mobile)
  const renderMenu = () => {
    return (
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed z-[9999] rounded-xl overflow-hidden"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: 140,
              transformOrigin: 'top',
              background: 'rgba(250, 246, 242, 0.96)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(161, 151, 129, 0.12)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div className="py-1.5">
              {MENU_ITEMS.map((item) => {
                const isActive = item.id === currentSection ||
                  (item.id === 'map' && currentSection === 'footer')

                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item)}
                    className={`
                      w-full flex items-center justify-between gap-3 px-4 py-2.5
                      text-left transition-colors duration-150
                      ${isActive
                        ? 'bg-terracotta/8'
                        : 'active:bg-warm-sand/50'
                      }
                    `}
                  >
                    <span className={`
                      text-[11px] font-sans font-medium tracking-wide
                      ${isActive ? 'text-terracotta' : 'text-terracotta/70'}
                    `}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="mobileMenuActive"
                        className="w-1 h-1 rounded-full bg-terracotta/60"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <>
      {/* Mini Header - transparent at top, frosted glass on scroll */}
      {isVisible && (
        <header
          className="fixed top-0 left-0 right-0 z-50 md:hidden transition-[background-color] duration-300"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            // Solid background on scroll — used to be rgba(0.95) + blur(16px) for
            // a frosted-glass effect, but backdrop-filter on a full-width fixed
            // strip is the single biggest momentum-scroll killer on iOS Safari.
            // Every scroll frame the GPU had to re-sample + re-blur whatever
            // content was sliding under the header, which made fast swipes
            // through the homepage hitch and stop mid-flight. Going solid
            // costs zero compositor work and the visual delta vs. 95%-opaque
            // ivory + blur is negligible.
            background: isScrolled ? 'rgb(250, 246, 242)' : 'transparent',
          }}
        >
          <div className="px-5 flex items-center justify-between" style={{ height: '60px' }}>
            {/* LashPop Logo - Left */}
            <button
              onClick={handleLogoClick}
              className="active:opacity-60 transition-opacity flex-shrink-0"
              aria-label="Scroll to top"
            >
              <picture>
                <source srcSet="/lashpop-images/branding/logo-terracotta.webp" type="image/webp" />
                <img
                  src="/lashpop-images/branding/logo-terracotta.png"
                  alt="LashPop Studios"
                  width={68}
                  height={24}
                  className="h-6 w-auto"
                />
              </picture>
            </button>

            {/* Right side: Book Now + Hamburger */}
            <div className="flex items-center gap-3">
              {/* Book Now Button (filled, matches desktop) */}
              <button
                onClick={() => {
                  if (!isHomePage) {
                    router.push('/#services')
                  } else {
                    smoothScrollToElement('#services', 60, 800, 'top')
                  }
                }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-terracotta-light text-white text-[10px] font-sans font-semibold tracking-wide uppercase active:bg-terracotta transition-colors"
              >
                Book Now
              </button>

              {/* Hamburger Menu */}
              <button
                ref={menuButtonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`
                  flex-shrink-0 w-10 h-10 flex flex-col items-center justify-center gap-1.5
                  rounded-lg transition-colors duration-150
                  ${isMenuOpen
                    ? 'bg-terracotta-light/10'
                    : 'active:bg-warm-sand/40'
                  }
                `}
                aria-label="Menu"
              >
                <span
                  className={`block w-5 h-0.5 bg-terracotta-light transition-[transform,opacity] duration-200 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
                />
                <span
                  className={`block w-5 h-0.5 bg-terracotta-light transition-opacity duration-200 ${isMenuOpen ? 'opacity-0' : ''}`}
                />
                <span
                  className={`block w-5 h-0.5 bg-terracotta-light transition-[transform,opacity] duration-200 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
                />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Dropdown Menu */}
      {renderMenu()}
    </>
  )
}
