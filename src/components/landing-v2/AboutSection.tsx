"use client";

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { Palette, Sparkles, Heart } from 'lucide-react';
import { useRef } from 'react';

const values = [
  {
    icon: <Palette className="w-6 h-6" />,
    title: "Artistry",
    description: "Every lash is placed with meticulous care and artistic vision",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Precision",
    description: "Attention to detail that ensures perfect, long-lasting results",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Luxury",
    description: "Premium products and a relaxing, spa-like experience",
  },
];

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 lg:py-32 bg-gradient-to-b from-white to-[#F5F5F5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Elevate Your Beauty
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              At LashPop Studios, we believe in enhancing your natural beauty with precision,
              artistry, and uncompromising quality. Every visit is a luxurious experience
              tailored just for you.
            </p>
          </motion.div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  {/* Icon */}
                  <div className="w-14 h-14 bg-gradient-to-br from-[#C4A484] to-[#D4A574] rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                    {value.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>

                  {/* Decorative element */}
                  <div className="mt-6 h-1 w-12 bg-gradient-to-r from-[#C4A484] to-[#D4A574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: "500+", label: "Happy Clients" },
              { number: "10+", label: "Expert Artists" },
              { number: "5★", label: "Average Rating" },
              { number: "7", label: "Years Experience" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#C4A484] mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}