'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { useDiscoverLook } from '@/contexts/DiscoverLookContext'
import { DiscoveryChatInterface } from './DiscoveryChatInterface'
import { InlineBookingWidget } from './InlineBookingWidget'

/**
 * Mobile Full-Screen Sheet for Discover Your Look AI
 * Slides up from bottom on mobile devices
 */
export function DiscoverLookSheet() {
  const { state, close } = useDiscoverLook()

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-[101] md:hidden
                       bg-gradient-to-b from-cream to-white
                       rounded-t-3xl shadow-2xl
                       border-t border-sage/10"
            style={{
              height: 'calc(100vh - 60px)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-sage/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-sage/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dusty-rose via-terracotta to-golden flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-dune text-base">Discover Your Look</h2>
                  <p className="text-[11px] text-dune/60 tracking-wide">AI Style Guide</p>
                </div>
              </div>
              <motion.button
                onClick={close}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-full hover:bg-sage/10 transition-colors"
              >
                <X className="w-5 h-5 text-dune/60" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="h-[calc(100%-80px)] overflow-hidden">
              {state.view === 'chat' && <DiscoveryChatInterface />}
              {state.view === 'booking' && state.bookingService && (
                <InlineBookingWidget service={state.bookingService} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
