'use client'

import { motion } from 'framer-motion'
import { Sparkles, Clock, DollarSign, Check, Calendar } from 'lucide-react'
import type { ServiceRecommendation } from '@/lib/discover-look/types'

interface ServiceRecommendationCardProps {
  recommendation: ServiceRecommendation
  onBook: () => void
}

export function ServiceRecommendationCard({ recommendation, onBook }: ServiceRecommendationCardProps) {
  const { service, matchScore, matchReasons } = recommendation

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white border border-sage/15 shadow-lg"
    >
      {/* Header gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dusty-rose via-terracotta to-golden" />

      {/* Content */}
      <div className="p-4">
        {/* Match badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full
                          bg-gradient-to-r from-dusty-rose/10 to-terracotta/10
                          border border-dusty-rose/20">
            <Sparkles className="w-3.5 h-3.5 text-dusty-rose" />
            <span className="text-xs font-semibold text-dusty-rose">
              Perfect Match
            </span>
          </div>
          <span className="text-xs text-dune/50">{service.categoryName}</span>
        </div>

        {/* Service name */}
        <h3 className="text-lg font-semibold text-dune mb-1">
          {service.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-dune/70 mb-3 line-clamp-2">
          {service.description}
        </p>

        {/* Match reasons */}
        <div className="space-y-1.5 mb-4">
          {matchReasons.slice(0, 3).map((reason, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              <span className="text-xs text-dune/70">{reason}</span>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-dune/60">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{service.durationMinutes} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-dune/60">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">${(service.priceStarting / 100).toFixed(0)}+</span>
          </div>
        </div>

        {/* Book button */}
        <motion.button
          onClick={onBook}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2
                     py-3 rounded-xl
                     bg-gradient-to-r from-dusty-rose to-terracotta
                     text-white font-medium
                     shadow-md hover:shadow-lg transition-shadow"
        >
          <Calendar className="w-4 h-4" />
          <span>Book This Service</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
