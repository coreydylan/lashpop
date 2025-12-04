'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, DollarSign, AlertCircle } from 'lucide-react'
import { useAskLashpop } from '@/contexts/AskLashpopContext'
import { LPLogoLoader } from '@/components/ui/LPLogoLoader'
import { getVagaroWidgetUrl } from '@/lib/vagaro-widget'
import { useVagaroWidget } from '@/contexts/VagaroWidgetContext'

export function InlineVagaroWidget() {
  const { state, goBackToChat } = useAskLashpop()
  const { state: widgetState } = useVagaroWidget()
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const service = state.inlineService
  const isWidgetReady = widgetState.isLoaded
  const widgetScriptUrl = service ? getVagaroWidgetUrl(service.vagaroServiceCode) : ''

  // Fade in when ready OR via fallback timeout
  useEffect(() => {
    if (isWidgetReady) {
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    }
  }, [isWidgetReady])

  // Fallback: Show widget after timeout even if WidgetLoaded event doesn't fire
  // This handles cases where Vagaro doesn't emit the postMessage event
  useEffect(() => {
    if (!service) return

    const fallbackTimer = setTimeout(() => {
      if (!isVisible) {
        console.log('[InlineVagaroWidget] Fallback timeout - showing widget without WidgetLoaded event')
        setIsVisible(true)
      }
    }, 2500) // Show after 2.5 seconds regardless

    return () => clearTimeout(fallbackTimer)
  }, [service, isVisible])

  // Only show loading if widget not visible yet and no error
  const showLoading = !isVisible && !hasError

  // Load Vagaro widget script
  useEffect(() => {
    if (!service || !containerRef.current || scriptLoadedRef.current) return

    const container = containerRef.current
    scriptLoadedRef.current = true

    // Create the Vagaro widget structure
    const vagaroDiv = document.createElement('div')
    vagaroDiv.className = 'vagaro'
    vagaroDiv.style.cssText = 'width:100%; padding:0; border:0; margin:0; text-align:left;'

    // Add the script
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = widgetScriptUrl
    script.async = true

    script.onerror = () => {
      setHasError(true)
    }

    vagaroDiv.appendChild(script)
    container.appendChild(vagaroDiv)

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (!widgetState.isLoaded) {
        console.warn('[InlineVagaroWidget] Widget load timeout')
      }
    }, 15000)

    return () => {
      clearTimeout(timeout)
      if (container.contains(vagaroDiv)) {
        container.removeChild(vagaroDiv)
      }
      scriptLoadedRef.current = false
    }
  }, [service, widgetScriptUrl, widgetState.isLoaded])

  // Early return AFTER all hooks have been called
  if (!service) return null

  const priceDisplay = `$${(service.priceStarting / 100).toFixed(0)}+`

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-sage/10 bg-white/80 backdrop-blur-sm">
        <motion.button
          onClick={goBackToChat}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 -ml-2 rounded-full hover:bg-sage/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-dune" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-dune truncate">{service.name}</h3>
          {service.categoryName && (
            <p className="text-xs text-dune/60">{service.categoryName}</p>
          )}
        </div>
      </div>

      {/* Service Summary */}
      <div className="flex items-center gap-4 text-sm text-dune/70 px-4 py-3 bg-cream/50">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-sage" />
          <span>{service.durationMinutes} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-terracotta" />
          <span>From {priceDisplay}</span>
        </div>
      </div>

      {/* Widget Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading State */}
        {showLoading && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-cream transition-opacity duration-500"
            style={{ opacity: isVisible ? 0 : 1, pointerEvents: isVisible ? 'none' : 'auto' }}
          >
            <LPLogoLoader message="Loading booking..." size={48} />
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-cream/80">
            <div className="text-center max-w-sm px-4">
              <AlertCircle className="w-10 h-10 text-terracotta mx-auto mb-3" />
              <h3 className="font-medium text-dune mb-2">Unable to load booking</h3>
              <p className="text-sm text-dune/60 mb-4">
                Please try again or contact us directly.
              </p>
              <button
                onClick={goBackToChat}
                className="px-4 py-2 rounded-full bg-dusty-rose text-white text-sm font-medium hover:bg-terracotta transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Gradient mask at top */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none z-10"
          style={{
            height: '20px',
            background: 'linear-gradient(to bottom, rgb(250, 247, 241) 0%, transparent 100%)',
          }}
        />

        {/* Widget */}
        <div
          ref={containerRef}
          className="vagaro-widget-container relative w-full transition-opacity duration-500"
          style={{
            marginTop: '-80px', // Crop Vagaro header
            minHeight: '500px',
            opacity: isVisible ? 1 : 0,
          }}
        />
      </div>
    </div>
  )
}
