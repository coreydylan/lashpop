import { Navigation } from '@/components/sections/Navigation'
import { HeroSection } from '@/components/sections/HeroSection'
import { HeroArchwayReveal } from '@/components/HeroArchwayReveal'
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
import { PanelStackProvider } from '@/contexts/PanelStackContext'
import { PanelStackContainer } from '@/components/panel-stack/PanelStackContainer'
import { getAllServices } from '@/actions/services'

export default async function HomePage() {
  const services = await getAllServices()

  return (
    <BookingOrchestratorProvider>
      <PanelManagerProvider>
        <PanelStackProvider services={services}>
          <Navigation />
          <TeamPortfolioView />
          <PanelRenderer />
          <PanelStackContainer />
          <main className="overflow-x-hidden">
            {/* Hero with Archway Reveal and Grid Scroller */}
            <HeroArchwayReveal
              heroContent={<HeroSection />}
              nextSection={<ServiceDiscoveryQuiz />}
            />
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
        </PanelStackProvider>
      </PanelManagerProvider>
    </BookingOrchestratorProvider>
  )
}