import { Navigation } from '@/components/sections/Navigation'
import { HeroSection } from '@/components/sections/HeroSection'
import { PhotoTransition } from '@/components/sections/PhotoTransition'
import { ServiceDiscoveryQuiz } from '@/components/sections/ServiceDiscoveryQuiz'
import { ServicesSection } from '@/components/sections/ServicesSectionServer'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { EnhancedTeamSection } from '@/components/sections/EnhancedTeamSectionServer'
import { ContactSection } from '@/components/sections/ContactSection'
import { Footer } from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="overflow-x-hidden">
        <HeroSection />
        <PhotoTransition />
        <ServiceDiscoveryQuiz />
        <div id="services">
          <ServicesSection />
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