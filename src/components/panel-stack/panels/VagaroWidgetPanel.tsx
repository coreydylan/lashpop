'use client';

import React, { useEffect, useRef, useState, useContext, useMemo } from 'react';
import { Clock, DollarSign, AlertCircle } from 'lucide-react';
import { LPLogoLoader } from '@/components/ui/LPLogoLoader';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { useVagaroWidget } from '@/contexts/VagaroWidgetContext';
import { getVagaroWidgetUrl } from '@/lib/vagaro-widget';
import { CROP_CONFIG, CROP_CONFIG_MOBILE, CROP_TRANSITION_DURATION, type CropSettings } from '@/lib/vagaro-events';
import type { Panel, VagaroWidgetPanelData } from '@/types/panel-stack';

// Import DevMode context - we check if it's available
import { DevModeContext } from '@/contexts/DevModeContext';
import { useDevMode } from '@/contexts/DevModeContext';

interface VagaroWidgetPanelProps {
  panel: Panel;
}

/**
 * Custom hook to detect mobile viewport.
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Custom hook to get crop settings with dev mode override support.
 * Directly accesses both contexts to ensure reactivity.
 * Uses mobile-specific crop config on smaller screens.
 */
function useCropSettingsWithDevMode(): { cropSettings: CropSettings; activeStep: string; isDevMode: boolean; debugInfo: string; isMobile: boolean } {
  const { state: widgetState } = useVagaroWidget();
  const devModeContext = useContext(DevModeContext);
  const isMobile = useIsMobile();

  // Read ALL values from context state to ensure React tracks dependencies
  const isDevMode = devModeContext?.state?.isEnabled ?? false;
  const isLivePreview = devModeContext?.state?.isLivePreview ?? false;
  const simulatedStep = devModeContext?.state?.simulatedStep ?? null;
  const cropOverrides = devModeContext?.state?.cropOverrides ?? {};

  // Log context access for debugging
  console.log('[useCropSettingsWithDevMode] Context check:', {
    hasContext: !!devModeContext,
    isDevMode,
    isLivePreview,
    simulatedStep,
    cropOverridesKeys: Object.keys(cropOverrides),
    isMobile,
  });

  // Determine which step to use for crop settings
  const activeStep = isDevMode && simulatedStep
    ? simulatedStep
    : widgetState.currentStep;

  // Get the base crop settings for this step - use mobile config on smaller screens
  const cropConfig = isMobile ? CROP_CONFIG_MOBILE : CROP_CONFIG;
  const baseCropSettings = cropConfig[activeStep];

  // Build debug info
  const overrideKeys = Object.keys(cropOverrides);
  const hasOverrideForStep = activeStep in cropOverrides;
  const deviceType = isMobile ? 'mobile' : 'desktop';
  const debugInfo = `ctx:${!!devModeContext} dev:${isDevMode} live:${isLivePreview} sim:${simulatedStep} step:${activeStep} device:${deviceType} overrides:[${overrideKeys.join(',')}] hasOverride:${hasOverrideForStep}`;

  // If dev mode is enabled with live preview, check for overrides
  if (isDevMode && isLivePreview) {
    const override = cropOverrides[activeStep];
    if (override) {
      return { cropSettings: override, activeStep, isDevMode, debugInfo: `${debugInfo} -> OVERRIDE`, isMobile };
    }
  }

  return { cropSettings: baseCropSettings, activeStep, isDevMode, debugInfo: `${debugInfo} -> BASE`, isMobile };
}

