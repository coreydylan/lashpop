'use client'

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'

// Styled text components for creative typography - scaled up for desktop
const Emphasis = ({ children }: { children: ReactNode }) => (
  <span className="font-medium" style={{ color: '#6d4a43' }}>{children}</span>
)

const Soft = ({ children }: { children: ReactNode }) => (
  <span className="font-extralight opacity-80">{children}</span>
)

const Standout = ({ children }: { children: ReactNode }) => (
  <span className="block text-xl font-medium mt-3 tracking-wide" style={{ color: '#6d4a43' }}>{children}</span>
)

// The 5 content cards - desktop optimized with larger text
const cardContent: { id: number; content: ReactNode; showServiceArrow?: boolean }[] = [
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
        <span className="block text-xl font-medium mb-3" style={{ color: '#6d4a43' }}>
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
        <span className="block my-3 text-sm tracking-[0.2em] uppercase font-light opacity-75">
          lashes · brows · permanent makeup · facials · waxing · injectables · permanent jewelry
        </span>
        <span>Each service is done with the kind of</span>{' '}
        <Emphasis>precision and intention</Emphasis>{' '}
        <span>that makes your</span>
        <Standout>mornings smoother &amp; confidence louder.</Standout>
      </>
    ),
  },
  {
    id: 4,
    content: (
      <>
        <Soft>And since you&apos;re probably here to see what we offer,</Soft>
        <span className="block text-xl font-medium my-3" style={{ color: '#6d4a43' }}>we made it easy.</span>
        <span>Everything you need is right in the</span>{' '}
        <span className="font-semibold tracking-wide" style={{ color: '#8a5e55' }}>service bar above</span>
      </>
    ),
    showServiceArrow: true,
  },
  {
    id: 5,
    content: (
      <>
        <span className="block text-sm uppercase tracking-[0.3em] font-light opacity-60 mb-4">Welcome to</span>
        <span className="block text-3xl font-medium tracking-wide leading-tight" style={{ color: '#6d4a43' }}>
          your new favorite
        </span>
        <span className="block text-3xl font-medium tracking-wide leading-tight" style={{ color: '#6d4a43' }}>
          part of the week.
        </span>
      </>
    ),
  },
]

interface DesktopWelcomeCardsProps {
  onCardChange?: (index: number, total: number) => void
}

export function DesktopWelcomeCards({ onCardChange }: DesktopWelcomeCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Swipe/drag thresholds
  const swipeThreshold = 50
  const swipeVelocityThreshold = 100

  // Navigate to next/previous card
  const goToNext = useCallback(() => {
    setExitDirection('left')
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cardContent.length)
      setExitDirection(null)
    }, 200)
  }, [])

  const goToPrev = useCallback(() => {
    setExitDirection('right')
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? cardContent.length - 1 : prev - 1))
      setExitDirection(null)
    }, 200)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key === 'ArrowLeft') {
        goToPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev])

  // Handle drag end
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info

      const swipedLeft = offset.x < -swipeThreshold || velocity.x < -swipeVelocityThreshold
      const swipedRight = offset.x > swipeThreshold || velocity.x > swipeVelocityThreshold

      if (swipedLeft) {
        goToNext()
      } else if (swipedRight) {
        goToPrev()
      }
    },
    [goToNext, goToPrev]
  )

  // Notify on card change
  useEffect(() => {
    onCardChange?.(currentIndex, cardContent.length)
  }, [currentIndex, onCardChange])

  // Card animation variants
  const cardVariants = {
    enter: (direction: 'left' | 'right' | null) => ({
      scale: 0.95,
      opacity: 0,
      x: direction === 'left' ? 120 : direction === 'right' ? -120 : 0,
    }),
    center: {
      scale: 1,
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (direction: 'left' | 'right' | null) => ({
      x: direction === 'left' ? -300 : 300,
      opacity: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      },
    }),
  }

  const currentCard = cardContent[currentIndex]

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full">
      {/* Pagination dots */}
      <div className="flex justify-center items-center gap-2 mb-8">
        {cardContent.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            type="button"
            aria-label={`Go to card ${index + 1}`}
            className="flex items-center justify-center p-1"
          >
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: index === currentIndex ? 24 : 8,
                backgroundColor: index === currentIndex ? '#8a5e55' : 'rgba(138, 94, 85, 0.3)'
              }}
            />
          </button>
        ))}
      </div>

      {/* Card container with navigation arrows */}
      <div className="relative w-full max-w-2xl mx-auto flex items-center">
        {/* Left arrow */}
        <button
          onClick={goToPrev}
          className="absolute -left-16 p-2 rounded-full transition-all duration-200 hover:bg-[#8a5e55]/10"
          style={{ color: '#8a5e55' }}
          aria-label="Previous card"
        >
          <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
        </button>

        {/* Card */}
        <div className="relative w-full" style={{ height: '220px' }}>
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
              dragElastic={0.3}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 cursor-grab active:cursor-grabbing flex items-center justify-center"
              whileDrag={{ scale: 1.02 }}
            >
              <div className="text-center px-8">
                <div
                  className="font-sans leading-relaxed text-lg"
                  style={{
                    color: '#8a5e55',
                    textShadow: '0 1px 3px rgba(255,255,255,0.6)'
                  }}
                >
                  {currentCard.content}
                </div>

                {/* Up arrow for service bar - shows on card 4 */}
                {currentCard.showServiceArrow && (
                  <motion.div
                    className="mt-6 flex flex-col items-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ChevronUp className="w-6 h-6 text-[#8a5e55]/60" strokeWidth={1.5} />
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right arrow */}
        <button
          onClick={goToNext}
          className="absolute -right-16 p-2 rounded-full transition-all duration-200 hover:bg-[#8a5e55]/10"
          style={{ color: '#8a5e55' }}
          aria-label="Next card"
        >
          <ChevronRight className="w-8 h-8" strokeWidth={1.5} />
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-6 text-xs uppercase tracking-widest opacity-40" style={{ color: '#8a5e55' }}>
        Use arrow keys or drag to navigate
      </p>
    </div>
  )
}
