'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, ExternalLink } from 'lucide-react';
import { LPLogoLoader } from '@/components/ui/LPLogoLoader';
import { useVagaroWidget } from '@/contexts/VagaroWidgetContext';
import { subscribeToVagaroEvent } from '@/lib/vagaro-events';
import { getVagaroWidgetUrl } from '@/lib/vagaro-widget';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Service code (5-char code like "6XoR0") - used to construct widget URL */
  vagaroServiceCode?: string | null;
  serviceName?: string;
  onBookingCompleted?: () => void;
}

const modalContainerClass = 'relative w-full max-w-3xl bg-ivory rounded-3xl shadow-2xl overflow-hidden pointer-events-auto h-[85vh] md:h-[80vh] max-h-[800px]';
const closeButtonClass = 'absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-sage hover:text-charcoal transition-all shadow-sm';

export function BookingModal({
  isOpen,
  onClose,
  vagaroServiceCode,
  serviceName,
  onBookingCompleted,
}: BookingModalProps) {
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  // Use VagaroWidgetContext for state - matches VagaroWidgetPanel approach
  const { state: widgetState, reset: resetWidgetState } = useVagaroWidget();

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Widget is truly ready when Vagaro sends WidgetLoaded event (via context)
  const isWidgetReady = widgetState.isLoaded;

  // Get widget script URL from service code
  const widgetScriptUrl = getVagaroWidgetUrl(vagaroServiceCode);

  // Detailed logging like working version
  console.log('[BookingModal] getWidgetScriptUrl - vagaroServiceCode:', vagaroServiceCode);
  console.log('[BookingModal] getWidgetScriptUrl - using URL:', widgetScriptUrl);

  // Debug: Log loading state changes
  useEffect(() => {
    console.log('[BookingModal] Loading state:', {
      isOpen,
      isWidgetReady,
      isVisible,
      hasError,
      scriptLoaded,
      widgetStateIsLoaded: widgetState.isLoaded,
      currentStep: widgetState.currentStep,
    });
  }, [isOpen, isWidgetReady, isVisible, hasError, scriptLoaded, widgetState.isLoaded, widgetState.currentStep]);

  // Trigger fade-in animation when widget becomes ready
  useEffect(() => {
    if (isWidgetReady) {
      console.log('[BookingModal] Widget ready! Triggering fade-in...');
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isWidgetReady]);

  // Subscribe to BookingCompleted for callback
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribeCompleted = subscribeToVagaroEvent('BookingCompleted', () => {
      console.log('[BookingModal] BookingCompleted event received');
      onBookingCompleted?.();
      onClose();
    });

    return () => {
      unsubscribeCompleted();
    };
  }, [isOpen, onClose, onBookingCompleted]);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScriptLoaded(false);
      setHasError(false);
      setIsVisible(false);
      scriptLoadedRef.current = false;
      // Reset widget context state for fresh start
      resetWidgetState();
    }
  }, [isOpen, resetWidgetState]);

  // Load Vagaro widget script - EXACTLY matching VagaroWidgetPanel
  useEffect(() => {
    if (!isOpen || !widgetContainerRef.current || scriptLoadedRef.current) return;

    const container = widgetContainerRef.current;

    console.log('[BookingModal] Loading Vagaro widget:', widgetScriptUrl);

    // Create the Vagaro widget structure (exactly like VagaroWidgetPanel)
    const vagaroDiv = document.createElement('div');
    vagaroDiv.className = 'vagaro';
    vagaroDiv.style.cssText = 'width:100%; padding:0; border:0; margin:0; text-align:left;';

    // Add the script (exactly like VagaroWidgetPanel)
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = widgetScriptUrl;
    script.async = true;  // VagaroWidgetPanel uses async = true

    script.onload = () => {
      console.log('[BookingModal] Vagaro widget script loaded');
      setScriptLoaded(true);
      scriptLoadedRef.current = true;
    };

    script.onerror = () => {
      console.error('[BookingModal] Vagaro widget script failed to load');
      setHasError(true);
    };

    // IMPORTANT: Same order as VagaroWidgetPanel
    // 1. Append script to vagaroDiv
    // 2. Then append vagaroDiv to container
    vagaroDiv.appendChild(script);
    container.appendChild(vagaroDiv);

    // Timeout for error state
    const timeout = setTimeout(() => {
      if (!widgetState.isLoaded) {
        console.warn('[BookingModal] Widget load timeout');
      }
    }, 15000);

    return () => {
      clearTimeout(timeout);
      if (container.contains(vagaroDiv)) {
        container.removeChild(vagaroDiv);
      }
      scriptLoadedRef.current = false;
    };
  }, [isOpen, widgetScriptUrl]);

  const handleOpenExternal = () => {
    // Open the Vagaro booking page in a new window
    window.open(`https://www.vagaro.com/lashpop`, '_blank', 'width=800,height=900');
  };

  const showLoading = !isWidgetReady && !hasError;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 pointer-events-none"
          >
            <div
              className={modalContainerClass}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={serviceName ? `Book ${serviceName}` : 'Book Appointment'}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className={closeButtonClass}
                aria-label="Close booking modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-sage/10 flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-display font-medium text-charcoal pr-8">
                  {serviceName ? `Book ${serviceName}` : 'Book Your Appointment'}
                </h2>
                <button
                  onClick={handleOpenExternal}
                  className="flex items-center gap-1.5 text-sm text-sage hover:text-dusty-rose transition-colors mr-10"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden md:inline">New window</span>
                </button>
              </div>

              {/* Widget container */}
              <div className="h-[calc(100%-80px)] overflow-y-auto relative">
                {/* Global styles for Vagaro widget */}
                <style jsx global>{`
                  /* Force Vagaro container to be full width */
                  .booking-modal-widget .vagaro {
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }

                  /* Hide Vagaro branding links */
                  .booking-modal-widget .vagaro > a,
                  .booking-modal-widget .vagaro > style + a {
                    display: none !important;
                  }

                  /* Style the iframe - fill container height */
                  .booking-modal-widget iframe {
                    width: 100% !important;
                    max-width: none !important;
                    border: none !important;
                    display: block;
                    height: 100% !important;
                  }
                `}</style>

                {/* Loading State - Shows LP logo animation until Vagaro widget is fully ready */}
                {showLoading && (
                  <div
                    className="absolute inset-0 z-20 flex items-center justify-center bg-ivory transition-opacity duration-500"
                    style={{ opacity: isVisible ? 0 : 1, pointerEvents: isVisible ? 'none' : 'auto' }}
                  >
                    <LPLogoLoader message={'Preparing booking experience\npowered by Vagaro'} size={56} />
                  </div>
                )}

                {/* Error state */}
                {hasError && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-ivory">
                    <div className="text-center max-w-sm px-4">
                      <AlertCircle className="w-10 h-10 text-terracotta mx-auto mb-3" />
                      <h3 className="font-medium text-dune mb-2">Unable to load booking</h3>
                      <p className="text-sm text-dune/60 mb-4">
                        Please try opening in a new window or contact us to book.
                      </p>
                      <button
                        onClick={handleOpenExternal}
                        className="px-6 py-3 bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white rounded-full font-medium hover:shadow-lg transition-shadow"
                      >
                        Open Booking Page
                      </button>
                    </div>
                  </div>
                )}

                {/* Vagaro widget container - fixed height to stay within modal bounds */}
                <div
                  ref={widgetContainerRef}
                  className="booking-modal-widget relative w-full h-full transition-opacity duration-500"
                  style={{ opacity: 1 }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BookingModal;
