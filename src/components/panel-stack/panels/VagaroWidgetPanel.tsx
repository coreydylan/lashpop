'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Clock, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import type { Panel, VagaroWidgetPanelData } from '@/types/panel-stack';

interface VagaroWidgetPanelProps {
  panel: Panel;
}

// Fallback to all services widget if no service-specific URL
const ALL_SERVICES_WIDGET_SCRIPT = 'https://www.vagaro.com//resources/WidgetEmbeddedLoader/OZqsEJatCoPqFJ1y6BuSdBuOc1WJD1wOc1WO61Ctdg4tjxMG9pUxapkUcvCu7gCmjZcoapOUc9CvdfQOapkvdfoR6PmS0?v=09imfFDQKcMOy0zTyGQlMuzyCSHrqkUB9fzUvd1qy2Fa#';

// Service-specific widget scripts (hardcoded for demo, will be in database)
const SERVICE_WIDGET_SCRIPTS: Record<string, string> = {
  'classic': 'https://www.vagaro.com//resources/WidgetEmbeddedLoader/OZqsEJatCoPqFJ1y6BuSdBuOc1WJD1wOc1WO61Ctdg4tjxMG9pUxapkUcvCu7gCmjZcoapOUc9CvdfQOapkvdfoR6PmRW?v=avMXnLXkPKg91DeEID6Jji7gSkTP6tcpd4WwH2BVNJu#',
};

export function VagaroWidgetPanel({ panel }: VagaroWidgetPanelProps) {
  const { actions } = usePanelStack();
  const data = panel.data as VagaroWidgetPanelData;
  const service = data.service;
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get widget script URL - prefer database value, then service-specific demo, then all services fallback
  const widgetScriptUrl = service.vagaroWidgetUrl
    || SERVICE_WIDGET_SCRIPTS[service.slug]
    || ALL_SERVICES_WIDGET_SCRIPT;

  // Update panel summary
  useEffect(() => {
    const priceDisplay = `$${(service.priceStarting / 100).toFixed(0)}+`;
    actions.updatePanelSummary(panel.id, `${service.name} · ${priceDisplay}`);
  }, [service.name, service.priceStarting, panel.id, actions]);

  // Load Vagaro widget script
  useEffect(() => {
    if (!widgetContainerRef.current || scriptLoadedRef.current) return;

    const container = widgetContainerRef.current;

    // Create the Vagaro widget structure
    const vagaroDiv = document.createElement('div');
    vagaroDiv.className = 'vagaro';
    vagaroDiv.style.cssText = 'width:100%; padding:0; border:0; margin:0; text-align:left;';

    // Add the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = widgetScriptUrl;
    script.async = true;

    script.onload = () => {
      setIsLoading(false);
      scriptLoadedRef.current = true;
    };

    script.onerror = () => {
      setIsLoading(false);
      setHasError(true);
    };

    vagaroDiv.appendChild(script);
    container.appendChild(vagaroDiv);

    // Set a timeout to hide loading after a reasonable time
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      // Clean up on unmount
      if (container.contains(vagaroDiv)) {
        container.removeChild(vagaroDiv);
      }
      scriptLoadedRef.current = false;
    };
  }, [widgetScriptUrl]);

  const priceDisplay = `$${(service.priceStarting / 100).toFixed(0)}+`;

  return (
    <PanelWrapper
      panel={panel}
      title={service.name}
      subtitle={service.subtitle || `${service.categoryName || ''} ${service.subcategoryName ? `· ${service.subcategoryName}` : ''}`}
      fullWidthContent
    >
      {/* CSS to override Vagaro widget styles and crop the header */}
      <style jsx global>{`
        /* Force Vagaro container to be full width */
        .vagaro-widget-container,
        .vagaro-widget-container .vagaro {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Hide Vagaro branding links */
        .vagaro-widget-container .vagaro > a,
        .vagaro-widget-container .vagaro > style + a {
          display: none !important;
        }

        /* Inner wrapper that gets pulled up to crop the header */
        .vagaro-iframe-wrapper {
          position: relative;
          margin-top: -330px;
          padding-top: 0;
          width: 100% !important;
        }

        /* Style the iframe */
        .vagaro-widget-container iframe {
          width: 100% !important;
          max-width: none !important;
          min-height: 800px !important;
          border: none !important;
          display: block;
        }

        /* Mask to hide the cropped area with a gradient fade */
        .vagaro-crop-mask {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 30px;
          background: linear-gradient(to bottom, var(--color-cream, #F5F0E8) 0%, transparent 100%);
          pointer-events: none;
          z-index: 5;
        }
      `}</style>

      <div>
        {/* Compact Service Summary - has its own padding since parent is fullWidth */}
        <div className="flex items-center gap-4 text-sm text-dune/70 px-4 py-3 md:px-6">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sage" />
            <span>{service.durationMinutes} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-terracotta" />
            <span>From {priceDisplay}</span>
          </div>
        </div>

        {/* Full Page Width Vagaro Widget Container with cropping */}
        <div className="relative overflow-hidden w-full">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-cream/80 min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-dusty-rose animate-spin mx-auto mb-3" />
                <p className="text-sm text-dune/60">Loading booking...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-cream/80 min-h-[400px]">
              <div className="text-center max-w-sm px-4">
                <AlertCircle className="w-10 h-10 text-terracotta mx-auto mb-3" />
                <h3 className="font-medium text-dune mb-2">Unable to load booking</h3>
                <p className="text-sm text-dune/60">
                  Please refresh or contact us to book.
                </p>
              </div>
            </div>
          )}

          {/* Gradient mask at top to smooth the crop */}
          <div className="vagaro-crop-mask" />

          {/* Widget container - pushed up to crop the header */}
          <div
            ref={widgetContainerRef}
            className="vagaro-widget-container vagaro-iframe-wrapper"
            style={{ minHeight: '500px' }}
          />
        </div>
      </div>
    </PanelWrapper>
  );
}
