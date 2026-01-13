'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, ChevronLeft, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { AssetWithTags } from '@/actions/dam';

interface ServiceDetailClientProps {
  service: {
    id: string;
    name: string;
    slug: string;
    subtitle: string | null;
    description: string | null;
    durationMinutes: number;
    priceStarting: number;
    imageUrl: string | null;
    color: string | null;
    categoryId: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    subcategoryId: string | null;
    subcategoryName: string | null;
    subcategorySlug: string | null;
    vagaroWidgetUrl: string | null;
    vagaroServiceCode: string | null;
    vagaroServiceId: string | null;
  };
  gallery: AssetWithTags[];
}

// Base Vagaro booking URL for Lash Pop
const VAGARO_BASE_BOOKING_URL = 'https://www.vagaro.com/lashpop32';

export function ServiceDetailClient({ service, gallery }: ServiceDetailClientProps) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const priceDisplay = `$${(service.priceStarting / 100).toFixed(0)}+`;
  const visiblePhotos = showAllPhotos ? gallery : gallery.slice(0, 8);

  // Generate Vagaro booking URL
  // If service has a specific Vagaro service ID, we could append it to filter
  // For now, just use the base booking URL
  const getBookingUrl = () => {
    // If service has vagaroServiceId, we can try to construct a filtered URL
    // Vagaro URL pattern for specific service: https://www.vagaro.com/lashpop32/services?sId=SERVICE_ID
    if (service.vagaroServiceId) {
      return `${VAGARO_BASE_BOOKING_URL}?sId=${service.vagaroServiceId}`;
    }
    return VAGARO_BASE_BOOKING_URL;
  };

  const handleContinueToBook = () => {
    window.open(getBookingUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] bg-warm-sand/20">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-dusty-rose/20 to-warm-sand/30" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm text-dune text-sm font-medium shadow-lg hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Content */}
      <div className="relative -mt-20 pb-32">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          {/* Service Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-6 md:p-8"
          >
            {/* Category badge */}
            {service.categoryName && (
              <span className="inline-block px-3 py-1 rounded-full bg-dusty-rose/10 text-dusty-rose text-xs font-medium mb-4">
                {service.categoryName}
              </span>
            )}

            {/* Title & Subtitle */}
            <h1 className="text-2xl md:text-3xl font-semibold text-dune mb-2">
              {service.name}
            </h1>
            {service.subtitle && (
              <p className="text-sage text-base md:text-lg mb-6">
                {service.subtitle}
              </p>
            )}

            {/* Quick Stats */}
            <div className="flex items-center gap-6 py-4 border-y border-sage/10 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sage" />
                <span className="text-sm font-medium text-dune">{service.durationMinutes} min</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-terracotta" />
                <span className="text-sm font-medium text-dune">From {priceDisplay}</span>
              </div>
            </div>

            {/* Description */}
            {service.description && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-dune uppercase tracking-wide mb-3">About This Service</h2>
                <p className="text-dune/80 leading-relaxed">
                  {service.description}
                </p>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-dune uppercase tracking-wide mb-4">Our Work</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {visiblePhotos.map((asset, i) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                    >
                      <Image
                        src={asset.filePath}
                        alt={asset.fileName}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                    </motion.div>
                  ))}
                </div>

                {gallery.length > 8 && (
                  <button
                    onClick={() => setShowAllPhotos(!showAllPhotos)}
                    className="mt-4 text-sm text-dusty-rose font-medium hover:text-terracotta transition-colors"
                  >
                    {showAllPhotos ? 'Show Less' : `View All ${gallery.length} Photos`}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-ivory via-ivory to-transparent pt-8">
        <div className="max-w-3xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinueToBook}
            className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white font-medium shadow-lg hover:shadow-xl transition-all text-base flex items-center justify-center gap-2"
          >
            Continue to Book
            <ExternalLink className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
