"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { BookingOrchestratorProvider } from '@/contexts/BookingOrchestratorContext';
import { VagaroWidgetProvider } from '@/contexts/VagaroWidgetContext';
import { DevModeProvider } from '@/contexts/DevModeContext';
import { DevModeOverlay } from '@/components/dev-mode';
import { DrawerProvider } from '@/components/drawers/DrawerContext';
import { PanelManagerProvider } from '@/components/panels/PanelContext';
import DrawerSystem from '@/components/drawers/DrawerSystem';
import { Navigation } from '@/components/sections/Navigation';
import { MobileHeader } from '@/components/landing-v2/MobileHeader';
import { MobileHeroBackground } from '@/components/landing-v2/MobileHeroBackground';
import HeroSection from '@/components/landing-v2/HeroSection';
import { ServicesSection } from '@/components/landing-v2/sections/ServicesSection';
import { FounderLetterSection } from '@/components/landing-v2/sections/FounderLetterSection';
import { EnhancedTeamSectionClient } from '@/components/sections/EnhancedTeamSectionClient';
import dynamic from 'next/dynamic';

// Lazy-load below-fold sections to reduce initial JS bundle
const InstagramCarousel = dynamic(() => import('@/components/landing-v2/sections/InstagramCarousel').then(m => ({ default: m.InstagramCarousel })), { ssr: false });
const ReviewsSection = dynamic(() => import('@/components/landing-v2/sections/ReviewsSection').then(m => ({ default: m.ReviewsSection })), { ssr: false });
const FAQSection = dynamic(() => import('@/components/landing-v2/sections/FAQSection').then(m => ({ default: m.FAQSection })), { ssr: false });
const MapSection = dynamic(() => import('@/components/landing-v2/sections/MapSection').then(m => ({ default: m.MapSection })), { ssr: false });
import { FooterV2 } from '@/components/landing-v2/sections/FooterV2';
import { TeamPortfolioView } from '@/components/portfolio/TeamPortfolioView';
import { PanelRenderer } from '@/components/panels/PanelRenderer';
import { ServiceBrowserProvider, ServiceBrowserModal, useServiceBrowser } from '@/components/service-browser';

// Import global styles to ensure all the beautiful v1 styles are available
import '@/app/globals.css';

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
  displayOrder: number;
  categoryName: string | null;
  categorySlug: string | null;
  subcategoryName: string | null;
  subcategorySlug: string | null;
  // New fields for key image and demo mode
  keyImageAssetId?: string | null;
  useDemoPhotos?: boolean;
  vagaroServiceCode?: string | null;
}

interface QuickFact {
  id: string;
  factType: string;
  customLabel?: string | null;
  value: string;
  customIcon?: string | null;
  displayOrder: number;
}

interface TeamMember {
  id: number;
  uuid?: string;
  name: string;
  role: string;
  type: 'employee' | 'independent';
  businessName?: string;
  image: string;
  phone: string;
  specialties: string[];
  serviceCategories?: string[];
  bio?: string;
  quote?: string;
  availability?: string;
  instagram?: string;
  bookingUrl: string;
  favoriteServices?: string[];
  funFact?: string;
  quickFacts?: QuickFact[];
  cropSquareUrl?: string;
  cropCloseUpCircleUrl?: string;
  cropMediumCircleUrl?: string;
  cropFullVerticalUrl?: string;
}

interface Review {
  id: string;
  reviewerName: string;
  subject: string | null;
  reviewText: string;
  rating: number;
  reviewDate: Date | null;
  source: string;
}

interface ReviewStat {
  id: string;
  source: string;
  rating: string;
  reviewCount: number;
  updatedAt: Date;
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline?: string | null;
  icon: string | null;
  displayOrder: number;
}

interface FAQCategory {
  id: string;
  name: string;
  displayName: string;
  displayOrder: number;
}

interface FAQItem {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  displayOrder: number;
  isFeatured: boolean;
}

interface FAQWithCategory extends FAQItem {
  categoryDisplayName: string;
}

interface FAQData {
  categories: FAQCategory[];
  itemsByCategory: Record<string, FAQItem[]>;
  featuredItems: FAQWithCategory[];
}

// Hero slideshow/image config types
import type { SlideshowPreset, SlideshowImage } from '@/types/hero-slideshow';
import type { StudioSettings } from '@/types/studio';
import type { FounderLetterContent } from '@/types/founder-letter';

