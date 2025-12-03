'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePanelStack } from '@/contexts/PanelStackContext'
import { useDevMode } from '@/contexts/DevModeContext'
import { smoothScrollToElement, smoothScrollTo, getScroller } from '@/lib/smoothScroll'

// Section mapping for display names and navigation
const SECTIONS = [
  { id: 'team', label: 'TEAM', href: '#team' },
  { id: 'instagram', label: 'GALLERY', href: '#gallery' },
  { id: 'reviews', label: 'REVIEWS', href: '#reviews' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
  { id: 'map', label: 'FIND US', href: '#find-us' },
  { id: 'footer', label: 'FIND US', href: '#find-us' }, // Footer shows same as map
] as const

// Menu item type
interface MenuItem {
  id: string
  label: string
  href?: string
  action?: string
}

// Menu items (includes Services which opens bottom sheet)
const MENU_ITEMS: MenuItem[] = [
  { id: 'services', label: 'SERVICES', action: 'open-services' },
  { id: 'team', label: 'TEAM', href: '#team' },
  { id: 'instagram', label: 'GALLERY', href: '#gallery' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
  { id: 'reviews', label: 'REVIEWS', href: '#reviews' },
  { id: 'map', label: 'FIND US', href: '#find-us' },
]

// Sections that should show the header (team and below)
const HEADER_VISIBLE_SECTIONS = ['team', 'instagram', 'reviews', 'faq', 'map', 'footer']

interface MobileHeaderProps {
  currentSection?: string
}

export function MobileHeader({ currentSection = '' }: MobileHeaderProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 56, right: 20 })
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { actions, state } = usePanelStack()
  const { registerLogoClick } = useDevMode()

  // Get current section label for display
  const currentSectionLabel = SECTIONS.find(s => s.id === currentSection)?.label || ''

  // Determine if we're in a section that should show the header
  const shouldShowHeader = HEADER_VISIBLE_SECTIONS.includes(currentSection)

  // Get the scroll container (mobile uses .mobile-scroll-container)
  const getScrollContainer = useCallback(() => {
    return document.querySelector('.mobile-scroll-container') as HTMLElement | null
  }, [])

  // Handle visibility based on scroll position relative to team section
  useEffect(() => {
    const scrollContainer = getScrollContainer()
    if (!scrollContainer) return

    const checkVisibility = () => {
      const teamSection = document.querySelector('[data-section-id="team"]')
      if (!teamSection) return

      const teamRect = teamSection.getBoundingClientRect()
      // Show header when team section top reaches the top of viewport (or above)
      setIsVisible(teamRect.top <= 60)
    }

    scrollContainer.addEventListener('scroll', checkVisibility, { passive: true })
    checkVisibility()

    return () => scrollContainer.removeEventListener('scroll', checkVisibility)
  }, [getScrollContainer])

  // Update menu position when opened
  useEffect(() => {
    if (isMenuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
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

    if (item.action === 'open-services') {
      const hasCategoryPicker = state.panels.some(p => p.type === 'category-picker')
      if (hasCategoryPicker) {
        // Chip bar already visible - trigger attention bounce
        actions.triggerAttentionBounce()
      } else {
        // Open in collapsed state (chip bar) with bounce
        actions.openPanel('category-picker', { entryPoint: 'page' }, { autoExpand: false })
        setTimeout(() => {
          actions.triggerAttentionBounce()
        }, 400)
      }
    } else if (item.href) {
      if (item.href === '#gallery' || item.href === '#reviews') {
        smoothScrollToElement(item.href, 60, 800, 'center')
      } else if (item.href === '#faq') {
        smoothScrollToElement(item.href, 140, 800, 'top')
      } else {
        smoothScrollToElement(item.href, 60, 800, 'top')
      }
    }
  }, [actions, state.panels])

  // Render the dropdown menu (inline, not portal - portal was breaking on mobile)
  const renderMenu = () => {
    if (!isMenuOpen) return null

    return (
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.96, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -4 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="fixed z-[9999] rounded-xl overflow-hidden"
        style={{
          top: menuPosition.top,
          right: menuPosition.right,
          minWidth: 140,
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.94) 0%, rgba(250, 247, 244, 0.94) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(161, 151, 129, 0.12)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div className="py-1.5">
          {MENU_ITEMS.map((item, index) => {
            const isActive = item.id === currentSection ||
              (item.id === 'map' && currentSection === 'footer')

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.025, duration: 0.15 }}
                onClick={() => handleMenuItemClick(item)}
                className={`
                  w-full flex items-center justify-between gap-3 px-4 py-2.5
                  text-left transition-colors duration-150
                  ${isActive
                    ? 'bg-dusty-rose/8'
                    : 'active:bg-warm-sand/50'
                  }
                `}
              >
                <span className={`
                  text-[11px] font-medium tracking-wide
                  ${isActive ? 'text-dusty-rose' : 'text-dune/70'}
                `}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-dusty-rose/60" />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    )
  }

  return (
    <>
      {/* Mini Header - LP logo + Section indicator (only shows from team section) */}
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.header
            key="mini-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 left-0 right-0 z-50 md:hidden"
            style={{
              height: 'var(--mobile-header-height)',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 247, 244, 0.92) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(161, 151, 129, 0.08)',
            }}
          >
            <div className="h-full px-5 flex items-center justify-between">
              {/* LP Logo - subtle, balanced size */}
              <button
                onClick={handleLogoClick}
                className="active:opacity-60 transition-opacity"
                aria-label="Scroll to top"
              >
                <div
                  className="h-4 w-8"
                  style={{
                    maskImage: 'url(/lashpop-images/lp-logo.png)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'left center',
                    WebkitMaskImage: 'url(/lashpop-images/lp-logo.png)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'left center',
                    backgroundColor: 'rgba(138, 94, 85, 0.7)'
                  }}
                />
              </button>

              {/* Section Indicator / Menu Trigger */}
              <button
                ref={menuButtonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`
                  flex items-center gap-1.5 py-1 px-2 -mr-2 rounded-lg
                  transition-all duration-150
                  ${isMenuOpen
                    ? 'bg-dusty-rose/10'
                    : 'active:bg-warm-sand/40'
                  }
                `}
              >
                {/* Section label with scroll animation */}
                <div className="h-4 overflow-hidden relative">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={shouldShowHeader && currentSectionLabel ? currentSectionLabel : 'Menu'}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="block text-[10px] font-semibold tracking-widest text-dune/50 uppercase leading-4"
                    >
                      {shouldShowHeader && currentSectionLabel ? currentSectionLabel : 'Menu'}
                    </motion.span>
                  </AnimatePresence>
                </div>
                {/* Subtle chevron indicator */}
                <svg
                  className={`w-3 h-3 text-dune/40 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {renderMenu()}
      </AnimatePresence>
    </>
  )
}
