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
import { BookingOrchestratorProvider } from '@/contexts/BookingOrchestratorContext'
import { PanelManagerProvider } from '@/components/panels/PanelContext'
import { TeamPortfolioView } from '@/components/portfolio/TeamPortfolioView'
import { PanelRenderer } from '@/components/panels/PanelRenderer'

export default function HomePage() {
  return (
    <BookingOrchestratorProvider>
      <PanelManagerProvider>
        <Navigation />
        <TeamPortfolioView />
        <PanelRenderer />
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
      </PanelManagerProvider>
    </BookingOrchestratorProvider>
  )
}