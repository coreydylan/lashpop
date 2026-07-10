'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { AnimatePresence, motion } from 'framer-motion'
import { useCarouselWheelScroll } from '@/hooks/useCarouselWheelScroll'
import { useEdgeHoverScroll } from '@/hooks/useEdgeHoverScroll'
import { SectionRule } from '../SectionRule'

// Stub data using gallery images for now
const galleryImages = [
  '/lashpop-images/gallery/gallery-075b32b2.jpg',
  '/lashpop-images/gallery/gallery-1b1e9a79.jpg',
  '/lashpop-images/gallery/gallery-img-1754.jpg',
  '/lashpop-images/gallery/gallery-img-3405.jpeg',
  '/lashpop-images/gallery/gallery-img-3961.jpeg',
  '/lashpop-images/gallery/gallery-img-3962.jpeg',
  '/lashpop-images/gallery/gallery-img-3973.jpeg',
  '/lashpop-images/gallery/gallery-img-3974.jpeg',
  '/lashpop-images/gallery/gallery-img-7044.jpg',
  '/lashpop-images/gallery/gallery-lash-40.jpeg',
  '/lashpop-images/gallery/lash-102.jpeg',
  '/lashpop-images/gallery/lash-136.jpeg',
  '/lashpop-images/gallery/lash-92.jpeg',
]

interface InstagramPost {
  id: string
  mediaUrl: string
  permalink: string
  caption: string | null
}

interface InstagramCarouselProps {
  posts?: InstagramPost[]
  // Admin (instagram_carousel) settings. autoScroll toggles the marquee;
  // scrollSpeed is the admin's 10–40 value, mapped to an Embla speed.
  autoScroll?: boolean
  scrollSpeed?: number
}

interface GalleryItem {
  mediaUrl: string
  permalink: string | null
  caption: string | null
}

