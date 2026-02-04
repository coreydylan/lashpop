'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useDevMode } from '@/contexts/DevModeContext'
import { smoothScrollTo, smoothScrollToElement, getScroller } from '@/lib/smoothScroll'

const navItems = [
  { label: 'Services', href: '#services' },
  { label: 'Team', href: '#team' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Find Us', href: '#find-us' },
]

export function Navigation() {
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

      // On home page, smooth scroll to the section
      if (item.href === '#gallery' || item.href === '#reviews') {
        smoothScrollToElement(item.href, 80, 1000, 'center')
      } else if (item.href === '#faq') {
        // Special alignment for FAQ to show selectors below header
        smoothScrollToElement(item.href, 180, 1000, 'top')
      } else {
        smoothScrollToElement(item.href, 80, 1000, 'top')
      }
    }
    setIsMobileMenuOpen(false)
  }

    const handleBookNow = () => {
      // If not on home page, navigate there with the anchor
      if (!isHomePage) {
        router.push('/#services')
        return
      }
      // Scroll to the services section
      smoothScrollToElement('#services', 80, 1000, 'top')
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
                    src="/lashpop-images/branding/logo-terracotta-optimized.png"
                    alt="LashPop Studios"
                    width={120}
                    height={42}
                    className={`w-auto transition-all duration-300 ${mobileScrolled ? 'h-5' : 'h-8'}`}
                  />
                </picture>
              </motion.div>
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className="caption hover:opacity-80 transition-colors duration-300 leading-none flex items-center h-8"
                    style={{ color: '#b14e33' }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    onClick={(e) => handleNavClick(item, e)}
                    className="caption hover:opacity-80 transition-colors duration-300 leading-none flex items-center h-8 uppercase tracking-widest"
                    style={{ color: '#b14e33' }}
                  >
                    {item.label}
                  </button>
                )
              ))}
              <Link
                href="/work-with-us"
                className="btn ml-4 transition-colors duration-300 hover:opacity-90"
                style={{
                  backgroundColor: 'transparent',
                  border: '1.5px solid #b14e33',
                  color: '#b14e33'
                }}
              >
                Work With Us
              </Link>
              <button
                className="btn text-cream transition-colors duration-300 hover:opacity-90"
                style={{ backgroundColor: '#b14e33' }}
                onClick={handleBookNow}
              >
                Book Now
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-8 h-8 flex flex-col justify-center gap-1.5"
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
            className="fixed inset-0 bg-cream z-30 md:hidden"
          >
            <div className="flex flex-col justify-center items-center h-full space-y-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavClick(item, e)}
                      className="text-2xl font-light text-dune"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => handleNavClick(item, e)}
                      className="text-2xl font-light text-dune"
                    >
                      {item.label}
                    </button>
                  )}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/work-with-us"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn mt-8"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1.5px solid #b14e33',
                    color: '#b14e33'
                  }}
                >
                  Work With Us
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
                Book Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
