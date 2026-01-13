'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Clock, DollarSign, ExternalLink } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import Image from 'next/image';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { useUserKnowledge } from '@/contexts/UserKnowledgeContext';
import { getAssetsByServiceSlug, type AssetWithTags } from '@/actions/dam';
import type { Panel, ServicePanelData, BreadcrumbStep } from '@/types/panel-stack';

// Base Vagaro booking URL for Lash Pop
const VAGARO_BASE_BOOKING_URL = 'https://www.vagaro.com/lashpop32';

interface ServicePanelProps {
  panel: Panel;
}

type PanelView = 'browse' | 'service-detail';

export function ServicePanel({ panel }: ServicePanelProps) {
  const { actions } = usePanelStack();
  const { trackServiceView, trackServiceSelection } = useUserKnowledge();
  const data = panel.data as ServicePanelData;

  // View state
  const [currentView, setCurrentView] = useState<PanelView>('browse');

  // Browse view state
  const [activeTab, setActiveTab] = useState(data.subcategories[0]?.id || '');

  // Service detail view state
  const [selectedService, setSelectedService] = useState<any>(null);
  const [gallery, setGallery] = useState<AssetWithTags[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Build breadcrumbs based on current view
  const buildBreadcrumbs = useCallback((): BreadcrumbStep[] => {
    const crumbs: BreadcrumbStep[] = [
      { id: 'browse', label: data.categoryName }
    ];

    if (selectedService && currentView === 'service-detail') {
      crumbs.push({ id: 'service-detail', label: selectedService.name, data: { serviceId: selectedService.id } });
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
        setGallery([]);
        break;
      case 'service-detail':
        setCurrentView('service-detail');
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
      actions.updatePanelSummary(panel.id, selectedService.name);
    }
  }, [currentView, activeTab, filteredServices.length, data.subcategories, data.services.length, selectedService, panel.id, actions]);

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

    setSelectedService(service);

    // Go to service detail view within the panel
    setCurrentView('service-detail');
  };

  const handleBackToBrowse = () => {
    setCurrentView('browse');
    setSelectedService(null);
    setGallery([]);
  };

  // Open Vagaro booking in a new tab
  const handleContinueToBook = () => {
    // Track service selection
    if (selectedService) {
      trackServiceSelection(selectedService.id, selectedService.name, data.categoryId);
    }

    // Generate Vagaro booking URL with service filter if available
    const bookingUrl = selectedService?.vagaroServiceId
      ? `${VAGARO_BASE_BOOKING_URL}?sId=${selectedService.vagaroServiceId}`
      : VAGARO_BASE_BOOKING_URL;

    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
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

              {/* Continue to Book Button */}
              <div className="pt-3 md:pt-4 border-t border-sage/10 px-4 md:px-0 pb-4 md:pb-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinueToBook}
                  className="w-full px-4 py-3 md:px-6 md:py-4 rounded-full font-medium transition-all text-sm md:text-base bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Continue to Book
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </PanelWrapper>
    </div>
  );
}
