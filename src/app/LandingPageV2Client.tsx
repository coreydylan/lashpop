"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { BookingOrchestratorProvider } from '@/contexts/BookingOrchestratorContext';
import { PanelStackProvider } from '@/contexts/PanelStackContext';
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
import { WelcomeSection } from '@/components/landing-v2/sections/WelcomeSection';
import { FounderLetterSection } from '@/components/landing-v2/sections/FounderLetterSection';
import { EnhancedTeamSectionClient } from '@/components/sections/EnhancedTeamSectionClient';
import { InstagramCarousel } from '@/components/landing-v2/sections/InstagramCarousel';
import { ReviewsSection } from '@/components/landing-v2/sections/ReviewsSection';
import { FAQSection } from '@/components/landing-v2/sections/FAQSection';
import { MapSection } from '@/components/landing-v2/sections/MapSection';
import { FooterV2 } from '@/components/landing-v2/sections/FooterV2';
import { TeamPortfolioView } from '@/components/portfolio/TeamPortfolioView';
import { PanelRenderer } from '@/components/panels/PanelRenderer';
import { PanelStackRenderer } from '@/components/panel-stack/PanelStackRenderer';
import { SectionTransition } from '@/components/landing-v2/transitions/SectionTransition';
import { useMobileGSAPScroll } from '@/hooks/useMobileGSAPScroll';
import { useMobileStackingCards } from '@/hooks/useMobileStackingCards';

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
      overscroll-behavior-y: contain;
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
    .mobile-section[data-section-id="team"],
    .mobile-section[data-section-id="instagram"],
    .mobile-section[data-section-id="reviews"],
    .mobile-section[data-section-id="faq"],
    .mobile-section[data-section-id="map"] {
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

  // Handle section change from GSAP scroll
  const handleSectionChange = useCallback((sectionId: string) => {
    setCurrentSection(sectionId);
  }, []);

  // Use GSAP-based smooth scroll with soft snapping on mobile
  useMobileGSAPScroll({
    enabled: isMobile,
    sectionSelector: '.mobile-section',
    containerSelector: '.mobile-scroll-container',
    snapThreshold: 0.55, // Snap when within 55% of section boundary - more aggressive for magical feel
    snapDuration: 0.35,  // Snappier animation (research suggests 200-400ms ideal)
    onSectionChange: handleSectionChange
  });

  // Stacking Card effect DISABLED - was causing scroll stutter
  // The arch from FounderLetterSection naturally slides over the welcome section via z-index
  // useMobileStackingCards({
  //   enabled: isMobile,
  //   containerSelector: '.mobile-scroll-container',
  //   itemSelector: '[data-effect="stack"]'
  // });

  return (
    <DevModeProvider>
    <BookingOrchestratorProvider>
      <PanelStackProvider services={services}>
        <VagaroWidgetProvider>
        <DrawerProvider>
          <PanelManagerProvider>
            <div className={`min-h-screen relative theme-v2 ${isMobile ? '' : 'bg-cream'}`}>
              {/* Inject mobile scroll styles */}
              <style dangerouslySetInnerHTML={{ __html: mobileScrollStyles }} />

              {/*
                =====================================================
                MOBILE LAYER 0: Fixed Hero Background
                =====================================================
                This MUST be rendered BEFORE and OUTSIDE the scroll container.
                It's at z-0, everything else is z-10+.
                Contains: gradient, arch image, logo, decorative circles.
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

                {/* Panel Stack System - Responsive: top panels on desktop, bottom sheet on mobile */}
                <PanelStackRenderer />

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
                    On desktop, HeroSection renders its own background.
                  */}
                  <div
                    className={isMobile ? "mobile-section" : ""}
                    data-section-id="hero"
                    style={isMobile ? { background: 'transparent' } : undefined}
                  >
                    <HeroSection reviewStats={reviewStats} heroConfig={heroConfig?.desktop} />
                  </div>

                  {/*
                    WELCOME SECTION: Has its own background image, works on both mobile/desktop.
                    Uses data-effect="stack" to be pinned by useMobileStackingCards hook.
                  */}
                  <div className={isMobile ? "z-10" : ""} data-section-id="welcome" data-effect="stack">
                    <WelcomeSection isMobile={isMobile} />
                  </div>

                {/* Services panel trigger removed - users open via menu/buttons */}

                {/* Continuous cream background wrapper for all sections from founder onwards */}
                {/* z-20 ensures this scrolls over the sticky WelcomeSection (z-10) on mobile */}
                {/* negative margin pulls it UP so it overlaps the sticky Welcome Section while it's "pausing" */}
                {/* On mobile, bg is transparent initially so arch PNG transparency shows through, then cream kicks in */}
                <div className={`relative z-20 ${isMobile ? '-mt-[100dvh]' : 'bg-cream'}`}>
                  {/* Founder Letter Section - handles its own cream background transition on mobile */}
                  <div className={isMobile ? "mobile-section" : ""} data-section-id="founder">
                    <FounderLetterSection content={founderLetterContent} />
                  </div>

                  {/* Cream background container for all sections after founder arch on mobile */}
                  {/* Negative margin pulls team section up into the empty space left by the 150vh wrapper */}
                  {/* z-[60] ensures team scrolls over the letter card (z-50) */}
                  <div className={isMobile ? 'bg-cream -mt-[55vh] relative z-[60]' : ''}>
                    {/* Team Section - Adjusted trigger margin for earlier loading */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="team">
                      <SectionTransition variant="slideUp" delay={0} triggerMargin="-40%">
                        <div id="team">
                          <EnhancedTeamSectionClient teamMembers={teamMembers} serviceCategories={serviceCategories} />
                        </div>
                      </SectionTransition>
                    </div>

                    {/* Instagram Carousel */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="instagram">
                      <SectionTransition variant="scaleIn">
                        <div id="gallery">
                          <InstagramCarousel posts={instagramPosts} />
                        </div>
                      </SectionTransition>
                    </div>

                    {/* Reviews Section */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="reviews">
                      <SectionTransition variant="slideUp">
                        <div id="reviews">
                          <ReviewsSection reviews={reviews} reviewStats={reviewStats} />
                        </div>
                      </SectionTransition>
                    </div>

                    {/* FAQ Section */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="faq">
                      <SectionTransition variant="fade">
                        <div id="faq">
                          <FAQSection
                            categories={faqData?.categories || []}
                            itemsByCategory={faqData?.itemsByCategory || {}}
                            featuredItems={faqData?.featuredItems || []}
                          />
                        </div>
                      </SectionTransition>
                    </div>

                    {/* Map Section */}
                    <div className={isMobile ? "mobile-section" : ""} data-section-id="map">
                      <SectionTransition variant="scaleIn" delay={0.2}>
                        <div id="find-us" className="pt-20">
                          <MapSection />
                        </div>
                      </SectionTransition>
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
      </PanelStackProvider>
    </BookingOrchestratorProvider>
    </DevModeProvider>
  );
}

