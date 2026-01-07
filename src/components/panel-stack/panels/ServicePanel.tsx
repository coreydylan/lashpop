'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Clock, DollarSign, User, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import Image from 'next/image';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { useUserKnowledge } from '@/contexts/UserKnowledgeContext';
import { useVagaroWidget } from '@/contexts/VagaroWidgetContext';
import { PhoneSaveNudge } from '@/components/auth/PhoneSaveNudge';
import { LPLogoLoader } from '@/components/ui/LPLogoLoader';
import { getAssetsByServiceSlug, type AssetWithTags } from '@/actions/dam';
import { getTeamMembersByServiceId } from '@/actions/team';
import { VagaroBookingWidget } from '@/components/VagaroBookingWidget';
import { getVagaroWidgetUrl } from '@/lib/vagaro-widget';
import type { Panel, ServicePanelData, BreadcrumbStep } from '@/types/panel-stack';
import type { SelectTeamMember } from '@/db/schema/team_members';

interface ServicePanelProps {
  panel: Panel;
}

type PanelView = 'browse' | 'service-detail' | 'time-selection' | 'booking';

// Services that use the inline Vagaro booking widget (fallback for services not yet in DB)
const SERVICES_WITH_VAGARO_WIDGET = ['classic', 'classic-fill', 'classic-mini'];

// Hardcoded fallback widget URLs for demo services
const SERVICE_WIDGET_SCRIPTS: Record<string, string> = {
  'classic': 'https://www.vagaro.com//resources/WidgetEmbeddedLoader/OZqsEJatCoPqFJ1y6BuSdBuOc1WJD1wOc1WO61Ctdg4tjxMG9pUxapkUcvCu7gCmjZcoapOUc9CvdfQOapkvdfoR6foRW?v=hiLxqW4Klh4bZZdrYo8KnJ4QSz12Y9nutihT1iqCSyC#',
};

// Mock providers - preserved for future use (provider selection commented out)
// const MOCK_PROVIDERS = [
//   { id: '1', name: 'Sarah', imageUrl: '/placeholder-team.jpg', role: 'Lead Lash Artist' },
//   { id: '2', name: 'Maya', imageUrl: '/placeholder-team.jpg', role: 'Lash Specialist' },
//   { id: '3', name: 'Jamie', imageUrl: '/placeholder-team.jpg', role: 'Lash Artist' },
//   { id: '4', name: 'Taylor', imageUrl: '/placeholder-team.jpg', role: 'Senior Artist' },
// ];

