'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Calendar, AlertCircle } from 'lucide-react';
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
  vagaroWidgetUrl?: string | null;
}

// =============================================================================
// DEMO: Hardcoded Vagaro Widget URLs for testing
// Remove this once URLs are populated in the database
// =============================================================================
const DEMO_WIDGET_URLS: Record<string, string> = {
  // Classic Full Set of Lash Extensions
  'classic-full-set': 'https://www.vagaro.com/Users/BusinessWidget.aspx?enc=MMLjhIwJMcwFQhXLL7ifVNktU+6gVG/xKebyJuJZAstemTnIIIKeu0QS8AhhSYXpPqb0D/obnhonLWVrRgENjVYs3JtTfqU8CaATRsRBExg82SjvbpaaJj/xgNGXz9tP05/mSHjXeIApPZOQ4417unuF/38gFm4LOsgznCtFcvfknouEkPRJzvFjgmuZxsCNNphibWlOXi33Q+uLIVjw6vX1VL6XX8djewz8V40GVgMfLfP7uXi/mcXkrtXYvUIp4qx4pm/R3xAWN1Z9ofHT3QCL3nrJ4nkPHE2HRtPKY0JjR4hn+ZSBmqPbWJ9nRi/SGr0fTbA5Zyv2g0HIy+Ht02Xc76Exb4O+SzfHKIrBxsJ5di+3pYTzSApYcOh7UtEydX4Rpd3IqiwPyLSYK71oTUNYnSXT7IDYG5oLvbk6/M9AvxL7hD6Xm3W05WQ6RyoYj3/cuTI2KVZ0U0XTx4FYFoIG59dLLFxlVG+xUM7zPCU=',
  'classic': 'https://www.vagaro.com/Users/BusinessWidget.aspx?enc=MMLjhIwJMcwFQhXLL7ifVNktU+6gVG/xKebyJuJZAstemTnIIIKeu0QS8AhhSYXpPqb0D/obnhonLWVrRgENjVYs3JtTfqU8CaATRsRBExg82SjvbpaaJj/xgNGXz9tP05/mSHjXeIApPZOQ4417unuF/38gFm4LOsgznCtFcvfknouEkPRJzvFjgmuZxsCNNphibWlOXi33Q+uLIVjw6vX1VL6XX8djewz8V40GVgMfLfP7uXi/mcXkrtXYvUIp4qx4pm/R3xAWN1Z9ofHT3QCL3nrJ4nkPHE2HRtPKY0JjR4hn+ZSBmqPbWJ9nRi/SGr0fTbA5Zyv2g0HIy+Ht02Xc76Exb4O+SzfHKIrBxsJ5di+3pYTzSApYcOh7UtEydX4Rpd3IqiwPyLSYK71oTUNYnSXT7IDYG5oLvbk6/M9AvxL7hD6Xm3W05WQ6RyoYj3/cuTI2KVZ0U0XTx4FYFoIG59dLLFxlVG+xUM7zPCU=',
  // Classic Lash Fill
  'classic-fill': 'https://www.vagaro.com/Users/BusinessWidget.aspx?enc=MMLjhIwJMcwFQhXLL7ifVNktU+6gVG/xKebyJuJZAstemTnIIIKeu0QS8AhhSYXpPqb0D/obnhonLWVrRgENjVYs3JtTfqU8CaATRsRBExg82SjvbpaaJj/xgNGXz9tP05/mSHjXeIApPZOQ4417unuF/38gFm4LOsgznCtFcvfknouEkPRJzvFjgmuZxsCNNphibWlOXi33Q+uLIVjw6vX1VL6XX8djewz8V40GVgMfLfP7uXi/mcXkrtXYvUIp4qx4pm/R3xAWN1Z9ofHT3QCL3nrJ4nkPHE2HRtPKY0JjR4hn+ZSBmqPbWJ9nRi/SGr0fTbA5Zyv2g0HIy+Ht02Xc76Exb4O+SzfHKIrBxsJ5di+3pYTzSApYcOh7UtEydX4Rpd3IqiwPyLSYK71oTbAck5HSW+Ao7Odz9R5M7bGRHUhRJwe7uVMDHIdKSgmtlSG3DXuK01koAsbdwJ7yMq9oay9oJbICDxp2CBbRwGQ=',
  'classic-lash-fill': 'https://www.vagaro.com/Users/BusinessWidget.aspx?enc=MMLjhIwJMcwFQhXLL7ifVNktU+6gVG/xKebyJuJZAstemTnIIIKeu0QS8AhhSYXpPqb0D/obnhonLWVrRgENjVYs3JtTfqU8CaATRsRBExg82SjvbpaaJj/xgNGXz9tP05/mSHjXeIApPZOQ4417unuF/38gFm4LOsgznCtFcvfknouEkPRJzvFjgmuZxsCNNphibWlOXi33Q+uLIVjw6vX1VL6XX8djewz8V40GVgMfLfP7uXi/mcXkrtXYvUIp4qx4pm/R3xAWN1Z9ofHT3QCL3nrJ4nkPHE2HRtPKY0JjR4hn+ZSBmqPbWJ9nRi/SGr0fTbA5Zyv2g0HIy+Ht02Xc76Exb4O+SzfHKIrBxsJ5di+3pYTzSApYcOh7UtEydX4Rpd3IqiwPyLSYK71oTbAck5HSW+Ao7Odz9R5M7bGRHUhRJwe7uVMDHIdKSgmtlSG3DXuK01koAsbdwJ7yMq9oay9oJbICDxp2CBbRwGQ=',
  // Classic Mini Fill
  'classic-mini': 'https://www.vagaro.com/Users/BusinessWidget.aspx?enc=MMLjhIwJMcwFQhXLL7ifVNktU+6gVG/xKebyJuJZAstemTnIIIKeu0QS8AhhSYXpPqb0D/obnhonLWVrRgENjVYs3JtTfqU8CaATRsRBExg82SjvbpaaJj/xgNGXz9tP05/mSHjXeIApPZOQ4417unuF/38gFm4LOsgznCtFcvfknouEkPRJzvFjgmuZxsCNNphibWlOXi33Q+uLIVjw6vX1VL6XX8djewz8V40GVgMfLfP7uXi/mcXkrtXYvUIp4qx4pm/R3xAWN1Z9ofHT3QCL3nrJ4nkPHE2HRtPKY0JjR4hn+ZSBmqPbWJ9nRi/SGr0fTbA5Zyv2g0HIy+Ht02Xc76Exb4O+SzfHKIrBxsJ5di+3pYTzSApYcOh7UtEydX4Rpd3IqiwPyLSYK71oTWRktKs8m6KIbEw/sH3LPHrlG+EUNWwZ+4eUIZSFWV5CIvuMDcC0qY4Fn+h2+fYFzkLP1YEABGY8VrHR3HTqi1Y=',
  'classic-mini-fill': 'https://www.vagaro.com/Users/BusinessWidget.aspx?enc=MMLjhIwJMcwFQhXLL7ifVNktU+6gVG/xKebyJuJZAstemTnIIIKeu0QS8AhhSYXpPqb0D/obnhonLWVrRgENjVYs3JtTfqU8CaATRsRBExg82SjvbpaaJj/xgNGXz9tP05/mSHjXeIApPZOQ4417unuF/38gFm4LOsgznCtFcvfknouEkPRJzvFjgmuZxsCNNphibWlOXi33Q+uLIVjw6vX1VL6XX8djewz8V40GVgMfLfP7uXi/mcXkrtXYvUIp4qx4pm/R3xAWN1Z9ofHT3QCL3nrJ4nkPHE2HRtPKY0JjR4hn+ZSBmqPbWJ9nRi/SGr0fTbA5Zyv2g0HIy+Ht02Xc76Exb4O+SzfHKIrBxsJ5di+3pYTzSApYcOh7UtEydX4Rpd3IqiwPyLSYK71oTWRktKs8m6KIbEw/sH3LPHrlG+EUNWwZ+4eUIZSFWV5CIvuMDcC0qY4Fn+h2+fYFzkLP1YEABGY8VrHR3HTqi1Y=',
};

