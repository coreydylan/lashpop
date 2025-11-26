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
import { PanelStackRenderer } from '@/components/panel-stack/PanelStackRenderer';
import { SectionTransition } from '@/components/landing-v2/transitions/SectionTransition';
import { useMobileGSAPScroll } from '@/hooks/useMobileGSAPScroll';

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

// Minimal mobile styles - GSAP handles the scroll behavior
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
    .mobile-section[data-section-id="team"],
    .mobile-section[data-section-id="reviews"],
    .mobile-section[data-section-id="faq"] {
      min-height: auto;
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

export default function LandingPageV2Client({ services, teamMembers, reviews, reviewStats = [], instagramPosts = [], serviceCategories = [], faqData }: LandingPageV2ClientProps) {
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
    snapThreshold: 0.4, // Snap when within 40% of section boundary - more aggressive anchoring
    snapDuration: 0.4,  // Slightly faster snap for snappier feel
    onSectionChange: handleSectionChange
  });

  return (
    <BookingOrchestratorProvider>
      <PanelStackProvider services={services}>
        <DrawerProvider>
          <PanelManagerProvider>
            <div className="min-h-screen bg-cream relative theme-v2">
              {/* Inject mobile scroll styles */}
              <style dangerouslySetInnerHTML={{ __html: mobileScrollStyles }} />

              {/* Z-3: Fixed Header Layer */}
              <Navigation />

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

                {/* Hero Section - Direct Render */}
                <div className={isMobile ? "mobile-section" : ""} data-section-id="hero">
                  <HeroSection reviewStats={reviewStats} />
                </div>

                {/* Welcome to LashPop Section - Now standalone */}
                <div className={isMobile ? "mobile-section" : ""} data-section-id="welcome">
                  <WelcomeSection />
                </div>

                {/* Trigger to open services panel when scrolling past Welcome */}
                <ScrollServicesTrigger />

                {/* Founder Letter Section */}
                <div className={isMobile ? "mobile-section" : ""} data-section-id="founder">
                  <FounderLetterSection />
                </div>

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
            </main>
          </div>
        </PanelManagerProvider>
      </DrawerProvider>
      </PanelStackProvider>
    </BookingOrchestratorProvider>
  );
}

