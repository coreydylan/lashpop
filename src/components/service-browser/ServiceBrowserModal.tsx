'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft } from 'lucide-react'
import { useServiceBrowser } from './ServiceBrowserContext'
import { BrowseView } from './views/BrowseView'
import { DetailView } from './views/DetailView'
import { BookingView } from './views/BookingView'
import { LashQuizPrompt } from './LashQuizPrompt'
import { FindYourLookModal, FindYourLookContent, type FindYourLookContentRef } from '@/components/find-your-look/FindYourLookModal'

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
  const { isOpen, view, categoryName, selectedService, showLashQuizPrompt, showFindYourLookQuiz, isMorphingQuiz, morphTargetSubcategory } = state
  const [isMobile, setIsMobile] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const quizContentRef = useRef<FindYourLookContentRef>(null)

  // Track quiz step for header updates (since refs don't trigger re-renders)
  const [quizStep, setQuizStep] = useState(0)
  const [quizHeaderTitle, setQuizHeaderTitle] = useState('Find Your Look')

  // Track if we're in the morphing animation phase
  const isMorphing = isMorphingQuiz && morphTargetSubcategory !== null

  // Track if layout animation has settled (to prevent scrollbar flash)
  const [layoutSettled, setLayoutSettled] = useState(true)

  // Reset layout settled when morphing starts
  useEffect(() => {
    if (isMorphing) {
      setLayoutSettled(false)
    }
  }, [isMorphing])

  // Reset quiz state when modal closes or leaves morphing mode
  useEffect(() => {
    if (!isOpen || !isMorphingQuiz) {
      setQuizStep(0)
      setQuizHeaderTitle('Find Your Look')
    }
  }, [isOpen, isMorphingQuiz])

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Prevent scroll passthrough on mobile when in booking view
  // The iframe handles its own scrolling, so we block touch events on the container
  useEffect(() => {
    if (!isMobile || view !== 'booking' || !isOpen) return

    const container = contentRef.current
    if (!container) return

    const handleTouchMove = (e: TouchEvent) => {
      // Only prevent default if the touch is not on the iframe
      // This prevents the background from scrolling while allowing iframe scroll
      const target = e.target as HTMLElement
      if (target.tagName !== 'IFRAME') {
        e.preventDefault()
      }
    }

    // Use passive: false to allow preventDefault
    container.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      container.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isMobile, view, isOpen])

  // When morphing starts, wait for animation then complete
  useEffect(() => {
    if (isMorphing) {
      // Wait for the expand animation to complete, then switch content
      const timer = setTimeout(() => {
        actions.completeMorph()
      }, 650) // Match the smoother spring animation duration
      return () => clearTimeout(timer)
    }
  }, [isMorphing, actions])

  // Handle the lash quiz prompt "Take Quiz" action - opens the Find Your Look quiz
  const handleTakeQuiz = () => {
    actions.openFindYourLookQuiz()
  }

  // Handle quiz result - triggers morph animation
  const handleQuizBook = (lashStyle: string) => {
    actions.handleQuizResult(lashStyle)
  }

  // Handle quiz step changes
  const handleQuizStepChange = useCallback((step: number, headerTitle: string) => {
    setQuizStep(step)
    setQuizHeaderTitle(headerTitle)
  }, [])

  // Get header title based on current view
  const getHeaderTitle = () => {
    // When showing quiz content
    if (isMorphingQuiz && !isMorphing) {
      return quizHeaderTitle
    }
    if (view === 'booking') return `Book ${selectedService?.name || ''}`
    if (view === 'detail') return selectedService?.name || ''
    return categoryName || ''
  }

  // Handle back navigation based on current view
  const handleBack = () => {
    // If in quiz mode, delegate to quiz
    if (isMorphingQuiz && !isMorphing && quizStep > 0) {
      quizContentRef.current?.handleBack()
      return
    }
    if (view === 'booking') {
      actions.closeBooking()
    } else {
      actions.goBack()
    }
  }

  // Check if back button should be shown
  const showBackButton = () => {
    if (isMorphingQuiz && !isMorphing) {
      return quizStep > 0
    }
    return view === 'detail' || view === 'booking'
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
    <>
      {/* Service Browser Modal */}
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
              <motion.div
                className={`relative bg-ivory md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col ${
                  isMobile
                    ? 'w-full h-full'
                    : isMorphingQuiz && !isMorphing
                      ? 'w-[480px] max-w-[90vw]'
                      : 'w-[900px] max-w-[90vw] h-[80vh] max-h-[90vh]'
                }`}
                onClick={(e) => e.stopPropagation()}
                style={isMobile ? {
                  paddingTop: 'env(safe-area-inset-top)',
                  paddingBottom: 'env(safe-area-inset-bottom)'
                } : undefined}
                layout
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: 180,
                    damping: 28,
                    mass: 1,
                  }
                }}
                onLayoutAnimationComplete={() => setLayoutSettled(true)}
              >
                {/* Mobile Header - Full-width with safe area support */}
                {isMobile ? (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-sage/10 shrink-0 bg-ivory/95 backdrop-blur-sm sticky top-0 z-10">
                    {/* Left side - Back button or spacer */}
                    <div className="w-10 flex justify-start">
                      {showBackButton() && (
                        <motion.button
                          key="mobile-back-btn"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15 }}
                          onClick={handleBack}
                          className="p-2 -ml-2 rounded-full hover:bg-sage/10 active:bg-sage/20 transition-colors"
                          aria-label="Go back"
                        >
                          <ChevronLeft className="w-5 h-5 text-dune" />
                        </motion.button>
                      )}
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
                      {showBackButton() && (
                        <motion.button
                          key="desktop-back-btn"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15 }}
                          onClick={handleBack}
                          className="p-2 -ml-2 rounded-full hover:bg-sage/10 transition-colors shrink-0"
                          aria-label="Go back"
                        >
                          <ChevronLeft className="w-5 h-5 text-dune" />
                        </motion.button>
                      )}
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
                <AnimatePresence mode="wait">
                  {/* Quiz content (during morphing phase) */}
                  {isMorphingQuiz && !isMorphing && (
                    <motion.div
                      key="quiz-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        opacity: { duration: 0.25, ease: 'easeOut' },
                        layout: {
                          type: 'spring',
                          stiffness: 180,
                          damping: 28,
                          mass: 1,
                        }
                      }}
                      className="flex-1 min-h-0 flex flex-col overflow-hidden md:max-h-[calc(90vh-60px)]"
                      layout
                    >
                      <FindYourLookContent
                        ref={quizContentRef}
                        onBook={handleQuizBook}
                        onClose={actions.closeModal}
                        isMobile={isMobile}
                        onStepChange={handleQuizStepChange}
                      />
                    </motion.div>
                  )}

                  {/* Morphing transition - show a brief loading state */}
                  {isMorphing && (
                    <motion.div
                      key="morphing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="flex-1 min-h-0 flex items-center justify-center overflow-hidden"
                      layout="position"
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sage text-sm">Loading your services...</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Services content (normal view) */}
                  {!isMorphingQuiz && (
                    <motion.div
                      ref={contentRef}
                      key="services-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                      className={`flex-1 min-h-0 relative ${
                        !layoutSettled || view === 'booking'
                          ? 'overflow-hidden'
                          : 'overflow-y-auto overflow-x-hidden'
                      }`}
                      style={isMobile && layoutSettled ? {
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain'
                      } : undefined}
                      layout="position"
                    >
                      <AnimatePresence mode="wait">
                        {view === 'browse' && <BrowseView key="browse" />}
                        {view === 'detail' && <DetailView key="detail" />}
                        {view === 'booking' && selectedService && (
                          <BookingView key="booking" service={selectedService} />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lash Quiz Prompt - has its own AnimatePresence */}
      <LashQuizPrompt
        isOpen={showLashQuizPrompt}
        onTakeQuiz={handleTakeQuiz}
        onSkip={actions.confirmLashQuizSkip}
        onClose={actions.closeLashQuizPrompt}
      />

      {/* Find Your Look Quiz - has its own AnimatePresence */}
      <FindYourLookModal
        isOpen={showFindYourLookQuiz}
        onClose={actions.closeFindYourLookQuiz}
        onBook={handleQuizBook}
      />
    </>
  )
}
