'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, User, Check } from 'lucide-react';
import Image from 'next/image';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { getAssetsByServiceSlug, type AssetWithTags } from '@/actions/dam';
import type { Panel, ServiceDetailPanelData } from '@/types/panel-stack';

interface ServiceDetailPanelProps {
  panel: Panel;
}

// Mock providers - will be replaced with real data
const MOCK_PROVIDERS = [
  { id: '1', name: 'Sarah', imageUrl: '/placeholder-team.jpg', role: 'Lead Lash Artist' },
  { id: '2', name: 'Maya', imageUrl: '/placeholder-team.jpg', role: 'Lash Specialist' },
  { id: '3', name: 'Jamie', imageUrl: '/placeholder-team.jpg', role: 'Lash Artist' },
  { id: '4', name: 'Taylor', imageUrl: '/placeholder-team.jpg', role: 'Senior Artist' },
];

export function ServiceDetailPanel({ panel }: ServiceDetailPanelProps) {
  const { actions } = usePanelStack();
  const data = panel.data as ServiceDetailPanelData;
  const service = data.service;

  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(
    data.preselectedProvider ? new Set([data.preselectedProvider]) : new Set()
  );
  const [gallery, setGallery] = useState<AssetWithTags[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Fetch service gallery from DAM
  useEffect(() => {
    async function fetchGallery() {
      setIsLoadingGallery(true);
      try {
        const assets = await getAssetsByServiceSlug(service.slug);
        setGallery(assets);
      } catch (error) {
        console.error('Failed to fetch service gallery:', error);
      } finally {
        setIsLoadingGallery(false);
      }
    }

    fetchGallery();
  }, [service.slug]);

  // Update panel summary
  useEffect(() => {
    const providerNames = Array.from(selectedProviders)
      .map(id => MOCK_PROVIDERS.find(p => p.id === id)?.name)
      .filter(Boolean);

    const summary = providerNames.length > 0
      ? `$${(service.priceStarting / 100).toFixed(0)}+ · ${providerNames.join(', ')}`
      : `$${(service.priceStarting / 100).toFixed(0)}+`;

    actions.updatePanelSummary(panel.id, summary);
  }, [selectedProviders, service.priceStarting, panel.id, actions]);

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

  const handleBookService = () => {
    actions.openPanel(
      'schedule',
      {
        service,
        providerIds: Array.from(selectedProviders),
      },
      { parentId: panel.id }
    );
  };

  const priceDisplay = `$${(service.priceStarting / 100).toFixed(0)}+`;
  const visiblePhotos = showAllPhotos ? gallery : gallery.slice(0, 8);

  return (
    <PanelWrapper
      panel={panel}
      title={service.name}
      subtitle={service.subtitle || `${service.categoryName} · ${service.subcategoryName}`}
    >
      <div className="space-y-4 md:space-y-6">
        {/* Quick Stats */}
        <div className="flex items-center gap-4 md:gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-sage" />
            <span className="text-xs md:text-sm text-dune">{service.durationMinutes} min</span>
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
            {service.description}
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

        {/* Book Button */}
        <div className="pt-3 md:pt-4 border-t border-sage/10">
          <motion.button
            whileHover={{ scale: selectedProviders.size > 0 ? 1.02 : 1 }}
            whileTap={{ scale: selectedProviders.size > 0 ? 0.98 : 1 }}
            onClick={handleBookService}
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
              ? 'View Availability'
              : `View ${selectedProviders.size} Artists' Availability`}
          </motion.button>
        </div>
      </div>
    </PanelWrapper>
  );
}
