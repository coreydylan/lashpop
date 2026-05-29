'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ExternalLink } from 'lucide-react'
import { LPLogoLoader } from '@/components/ui/LPLogoLoader'
import { useVagaroWidget } from '@/contexts/VagaroWidgetContext'
import { subscribeToVagaroEvent } from '@/lib/vagaro-events'
import type { BookingCompletedData } from '@/lib/vagaro-events'
import { getVagaroWidgetUrl } from '@/lib/vagaro-widget'
import { BookingConfirmation } from '@/components/booking/BookingConfirmation'
import { useServiceBrowser } from '../ServiceBrowserContext'
import type { Service } from '../ServiceBrowserContext'

interface BookingViewProps {
  service: Service
}

export function BookingView({ service }: BookingViewProps) {
  const widgetContainerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  // Use VagaroWidgetContext for state
  const { state: widgetState, reset: resetWidgetState } = useVagaroWidget()
  const { actions: browserActions } = useServiceBrowser()

  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [cardOnFile, setCardOnFile] = useState(false)

  // Widget is truly ready when Vagaro sends WidgetLoaded event
  const isWidgetReady = widgetState.isLoaded

  // Get widget script URL from service code
  const widgetScriptUrl = getVagaroWidgetUrl(service.vagaroServiceCode)

  // Trigger fade-in animation when widget becomes ready
  useEffect(() => {
    if (isWidgetReady) {
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    }
  }, [isWidgetReady])

  // Subscribe to BookingCompleted — swap the iframe for a branded confirmation
  useEffect(() => {
    const unsubscribeCompleted = subscribeToVagaroEvent('BookingCompleted', (event) => {
      console.log('[BookingView] BookingCompleted event received')
      const data = event.data as BookingCompletedData | null
      setCardOnFile(Boolean(data?.cardOnFile))
      setIsConfirmed(true)
    })

    return () => {
      unsubscribeCompleted()
    }
  }, [])

  // Reset state when service changes
  useEffect(() => {
    setScriptLoaded(false)
    setHasError(false)
    setIsVisible(false)
    setIsConfirmed(false)
    setCardOnFile(false)
    scriptLoadedRef.current = false
    resetWidgetState()
  }, [service.id, resetWidgetState])

  // Load Vagaro widget script
  useEffect(() => {
    if (!widgetContainerRef.current || scriptLoadedRef.current) return

    const container = widgetContainerRef.current

    // Create the Vagaro widget structure
    const vagaroDiv = document.createElement('div')
    vagaroDiv.className = 'vagaro'
    vagaroDiv.style.cssText = 'width:100%; height:100%; padding:0; border:0; margin:0; text-align:left;'

    // Add the script
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = widgetScriptUrl
    script.async = true

    script.onload = () => {
      setScriptLoaded(true)
      scriptLoadedRef.current = true
    }

    script.onerror = () => {
      console.error('[BookingView] Vagaro widget script failed to load')
      setHasError(true)
    }

    vagaroDiv.appendChild(script)
    container.appendChild(vagaroDiv)

    // Vagaro's iframe ships with a merchant-admin "Return URL" config that
    // top-navigates to the old Squarespace lashpop site as soon as a booking
    // completes — kicking users off our app before they can interact with
    // the branded confirmation overlay. We can't change the Vagaro setting
    // from here, but we CAN sandbox the iframe to revoke top-navigation
    // capability. allow-scripts/forms/same-origin/popups/modals keep the
    // widget functional; omitting allow-top-navigation* blocks the redirect.
    const SANDBOX = 'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals'
    const sandboxIframe = (frame: HTMLIFrameElement) => {
      if (frame.getAttribute('sandbox')) return
      frame.setAttribute('sandbox', SANDBOX)
    }
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of Array.from(m.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue
          if (node.tagName === 'IFRAME') {
            sandboxIframe(node as HTMLIFrameElement)
          } else {
            node.querySelectorAll('iframe').forEach((f) => sandboxIframe(f as HTMLIFrameElement))
          }
        }
      }
    })
    mo.observe(container, { childList: true, subtree: true })
    // Catch any iframe that Vagaro injected before the observer was wired.
    container.querySelectorAll('iframe').forEach((f) => sandboxIframe(f as HTMLIFrameElement))

    // Timeout for error state
    const timeout = setTimeout(() => {
      if (!widgetState.isLoaded) {
        console.warn('[BookingView] Widget load timeout')
      }
    }, 15000)

    return () => {
      clearTimeout(timeout)
      mo.disconnect()
      if (container.contains(vagaroDiv)) {
        container.removeChild(vagaroDiv)
      }
      scriptLoadedRef.current = false
    }
  }, [widgetScriptUrl, service.id])

  const handleOpenExternal = () => {
    window.open('https://www.vagaro.com/lashpop', '_blank', 'width=800,height=900')
  }

  const showLoading = !isWidgetReady && !hasError

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Global styles for Vagaro widget - force full size */}
      <style jsx global>{`
        /* Force Vagaro container to fill available space */
        .booking-view-widget,
        .booking-view-widget > div,
        .booking-view-widget .vagaro {
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
        }

        /* Hide Vagaro branding links */
        .booking-view-widget .vagaro > a,
        .booking-view-widget .vagaro > style + a {
          display: none !important;
        }

        /* Force the iframe to fill the entire container */
        .booking-view-widget iframe,
        .booking-view-widget .vagaro iframe,
        .booking-view-widget iframe[style] {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 400px !important;
          max-width: none !important;
          border: none !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Mobile-specific adjustments */
        @media (max-width: 767px) {
          .booking-view-widget iframe,
          .booking-view-widget .vagaro iframe,
          .booking-view-widget iframe[style] {
            min-height: 100% !important;
            /* Ensure it accounts for mobile viewport height */
            height: 100% !important;
            /* Allow touch scrolling within the iframe */
            touch-action: pan-x pan-y !important;
            -webkit-overflow-scrolling: touch !important;
          }

          /* Ensure the widget container captures touch events */
          .booking-view-widget {
            touch-action: pan-x pan-y !important;
            overscroll-behavior: contain !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
      `}</style>

      {/* Widget Container - full height with proper touch handling */}
      <div
        className="relative flex-1 min-h-0"
        style={{
          // Ensure this container fills the space and handles overflow
          overflow: 'hidden',
          // Allow touch scrolling within (iframe will handle actual scrolling)
          touchAction: 'pan-x pan-y',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Loading State */}
        {showLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ivory z-10">
            <LPLogoLoader size={80} />
            <p className="mt-4 text-sage text-sm">Loading booking...</p>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ivory z-10 p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-charcoal font-medium mb-2">Unable to load booking</p>
            <p className="text-sage text-sm text-center mb-4">
              There was a problem loading the booking widget. Please try again or book directly.
            </p>
            <button
              onClick={handleOpenExternal}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta text-white text-sm font-medium hover:bg-rust transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Booking in New Window
            </button>
          </div>
        )}

        {/* Vagaro Widget Container */}
        <div
          ref={widgetContainerRef}
          className={`booking-view-widget w-full h-full transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Branded confirmation overlay (covers the iframe once Vagaro fires BookingCompleted) */}
        {isConfirmed && (
          <BookingConfirmation
            serviceName={service.name}
            providerName={widgetState.selectedProvider}
            selectedTimeSlot={widgetState.selectedTimeSlot}
            cardOnFile={cardOnFile}
            onClose={browserActions.closeModal}
            onBookAnother={browserActions.goBack}
          />
        )}
      </div>
    </motion.div>
  )
}
