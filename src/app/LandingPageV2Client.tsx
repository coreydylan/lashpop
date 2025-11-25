"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { BookingOrchestratorProvider } from '@/contexts/BookingOrchestratorContext';
import { PanelStackProvider } from '@/contexts/PanelStackContext';
import { DrawerProvider } from '@/components/drawers/DrawerContext';
import { PanelManagerProvider } from '@/components/panels/PanelContext';
import DrawerSystem from '@/components/drawers/DrawerSystem';
import { Navigation } from '@/components/sections/Navigation';
import HeroSection from '@/components/landing-v2/HeroSection';
import { WelcomeSection } from '@/components/landing-v2/sections/WelcomeSection';
import { ScrollServicesTrigger } from '@/components/landing-v2/ScrollServicesTrigger';
import { FounderLetterSection } from '@/components/landing-v2/sections/FounderLetterSection';
import { EnhancedTeamSectionClient } from '@/components/sections/EnhancedTeamSectionClient';
import { InstagramCarousel } from '@/components/landing-v2/sections/InstagramCarousel';
import { ReviewsSection } from '@/components/landing-v2/sections/ReviewsSection';
import { FAQSection } from '@/components/landing-v2/sections/FAQSection';
import { MapSection } from '@/components/landing-v2/sections/MapSection';
import { FooterV2 } from '@/components/landing-v2/sections/FooterV2';
import { TeamPortfolioView } from '@/components/portfolio/TeamPortfolioView';
import { PanelRenderer } from '@/components/panels/PanelRenderer';
import { PanelStackContainer } from '@/components/panel-stack/PanelStackContainer';
import { MobilePanelStack } from '@/components/mobile/MobilePanelStack';
import { AutoDockOnScroll } from '@/components/panel-stack/AutoDockOnScroll';
import { SectionTransition } from '@/components/landing-v2/transitions/SectionTransition';
import { MobileSectionNav, SectionConfig } from '@/components/mobile/MobileSectionNav';
import { useCurrentSection } from '@/hooks/useScrollDirection';

// Import global styles to ensure all the beautiful v1 styles are available
import '@/app/globals.css';

// Section configuration for mobile nav rail
const SECTIONS: SectionConfig[] = [
  { id: 'hero', label: 'Welcome' },
  { id: 'welcome', label: 'About' },
  { id: 'founder', label: 'Our Story' },
  { id: 'team', label: 'Team' },
  { id: 'instagram', label: 'Gallery' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'faq', label: 'FAQ' },
  { id: 'map', label: 'Find Us' },
];

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
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  type: 'employee' | 'independent';
  businessName?: string;
  image: string;
  phone: string;
  specialties: string[];
  bio?: string;
  quote?: string;
  availability?: string;
  instagram?: string;
  bookingUrl: string;
  favoriteServices?: string[];
  funFact?: string;
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

interface LandingPageV2ClientProps {
  services: Service[];
  teamMembers: TeamMember[];
  reviews: Review[];
  reviewStats?: ReviewStat[];
  instagramPosts?: any[]; // Using any[] for now to avoid circular type dependency, or define strict type
  serviceCategories?: ServiceCategory[];
  faqData?: FAQData;
}

/**
 * Mobile Scroll Snap Styles
 *
 * UX Philosophy:
 * - Using `scroll-snap-type: y proximity` instead of `mandatory` because:
 *   1. Users can rest the scroll between sections (not locked to boundaries)
 *   2. Content within sections can scroll naturally without fighting snap
 *   3. Snapping becomes an assistive behavior, not a constraint
 *   4. Feels premium and intentional rather than gimmicky
 *
 * - Sections use min-height (not fixed height) so content can overflow naturally
 * - Smooth scroll behavior combined with proximity snap creates a flowing experience
 */
const scrollSnapStyles = `
  @media (max-width: 767px) {
    /* Main scrollable container - uses CSS scroll-snap with proximity */
    .mobile-scroll-container {
      /* Proximity snapping - assists without forcing */
      scroll-snap-type: y proximity;
      scroll-behavior: smooth;
      overflow-y: auto;
      overflow-x: hidden;
      height: 100vh;
      height: 100dvh; /* Dynamic viewport height for mobile browsers */
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
      /* Scroll padding accounts for fixed header */
      scroll-padding-top: 70px;
    }

    /* Each section as a snap target */
    .mobile-section {
      scroll-snap-align: start;
      /* Allow sections to be taller than viewport */
      min-height: 100vh;
      min-height: 100dvh;
      /* Flex column for content alignment */
      display: flex;
      flex-direction: column;
      position: relative;
      /* Subtle visual separation */
      border-bottom: 1px solid rgba(138, 124, 105, 0.05);
    }

    /* Sections that typically have more content - don't force min-height */
    .mobile-section[data-section-id="team"],
    .mobile-section[data-section-id="reviews"],
    .mobile-section[data-section-id="faq"] {
      min-height: auto;
      padding-bottom: 60px;
    }

    /* Footer doesn't need snap behavior */
    .mobile-section[data-section-id="footer"] {
      min-height: auto;
      scroll-snap-align: none;
    }

    /* First section - no scroll margin needed */
    .mobile-section:first-child {
      scroll-margin-top: 0;
    }

    /* Scroll margin for subsequent sections to align below header */
    .mobile-section:not(:first-child) {
      scroll-margin-top: 70px;
    }

    /* GPU acceleration for smooth scrolling */
    .mobile-scroll-container {
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      will-change: scroll-position;
    }

    /* Ensure content can scroll within sections */
    .mobile-section > * {
      flex-shrink: 0;
    }

    /* Visual scroll indicator at bottom of content sections */
    .mobile-section[data-has-more="true"]::after {
      content: '';
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 4px;
      background: rgba(138, 124, 105, 0.15);
      border-radius: 2px;
    }
  }

  /* Desktop - no special scroll snap behavior needed */
  @media (min-width: 768px) {
    .mobile-scroll-container {
      height: auto;
      overflow: visible;
    }

    .mobile-section {
      min-height: auto;
      scroll-snap-align: none;
    }
  }
`;