// =============================================================================
// FUTURE: Provider Selection
// =============================================================================
// The following code is preserved for when we implement custom provider selection
// with Vagaro API integration for real-time availability.
//
// interface Provider {
//   id: string;
//   name: string;
//   imageUrl: string;
//   role: string;
//   vagaroEmployeeId?: string;
// }
//
// // Will be replaced with real data fetching from team_members table
// const MOCK_PROVIDERS: Provider[] = [
//   { id: '1', name: 'Sarah', imageUrl: '/placeholder-team.jpg', role: 'Lead Lash Artist' },
//   { id: '2', name: 'Maya', imageUrl: '/placeholder-team.jpg', role: 'Lash Specialist' },
//   { id: '3', name: 'Jamie', imageUrl: '/placeholder-team.jpg', role: 'Lash Artist' },
//   { id: '4', name: 'Taylor', imageUrl: '/placeholder-team.jpg', role: 'Senior Artist' },
// ];
//
// const handleProviderToggle = (providerId: string) => {
//   setSelectedProviders(prev => {
//     const newSet = new Set(prev);
//     if (newSet.has(providerId)) {
//       newSet.delete(providerId);
//     } else {
//       newSet.add(providerId);
//     }
//     return newSet;
//   });
// };
//
// const handleSelectAllProviders = () => {
//   if (selectedProviders.size === MOCK_PROVIDERS.length) {
//     setSelectedProviders(new Set());
//   } else {
//     setSelectedProviders(new Set(MOCK_PROVIDERS.map(p => p.id)));
//   }
// };
// =============================================================================