export function InstagramCarousel({ posts = [], autoScroll = true, scrollSpeed = 20 }: InstagramCarouselProps) {
  const ref = useRef(null)
  // Index into the (un-duplicated) source list, or null when the lightbox is closed
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // Map the admin's 10–40 scroll-speed value to an Embla auto-scroll speed
  // (~1.0–4.0 px/frame). Disable the plugin entirely when auto-scroll is off.
  const plugins = useMemo(() => {
    if (!autoScroll) return []
    const emblaSpeed = Math.max(0.5, Math.min(4, scrollSpeed * 0.1))
    return [
      AutoScroll({
        playOnInit: true,
        speed: emblaSpeed,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        rootNode: (emblaRoot: HTMLElement) => emblaRoot.parentElement,
      }),
    ]
  }, [autoScroll, scrollSpeed])

  // Initialize Embla with AutoScroll (wheel gestures handled by useCarouselWheelScroll)
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true, // Keeps the "free scroll" feel
      containScroll: false, // Allow infinite scroll without hard bounds
      align: 'center',
      skipSnaps: true,
      inViewThreshold: 0.7 // Better intersection handling
    },
    plugins
  )

  // Hover-based wheel scroll - only captures wheel events when hovering
  const { wheelContainerRef } = useCarouselWheelScroll(emblaApi)
  // Desktop: hovering the left/right edge of the strip crawls it that way.
  const { edgeScrollRef } = useEdgeHoverScroll(emblaApi)

  // Use provided posts or fallback to gallery images
  const rawItems: GalleryItem[] = posts.length > 0
    ? posts.map(p => ({ mediaUrl: p.mediaUrl, permalink: p.permalink, caption: p.caption }))
    : galleryImages.map(url => ({ mediaUrl: url, permalink: null, caption: null }))

  // Triple the items to ensure absolutely seamless infinite scroll on large screens
  const displayItems = [...rawItems, ...rawItems, ...rawItems]

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

  // Warm the lightbox-sized variant of every gallery photo into the browser
  // cache after the rest of the page has finished loading, so the first tap
  // on a card opens instantly instead of waiting for a cold CF Image fetch.
  // Waits on the window `load` event (so we don't fight first-paint or any
  // priority hero/team images) and then drips one fetch per idle slot.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (rawItems.length === 0) return

    let cancelled = false
    let i = 0

    type IdleCb = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void
    const idle: (cb: IdleCb, opts?: { timeout: number }) => number =
      (window as { requestIdleCallback?: typeof idle }).requestIdleCallback ??
      ((cb) => window.setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 16))

    // STRICTLY serialized, low-priority prefetch: on a cold edge cache each
    // lightbox variant is a ~1s worker transform, so parallel prefetches
    // saturate the connection pool and visible images queue behind them.
    // One request at a time, fetchPriority=low, next starts only after the
    // previous finishes.
    const prefetch = (idx: number, done: () => void) => {
      if (cancelled || idx >= rawItems.length) return
      const url = lightboxSrc(rawItems[idx].mediaUrl)
      // new Image() triggers a real GET that lands in the browser cache.
      // We don't keep the reference — once the response is cached, the
      // lightbox <img> with the same src hits the cache instantly.
      const img = new globalThis.Image()
      img.decoding = 'async'
      img.referrerPolicy = 'no-referrer'
      ;(img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'low'
      img.onload = img.onerror = () => done()
      img.src = url
    }

    const tick = () => {
      if (cancelled || i >= rawItems.length) return
      prefetch(i++, () => idle(tick, { timeout: 2000 }))
    }

    const start = () => {
      if (cancelled) return
      // 3s runway so visible images (which may also be cold) finish first.
      window.setTimeout(() => idle(tick, { timeout: 2000 }), 3000)
    }

    if (document.readyState === 'complete') {
      start()
    } else {
      window.addEventListener('load', start, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener('load', start)
    }
  }, [rawItems, lightboxSrc])

  const total = rawItems.length
  const isOpen = lightboxIndex !== null
  const activeItem = isOpen ? rawItems[lightboxIndex] : null

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

  return (
    <>
      <section ref={ref} id="gallery" className="relative py-12 md:py-20 overflow-hidden bg-ivory">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2
            className="text-2xl md:text-5xl font-display font-medium tracking-wide mb-4 md:mb-6"
            style={{ color: '#cc947f' }}
          >
            Gallery
          </h2>
          <SectionRule />
        </div>

        {/* Carousel Container */}
        <div
          ref={(node) => { wheelContainerRef(node); edgeScrollRef(node) }}
          className="relative w-full"
        >
          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            {/* Embla Container */}
            <div className="flex touch-pan-y gap-4 px-4">
              {displayItems.map((item, index) => (
                <div
                  key={`${index}-${item.mediaUrl}`}
                  className="flex-[0_0_auto] w-80 h-80 min-w-0 cursor-pointer group relative"
                  onClick={() => setLightboxIndex(index % total)}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-2xl bg-cream transform transition-transform duration-300 group-hover:scale-[1.02]">
                    <Image
                      src={item.mediaUrl}
                      alt={`Gallery image ${(index % total) + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="object-cover transition-opacity duration-300 ease-out"
                      style={{ opacity: loadedImages.has(item.mediaUrl) ? 1 : 0 }}
                      draggable={false}
                      onLoad={() => setLoadedImages((prev) => {
                        if (prev.has(item.mediaUrl)) return prev
                        const next = new Set(prev)
                        next.add(item.mediaUrl)
                        return next
                      })}
                    />

                    {/* Clean hover - no dark overlay or icon */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gradient edges for seamless look */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-cream to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-cream to-transparent pointer-events-none z-10" />
        </div>

        {/* Follow Button - Below Carousel */}
        <div className="mt-10 md:mt-12">
          <div className="flex justify-center px-4">
            <a
              href="https://instagram.com/lashpopstudios"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* Frosted Glass Badge with Emboss/Deboss Effect */}
              <div className="relative group">
                {/* Subtle outer glow/shadow */}
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />

                {/* Main badge */}
                <div className="relative px-5 py-3 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] transition-[background-color] duration-300 group-hover:bg-white/60">
                  <div className="flex items-center gap-3">
                    {/* Instagram Icon */}
                    <svg className="w-5 h-5" style={{ color: '#cc947f' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                    </svg>

                    {/* Vertical Divider */}
                    <div className="h-5 w-px bg-gradient-to-b from-transparent via-sage/20 to-transparent" />

                    {/* Text */}
                    <span className="font-sans text-sm font-medium tracking-tight" style={{ color: '#cc947f' }}>
                      Follow @lashpopstudios
                    </span>

                    {/* Arrow Icon */}
                    <svg className="w-4 h-4 text-dune/60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Lightbox carousel — swipe / arrows / keyboard to browse all images */}
      <AnimatePresence>
        {isOpen && activeItem && (
          <motion.div
            key="gallery-lightbox-backdrop"
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
                src={lightboxSrc(activeItem.mediaUrl)}
                alt={activeItem.caption ?? `Gallery image ${lightboxIndex! + 1}`}
                draggable={false}
                className="block rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] select-none pointer-events-none"
                style={{
                  maxWidth: 'min(1200px, 92vw)',
                  maxHeight: '82vh',
                  width: 'auto',
                  height: 'auto',
                }}
              />

              {/* Footer: counter + optional View on Instagram */}
              <div className="mt-3 flex items-center justify-center gap-4">
                <span className="text-white/80 text-xs font-sans tracking-wide tabular-nums">
                  {lightboxIndex! + 1} / {total}
                </span>
                {activeItem.permalink && (
                  <a
                    href={activeItem.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 hover:text-white transition-colors min-h-0 min-w-0"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                    </svg>
                    View on Instagram
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
