'use client'

import { useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { gsap, initGSAP } from '@/lib/gsap'
import { useSlideshowController } from './useSlideshowController'
import { useSlideshowNavigation } from './useSlideshowNavigation'
import { SlideshowIndicators } from './SlideshowIndicators'
import type {
  SlideshowPreset,
  SlideshowImage,
  TransitionType,
  TransitionConfig,
  KenBurnsConfig
} from '@/types/hero-slideshow'

interface HeroArchSlideshowProps {
  preset: SlideshowPreset
  className?: string
  /** Container dimensions for positioning */
  containerStyle?: React.CSSProperties
}

/**
 * Premium slideshow component that displays within the hero arch shape.
 * Supports multiple transition effects including fade, slide, Ken Burns, and more.
 */
export function HeroArchSlideshow({ preset, className = '', containerStyle }: HeroArchSlideshowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentImageRef = useRef<HTMLDivElement>(null)
  const previousImageRef = useRef<HTMLDivElement>(null)
  const gsapInitializedRef = useRef(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  const {
    currentIndex,
    previousIndex,
    isTransitioning,
    direction,
    currentImage,
    previousImage,
    imageCount,
    goToSlide,
    goToNext,
    goToPrevious,
    completeTransition,
    handleInteraction,
    handleMouseEnter,
    handleMouseLeave
  } = useSlideshowController({ preset })

  // Navigation (scroll/swipe)
  useSlideshowNavigation({
    containerRef: containerRef as React.RefObject<HTMLElement>,
    navigation: preset.navigation,
    onNext: goToNext,
    onPrevious: goToPrevious,
    onInteraction: handleInteraction,
    isTransitioning
  })

  // Initialize GSAP
  useEffect(() => {
    initGSAP().then(() => {
      gsapInitializedRef.current = true
    })
  }, [])

  // Get easing string for GSAP
  const getGsapEasing = useCallback((easing: string): string => {
    const easingMap: Record<string, string> = {
      linear: 'none',
      ease: 'power2.inOut',
      easeIn: 'power2.in',
      easeOut: 'power2.out',
      easeInOut: 'power2.inOut',
      easeInQuad: 'power1.in',
      easeOutQuad: 'power1.out',
      easeInOutQuad: 'power1.inOut',
      easeInCubic: 'power2.in',
      easeOutCubic: 'power2.out',
      easeInOutCubic: 'power2.inOut',
      easeInExpo: 'expo.in',
      easeOutExpo: 'expo.out',
      easeInOutExpo: 'expo.inOut'
    }
    return easingMap[easing] || 'power2.inOut'
  }, [])

  // Run transition animation
  useEffect(() => {
    if (!isTransitioning || !gsapInitializedRef.current || !currentImageRef.current || !previousImageRef.current) {
      return
    }

    const { transition, globalKenBurns } = preset
    const duration = transition.duration / 1000
    const ease = getGsapEasing(transition.easing)

    // Kill any existing animation
    if (timelineRef.current) {
      timelineRef.current.kill()
    }

    const currentEl = currentImageRef.current
    const previousEl = previousImageRef.current
    const currentImg = currentEl.querySelector('img')
    const previousImg = previousEl.querySelector('img')

    // Create new timeline
    const tl = gsap.timeline({
      onComplete: () => {
        completeTransition()
      }
    })

    timelineRef.current = tl

    // Apply transition based on type
    switch (transition.type) {
      case 'fade':
        // Simple crossfade
        gsap.set(currentEl, { opacity: 0 })
        tl.to(previousEl, { opacity: 0, duration, ease }, 0)
          .to(currentEl, { opacity: 1, duration, ease }, 0)
        break

      case 'slide':
        // Horizontal slide
        const slideDir = direction === 'next' ? -1 : 1
        gsap.set(currentEl, { xPercent: -slideDir * 100, opacity: 1 })
        tl.to(previousEl, { xPercent: slideDir * 100, duration, ease }, 0)
          .to(currentEl, { xPercent: 0, duration, ease }, 0)
        break

      case 'slideUp':
        // Vertical slide up
        gsap.set(currentEl, { yPercent: 100, opacity: 1 })
        tl.to(previousEl, { yPercent: -100, duration, ease }, 0)
          .to(currentEl, { yPercent: 0, duration, ease }, 0)
        break

      case 'slideDown':
        // Vertical slide down
        gsap.set(currentEl, { yPercent: -100, opacity: 1 })
        tl.to(previousEl, { yPercent: 100, duration, ease }, 0)
          .to(currentEl, { yPercent: 0, duration, ease }, 0)
        break

      case 'kenBurns':
        // Ken Burns - the zoom/pan movement IS the transition
        // Previous image zooms out/pans away while new image zooms in/pans into place
        const kenBurnsOut = previousImage?.kenBurns || globalKenBurns || {
          startScale: 1.0,
          endScale: 1.15,
          startPosition: { x: 50, y: 50 },
          endPosition: { x: 45, y: 45 }
        }
        const kenBurnsIn = currentImage?.kenBurns || globalKenBurns || {
          startScale: 1.15,
          endScale: 1.0,
          startPosition: { x: 55, y: 55 },
          endPosition: { x: 50, y: 50 }
        }

        // Set initial states
        gsap.set(currentEl, { opacity: 1 }) // Both visible during transition

        if (previousImg) {
          // Previous image continues its Ken Burns motion and fades
          tl.to(previousImg, {
            scale: kenBurnsOut.endScale,
            xPercent: (kenBurnsOut.endPosition.x - 50) * 0.8,
            yPercent: (kenBurnsOut.endPosition.y - 50) * 0.8,
            duration: duration,
            ease: 'power1.inOut'
          }, 0)
          tl.to(previousEl, {
            opacity: 0,
            duration: duration * 0.7,
            ease: 'power1.in'
          }, duration * 0.3)
        }

        if (currentImg) {
          // New image starts zoomed/offset and moves into final position
          gsap.set(currentImg, {
            scale: kenBurnsIn.startScale,
            xPercent: (kenBurnsIn.startPosition.x - 50) * 0.8,
            yPercent: (kenBurnsIn.startPosition.y - 50) * 0.8
          })
          gsap.set(currentEl, { opacity: 0 })

          // Fade in while moving
          tl.to(currentEl, {
            opacity: 1,
            duration: duration * 0.7,
            ease: 'power1.out'
          }, 0)

          tl.to(currentImg, {
            scale: kenBurnsIn.endScale,
            xPercent: (kenBurnsIn.endPosition.x - 50) * 0.8,
            yPercent: (kenBurnsIn.endPosition.y - 50) * 0.8,
            duration: duration,
            ease: 'power1.inOut'
          }, 0)
        }
        break

      case 'zoom':
        // Zoom transition
        gsap.set(currentEl, { opacity: 0, scale: 0.8 })
        tl.to(previousEl, { opacity: 0, scale: 1.2, duration, ease }, 0)
          .to(currentEl, { opacity: 1, scale: 1, duration, ease }, 0)
        break

      case 'blur':
        // Blur transition (using filter)
        gsap.set(currentEl, { opacity: 0, filter: 'blur(20px)' })
        tl.to(previousEl, { opacity: 0, filter: 'blur(20px)', duration, ease }, 0)
          .to(currentEl, { opacity: 1, filter: 'blur(0px)', duration, ease }, 0)
        break

      case 'wipeLeft':
      case 'wipeRight':
      case 'wipeUp':
      case 'wipeDown':
        // Wipe transitions using clip-path
        const wipeDir = transition.type.replace('wipe', '').toLowerCase()
        let startClip = '', endClip = ''

        if (wipeDir === 'left') {
          startClip = 'inset(0 0 0 100%)'
          endClip = 'inset(0 0 0 0)'
        } else if (wipeDir === 'right') {
          startClip = 'inset(0 100% 0 0)'
          endClip = 'inset(0 0 0 0)'
        } else if (wipeDir === 'up') {
          startClip = 'inset(100% 0 0 0)'
          endClip = 'inset(0 0 0 0)'
        } else if (wipeDir === 'down') {
          startClip = 'inset(0 0 100% 0)'
          endClip = 'inset(0 0 0 0)'
        }

        gsap.set(currentEl, { clipPath: startClip, opacity: 1 })
        tl.to(currentEl, { clipPath: endClip, duration, ease }, 0)
        break

      case 'circleReveal':
        // Circle reveal from center
        gsap.set(currentEl, { clipPath: 'circle(0% at 50% 50%)', opacity: 1 })
        tl.to(currentEl, { clipPath: 'circle(100% at 50% 50%)', duration, ease }, 0)
        break

      case 'pixelate':
        // Pixelate dissolve (simplified - actual pixelation would need canvas/WebGL)
        gsap.set(currentEl, { opacity: 0 })
        tl.to(previousEl, { opacity: 0, duration: duration * 0.5, ease: 'steps(8)' }, 0)
          .to(currentEl, { opacity: 1, duration: duration * 0.5, ease: 'steps(8)' }, duration * 0.5)
        break

      default:
        // Default to fade
        gsap.set(currentEl, { opacity: 0 })
        tl.to(previousEl, { opacity: 0, duration, ease }, 0)
          .to(currentEl, { opacity: 1, duration, ease }, 0)
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
    }
  }, [isTransitioning, preset, currentImage, direction, getGsapEasing, completeTransition])

  // Reset positions after transition
  useEffect(() => {
    if (!isTransitioning && previousImageRef.current) {
      gsap.set(previousImageRef.current, { clearProps: 'all' })
    }
  }, [isTransitioning])

  // Single image fallback
  if (imageCount <= 1 && currentImage) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden ${className}`}
        style={containerStyle}
      >
        <Image
          src={currentImage.url}
          alt="Hero image"
          fill
          className={currentImage.objectFit === 'contain' ? 'object-contain' : 'object-cover'}
          style={{ objectPosition: `${currentImage.position.x}% ${currentImage.position.y}%` }}
          priority
          quality={85}
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Previous image layer */}
      <div
        ref={previousImageRef}
        className="absolute inset-0"
        style={{ zIndex: 1 }}
      >
        {previousImage && (
          <Image
            src={previousImage.url}
            alt="Previous image"
            fill
            className={previousImage.objectFit === 'contain' ? 'object-contain' : 'object-cover'}
            style={{ objectPosition: `${previousImage.position.x}% ${previousImage.position.y}%` }}
            quality={85}
          />
        )}
      </div>

      {/* Current image layer */}
      <div
        ref={currentImageRef}
        className="absolute inset-0"
        style={{ zIndex: 2 }}
      >
        {currentImage && (
          <Image
            src={currentImage.url}
            alt="Current image"
            fill
            className={currentImage.objectFit === 'contain' ? 'object-contain' : 'object-cover'}
            style={{ objectPosition: `${currentImage.position.x}% ${currentImage.position.y}%` }}
            priority
            quality={85}
          />
        )}
      </div>

      {/* Navigation indicators */}
      {preset.navigation.showIndicators && imageCount > 1 && (
        <SlideshowIndicators
          count={imageCount}
          currentIndex={currentIndex}
          position={preset.navigation.indicatorPosition}
          style={preset.navigation.indicatorStyle}
          onSelect={goToSlide}
        />
      )}
    </div>
  )
}
