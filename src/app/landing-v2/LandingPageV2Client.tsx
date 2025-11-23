"use client";

import React from 'react';
import { BookingOrchestratorProvider } from '@/contexts/BookingOrchestratorContext';
import { PanelStackProvider } from '@/contexts/PanelStackContext';
import { DrawerProvider } from '@/components/drawers/DrawerContext';
import { PanelManagerProvider } from '@/components/panels/PanelContext';
import DrawerSystem from '@/components/drawers/DrawerSystem';
import { Navigation } from '@/components/sections/Navigation';
import HeroSection from '@/components/landing-v2/HeroSection';
import { HeroArchwayReveal } from '@/components/HeroArchwayReveal';
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

interface LandingPageV2ClientProps {
  services: Service[];
  teamMembers: TeamMember[];
  reviews: Review[];
  reviewStats?: ReviewStat[];
  instagramPosts?: any[]; // Using any[] for now to avoid circular type dependency, or define strict type
  serviceCategories?: ServiceCategory[];
}

export default function LandingPageV2Client({ services, teamMembers, reviews, reviewStats = [], instagramPosts = [], serviceCategories = [] }: LandingPageV2ClientProps) {
  return (
    <BookingOrchestratorProvider>
      <PanelStackProvider services={services}>
        <DrawerProvider>
          <PanelManagerProvider>
            <div className="min-h-screen bg-cream relative theme-v2">
              {/* Z-3: Fixed Header Layer */}
              <Navigation />

              {/* Panel Stack System - Fixed at top below header */}
              <PanelStackContainer />

              {/* Z-2: Drawer System Layer */}
              <DrawerSystem services={services} />

              {/* Z-1.5: Portfolio Surface Layer */}
              <TeamPortfolioView />

              {/* Panel System - Renders active panels */}
              <PanelRenderer />

              {/* Z-1: Page Surface with dynamic padding for panels */}
              <main className="page-content overflow-x-hidden" style={{ paddingTop: 'var(--panel-stack-height, 0px)' }}>
                {/* Hero with Archway Reveal and Photo Grid Scroller */}
                <HeroArchwayReveal
                  heroContent={<HeroSection reviewStats={reviewStats} />}
                />

                {/* Welcome to LashPop Section - Now standalone */}
                <WelcomeSection />

                {/* Trigger to open services panel when scrolling past Welcome */}
                <ScrollServicesTrigger />

                {/* Founder Letter Section */}
                <FounderLetterSection />

                {/* Team Section - Adjusted trigger margin for earlier loading */}
                <SectionTransition variant="slideUp" delay={0} triggerMargin="-40%">
                  <div id="team">
                    <EnhancedTeamSectionClient teamMembers={teamMembers} serviceCategories={serviceCategories} />
                  </div>
                </SectionTransition>

                {/* Instagram Carousel */}
                <SectionTransition variant="scaleIn">
                  <InstagramCarousel posts={instagramPosts} />
                </SectionTransition>

                {/* Reviews Section */}
                <SectionTransition variant="slideUp">
                  <ReviewsSection reviews={reviews} reviewStats={reviewStats} />
                </SectionTransition>

                {/* FAQ Section */}
                <SectionTransition variant="fade">
                  <FAQSection />
                </SectionTransition>

                {/* Map Section */}
                <SectionTransition variant="scaleIn" delay={0.2}>
                  <MapSection />
                </SectionTransition>

                {/* Footer */}
                <FooterV2 />
            </main>
          </div>
        </PanelManagerProvider>
      </DrawerProvider>
      </PanelStackProvider>
    </BookingOrchestratorProvider>
  );
}