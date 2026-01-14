'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Calendar, Instagram, Phone, ChevronLeft, ChevronRight, MapPin, Star, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useSwipeable } from 'react-swipeable';
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
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { portfolio, viewport, selectedProviders } = state;
  const { providerId, state: portfolioState, withBookingPanel } = portfolio;

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Swipe handlers for mobile photo gallery
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (photos.length > 1) {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
      }
    },
    onSwipedRight: () => {
      if (photos.length > 1) {
        setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  if (!provider || portfolio.state === 'closed') {
    return null;
  }

  // ============================================
  // MOBILE FULL-SCREEN LAYOUT
  // ============================================
  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            opacity: { duration: 0.3 },
          }}
          className="fixed inset-0 bg-cream z-50 overflow-hidden flex flex-col"
          style={{ height: '100dvh' }}
        >
          {/* Mobile Header - Floating glass header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-0 left-0 right-0 z-20 safe-area-top"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-cream/80 backdrop-blur-xl">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 shadow-sm"
                aria-label="Close"
              >
                <ChevronLeft className="w-6 h-6 text-dune" />
              </motion.button>

              <div className="flex items-center gap-2">
                {provider.instagram && (
                  <motion.a
                    whileTap={{ scale: 0.9 }}
                    href={`https://instagram.com/${provider.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 shadow-sm"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5 text-dune" />
                  </motion.a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Scrollable Content */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Hero Photo Section with Provider Overlay */}
            <div className="relative">
              {/* Photo Carousel */}
              <div {...swipeHandlers} className="relative aspect-[3/4] bg-warm-sand/20 overflow-hidden">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-warm-sand/10">
                    <div className="w-10 h-10 border-4 border-dusty-rose border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : photos.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentPhotoIndex}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={photos[currentPhotoIndex].url}
                          alt={photos[currentPhotoIndex].caption || 'Portfolio photo'}
                          fill
                          className="object-cover"
                          style={{
                            objectPosition: photos[currentPhotoIndex].cropData
                              ? `${photos[currentPhotoIndex].cropData!.x}% ${photos[currentPhotoIndex].cropData!.y}%`
                              : 'center',
                          }}
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Photo Dots Indicator */}
                    {photos.length > 1 && (
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        {photos.map((_, idx) => (
                          <motion.button
                            key={idx}
                            onClick={() => setCurrentPhotoIndex(idx)}
                            className={`rounded-full transition-all ${
                              idx === currentPhotoIndex
                                ? 'w-6 h-2 bg-white'
                                : 'w-2 h-2 bg-white/50'
                            }`}
                            whileTap={{ scale: 0.8 }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Swipe hint on first photo */}
                    {photos.length > 1 && currentPhotoIndex === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1 }}
                        className="absolute bottom-28 left-1/2 -translate-x-1/2 text-white/70 text-xs flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Swipe for more</span>
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    )}
                  </>
                ) : (
                  // No photos - Show provider image as hero
                  <Image
                    src={provider.imageUrl}
                    alt={provider.name}
                    fill
                    className="object-cover"
                    priority
                  />
                )}

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream via-cream/80 to-transparent" />
              </div>

              {/* Provider Info Card - Overlapping the photo */}
              <div className="relative -mt-16 px-5">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-3xl shadow-xl p-5 border border-sage/5"
                >
                  {/* Avatar + Name row */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-dusty-rose/20 flex-shrink-0 shadow-lg">
                      <Image
                        src={provider.imageUrl}
                        alt={provider.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="font-serif text-2xl text-dune leading-tight">
                        {provider.name}
                      </h1>
                      <p className="text-dusty-rose font-medium text-sm mt-0.5">
                        {provider.role}
                      </p>
                      {/* Quick stats */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-sage text-xs">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>5.0</span>
                        </div>
                        <div className="flex items-center gap-1 text-sage text-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{provider.specialties.length} specialties</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quote (if available) */}
                  {provider.quote && (
                    <blockquote className="text-sage/80 text-sm italic leading-relaxed border-l-2 border-dusty-rose/30 pl-3 mb-4">
                      &ldquo;{provider.quote}&rdquo;
                    </blockquote>
                  )}

                  {/* Book Button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBookWithProvider}
                    className="w-full py-4 bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white rounded-2xl font-semibold shadow-lg shadow-dusty-rose/25 flex items-center justify-center gap-2 text-base"
                  >
                    <Calendar className="w-5 h-5" />
                    Book with {provider.name.split(' ')[0]}
                  </motion.button>
                </motion.div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="px-5 py-6 space-y-6">
              {/* Bio Section */}
              {provider.bio && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-serif text-lg text-dune mb-3">About</h3>
                  <p className="text-sage leading-relaxed text-sm">{provider.bio}</p>
                </motion.div>
              )}

              {/* Specialties Section */}
              {provider.specialties.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <h3 className="font-serif text-lg text-dune mb-3">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-sage/8 text-sage rounded-full text-sm font-medium border border-sage/10"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Fun Facts Section */}
              {provider.funFacts && provider.funFacts.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-warm-sand/30 to-dusty-rose/10 rounded-2xl p-5"
                >
                  <h3 className="font-serif text-lg text-dune mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-dusty-rose" />
                    Fun Facts
                  </h3>
                  <ul className="space-y-3">
                    {provider.funFacts.map((fact, idx) => (
                      <li key={idx} className="text-sm text-dune/80 flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-dusty-rose/20 flex items-center justify-center flex-shrink-0 text-dusty-rose text-xs font-semibold">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Photo Thumbnails (if multiple photos) */}
              {photos.length > 1 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <h3 className="font-serif text-lg text-dune mb-3">Portfolio</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, idx) => (
                      <motion.button
                        key={photo.id || `mobile-photo-${idx}`}
                        onClick={() => setCurrentPhotoIndex(idx)}
                        className={`relative aspect-square rounded-xl overflow-hidden ${
                          idx === currentPhotoIndex
                            ? 'ring-2 ring-dusty-rose shadow-lg'
                            : 'opacity-70'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Image
                          src={photo.url}
                          alt={photo.caption || `Photo ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Bottom spacer for safe area */}
              <div className="h-24" />
            </div>
          </div>

          {/* Fixed Bottom CTA (always visible) */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 safe-area-bottom bg-white/90 backdrop-blur-xl border-t border-sage/10"
          >
            <div className="px-5 py-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleBookWithProvider}
                className="w-full py-4 bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white rounded-2xl font-semibold shadow-xl shadow-dusty-rose/30 flex items-center justify-center gap-2 text-base"
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ============================================
  // DESKTOP LAYOUT (Original)
  // ============================================
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
                      key={photo.id || `desktop-photo-${idx}`}
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
