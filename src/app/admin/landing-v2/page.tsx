"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Image,
  Grid3x3,
  FileText,
  Users,
  Instagram,
  Star,
  HelpCircle,
  ChevronRight,
  Eye,
  EyeOff,
  Settings
} from "lucide-react"

interface SectionStatus {
  key: string
  name: string
  icon: any
  href: string
  isVisible: boolean
  displayOrder: number
  configured: boolean
  description: string
}

export default function LandingV2AdminOverview() {
  const [sections, setSections] = useState<SectionStatus[]>([
    {
      key: "hero",
      name: "Hero Section",
      icon: Image,
      href: "/admin/landing-v2/hero",
      isVisible: true,
      displayOrder: 1,
      configured: false,
      description: "Above-the-fold hero with arch image"
    },
    {
      key: "grid-scroller",
      name: "Grid Scroller",
      icon: Grid3x3,
      href: "/admin/landing-v2/grid-scroller",
      isVisible: true,
      displayOrder: 2,
      configured: false,
      description: "Photo grid with scroll animations"
    },
    {
      key: "founder-letter",
      name: "Founder Letter",
      icon: FileText,
      href: "/admin/landing-v2/founder-letter",
      isVisible: true,
      displayOrder: 3,
      configured: false,
      description: "Founder message and story"
    },
    {
      key: "team",
      name: "Team Section",
      icon: Users,
      href: "/admin/landing-v2/team",
      isVisible: true,
      displayOrder: 4,
      configured: true,
      description: "Team members and bios"
    },
    {
      key: "instagram",
      name: "Instagram Carousel",
      icon: Instagram,
      href: "/admin/landing-v2/instagram",
      isVisible: true,
      displayOrder: 5,
      configured: false,
      description: "Instagram feed carousel"
    },
    {
      key: "reviews",
      name: "Reviews",
      icon: Star,
      href: "/admin/landing-v2/reviews",
      isVisible: true,
      displayOrder: 6,
      configured: false,
      description: "Customer testimonials and reviews"
    },
    {
      key: "faqs",
      name: "FAQs",
      icon: HelpCircle,
      href: "/admin/landing-v2/faqs",
      isVisible: true,
      displayOrder: 7,
      configured: false,
      description: "Frequently asked questions"
    }
  ])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch section status from API
    // For now, using static data
    setLoading(false)
  }, [])

  const toggleVisibility = async (sectionKey: string) => {
    // TODO: Implement API call to toggle visibility
    setSections(sections.map(s =>
      s.key === sectionKey ? { ...s, isVisible: !s.isVisible } : s
    ))
  }

  if (loading) {
    return (
      <div className="glass border border-sage/20 rounded-3xl p-12 shadow-xl flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass border border-sage/20 rounded-2xl p-6 shadow-lg">
          <div className="text-3xl font-light text-dune mb-1">
            {sections.length}
          </div>
          <div className="text-sm text-dune/60">Total Sections</div>
        </div>
        <div className="glass border border-sage/20 rounded-2xl p-6 shadow-lg">
          <div className="text-3xl font-light text-ocean-mist mb-1">
            {sections.filter(s => s.isVisible).length}
          </div>
          <div className="text-sm text-dune/60">Active Sections</div>
        </div>
        <div className="glass border border-sage/20 rounded-2xl p-6 shadow-lg">
          <div className="text-3xl font-light text-terracotta mb-1">
            {sections.filter(s => s.configured).length}
          </div>
          <div className="text-sm text-dune/60">Configured</div>
        </div>
      </div>

      {/* Sections List */}
      <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-dune">Page Sections</h2>
          <div className="text-sm text-dune/60">
            Drag to reorder (coming soon)
          </div>
        </div>

        <div className="space-y-3">
          {sections.sort((a, b) => a.displayOrder - b.displayOrder).map((section, index) => {
            const Icon = section.icon

            return (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  section.isVisible
                    ? "bg-cream/50 border-sage/10 hover:border-dusty-rose/20"
                    : "bg-dune/5 border-dune/10 opacity-60"
                }`}
              >
                {/* Order Badge */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-dune/10 text-dune/60 text-sm font-light">
                  {section.displayOrder}
                </div>

                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${
                  section.configured
                    ? "bg-gradient-to-br from-ocean-mist/30 to-ocean-mist/20 border border-ocean-mist/30"
                    : "bg-dune/10 border border-dune/20"
                }`}>
                  <Icon className={`w-6 h-6 ${section.configured ? "text-ocean-mist" : "text-dune/40"}`} strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-dune">{section.name}</h3>
                    {section.configured && (
                      <div className="px-2 py-0.5 bg-ocean-mist/20 text-ocean-mist rounded-full text-xs font-semibold uppercase tracking-wide border border-ocean-mist/30">
                        Configured
                      </div>
                    )}
                    {!section.isVisible && (
                      <div className="px-2 py-0.5 bg-dune/20 text-dune/60 rounded-full text-xs font-semibold uppercase tracking-wide border border-dune/30">
                        Hidden
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-dune/60">{section.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisibility(section.key)}
                    className={`p-2 rounded-full transition-all ${
                      section.isVisible
                        ? "bg-ocean-mist/10 text-ocean-mist hover:bg-ocean-mist/20"
                        : "bg-dune/10 text-dune/40 hover:bg-dune/20"
                    }`}
                    title={section.isVisible ? "Hide section" : "Show section"}
                  >
                    {section.isVisible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  <Link
                    href={section.href}
                    className="flex items-center gap-2 px-4 py-2 bg-dusty-rose/10 text-dusty-rose border border-dusty-rose/30 rounded-full hover:bg-dusty-rose/20 transition-all font-light text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configure</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Help Text */}
      <div className="glass border border-golden/20 rounded-2xl p-4 bg-golden/10">
        <p className="text-sm text-dune/70">
          <strong>Quick Start:</strong> Click on any section to configure its content and settings.
          Use the visibility toggle to show/hide sections from the live page.
        </p>
      </div>
    </div>
  )
}
