'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { usePanelStack } from '@/contexts/PanelStackContext'

const navItems = [
  { label: 'Services', action: 'open-services' },
  { label: 'Team', href: '#team' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Find Us', href: '#find-us' }
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { actions } = usePanelStack()
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (item: any, e: React.MouseEvent) => {
    if (item.action === 'open-services') {
      e.preventDefault()
      actions.openPanel('category-picker', { entryPoint: 'page' })
    } else if (item.href?.startsWith('#')) {
      e.preventDefault()
      const element = document.querySelector(item.href)
      if (element) {
        const headerOffset = 80 // Adjust for header height
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }
    setIsMobileMenuOpen(false)
  }

    const handleBookNow = () => {
      // Scroll to the content section (past hero)
      // We want the top of the Welcome section to align with the bottom of the services panel stack
      // Header Height: 80px
      // Panel Stack Bar Height: ~64px
      // Total Offset: ~144px
      // So we want the Welcome section top to be at 144px from the top of the viewport.
      // ScrollTop = WelcomeTop - 144px
      // Since WelcomeTop is window.innerHeight (after Hero), we scroll to window.innerHeight - 144.
      const headerHeight = 80
      const panelStackHeight = 64
      const totalOffset = headerHeight + panelStackHeight

      window.scrollTo({
        top: window.innerHeight - totalOffset,
        behavior: 'smooth'
      })
      
      // Open the panel
      actions.openPanel('category-picker', { entryPoint: 'page' })
    }
  
  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled ? 'glass backdrop-blur-md py-4' : 'py-6'
        }`}
      >
        <div className="container-wide">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2"
              >
                <Image
                  src="/lashpop-images/branding/logo.png"
                  alt="LashPop Studios"
                  width={120}
                  height={40}
                  className="h-8 w-auto brightness-0 saturate-100"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(73%) sepia(10%) saturate(633%) hue-rotate(313deg) brightness(94%) contrast(88%)'
                  }}
                  priority
                />
              </motion.div>
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="caption text-dune/70 hover:text-dusty-rose transition-colors duration-300 leading-none flex items-center h-8"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    onClick={(e) => handleNavClick(item, e)}
                    className="caption text-dune/70 hover:text-dusty-rose transition-colors duration-300 leading-none flex items-center h-8 uppercase tracking-widest"
                  >
                    {item.label}
                  </button>
                )
              ))}
              <button 
                className="btn btn-primary ml-4"
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
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="btn btn-primary mt-8"
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
