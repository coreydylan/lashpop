'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, ArrowRight } from 'lucide-react'

const LASH_QUIZ_DISMISSED_KEY = 'lashpop_lash_quiz_dismissed'

interface LashQuizPromptProps {
  isOpen: boolean
  onTakeQuiz: () => void
  onSkip: () => void
  onClose: () => void
}

export function LashQuizPrompt({ isOpen, onTakeQuiz, onSkip, onClose }: LashQuizPromptProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleTakeQuiz = () => {
    markQuizPromptDismissed()
    onTakeQuiz()
  }

  const handleSkip = () => {
    markQuizPromptDismissed()
    onSkip()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md bg-ivory rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-sage/10 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-dune" />
              </button>

              {/* Content */}
              <div className="p-8 pt-12 text-center">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-dusty-rose/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-terracotta" />
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-display font-medium text-charcoal mb-3">
                  Find Your Perfect Lashes
                </h2>

                {/* Description */}
                <p className="text-dune/70 font-sans text-sm leading-relaxed mb-8">
                  Not sure which lash style is right for you? Take our quick quiz to get personalized recommendations based on your eye shape, lifestyle, and preferences.
                </p>

                {/* Buttons */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTakeQuiz}
                    className="w-full px-6 py-4 rounded-full font-sans font-medium text-base
                               bg-gradient-to-r from-terracotta to-terracotta/80
                               text-white shadow-lg hover:shadow-xl transition-shadow
                               flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Take the Lash Quiz
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSkip}
                    className="w-full px-6 py-4 rounded-full font-sans font-medium text-base
                               bg-white/60 text-dune border border-sage/20
                               hover:bg-white transition-colors
                               flex items-center justify-center gap-2"
                  >
                    I Know What I Want
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Utility functions for localStorage
export function hasSeenLashQuizPrompt(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(LASH_QUIZ_DISMISSED_KEY) === 'true'
}

export function markQuizPromptDismissed(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LASH_QUIZ_DISMISSED_KEY, 'true')
}

// For testing/development - reset the prompt
export function resetLashQuizPrompt(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LASH_QUIZ_DISMISSED_KEY)
}
