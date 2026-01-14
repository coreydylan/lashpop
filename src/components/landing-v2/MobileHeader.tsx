'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

  // Get current section label for display
  const currentSectionLabel = SECTIONS.find(s => s.id === currentSection)?.label || ''

  // Determine if we're in a section that should show the header
  const shouldShowHeader = HEADER_VISIBLE_SECTIONS.includes(currentSection)

  // Get the scroll container (mobile uses .mobile-scroll-container)
  const getScrollContainer = useCallback(() => {
    return document.querySelector('.mobile-scroll-container') as HTMLElement | null
  }, [])

  // Track scroll position for transparent/frosted glass transition
  useEffect(() => {
    const scrollContainer = getScrollContainer()
    if (!scrollContainer) return

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 20)
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [getScrollContainer])

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

    const scrollContainer = getScrollContainer()
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      smoothScrollTo(0, 1000, getScroller())
    }
  }, [getScrollContainer, registerLogoClick])

  // Handle menu item click
  const handleMenuItemClick = useCallback((item: MenuItem) => {
    setIsMenuOpen(false)

    // Handle page links (non-hash links)
    if (!item.href.startsWith('#')) {
      window.location.href = item.href
      return
    }

    if (item.href === '#gallery' || item.href === '#reviews') {
      smoothScrollToElement(item.href, 60, 800, 'center')
    } else if (item.href === '#faq') {
      smoothScrollToElement(item.href, 140, 800, 'top')
    } else if (item.href === '#services') {
      smoothScrollToElement(item.href, 0, 800, 'top')
    } else {
      smoothScrollToElement(item.href, 60, 800, 'top')
    }
  }, [])

  // Render the dropdown menu (inline, not portal - portal was breaking on mobile)
  const renderMenu = () => {
    if (!isMenuOpen) return null

    return (
      <div
        ref={menuRef}
        className="fixed z-[9999] rounded-xl overflow-hidden"
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          minWidth: 140,
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
                  <div className="w-1 h-1 rounded-full bg-terracotta/60" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mini Header - transparent at top, frosted glass on scroll */}
      {isVisible && (
        <header
          className="fixed top-0 left-0 right-0 z-50 md:hidden transition-all duration-300"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            background: isScrolled
              ? 'rgba(250, 246, 242, 0.95)'
              : 'transparent',
            backdropFilter: isScrolled ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
          }}
        >
          <div className="px-5 flex items-center justify-between" style={{ height: '60px' }}>
            {/* LashPop Logo - Left */}
            <button
              onClick={handleLogoClick}
              className="active:opacity-60 transition-opacity flex-shrink-0"
              aria-label="Scroll to top"
            >
              <img
                src="/lashpop-images/branding/logo-terracotta.png"
                alt="LashPop Studios"
                className="h-6 w-auto"
              />
            </button>

            {/* Right side: Book Now + Hamburger */}
            <div className="flex items-center gap-3">
              {/* Book Now Button (filled, matches desktop) */}
              <button
                onClick={() => smoothScrollToElement('#services', 0, 800, 'top')}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-terracotta-light text-white text-[10px] font-sans font-semibold tracking-wide uppercase active:bg-terracotta transition-all"
              >
                Book
              </button>

              {/* Hamburger Menu */}
              <button
                ref={menuButtonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`
                  flex-shrink-0 w-10 h-10 flex flex-col items-center justify-center gap-1.5
                  rounded-lg transition-all duration-150
                  ${isMenuOpen
                    ? 'bg-terracotta-light/10'
                    : 'active:bg-warm-sand/40'
                  }
                `}
                aria-label="Menu"
              >
                <span
                  className={`block w-5 h-0.5 bg-terracotta-light transition-all duration-200 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
                />
                <span
                  className={`block w-5 h-0.5 bg-terracotta-light transition-all duration-200 ${isMenuOpen ? 'opacity-0' : ''}`}
                />
                <span
                  className={`block w-5 h-0.5 bg-terracotta-light transition-all duration-200 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
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
