'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus } from 'lucide-react'
import { useAskLashpop } from '@/contexts/AskLashpopContext'
import { ChatInterface } from './ChatInterface'
import { InlineVagaroWidget } from './InlineVagaroWidget'
import { ContactForm } from './ContactForm'

/**
 * Desktop Floating Panel - Bottom right corner
 */
export function AskLashpopPanel() {
  const { state, close } = useAskLashpop()

  return (
    <AnimatePresence>
      {state.isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
          }}
          className="hidden md:flex fixed bottom-24 right-6 z-[100]
                     w-[400px] h-[600px] flex-col
                     bg-cream/95 backdrop-blur-xl
                     rounded-3xl shadow-2xl
                     border border-sage/10
                     overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-sage/10 bg-white/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center shadow-md">
                <span className="text-white text-lg">✨</span>
              </div>
              <div>
                <h2 className="font-medium text-dune">ASK LASHPOP</h2>
                <p className="text-xs text-dune/60 uppercase tracking-wider">AI Concierge</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <motion.button
                onClick={close}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-sage/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-dune/60" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {state.view === 'chat' && <ChatInterface />}
            {state.view === 'vagaro-widget' && <InlineVagaroWidget />}
            {state.view === 'contact-form' && <ContactForm />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
