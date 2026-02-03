'use client'

import { useRef, useState } from 'react'
import { subscribeToNewsletter } from '@/app/actions/newsletter'

export function FooterV2() {
  const ref = useRef(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const currentYear = new Date().getFullYear()

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    const result = await subscribeToNewsletter(email)

    if (result.success) {
      setStatus('success')
      setMessage(result.message)
      setTimeout(() => {
        setEmail('')
        setStatus('idle')
        setMessage('')
      }, 3000)
    } else {
      setStatus('error')
      setMessage(result.message)
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)
    }
  }

  return (
    <footer ref={ref} className="bg-ivory pt-20 pb-8">
      <div className="container">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-20 mb-16">
          {/* Brand Column */}
          <div>
            <h3 className="heading-4 mb-4" style={{ color: '#ac4d3c' }}>LashPop Studios</h3>
            <p className="body-text text-charcoal mb-6">
              Effortless beauty for the modern woman.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://instagram.com/lashpopstudios"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dusty-rose/20 rounded-full flex items-center justify-center hover:bg-terracotta hover:text-white transition-all"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com/lashpopstudios"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dusty-rose/20 rounded-full flex items-center justify-center hover:bg-terracotta hover:text-white transition-all"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com/@lashpopstudios_"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dusty-rose/20 rounded-full flex items-center justify-center hover:bg-terracotta hover:text-white transition-all"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
              </a>
              <a
                href="https://www.yelp.com/biz/lashpop-studios-oceanside"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dusty-rose/20 rounded-full flex items-center justify-center hover:bg-terracotta hover:text-white transition-all"
                aria-label="Yelp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 384 512">
                  <path d="M42.9 240.32l99.62 48.61c19.2 9.4 16.2 37.51-4.5 42.71L30.5 358.45a22.79 22.79 0 0 1-28.21-19.6 197.16 197.16 0 0 1 9-85.32 22.8 22.8 0 0 1 31.61-13.21zm44 239.25a199.45 199.45 0 0 0 79.42 32.11A22.78 22.78 0 0 0 192.94 490l3.9-110.82c.7-21.3-25.5-31.91-39.81-16.1l-74.21 82.4a22.82 22.82 0 0 0 4.09 34.09zm145.34-109.92l58.81 94a22.93 22.93 0 0 0 34 5.5 198.36 198.36 0 0 0 52.71-67.61A23 23 0 0 0 364.17 370l-105.42-34.26c-20.31-6.5-37.81 15.8-26.51 33.91zm148.33-132.23a197.44 197.44 0 0 0-50.41-69.31 22.85 22.85 0 0 0-34 4.4l-62 91.92c-11.9 17.7 4.7 40.61 25.2 34.71L366 268.63a22.9 22.9 0 0 0 14.61-31.21zM62.11 30.18a22.86 22.86 0 0 0-9.9 32l104.12 180.44c11.7 20.2 42.61 11.9 42.61-11.4V22.88a22.67 22.67 0 0 0-24.5-22.8 320.37 320.37 0 0 0-112.33 30.1z"/>
                </svg>
              </a>
              <a
                href="https://maps.app.goo.gl/mozm5VjGqw8qCuzL8"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dusty-rose/20 rounded-full flex items-center justify-center hover:bg-terracotta hover:text-white transition-all"
                aria-label="Google"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </a>
              <a
                href="https://www.vagaro.com/lashpop32"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dusty-rose/20 rounded-full flex items-center justify-center hover:bg-terracotta hover:text-white transition-all overflow-hidden group"
                aria-label="Vagaro"
              >
                <img
                  src="/lashpop-images/Vagaro_Logo.png"
                  alt="Vagaro"
                  className="w-6 h-6 object-contain brightness-0 group-hover:brightness-0 group-hover:invert"
                />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg text-charcoal mb-4">Services</h4>
            <ul className="space-y-3">
              <li>
                <a href="#services" className="caption text-charcoal hover:text-terracotta transition-colors">
                  Lashes
                </a>
              </li>
              <li>
                <a href="#services" className="caption text-charcoal hover:text-terracotta transition-colors">
                  Brows
                </a>
              </li>
              <li>
                <a href="#services" className="caption text-charcoal hover:text-terracotta transition-colors">
                  Skincare
                </a>
              </li>
              <li>
                <a href="#services" className="caption text-charcoal hover:text-terracotta transition-colors">
                  Waxing
                </a>
              </li>
              <li>
                <a href="#services" className="caption text-charcoal hover:text-terracotta transition-colors">
                  Permanent Makeup
                </a>
              </li>
              <li>
                <a href="#services" className="caption text-charcoal hover:text-terracotta transition-colors">
                  Permanent Jewelry
                </a>
              </li>
              <li>
                <a href="#services" className="caption text-charcoal hover:text-terracotta transition-colors">
                  Botox
                </a>
              </li>
              <li>
                <a
                  href="/work-with-us"
                  className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 text-terracotta hover:bg-terracotta hover:text-cream"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgb(var(--terracotta))',
                  }}
                >
                  Work With Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-serif text-lg text-charcoal mb-4">Visit Us</h4>
            <address className="not-italic space-y-4">
              <a
                href="https://maps.app.goo.gl/mozm5VjGqw8qCuzL8"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 caption text-charcoal hover:text-terracotta transition-colors"
              >
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>429 S Coast Hwy<br />Oceanside, CA 92054</span>
              </a>
              <a
                href="tel:+17602120448"
                className="flex items-center gap-3 caption text-charcoal hover:text-terracotta transition-colors"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>(760) 212-0448</span>
              </a>
              <a
                href="sms:+17602120448"
                className="flex items-center gap-3 caption text-charcoal hover:text-terracotta transition-colors"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Text us</span>
              </a>
              <a
                href="mailto:lashpopstudios@gmail.com"
                className="flex items-center gap-3 caption text-charcoal hover:text-terracotta transition-colors"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>lashpopstudios@gmail.com</span>
              </a>
            </address>
            <div className="mt-4">
              <p className="caption-bold text-charcoal mb-2">Hours</p>
              <p className="caption text-charcoal">
                8a-7:30p every day<br />
                by appointment only
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-serif text-lg text-charcoal mb-4">Stay Connected</h4>
            <p className="caption text-charcoal mb-4">
              Subscribe for exclusive offers and beauty tips
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full px-4 py-2 bg-white border border-sage/20 rounded-lg focus:outline-none focus:border-terracotta transition-colors"
                required
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-medium transition-all duration-300 text-terracotta hover:bg-terracotta hover:text-cream disabled:opacity-50"
                style={{
                  background: 'transparent',
                  border: '1px solid rgb(var(--terracotta))',
                }}
                disabled={status === 'loading' || status === 'success'}
              >
                {status === 'loading' ? 'Subscribing...' : status === 'success' ? message : status === 'error' ? message : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-sage/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="caption text-charcoal">
              © {currentYear} LashPop Studios. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <a href="#" className="caption text-charcoal hover:text-terracotta transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="caption text-charcoal hover:text-terracotta transition-colors">
                Terms of Service
              </a>
              <a href="#" className="caption text-charcoal hover:text-terracotta transition-colors">
                Cancellation Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
