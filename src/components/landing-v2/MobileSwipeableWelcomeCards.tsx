'use client'

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { useSwipeTutorial } from '@/hooks/useSwipeTutorial'

// Styled text components for creative typography
const Emphasis = ({ children }: { children: ReactNode }) => (
  <span className="font-medium" style={{ color: '#ac4d3c' }}>{children}</span>
)

const Highlight = ({ children }: { children: ReactNode }) => (
  <span className="font-semibold text-base tracking-wide" style={{ color: '#ac4d3c' }}>{children}</span>
)

const Soft = ({ children }: { children: ReactNode }) => (
  <span className="font-extralight opacity-80">{children}</span>
)

const Standout = ({ children }: { children: ReactNode }) => (
  <span className="block text-base font-medium mt-2 tracking-wide" style={{ color: '#ac4d3c' }}>{children}</span>
)

// The 5 content cards with creative typography
const cardContent: { id: number; content: ReactNode; isLast?: boolean; showServiceArrow?: boolean }[] = [
  {
    id: 1,
    content: (
      <>
        <Soft>At LashPop, we&apos;re a collective of</Soft>{' '}
        <Emphasis>women-owned beauty businesses</Emphasis>{' '}
        <Soft>who believe looking amazing shouldn&apos;t require a 30-minute morning routine</Soft>{' '}
        <span className="italic opacity-70">or a small emotional breakdown in front of the bathroom mirror.</span>
        <Standout>We&apos;re here to make beauty feel easy, natural, and honestly kind of life-changing.</Standout>
      </>
    ),
  },
  {
    id: 2,
    content: (
      <>
        <span className="block text-base font-medium mb-2" style={{ color: '#ac4d3c' }}>
          Everything we do is built on trust.
        </span>
        <Soft>When you walk into our studio, you&apos;re stepping into a space designed to help you breathe a little deeper and walk out feeling like</Soft>{' '}
        <Emphasis>the most refreshed, put-together version of yourself.</Emphasis>
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
        <span className="block text-base font-medium my-2" style={{ color: '#ac4d3c' }}>we made it easy.</span>
        <span className="text-sm">Everything you need is right in the</span>{' '}
        <Highlight>service bar below</Highlight>
        <span className="block mt-2 text-xs italic opacity-70">
          Think of it as your personal beauty menu: quick to find, simple to navigate, packed with options you&apos;ll love.
        </span>
      </>
    ),
    showServiceArrow: true,
  },
  {
    id: 5,
    content: (
      <>
        <span className="block text-xs uppercase tracking-[0.3em] font-light opacity-60 mb-3">Welcome to</span>
        <span className="block text-xl font-medium tracking-wide" style={{ color: '#ac4d3c' }}>
          your new favorite
        </span>
        <span className="block text-xl font-medium tracking-wide" style={{ color: '#ac4d3c' }}>
          part of the week.
        </span>
      </>
    ),
    isLast: true,
  },
]

interface MobileSwipeableWelcomeCardsProps {
  onCardChange?: (index: number, total: number) => void
  showLogo?: boolean
}

export function MobileSwipeableWelcomeCards({
  onCardChange,
  showLogo = false,
}: MobileSwipeableWelcomeCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragDirectionRef = useRef<'horizontal' | 'vertical' | null>(null)
  const initialTouchRef = useRef<{ x: number; y: number } | null>(null)

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

  // Swipe thresholds
  const swipeThreshold = 25 // Distance in pixels to trigger swipe
  const swipeVelocityThreshold = 80 // Velocity in px/s to trigger swipe

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

  // Handle drag start - detect direction early and lock it
  const handleDragStart = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      resetSwipeDistance()
      dragDirectionRef.current = null

      // Store initial touch position
      if ('touches' in event && event.touches[0]) {
        initialTouchRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
      } else if ('clientX' in event) {
        initialTouchRef.current = { x: event.clientX, y: event.clientY }
      }
    },
    [resetSwipeDistance]
  )

  // Handle drag - determine direction early and lock
  const handleDrag = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      checkAndComplete(Math.abs(info.delta.x))

      // Early direction detection (after ~10px of movement)
      if (!dragDirectionRef.current && (Math.abs(info.offset.x) > 10 || Math.abs(info.offset.y) > 10)) {
        const absX = Math.abs(info.offset.x)
        const absY = Math.abs(info.offset.y)

        // If horizontal movement is greater, lock to horizontal
        if (absX > absY) {
          dragDirectionRef.current = 'horizontal'
        } else {
          dragDirectionRef.current = 'vertical'
        }
      }
    },
    [checkAndComplete]
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info

      // Only process if we determined this was a horizontal gesture
      if (dragDirectionRef.current !== 'horizontal') {
        dragDirectionRef.current = null
        return
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

      dragDirectionRef.current = null
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
    <div ref={containerRef} className="flex flex-col items-center w-full overflow-hidden relative">
      {/* LP Logo - swipeable area */}
      {showLogo && (
        <motion.div
          className="relative cursor-grab active:cursor-grabbing mb-5"
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{ touchAction: 'pan-y' }}
          whileDrag={{ scale: 1.02 }}
        >
          <div
            className="h-20 w-48 flex-shrink-0"
            style={{
              maskImage: 'url(/lashpop-images/lp-logo.png)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: 'url(/lashpop-images/lp-logo.png)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              backgroundColor: '#ac4d3c'
            }}
          />
        </motion.div>
      )}

      {/* Progress indicator - matching FindYourLook quiz style */}
      <div className="flex justify-center items-center gap-2 mb-5">
        {cardContent.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            type="button"
            aria-label={`Go to card ${index + 1}`}
            className="flex items-center justify-center h-5"
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-5 bg-terracotta'
                  : index < currentIndex
                  ? 'w-1.5 bg-terracotta/40'
                  : 'w-1.5 bg-cream'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Card container - extended touch area with padding */}
      <div className="relative w-full max-w-sm mx-auto" style={{ height: '180px' }}>
        {/* Subtle side arrows indicating swipe */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-0 pointer-events-none"
          animate={{
            opacity: [0.15, 0.35, 0.15],
            x: [0, -3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChevronLeft className="w-5 h-5 text-[#ac4d3c]" strokeWidth={1.5} />
        </motion.div>
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-0 pointer-events-none"
          animate={{
            opacity: [0.15, 0.35, 0.15],
            x: [0, 3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChevronRight className="w-5 h-5 text-[#ac4d3c]" strokeWidth={1.5} />
        </motion.div>

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
            className="absolute cursor-grab active:cursor-grabbing"
            style={{
              touchAction: 'pan-y',
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
                  color: '#ac4d3c',
                  textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                }}
              >
                {currentCard.content}
              </div>

              {/* Down arrow for service bar - shows on card 4 */}
              {currentCard.showServiceArrow && (
                <motion.div
                  className="mt-4 flex flex-col items-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronDown className="w-5 h-5 text-[#ac4d3c]/60" strokeWidth={1.5} />
                  </motion.div>
                </motion.div>
              )}

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
                      <ChevronLeft className="w-3.5 h-3.5 text-[#ac4d3c]/40" strokeWidth={1.5} />
                    </motion.div>

                    {/* Swipe text */}
                    <span className="text-[10px] text-[#ac4d3c]/45 font-light tracking-wider uppercase">
                      swipe
                    </span>

                    {/* Right chevron - pulses right */}
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-[#ac4d3c]/40" strokeWidth={1.5} />
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
