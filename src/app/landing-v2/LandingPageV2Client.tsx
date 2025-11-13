"use client";

import React from 'react';
import { BookingOrchestratorProvider } from '@/contexts/BookingOrchestratorContext';
import { CascadingPanelProvider } from '@/contexts/CascadingPanelContext';
import { DrawerProvider } from '@/components/drawers/DrawerContext';
import { PanelManagerProvider } from '@/components/panels/PanelContext';
import DrawerSystem from '@/components/drawers/DrawerSystem';
import { Navigation } from '@/components/sections/Navigation';
import HeroSection from '@/components/landing-v2/HeroSection';
import { PhotoTransition } from '@/components/sections/PhotoTransition';
import AboutSection from '@/components/landing-v2/AboutSection';
import { EnhancedTeamSectionClient } from '@/components/sections/EnhancedTeamSectionClient';
import TestimonialsSection from '@/components/landing-v2/TestimonialsSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { Footer } from '@/components/sections/Footer';
import { TeamPortfolioView } from '@/components/portfolio/TeamPortfolioView';
import { PanelRenderer } from '@/components/panels/PanelRenderer';
import { CascadingPanelContainer } from '@/components/cascading-panels/CascadingPanelContainer';

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

interface LandingPageV2ClientProps {
  services: Service[];
  teamMembers: TeamMember[];
}

export default function LandingPageV2Client({ services, teamMembers }: LandingPageV2ClientProps) {
  return (
    <BookingOrchestratorProvider>
      <CascadingPanelProvider services={services}>
        <DrawerProvider>
          <PanelManagerProvider>
            <div className="min-h-screen bg-cream relative">
              {/* Z-3: Fixed Header Layer - Using exact v1 Navigation */}
              <Navigation />

              {/* Z-2: Drawer System Layer */}
              <DrawerSystem services={services} />

              {/* Z-1.5: Portfolio Surface Layer (between page and drawers) */}
              <TeamPortfolioView />

              {/* Panel System - Renders active panels */}
              <PanelRenderer />

              {/* Cascading Panel System - New booking flow */}
              <CascadingPanelContainer />

              {/* Z-1: Page Surface */}
              <main className="page-content overflow-x-hidden">
                <HeroSection />
                <PhotoTransition />
                <AboutSection />
                <div id="team">
                  <EnhancedTeamSectionClient teamMembers={teamMembers} />
                </div>
                <TestimonialsSection />
                <ContactSection />
                <Footer />
            </main>
          </div>
        </PanelManagerProvider>
      </DrawerProvider>
      </CascadingPanelProvider>
    </BookingOrchestratorProvider>
  );
}