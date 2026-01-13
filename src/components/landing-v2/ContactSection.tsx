"use client";

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Calendar, ArrowRight } from 'lucide-react';
import { useRef } from 'react';

export default function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // This triggers services drawer to dock when scrolling past
  return (
    <section ref={ref} id="services-trigger" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-sans font-semibold tracking-wide uppercase text-gray-900 mb-6">
              Visit Our Studio
            </h2>
            <p className="text-lg md:text-xl font-sans font-light text-gray-600 max-w-3xl mx-auto">
              Experience luxury lash services in the heart of Los Angeles.
              Book your appointment today and discover your perfect look.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#C4A484]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[#C4A484]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-medium text-gray-900 mb-1">Location</h3>
                    <p className="font-sans font-light text-gray-600">
                      429 S Coast Hwy<br />
                      Oceanside, CA 92054
                    </p>
                    <button className="font-sans font-normal text-[#C4A484] hover:text-[#D4A574] text-sm mt-2 flex items-center gap-1">
                      Get Directions
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#C4A484]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-[#C4A484]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-medium text-gray-900 mb-1">Phone</h3>
                    <p className="font-sans font-light text-gray-600">+1 (760) 212-0448</p>
                    <p className="font-sans font-light text-sm text-gray-500 mt-1">Text or call for appointments</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#C4A484]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-[#C4A484]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-medium text-gray-900 mb-1">Email</h3>
                    <p className="font-sans font-light text-gray-600">hello@lashpopstudios.com</p>
                    <p className="font-sans font-light text-sm text-gray-500 mt-1">We respond within 24 hours</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#C4A484]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-[#C4A484]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-medium text-gray-900 mb-2">Hours</h3>
                    <div className="space-y-1 font-sans font-light text-gray-600">
                      <div className="flex justify-between">
                        <span>Every Day</span>
                        <span className="font-normal">8:00 AM - 7:30 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="italic">By appointment only</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Booking Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="bg-gradient-to-br from-[#C4A484] to-[#D4A574] rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-sans font-semibold mb-4">Ready to Book?</h3>
                <p className="font-sans font-light text-white/90 mb-6">
                  Join hundreds of satisfied clients who trust us with their lash care.
                  Book your appointment online or give us a call.
                </p>

                <div className="space-y-4">
                  <button className="w-full py-4 bg-white text-[#C4A484] rounded-lg font-sans font-medium uppercase tracking-wide hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Book Online Now
                  </button>

                  <button className="w-full py-4 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 rounded-lg font-sans font-medium uppercase tracking-wide hover:bg-white/30 transition-colors">
                    Call to Schedule
                  </button>
                </div>

                <div className="mt-8 pt-8 border-t border-white/20">
                  <h4 className="font-sans font-medium mb-3">New Client Special</h4>
                  <p className="font-sans font-light text-white/90 text-sm mb-3">
                    Get 20% off your first full set when you book this week!
                  </p>
                  <p className="font-sans font-light text-xs text-white/70">
                    *Terms and conditions apply. Cannot be combined with other offers.
                  </p>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="mt-8 bg-gray-100 rounded-2xl h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="font-sans font-light text-gray-600">Interactive map coming soon</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { label: 'Licensed & Insured', value: '✓' },
              { label: 'Sanitized Studio', value: '✓' },
              { label: 'Certified Artists', value: '✓' },
              { label: 'Premium Products', value: '✓' },
            ].map((badge) => (
              <div key={badge.label} className="group">
                <div className="w-16 h-16 bg-[#C4A484]/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#C4A484]/20 transition-colors">
                  <span className="text-2xl text-[#C4A484]">{badge.value}</span>
                </div>
                <p className="font-sans font-light text-sm text-gray-600">{badge.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}