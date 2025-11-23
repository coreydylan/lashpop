'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Clock, DollarSign, User, Check, Loader2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import Image from 'next/image';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { useUserKnowledge } from '@/contexts/UserKnowledgeContext';
import { PhoneSaveNudge } from '@/components/auth/PhoneSaveNudge';
import { getAssetsByServiceSlug, type AssetWithTags } from '@/actions/dam';
import { getTeamMembersByServiceId } from '@/actions/team';
import { VagaroBookingWidget } from '@/components/VagaroBookingWidget';
import type { Panel, ServicePanelData } from '@/types/panel-stack';
import type { SelectTeamMember } from '@/db/schema/team_members';

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
  const { trackServiceView, trackServiceSelection, trackProviderSelection, shouldShowSaveNudge } = useUserKnowledge();
  const data = panel.data as ServicePanelData;

  // View state
  const [currentView, setCurrentView] = useState<PanelView>('browse');
  const [navigationPath, setNavigationPath] = useState<string[]>([data.categoryName]);

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

  // Fetch team members when service is selected
  useEffect(() => {
    async function fetchProviders() {
      if (!selectedService) return;

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
  }, [selectedService]);

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
    // Track service selection
    if (selectedService) {
      trackServiceSelection(selectedService.id, selectedService.name, data.categoryId);
    }

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
              {/* Subcategory Tabs - Optimized for mobile */}
              {data.subcategories.length > 0 && (
                <div className="mb-4 md:mb-6 -mx-4 px-4 md:mx-0 md:px-0">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {data.subcategories.map(subcat => (
                      <button
                        key={subcat.id}
                        onClick={() => setActiveTab(subcat.id)}
                        className={`
                          px-3 py-1.5 md:px-4 md:py-2 rounded-full whitespace-nowrap transition-all
                          text-xs md:text-base flex-shrink-0
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
                </div>
              )}

              {/* Service Cards - Optimized horizontal scroll for mobile */}
              <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex gap-2.5 md:gap-4 overflow-x-auto pb-3 scrollbar-hide">
                  {filteredServices.map((service, index) => (
                    <motion.button
                      key={service.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleServiceClick(service)}
                      className="flex-shrink-0 w-48 md:w-64 p-2.5 md:p-4 rounded-xl glass hover:shadow-lg transition-all text-left"
                    >
                      <div className="aspect-video bg-warm-sand/20 rounded-lg mb-2 md:mb-3" />
                      <h4 className="font-medium text-dune mb-1 md:mb-2 text-xs md:text-base truncate">
                        {service.name}
                      </h4>
                      {service.subtitle && (
                        <p className="text-[10px] md:text-xs text-sage/80 mb-1.5 md:mb-2 line-clamp-1">
                          {service.subtitle}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[10px] md:text-sm text-sage">
                        <span className="font-medium">${(service.priceStarting / 100).toFixed(0)}+</span>
                        <span>{service.durationMinutes} min</span>
                      </div>
                      <div className="mt-1.5 md:mt-3 flex items-center text-[10px] md:text-sm text-dusty-rose">
                        View Details
                        <ChevronRight className="w-2.5 h-2.5 md:w-4 md:h-4 ml-1" />
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
              {/* Quick Stats - Compact for mobile */}
              <div className="flex items-center gap-3 md:gap-6 flex-wrap">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Clock className="w-3.5 h-3.5 md:w-5 md:h-5 text-sage" />
                  <span className="text-[11px] md:text-sm text-dune">{selectedService.durationMinutes} min</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <DollarSign className="w-3.5 h-3.5 md:w-5 md:h-5 text-terracotta" />
                  <span className="text-[11px] md:text-sm text-dune">From {priceDisplay}</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <User className="w-3.5 h-3.5 md:w-5 md:h-5 text-ocean-mist" />
                  <span className="text-[11px] md:text-sm text-dune">{providers.length || MOCK_PROVIDERS.length} artists</span>
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
                  <h4 className="font-medium text-dune text-sm md:text-base">
                    Choose Your Artist
                    {isLoadingProviders && (
                      <span className="ml-2 text-xs text-sage/60">Loading...</span>
                    )}
                  </h4>
                  {providers.length > 0 && (
                    <button
                      onClick={handleSelectAllProviders}
                      className="text-xs md:text-sm text-sage hover:text-dusty-rose transition-colors"
                    >
                      {selectedProviders.size === providers.length ? 'Deselect All' : 'See All Availability'}
                    </button>
                  )}
                </div>

                {/* Loading State */}
                {isLoadingProviders && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="p-2 md:p-3 rounded-xl bg-sage/5 animate-pulse"
                      >
                        <div className="aspect-square bg-warm-sand/20 rounded-lg mb-1 md:mb-2" />
                        <div className="h-3 bg-sage/10 rounded mb-1" />
                        <div className="h-2 bg-sage/10 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Providers Grid - Horizontal scroll on mobile, grid on desktop */}
                {!isLoadingProviders && providers.length > 0 && (
                  <div className="md:grid md:grid-cols-4 md:gap-3">
                    {/* Mobile: Horizontal scroll */}
                    <div className="md:hidden -mx-4 px-4">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {providers.map(provider => {
                        const isSelected = selectedProviders.has(provider.id);

                        return (
                          <motion.button
                            key={provider.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleProviderToggle(provider.id)}
                            className={`
                              relative p-2 rounded-xl transition-all flex-shrink-0 w-28
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
                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-dusty-rose flex items-center justify-center"
                              >
                                <Check className="w-2.5 h-2.5 text-white" />
                              </motion.div>
                            )}

                            {provider.imageUrl ? (
                              <div className="aspect-square rounded-lg mb-1 overflow-hidden">
                                <Image
                                  src={provider.imageUrl}
                                  alt={provider.name}
                                  width={100}
                                  height={100}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="aspect-square bg-warm-sand/20 rounded-lg mb-1 flex items-center justify-center">
                                <User className="w-5 h-5 text-sage/30" />
                              </div>
                            )}
                            <p className="text-xs font-medium text-dune text-center truncate">{provider.name}</p>
                            <p className="text-[10px] text-sage text-center mt-0.5 truncate">{provider.role}</p>
                          </motion.button>
                        );
                      })}
                      </div>
                    </div>

                    {/* Desktop: Grid layout */}
                    <div className="hidden md:contents">
                      {providers.map(provider => {
                        const isSelected = selectedProviders.has(provider.id);

                        return (
                          <motion.button
                            key={provider.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleProviderToggle(provider.id)}
                            className={`
                              relative p-3 rounded-xl transition-all
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
                                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-dusty-rose flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}

                            {provider.imageUrl ? (
                              <div className="aspect-square rounded-lg mb-2 overflow-hidden">
                                <Image
                                  src={provider.imageUrl}
                                  alt={provider.name}
                                  width={100}
                                  height={100}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="aspect-square bg-warm-sand/20 rounded-lg mb-2 flex items-center justify-center">
                                <User className="w-6 h-6 text-sage/30" />
                              </div>
                            )}
                            <p className="text-sm font-medium text-dune text-center truncate">{provider.name}</p>
                            <p className="text-xs text-sage text-center mt-0.5 truncate">{provider.role}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No Providers State */}
                {!isLoadingProviders && providers.length === 0 && (
                  <div className="glass rounded-xl p-6 text-center">
                    <User className="w-10 h-10 text-sage/30 mx-auto mb-2" />
                    <p className="text-sm text-dune/60">No artists available for this service</p>
                  </div>
                )}

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

              {/* Phone Save Nudge - appears contextually */}
              <AnimatePresence>
                {shouldShowSaveNudge() && selectedProviders.size > 0 && !showSaveNudge && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onAnimationComplete={() => setShowSaveNudge(true)}
                  >
                    <PhoneSaveNudge onClose={() => setShowSaveNudge(false)} context="service-selection" />
                  </motion.div>
                )}
              </AnimatePresence>

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

          {/* TIME SELECTION VIEW - Vagaro Widget */}
          {currentView === 'time-selection' && selectedService && (
            <motion.div
              key="time-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Booking Summary */}
              <div className="flex items-center gap-4 py-3 px-4 rounded-xl bg-gradient-to-r from-sage/5 to-ocean-mist/5">
                <div className="flex-1">
                  <p className="text-sm text-dune/60">Booking</p>
                  <p className="font-medium text-dune">{selectedService.name}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {selectedProviders.size > 0 && (
                    <div className="flex items-center gap-1.5 text-dune/70">
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
                    <Clock className="w-4 h-4" />
                    <span>{selectedService.durationMinutes} min</span>
                  </div>
                  <div className="font-medium text-terracotta">
                    ${(selectedService.priceStarting / 100).toFixed(0)}+
                  </div>
                </div>
              </div>

              {/* Widget Container */}
              <div className="relative min-h-[600px]">
                {/* Loading Overlay */}
                {!isWidgetLoaded && (
                  <div className="absolute inset-0 z-10 glass rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-3" />
                      <p className="text-sm text-dune/60">Loading scheduling...</p>
                    </div>
                  </div>
                )}

                {/* Vagaro Widget */}
                <div className="glass rounded-2xl overflow-hidden shadow-lg">
                  <VagaroBookingWidget
                    businessId={process.env.NEXT_PUBLIC_VAGARO_BUSINESS_ID}
                    serviceId={selectedService.vagaroServiceId || undefined}
                    employeeId={
                      selectedProviders.size === 1
                        ? providers.find(p => p.id === Array.from(selectedProviders)[0])?.vagaroEmployeeId || undefined
                        : undefined
                    }
                    className="min-h-[600px]"
                  />
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-4">
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
        </AnimatePresence>
      </PanelWrapper>
    </div>
  );
}
