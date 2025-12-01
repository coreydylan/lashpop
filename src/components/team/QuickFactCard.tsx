'use client'

import { motion } from 'framer-motion'
import {
  Coffee,
  Wine,
  Tv,
  Film,
  Heart,
  Sparkles,
  Star,
  PawPrint,
  Music,
  UtensilsCrossed,
  BookOpen,
  Plane,
  Trophy,
  Sparkle,
  Info,
  type LucideIcon
} from 'lucide-react'

export interface QuickFact {
  id: string
  factType: string
  customLabel?: string | null
  value: string
  customIcon?: string | null
  displayOrder: number
}

// Icon mapping for quick fact types
const ICON_MAP: Record<string, LucideIcon> = {
  coffee: Coffee,
  wine: Wine,
  drink: Wine,
  tv: Tv,
  tv_show: Tv,
  film: Film,
  movie: Film,
  heart: Heart,
  hobby: Heart,
  sparkles: Sparkles,
  hidden_talent: Sparkles,
  star: Star,
  fun_fact: Star,
  'paw-print': PawPrint,
  pet: PawPrint,
  music: Music,
  utensils: UtensilsCrossed,
  food: UtensilsCrossed,
  'book-open': BookOpen,
  book: BookOpen,
  plane: Plane,
  travel: Plane,
  trophy: Trophy,
  sport: Trophy,
  sparkle: Sparkle,
  zodiac: Sparkle,
  info: Info,
  custom: Info,
}

// Default labels for fact types
const DEFAULT_LABELS: Record<string, string> = {
  coffee: "Go-To Coffee",
  drink: "Favorite Drink",
  tv_show: "Favorite TV Show",
  movie: "Favorite Movie",
  hobby: "Hobby",
  hidden_talent: "Hidden Talent",
  fun_fact: "Fun Fact",
  pet: "Pet",
  music: "Favorite Music",
  food: "Favorite Food",
  book: "Favorite Book",
  travel: "Dream Destination",
  sport: "Sport",
  zodiac: "Zodiac Sign",
  custom: "Quick Fact",
}

// Color gradients for different fact types
const COLOR_SCHEMES: Record<string, { bg: string; iconBg: string; iconColor: string; border: string }> = {
  coffee: {
    bg: 'from-amber-50/80 to-orange-50/60',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    border: 'border-amber-200/50',
  },
  drink: {
    bg: 'from-rose-50/80 to-pink-50/60',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-500',
    border: 'border-rose-200/50',
  },
  tv_show: {
    bg: 'from-violet-50/80 to-purple-50/60',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    border: 'border-violet-200/50',
  },
  movie: {
    bg: 'from-indigo-50/80 to-blue-50/60',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    border: 'border-indigo-200/50',
  },
  hobby: {
    bg: 'from-pink-50/80 to-rose-50/60',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-500',
    border: 'border-pink-200/50',
  },
  hidden_talent: {
    bg: 'from-amber-50/80 to-yellow-50/60',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-500',
    border: 'border-amber-200/50',
  },
  fun_fact: {
    bg: 'from-dusty-rose/20 to-warm-sand/30',
    iconBg: 'bg-dusty-rose/20',
    iconColor: 'text-dusty-rose',
    border: 'border-dusty-rose/20',
  },
  pet: {
    bg: 'from-emerald-50/80 to-teal-50/60',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-200/50',
  },
  music: {
    bg: 'from-fuchsia-50/80 to-purple-50/60',
    iconBg: 'bg-fuchsia-100',
    iconColor: 'text-fuchsia-600',
    border: 'border-fuchsia-200/50',
  },
  food: {
    bg: 'from-orange-50/80 to-red-50/60',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    border: 'border-orange-200/50',
  },
  book: {
    bg: 'from-sky-50/80 to-cyan-50/60',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    border: 'border-sky-200/50',
  },
  travel: {
    bg: 'from-cyan-50/80 to-blue-50/60',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    border: 'border-cyan-200/50',
  },
  sport: {
    bg: 'from-yellow-50/80 to-amber-50/60',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    border: 'border-yellow-200/50',
  },
  zodiac: {
    bg: 'from-purple-50/80 to-violet-50/60',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-purple-200/50',
  },
  custom: {
    bg: 'from-sage/10 to-sage/5',
    iconBg: 'bg-sage/20',
    iconColor: 'text-sage',
    border: 'border-sage/20',
  },
}

interface QuickFactCardProps {
  fact: QuickFact
  index?: number
  compact?: boolean
}

export function QuickFactCard({ fact, index = 0, compact = false }: QuickFactCardProps) {
  const Icon = ICON_MAP[fact.customIcon || fact.factType] || ICON_MAP[fact.factType] || Info
  const label = fact.customLabel || DEFAULT_LABELS[fact.factType] || 'Quick Fact'
  const colors = COLOR_SCHEMES[fact.factType] || COLOR_SCHEMES.custom

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05, duration: 0.2 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${colors.bg} border ${colors.border}`}
      >
        <div className={`w-6 h-6 rounded-lg ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${colors.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-wider text-dune/50 block">{label}</span>
          <span className="text-xs text-dune/80 truncate block">{fact.value}</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} p-4`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs uppercase tracking-wider text-dune/50 font-medium mb-0.5">
            {label}
          </h4>
          <p className="text-sm text-dune/90 leading-relaxed">
            {fact.value}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

interface QuickFactsGridProps {
  facts: QuickFact[]
  compact?: boolean
  className?: string
}

export function QuickFactsGrid({ facts, compact = false, className = '' }: QuickFactsGridProps) {
  if (!facts || facts.length === 0) return null

  const sortedFacts = [...facts].sort((a, b) => a.displayOrder - b.displayOrder)

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {sortedFacts.map((fact, index) => (
          <QuickFactCard key={fact.id} fact={fact} index={index} compact />
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {sortedFacts.map((fact, index) => (
        <QuickFactCard key={fact.id} fact={fact} index={index} />
      ))}
    </div>
  )
}