export function ServiceDetailPanel({ panel }: ServiceDetailPanelProps) {
  const { actions } = useCascadingPanels();
  const data = panel.data as ServiceDetailPanelData;
  const service: Service = data.service;

  const [gallery, setGallery] = useState<AssetWithTags[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // FUTURE: Provider selection state
  // const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());

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

  const handleBookService = () => {
    // Track service selection
    actions.selectService(service.id);

    // Check for widget URL: first from database, then from demo hardcoded URLs
    const widgetUrl = service.vagaroWidgetUrl || DEMO_WIDGET_URLS[service.slug];

    if (widgetUrl) {
      // Open the Vagaro widget panel
      actions.openPanel(
        'vagaro-widget',
        {
          widgetUrl,
          serviceName: service.name,
          servicePrice: service.priceStarting,
          serviceDuration: service.durationMinutes,
        },
        { parentId: panel.id }
      );
    } else {
      // Fallback: no URL configured
      console.warn(`No vagaroWidgetUrl configured for service: ${service.name} (slug: ${service.slug})`);
      alert('Booking is not yet configured for this service. Please contact us to book.');
    }
  };

  const priceDisplay = `$${(service.priceStarting / 100).toFixed(0)}+`;
  const visiblePhotos = showAllPhotos ? gallery : gallery.slice(0, 8);
  // Check for widget URL from database OR demo hardcoded URLs
  const hasWidgetUrl = !!(service.vagaroWidgetUrl || DEMO_WIDGET_URLS[service.slug]);

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

        {/* =================================================================== */}
        {/* FUTURE: Provider Selection UI                                       */}
        {/* =================================================================== */}
        {/* When we implement custom provider selection with Vagaro API:

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
        */}
        {/* =================================================================== */}

        {/* Book Button */}
        <div className="pt-4 border-t border-sage/10">
          {!hasWidgetUrl && (
            <div className="flex items-center gap-2 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Online booking coming soon for this service
              </p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBookService}
            disabled={!hasWidgetUrl}
            className={`w-full px-6 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-2 ${
              hasWidgetUrl
                ? 'bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white shadow-lg hover:shadow-xl'
                : 'bg-sage/20 text-sage/50 cursor-not-allowed'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Book This Service
          </motion.button>
        </div>
      </div>
    </PanelWrapper>
  );
}
