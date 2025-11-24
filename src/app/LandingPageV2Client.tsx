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

// Add custom CSS for scroll-snap on mobile
const scrollSnapStyles = `
  @media (max-width: 767px) {
    /* Main container with card-scroll behavior */
    .mobile-snap-container {
      scroll-behavior: smooth;
      overflow-y: auto;
      height: 100vh;
      -webkit-overflow-scrolling: touch;
      position: relative;
      /* Subtle elastic overscroll on iOS */
      -webkit-overflow-scrolling: touch;
    }

    /* Each section as a "card" */
    .mobile-snap-section {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
      /* Card-like appearance with subtle depth */
      background: linear-gradient(to bottom,
        rgba(255,255,255,0.02) 0%,
        transparent 10%,
        transparent 90%,
        rgba(0,0,0,0.02) 100%);
      /* Subtle border between cards */
      border-bottom: 1px solid rgba(0,0,0,0.03);
    }

    /* Add visual feedback at section boundaries */
    .mobile-snap-section::after {
      content: '';
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 3px;
      background: rgba(0,0,0,0.1);
      border-radius: 2px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    /* Show boundary indicator when scrollable */
    .mobile-snap-section:not(:last-child)::after {
      opacity: 0.3;
      animation: subtleBounce 2s ease-in-out infinite;
    }

    @keyframes subtleBounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(3px); }
    }

    /* Special handling for sections that need more space */
    .mobile-snap-section:has(#team),
    .mobile-snap-section:has(#gallery),
    .mobile-snap-section:has(#reviews) {
      min-height: auto; /* Let content determine height */
      padding-bottom: 10vh; /* Add some breathing room */
    }

    /* Adjust for fixed navigation */
    .mobile-snap-section {
      scroll-margin-top: 64px; /* Height of navigation */
      padding-top: 20px; /* Add some padding after nav */
    }

    /* First section doesn't need extra padding */
    .mobile-snap-section:first-child {
      padding-top: 0;
      scroll-margin-top: 0;
    }

    /* Smooth scroll physics */
    .mobile-snap-container {
      scroll-padding: 64px 0 0 0;
    }

    /* Add momentum scrolling for iOS */
    .mobile-snap-container {
      -webkit-overflow-scrolling: touch;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }

    /* Visual indicator that section is "locked" */
    .mobile-snap-section.in-view {
      animation: subtlePulse 0.6s ease-out;
    }

    @keyframes subtlePulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.002); }
      100% { transform: scale(1); }
    }

    /* Add class for when we want to snap */
    .mobile-snap-container.snap-active {
      scroll-snap-type: y mandatory;
    }

    .snap-active .mobile-snap-section {
      scroll-snap-align: start;
      scroll-snap-stop: always;
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

  // Set up card-to-card scroll mechanics
  useEffect(() => {
    if (!isMobile) return;

    let currentSectionIndex = 0;
    let isTransitioning = false;
    let touchStartY = 0;
    let scrollAccumulator = 0;
    let lastScrollY = 0;
    let snapContainer: HTMLElement | null = null;

    // Get the main container and sections
    snapContainer = document.querySelector('.mobile-snap-container');
    if (!snapContainer) return;

    const sections = document.querySelectorAll('.mobile-snap-section');
    if (sections.length === 0) return;

    // Function to snap to a specific section
    const snapToSection = (index: number, instant = false) => {
      if (index < 0 || index >= sections.length || isTransitioning) return;

      isTransitioning = true;
      currentSectionIndex = index;
      const targetSection = sections[index] as HTMLElement;
      const targetScrollTop = targetSection.offsetTop;

      // Update current section state
      const sectionId = targetSection.getAttribute('data-section-id') || '';
      setCurrentSection(sectionId);

      // Scroll to the section
      snapContainer!.scrollTo({
        top: targetScrollTop,
        behavior: instant ? 'auto' : 'smooth'
      });

      // Trigger animations after snap
      setTimeout(() => {
        targetSection.classList.add('in-view');
        targetSection.dispatchEvent(new CustomEvent('section-locked'));

        setTimeout(() => {
          targetSection.classList.remove('in-view');
          isTransitioning = false;
        }, 900);
      }, instant ? 0 : 400);
    };

    // Handle wheel/scroll events with threshold
    const handleWheel = (e: WheelEvent) => {
      if (isTransitioning) {
        e.preventDefault();
        return;
      }

      // Don't prevent default immediately - let some natural scrolling happen
      const currentSection = sections[currentSectionIndex] as HTMLElement;
      const rect = currentSection.getBoundingClientRect();
      const scrollTop = snapContainer!.scrollTop;
      const sectionTop = currentSection.offsetTop;
      const sectionBottom = sectionTop + currentSection.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Check if we're at section boundaries
      const atSectionBottom = scrollTop >= sectionBottom - viewportHeight - 50;
      const atSectionTop = scrollTop <= sectionTop + 50;

      const deltaY = e.deltaY;

      // If scrolling down and at bottom of section, or scrolling up and at top
      if ((deltaY > 0 && atSectionBottom && currentSectionIndex < sections.length - 1) ||
          (deltaY < 0 && atSectionTop && currentSectionIndex > 0)) {

        scrollAccumulator += deltaY;

        // Lower threshold for more responsive snapping
        const threshold = 30;

        if (Math.abs(scrollAccumulator) > threshold) {
          if (scrollAccumulator > 0 && currentSectionIndex < sections.length - 1) {
            // Scrolling down - go to next section
            snapToSection(currentSectionIndex + 1);
          } else if (scrollAccumulator < 0 && currentSectionIndex > 0) {
            // Scrolling up - go to previous section
            snapToSection(currentSectionIndex - 1);
          }
          scrollAccumulator = 0;
        }

        // Prevent default only when at boundaries
        e.preventDefault();
      }
      // Allow natural scrolling within section
    };

    // Handle touch events for mobile swipe
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isTransitioning) {
        e.preventDefault();
        return;
      }

      const touchEndY = e.touches[0].clientY;
      const deltaY = touchStartY - touchEndY;

      // Only prevent default if we're moving vertically
      if (Math.abs(deltaY) > 5) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning) return;

      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      const threshold = 50; // Swipe threshold

      if (deltaY > threshold && currentSectionIndex < sections.length - 1) {
        // Swiped up - next section
        snapToSection(currentSectionIndex + 1);
      } else if (deltaY < -threshold && currentSectionIndex > 0) {
        // Swiped down - previous section
        snapToSection(currentSectionIndex - 1);
      }
    };

    // Also handle edge detection for natural scrolling at section boundaries
    const handleScroll = () => {
      const scrollTop = snapContainer!.scrollTop;
      const currentSection = sections[currentSectionIndex] as HTMLElement;
      const sectionTop = currentSection.offsetTop;
      const sectionBottom = sectionTop + currentSection.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Check if we've scrolled past the current section's boundaries
      if (!isTransitioning) {
        if (scrollTop > sectionBottom - viewportHeight + 100 && currentSectionIndex < sections.length - 1) {
          // Reached bottom of current section, snap to next
          snapToSection(currentSectionIndex + 1);
        } else if (scrollTop < sectionTop - 100 && currentSectionIndex > 0) {
          // Scrolled above current section, snap to previous
          snapToSection(currentSectionIndex - 1);
        }
      }

      lastScrollY = scrollTop;
    };

    // Initial snap to first section
    snapToSection(0, true);

    // Add event listeners
    snapContainer.addEventListener('wheel', handleWheel, { passive: false });
    snapContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    snapContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    snapContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    snapContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (snapContainer) {
        snapContainer.removeEventListener('wheel', handleWheel);
        snapContainer.removeEventListener('touchstart', handleTouchStart);
        snapContainer.removeEventListener('touchmove', handleTouchMove);
        snapContainer.removeEventListener('touchend', handleTouchEnd);
        snapContainer.removeEventListener('scroll', handleScroll);
      }
    };
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

