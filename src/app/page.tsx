import { Navigation } from '@/components/sections/Navigation'
import { HeroSection } from '@/components/sections/HeroSection'
import { PhotoTransition } from '@/components/sections/PhotoTransition'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { GallerySection } from '@/components/sections/GallerySection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { EnhancedTeamSection } from '@/components/sections/EnhancedTeamSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { Footer } from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="overflow-x-hidden">
        <HeroSection />
        <PhotoTransition />
        <div id="services">
          <ServicesSection />
        </div>
        <div id="gallery">
          <GallerySection />
        </div>
        <TestimonialsSection />
        <AboutSection />
        <div id="team">
          <EnhancedTeamSection />
        </div>
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}