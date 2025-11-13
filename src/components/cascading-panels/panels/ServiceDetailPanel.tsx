'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, User, Check } from 'lucide-react';
import Image from 'next/image';
import { PanelWrapper } from '../PanelWrapper';
import { useCascadingPanels } from '@/contexts/CascadingPanelContext';
import { getAssetsByServiceSlug, type AssetWithTags } from '@/actions/dam';
import type { PanelStackItem, ServiceDetailPanelData } from '@/types/cascading-panels';

interface ServiceDetailPanelProps {
  panel: PanelStackItem;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  description: string;
  durationMinutes: number;
  priceStarting: number;
  imageUrl: string | null;
  color: string | null;
  categoryName: string | null;
  subcategoryName: string | null;
}

interface Provider {
  id: string;
  name: string;
  imageUrl: string;
  role: string;
}

// Mock providers - will be replaced with real data fetching
const MOCK_PROVIDERS: Provider[] = [
  { id: '1', name: 'Sarah', imageUrl: '/placeholder-team.jpg', role: 'Lead Lash Artist' },
  { id: '2', name: 'Maya', imageUrl: '/placeholder-team.jpg', role: 'Lash Specialist' },
  { id: '3', name: 'Jamie', imageUrl: '/placeholder-team.jpg', role: 'Lash Artist' },
  { id: '4', name: 'Taylor', imageUrl: '/placeholder-team.jpg', role: 'Senior Artist' },
];

export function ServiceDetailPanel({ panel }: ServiceDetailPanelProps) {
  const { state, actions } = useCascadingPanels();
  const data = panel.data as ServiceDetailPanelData;
  const service: Service = data.service;

  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
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
    // Emit event for booking orchestrator
    actions.selectService(service.id);

    // Open schedule panel (to be built)
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
      showCollapseToggle
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sage" />
            <span className="text-sm text-dune">{service.durationMinutes} min</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-terracotta" />
            <span className="text-sm text-dune">Starting at {priceDisplay}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-ocean-mist" />
            <span className="text-sm text-dune">{MOCK_PROVIDERS.length} artists available</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-dune/80 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Photo Gallery */}
        {gallery.length > 0 && (
          <div>
            <h4 className="font-medium text-dune mb-3">Our Work</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                    transition={{ delay: i * 0.05 }}
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
                className="mt-3 text-sm text-dusty-rose hover:text-terracotta transition-colors"
              >
                {showAllPhotos ? 'Show Less' : `View All ${gallery.length} Photos`}
              </button>
            )}
          </div>
        )}

        {/* Provider Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-dune">Choose Your Artist</h4>
            <button
              onClick={handleSelectAllProviders}
              className="text-sm text-sage hover:text-dusty-rose transition-colors"
            >
              {selectedProviders.size === MOCK_PROVIDERS.length ? 'Deselect All' : 'See All Availability'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MOCK_PROVIDERS.map((provider) => {
              const isSelected = selectedProviders.has(provider.id);

              return (
                <motion.button
                  key={provider.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleProviderToggle(provider.id)}
                  className={`relative p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-dusty-rose/30 to-warm-sand/30 ring-2 ring-dusty-rose shadow-md'
                      : 'bg-sage/5 hover:bg-sage/10'
                  }`}
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

                  <div className="aspect-square bg-warm-sand/20 rounded-lg mb-2" />
                  <p className="text-sm font-medium text-dune text-center">{provider.name}</p>
                  <p className="text-xs text-sage text-center mt-0.5">{provider.role}</p>
                </motion.button>
              );
            })}
          </div>

          {selectedProviders.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-sage/10 border border-sage/20"
            >
              <p className="text-sm text-sage">
                <strong>{selectedProviders.size}</strong> {selectedProviders.size === 1 ? 'artist' : 'artists'} selected
              </p>
            </motion.div>
          )}
        </div>

        {/* Book Button */}
        <div className="pt-4 border-t border-sage/10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBookService}
            disabled={selectedProviders.size === 0}
            className={`w-full px-6 py-4 rounded-full font-medium transition-all ${
              selectedProviders.size > 0
                ? 'bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white shadow-lg hover:shadow-xl'
                : 'bg-sage/20 text-sage/50 cursor-not-allowed'
            }`}
          >
            {selectedProviders.size === 0
              ? 'Select an artist to continue'
              : selectedProviders.size === 1
              ? 'View Availability'
              : `View ${selectedProviders.size} Artists&apos; Availability`}
          </motion.button>
        </div>
      </div>
    </PanelWrapper>
  );
}
