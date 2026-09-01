'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Clock, DollarSign } from 'lucide-react'
import type { Service } from '../ServiceBrowserContext'
import { SERVICE_CARD_SIZES } from '../service-image-preloader'

// Mapping of category slug → icon SVG path
const categoryIconMap: Record<string, string> = {
  'lashes': '/lashpop-images/services/thin/lashes-icon.svg',
  'lash-lifts': '/lashpop-images/services/thin/lash-lifts-icon.svg',
  'brows': '/lashpop-images/services/thin/brows-icon.svg',
  'facials': '/lashpop-images/services/thin/skincare-icon.svg',
  'skincare': '/lashpop-images/services/thin/skincare-icon.svg',
  'waxing': '/lashpop-images/services/thin/waxing-icon.svg',
  'permanent-makeup': '/lashpop-images/services/thin/permanent-makeup-icon.svg',
  'specialty': '/lashpop-images/services/thin/permanent-jewelry-icon.svg',
  'permanent-jewelry': '/lashpop-images/services/thin/permanent-jewelry-icon.svg',
  'fine-line-tattoos': '/lashpop-images/services/thin/fine-line-tattoos-icon.svg',
  'injectables': '/lashpop-images/services/thin/injectables-icon.svg',
  'nails': '/lashpop-images/services/thin/nails-icon.svg',
}

interface ServiceCardProps {
  service: Service
  index: number
  onClick: () => void
}

export function ServiceCard({ service, index, onClick }: ServiceCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const priceDisplay = service.priceStarting
    ? `$${(service.priceStarting / 100).toFixed(0)}+`
    : null

  // Resolve the category icon SVG path from the static map
  // (DB icons are emojis, not file paths, so we use the static map directly)
  const categoryIcon = service.categorySlug
    ? categoryIconMap[service.categorySlug]
    : null
  const showPhoto = Boolean(service.imageUrl && !imageFailed)
  const prioritizePhoto = index < 6

  useLayoutEffect(() => {
    const image = imageRef.current
    const restoredFromBrowserCache = Boolean(image?.complete && image.naturalWidth > 0)
    const completedWithError = Boolean(
      image?.complete && image.currentSrc && image.naturalWidth === 0,
    )
    setImageLoaded(restoredFromBrowserCache)
    setImageFailed(completedWithError)
  }, [service.imageUrl])

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
        {categoryIcon && (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-ivory transition-opacity duration-300 ${
              showPhoto && imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            aria-hidden={showPhoto ? 'true' : undefined}
          >
            <div className="relative w-16 h-16 md:w-20 md:h-20 opacity-80">
              <Image
                src={categoryIcon}
                alt={showPhoto ? '' : service.name}
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}
        {showPhoto ? (
          <Image
            ref={imageRef}
            src={service.imageUrl!}
            alt={service.name}
            fill
            data-service-image
            data-loaded={imageLoaded ? 'true' : 'false'}
            className={`object-cover group-hover:scale-105 transition-[opacity,transform] duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes={SERVICE_CARD_SIZES}
            loading={prioritizePhoto ? 'eager' : 'lazy'}
            fetchPriority={prioritizePhoto ? 'high' : 'low'}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageLoaded(false)
              setImageFailed(true)
            }}
          />
        ) : !categoryIcon ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ivory">
            <span className="text-sage/40 font-display text-lg">No image</span>
          </div>
        ) : null}
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
