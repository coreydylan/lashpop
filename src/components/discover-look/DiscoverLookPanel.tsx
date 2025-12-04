'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Minimize2 } from 'lucide-react'
import { useDiscoverLook } from '@/contexts/DiscoverLookContext'
import { DiscoveryChatInterface } from './DiscoveryChatInterface'
import { InlineBookingWidget } from './InlineBookingWidget'

/**
 * Desktop Floating Panel for Discover Your Look AI
 * Appears as a larger panel on desktop
 */
export function DiscoverLookPanel() {
  const { state, close } = useDiscoverLook()

  return (
    <AnimatePresence>
      {state.isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
          }}
          className="hidden md:flex fixed bottom-6 right-6 z-[100]
                     w-[440px] h-[620px] flex-col
                     bg-gradient-to-b from-cream to-white
                     rounded-2xl shadow-2xl
                     border border-sage/15
                     overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-sage/10 bg-white/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-dusty-rose via-terracotta to-golden flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-dune text-base">Discover Your Look</h2>
                <p className="text-[11px] text-dune/60 tracking-wide">AI-Powered Style Guide</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <motion.button
                onClick={close}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-sage/10 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-dune/60" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {state.view === 'chat' && <DiscoveryChatInterface />}
            {state.view === 'booking' && state.bookingService && (
              <InlineBookingWidget service={state.bookingService} />
            )}
          </div>

          {/* Footer with branding */}
          <div className="px-5 py-2 border-t border-sage/10 bg-white/50">
            <p className="text-[10px] text-dune/40 text-center tracking-wide">
              Powered by Lash Pop AI
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
