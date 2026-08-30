'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ExternalLink } from 'lucide-react'
import { LPLogoLoader } from '@/components/ui/LPLogoLoader'
import { useVagaroWidget } from '@/contexts/VagaroWidgetContext'
import { subscribeToVagaroEvent } from '@/lib/vagaro-events'
import type { BookingCompletedData } from '@/lib/vagaro-events'
import { resolveVagaroServiceWidgetUrl } from '@/lib/vagaro-widget'
import { BookingConfirmation } from '@/components/booking/BookingConfirmation'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { trackPublicEvent } from '@/lib/analytics-client'
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

  // Preserve Vagaro's service-specific URL token when one is available.
  const widgetScriptUrl = resolveVagaroServiceWidgetUrl({
    widgetUrl: service.vagaroWidgetUrl,
  })

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
      trackPublicEvent(ANALYTICS_EVENTS.bookingCompleted, {
        service_slug: service.slug,
        source: 'vagaro',
      })
      const data = event.data as BookingCompletedData | null
      setCardOnFile(Boolean(data?.cardOnFile))
      setIsConfirmed(true)

      // Leave Vagaro's iframe completely untouched during service selection,
      // login, payment, and booking. Once BookingCompleted fires, the booking
      // is already finalized; remove the iframe synchronously so Vagaro's old
      // merchant Return URL cannot redirect the top window afterward. This
      // replaces the pre-navigation iframe sandbox, which could interfere with
      // Vagaro's own service-filter request.
      widgetContainerRef.current?.replaceChildren()
    })

    return () => {
      unsubscribeCompleted()
    }
  }, [service.slug])

  // Defensive navigation guard while the branded confirmation is showing.
  // Vagaro's iframe will attempt a top-level redirect to the merchant-admin
  // "Return URL" (currently the old Squarespace lashpop site) the instant
  // BookingCompleted fires. We can't sandbox the iframe document after the
  // fact (the about:blank reload trick we tried broke Vagaro's loader
  // handshake), so we hook beforeunload at the page level instead. The
  // browser shows a "Leave site?" dialog that the user has to confirm
  // before navigation completes — usually they hit Cancel because Vagaro
  // never told them to leave, then they click Done / Book another. We
  // remove the listener as soon as the confirmation closes so legitimate
  // navigation (their own back button, link clicks, etc.) isn't blocked.
  useEffect(() => {
    if (!isConfirmed) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Spec requires returnValue assignment for the dialog to show on
      // Chrome / Edge — Firefox/Safari ignore the string but show the
      // dialog anyway.
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isConfirmed])

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

  // CRITICAL VAGARO INTEGRATION CONTRACT:
  // - Inject the generated WidgetEmbeddedLoader URL as a <script>.
  // - Never use that URL, BusinessWidget.aspx, or a numeric ServiceID URL as
  //   an iframe src; those paths caused the full menu/"Click to Book" regression.
  // - Preserve the URL's original ?v= token.
  // - Keep the DOM order script -> .vagaro -> container so Vagaro's loader
  //   handshake can create its own service-scoped iframe.
  // - Do not sandbox, reload, or otherwise rewrite Vagaro's generated iframe.
  //   Their service filter, login, and payment handshakes must run untouched.
  // - Mapping identity is enforced by the generated manifest; do not accept a
  //   different syntactically-valid loader for the same numeric service ID.
  // History: b5c6cd1, 2036182, 48ed862, 9c33d38.
  // Full runbook: docs/VAGARO_BOOKING_CONTRACT.md.
  useEffect(() => {
    if (!widgetContainerRef.current || scriptLoadedRef.current || !widgetScriptUrl) return

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

    return () => {
      if (container.contains(vagaroDiv)) {
        container.removeChild(vagaroDiv)
      }
      scriptLoadedRef.current = false
    }
  }, [widgetScriptUrl, service.id])

  const handleOpenExternal = () => {
    window.open('https://www.vagaro.com/lashpop', '_blank', 'width=800,height=900')
  }

  const showConfigurationError = !widgetScriptUrl
  const showLoading = !isWidgetReady && !hasError && !showConfigurationError

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
        {/* Loading State — the spinning logo is enough visual feedback;
            redundant "Loading booking..." copy was reading as an artifact
            stacked on top of Vagaro's own loading state. */}
        {showLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ivory z-10">
            <LPLogoLoader size={80} />
          </div>
        )}

        {/* Error State */}
        {(hasError || showConfigurationError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ivory z-10 p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-charcoal font-medium mb-2">
              {showConfigurationError ? 'Online booking is not configured for this service' : 'Unable to load booking'}
            </p>
            <p className="text-sage text-sm text-center mb-4">
              {showConfigurationError
                ? 'Please open LashPop booking to choose this service, or contact the studio for help.'
                : 'There was a problem loading the booking widget. Please try again or book directly.'}
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
          data-session-replay-block
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
