'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'

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
  onAllCardsViewed?: () => void
  onCardChange?: (index: number, total: number) => void
}

export function MobileSwipeableWelcomeCards({
  onAllCardsViewed,
  onCardChange,
}: MobileSwipeableWelcomeCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Swipe threshold
  const swipeThreshold = 80
  const swipeVelocityThreshold = 300

  // Handle swipe completion
  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (currentIndex >= cardContent.length - 1) {
        // Last card - mark as completed
        setHasCompletedOnce(true)
        onAllCardsViewed?.()
        return
      }

      setExitDirection(direction)

      // Small delay to let exit animation start, then update index
      setTimeout(() => {
        setCurrentIndex((prev: number) => Math.min(prev + 1, cardContent.length - 1))
        setExitDirection(null)
        onCardChange?.(currentIndex + 1, cardContent.length)
      }, 200)
    },
    [currentIndex, onAllCardsViewed, onCardChange]
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

  // Reset cards to beginning
  const handleReset = useCallback(() => {
    setCurrentIndex(0)
    setExitDirection(null)
    onCardChange?.(0, cardContent.length)
  }, [onCardChange])

  // Notify on card change
  useEffect(() => {
    onCardChange?.(currentIndex, cardContent.length)
  }, [currentIndex, onCardChange])

  // Card variants for animation
  const cardVariants = {
    enter: {
      scale: 0.95,
      opacity: 0,
      y: 20,
    },
    center: {
      scale: 1,
      opacity: 1,
      y: 0,
      x: 0,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
      },
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -300 : 300,
      rotate: direction === 'left' ? -15 : 15,
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
      },
    }),
  }

  // Background cards (stacked effect)
  const renderBackgroundCards = () => {
    const remainingCards = cardContent.length - currentIndex - 1
    const cardsToShow = Math.min(remainingCards, 2)

    return Array.from({ length: cardsToShow }).map((_, i) => {
      const offset = i + 1
      return (
        <div
          key={`bg-card-${offset}`}
          className="absolute inset-0 rounded-3xl"
          style={{
            transform: `translateY(${offset * 8}px) scale(${1 - offset * 0.03})`,
            opacity: 1 - offset * 0.2,
            zIndex: -offset,
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
          }}
        />
      )
    })
  }

  const currentCard = cardContent[currentIndex]
  const isLastCard = currentIndex === cardContent.length - 1

  return (
    <div ref={containerRef} className="relative w-full px-6" style={{ minHeight: '280px' }}>
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-4">
        {cardContent.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (index <= currentIndex || hasCompletedOnce) {
                setCurrentIndex(index)
              }
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-dusty-rose w-6'
                : index < currentIndex || hasCompletedOnce
                  ? 'bg-dusty-rose/40 hover:bg-dusty-rose/60'
                  : 'bg-dune/20'
            }`}
            disabled={index > currentIndex && !hasCompletedOnce}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      {/* Card stack container */}
      <div className="relative" style={{ height: '220px' }}>
        {/* Background stacked cards */}
        {renderBackgroundCards()}

        {/* Active card */}
        <AnimatePresence mode="popLayout" custom={exitDirection}>
          <motion.div
            key={currentCard.id}
            custom={exitDirection}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag={!isLastCard || !hasCompletedOnce ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing touch-pan-y"
            style={{ zIndex: 10 }}
            whileDrag={{ scale: 1.02 }}
          >
            {/* Card content */}
            <div
              className="h-full rounded-3xl p-6 flex flex-col justify-center items-center text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: `
                  0 4px 24px rgba(138, 94, 85, 0.08),
                  inset 0 1px 1px rgba(255, 255, 255, 0.6)
                `,
              }}
            >
              <p
                className={`font-sans font-light leading-relaxed ${
                  currentCard.isLast
                    ? 'text-xl font-medium'
                    : 'text-sm'
                }`}
                style={{ color: '#8a5e55' }}
              >
                {currentCard.text}
              </p>

              {/* Swipe hint for first card */}
              {currentIndex === 0 && !hasCompletedOnce && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-4 flex items-center gap-2 text-xs text-dune/40"
                >
                  <motion.span
                    animate={{ x: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    ←
                  </motion.span>
                  <span>swipe</span>
                  <motion.span
                    animate={{ x: [2, -2, 2] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </motion.div>
              )}

              {/* Reset button on last card after completion */}
              {isLastCard && hasCompletedOnce && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: 'rgba(138, 94, 85, 0.1)',
                    color: '#8a5e55',
                    border: '1px solid rgba(138, 94, 85, 0.2)',
                  }}
                >
                  Read again ↻
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Card counter */}
      <div className="text-center mt-3">
        <span className="text-xs font-medium text-dune/30">
          {currentIndex + 1} / {cardContent.length}
        </span>
      </div>
    </div>
  )
}