export function ServicePanel({ panel }: ServicePanelProps) {
  const { state, actions } = usePanelStack();
  const { trackServiceView, trackServiceSelection, trackProviderSelection, shouldShowSaveNudge } = useUserKnowledge();
  const { state: vagaroState, reset: resetVagaroState } = useVagaroWidget();
  const data = panel.data as ServicePanelData;

  // View state
  const [currentView, setCurrentView] = useState<PanelView>('browse');

  // Browse view state
  const [activeTab, setActiveTab] = useState(data.subcategories[0]?.id || '');

  // Service detail view state
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [providers, setProviders] = useState<SelectTeamMember[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [gallery, setGallery] = useState<AssetWithTags[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showSaveNudge, setShowSaveNudge] = useState(false);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  // Booking view state (inline Vagaro widget)
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const loadedServiceIdRef = useRef<string | null>(null); // Track which service the widget was loaded for
  const [isBookingLoading, setIsBookingLoading] = useState(true);
  const [hasBookingError, setHasBookingError] = useState(false);

  // Build breadcrumbs based on current view
  const buildBreadcrumbs = useCallback((): BreadcrumbStep[] => {
    const crumbs: BreadcrumbStep[] = [
      { id: 'browse', label: data.categoryName }
    ];

    if (selectedService && (currentView === 'service-detail' || currentView === 'time-selection' || currentView === 'booking')) {
      crumbs.push({ id: 'service-detail', label: selectedService.name, data: { serviceId: selectedService.id } });
    }

    if (currentView === 'time-selection') {
      crumbs.push({ id: 'time-selection', label: 'Select Artist' });
    }

    if (currentView === 'booking') {
      crumbs.push({ id: 'booking', label: 'Book' });
    }

    return crumbs;
  }, [data.categoryName, selectedService, currentView]);

  // Update breadcrumbs when view changes
  useEffect(() => {
    const breadcrumbs = buildBreadcrumbs();
    actions.updatePanelBreadcrumbs(panel.id, breadcrumbs);
  }, [currentView, selectedService, panel.id, actions, buildBreadcrumbs]);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback((stepId: string) => {
    switch (stepId) {
      case 'browse':
        setCurrentView('browse');
        setSelectedService(null);
        setSelectedProviders(new Set());
        setGallery([]);
        // Reset widget state
        scriptLoadedRef.current = false;
        loadedServiceIdRef.current = null;
        setIsBookingLoading(true);
        setHasBookingError(false);
        break;
      case 'service-detail':
        setCurrentView('service-detail');
        // Reset widget state
        scriptLoadedRef.current = false;
        loadedServiceIdRef.current = null;
        setIsBookingLoading(true);
        setHasBookingError(false);
        break;
      case 'time-selection':
        setCurrentView('time-selection');
        // Reset widget state
        scriptLoadedRef.current = false;
        loadedServiceIdRef.current = null;
        setIsBookingLoading(true);
        setHasBookingError(false);
        break;
    }
  }, []);

  // Filter services by active subcategory
  const filteredServices = useMemo(() => {
    if (!activeTab || data.subcategories.length === 0) return data.services;
    return data.services.filter(service => service.subcategorySlug === activeTab);
  }, [activeTab, data.services, data.subcategories]);

  // Update panel summary based on current view and state
  useEffect(() => {
    if (currentView === 'browse') {
      const activeSubcat = data.subcategories.find(s => s.id === activeTab);
      const summary = activeSubcat
        ? `${activeSubcat.name} · ${filteredServices.length} services`
        : `${data.services.length} services`;
      actions.updatePanelSummary(panel.id, summary);
    } else if (currentView === 'service-detail' && selectedService) {
      const providerNames = Array.from(selectedProviders)
        .map(id => providers.find(p => p.id === id)?.name)
        .filter(Boolean);

      const summary = providerNames.length > 0
        ? `${selectedService.name} · ${providerNames.join(', ')}`
        : selectedService.name;

      actions.updatePanelSummary(panel.id, summary);
    }
  }, [currentView, activeTab, filteredServices.length, data.subcategories, data.services.length, selectedService, selectedProviders, providers, panel.id, actions]);

  // Fetch team members when service is selected (only for service-detail view, not booking)
  useEffect(() => {
    async function fetchProviders() {
      // Skip if no service, in booking view, or service doesn't have a valid UUID
      if (!selectedService || currentView === 'booking') return;

      // Check if the ID looks like a UUID (basic check)
      const isValidUuid = selectedService.id && selectedService.id.includes('-');
      if (!isValidUuid) {
        console.warn('Service ID is not a valid UUID, skipping provider fetch:', selectedService.id);
        return;
      }

      setIsLoadingProviders(true);
      try {
        const members = await getTeamMembersByServiceId(selectedService.id);
        setProviders(members);
      } catch (error) {
        console.error('Failed to fetch team members:', error);
      } finally {
        setIsLoadingProviders(false);
      }
    }

    fetchProviders();
  }, [selectedService, currentView]);

  // Fetch gallery when service is selected
  useEffect(() => {
    async function fetchGallery() {
      if (!selectedService) return;

      setIsLoadingGallery(true);
      try {
        const assets = await getAssetsByServiceSlug(selectedService.slug);
        setGallery(assets);
      } catch (error) {
        console.error('Failed to fetch service gallery:', error);
      } finally {
        setIsLoadingGallery(false);
      }
    }

    if (currentView === 'service-detail') {
      fetchGallery();
    }
  }, [selectedService, currentView]);

  // Navigation handlers
  const handleServiceClick = (service: any) => {
    // Track service view
    trackServiceView(service.id, service.name, data.categoryId);

    // Check if service should use Vagaro widget (has DB code/URL or is in hardcoded demo list)
    const shouldUseVagaroWidget = service.vagaroServiceCode || service.vagaroWidgetUrl || SERVICES_WITH_VAGARO_WIDGET.includes(service.slug);

    setSelectedService(service);
    setSelectedProviders(new Set()); // Reset provider selection

    // Reset widget state for new service
    scriptLoadedRef.current = false;
    loadedServiceIdRef.current = null;
    setIsBookingLoading(true);
    setHasBookingError(false);
    resetVagaroState(); // Reset widget loaded state for fresh loading animation

    if (shouldUseVagaroWidget) {
      // Go directly to booking view for services with Vagaro widget
      setCurrentView('booking');
    } else {
      // Go to service detail for services without widget (legacy flow)
      setCurrentView('service-detail');
    }
  };

  const handleBackToBrowse = () => {
    setCurrentView('browse');
    setSelectedService(null);
    setSelectedProviders(new Set());
    setGallery([]);
    // Reset widget state
    scriptLoadedRef.current = false;
    loadedServiceIdRef.current = null;
    setIsBookingLoading(true);
    setHasBookingError(false);
  };

  const handleContinueToTimeSelection = () => {
    // Track service selection
    if (selectedService) {
      trackServiceSelection(selectedService.id, selectedService.name, data.categoryId);
    }

    setCurrentView('time-selection');
  };

  const handleContinueToBooking = () => {
    // Track service selection
    if (selectedService) {
      trackServiceSelection(selectedService.id, selectedService.name, data.categoryId);
    }

    // Reset widget state only if switching to a different booking
    // Don't reset if we're just continuing from time selection for the same service
    if (loadedServiceIdRef.current !== selectedService?.id) {
      scriptLoadedRef.current = false;
      loadedServiceIdRef.current = null;
      setIsBookingLoading(true);
      setHasBookingError(false);
      resetVagaroState(); // Reset widget loaded state for fresh loading animation
    }

    setCurrentView('booking');
  };

  // Get widget script URL for booking view
  const getWidgetScriptUrl = useCallback(() => {
    if (!selectedService) return getVagaroWidgetUrl(null);

    console.log('getWidgetScriptUrl - selectedService:', {
      name: selectedService.name,
      slug: selectedService.slug,
      vagaroWidgetUrl: selectedService.vagaroWidgetUrl,
      vagaroServiceCode: selectedService.vagaroServiceCode,
    });

    // Use vagaroWidgetUrl from DB, fall back to hardcoded, then all-services
    const url = selectedService.vagaroWidgetUrl
      || SERVICE_WIDGET_SCRIPTS[selectedService.slug]
      || getVagaroWidgetUrl(null);

    console.log('getWidgetScriptUrl - using URL:', url);
    return url;
  }, [selectedService]);

  // Load Vagaro widget when container is mounted (using callback ref)
  const loadWidgetIntoContainer = useCallback((container: HTMLDivElement | null) => {
    if (!container || currentView !== 'booking' || !selectedService) return;

    // Store ref for potential cleanup
    widgetContainerRef.current = container;

    // Check if widget is already loaded for this service - don't reload on collapse/expand
    if (loadedServiceIdRef.current === selectedService.id && container.children.length > 0) {
      console.log('Vagaro widget already loaded for this service, skipping reload');
      return;
    }

    // Clear any existing content (only when loading new service)
    container.innerHTML = '';

    const widgetScriptUrl = getWidgetScriptUrl();
    console.log('Loading Vagaro widget:', widgetScriptUrl);

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
      console.log('Vagaro widget script loaded');
      loadedServiceIdRef.current = selectedService.id; // Track that widget is loaded for this service
      setIsBookingLoading(false);
    };

    script.onerror = (e) => {
      console.error('Vagaro widget script failed to load', e);
      setIsBookingLoading(false);
      setHasBookingError(true);
    };

    vagaroDiv.appendChild(script);
    container.appendChild(vagaroDiv);

    // Fallback timeout to hide loading
    setTimeout(() => {
      setIsBookingLoading(false);
    }, 5000);
  }, [currentView, selectedService, getWidgetScriptUrl]);

  // Provider selection handlers
  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
        // Track provider selection
        if (selectedService) {
          trackProviderSelection(selectedService.id, providerId);
        }
      }
      return newSet;
    });
  };

  const handleSelectAllProviders = () => {
    if (selectedProviders.size === providers.length) {
      setSelectedProviders(new Set());
    } else {
      setSelectedProviders(new Set(providers.map(p => p.id)));
    }
  };

  // Swipe handlers for switching between service panels (mobile)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (panel.state === 'docked' && panel.swipeEnabled) {
        actions.expandNextServicePanel();
      }
    },
    onSwipedRight: () => {
      if (panel.state === 'docked' && panel.swipeEnabled) {
        actions.expandPreviousServicePanel();
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
  });

  const visiblePhotos = showAllPhotos ? gallery : gallery.slice(0, 8);
  const priceDisplay = selectedService ? `$${(selectedService.priceStarting / 100).toFixed(0)}+` : '';

  return (
    <div {...swipeHandlers}>
      <PanelWrapper
        panel={panel}
        title={currentView === 'browse' ? data.categoryName : ''}
        subtitle={currentView === 'browse' ? `${filteredServices.length} services available` : ''}
        onBreadcrumbClick={handleBreadcrumbClick}
        fullWidthContent={currentView === 'booking'}
      >
        {/* View Content with Animations */}
        <AnimatePresence mode="wait">
          {/* BROWSE VIEW */}
          {currentView === 'browse' && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Subcategory Tabs */}
              {data.subcategories.length > 0 && (
                <div className="mb-4 md:mb-6 -mx-4 px-4 md:mx-0 md:px-0">
                  <div className="flex gap-2 md:gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                    {data.subcategories.map(subcat => (
                      <button
                        key={subcat.id}
                        onClick={() => setActiveTab(subcat.id)}
                        className={`
                          px-4 py-2 rounded-full whitespace-nowrap transition-all
                          text-sm md:text-base font-medium flex-shrink-0
                          ${
                            activeTab === subcat.id
                              ? 'bg-dusty-rose text-white shadow-md'
                              : 'bg-sage/10 text-sage hover:bg-sage/20 active:bg-sage/20'
                          }
                        `}
                      >
                        {subcat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Cards - Mobile: larger cards, Desktop: original sizing */}
              <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 scrollbar-hide">
                  {filteredServices.map((service, index) => {
                    // Get service image (keyImageAssetId creates URL through imageUrl, or use imageUrl directly)
                    const serviceImage = service.imageUrl;

                    return (
                    <motion.button
                      key={service.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleServiceClick(service)}
                      className="flex-shrink-0 w-56 md:w-64 rounded-2xl md:rounded-xl glass hover:shadow-lg transition-all text-left overflow-hidden"
                    >
                      {/* Card Image - Mobile: taller aspect, Desktop: video */}
                      <div className="aspect-[4/3] md:aspect-video bg-warm-sand/20 relative overflow-hidden">
                        {serviceImage ? (
                          <Image
                            src={serviceImage}
                            alt={service.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 224px, 256px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-sage/10 flex items-center justify-center">
                              <span className="text-xs text-sage/40">
                                {service.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-4 md:p-4">
                        <h4 className="font-medium text-dune text-sm md:text-base line-clamp-1 mb-1 md:mb-2">
                          {service.name}
                        </h4>
                        {service.subtitle && (
                          <p className="text-xs text-sage/80 mb-3 md:mb-2 line-clamp-2 md:line-clamp-1">
                            {service.subtitle}
                          </p>
                        )}

                        {/* Price and Duration row */}
                        <div className="flex items-center justify-between text-sm mb-3 md:mb-0">
                          <span className="font-semibold text-dune">
                            ${(service.priceStarting / 100).toFixed(0)}+
                          </span>
                          <span className="text-sage">{service.durationMinutes} min</span>
                        </div>

                        {/* Book button - Mobile only */}
                        <div className="md:hidden flex items-center justify-center gap-1 py-2 rounded-full bg-dusty-rose/10 text-dusty-rose text-sm font-medium">
                          Book Now
                          <ChevronRight className="w-4 h-4" />
                        </div>

                        {/* View Details - Desktop only */}
                        <div className="hidden md:flex items-center mt-3 text-sm text-dusty-rose">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </motion.button>
                  );
                  })}
                </div>
              </div>

              {filteredServices.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sage">No services found in this category.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* SERVICE DETAIL VIEW */}
          {currentView === 'service-detail' && selectedService && (
            <motion.div
              key="service-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 md:space-y-6"
            >
              {/* Quick Stats - Mobile: full-bleed bar, Desktop: inline */}
              <div className="flex items-center justify-around md:justify-start md:gap-6 py-4 md:py-0 bg-sage/5 md:bg-transparent md:flex-wrap">
                <div className="text-center md:text-left md:flex md:items-center md:gap-2">
                  <Clock className="w-5 h-5 md:w-5 md:h-5 text-sage mx-auto md:mx-0 mb-1 md:mb-0" />
                  <span className="text-sm font-medium text-dune">{selectedService.durationMinutes} min</span>
                </div>
                <div className="w-px h-8 bg-sage/20 md:hidden" />
                <div className="text-center md:text-left md:flex md:items-center md:gap-2">
                  <DollarSign className="w-5 h-5 md:w-5 md:h-5 text-terracotta mx-auto md:mx-0 mb-1 md:mb-0" />
                  <span className="text-sm font-medium text-dune">From {priceDisplay}</span>
                </div>
                <div className="w-px h-8 bg-sage/20 md:hidden" />
                <div className="text-center md:text-left md:flex md:items-center md:gap-2">
                  <User className="w-5 h-5 md:w-5 md:h-5 text-ocean-mist mx-auto md:mx-0 mb-1 md:mb-0" />
                  <span className="text-sm font-medium text-dune">{providers.length || 4} artists</span>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 md:px-0">
                <p className="text-sm md:text-base text-dune/80 leading-relaxed">
                  {selectedService.description}
                </p>
              </div>

              {/* Photo Gallery */}
              {gallery.length > 0 && (
                <div>
                  <h4 className="font-medium text-dune mb-3 px-4 md:px-0 text-sm md:text-base">Our Work</h4>
                  {/* Mobile: horizontal scroll, Desktop: grid */}
                  <div className="md:hidden overflow-x-auto scrollbar-hide px-4">
                    <div className="flex gap-2">
                      {isLoadingGallery ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-shrink-0 w-32 h-32 bg-sage/10 rounded-xl animate-pulse"
                          />
                        ))
                      ) : (
                        visiblePhotos.map((asset, i) => (
                          <motion.div
                            key={asset.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden"
                          >
                            <Image
                              src={asset.filePath}
                              alt={asset.fileName}
                              fill
                              className="object-cover"
                            />
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                  {/* Desktop: grid */}
                  <div className="hidden md:grid grid-cols-4 gap-3">
                    {isLoadingGallery ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-sage/10 rounded-lg animate-pulse"
                        />
                      ))
                    ) : (
                      visiblePhotos.map((asset, i) => (
                        <motion.div
                          key={asset.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                        >
                          <Image
                            src={asset.filePath}
                            alt={asset.fileName}
                            fill
                            className="object-cover transition-transform group-hover:scale-110"
                          />
                        </motion.div>
                      ))
                    )}
                  </div>

                  {gallery.length > 8 && (
                    <button
                      onClick={() => setShowAllPhotos(!showAllPhotos)}
                      className="mt-3 px-4 md:px-0 text-xs md:text-sm text-dusty-rose font-medium hover:text-terracotta transition-colors"
                    >
                      {showAllPhotos ? 'Show Less' : `View All ${gallery.length} Photos`}
                    </button>
                  )}
                </div>
              )}

              {/* Provider Selection */}
              <div className="px-4 md:px-0">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h4 className="font-medium text-dune text-sm md:text-base">
                    Choose Your Artist
                    {isLoadingProviders && (
                      <span className="ml-2 text-xs text-sage/60">Loading...</span>
                    )}
                  </h4>
                  {providers.length > 0 && (
                    <button
                      onClick={handleSelectAllProviders}
                      className="text-xs md:text-sm text-dusty-rose font-medium hover:text-terracotta transition-colors"
                    >
                      {selectedProviders.size === providers.length ? 'Clear' : 'Any Artist'}
                    </button>
                  )}
                </div>

                {/* Loading State */}
                {isLoadingProviders && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="p-2 md:p-3 rounded-xl md:rounded-xl bg-sage/5 animate-pulse"
                      >
                        <div className="aspect-square bg-warm-sand/20 rounded-lg mb-1 md:mb-2" />
                        <div className="h-3 bg-sage/10 rounded mb-1" />
                        <div className="h-2 bg-sage/10 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Providers - 2-column grid on mobile, 4-column on desktop */}
                {!isLoadingProviders && providers.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {providers.map(provider => {
                      const isSelected = selectedProviders.has(provider.id);

                      return (
                        <motion.button
                          key={provider.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleProviderToggle(provider.id)}
                          className={`
                            relative p-3 rounded-2xl md:rounded-xl transition-all text-left
                            ${
                              isSelected
                                ? 'bg-gradient-to-br from-dusty-rose/20 to-warm-sand/20 ring-2 ring-dusty-rose shadow-md'
                                : 'bg-sage/5 hover:bg-sage/10 active:bg-sage/10'
                            }
                          `}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-5 h-5 md:w-5 md:h-5 rounded-full bg-dusty-rose flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}

                          {provider.imageUrl ? (
                            <div className="aspect-square rounded-xl md:rounded-lg mb-2 overflow-hidden">
                              <Image
                                src={provider.imageUrl}
                                alt={provider.name}
                                width={120}
                                height={120}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-square bg-warm-sand/20 rounded-xl md:rounded-lg mb-2 flex items-center justify-center">
                              <User className="w-6 h-6 md:w-6 md:h-6 text-sage/30" />
                            </div>
                          )}
                          <p className="text-sm font-medium text-dune text-center truncate">{provider.name}</p>
                          <p className="text-xs text-sage text-center mt-0.5 truncate">{provider.role}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* No Providers State */}
                {!isLoadingProviders && providers.length === 0 && (
                  <div className="glass rounded-xl p-6 text-center">
                    <User className="w-10 h-10 text-sage/30 mx-auto mb-2" />
                    <p className="text-sm text-dune/60">No artists available for this service</p>
                  </div>
                )}

                {/* Selection summary */}
                {selectedProviders.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 md:mt-4 p-2 md:p-3 rounded-xl bg-dusty-rose/10 border border-dusty-rose/20"
                  >
                    <p className="text-xs md:text-sm text-dusty-rose">
                      <strong>{selectedProviders.size}</strong> {selectedProviders.size === 1 ? 'artist' : 'artists'} selected
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Phone Save Nudge - appears contextually */}
              <AnimatePresence>
                {shouldShowSaveNudge() && selectedProviders.size > 0 && !showSaveNudge && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onAnimationComplete={() => setShowSaveNudge(true)}
                    className="px-4 md:px-0"
                  >
                    <PhoneSaveNudge onClose={() => setShowSaveNudge(false)} context="service-selection" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Continue Button */}
              <div className="pt-3 md:pt-4 border-t border-sage/10 px-4 md:px-0 pb-4 md:pb-0">
                <motion.button
                  whileHover={{ scale: selectedProviders.size > 0 ? 1.02 : 1 }}
                  whileTap={{ scale: selectedProviders.size > 0 ? 0.98 : 1 }}
                  onClick={handleContinueToTimeSelection}
                  disabled={selectedProviders.size === 0}
                  className={`
                    w-full px-4 py-3 md:px-6 md:py-4 rounded-full font-medium transition-all text-sm md:text-base
                    ${
                      selectedProviders.size > 0
                        ? 'bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white shadow-lg hover:shadow-xl'
                        : 'bg-sage/20 text-sage/50 cursor-not-allowed'
                    }
                  `}
                >
                  {selectedProviders.size === 0
                    ? 'Select an artist to continue'
                    : selectedProviders.size === 1
                    ? 'Continue to Time Selection'
                    : `Continue with ${selectedProviders.size} Artists`}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* TIME SELECTION VIEW - Vagaro Widget */}
          {currentView === 'time-selection' && selectedService && (
            <motion.div
              key="time-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 md:space-y-6"
            >
              {/* Booking Summary - Mobile: compact bar, Desktop: card */}
              <div className="flex items-center justify-between md:gap-4 py-3 px-4 md:py-3 md:px-4 md:rounded-xl bg-sage/5 md:bg-gradient-to-r md:from-sage/5 md:to-ocean-mist/5">
                <div className="flex-1">
                  <p className="text-sm md:text-sm text-dune/60 hidden md:block">Booking</p>
                  <p className="text-sm font-medium text-dune">{selectedService.name}</p>
                  <p className="text-xs text-sage md:hidden">
                    {selectedProviders.size > 0
                      ? Array.from(selectedProviders)
                          .map(id => providers.find(p => p.id === id)?.name.split(' ')[0])
                          .filter(Boolean)
                          .join(', ') || 'Any artist'
                      : 'Any artist'}
                  </p>
                </div>
                <div className="flex items-center gap-3 md:gap-4 text-sm">
                  {selectedProviders.size > 0 && (
                    <div className="hidden md:flex items-center gap-1.5 text-dune/70">
                      <User className="w-4 h-4" />
                      <span>
                        {Array.from(selectedProviders)
                          .map(id => providers.find(p => p.id === id)?.name.split(' ')[0])
                          .filter(Boolean)
                          .join(', ') || 'Any artist'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-dune/70">
                    <Clock className="w-4 h-4 hidden md:block" />
                    <span className="text-sage md:text-dune/70">{selectedService.durationMinutes} min</span>
                  </div>
                  <div className="font-semibold text-dune md:font-medium md:text-terracotta">
                    {priceDisplay}
                  </div>
                </div>
              </div>

              {/* Widget Container */}
              <div className="relative min-h-[500px] md:min-h-[600px] px-0 md:px-0">
                {/* Loading Overlay */}
                {!isWidgetLoaded && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-ivory md:glass md:rounded-2xl">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-dusty-rose animate-spin mx-auto mb-3" />
                      <p className="text-sm text-dune/60">Loading scheduling...</p>
                    </div>
                  </div>
                )}

                {/* Vagaro Widget */}
                <div className="overflow-hidden md:glass md:rounded-2xl md:shadow-lg">
                  <VagaroBookingWidget
                    businessId={process.env.NEXT_PUBLIC_VAGARO_BUSINESS_ID}
                    serviceId={selectedService.vagaroServiceId || undefined}
                    employeeId={
                      selectedProviders.size === 1
                        ? providers.find(p => p.id === Array.from(selectedProviders)[0])?.vagaroEmployeeId || undefined
                        : undefined
                    }
                    className="min-h-[500px] md:min-h-[600px] w-full"
                  />
                </div>
              </div>

              {/* Info Cards - Desktop only */}
              <div className="hidden md:grid md:grid-cols-3 gap-4">
                <div className="glass rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-sage" />
                  </div>
                  <h3 className="font-medium text-dune text-sm mb-1">
                    Real-time Availability
                  </h3>
                  <p className="text-xs text-dune/60">
                    See live availability for your selected artist
                  </p>
                </div>

                <div className="glass rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-ocean-mist/10 flex items-center justify-center mx-auto mb-2">
                    <Check className="w-5 h-5 text-ocean-mist" />
                  </div>
                  <h3 className="font-medium text-dune text-sm mb-1">
                    Instant Confirmation
                  </h3>
                  <p className="text-xs text-dune/60">
                    Get confirmed immediately upon booking
                  </p>
                </div>

                <div className="glass rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center mx-auto mb-2">
                    <User className="w-5 h-5 text-terracotta" />
                  </div>
                  <h3 className="font-medium text-dune text-sm mb-1">
                    Secure Payment
                  </h3>
                  <p className="text-xs text-dune/60">
                    Safe and encrypted payment processing
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* BOOKING VIEW - Inline Vagaro Widget */}
          {currentView === 'booking' && selectedService && (
            <motion.div
              key="booking"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* CSS to override Vagaro widget styles for seamless full-width integration */}
              <style jsx global>{`
                /* Outer wrapper for cropping and overflow control */
                .vagaro-widget-wrapper {
                  position: relative;
                  overflow: hidden;
                  width: 100% !important;
                  background: #faf6f2; /* ivory background */
                }

                /* Force ALL Vagaro elements to be full width */
                .vagaro-widget-container,
                .vagaro-widget-container .vagaro,
                .vagaro-widget-container .vagaro-container,
                .vagaro-widget-container .vagaro-embedded-widget,
                .vagaro-widget-container .vagaro-iframe,
                .vagaro-widget-container .vagaro-iframe-100 {
                  width: 100% !important;
                  max-width: 100% !important;
                  min-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-sizing: border-box !important;
                }

                /* Hide Vagaro branding/footer links */
                .vagaro-widget-container .vagaro-footer,
                .vagaro-widget-container .vagaro > a,
                .vagaro-widget-container .vagaro > style + a {
                  display: none !important;
                }

                /* Pull the widget up to crop the Vagaro header */
                .vagaro-widget-container {
                  margin-top: -330px !important;
                }

                /* Style the iframe - force full width, seamless edges */
                .vagaro-widget-container iframe {
                  width: 100% !important;
                  min-width: 100% !important;
                  max-width: 100% !important;
                  min-height: 800px !important;
                  border: none !important;
                  display: block !important;
                }
              `}</style>

              {/* Minimal Service Summary - Full bleed bar */}
              <div className="flex items-center justify-between py-3 px-4 bg-sage/5">
                <p className="text-sm font-medium text-dune">{selectedService.name}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-sage">{selectedService.durationMinutes} min</span>
                  <span className="font-semibold text-dune">{priceDisplay}</span>
                </div>
              </div>

              {/* Vagaro Widget Container - Seamless full width */}
              <div className="vagaro-widget-wrapper" style={{ minHeight: '500px' }}>
                {/* Widget container with warm color filter for brand consistency */}
                {/* Hidden until Vagaro sends WidgetLoaded event to mask their internal spinner */}
                <div
                  ref={loadWidgetIntoContainer}
                  className="vagaro-widget-container transition-opacity duration-500"
                  style={{
                    minHeight: '600px',
                    filter: 'sepia(8%) saturate(95%) brightness(100%)',
                    opacity: vagaroState.isLoaded ? 1 : 0,
                  }}
                />

                {/* Loading State - Shows LP logo animation until Vagaro widget is fully ready */}
                {!vagaroState.isLoaded && !hasBookingError && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-ivory z-20 transition-opacity duration-500"
                    style={{ opacity: vagaroState.isLoaded ? 0 : 1 }}
                  >
                    <LPLogoLoader message={"Preparing booking experience\npowered by Vagaro"} size={56} />
                  </div>
                )}

                {/* Error State */}
                {hasBookingError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ivory z-20">
                    <div className="text-center max-w-xs px-4">
                      <AlertCircle className="w-12 h-12 text-terracotta mx-auto mb-4" />
                      <h3 className="font-medium text-dune mb-2">Unable to load booking</h3>
                      <p className="text-sm text-dune/60 mb-4">
                        Please refresh or contact us to book.
                      </p>
                      <button
                        onClick={handleBackToBrowse}
                        className="px-6 py-3 rounded-full bg-dusty-rose text-white text-sm font-medium"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PanelWrapper>
    </div>
  );
}
