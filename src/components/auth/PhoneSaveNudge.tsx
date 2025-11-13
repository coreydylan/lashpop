'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { phoneNumberAuth } from '@/lib/auth-client';
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/phone-utils';
import { useUserKnowledge } from '@/contexts/UserKnowledgeContext';

interface PhoneSaveNudgeProps {
  onClose?: () => void;
  context?: string;
}

export function PhoneSaveNudge({ onClose, context = 'inline' }: PhoneSaveNudgeProps) {
  const { dismissSaveNudge } = useUserKnowledge();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDismiss = () => {
    dismissSaveNudge();
    onClose?.();
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!validatePhoneNumber(phone)) {
        throw new Error('Please enter a valid phone number');
      }

      await phoneNumberAuth.sendOtp({ phoneNumber: phone });
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await phoneNumberAuth.verifyOtp({
        phoneNumber: phone,
        otp: code
      });

      // Success - close the nudge
      onClose?.();
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative p-4 glass rounded-xl border border-warm-sand/30"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-sage hover:text-dune transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-6">
          <p className="text-sm text-sage mb-3">
            Enter the code we sent to {phone}
          </p>

          <form onSubmit={handleVerifyOTP} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 border border-warm-sand rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-terracotta focus:border-transparent bg-white/80"
              disabled={isLoading}
              autoFocus
            />

            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full bg-terracotta text-white py-2 rounded-lg text-sm font-medium hover:bg-dusty-rose disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Save My Preferences'}
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-xs text-sage hover:text-dune transition-colors"
            >
              Change number
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative p-4 glass rounded-xl border border-warm-sand/30"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-sage hover:text-dune transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="pr-6">
        <div className="flex items-start gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-dune">Save your preferences?</p>
            <p className="text-xs text-sage mt-0.5">
              We&apos;ll remember what you like for next time
            </p>
          </div>
        </div>

        <form onSubmit={handleSendOTP} className="space-y-3">
          <input
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value);
              setPhone(formatted);
            }}
            className="w-full px-3 py-2 border border-warm-sand rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent bg-white/80 text-sm"
            disabled={isLoading}
          />

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading || !phone}
              className="flex-1 bg-terracotta text-white py-2 rounded-lg text-sm font-medium hover:bg-dusty-rose disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 text-sm text-sage hover:text-dune transition-colors"
            >
              Maybe later
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
