'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, DollarSign, Loader2, ExternalLink } from 'lucide-react'
import { useDiscoverLook } from '@/contexts/DiscoverLookContext'
import { getVagaroWidgetUrl } from '@/lib/vagaro-widget'

interface InlineBookingWidgetProps {
  service: {
    id: string
    name: string
    slug: string
    vagaroServiceCode: string
    priceStarting: number
    durationMinutes: number
    categoryName?: string
  }
}

export function InlineBookingWidget({ service }: InlineBookingWidgetProps) {
  const { goBackToChat } = useDiscoverLook()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const widgetUrl = getVagaroWidgetUrl(service.vagaroServiceCode)

  useEffect(() => {
    // Timeout fallback if widget doesn't load
    const timeout = setTimeout(() => {
      if (isLoading) {
        setHasError(true)
        setIsLoading(false)
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [isLoading])

  const handleWidgetLoad = () => {
    setIsLoading(false)
  }

  const handleExternalBook = () => {
    window.open(widgetUrl, '_blank')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-sage/10 bg-white/50">
        <motion.button
          onClick={goBackToChat}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full hover:bg-sage/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-dune/60" />
        </motion.button>
        <div className="flex-1">
          <h3 className="font-medium text-dune text-sm">{service.name}</h3>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-dune/60">
              <Clock className="w-3 h-3" />
              {service.durationMinutes} min
            </span>
            <span className="flex items-center gap-1 text-xs text-dune/60">
              <DollarSign className="w-3 h-3" />
              ${(service.priceStarting / 100).toFixed(0)}+
            </span>
          </div>
        </div>
      </div>

      {/* Widget Container */}
      <div className="flex-1 relative bg-white">
        {/* Loading State */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-dusty-rose animate-spin" />
            <p className="text-sm text-dune/60">Loading booking options...</p>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
            <p className="text-sm text-dune/70 text-center">
              The booking widget is taking a while to load.
            </p>
            <motion.button
              onClick={handleExternalBook}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full
                         bg-dusty-rose text-white font-medium
                         shadow-md hover:shadow-lg transition-shadow"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Booking Page</span>
            </motion.button>
            <button
              onClick={goBackToChat}
              className="text-sm text-dune/60 underline hover:text-dune transition-colors"
            >
              Go back to chat
            </button>
          </div>
        )}

        {/* Vagaro Widget */}
        {!hasError && (
          <iframe
            src={widgetUrl}
            className={`w-full h-full border-0 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleWidgetLoad}
            title={`Book ${service.name}`}
            allow="payment"
          />
        )}
      </div>
    </div>
  )
}
