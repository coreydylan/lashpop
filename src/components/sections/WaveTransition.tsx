'use client'

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef } from 'react'

export function WaveTransition() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY, scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })
  
  // Create multiple layers of parallax for depth
  const y1 = useTransform(scrollY, [0, 1000], [0, -120])
  const y2 = useTransform(scrollY, [0, 1000], [0, -80])
  const y3 = useTransform(scrollY, [0, 1000], [0, -40])
  
  // Smooth spring animations
  const springY1 = useSpring(y1, { stiffness: 100, damping: 30 })
  const springY2 = useSpring(y2, { stiffness: 120, damping: 25 })
  const springY3 = useSpring(y3, { stiffness: 150, damping: 20 })
  
  // Dynamic path morphing based on scroll
  const pathMorph = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [
      "M0,200 C300,200 400,100 600,120 C800,140 900,200 1200,180 L1200,400 L0,400 Z",
      "M0,150 C250,170 350,120 550,140 C750,160 850,120 1100,140 L1100,400 L0,400 Z",
      "M0,120 C200,100 350,160 500,140 C650,120 800,160 1000,140 L1000,400 L0,400 Z"
    ]
  )
  
  // Opacity transitions for seamless blending
  const opacity1 = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.2, 0.5, 0.7, 0.4, 0.2])
  const opacity2 = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.4, 0.7, 0.9, 0.6, 0.3])
  const opacity3 = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.6, 0.9, 1, 0.8, 0.4])
  
  return (
    <div ref={containerRef} className="relative h-[50vh] pointer-events-none overflow-hidden">
      {/* Gradient overlay for smooth color transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cream/20 to-warm-sand/30" />
      
      {/* Multiple wave layers for depth */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 1200 400"
      >
        {/* Back layer - slowest parallax */}
        <motion.path
          d={pathMorph}
          fill="url(#wave-gradient-1)"
          style={{ 
            y: springY1,
            opacity: opacity1
          }}
        />
        
        {/* Middle layer */}
        <motion.path
          d="M0,120 C250,140 350,60 500,80 C650,100 750,140 1000,120 L1000,300 L0,300 Z"
          fill="url(#wave-gradient-2)"
          style={{ 
            y: springY2,
            opacity: opacity2
          }}
        />
        
        {/* Front layer - fastest parallax */}
        <motion.path
          d="M0,160 C150,140 350,180 500,160 C650,140 850,180 1000,160 L1000,300 L0,300 Z"
          fill="url(#wave-gradient-3)"
          style={{ 
            y: springY3,
            opacity: opacity3
          }}
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(226,182,166)" stopOpacity="0.6" />
            <stop offset="50%" stopColor="rgb(239,227,203)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgb(250,247,241)" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(239,227,203)" stopOpacity="0.7" />
            <stop offset="50%" stopColor="rgb(250,247,241)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="rgb(254,252,245)" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="wave-gradient-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(250,247,241)" stopOpacity="0.9" />
            <stop offset="50%" stopColor="rgb(254,252,245)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgb(248,244,235)" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Floating particles for added depth */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-golden/25 rounded-full"
          style={{
            left: `${15 + i * 12}%`,
            top: `${25 + i * 8}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}
