'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Clock, DollarSign, User, Check } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import Image from 'next/image';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { getAssetsByServiceSlug, type AssetWithTags } from '@/actions/dam';
import type { Panel, ServicePanelData } from '@/types/panel-stack';

interface ServicePanelProps {
  panel: Panel;
}

type PanelView = 'browse' | 'service-detail' | 'time-selection';

// Mock providers - will be replaced with real data
const MOCK_PROVIDERS = [
  { id: '1', name: 'Sarah', imageUrl: '/placeholder-team.jpg', role: 'Lead Lash Artist' },
  { id: '2', name: 'Maya', imageUrl: '/placeholder-team.jpg', role: 'Lash Specialist' },
  { id: '3', name: 'Jamie', imageUrl: '/placeholder-team.jpg', role: 'Lash Artist' },
  { id: '4', name: 'Taylor', imageUrl: '/placeholder-team.jpg', role: 'Senior Artist' },
];

export function ServicePanel({ panel }: ServicePanelProps) {
  const { state, actions } = usePanelStack();
  const data = panel.data as ServicePanelData;

  // View state
  const [currentView, setCurrentView] = useState<PanelView>('browse');
  const [navigationPath, setNavigationPath] = useState<string[]>([data.categoryName]);

  // Browse view state
  const [activeTab, setActiveTab] = useState(data.subcategories[0]?.id || '');

  // Service detail view state
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [gallery, setGallery] = useState<AssetWithTags[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

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
        .map(id => MOCK_PROVIDERS.find(p => p.id === id)?.name)
        .filter(Boolean);

      const summary = providerNames.length > 0
        ? `${selectedService.name} · ${providerNames.join(', ')}`
        : selectedService.name;

      actions.updatePanelSummary(panel.id, summary);
    }
  }, [currentView, activeTab, filteredServices.length, data.subcategories, data.services.length, selectedService, selectedProviders, panel.id, actions]);

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
    setSelectedService(service);
    setCurrentView('service-detail');
    setNavigationPath([data.categoryName, service.name]);
    setSelectedProviders(new Set()); // Reset provider selection
  };

  const handleBackToBrowse = () => {
    setCurrentView('browse');
    setNavigationPath([data.categoryName]);
    setSelectedService(null);
    setSelectedProviders(new Set());
    setGallery([]);
  };

  const handleContinueToTimeSelection = () => {
    setCurrentView('time-selection');
    setNavigationPath([data.categoryName, selectedService.name, 'Select Time']);
  };

  // Provider selection handlers
  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      return newSet;
    });
  };

  const handleSelectAllProviders = () => {
    if (selectedProviders.size === MOCK_PROVIDERS.length) {
      setSelectedProviders(new Set());
    } else {
      setSelectedProviders(new Set(MOCK_PROVIDERS.map(p => p.id)));
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

  // Breadcrumb component
  const Breadcrumb = () => (
    <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm mb-3 md:mb-4 flex-wrap">
      <button
        onClick={handleBackToBrowse}
        className={`transition-colors ${
          currentView === 'browse'
            ? 'text-dune font-medium'
            : 'text-sage hover:text-dusty-rose'
        }`}
      >
        {data.categoryName}
      </button>

      {selectedService && (
        <>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-sage/50" />
          <button
            onClick={() => currentView === 'time-selection' && setCurrentView('service-detail')}
            className={`transition-colors ${
              currentView === 'service-detail'
                ? 'text-dune font-medium'
                : currentView === 'time-selection'
                ? 'text-sage hover:text-dusty-rose'
                : 'text-dune'
            }`}
          >
            {selectedService.name}
          </button>
        </>
      )}

      {currentView === 'time-selection' && (
        <>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-sage/50" />
          <span className="text-dune font-medium">Select Time</span>
        </>
      )}
    </div>
  );

  const visiblePhotos = showAllPhotos ? gallery : gallery.slice(0, 8);
  const priceDisplay = selectedService ? `$${(selectedService.priceStarting / 100).toFixed(0)}+` : '';

  return (
    <div {...swipeHandlers}>
      <PanelWrapper
        panel={panel}
        title={currentView === 'browse' ? data.categoryName : ''}
        subtitle={currentView === 'browse' ? `${filteredServices.length} services available` : ''}
      >
        {/* Breadcrumb Navigation */}
        {currentView !== 'browse' && <Breadcrumb />}

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
                <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                  {data.subcategories.map(subcat => (
                    <button
                      key={subcat.id}
                      onClick={() => setActiveTab(subcat.id)}
                      className={`
                        px-3 py-1.5 md:px-4 md:py-2 rounded-full whitespace-nowrap transition-all text-sm md:text-base
                        ${
                          activeTab === subcat.id
                            ? 'bg-dusty-rose text-white shadow-md'
                            : 'bg-sage/10 text-sage hover:bg-sage/20'
                        }
                      `}
                    >
                      {subcat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Service Cards - Horizontal Scroll */}
              <div className="relative">
                <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                  {filteredServices.map((service, index) => (
                    <motion.button
                      key={service.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleServiceClick(service)}
                      className="flex-shrink-0 w-56 md:w-64 p-3 md:p-4 rounded-xl glass hover:shadow-lg transition-all text-left"
                    >
                      <div className="aspect-video bg-warm-sand/20 rounded-lg mb-2 md:mb-3" />
                      <h4 className="font-medium text-dune mb-1 md:mb-2 text-sm md:text-base truncate">
                        {service.name}
                      </h4>
                      {service.subtitle && (
                        <p className="text-xs text-sage/80 mb-2 line-clamp-1">{service.subtitle}</p>
                      )}
                      <div className="flex items-center justify-between text-xs md:text-sm text-sage">
                        <span className="font-medium">${(service.priceStarting / 100).toFixed(0)}+</span>
                        <span>{service.durationMinutes} min</span>
                      </div>
                      <div className="mt-2 md:mt-3 flex items-center text-xs md:text-sm text-dusty-rose">
                        View Details
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                      </div>
                    </motion.button>
                  ))}
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
              {/* Quick Stats */}
              <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-sage" />
                  <span className="text-xs md:text-sm text-dune">{selectedService.durationMinutes} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-terracotta" />
                  <span className="text-xs md:text-sm text-dune">Starting at {priceDisplay}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-ocean-mist" />
                  <span className="text-xs md:text-sm text-dune">{MOCK_PROVIDERS.length} artists available</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm md:text-base text-dune/80 leading-relaxed">
                  {selectedService.description}
                </p>
              </div>

              {/* Photo Gallery */}
              {gallery.length > 0 && (
                <div>
                  <h4 className="font-medium text-dune mb-3 text-sm md:text-base">Our Work</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
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
                      className="mt-3 text-xs md:text-sm text-dusty-rose hover:text-terracotta transition-colors"
                    >
                      {showAllPhotos ? 'Show Less' : `View All ${gallery.length} Photos`}
                    </button>
                  )}
                </div>
              )}

              {/* Provider Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-dune text-sm md:text-base">Choose Your Artist</h4>
                  <button
                    onClick={handleSelectAllProviders}
                    className="text-xs md:text-sm text-sage hover:text-dusty-rose transition-colors"
                  >
                    {selectedProviders.size === MOCK_PROVIDERS.length ? 'Deselect All' : 'See All Availability'}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {MOCK_PROVIDERS.map(provider => {
                    const isSelected = selectedProviders.has(provider.id);

                    return (
                      <motion.button
                        key={provider.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleProviderToggle(provider.id)}
                        className={`
                          relative p-2 md:p-3 rounded-xl transition-all
                          ${
                            isSelected
                              ? 'bg-gradient-to-br from-dusty-rose/30 to-warm-sand/30 ring-2 ring-dusty-rose shadow-md'
                              : 'bg-sage/5 hover:bg-sage/10'
                          }
                        `}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1 right-1 md:top-2 md:right-2 w-4 h-4 md:w-5 md:h-5 rounded-full bg-dusty-rose flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                          </motion.div>
                        )}

                        <div className="aspect-square bg-warm-sand/20 rounded-lg mb-1 md:mb-2" />
                        <p className="text-xs md:text-sm font-medium text-dune text-center truncate">{provider.name}</p>
                        <p className="text-[10px] md:text-xs text-sage text-center mt-0.5 truncate">{provider.role}</p>
                      </motion.button>
                    );
                  })}
                </div>

                {selectedProviders.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 md:mt-4 p-2 md:p-3 rounded-xl bg-sage/10 border border-sage/20"
                  >
                    <p className="text-xs md:text-sm text-sage">
                      <strong>{selectedProviders.size}</strong> {selectedProviders.size === 1 ? 'artist' : 'artists'} selected
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Continue Button */}
              <div className="pt-3 md:pt-4 border-t border-sage/10">
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

          {/* TIME SELECTION VIEW - Placeholder */}
          {currentView === 'time-selection' && (
            <motion.div
              key="time-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="text-center py-12"
            >
              <h3 className="text-lg md:text-xl font-medium text-dune mb-2">Time Selection</h3>
              <p className="text-sm md:text-base text-sage">
                Calendar and availability picker coming soon...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </PanelWrapper>
    </div>
  );
}
