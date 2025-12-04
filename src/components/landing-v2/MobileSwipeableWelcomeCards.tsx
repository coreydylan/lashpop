'use client'

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSwipeTutorial } from '@/hooks/useSwipeTutorial'

// Styled text components for creative typography
const Emphasis = ({ children }: { children: ReactNode }) => (
  <span className="font-medium" style={{ color: '#6d4a43' }}>{children}</span>
)

const Highlight = ({ children }: { children: ReactNode }) => (
  <span className="font-semibold text-base tracking-wide" style={{ color: '#8a5e55' }}>{children}</span>
)

const Soft = ({ children }: { children: ReactNode }) => (
  <span className="font-extralight opacity-80">{children}</span>
)

const Standout = ({ children }: { children: ReactNode }) => (
  <span className="block text-base font-medium mt-2 tracking-wide" style={{ color: '#6d4a43' }}>{children}</span>
)

// The 5 content cards with creative typography
const cardContent: { id: number; content: ReactNode; isLast?: boolean }[] = [
  {
    id: 1,
    content: (
      <>
        <Soft>At LashPop, we&apos;re a collective of</Soft>{' '}
        <Emphasis>women-owned beauty businesses</Emphasis>{' '}
        <Soft>who believe looking amazing shouldn&apos;t require a 30-minute morning routine</Soft>{' '}
        <span className="italic opacity-70">or a small emotional breakdown in front of the bathroom mirror.</span>
        <Standout>We&apos;re here to make beauty feel easy, natural, and—honestly—kind of life-changing.</Standout>
      </>
    ),
  },
  {
    id: 2,
    content: (
      <>
        <span className="block text-base font-medium mb-2" style={{ color: '#6d4a43' }}>
          Everything we do is built on trust.
        </span>
        <Soft>When you walk into our studio, you&apos;re stepping into a space designed to help you breathe a little deeper and walk out feeling like</Soft>{' '}
        <Emphasis>the most refreshed, put-together version of yourself.</Emphasis>
        <span className="block mt-3 text-sm tracking-widest uppercase font-light opacity-90">
          No pressure · No judgment · Just great work
        </span>
      </>
    ),
  },
  {
    id: 3,
    content: (
      <>
        <Soft>Our artists are pros in all the good stuff:</Soft>
        <span className="block my-2 text-xs tracking-wider uppercase font-light opacity-75">
          lashes · brows · permanent makeup · facials · waxing · injectables · permanent jewelry
        </span>
        <span className="text-sm">Each service is done with the kind of</span>{' '}
        <Emphasis>precision and intention</Emphasis>{' '}
        <span className="text-sm">that makes your</span>
        <Standout>mornings smoother &amp; confidence louder.</Standout>
      </>
    ),
  },
  {
    id: 4,
    content: (
      <>
        <Soft>And since you&apos;re probably here to see what we offer,</Soft>
        <span className="block text-base font-medium my-2" style={{ color: '#6d4a43' }}>we made it easy.</span>
        <span className="text-sm">Everything you need is right in the</span>{' '}
        <Highlight>service bar above</Highlight>
        <span className="block mt-2 text-xs italic opacity-70">
          Think of it as your personal beauty menu—quick to find, simple to navigate, packed with options you&apos;ll love.
        </span>
      </>
    ),
  },
  {
    id: 5,
    content: (
      <>
        <span className="block text-xs uppercase tracking-[0.3em] font-light opacity-60 mb-3">Welcome to</span>
        <span className="block text-xl font-medium tracking-wide" style={{ color: '#6d4a43' }}>
          your new favorite
        </span>
        <span className="block text-xl font-medium tracking-wide" style={{ color: '#6d4a43' }}>
          part of the week.
        </span>
      </>
    ),
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

  // Swipe thresholds - lower values = more sensitive to horizontal swipes
  const swipeThreshold = 40 // Distance in pixels (was 80)
  const swipeVelocityThreshold = 150 // Velocity in px/s (was 300)
  const verticalThresholdRatio = 1.5 // Allow swipe if horizontal > vertical * ratio

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

      // Check if this is primarily a horizontal gesture (not vertical scrolling)
      const absOffsetX = Math.abs(offset.x)
      const absOffsetY = Math.abs(offset.y)
      const isHorizontalGesture = absOffsetX > absOffsetY * verticalThresholdRatio

      // Only process horizontal swipes if it's primarily a horizontal gesture
      if (!isHorizontalGesture) {
        return // Let vertical scroll happen
      }

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
    <div ref={containerRef} className="flex flex-col items-center w-full overflow-hidden">
      {/* Pagination dots - tightly grouped */}
      <div className="flex justify-center items-center gap-1 mb-5">
        {cardContent.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            type="button"
            aria-label={`Go to card ${index + 1}`}
            className="flex items-center justify-center"
            style={{ width: index === currentIndex ? 16 : 6, height: 20 }}
          >
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: index === currentIndex ? 16 : 6,
                backgroundColor: index === currentIndex ? '#8a5e55' : 'rgba(138, 94, 85, 0.4)'
              }}
            />
          </button>
        ))}
      </div>

      {/* Card container - extended touch area with padding */}
      <div className="relative w-full max-w-sm mx-auto" style={{ height: '180px' }}>
        <AnimatePresence mode="popLayout" custom={exitDirection}>
          <motion.div
            key={currentCard.id}
            custom={exitDirection}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className="absolute cursor-grab active:cursor-grabbing touch-pan-y"
            style={{
              zIndex: 10,
              // Extended touch area: add padding on left/right for easier swipe initiation
              top: 0,
              bottom: 0,
              left: -24,
              right: -24,
              paddingLeft: 24,
              paddingRight: 24,
            }}
            whileDrag={{ scale: 1.01 }}
          >
            {/* Card content - no background, text directly on image */}
            <div className="h-full flex flex-col justify-center items-center text-center">
              <div
                className="font-sans leading-relaxed text-sm"
                style={{
                  color: '#8a5e55',
                  textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                }}
              >
                {currentCard.content}
              </div>

              {/* Swipe hint - chevrons that animate left/right */}
              <AnimatePresence>
                {showTutorial && !tutorialSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="mt-5 flex items-center gap-2"
                  >
                    {/* Left chevron - pulses left */}
                    <motion.div
                      animate={{ x: [0, -3, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-[#8a5e55]/40" strokeWidth={1.5} />
                    </motion.div>

                    {/* Swipe text */}
                    <span className="text-[10px] text-[#8a5e55]/45 font-light tracking-wider uppercase">
                      swipe
                    </span>

                    {/* Right chevron - pulses right */}
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-[#8a5e55]/40" strokeWidth={1.5} />
                    </motion.div>
                  </motion.div>
                )}
                {tutorialSuccess && (
                  <motion.div
                    className="mt-5"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.25, ease: "backOut" }}
                    >
                      <Check className="w-4 h-4 text-emerald-600/70" strokeWidth={2.5} />
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
