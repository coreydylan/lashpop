'use client'

import { useRef, useState } from 'react'

export function FooterV2() {
  const ref = useRef(null)
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

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

  return (
    <footer ref={ref} className="bg-ivory pt-20 pb-8">
      <div className="container">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div>
            <h3 className="heading-4 mb-4" style={{ color: '#ac4d3c' }}>LashPop Studios</h3>
            <p className="body-text text-charcoal mb-6">
              Effortless beauty for the modern woman.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/lashpopstudios"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center hover:bg-terracotta hover:text-white transition-all"
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
                className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center hover:bg-terracotta hover:text-white transition-all"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="caption-bold text-charcoal mb-4">Services</h4>
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
              <li className="pt-2 border-t border-sage/10">
                <a href="/work-with-us" className="caption text-terracotta hover:text-rust transition-colors font-medium">
                  Work With Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="caption-bold text-charcoal mb-4">Visit Us</h4>
            <address className="not-italic space-y-3">
              <p className="caption text-charcoal">
                429 S Coast Hwy<br />
                Oceanside, CA 92054
              </p>
              <p className="caption text-charcoal">
                <a href="tel:+17602120448" className="hover:text-terracotta transition-colors">
                  +1 (760) 212-0448
                </a>
              </p>
              <p className="caption text-charcoal">
                <a href="mailto:lashpopstudios@gmail.com" className="hover:text-terracotta transition-colors">
                  lashpopstudios@gmail.com
                </a>
              </p>
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
            <h4 className="caption-bold text-charcoal mb-4">Stay Connected</h4>
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
                className="w-full button-primary"
                disabled={isSubscribed}
              >
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-sage/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="caption text-charcoal">
              © 2025 LashPop Studios. All rights reserved.
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
