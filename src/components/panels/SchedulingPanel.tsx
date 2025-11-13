"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, Calendar, Clock, User, Loader2 } from 'lucide-react';
import { VagaroBookingWidget } from '@/components/VagaroBookingWidget';

interface Service {
  id: string;
  name: string;
  vagaroServiceId: string | null;
  durationMinutes: number;
  priceStarting: number;
}

interface TeamMember {
  id: string;
  name: string;
  vagaroEmployeeId: string | null;
  role: string;
  imageUrl: string;
}

interface SchedulingPanelProps {
  service: Service;
  selectedProviders: TeamMember[];
  onClose: () => void;
  onBack: () => void;
}

export default function SchedulingPanel({
  service,
  selectedProviders,
  onClose,
  onBack,
}: SchedulingPanelProps) {
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Get business ID from environment
  const businessId = process.env.NEXT_PUBLIC_VAGARO_BUSINESS_ID;

  // For simplicity, use the first selected provider
  // TODO: Support multiple provider scheduling comparison
  const primaryProvider = selectedProviders[0];

  // Simulate widget load detection
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWidgetLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Listen for booking completion
  // TODO: Implement actual event listener for widget completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Vagaro widget might post messages when booking completes
      if (event.data?.type === 'vagaro-booking-complete') {
        setBookingComplete(true);
        // TODO: Trigger polling to fetch the new appointment
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const priceDisplay = `$${(service.priceStarting / 100).toFixed(0)}+`;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[110] bg-cream overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-md border-b border-sage/10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-dune hover:text-sage transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Service</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-sage/10 transition-colors"
              >
                <X className="w-5 h-5 text-dune" />
              </button>
            </div>

            {/* Booking Summary */}
            <div className="flex items-center gap-4 py-3 px-4 rounded-xl bg-gradient-to-r from-sage/5 to-ocean-mist/5">
              <div className="flex-1">
                <p className="text-sm text-dune/60">Booking</p>
                <p className="font-medium text-dune">{service.name}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-dune/70">
                  <User className="w-4 h-4" />
                  <span>{primaryProvider?.name || 'Any artist'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-dune/70">
                  <Clock className="w-4 h-4" />
                  <span>{service.durationMinutes} min</span>
                </div>
                <div className="font-medium text-terracotta">
                  {priceDisplay}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Calendar className="w-12 h-12 text-sage mx-auto mb-3" />
              <h1 className="text-3xl font-light text-dune mb-2">
                Choose Your Time
              </h1>
              <p className="text-dune/60">
                Select your preferred date and time below
              </p>
            </div>

            {/* Widget Container */}
            <div className="relative">
              {/* Loading Overlay */}
              {!isWidgetLoaded && (
                <div className="absolute inset-0 z-10 glass rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-3" />
                    <p className="text-sm text-dune/60">Loading scheduling...</p>
                  </div>
                </div>
              )}

              {/* Vagaro Widget */}
              <div className="glass rounded-2xl overflow-hidden shadow-lg">
                <VagaroBookingWidget
                  businessId={businessId}
                  serviceId={service.vagaroServiceId || undefined}
                  employeeId={primaryProvider?.vagaroEmployeeId || undefined}
                  className="min-h-[600px]"
                />
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="glass rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-5 h-5 text-sage" />
                </div>
                <h3 className="font-medium text-dune text-sm mb-1">
                  Real-time Availability
                </h3>
                <p className="text-xs text-dune/60">
                  See live availability for {primaryProvider?.name.split(' ')[0] || 'all artists'}
                </p>
              </div>

              <div className="glass rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-ocean-mist/10 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-ocean-mist" />
                </div>
                <h3 className="font-medium text-dune text-sm mb-1">
                  Instant Confirmation
                </h3>
                <p className="text-xs text-dune/60">
                  Get confirmed immediately upon booking
                </p>
              </div>

              <div className="glass rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center mx-auto mb-2">
                  <User className="w-5 h-5 text-terracotta" />
                </div>
                <h3 className="font-medium text-dune text-sm mb-1">
                  Secure Payment
                </h3>
                <p className="text-xs text-dune/60">
                  Safe and encrypted payment processing
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-6 rounded-xl bg-sage/5 border border-sage/10">
              <h3 className="font-medium text-dune mb-2">Before you book</h3>
              <ul className="space-y-2 text-sm text-dune/70">
                <li className="flex items-start gap-2">
                  <span className="text-sage mt-0.5">•</span>
                  <span>Please arrive 10 minutes before your appointment time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sage mt-0.5">•</span>
                  <span>Cancellations must be made at least 24 hours in advance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sage mt-0.5">•</span>
                  <span>First-time clients may need to arrive 15 minutes early for consultation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
