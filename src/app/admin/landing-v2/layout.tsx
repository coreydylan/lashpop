"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Image,
  Grid3x3,
  FileText,
  Users,
  Instagram,
  Star,
  HelpCircle,
  ChevronRight
} from "lucide-react"

const sections = [
  { key: "overview", name: "Overview", href: "/admin/landing-v2", icon: LayoutDashboard },
  { key: "hero", name: "Hero Section", href: "/admin/landing-v2/hero", icon: Image },
  { key: "grid-scroller", name: "Grid Scroller", href: "/admin/landing-v2/grid-scroller", icon: Grid3x3 },
  { key: "founder-letter", name: "Founder Letter", href: "/admin/landing-v2/founder-letter", icon: FileText },
  { key: "team", name: "Team", href: "/admin/landing-v2/team", icon: Users },
  { key: "instagram", name: "Instagram", href: "/admin/landing-v2/instagram", icon: Instagram },
  { key: "reviews", name: "Reviews", href: "/admin/landing-v2/reviews", icon: Star },
  { key: "faqs", name: "FAQs", href: "/admin/landing-v2/faqs", icon: HelpCircle }
]

export default function LandingV2AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-warm-sand to-dusty-rose/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="h2 text-dune">Landing Page v2 Admin</h1>
              <p className="text-sm text-dune/60 mt-1">Manage your landing page sections</p>
            </div>
            <Link
              href="/landing-v2"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-ocean-mist/10 text-ocean-mist border border-ocean-mist/30 rounded-full hover:bg-ocean-mist/20 transition-all font-light text-sm"
            >
              <span>Preview Live</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="col-span-3"
          >
            <nav className="glass border border-sage/20 rounded-3xl p-4 shadow-xl sticky top-8">
              <div className="space-y-1">
                {sections.map((section) => {
                  const isActive = pathname === section.href
                  const Icon = section.icon

                  return (
                    <Link
                      key={section.key}
                      href={section.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-light ${
                        isActive
                          ? "bg-gradient-to-r from-dusty-rose/20 to-terracotta/20 text-dune border border-dusty-rose/30"
                          : "text-dune/60 hover:text-dune hover:bg-cream/50"
                      }`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-sm">{section.name}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>
          </motion.aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-9"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  )
}
