'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Calendar } from 'lucide-react'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'glass shadow-lg' : 'bg-transparent'
      }`}
      style={{ height: '80px' }}
    >
      <div className="container-wide h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="relative group">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col"
            >
              <span
                className={`text-2xl transition-colors duration-500 ${
                  isScrolled ? 'text-dune' : 'text-cream'
                }`}
                style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}
              >
                LashPop
              </span>
              <span
                className={`caption transition-colors duration-500 ${
                  isScrolled ? 'text-sage' : 'text-warm-sand'
                }`}
              >
                Studios
              </span>
            </motion.div>

            {/* Hover decoration */}
            <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-terracotta scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-8"
            >
              {['About', 'Services', 'Team', 'Contact'].map((item, index) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={`relative group transition-colors duration-300 ${
                    isScrolled ? 'text-dune/80 hover:text-terracotta' : 'text-terracotta hover:text-cream'
                  }`}
                  style={{
                    fontWeight: 300,
                    letterSpacing: '0.05em',
                    fontSize: '0.95rem',
                  }}
                >
                  <span>{item}</span>
                  <span
                    className={`absolute -bottom-2 left-0 right-0 h-[1px] scale-x-0 group-hover:scale-x-100 transition-transform origin-left ${
                      isScrolled ? 'bg-terracotta' : 'bg-warm-sand'
                    }`}
                  />
                </Link>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3"
            >
              <Link
                href="mailto:careers@lashpopstudios.com?subject=Join%20The%20Team"
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${
                  isScrolled
                    ? 'text-terracotta hover:bg-terracotta hover:text-cream'
                    : 'text-cream hover:bg-cream/20'
                }`}
                style={{
                  background: 'transparent',
                  border: isScrolled ? '2px solid rgb(var(--terracotta))' : '2px solid rgba(250, 246, 242, 0.9)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                Work with Us
              </Link>
              <button
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all duration-300"
                style={{
                  background: isScrolled
                    ? 'rgb(var(--rust))'
                    : 'rgb(var(--terracotta))',
                  border: '2px solid transparent',
                  color: 'rgb(var(--cream))',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Calendar className="w-4 h-4" />
                Book Now
              </button>
            </motion.div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-3 rounded-full transition-all ${
              isScrolled
                ? 'text-dune hover:bg-sage/10'
                : 'text-cream hover:bg-cream/10'
            }`}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden glass border-t border-sage/10"
          >
            <nav className="container-wide py-6">
              <div className="flex flex-col gap-4">
                {['About', 'Services', 'Team', 'Contact'].map((item) => (
                  <Link
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-dune/80 hover:text-terracotta transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      fontWeight: 300,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {item}
                  </Link>
                ))}
                <button className="btn btn-primary w-full mt-4">
                  <Calendar className="w-4 h-4" />
                  Book Now
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}