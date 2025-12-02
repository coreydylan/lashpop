'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAskLashpop } from '@/contexts/AskLashpopContext'
import { ChatInterface } from './ChatInterface'
import { InlineVagaroWidget } from './InlineVagaroWidget'
import { ContactForm } from './ContactForm'

/**
 * Mobile Top Sheet - Slides down from header on mobile
 */
export function AskLashpopSheet() {
  const { state, close } = useAskLashpop()

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
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed top-0 left-0 right-0 z-[101] md:hidden
                       bg-cream/95 backdrop-blur-xl
                       rounded-b-3xl shadow-2xl
                       border-b border-sage/10"
            style={{
              maxHeight: 'calc(100vh - 60px)',
              paddingTop: 'env(safe-area-inset-top)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-sage/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center">
                  <span className="text-white text-sm">✨</span>
                </div>
                <div>
                  <h2 className="font-medium text-dune text-sm">ASK LASHPOP</h2>
                  <p className="text-[10px] text-dune/60 uppercase tracking-wider">AI Concierge</p>
                </div>
              </div>
              <motion.button
                onClick={close}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-sage/10 transition-colors"
              >
                <X className="w-5 h-5 text-dune/60" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="h-[70vh] overflow-hidden">
              {state.view === 'chat' && <ChatInterface />}
              {state.view === 'vagaro-widget' && <InlineVagaroWidget />}
              {state.view === 'contact-form' && <ContactForm />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
