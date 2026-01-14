'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft } from 'lucide-react'
import { useServiceBrowser } from './ServiceBrowserContext'
import { BrowseView } from './views/BrowseView'
import { DetailView } from './views/DetailView'
import { BookingView } from './views/BookingView'
import { LashQuizPrompt } from './LashQuizPrompt'
import { FindYourLookModal } from '@/components/find-your-look/FindYourLookModal'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

// Desktop modal with scale animation
const modalVariantsDesktop = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
}

// Mobile modal slides up from bottom
const modalVariantsMobile = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
}

export function ServiceBrowserModal() {
  const { state, actions } = useServiceBrowser()
  const { isOpen, view, categoryName, selectedService, showLashQuizPrompt, showFindYourLookQuiz } = state
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle the lash quiz prompt "Take Quiz" action - opens the Find Your Look quiz
  const handleTakeQuiz = () => {
    actions.openFindYourLookQuiz()
  }

  // Handle quiz result
  const handleQuizBook = (lashStyle: string) => {
    actions.handleQuizResult(lashStyle)
  }

  // Get header title based on current view
  const getHeaderTitle = () => {
    if (view === 'booking') return `Book ${selectedService?.name || ''}`
    if (view === 'detail') return selectedService?.name || ''
    return categoryName || ''
  }

  // Handle back navigation based on current view
  const handleBack = () => {
    if (view === 'booking') {
      actions.closeBooking()
    } else {
      actions.goBack()
    }
  }

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'booking') {
          actions.closeBooking()
        } else if (view === 'detail') {
          actions.goBack()
        } else {
          actions.closeModal()
        }
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
  }, [isOpen, view, actions])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - hidden on mobile for fullscreen feel */}
          <motion.div
            key="service-browser-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 hidden md:block"
            onClick={actions.closeModal}
          />

          {/* Modal */}
          <motion.div
            key="service-browser-modal"
            variants={isMobile ? modalVariantsMobile : modalVariantsDesktop}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: isMobile ? 0.35 : 0.3,
              ease: isMobile ? [0.32, 0.72, 0, 1] : [0.4, 0, 0.2, 1]
            }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6 pointer-events-none"
          >
            <div
              className="relative w-full h-full md:w-[900px] md:h-[80vh] md:max-w-[90vw] bg-ivory md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
              style={isMobile ? {
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
              } : undefined}
            >
              {/* Mobile Header - Full-width with safe area support */}
              {isMobile ? (
                <div className="flex items-center justify-between px-4 py-3 border-b border-sage/10 shrink-0 bg-ivory/95 backdrop-blur-sm sticky top-0 z-10">
                  {/* Left side - Back button or spacer */}
                  <div className="w-10 flex justify-start">
                    <AnimatePresence mode="wait">
                      {(view === 'detail' || view === 'booking') && (
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          onClick={handleBack}
                          className="p-2 -ml-2 rounded-full hover:bg-sage/10 active:bg-sage/20 transition-colors"
                          aria-label="Go back"
                        >
                          <ChevronLeft className="w-5 h-5 text-dune" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Center - Title */}
                  <h2 className="flex-1 text-center text-base font-display font-medium text-charcoal truncate px-2">
                    {getHeaderTitle()}
                  </h2>

                  {/* Right side - Close button */}
                  <div className="w-10 flex justify-end">
                    <button
                      onClick={actions.closeModal}
                      className="p-2 -mr-2 rounded-full hover:bg-sage/10 active:bg-sage/20 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-dune" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Desktop Header */
                <div className="flex items-center justify-between px-6 py-4 border-b border-sage/10 shrink-0 bg-ivory">
                  <div className="flex items-center gap-2 min-w-0">
                    <AnimatePresence mode="wait">
                      {(view === 'detail' || view === 'booking') && (
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          onClick={handleBack}
                          className="p-2 -ml-2 rounded-full hover:bg-sage/10 transition-colors shrink-0"
                          aria-label="Go back"
                        >
                          <ChevronLeft className="w-5 h-5 text-dune" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <h2 className="text-xl font-display font-medium text-charcoal truncate">
                      {getHeaderTitle()}
                    </h2>
                  </div>
                  <button
                    onClick={actions.closeModal}
                    className="p-2 rounded-full hover:bg-sage/10 transition-colors shrink-0"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-dune" />
                  </button>
                </div>
              )}

              {/* Content with View Transitions */}
              <div
                className={`flex-1 min-h-0 relative ${view === 'booking' ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}
                style={isMobile ? {
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                } : undefined}
              >
                <AnimatePresence mode="wait">
                  {view === 'browse' && <BrowseView key="browse" />}
                  {view === 'detail' && <DetailView key="detail" />}
                  {view === 'booking' && selectedService && (
                    <BookingView key="booking" service={selectedService} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

        </>
      )}

      {/* Lash Quiz Prompt */}
      <LashQuizPrompt
        isOpen={showLashQuizPrompt}
        onTakeQuiz={handleTakeQuiz}
        onSkip={actions.confirmLashQuizSkip}
        onClose={actions.closeLashQuizPrompt}
      />

      {/* Find Your Look Quiz */}
      <FindYourLookModal
        isOpen={showFindYourLookQuiz}
        onClose={actions.closeFindYourLookQuiz}
        onBook={handleQuizBook}
      />
    </AnimatePresence>
  )
}
