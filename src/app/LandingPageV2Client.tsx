"use client";

import React, { useEffect, useState } from 'react';
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
import { AutoDockOnScroll } from '@/components/panel-stack/AutoDockOnScroll';
import { SectionTransition } from '@/components/landing-v2/transitions/SectionTransition';

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

// Add custom CSS for scroll-snap on mobile - optimized for smooth scrolling
const scrollSnapStyles = `
  @media (max-width: 767px) {
    /* Main container with smooth snap behavior */
    .mobile-snap-container {
      scroll-behavior: smooth;
      overflow-y: auto;
      overflow-x: hidden;
      height: 100vh;
      height: 100dvh; /* Dynamic viewport height for mobile browsers */
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
      position: relative;
      /* Enable scroll snap with proximity for smoother feel */
      scroll-snap-type: y proximity;
      scroll-padding-top: 64px;
    }

    /* Each section as a snap target */
    .mobile-snap-section {
      scroll-snap-align: start;
      scroll-snap-stop: normal; /* Allow scrolling through sections smoothly */
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: visible;
      /* Subtle visual separation */
      border-bottom: 1px solid rgba(0,0,0,0.03);
    }

    /* Sections with scrollable content get special treatment */
    .mobile-snap-section.has-scroll-content {
      min-height: auto;
      height: auto;
      padding-bottom: 40px;
    }

    /* Sections that need more space for content */
    .mobile-snap-section:has(#team),
    .mobile-snap-section:has(#gallery),
    .mobile-snap-section:has(#reviews),
    .mobile-snap-section:has(#faq) {
      min-height: auto;
      height: auto;
      scroll-snap-align: start;
      padding-bottom: 60px;
    }

    /* Adjust for fixed navigation */
    .mobile-snap-section {
      scroll-margin-top: 64px;
    }

    /* First section doesn't need extra margin */
    .mobile-snap-section:first-child {
      scroll-margin-top: 0;
    }

    /* Ensure inner content can scroll without affecting snap */
    .mobile-snap-section .scroll-inner {
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      max-height: calc(100vh - 64px);
      max-height: calc(100dvh - 64px);
    }

    /* Hardware acceleration for smoother scrolling */
    .mobile-snap-container,
    .mobile-snap-section {
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      will-change: scroll-position;
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

  // Track current section for analytics/events (using IntersectionObserver for smooth tracking)
  useEffect(() => {
    if (!isMobile) return;

    const snapContainer = document.querySelector('.mobile-snap-container');
    if (!snapContainer) return;

    const sections = document.querySelectorAll('.mobile-snap-section');
    if (sections.length === 0) return;

    // Use IntersectionObserver for efficient section tracking
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const sectionId = entry.target.getAttribute('data-section-id') || '';
            setCurrentSection(sectionId);
            // Dispatch event for other components to react
            entry.target.dispatchEvent(new CustomEvent('section-locked', { bubbles: true }));
          }
        });
      },
      {
        root: snapContainer,
        threshold: [0.5],
        rootMargin: '-64px 0px 0px 0px', // Account for header
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [isMobile]);

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

              {/* Panel Stack System - Fixed at top below header */}
              <PanelStackContainer />

              {/* Auto-dock panels when user scrolls main content */}
              <AutoDockOnScroll scrollThreshold={100} />

              {/* Z-2: Drawer System Layer */}
              <DrawerSystem services={services} />

              {/* Z-1.5: Portfolio Surface Layer */}
              <TeamPortfolioView />

              {/* Panel System - Renders active panels */}
              <PanelRenderer />

              {/* Z-1: Page Surface - panels now overlay instead of pushing content */}
              <main className={`page-content overflow-x-hidden ${isMobile ? 'mobile-snap-container' : ''}`}>
                
                {/* Hero Section - Direct Render */}
                <div className={isMobile ? "mobile-snap-section" : ""} data-section-id="hero">
                  <HeroSection reviewStats={reviewStats} />
                </div>

                {/* Welcome to LashPop Section - Now standalone */}
                <div className={isMobile ? "mobile-snap-section" : ""} data-section-id="welcome">
                  <WelcomeSection />
                </div>

                {/* Trigger to open services panel when scrolling past Welcome */}
                <ScrollServicesTrigger />

                {/* Founder Letter Section */}
                <div className={isMobile ? "mobile-snap-section" : ""} data-section-id="founder">
                  <FounderLetterSection />
                </div>

                {/* Team Section - Adjusted trigger margin for earlier loading */}
                <div className={isMobile ? "mobile-snap-section" : ""} data-section-id="team">
                  <SectionTransition variant="slideUp" delay={0} triggerMargin="-40%">
                    <div id="team">
                      <EnhancedTeamSectionClient teamMembers={teamMembers} serviceCategories={serviceCategories} />
                    </div>
                  </SectionTransition>
                </div>

                {/* Instagram Carousel */}
                <div className={isMobile ? "mobile-snap-section" : ""} data-section-id="instagram">
                  <SectionTransition variant="scaleIn">
                    <div id="gallery">
                      <InstagramCarousel posts={instagramPosts} />
                    </div>
                  </SectionTransition>
                </div>

                {/* Reviews Section */}
                <div className={isMobile ? "mobile-snap-section" : ""} data-section-id="reviews">
                  <SectionTransition variant="slideUp">
                    <div id="reviews">
                      <ReviewsSection reviews={reviews} reviewStats={reviewStats} />
                    </div>
                  </SectionTransition>
                </div>

                {/* FAQ Section */}
                <div className={isMobile ? "mobile-snap-section" : ""} data-section-id="faq">
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
                <div className={isMobile ? "mobile-snap-section" : ""} data-section-id="map">
                  <SectionTransition variant="scaleIn" delay={0.2}>
                    <div id="find-us" className="pt-20">
                      <MapSection />
                    </div>
                  </SectionTransition>
                </div>

                {/* Footer */}
                <div className={isMobile ? "mobile-snap-section" : ""} data-section-id="footer">
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

