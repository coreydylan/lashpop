'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, User, Mail, Check } from 'lucide-react';

export interface BookingConfirmationProps {
  serviceName?: string | null;
  providerName?: string | null;
  /** Unix epoch ms of the requested time slot, as sent by Vagaro */
  selectedTimeSlot?: number | null;
  /** Whether Vagaro reports a card on file (treated as confirmed vs. requested) */
  cardOnFile?: boolean;
  /** Close the modal/view entirely */
  onClose: () => void;
  /** Optional secondary action — book another service */
  onBookAnother?: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function BookingConfirmation({
  serviceName,
  providerName,
  selectedTimeSlot,
  cardOnFile,
  onClose,
  onBookAnother,
}: BookingConfirmationProps) {
  const hasTime = typeof selectedTimeSlot === 'number' && selectedTimeSlot > 0;
  const isConfirmed = cardOnFile === true;

  const headline = isConfirmed ? 'You’re booked' : 'Appointment requested';
  const subhead = isConfirmed
    ? 'See you soon — we can’t wait.'
    : 'We’ve received your request. Our team will confirm shortly.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ivory px-6 py-10 overflow-y-auto"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* Check mark badge */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center shadow-md mb-5"
        >
          <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
        </motion.div>

        {/* Headline */}
        <h2 className="text-2xl md:text-3xl font-display font-medium text-charcoal mb-2">
          {headline}
        </h2>
        <p className="text-sage text-sm md:text-base mb-6">{subhead}</p>

        {/* Appointment details card */}
        {(serviceName || providerName || hasTime) && (
          <div className="w-full bg-white/70 border border-sage/15 rounded-2xl p-5 mb-6 text-left space-y-3">
            {serviceName && (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-8 h-8 rounded-full bg-dusty-rose/15 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-terracotta" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-sage/80">Service</div>
                  <div className="text-charcoal font-medium truncate">{serviceName}</div>
                </div>
              </div>
            )}

            {providerName && (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-8 h-8 rounded-full bg-dusty-rose/15 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-terracotta" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-sage/80">With</div>
                  <div className="text-charcoal font-medium truncate">{providerName}</div>
                </div>
              </div>
            )}

            {hasTime && (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-8 h-8 rounded-full bg-dusty-rose/15 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-terracotta" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-sage/80">When</div>
                  <div className="text-charcoal font-medium">
                    {formatDate(selectedTimeSlot!)}
                  </div>
                  <div className="text-dune text-sm">{formatTime(selectedTimeSlot!)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email note */}
        <div className="flex items-center gap-2 text-sm text-dune/80 mb-6">
          <Mail className="w-4 h-4 text-sage" />
          <span>
            {isConfirmed
              ? 'A confirmation has been sent to your email.'
              : 'A request confirmation has been sent to your email.'}
          </span>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-dusty-rose to-terracotta text-white rounded-full font-medium hover:shadow-lg transition-shadow"
          >
            Done
          </button>
          {onBookAnother && (
            <button
              onClick={onBookAnother}
              className="flex-1 px-6 py-3 bg-white border border-sage/30 text-dune rounded-full font-medium hover:bg-sage/5 transition-colors"
            >
              Book another
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default BookingConfirmation;
