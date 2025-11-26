'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { PanelWrapper } from '../PanelWrapper';
import { useCascadingPanels } from '@/contexts/CascadingPanelContext';
import type { PanelStackItem } from '@/types/cascading-panels';

interface VagaroWidgetPanelProps {
  panel: PanelStackItem;
}

export interface VagaroWidgetPanelData {
  widgetUrl: string;
  serviceName: string;
  servicePrice?: number;
  serviceDuration?: number;
}

export function VagaroWidgetPanel({ panel }: VagaroWidgetPanelProps) {
  const { actions } = useCascadingPanels();
  const data = panel.data as VagaroWidgetPanelData;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Listen for booking completion events from the Vagaro widget
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Vagaro widget may post messages on booking completion
      // The exact event structure depends on Vagaro's implementation
      if (event.data?.type === 'vagaro-booking-complete' ||
          event.data?.type === 'booking_completed') {
        // Handle successful booking
        console.log('Booking completed:', event.data);
        // Could close panel or show confirmation
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleOpenExternal = () => {
    window.open(data.widgetUrl, '_blank', 'width=800,height=900');
  };

  const priceDisplay = data.servicePrice
    ? `$${(data.servicePrice / 100).toFixed(0)}+`
    : null;

  return (
    <PanelWrapper
      panel={panel}
      title={`Book ${data.serviceName}`}
      subtitle={[
        data.serviceDuration && `${data.serviceDuration} min`,
        priceDisplay
      ].filter(Boolean).join(' · ') || 'Complete your booking'}
      showCollapseToggle={false}
    >
      <div className="relative">
        {/* Header with external link option */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-sage/10">
          <p className="text-sm text-dune/60">
            Select your preferred time and complete your booking below
          </p>
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-1.5 text-sm text-sage hover:text-dusty-rose transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in new window
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 min-h-[500px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-dusty-rose animate-spin" />
              <p className="text-sm text-dune/60">Loading booking calendar...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-terracotta/10 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-terracotta" />
            </div>
            <h4 className="font-medium text-dune mb-2">Unable to load booking widget</h4>
            <p className="text-sm text-dune/60 mb-4">
              Please try opening the booking in a new window
            </p>
            <button
              onClick={handleOpenExternal}
              className="px-6 py-3 bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white rounded-full font-medium hover:shadow-lg transition-shadow"
            >
              Open Booking Page
            </button>
          </div>
        )}

        {/* Vagaro Widget iframe */}
        {!hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg overflow-hidden border border-sage/10"
          >
            <iframe
              src={data.widgetUrl}
              width="100%"
              height="700"
              frameBorder="0"
              title={`Book ${data.serviceName}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              className="bg-white"
              allow="payment"
            />
          </motion.div>
        )}

        {/* Booking info footer */}
        <div className="mt-4 pt-4 border-t border-sage/10">
          <div className="flex items-start gap-3 text-xs text-dune/50">
            <div className="flex-1">
              <p>Secure booking powered by Vagaro. Your payment information is encrypted and protected.</p>
            </div>
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
}
