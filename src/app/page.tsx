import { Navigation } from '@/components/sections/Navigation'
import { HeroSection } from '@/components/sections/HeroSection'
import { ShopTransition } from '@/components/sections/ShopTransition'
import { VisionSection } from '@/components/sections/VisionSection'
import { ServiceQuiz } from '@/components/sections/ServiceQuiz'
import { ServicesPreamble } from '@/components/sections/ServicesPreamble'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { PhotoTransition } from '@/components/sections/PhotoTransition'
import { EnhancedReviews } from '@/components/sections/EnhancedReviews'
import { InstagramCollage } from '@/components/sections/InstagramCollage'
import { EnhancedTeam } from '@/components/sections/EnhancedTeam'
import { FAQSection } from '@/components/sections/FAQSection'
import { MapSection } from '@/components/sections/MapSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { Footer } from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="overflow-x-hidden">
        <HeroSection />
        <ShopTransition />
        <VisionSection />
        <ServiceQuiz />
        <ServicesPreamble />
        <div id="services">
          <ServicesSection />
        </div>
        <PhotoTransition />
        <EnhancedReviews />
        <InstagramCollage />
        <EnhancedTeam />
        <FAQSection />
        <MapSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}