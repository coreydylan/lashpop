"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Clock, DollarSign, Sparkles, User, Calendar } from 'lucide-react';
import Image from 'next/image';
import { usePanelManager } from './PanelContext';
import { getAssetsByServiceSlug, type AssetWithTags } from '@/actions/dam';
import { getTeamMembersByServiceId } from '@/actions/team';
import type { SelectTeamMember } from '@/db/schema/team_members';

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

interface ServiceDetailPanelProps {
  service: Service;
  onClose: () => void;
}

export default function ServiceDetailPanel({ service, onClose }: ServiceDetailPanelProps) {
  const { context, toggleProvider, selectAllProviders, pushPanel } = usePanelManager();
  const [showSchedule, setShowSchedule] = useState(false);
  const [gallery, setGallery] = useState<AssetWithTags[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [providers, setProviders] = useState<SelectTeamMember[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);

  const selectedProviders = context.selectedProviders;
  const selectedProviderObjects = providers.filter(p => selectedProviders.includes(p.id));

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

  // Fetch team members who can perform this service
  useEffect(() => {
    async function fetchProviders() {
      setIsLoadingProviders(true);
      try {
        const members = await getTeamMembersByServiceId(service.id);
        setProviders(members);
      } catch (error) {
        console.error('Failed to fetch team members:', error);
      } finally {
        setIsLoadingProviders(false);
      }
    }

    fetchProviders();
  }, [service.id]);

  const handleProviderSelect = (providerId: string) => {
    toggleProvider(providerId);
  };

  const handleShowAllSchedules = () => {
    selectAllProviders(providers.map(p => p.id));
    setShowSchedule(true);
  };

  const handleContinueToScheduling = () => {
    // Open the scheduling panel with selected service and providers
    pushPanel({
      id: `scheduling-${service.id}`,
      type: 'scheduling',
      data: {
        service,
        selectedProviders: selectedProviderObjects,
      },
      entryPoint: 'service-card',
    });
  };

  const priceDisplay = `$${(service.priceStarting / 100).toFixed(0)}+`;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[100] bg-cream overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-md border-b border-sage/10">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-dune hover:text-sage transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Services</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-sage/10 transition-colors"
            >
              <X className="w-5 h-5 text-dune" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="px-6 py-8">
          <div className="flex items-start gap-6">
            {/* Service Info */}
            <div className="flex-1">
              <div className="inline-block px-3 py-1 rounded-full bg-sage/10 text-sage text-xs font-medium mb-3">
                {service.categoryName} · {service.subcategoryName}
              </div>
              <h1 className="text-4xl font-light text-dune mb-2">{service.name}</h1>
              {service.subtitle && (
                <p className="text-lg text-terracotta italic mb-4">{service.subtitle}</p>
              )}
              <p className="text-dune/70 leading-relaxed max-w-2xl">
                {service.description}
              </p>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sage" />
                  <span className="text-sm text-dune">{service.durationMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-terracotta" />
                  <span className="text-sm text-dune">Starting at {priceDisplay}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-ocean-mist" />
                  <span className="text-sm text-dune">
                    {isLoadingProviders ? 'Loading...' : `${providers.length} artist${providers.length !== 1 ? 's' : ''} available`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        {gallery.length > 0 && (
          <div className="px-6 py-6 border-t border-sage/10">
            <h2 className="text-2xl font-light text-dune mb-4">Our Work</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((asset, i) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="relative aspect-square rounded-xl overflow-hidden glass cursor-pointer hover:scale-105 transition-transform"
                >
                  <Image
                    src={asset.filePath}
                    alt={asset.fileName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Loading State */}
        {isLoadingGallery && (
          <div className="px-6 py-6 border-t border-sage/10">
            <h2 className="text-2xl font-light text-dune mb-4">Our Work</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden glass animate-pulse"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-sage/20 to-terracotta/20" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provider Selection */}
        <div className="px-6 py-6 border-t border-sage/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-light text-dune">Choose Your Artist</h2>
            {providers.length > 0 && (
              <button
                onClick={handleShowAllSchedules}
                className="text-sm text-sage hover:text-ocean-mist transition-colors font-medium"
              >
                Show All Schedules
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoadingProviders && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="relative p-4 rounded-2xl bg-cream/50 animate-pulse"
                >
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-sage/20 to-terracotta/20" />
                  <div className="h-4 bg-sage/10 rounded mx-auto w-3/4 mb-2" />
                  <div className="h-3 bg-sage/10 rounded mx-auto w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Providers Grid */}
          {!isLoadingProviders && providers.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {providers.map((provider) => {
              const isSelected = selectedProviders.includes(provider.id);

                return (
                  <motion.button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-4 rounded-2xl transition-all ${
                      isSelected
                        ? 'glass shadow-lg ring-2 ring-sage'
                        : 'bg-cream/50 hover:bg-cream'
                    }`}
                  >
                    {/* Selection Indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sage flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Provider Photo */}
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden">
                      {provider.imageUrl ? (
                        <Image
                          src={provider.imageUrl}
                          alt={provider.name}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-sage/20 to-terracotta/20 flex items-center justify-center">
                          <User className="w-10 h-10 text-sage/50" />
                        </div>
                      )}
                    </div>

                    {/* Provider Info */}
                    <div className="text-center">
                      <p className="font-medium text-dune">{provider.name}</p>
                      <p className="text-xs text-dune/60 mt-1">{provider.role}</p>
                    </div>

                    {/* Hover State */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-sage/5 rounded-2xl flex items-center justify-center pointer-events-none"
                    >
                      <span className="text-sm font-medium text-sage">
                        {isSelected ? 'Selected' : `Book with ${provider.name.split(' ')[0]}`}
                      </span>
                    </motion.div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* No Providers State */}
          {!isLoadingProviders && providers.length === 0 && (
            <div className="glass rounded-2xl p-8 text-center">
              <User className="w-12 h-12 text-sage/30 mx-auto mb-3" />
              <p className="text-dune/60 mb-2">No artists available for this service</p>
              <p className="text-sm text-dune/40">
                Please check back later or contact us for assistance
              </p>
            </div>
          )}
        </div>

        {/* Schedule Comparison Section */}
        <AnimatePresence>
          {showSchedule && selectedProviders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-6 border-t border-sage/10"
            >
              <h2 className="text-2xl font-light text-dune mb-4">
                Compare Availability ({selectedProviders.length} artist{selectedProviders.length > 1 ? 's' : ''})
              </h2>

              <div className="glass rounded-2xl p-6">
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-sage/30 mx-auto mb-4" />
                  <p className="text-dune/60 mb-4">Schedule comparison coming soon</p>
                  <p className="text-sm text-dune/40">
                    This will show side-by-side calendars with availability from Vagaro
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Book Button */}
        <div className="sticky bottom-0 px-6 py-4 bg-cream/95 backdrop-blur-md border-t border-sage/10">
          <motion.button
            onClick={handleContinueToScheduling}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={selectedProviders.length === 0}
            className={`w-full py-4 rounded-full font-medium text-lg transition-all ${
              selectedProviders.length > 0
                ? 'bg-gradient-to-r from-sage to-ocean-mist text-cream shadow-lg hover:shadow-xl'
                : 'bg-sage/20 text-sage/50 cursor-not-allowed'
            }`}
          >
            {selectedProviders.length === 0
              ? 'Select an artist to continue'
              : `Continue with ${selectedProviders.length} artist${selectedProviders.length > 1 ? 's' : ''}`}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
