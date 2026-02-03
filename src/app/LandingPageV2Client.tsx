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
import { InstagramCarousel } from '@/components/landing-v2/sections/InstagramCarousel';
import { ReviewsSection } from '@/components/landing-v2/sections/ReviewsSection';
import { FAQSection } from '@/components/landing-v2/sections/FAQSection';
import { MapSection } from '@/components/landing-v2/sections/MapSection';
import { FooterV2 } from '@/components/landing-v2/sections/FooterV2';
import { TeamPortfolioView } from '@/components/portfolio/TeamPortfolioView';
import { PanelRenderer } from '@/components/panels/PanelRenderer';
import { ServiceBrowserProvider, ServiceBrowserModal } from '@/components/service-browser';

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

interface FounderLetterContent {
  greeting: string;
  paragraphs: string[];
  signOff: string;
  signature: string;
}

// Hero slideshow/image config types
import type { SlideshowPreset, SlideshowImage } from '@/types/hero-slideshow';

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

export default function LandingPageV2Client({ services, teamMembers, reviews, reviewStats = [], instagramPosts = [], serviceCategories = [], faqData, founderLetterContent, heroConfig }: LandingPageV2ClientProps) {
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
              {isMobile && <MobileHeroBackground heroConfig={heroConfig?.mobile} />}

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
                      <ServicesSection isMobile={isMobile} />
                    </div>

                    {/* Team Section */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="team" id="team">
                      <EnhancedTeamSectionClient teamMembers={teamMembers} serviceCategories={serviceCategories} />
                    </div>

                    {/* Reviews Section */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="reviews" id="reviews">
                      <ReviewsSection reviews={reviews} reviewStats={reviewStats} />
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
                      <MapSection />
                    </div>

                    {/* Footer */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="footer">
                      <FooterV2 />
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

