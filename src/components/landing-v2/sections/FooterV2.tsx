'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import {
  BusinessContactSettings,
  BusinessLocationSettings,
  BusinessHoursSettings,
  SocialMediaSettings,
  BrandingSettings,
  NavigationSettings,
  FooterSettings,
  defaultSiteSettings
} from '@/db/schema/site_settings'

interface FooterData {
  contact: BusinessContactSettings
  location: BusinessLocationSettings
  hours: BusinessHoursSettings
  social: SocialMediaSettings
  branding: BrandingSettings
  navigation: NavigationSettings
  footer: FooterSettings
}

export function FooterV2() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-10%" })
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Settings state - start with defaults, update from API
  const [data, setData] = useState<FooterData>({
    contact: defaultSiteSettings.business.contact,
    location: defaultSiteSettings.business.location,
    hours: defaultSiteSettings.business.hours,
    social: defaultSiteSettings.business.social,
    branding: defaultSiteSettings.branding,
    navigation: defaultSiteSettings.navigation,
    footer: defaultSiteSettings.footer
  })

  useEffect(() => {
    // Fetch settings from API
    fetch('/api/admin/website/site-settings')
      .then(res => res.json())
      .then(settings => {
        setData({
          contact: settings.business?.contact || defaultSiteSettings.business.contact,
          location: settings.business?.location || defaultSiteSettings.business.location,
          hours: settings.business?.hours || defaultSiteSettings.business.hours,
          social: settings.business?.social || defaultSiteSettings.business.social,
          branding: settings.branding || defaultSiteSettings.branding,
          navigation: settings.navigation || defaultSiteSettings.navigation,
          footer: settings.footer || defaultSiteSettings.footer
        })
      })
      .catch(err => console.error('Error fetching footer settings:', err))
  }, [])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // Handle newsletter subscription
      setIsSubscribed(true)
      setTimeout(() => {
        setEmail('')
        setIsSubscribed(false)
      }, 3000)
    }
  }

  // Get current year for copyright
  const currentYear = new Date().getFullYear()
  const copyrightText = data.footer.copyrightText.replace('{year}', currentYear.toString())

  // Filter enabled service links
  const enabledServiceLinks = data.navigation.footerServiceLinks.filter(link => link.enabled)

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
            <h3 className="heading-4 text-dune mb-4">{data.branding.companyName}</h3>
            <p className="body-text text-dune/70 mb-6">
              {data.branding.tagline}
            </p>
            <div className="flex gap-4">
              {data.social.instagram && (
                <a
                  href={data.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center hover:bg-dusty-rose hover:text-white transition-all"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                </a>
              )}
              {data.social.facebook && (
                <a
                  href={data.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center hover:bg-dusty-rose hover:text-white transition-all"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {data.social.tiktok && (
                <a
                  href={data.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center hover:bg-dusty-rose hover:text-white transition-all"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="caption-bold text-dune mb-4">Services</h4>
            <ul className="space-y-3">
              {enabledServiceLinks.map(link => (
                <li key={link.id}>
                  <a href={link.href} className="caption text-dune/70 hover:text-dusty-rose transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="caption-bold text-dune mb-4">Visit Us</h4>
            <address className="not-italic space-y-3">
              <p className="caption text-dune/70">
                {data.location.streetAddress}<br />
                {data.location.city}, {data.location.state} {data.location.zipCode}
              </p>
              <p className="caption text-dune/70">
                <a href={`tel:${data.contact.phone}`} className="hover:text-dusty-rose transition-colors">
                  {data.contact.phoneDisplay || data.contact.phone}
                </a>
              </p>
              <p className="caption text-dune/70">
                <a href={`mailto:${data.contact.email}`} className="hover:text-dusty-rose transition-colors">
                  {data.contact.email}
                </a>
              </p>
            </address>
            <div className="mt-4">
              <p className="caption-bold text-dune mb-2">Hours</p>
              <p className="caption text-dune/70">
                {data.hours.regularHours}<br />
                {data.hours.appointmentOnly && data.hours.specialNote}
              </p>
            </div>
          </div>

          {/* Newsletter */}
          {data.footer.showNewsletter && (
            <div>
              <h4 className="caption-bold text-dune mb-4">{data.footer.newsletterTitle}</h4>
              <p className="caption text-dune/70 mb-4">
                {data.footer.newsletterDescription}
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
                <button
                  type="submit"
                  className="w-full button-primary"
                  disabled={isSubscribed}
                >
                  {isSubscribed ? 'Subscribed!' : 'Subscribe'}
                </button>
              </form>
            </div>
          )}
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          className="pt-8 border-t border-sage/10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="caption text-dune/60">
              {copyrightText}
            </p>

            <div className="flex items-center gap-6">
              {data.footer.policyLinks?.privacyPolicy && (
                <a href={data.footer.policyLinks.privacyPolicy} className="caption text-dune/60 hover:text-dusty-rose transition-colors">
                  Privacy Policy
                </a>
              )}
              {data.footer.policyLinks?.termsOfService && (
                <a href={data.footer.policyLinks.termsOfService} className="caption text-dune/60 hover:text-dusty-rose transition-colors">
                  Terms of Service
                </a>
              )}
              {data.footer.policyLinks?.cancellationPolicy && (
                <a href={data.footer.policyLinks.cancellationPolicy} className="caption text-dune/60 hover:text-dusty-rose transition-colors">
                  Cancellation Policy
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
