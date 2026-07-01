'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCarouselWheelScroll } from '@/hooks/useCarouselWheelScroll'
import { getEnabledCarouselPhotos, type CarouselDisplayPhoto } from '@/actions/work-with-us-carousel'

interface TeamCarouselProps {
  photos?: CarouselDisplayPhoto[]
}

export function TeamCarousel({ photos: initialPhotos }: TeamCarouselProps) {
  const ref = useRef(null)
  // Index into the (un-duplicated) source list, or null when the lightbox is closed
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [photos, setPhotos] = useState<CarouselDisplayPhoto[]>(initialPhotos || [])
  const [loading, setLoading] = useState(!initialPhotos)

  // Fetch photos on mount if not provided via props
  useEffect(() => {
    if (!initialPhotos) {
      getEnabledCarouselPhotos().then((data) => {
        setPhotos(data)
        setLoading(false)
      })
    }
  }, [initialPhotos])

  // Initialize Embla with AutoScroll
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      containScroll: false,
      align: 'center',
      skipSnaps: true,
      inViewThreshold: 0.7
    },
    [
      AutoScroll({
        playOnInit: true,
        speed: 1.5,
        // True so a drag or arrow click stops the auto-scroll instead of
        // fighting it (was producing the "stuck, can't scroll left/right"
        // bug — manual drag would advance one frame then snap back).
        stopOnInteraction: true,
        stopOnMouseEnter: true,
        rootNode: (emblaRoot: HTMLElement) => emblaRoot.parentElement
      })
    ]
  )

  // Hover-based wheel scroll
  const { wheelContainerRef } = useCarouselWheelScroll(emblaApi)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Triple the items for seamless infinite scroll
  const displayItems = [...photos, ...photos, ...photos]
  const total = photos.length
  const isOpen = lightboxIndex !== null
  const activePhoto = isOpen ? photos[lightboxIndex] : null

  // URL builder shared between the lightbox <img> and the post-load preloader
  // so prefetched bytes hit the same cache key the lightbox eventually
  // requests. R2 sources go through the lashpop-img worker so the lightbox
  // gets a width-capped webp variant.
  const lightboxSrc = useCallback((src: string) => {
    const r2 = src.match(/^https?:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/)
    if (r2) {
      return `https://lashpop-img.experial.workers.dev/${r2[1]}?w=1600&q=90`
    }
    return src
  }, [])

  // Warm the lightbox-sized variant of every team photo into the browser
  // cache as soon as photos arrive — without this the first tap waits on a
  // cold CF Image fetch (~250-600 ms). We kick off via requestIdleCallback
  // so the prefetch never competes with hydration or layout. No
  // window.load gate here because the Work With Us page is a route
  // navigation: photos come from a client fetch that resolves AFTER
  // first paint, so by definition the network is in its post-load
  // quiet phase. Waiting for window.load on top of that just adds lag
  // before the first idle tick.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (photos.length === 0) return

    let cancelled = false
    let i = 0

    type IdleCb = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void
    const idle: (cb: IdleCb, opts?: { timeout: number }) => number =
      (window as { requestIdleCallback?: typeof idle }).requestIdleCallback ??
      ((cb) => window.setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 16))

    const prefetch = (idx: number) => {
      if (cancelled || idx >= photos.length) return
      const url = lightboxSrc(photos[idx].filePath)
      const img = new globalThis.Image()
      img.decoding = 'async'
      img.referrerPolicy = 'no-referrer'
      img.src = url
    }

    // First three photos are most likely to be clicked first — warm them
    // synchronously (no idle wait) so an immediate tap is instant.
    prefetch(i++)
    prefetch(i++)
    prefetch(i++)

    const tick = () => {
      if (cancelled || i >= photos.length) return
      prefetch(i++)
      idle(tick, { timeout: 800 })
    }

    idle(tick, { timeout: 1200 })

    return () => {
      cancelled = true
    }
  }, [photos, lightboxSrc])

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const goPrev = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i - 1 + total) % total)),
    [total]
  )
  const goNext = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i + 1) % total)),
    [total]
  )

  // Keyboard navigation + lock body scroll while the lightbox is open
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, closeLightbox, goPrev, goNext])

  if (loading || photos.length === 0) {
    return null
  }

  return (
    <>
      <div ref={ref} className="relative w-full overflow-hidden py-6 md:py-8">
        {/* Carousel Container */}
        <div ref={wheelContainerRef} className="relative w-full">
          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            {/* Embla Container */}
            <div className="flex touch-pan-y gap-4 px-4">
              {displayItems.map((item, index) => (
                <div
                  key={`${index}-${item.filePath}`}
                  className="flex-[0_0_auto] w-56 h-56 md:w-64 md:h-64 min-w-0 cursor-grab active:cursor-grabbing group relative"
                  onClick={() => setLightboxIndex(index % total)}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-2xl bg-warm-sand/20 transform transition-transform duration-300 group-hover:scale-[1.02]">
                    <Image
                      src={item.filePath}
                      alt={`Team photo ${(index % total) + 1}`}
                      fill
                      sizes="(max-width: 768px) 224px, 256px"
                      className="object-cover"
                      draggable={false}
                      placeholder={item.blurDataUrl ? 'blur' : 'empty'}
                      blurDataURL={item.blurDataUrl ?? undefined}
                    />

                    {/* Clean hover - no dark overlay or icon */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gradient edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-ivory to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-ivory to-transparent pointer-events-none z-10" />

          {/* Desktop prev/next — give Corey something to click instead of
              fighting the auto-scroll with a drag. Hidden on touch since
              mobile uses native horizontal swipe. */}
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous photo"
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/85 text-charcoal/70 shadow-md backdrop-blur transition-colors hover:bg-white hover:text-charcoal"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next photo"
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/85 text-charcoal/70 shadow-md backdrop-blur transition-colors hover:bg-white hover:text-charcoal"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Lightbox carousel — swipe / arrows / keyboard to browse all images.
          Matches the home-page Instagram gallery lightbox (minus the
          "View on Instagram" link, since these aren't IG posts). */}
      <AnimatePresence>
        {isOpen && activePhoto && (
          <motion.div
            key="team-lightbox-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={closeLightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              aria-label="Close gallery"
              className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors min-h-0 min-w-0"
            >
              <svg className="w-6 h-6 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Prev */}
            {total > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                aria-label="Previous image"
                className="absolute left-3 md:left-6 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 md:p-3 hover:bg-white transition-colors min-h-0 min-w-0"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next */}
            {total > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                aria-label="Next image"
                className="absolute right-3 md:right-6 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 md:p-3 hover:bg-white transition-colors min-h-0 min-w-0"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Image stage — swipeable. Plain <img> with max-w / max-h so
                the wrapper shrinks to the photo's natural aspect ratio — no
                dark gutters around portrait crops, the rounded card hugs
                the image. We route R2 URLs through the lashpop-img worker
                /cdn-cgi/image manually since Next.js Image fill requires a
                pre-sized parent (which would re-introduce the letterbox). */}
            <motion.div
              key={lightboxIndex}
              className="relative m-4 flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) goNext()
                else if (info.offset.x > 80) goPrev()
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            >
              <img
                src={lightboxSrc(activePhoto.filePath)}
                alt={`Team photo ${lightboxIndex! + 1}`}
                draggable={false}
                className="block rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] select-none pointer-events-none"
                style={{
                  maxWidth: 'min(1200px, 92vw)',
                  maxHeight: '82vh',
                  width: 'auto',
                  height: 'auto',
                }}
              />

              {/* Footer: counter only — Work With Us photos aren't IG posts
                  so there's no permalink to surface. */}
              <div className="mt-3 flex items-center justify-center">
                <span className="text-white/80 text-xs font-sans tracking-wide tabular-nums">
                  {lightboxIndex! + 1} / {total}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
