'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { trackPhoneClick, trackEmailClick, trackSocialClick } from '@/lib/analytics'
import type { BusinessInfo, SocialLinks, ServiceAreas, OpeningHours } from '@/actions/site-settings'

interface FooterV2Props {
  businessInfo?: BusinessInfo
  socialLinks?: SocialLinks
  serviceAreas?: ServiceAreas
  openingHours?: OpeningHours
}

export function FooterV2({
  businessInfo = {
    name: 'LashPop Studios',
    phone: '+1-760-212-0448',
    email: 'hello@lashpopstudios.com',
    streetAddress: '429 S Coast Hwy',
    city: 'Oceanside',
    state: 'CA',
    postalCode: '92054',
    country: 'US',
    latitude: 33.1959,
    longitude: -117.3795,
  },
  socialLinks = {
    instagram: 'https://instagram.com/lashpopstudios',
    facebook: 'https://facebook.com/lashpopstudios'
  },
  serviceAreas = {
    cities: [
      'Lash Extensions Oceanside',
      'Lash Extensions Carlsbad',
      'Lash Extensions Vista',
      'Lash Extensions Encinitas',
      'Lash Extensions San Marcos',
      'Lash Extensions Escondido'
    ]
  },
  openingHours = {
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '08:00',
    closes: '19:30',
  }
}: FooterV2Props = {}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-10%" })
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  // Format opening hours for display
  const formattedHours = `${openingHours.opens.replace(':00', 'a')}-${openingHours.closes.replace(':00', ':30p')} every day\nby appointment only`

  // Business description
  const businessDescription = "North County San Diego's premier lash extension studio. Award-winning artistry in Oceanside, CA."

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // If honeypot is filled, silently pretend success (it's a bot)
    if (honeypot) {
      setIsSubscribed(true)
      setTimeout(() => {
        setEmail('')
        setHoneypot('')
        setIsSubscribed(false)
      }, 3000)
      return
    }
    if (email) {
      // Handle newsletter subscription
      setIsSubscribed(true)
      setTimeout(() => {
        setEmail('')
        setIsSubscribed(false)
      }, 3000)
    }
  }

  return (
    <footer ref={ref} className="bg-cream pt-20 pb-8">
      <div className="container">
        {/* Main Footer Content */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {/* Brand Column */}
          <div>
            <h3 className="heading-4 text-dune mb-4">{businessInfo.name}</h3>
            <p className="body-text text-dune/70 mb-6">
              {businessDescription}
            </p>
            <div className="flex gap-4">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center hover:bg-dusty-rose hover:text-white transition-all"
                  aria-label="Instagram"
                  onClick={() => trackSocialClick('instagram')}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center hover:bg-dusty-rose hover:text-white transition-all"
                  aria-label="Facebook"
                  onClick={() => trackSocialClick('facebook')}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="caption-bold text-dune mb-4">Services</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="caption text-dune/70 hover:text-dusty-rose transition-colors">
                  Classic Lashes
                </a>
              </li>
              <li>
                <a href="#" className="caption text-dune/70 hover:text-dusty-rose transition-colors">
                  Volume Lashes
                </a>
              </li>
              <li>
                <a href="#" className="caption text-dune/70 hover:text-dusty-rose transition-colors">
                  Hybrid Lashes
                </a>
              </li>
              <li>
                <a href="#" className="caption text-dune/70 hover:text-dusty-rose transition-colors">
                  Lash Lift & Tint
                </a>
              </li>
              <li>
                <a href="#" className="caption text-dune/70 hover:text-dusty-rose transition-colors">
                  Brow Services
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="caption-bold text-dune mb-4">Visit Us</h4>
            <address className="not-italic space-y-3" itemScope itemType="https://schema.org/LocalBusiness">
              <p className="caption text-dune/70">
                <span itemProp="streetAddress">{businessInfo.streetAddress}</span><br />
                <span itemProp="addressLocality">{businessInfo.city}</span>, <span itemProp="addressRegion">{businessInfo.state}</span> <span itemProp="postalCode">{businessInfo.postalCode}</span>
              </p>
              <p className="caption text-dune/70">
                <a href={`tel:${businessInfo.phone.replace(/\s/g, '')}`} itemProp="telephone" onClick={trackPhoneClick} className="hover:text-dusty-rose transition-colors">
                  {businessInfo.phone}
                </a>
              </p>
              <p className="caption text-dune/70">
                <a href={`mailto:${businessInfo.email}`} itemProp="email" onClick={trackEmailClick} className="hover:text-dusty-rose transition-colors">
                  {businessInfo.email}
                </a>
              </p>
            </address>
            <div className="mt-4">
              <p className="caption-bold text-dune mb-2">Hours</p>
              <p className="caption text-dune/70" style={{ whiteSpace: 'pre-line' }}>
                {formattedHours}
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="caption-bold text-dune mb-4">Stay Connected</h4>
            <p className="caption text-dune/70 mb-4">
              Subscribe for exclusive offers and beauty tips
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full px-4 py-2 bg-white border border-sage/20 rounded-lg focus:outline-none focus:border-dusty-rose transition-colors"
                required
              />
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: 'absolute', left: '-9999px' }}
                tabIndex={-1}
                autoComplete="off"
              />
              <button
                type="submit"
                className="w-full button-primary"
                disabled={isSubscribed}
              >
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Proudly Serving Section */}
        <motion.div
          className="pt-8 pb-8 border-t border-sage/10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="caption-bold text-dune text-center mb-3">Proudly Serving</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {serviceAreas.cities.map((area, index) => (
              <span key={area}>
                <span className="caption text-dune/60">{area}</span>
                {index < serviceAreas.cities.length - 1 && (
                  <span className="caption text-dune/60 ml-4">•</span>
                )}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          className="pt-8 border-t border-sage/10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="caption text-dune/60">
              © {new Date().getFullYear()} {businessInfo.name} | Award-Winning Lash Extensions in {businessInfo.city}, {businessInfo.state}
            </p>

            <div className="flex items-center gap-6">
              <a href="/privacy" className="caption text-dune/60 hover:text-dusty-rose transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="caption text-dune/60 hover:text-dusty-rose transition-colors">
                Terms of Service
              </a>
              <a href="/cancellation" className="caption text-dune/60 hover:text-dusty-rose transition-colors">
                Cancellation Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
