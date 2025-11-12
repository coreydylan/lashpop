"use client";

import React from 'react';
import { DrawerProvider } from '@/components/drawers/DrawerContext';
import DrawerSystem from '@/components/drawers/DrawerSystem';
import Header from '@/components/landing-v2/Header';
import HeroSection from '@/components/landing-v2/HeroSection';
import AboutSection from '@/components/landing-v2/AboutSection';
import TeamSection from '@/components/landing-v2/TeamSection';
import TestimonialsSection from '@/components/landing-v2/TestimonialsSection';
import ContactSection from '@/components/landing-v2/ContactSection';
import Footer from '@/components/landing-v2/Footer';

// Import global styles to ensure all the beautiful v1 styles are available
import '@/app/globals.css';

export default function LandingPageV2() {
  return (
    <DrawerProvider>
      <div className="min-h-screen bg-cream relative">
        {/* Z-3: Fixed Header Layer */}
        <Header />

        {/* Z-2: Drawer System Layer */}
        <DrawerSystem />

        {/* Z-1: Page Surface */}
        <main className="page-content overflow-x-hidden">
          <HeroSection />
          <AboutSection />
          <TeamSection />
          <TestimonialsSection />
          <ContactSection />
          <Footer />
        </main>
      </div>
    </DrawerProvider>
  );
}