export function VagaroWidgetPanel({ panel }: VagaroWidgetPanelProps) {
  const { actions } = usePanelStack();
  const { state: widgetState } = useVagaroWidget();
  const data = panel.data as VagaroWidgetPanelData;
  const service = data.service;
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  // Track script loading separately from widget readiness
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Widget is truly ready when Vagaro sends WidgetLoaded event
  const isWidgetReady = widgetState.isLoaded;

  // Show loading animation until widget is fully ready
  const showLoading = !isWidgetReady && !hasError;

  // Debug: Log loading state changes
  useEffect(() => {
    console.log('[VagaroWidgetPanel] Loading state:', {
      isWidgetReady,
      showLoading,
      isVisible,
      hasError,
      scriptLoaded,
      widgetStateIsLoaded: widgetState.isLoaded,
      currentStep: widgetState.currentStep,
    });
  }, [isWidgetReady, showLoading, isVisible, hasError, scriptLoaded, widgetState.isLoaded, widgetState.currentStep]);

  // Trigger fade-in animation when widget becomes ready
  useEffect(() => {
    if (isWidgetReady) {
      console.log('[VagaroWidgetPanel] Widget ready! Triggering fade-in...');
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isWidgetReady]);

  // Get dynamic crop settings (with dev mode override support)
  const { cropSettings, activeStep, isDevMode, debugInfo } = useCropSettingsWithDevMode();

  // Debug: Log crop changes in dev mode
  useEffect(() => {
    if (isDevMode) {
      console.log('[VagaroWidgetPanel] Crop update:', {
        debugInfo,
        marginTop: cropSettings.marginTop,
        minHeight: cropSettings.minHeight,
        maskHeight: cropSettings.maskHeight,
      });
    }
  }, [isDevMode, debugInfo, cropSettings.marginTop, cropSettings.minHeight, cropSettings.maskHeight]);

  // Get widget script URL from service code (or fallback to all services)
  const widgetScriptUrl = getVagaroWidgetUrl(service.vagaroServiceCode);

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
      setScriptLoaded(true);
      scriptLoadedRef.current = true;
    };

    script.onerror = () => {
      setHasError(true);
    };

    vagaroDiv.appendChild(script);
    container.appendChild(vagaroDiv);

    // Timeout for error state - if widget doesn't load within 15s, show error
    const timeout = setTimeout(() => {
      if (!widgetState.isLoaded) {
        console.warn('[VagaroWidgetPanel] Widget load timeout - WidgetLoaded event not received');
        // Don't set error yet, Vagaro may still load - just log for debugging
      }
    }, 15000);

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

  // DEBUG: Log on every render
  console.log('🔴🔴🔴 VagaroWidgetPanel RENDER - panel-stack version 🔴🔴🔴');

  return (
    <PanelWrapper
      panel={panel}
      title={service.name}
      subtitle={service.subtitle || `${service.categoryName || ''} ${service.subcategoryName ? `· ${service.subcategoryName}` : ''}`}
      fullWidthContent
    >
      {/* CSS to override Vagaro widget styles - using inline styles for dynamic values */}
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

        /* Style the iframe - width only, height handled by wrapper */
        .vagaro-widget-container iframe {
          width: 100% !important;
          max-width: none !important;
          border: none !important;
          display: block;
        }
      `}</style>

      <div className="vagaro-crop-wrapper">
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
        <div
          className="relative overflow-hidden w-full min-h-[400px]"
          style={{ touchAction: 'pan-y' }}
        >

          {/* Loading State - Shows LP logo animation until Vagaro widget is fully ready */}
          {showLoading && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-ivory transition-opacity duration-500"
              style={{ opacity: isVisible ? 0 : 1, pointerEvents: isVisible ? 'none' : 'auto' }}
            >
              <LPLogoLoader message={"Preparing booking experience\npowered by Vagaro"} size={56} />
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-ivory/80 min-h-[400px]">
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
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none z-10"
            style={{
              height: cropSettings.maskHeight,
              background: 'linear-gradient(to bottom, var(--color-cream, #F5F0E8) 0%, transparent 100%)',
              transition: `height ${CROP_TRANSITION_DURATION}ms ease-out`,
            }}
          />

          {/* Widget container - pushed up to crop the header */}
          {/* Hidden until widget is ready to mask Vagaro's internal loading spinner */}
          <div
            ref={widgetContainerRef}
            className="vagaro-widget-container relative w-full transition-opacity duration-500"
            style={{
              marginTop: cropSettings.marginTop,
              minHeight: cropSettings.minHeight,
              transition: `margin-top ${CROP_TRANSITION_DURATION}ms ease-out, min-height ${CROP_TRANSITION_DURATION}ms ease-out, opacity 500ms ease-out`,
              opacity: isVisible ? 1 : 0,
            }}
          />

          {/* Dev mode indicator - shows current crop values and debug info */}
          {isDevMode && (
            <div className="absolute bottom-2 left-2 right-2 z-20 px-2 py-1 bg-black/80 text-white text-[10px] font-mono rounded space-y-1">
              <div className="text-cyan-300">
                step: {activeStep} | crop: {cropSettings.marginTop}px | h: {cropSettings.minHeight}px | mask: {cropSettings.maskHeight}px
              </div>
              <div className="text-stone-400 text-[8px] truncate">
                {debugInfo}
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelWrapper>
  );
}
