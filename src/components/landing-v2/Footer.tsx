"use client";

import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter, Youtube, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-display font-semibold text-white mb-4">
              LashPop Studios
            </h3>
            <p className="text-gray-400 mb-4 font-sans font-light">
              Where artistry meets precision to create your signature lash look.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#cc947f] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#cc947f] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#cc947f] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#cc947f] transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-display font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-[#cc947f] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-[#cc947f] transition-colors">
                  Our Services
                </Link>
              </li>
              <li>
                <Link href="/team" className="hover:text-[#cc947f] transition-colors">
                  Meet the Team
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-[#cc947f] transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#cc947f] transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-display font-medium mb-4">Popular Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/services/classic" className="hover:text-[#cc947f] transition-colors">
                  Classic Lashes
                </Link>
              </li>
              <li>
                <Link href="/services/volume" className="hover:text-[#cc947f] transition-colors">
                  Volume Lashes
                </Link>
              </li>
              <li>
                <Link href="/services/mega" className="hover:text-[#cc947f] transition-colors">
                  Mega Volume
                </Link>
              </li>
              <li>
                <Link href="/services/lift" className="hover:text-[#cc947f] transition-colors">
                  Lash Lift & Tint
                </Link>
              </li>
              <li>
                <Link href="/services/removal" className="hover:text-[#cc947f] transition-colors">
                  Lash Removal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-display font-medium mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://maps.app.goo.gl/mozm5VjGqw8qCuzL8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#cc947f] transition-colors"
                >
                  429 S Coast Hwy<br />
                  Oceanside, CA 92054
                </a>
              </li>
              <li className="pt-2">
                <a href="tel:7602120448" className="hover:text-[#cc947f] transition-colors">
                  +1 (760) 212-0448
                </a>
              </li>
              <li>
                <a href="mailto:hello@lashpopstudios.com" className="hover:text-[#cc947f] transition-colors">
                  hello@lashpopstudios.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="py-8 border-t border-gray-800">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-display font-medium text-white mb-2">Stay Updated</h3>
            <p className="text-gray-400 mb-4 font-sans font-light">
              Get exclusive offers and lash care tips delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc947f] text-white placeholder-gray-500 font-sans font-light"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#cc947f] text-white rounded-lg font-sans font-medium uppercase tracking-wide hover:bg-[#d3a392] transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} LashPop Studios. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-[#cc947f] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#cc947f] transition-colors">
                Terms of Service
              </Link>
              <Link href="/cancellation" className="hover:text-[#cc947f] transition-colors">
                Cancellation Policy
              </Link>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> in LA
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}