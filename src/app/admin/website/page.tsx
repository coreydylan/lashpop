"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Image, 
  Users, 
  Star, 
  Instagram, 
  FileText, 
  HelpCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'

const sections = [
  { 
    id: 'hero', 
    label: 'Hero Section', 
    icon: Image, 
    description: 'Manage the above-the-fold hero image displayed in the arch shape',
    color: 'dusty-rose',
    stats: 'DAM Integration'
  },
  { 
    id: 'founder-letter', 
    label: 'Founder Letter', 
    icon: FileText, 
    description: 'Emily\'s welcome message and signature section',
    color: 'sage',
    stats: 'HTML Source'
  },
  { 
    id: 'team', 
    label: 'Team Members', 
    icon: Users, 
    description: 'Manage team visibility, order, and profile information',
    color: 'ocean-mist',
    stats: 'Database + Vagaro'
  },
  { 
    id: 'instagram', 
    label: 'Instagram Carousel', 
    icon: Instagram, 
    description: 'Set the number of posts and display settings',
    color: 'terracotta',
    stats: 'DAM Integration'
  },
  { 
    id: 'reviews', 
    label: 'Reviews', 
    icon: Star, 
    description: 'Select and order which reviews appear on the homepage',
    color: 'golden',
    stats: 'Database'
  },
  { 
    id: 'faq', 
    label: 'FAQ Manager', 
    icon: HelpCircle, 
    description: 'Manage FAQ categories, questions, and featured items',
    color: 'sage',
    stats: 'Database'
  },
]

const colorMap: Record<string, string> = {
  'dusty-rose': 'from-dusty-rose/20 to-dusty-rose/5 border-dusty-rose/20 hover:border-dusty-rose/40',
  'golden': 'from-golden/20 to-golden/5 border-golden/20 hover:border-golden/40',
  'sage': 'from-sage/20 to-sage/5 border-sage/20 hover:border-sage/40',
  'ocean-mist': 'from-ocean-mist/20 to-ocean-mist/5 border-ocean-mist/20 hover:border-ocean-mist/40',
  'terracotta': 'from-terracotta/20 to-terracotta/5 border-terracotta/20 hover:border-terracotta/40',
}

const iconColorMap: Record<string, string> = {
  'dusty-rose': 'text-dusty-rose',
  'golden': 'text-golden',
  'sage': 'text-sage',
  'ocean-mist': 'text-ocean-mist',
  'terracotta': 'text-terracotta',
}

export default function WebsiteAdminPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center shadow-lg">
            <Sparkles className="w-7 h-7 text-cream" />
          </div>
          <div>
            <h1 className="h2 text-dune">Landing Page Editor</h1>
            <p className="text-dune/60">Select a section to customize your website</p>
          </div>
        </div>
      </motion.div>

      {/* Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link href={`/admin/website/${section.id}`}>
              <div 
                className={`group relative h-full p-6 rounded-3xl bg-gradient-to-br ${colorMap[section.color]} border backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl bg-cream/80 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                  <section.icon className={`w-6 h-6 ${iconColorMap[section.color]}`} />
                </div>

                {/* Content */}
                <h2 className="font-serif text-lg text-dune font-medium mb-2">
                  {section.label}
                </h2>
                <p className="text-sm text-dune/60 mb-4 leading-relaxed">
                  {section.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dune/40 uppercase tracking-wider font-medium">
                    {section.stats}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-cream/50 flex items-center justify-center group-hover:bg-cream transition-colors">
                    <ArrowRight className="w-4 h-4 text-dune/60 group-hover:text-dune group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-10 p-6 bg-cream/60 backdrop-blur-sm rounded-3xl border border-sage/10"
      >
        <h3 className="font-serif text-lg text-dune mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-dune/70">
          <li className="flex items-start gap-2">
            <span className="text-golden">•</span>
            <span>Hero images are managed through the <strong>DAM</strong> - tag them with &quot;Website: Hero&quot; to make available</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-mist">•</span>
            <span><strong>Team visibility</strong> changes take effect immediately - toggle the eye icon to show/hide members</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-dusty-rose">•</span>
            <span><strong>Review order</strong> can be customized - drag to reorder featured reviews on the homepage</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-terracotta">•</span>
            <span>Instagram posts sync automatically from your connected account via the DAM</span>
          </li>
        </ul>
      </motion.div>
    </div>
  )
}

