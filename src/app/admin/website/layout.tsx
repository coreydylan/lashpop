"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Image, 
  Users, 
  Star, 
  Instagram, 
  FileText, 
  ChevronLeft,
  Menu,
  X,
  Sparkles
} from 'lucide-react'

const sections = [
  { id: 'hero', label: 'Hero Section', icon: Image, description: 'Above the fold image & arch' },
  { id: 'founder-letter', label: 'Founder Letter', icon: FileText, description: 'Emily\'s message' },
  { id: 'team', label: 'Team', icon: Users, description: 'Team members & visibility' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, description: 'IG carousel settings' },
  { id: 'reviews', label: 'Reviews', icon: Star, description: 'Review selection & order' },
]

export default function WebsiteAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const currentSection = sections.find(s => pathname?.includes(s.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-warm-sand/50 to-dusty-rose/20">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-xl border-b border-sage/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin/website" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cream" />
            </div>
            <span className="font-serif text-dune font-medium">Website Admin</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-sage/10"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-dune" />
            ) : (
              <Menu className="w-5 h-5 text-dune" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-sage/10 bg-cream/95 backdrop-blur-xl"
            >
              <nav className="p-4 space-y-2">
                {sections.map((section) => {
                  const isActive = pathname?.includes(section.id)
                  return (
                    <Link
                      key={section.id}
                      href={`/admin/website/${section.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                        isActive
                          ? 'bg-dusty-rose/20 border border-dusty-rose/30'
                          : 'hover:bg-sage/10'
                      }`}
                    >
                      <section.icon className={`w-5 h-5 ${isActive ? 'text-terracotta' : 'text-dune/60'}`} />
                      <div>
                        <div className={`text-sm font-medium ${isActive ? 'text-dune' : 'text-dune/80'}`}>
                          {section.label}
                        </div>
                        <div className="text-xs text-dune/50">{section.description}</div>
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-cream/80 backdrop-blur-xl border-r border-sage/10 px-6 py-8">
          {/* Logo */}
          <Link href="/admin/website" className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-cream" />
            </div>
            <div>
              <div className="font-serif text-lg text-dune font-medium">Website Admin</div>
              <div className="text-xs text-dune/50">Section Editor</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <div className="text-xs uppercase tracking-wider text-dune/40 font-medium mb-3">
              Landing Page Sections
            </div>
            <ul role="list" className="space-y-1.5">
              {sections.map((section) => {
                const isActive = pathname?.includes(section.id)
                return (
                  <li key={section.id}>
                    <Link
                      href={`/admin/website/${section.id}`}
                      className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-dusty-rose/20 to-terracotta/10 border border-dusty-rose/20 shadow-sm'
                          : 'hover:bg-sage/10 border border-transparent'
                      }`}
                    >
                      <section.icon 
                        className={`w-5 h-5 flex-shrink-0 ${
                          isActive ? 'text-terracotta' : 'text-dune/50 group-hover:text-dune/70'
                        }`} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${isActive ? 'text-dune' : 'text-dune/70'}`}>
                          {section.label}
                        </div>
                        <div className="text-xs text-dune/40 truncate">
                          {section.description}
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Back to DAM */}
          <div className="border-t border-sage/10 pt-4">
            <Link
              href="/dam"
              className="flex items-center gap-2 text-sm text-dune/60 hover:text-dune transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to DAM
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}

