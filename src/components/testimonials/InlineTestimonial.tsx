'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineTestimonialProps {
  quote: string;
  name: string;
  service?: string;
  rating?: number;
  className?: string;
}

export default function InlineTestimonial({
  quote,
  name,
  service,
  rating,
  className,
}: InlineTestimonialProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'relative rounded-xl bg-white/50 backdrop-blur-sm border border-warm-sand/30',
        'p-4 shadow-sm hover:shadow-md transition-shadow duration-300',
        className
      )}
    >
      {/* Quote Icon */}
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-golden to-dusty-rose rounded-full flex items-center justify-center opacity-80">
        <Quote className="w-4 h-4 text-white" />
      </div>

      {/* Star Rating */}
      {rating && rating > 0 && (
        <div className="flex gap-0.5 mb-2">
          {[...Array(rating)].map((_, i) => (
            <Star
              key={i}
              className="w-3.5 h-3.5 fill-golden text-golden"
            />
          ))}
        </div>
      )}

      {/* Quote Text */}
      <p className="text-sm text-dune italic leading-relaxed mb-3">
        &ldquo;{quote}&rdquo;
      </p>

      {/* Name and Service */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-dune">{name}</p>
          {service && (
            <p className="text-xs text-dusty-rose mt-0.5">{service}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
