import { Navigation } from '@/components/sections/Navigation'
import { HeroSection } from '@/components/sections/HeroSection'
<<<<<<< HEAD
import { WaveTransition } from '@/components/sections/WaveTransition'
=======
>>>>>>> 88a9f9fc746390e8ce5b05595c419c35f4e6ce6d
import { ServicesSection } from '@/components/sections/ServicesSection'
import { GallerySection } from '@/components/sections/GallerySection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { Footer } from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="overflow-x-hidden">
        <HeroSection />
<<<<<<< HEAD
        <WaveTransition />
=======
>>>>>>> 88a9f9fc746390e8ce5b05595c419c35f4e6ce6d
        <div id="services">
          <ServicesSection />
        </div>
        <div id="gallery">
          <GallerySection />
        </div>
        <TestimonialsSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}