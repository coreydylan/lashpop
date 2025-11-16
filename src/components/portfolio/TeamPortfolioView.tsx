'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Instagram, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useBookingOrchestrator } from '@/contexts/BookingOrchestratorContext';
import type { Provider } from '@/types/orchestrator';

interface TeamPortfolioViewProps {
  // Portfolio will get provider data from orchestrator state
}

interface PortfolioPhoto {
  id: string;
  url: string;
  cropData?: {
    x: number;
    y: number;
    scale: number;
  };
  caption?: string;
}

export function TeamPortfolioView({}: TeamPortfolioViewProps) {
  const { state, actions, eventBus } = useBookingOrchestrator();
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const { portfolio, viewport, selectedProviders } = state;
  const { providerId, state: portfolioState, withBookingPanel } = portfolio;

  // Get the selected provider from orchestrator state (real data!)
  const provider: Provider | null = selectedProviders.length > 0
    ? selectedProviders[selectedProviders.length - 1] // Get the most recently selected
    : null;

  // Calculate available height based on portfolio state
  const getHeight = useCallback(() => {
    if (portfolioState === 'compressed') {
      return '40vh';
    }
    return `${viewport.availableHeight}px`;
  }, [portfolioState, viewport.availableHeight]);

  // Handle image load for blur-in effect
  const handleImageLoad = useCallback((photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId));
  }, []);

  // Fetch photos from DAM when provider changes
  useEffect(() => {
    if (providerId) {
      setIsLoading(true);
      // TODO: Replace with actual DAM API call
      // const fetchPhotos = async () => {
      //   const response = await fetch(`/api/dam/team/${providerId}/photos`);
      //   const data = await response.json();
      //   setPhotos(data);
      //   setIsLoading(false);
      // };
      // fetchPhotos();

      // Mock photos for now
      setTimeout(() => {
        setPhotos([
          {
            id: '1',
            url: '/placeholder-team.jpg',
            cropData: { x: 50, y: 50, scale: 1 },
            caption: 'Volume lash set - Natural glam',
          },
          {
            id: '2',
            url: '/placeholder-team.jpg',
            cropData: { x: 50, y: 50, scale: 1 },
            caption: 'Classic lash extension',
          },
        ]);
        setIsLoading(false);
      }, 500);
    }
  }, [providerId]);

  // Listen for viewport changes
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('VIEWPORT_RESIZED', () => {
      // Portfolio will automatically resize via getHeight()
    });
    return unsubscribe;
  }, [eventBus]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (portfolio.state === 'closed') return;

      if (e.key === 'Escape') {
        actions.closePortfolio();
      } else if (e.key === 'ArrowLeft') {
        setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [portfolio.state, photos.length, actions]);

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleBookWithProvider = () => {
    if (provider) {
      // Compress portfolio and open booking panel
      actions.compressPortfolio();
      actions.selectProvider(provider, { openBookingPanel: true });
    }
  };

  const handleClose = () => {
    actions.closePortfolio();
  };

  if (!provider || portfolio.state === 'closed') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          height: getHeight(),
        }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          opacity: { duration: 0.3 },
        }}
        className="fixed left-0 right-0 glass-soft shadow-2xl overflow-hidden"
        style={{
          zIndex: 30, // Between page (0) and drawers (40)
          bottom: 0,
          top: portfolioState === 'compressed' ? 'auto' : `${viewport.topOffset}px`,
        }}
      >
        {/* Header Bar - Sticky */}
        <div className="sticky top-0 z-10 glass backdrop-blur-xl border-b border-sage/10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-dusty-rose/30">
                <Image
                  src={provider.imageUrl}
                  alt={provider.name}
                  fill
                  className={`object-cover transition-all duration-500 ${
                    loadedImages.has(`provider-${provider.id}`)
                      ? 'opacity-100 blur-0'
                      : 'opacity-0 blur-sm'
                  }`}
                  onLoad={() => handleImageLoad(`provider-${provider.id}`)}
                />
              </div>
              <div>
                <h3 className="font-serif text-xl text-dune">{provider.name}</h3>
                <p className="text-sm text-sage">{provider.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {portfolioState === 'compressed' && (
                <button
                  onClick={() => actions.expandPortfolio()}
                  className="px-4 py-2 rounded-full hover:bg-sage/10 transition-colors text-sm font-medium text-sage"
                >
                  Expand
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-sage/10 transition-colors"
                aria-label="Close portfolio"
              >
                <X className="w-5 h-5 text-sage" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto h-full">
          <div className="px-6 py-8">
            {photos.length > 0 ? (
              // With Photos Layout
              <div className="grid lg:grid-cols-[30%_45%_25%] gap-6">
                {/* Left Panel - Provider Info */}
                <div className="space-y-6">
                  {/* Bio */}
                  {provider.bio && (
                    <div>
                      <h4 className="font-medium text-dune mb-3">About</h4>
                      <p className="text-sage leading-relaxed">{provider.bio}</p>
                    </div>
                  )}

                  {/* Quote */}
                  {provider.quote && (
                    <blockquote className="pl-4 border-l-2 border-dusty-rose italic text-sage">
                      &ldquo;{provider.quote}&rdquo;
                    </blockquote>
                  )}

                  {/* Specialties */}
                  <div>
                    <h4 className="font-medium text-dune mb-3">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {provider.specialties.map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-sage/10 text-sage rounded-full text-sm"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Fun Facts */}
                  {provider.funFacts && provider.funFacts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-dune mb-3">Fun Facts</h4>
                      <ul className="space-y-2">
                        {provider.funFacts.map((fact, idx) => (
                          <li key={idx} className="text-sm text-sage flex items-start gap-2">
                            <span className="text-dusty-rose mt-1">•</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button - Sticky at bottom of panel */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBookWithProvider}
                    className="w-full px-6 py-4 bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Book with {provider.name.split(' ')[0]}
                  </motion.button>
                </div>

                {/* Center Panel - Photo Hero */}
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-warm-sand/20">
                    {isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-dusty-rose border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        <Image
                          src={photos[currentPhotoIndex].url}
                          alt={photos[currentPhotoIndex].caption || 'Portfolio photo'}
                          fill
                          className={`object-cover transition-all duration-500 ${
                            loadedImages.has(photos[currentPhotoIndex].id)
                              ? 'opacity-100 blur-0'
                              : 'opacity-0 blur-sm'
                          }`}
                          style={{
                            objectPosition: photos[currentPhotoIndex].cropData
                              ? `${photos[currentPhotoIndex].cropData!.x}% ${photos[currentPhotoIndex].cropData!.y}%`
                              : 'center',
                          }}
                          onLoad={() => handleImageLoad(photos[currentPhotoIndex].id)}
                        />

                        {/* Navigation Arrows */}
                        {photos.length > 1 && (
                          <>
                            <button
                              onClick={handlePrevPhoto}
                              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-white/40 transition-all"
                              aria-label="Previous photo"
                            >
                              <ChevronLeft className="w-6 h-6 text-white" />
                            </button>
                            <button
                              onClick={handleNextPhoto}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-white/40 transition-all"
                              aria-label="Next photo"
                            >
                              <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                          </>
                        )}

                        {/* Photo Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 glass rounded-full text-white text-sm font-medium">
                          {currentPhotoIndex + 1} / {photos.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Caption */}
                  {photos[currentPhotoIndex]?.caption && (
                    <p className="text-center text-sage text-sm">{photos[currentPhotoIndex].caption}</p>
                  )}
                </div>

                {/* Right Panel - Thumbnail Gallery */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {photos.map((photo, idx) => (
                    <motion.button
                      key={photo.id}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`relative aspect-square w-full rounded-xl overflow-hidden ${
                        idx === currentPhotoIndex
                          ? 'ring-2 ring-dusty-rose shadow-lg'
                          : 'opacity-60 hover:opacity-100'
                      } transition-all`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.caption || `Photo ${idx + 1}`}
                        fill
                        className={`object-cover transition-all duration-500 ${
                          loadedImages.has(photo.id) ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
                        }`}
                        onLoad={() => handleImageLoad(photo.id)}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              // Empty State - No Photos
              <div className="flex flex-col items-center justify-center py-12 text-center max-w-xl mx-auto">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-warm-sand/30 to-dusty-rose/20 flex items-center justify-center mb-6">
                  <div className="text-4xl">✨</div>
                </div>
                <h3 className="font-serif text-2xl text-dune mb-4">Meet {provider.name}</h3>
                {provider.bio && <p className="text-sage leading-relaxed mb-6">{provider.bio}</p>}
                {provider.quote && (
                  <blockquote className="text-lg italic text-sage mb-6">&ldquo;{provider.quote}&rdquo;</blockquote>
                )}

                {/* Specialties */}
                {provider.specialties.length > 0 && (
                  <div className="mb-8 w-full">
                    <h4 className="font-medium text-dune mb-4">Specialties</h4>
                    <div className="flex flex-wrap justify-center gap-3">
                      {provider.specialties.map((specialty, idx) => (
                        <span key={idx} className="px-4 py-2 bg-sage/10 text-sage rounded-full">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBookWithProvider}
                  className="px-8 py-4 bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Book with {provider.name.split(' ')[0]}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
