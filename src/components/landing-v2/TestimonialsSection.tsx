"use client";

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useRef } from 'react';

const testimonials = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    rating: 5,
    date: '2 weeks ago',
    review: "Best lash experience ever! The team is so professional and talented. My lashes look absolutely stunning and have lasted so well. The studio is beautiful and relaxing. I won't go anywhere else!",
    service: 'Volume Full Set',
    artist: 'Maya Rodriguez',
  },
  {
    id: '2',
    name: 'Jessica Liu',
    rating: 5,
    date: '1 month ago',
    review: "My lashes look amazing and last so long. I'm obsessed! Sofia did an incredible job understanding exactly what I wanted. The attention to detail is unmatched. Highly recommend!",
    service: 'Classic Full Set',
    artist: 'Sofia Chen',
  },
  {
    id: '3',
    name: 'Amy Richardson',
    rating: 5,
    date: '1 month ago',
    review: "The team here is incredible! They really take the time to understand what you want and deliver beyond expectations. The quality is outstanding and the experience is so relaxing.",
    service: 'Mega Volume',
    artist: 'Luna Park',
  },
];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 lg:py-32 bg-gradient-to-b from-[#F5F5F5] to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
              What Our Clients Say
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Don&apos;t just take our word for it – hear from our amazing clients
              about their LashPop experience.
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative">
                  {/* Quote Icon */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-[#C4A484] to-[#D4A574] rounded-full flex items-center justify-center text-white opacity-20 group-hover:opacity-100 transition-opacity">
                    <Quote className="w-6 h-6" />
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Review */}
                  <p className="text-gray-700 leading-relaxed mb-6 italic">
                    &ldquo;{testimonial.review}&rdquo;
                  </p>

                  {/* Service Info */}
                  <div className="mb-4">
                    <span className="text-sm px-3 py-1 bg-[#C4A484]/10 text-[#C4A484] rounded-full">
                      {testimonial.service}
                    </span>
                    <p className="text-sm text-gray-500 mt-2">
                      Artist: {testimonial.artist}
                    </p>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.date}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-[#C4A484] to-[#D4A574] rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 bg-gradient-to-r from-[#C4A484] to-[#D4A574] rounded-2xl p-8 text-white"
          >
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">500+</div>
                <div className="text-white/90">Five-Star Reviews</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">98%</div>
                <div className="text-white/90">Client Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">85%</div>
                <div className="text-white/90">Return Clients</div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mt-12"
          >
            <button className="px-8 py-3 bg-[#C4A484] text-white rounded-lg font-semibold hover:bg-[#D4A574] transition-all hover:scale-105 hover:shadow-xl">
              Read More Reviews
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}