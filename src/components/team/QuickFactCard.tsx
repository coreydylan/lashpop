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

interface QuickFactCardProps {
  fact: QuickFact
  index?: number
  compact?: boolean
}

export function QuickFactCard({ fact, index = 0, compact = false }: QuickFactCardProps) {
  const Icon = ICON_MAP[fact.customIcon || fact.factType] || ICON_MAP[fact.factType] || Info
  const label = fact.customLabel || DEFAULT_LABELS[fact.factType] || 'Quick Fact'

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05, duration: 0.2 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 shadow-sm"
      >
        <div className="w-6 h-6 rounded-lg bg-dusty-rose/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-dusty-rose" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-wider text-dune/50 block">{label}</span>
          <span className="text-xs text-dune/80 truncate block">{fact.value}</span>
        </div>
      </motion.div>
    )
  }

  // Frosted glass card style matching the landing page design system
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl bg-white/50 backdrop-blur-xl border border-white/60 shadow-lg p-4 h-full"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-dusty-rose/5 via-transparent to-sage/5" />

      <div className="relative flex items-start gap-3">
        {/* Icon container - frosted pill style */}
        <div className="w-10 h-10 rounded-xl bg-dusty-rose/10 backdrop-blur-sm border border-dusty-rose/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-dusty-rose" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs uppercase tracking-wider text-dune/50 font-medium mb-1">
            {label}
          </h4>
          <p className="text-sm text-dune leading-relaxed">
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