export default function LandingPageV2Client({ services, teamMembers, reviews, reviewStats = [], instagramPosts = [], serviceCategories = [], faqData }: LandingPageV2ClientProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Track current section for mobile nav rail using IntersectionObserver
  const currentSection = useCurrentSection(SECTIONS);

  // Handle section change from nav rail
  const handleSectionChange = useCallback((sectionId: string) => {
    // Section change is handled by the nav rail component
    // This callback is for any additional logic needed
  }, []);

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Mobile Scroll Behavior
   *
   * We now rely entirely on CSS scroll-snap with proximity behavior.
   * This provides a much smoother, less harsh experience because:
   *
   * 1. No JavaScript interception of touch/wheel events
   * 2. Native browser scroll physics (momentum, rubber-banding)
   * 3. Proximity snapping assists but doesn't force
   * 4. Users can scroll within sections and rest between them
   *
   * The IntersectionObserver in useCurrentSection handles tracking
   * which section is visible for the nav rail indicator.
   */

  return (
    <BookingOrchestratorProvider>
      <PanelStackProvider services={services}>
        <DrawerProvider>
          <PanelManagerProvider>
            <div className="min-h-screen bg-cream relative theme-v2">
              {/* Inject scroll-snap styles */}
              <style dangerouslySetInnerHTML={{ __html: scrollSnapStyles }} />

              {/* Z-3: Fixed Header Layer */}
              <Navigation />

              {/* Panel Stack System - Fixed at top below header (Desktop) */}
              {!isMobile && <PanelStackContainer />}

              {/* Mobile Panel Stack - Bottom sheets */}
              {isMobile && <MobilePanelStack />}

              {/* Auto-dock panels when user scrolls main content */}
              <AutoDockOnScroll scrollThreshold={100} />

              {/* Z-2: Drawer System Layer */}
              <DrawerSystem services={services} />

              {/* Z-1.5: Portfolio Surface Layer */}
              <TeamPortfolioView />

              {/* Panel System - Renders active panels */}
              <PanelRenderer />

              {/* Mobile Section Navigation Rail */}
              {isMobile && (
                <MobileSectionNav
                  sections={SECTIONS}
                  currentSection={currentSection}
                  onSectionChange={handleSectionChange}
                />
              )}

              {/* Z-1: Page Surface - CSS scroll-snap on mobile */}
              <main className={`page-content overflow-x-hidden ${isMobile ? 'mobile-scroll-container' : ''}`}>

                {/* Hero Section - Direct Render */}
                <section
                  className={isMobile ? "mobile-section" : ""}
                  data-section-id="hero"
                >
                  <HeroSection reviewStats={reviewStats} />
                </section>

                {/* Welcome to LashPop Section - Now standalone */}
                <section
                  className={isMobile ? "mobile-section" : ""}
                  data-section-id="welcome"
                >
                  <WelcomeSection />
                </section>

                {/* Trigger to open services panel when scrolling past Welcome */}
                <ScrollServicesTrigger />

                {/* Founder Letter Section */}
                <section
                  className={isMobile ? "mobile-section" : ""}
                  data-section-id="founder"
                >
                  <FounderLetterSection />
                </section>

                {/* Team Section - Adjusted trigger margin for earlier loading */}
                <section
                  className={isMobile ? "mobile-section" : ""}
                  data-section-id="team"
                >
                  <SectionTransition variant="slideUp" delay={0} triggerMargin="-40%">
                    <div id="team">
                      <EnhancedTeamSectionClient teamMembers={teamMembers} serviceCategories={serviceCategories} />
                    </div>
                  </SectionTransition>
                </section>

                {/* Instagram Carousel */}
                <section
                  className={isMobile ? "mobile-section" : ""}
                  data-section-id="instagram"
                >
                  <SectionTransition variant="scaleIn">
                    <div id="gallery">
                      <InstagramCarousel posts={instagramPosts} />
                    </div>
                  </SectionTransition>
                </section>

                {/* Reviews Section */}
                <section
                  className={isMobile ? "mobile-section" : ""}
                  data-section-id="reviews"
                >
                  <SectionTransition variant="slideUp">
                    <div id="reviews">
                      <ReviewsSection reviews={reviews} reviewStats={reviewStats} />
                    </div>
                  </SectionTransition>
                </section>

                {/* FAQ Section */}
                <section
                  className={isMobile ? "mobile-section" : ""}
                  data-section-id="faq"
                >
                  <SectionTransition variant="fade">
                    <div id="faq">
                      <FAQSection
                        categories={faqData?.categories || []}
                        itemsByCategory={faqData?.itemsByCategory || {}}
                        featuredItems={faqData?.featuredItems || []}
                      />
                    </div>
                  </SectionTransition>
                </section>

                {/* Map Section */}
                <section
                  className={isMobile ? "mobile-section" : ""}
                  data-section-id="map"
                >
                  <SectionTransition variant="scaleIn" delay={0.2}>
                    <div id="find-us" className="pt-20">
                      <MapSection />
                    </div>
                  </SectionTransition>
                </section>

                {/* Footer */}
                <section
                  className={isMobile ? "mobile-section" : ""}
                  data-section-id="footer"
                >
                  <FooterV2 />
                </section>
              </main>
            </div>
          </PanelManagerProvider>
        </DrawerProvider>
      </PanelStackProvider>
    </BookingOrchestratorProvider>
  );
}

