'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'
import { useDrawer } from '../drawers/DrawerContext'
import { usePanelStack } from '@/contexts/PanelStackContext'
import { GoogleLogoCompact, YelpLogoCompact, VagaroLogoCompact } from '@/components/icons/ReviewLogos'

interface HeroSectionProps {
  reviewStats?: Array<{
    id: string
    source: string
    rating: string
    reviewCount: number
  }>
}

// Import the exact same icons from v1
function SunIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"
        strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function CircleDecoration({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
    </svg>
  )
}

export default function HeroSection({ reviewStats }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll({ layoutEffect: false } as any)
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const { actions: panelActions } = usePanelStack()

  // Calculate total reviews
  const totalReviews = reviewStats?.reduce((sum, stat) => sum + stat.reviewCount, 0) || 0

  return (
    <section ref={containerRef} className="relative h-screen flex items-end">
      {/* Background Elements - EXACT same as v1 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Soft gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-[rgb(235,224,203)] to-[rgb(226,182,166)]" />

        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-sage/5" />

        {/* Floating circles with enhanced parallax */}
        <motion.div
          style={{ y }}
          className="absolute top-10 right-10 w-32 h-32 md:w-48 md:h-48"
        >
          <CircleDecoration className="text-dusty-rose" />
        </motion.div>

        <motion.div
          style={{ y: useTransform(scrollY, [0, 500], [0, -100]) }}
          className="absolute bottom-40 left-10 w-24 h-24 md:w-36 md:h-36"
        >
          <CircleDecoration className="text-sage" />
        </motion.div>

        {/* Additional floating element */}
        <motion.div
          style={{ y: useTransform(scrollY, [0, 500], [0, -60]) }}
          className="absolute bottom-32 right-20 w-16 h-16 md:w-24 md:h-24 opacity-50"
        >
          <CircleDecoration className="text-golden" />
        </motion.div>
      </div>

      {/* Main Content - EXACT same layout as v1 */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 container-wide"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-end h-full pb-0">
          {/* Left Content - Moved up with margin-bottom */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 mb-[20vh]"
          >
            {/* Small accent */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex items-center gap-2 text-golden"
            >
              <SunIcon className="w-5 h-5" />
              <span className="caption">Oceanside, California</span>
            </motion.div>

            {/* Main heading - Using serif font */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="font-serif text-dune"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, lineHeight: 1.2 }}
            >
              Welcome to LashPop Studios
              <span className="block text-dusty-rose italic mt-2">
                Effortless Beauty for the Modern Woman
              </span>
            </motion.h1>

            {/* Beautiful Reviews Chip with Logos */}
            {totalReviews > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="inline-block"
              >
                <div className="relative group">
                  {/* Subtle outer glow */}
                  <div className="absolute inset-0 rounded-full bg-golden/10 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />

                  {/* Main chip */}
                  <div className="relative px-3 py-1.5 rounded-full bg-white/40 backdrop-blur-sm border border-white/50 shadow-sm">
                    <div className="flex items-center gap-2">
                      {/* Platform Logos - Using compact components */}
                      <div className="flex items-center gap-0.5 pr-2 border-r border-dune/20">
                        <GoogleLogoCompact />
                        <YelpLogoCompact />
                        <VagaroLogoCompact />
                      </div>

                      {/* Review Count and Stars */}
                      <div className="flex items-center gap-1">
                        <span className="font-serif text-sm font-semibold text-dune">
                          {totalReviews.toLocaleString()}
                        </span>
                        {/* Five stars */}
                        <div className="flex items-center -space-x-0.5">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-3.5 h-3.5 text-golden" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="font-serif text-xs text-dune ml-0.5">
                          Reviews
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="font-serif text-lg text-dune/80 max-w-md"
            >
              A collective of women-owned beauty businesses
            </motion.p>

            {/* CTA Buttons - Book Now opens panel stack, Discover opens drawer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <button
                onClick={() => panelActions.openPanel('category-picker', { entryPoint: 'hero' })}
                className="btn btn-primary"
              >
                Book Now
              </button>
              <button
                onClick={() => panelActions.openPanel('discovery', {})}
                className="btn btn-secondary"
              >
                Discover Your Look
              </button>
            </motion.div>
          </motion.div>

          {/* Right Content - Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full flex items-end"
          >
            <div className="relative w-full">
              {/* Arch-shaped image container - extends to bottom */}
              <div className="relative w-full h-[85vh] rounded-[200px_200px_0_0] overflow-hidden">
                <Image
                  src="/lashpop-images/studio/studio-photos-by-salome.jpg"
                  alt="LashPop Studio Interior"
                  fill
                  className="object-cover object-right"
                  priority
                  quality={85}
                />
                {/* Soft overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-mist/20 to-transparent" />
              </div>

              {/* Floating accent element */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-warm-sand/50 blur-2xl"
              />

              {/* Text overlay */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute bottom-8 left-8 right-8 glass rounded-2xl p-6"
              >
                <p className="caption text-terracotta mb-2">Award Winning</p>
                <p className="text-lg font-light text-dune">Best Lash Studio • North County SD</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

    </section>
  )
}