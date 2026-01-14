'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, DollarSign } from 'lucide-react'
import { useServiceBrowser } from '../ServiceBrowserContext'
import { ServiceGallery } from '../components/ServiceGallery'
import { getAssetsByServiceSlug, type AssetWithTags } from '@/actions/dam'

export function DetailView() {
  const { state, actions } = useServiceBrowser()
  const { selectedService } = state

  const [gallery, setGallery] = useState<AssetWithTags[]>([])
  const [isLoadingGallery, setIsLoadingGallery] = useState(false)

  // Fetch gallery when service changes
  useEffect(() => {
    async function fetchGallery() {
      if (!selectedService) return
      setIsLoadingGallery(true)
      try {
        const assets = await getAssetsByServiceSlug(selectedService.slug)
        setGallery(assets)
      } catch (error) {
        console.error('Failed to fetch service gallery:', error)
      } finally {
        setIsLoadingGallery(false)
      }
    }
    fetchGallery()
  }, [selectedService])

  if (!selectedService) return null

  const priceDisplay = selectedService.priceStarting
    ? `$${(selectedService.priceStarting / 100).toFixed(0)}+`
    : null

  // Map assets to gallery format with fallback IDs
  const galleryImages = gallery.map((asset, index) => ({
    id: asset.id || `gallery-${index}`,
    url: asset.filePath,
    alt: asset.altText || selectedService.name,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 md:space-y-6 pb-24 md:pb-6">
        {/* Stats Bar */}
        <div className="flex items-center justify-around md:justify-start md:gap-8 py-3 md:py-4 bg-sage/5 md:bg-transparent rounded-xl md:rounded-none">
          {selectedService.durationMinutes > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-sage" />
                <span className="text-sm font-medium text-dune">
                  {selectedService.durationMinutes} min
                </span>
              </div>
              {priceDisplay && <div className="w-px h-5 md:h-6 bg-sage/20 md:hidden" />}
            </>
          )}
          {priceDisplay && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-terracotta" />
              <span className="text-sm font-medium text-dune">
                From {priceDisplay}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          {selectedService.subtitle && (
            <p className="text-sm italic text-dusty-rose mb-2 md:mb-3">
              {selectedService.subtitle}
            </p>
          )}
          <p className="text-sm md:text-base text-dune/80 leading-relaxed">
            {selectedService.description}
          </p>
        </div>

        {/* Gallery */}
        {(galleryImages.length > 0 || isLoadingGallery) && (
          <div>
            <h4 className="font-medium text-dune mb-3 text-sm md:text-base">
              Our Work
            </h4>
            <ServiceGallery
              images={galleryImages}
              isLoading={isLoadingGallery}
            />
          </div>
        )}

        {/* Desktop Book Now CTA */}
        <div className="hidden md:block pt-4 border-t border-sage/10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={actions.openBooking}
            className="w-full px-6 py-4 rounded-full font-sans font-medium text-base
                       bg-gradient-to-r from-terracotta to-terracotta/80
                       text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            Book Now
          </motion.button>
        </div>
      </div>

      {/* Mobile Sticky Book Now CTA */}
      <div
        className="md:hidden sticky bottom-0 left-0 right-0 p-4 bg-ivory/95 backdrop-blur-sm border-t border-sage/10"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={actions.openBooking}
          className="w-full px-6 py-3.5 rounded-full font-sans font-medium text-base
                     bg-gradient-to-r from-terracotta to-terracotta/80
                     text-white shadow-lg active:shadow-md transition-shadow"
        >
          Book Now
        </motion.button>
      </div>
    </motion.div>
  )
}