interface HeroSlideshowConfig {
  preset: SlideshowPreset | null;
  fallbackImage: {
    url: string;
    position: { x: number; y: number };
    objectFit: 'cover' | 'contain';
  } | null;
}

interface HeroConfig {
  desktop: HeroSlideshowConfig;
  mobile: HeroSlideshowConfig;
}

interface LandingPageV2ClientProps {
  services: Service[];
  teamMembers: TeamMember[];
  reviews: Review[];
  reviewStats?: ReviewStat[];
  instagramPosts?: any[]; // Using any[] for now to avoid circular type dependency, or define strict type
  serviceCategories?: ServiceCategory[];
  faqData?: FAQData;
  founderLetterContent?: FounderLetterContent;
  heroConfig?: HeroConfig;
  studio: StudioSettings;
}

// Minimal mobile styles - GSAP handles the scroll behavior
// Note: html/body transparency is now in globals.css for reliability
const mobileScrollStyles = `
  @media (max-width: 767px) {
    /* Main scrollable container - native smooth scrolling */
    .mobile-scroll-container {
      overflow-y: auto;
      overflow-x: hidden;
      height: 100vh;
      height: 100dvh; /* Dynamic viewport height for mobile browsers */
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: auto;
      background: transparent !important;
    }

    /* Ensure the main page content wrapper is also transparent */
    .page-content {
      background: transparent !important;
    }

    /* Each section - flexible height based on content */
    .mobile-section {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Allow taller sections to expand naturally */
    .mobile-section[data-section-id="services"],
    .mobile-section[data-section-id="founder"],
    .mobile-section[data-section-id="team"],
    .mobile-section[data-section-id="instagram"],
    .mobile-section[data-section-id="reviews"],
    .mobile-section[data-section-id="faq"],
    .mobile-section[data-section-id="map"] {
      min-height: auto;
      padding-bottom: 0;
    }

    /* Add bottom padding to content sections */
    .mobile-section[data-section-id="services"],
    .mobile-section[data-section-id="instagram"],
    .mobile-section[data-section-id="reviews"],
    .mobile-section[data-section-id="faq"] {
      padding-bottom: 60px;
    }

    /* Hero section full height */
    .mobile-section[data-section-id="hero"] {
      min-height: 100vh;
      min-height: 100dvh;
    }

    /* Footer doesn't need min-height */
    .mobile-section[data-section-id="footer"] {
      min-height: auto;
    }
  }
`;

// Reads ?service=<slug>&subcategory=<slug> from the URL and opens the
// service browser modal. Lets the footer (and any other link) deep-link
// into the services menu from another page like /work-with-us.
function ServiceQueryDeepLink() {
  const { actions, categories } = useServiceBrowser();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('service');
    if (!slug) return;
    const subcategory = params.get('subcategory') ?? undefined;
    const category = categories.find(c => c.slug === slug);
    const categoryName = category?.name ?? slug;
    actions.openModal(slug, categoryName, subcategory);

    // Strip the query params so reloads/back nav don't re-open the modal.
    params.delete('service');
    params.delete('subcategory');
    const remaining = params.toString();
    const newUrl = `${window.location.pathname}${remaining ? `?${remaining}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }, [actions, categories]);
  return null;
}

