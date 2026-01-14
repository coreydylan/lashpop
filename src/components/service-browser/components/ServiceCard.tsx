'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Clock, DollarSign } from 'lucide-react'
import type { Service } from '../ServiceBrowserContext'

interface ServiceCardProps {
  service: Service
  index: number
  onClick: () => void
}

export function ServiceCard({ service, index, onClick }: ServiceCardProps) {
  const priceDisplay = service.priceStarting
    ? `$${(service.priceStarting / 100).toFixed(0)}+`
    : null

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex flex-col bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/40 shadow-sm hover:shadow-md transition-shadow text-left"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full bg-sage/10">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sage/40 font-display text-lg">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 md:p-4">
        <h3 className="font-display font-medium text-charcoal text-sm md:text-base line-clamp-2 mb-1">
          {service.name}
        </h3>

        {service.subtitle && (
          <p className="text-xs text-dusty-rose italic mb-2 line-clamp-1">
            {service.subtitle}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-auto pt-2 text-xs text-dune/70">
          {service.durationMinutes > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{service.durationMinutes}m</span>
            </div>
          )}
          {priceDisplay && (
            <div className="flex items-center gap-0.5">
              <DollarSign className="w-3.5 h-3.5 text-terracotta" />
              <span className="font-medium text-dune">{priceDisplay.replace('$', '')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  )
}
