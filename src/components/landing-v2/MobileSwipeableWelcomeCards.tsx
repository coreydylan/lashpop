'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Check, Hand } from 'lucide-react'
import { useSwipeTutorial } from '@/hooks/useSwipeTutorial'

// The 5 content cards with the new text
const cardContent = [
  {
    id: 1,
    text: "At LashPop, we're a collective of women-owned beauty businesses who believe looking amazing shouldn't require a 30-minute morning routine or a small emotional breakdown in front of the bathroom mirror. We're here to make beauty feel easy, natural, and—honestly—kind of life-changing.",
  },
  {
    id: 2,
    text: "Everything we do is built on trust. When you walk into our studio, you're stepping into a space designed to help you breathe a little deeper and walk out feeling like the most refreshed, put-together version of yourself. No pressure. No judgment. Just great work and a team that genuinely cares about you.",
  },
  {
    id: 3,
    text: "Our artists are pros in all the good stuff: lashes, brows, permanent makeup, facials, HydraFacials, waxing, injectables, and even permanent jewelry for when you want a little sparkle that sticks around. Each service is done with the kind of precision and intention that makes your mornings smoother and your confidence louder.",
  },
  {
    id: 4,
    text: "And since you're probably here to see what we offer, we made it easy—everything you need is right in the service bar above. Think of it as your personal beauty menu: quick to find, simple to navigate, and packed with options you're going to love.",
  },
  {
    id: 5,
    text: "Welcome to your new favorite part of the week.",
    isLast: true,
  },
]

interface MobileSwipeableWelcomeCardsProps {
  onCardChange?: (index: number, total: number) => void
}

export function MobileSwipeableWelcomeCards({
  onCardChange,
}: MobileSwipeableWelcomeCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Swipe tutorial with confirmation
  const {
    showTutorial,
    tutorialSuccess,
    triggerTutorial,
    resetSwipeDistance,
    checkAndComplete
  } = useSwipeTutorial({
    storageKey: 'welcome-cards-swipe-tutorial',
    completionThreshold: 60
  })

  // Show tutorial when component mounts (after small delay)
  useEffect(() => {
    const timer = setTimeout(() => triggerTutorial(), 800)
    return () => clearTimeout(timer)
  }, [triggerTutorial])

  // Swipe threshold
  const swipeThreshold = 80
  const swipeVelocityThreshold = 300

  // Handle swipe completion - infinite loop in both directions
  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      setExitDirection(direction)

      // Small delay to let exit animation start, then update index
      setTimeout(() => {
        setCurrentIndex((prev: number) => {
          if (direction === 'left') {
            // Swipe left = go to next card (loop to start if at end)
            return (prev + 1) % cardContent.length
          } else {
            // Swipe right = go to previous card (loop to end if at start)
            return prev === 0 ? cardContent.length - 1 : prev - 1
          }
        })
        setExitDirection(null)
      }, 200)
    },
    []
  )

  // Handle drag start - reset tutorial distance tracking
  const handleDragStart = useCallback(() => {
    resetSwipeDistance()
  }, [resetSwipeDistance])

  // Handle drag - track distance for tutorial
  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      checkAndComplete(Math.abs(info.delta.x))
    },
    [checkAndComplete]
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info

      // Check if swipe meets threshold (distance or velocity)
      const swipedLeft =
        offset.x < -swipeThreshold || velocity.x < -swipeVelocityThreshold
      const swipedRight =
        offset.x > swipeThreshold || velocity.x > swipeVelocityThreshold

      if (swipedLeft) {
        handleSwipe('left')
      } else if (swipedRight) {
        handleSwipe('right')
      }
      // If neither threshold met, framer-motion's dragElastic handles spring back
    },
    [handleSwipe]
  )

  // Notify on card change
  useEffect(() => {
    onCardChange?.(currentIndex, cardContent.length)
  }, [currentIndex, onCardChange])

  // Card variants for animation
  const cardVariants = {
    enter: (direction: 'left' | 'right' | null) => ({
      scale: 0.95,
      opacity: 0,
      x: direction === 'left' ? 100 : direction === 'right' ? -100 : 0,
    }),
    center: {
      scale: 1,
      opacity: 1,
      x: 0,
      rotate: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 30,
      },
    },
    exit: (direction: 'left' | 'right' | null) => ({
      x: direction === 'left' ? -300 : 300,
      rotate: direction === 'left' ? -10 : 10,
      opacity: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 30,
      },
    }),
  }

  const currentCard = cardContent[currentIndex]

  return (
    <div ref={containerRef} className="relative w-full px-6" style={{ minHeight: '320px' }}>
      {/* Dot indicators - matching team member detail panel style */}
      <div className="flex justify-center items-center gap-1.5 mb-5">
        {cardContent.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="p-1"
            aria-label={`Go to card ${index + 1}`}
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-4 bg-dusty-rose'
                  : 'w-1.5 bg-dusty-rose/40'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Card container - minimal single card */}
      <div className="relative" style={{ height: '260px' }}>
        {/* Active card */}
        <AnimatePresence mode="popLayout" custom={exitDirection}>
          <motion.div
            key={currentCard.id}
            custom={exitDirection}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing touch-pan-y"
            style={{ zIndex: 10 }}
            whileDrag={{ scale: 1.01 }}
          >
            {/* Minimal card content */}
            <div
              className="h-full rounded-2xl p-6 flex flex-col justify-center items-center text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              <p
                className={`font-sans leading-relaxed ${
                  currentCard.isLast
                    ? 'text-lg font-medium'
                    : 'text-sm font-light'
                }`}
                style={{ color: '#8a5e55' }}
              >
                {currentCard.text}
              </p>

              {/* Swipe tutorial hint - subtle icon only */}
              <AnimatePresence>
                {showTutorial && !tutorialSuccess && currentIndex === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                    className="mt-4"
                  >
                    <motion.div
                      className="bg-dune/8 backdrop-blur-sm rounded-full p-2"
                      animate={{ x: [0, 6, 0, -6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Hand className="w-3.5 h-3.5 text-dune/40 rotate-90" />
                    </motion.div>
                  </motion.div>
                )}
                {tutorialSuccess && currentIndex === 0 && (
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <motion.div
                      className="bg-dune/8 backdrop-blur-sm rounded-full p-2"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, ease: "backOut" }}
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600/70" strokeWidth={3} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