export default function LandingPageV2Client({ services, teamMembers, reviews, reviewStats = [], instagramPosts = [], serviceCategories = [], faqData, founderLetterContent, heroConfig, studio }: LandingPageV2ClientProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('');

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle section change for header
  const handleSectionChange = useCallback((sectionId: string) => {
    setCurrentSection(sectionId);
  }, []);

  return (
    <DevModeProvider>
    <BookingOrchestratorProvider>
        <ServiceBrowserProvider services={services} categories={serviceCategories}>
        <VagaroWidgetProvider>
        <DrawerProvider>
          <PanelManagerProvider>
            <div className={`min-h-screen relative theme-v2 ${isMobile ? '' : 'bg-ivory'}`}>
              {/* Inject mobile scroll styles */}
              <style dangerouslySetInnerHTML={{ __html: mobileScrollStyles }} />

              {/*
                =====================================================
                MOBILE LAYER 0: Fixed Hero Background
                =====================================================
                Renders the arch image behind the hero section.
              */}
              {/* Always render so priority image gets SSR preloaded; component has md:hidden CSS */}
              <MobileHeroBackground heroConfig={heroConfig?.mobile} />

              {/*
                =====================================================
                MOBILE LAYER 10+: All Page Content (above background)
                =====================================================
                The wrapper below has z-10 on mobile to ensure all content
                renders ABOVE the fixed background layer.
              */}
              <div className={isMobile ? 'relative z-10 mobile-content-wrapper' : ''}>
                {/* Z-3: Fixed Header Layer */}
                {/* Desktop: Full Navigation | Mobile: MobileHeader with dock behavior */}
                <Navigation />
                {isMobile && <MobileHeader currentSection={currentSection} />}

                {/* Service Browser Modal - New simplified service exploration */}
                <ServiceBrowserModal />

                {/* Reads ?service= query param to deep-link into the services menu */}
                <ServiceQueryDeepLink />

                {/* Z-2: Drawer System Layer */}
                <DrawerSystem services={services} />

                {/* Z-1.5: Portfolio Surface Layer */}
                <TeamPortfolioView />

                {/* Panel System - Renders active panels */}
                <PanelRenderer />

                {/* Z-1: Page Surface - panels now overlay instead of pushing content */}
                <main className={`page-content overflow-x-hidden ${isMobile ? 'mobile-scroll-container' : ''}`}>

                  {/*
                    HERO SECTION: Transparent on mobile to show MobileHeroBackground through.
                  */}
                  <div
                    className={isMobile ? "mobile-section" : ""}
                    data-section-id="hero"
                    style={isMobile ? { background: 'transparent' } : undefined}
                  >
                    <HeroSection reviewStats={reviewStats} heroConfig={heroConfig?.desktop} />
                  </div>

                {/* Continuous ivory background wrapper for all sections from founder onwards */}
                <div className={`relative ${isMobile ? '' : 'bg-ivory'}`}>
                  {/* Founder Letter Section - Emily's letter with arch, right after hero */}
                  <div className={isMobile ? "mobile-section" : ""} data-section-id="founder">
                    <FounderLetterSection content={founderLetterContent} />
                  </div>

                  {/* Background container for all sections after founder letter */}
                  <div className={isMobile ? 'bg-ivory' : ''}>
                    {/*
                      SERVICES SECTION: Showcases all service categories with icons and descriptions.
                      Desktop: Grid layout | Mobile: Swipeable cards
                    */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="services">
                      {/*
                        Map DB ServiceCategory → ServicesSection.ServiceCategory.
                        Falls back to the section's own hardcoded copy when admin
                        hasn't filled in tagline/description. This is the wiring
                        that was missing — see tmp/admin-audit.md Part 1 §services.
                      */}
                      <ServicesSection
                        isMobile={isMobile}
                        categories={
                          serviceCategories.length > 0
                            ? serviceCategories.map(cat => ({
                                id: cat.id,
                                slug: cat.slug,
                                title: cat.name.toUpperCase(),
                                tagline: cat.tagline ?? '',
                                description: cat.description ?? '',
                                icon: cat.icon ?? '',
                              }))
                            : undefined
                        }
                      />
                    </div>

                    {/* Team Section */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="team" id="team">
                      <EnhancedTeamSectionClient teamMembers={teamMembers} serviceCategories={serviceCategories} />
                    </div>

                    {/* Reviews Section */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="reviews" id="reviews">
                      <ReviewsSection reviews={reviews} reviewStats={reviewStats} studio={studio} />
                    </div>

                    {/* Instagram Carousel */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="instagram" id="gallery">
                      <InstagramCarousel posts={instagramPosts} />
                    </div>

                    {/* FAQ Section */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="faq" id="faq">
                      <FAQSection
                        categories={faqData?.categories || []}
                        itemsByCategory={faqData?.itemsByCategory || {}}
                        featuredItems={faqData?.featuredItems || []}
                      />
                    </div>

                    {/* Map Section */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="map" id="find-us">
                      <MapSection studio={studio} />
                    </div>

                    {/* Footer */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="footer">
                      <FooterV2 studio={studio} />
                    </div>
                  </div>
                </div>
              </main>
            </div>{/* End of z-10 content wrapper */}
          </div>
        </PanelManagerProvider>
      </DrawerProvider>
      {/* Dev Mode Overlay - activated by clicking logo 5 times */}
      <DevModeOverlay />
      </VagaroWidgetProvider>
      </ServiceBrowserProvider>
    </BookingOrchestratorProvider>
    </DevModeProvider>
  );
}

