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
      "M0,150 C200,150 300,50 500,50 C700,50 800,150 1000,150 L1000,300 L0,300 Z",
      "M0,100 C200,120 300,80 500,100 C700,120 800,80 1000,100 L1000,300 L0,300 Z",
      "M0,80 C200,60 300,100 500,80 C700,60 800,100 1000,80 L1000,300 L0,300 Z"
    ]
  )
  
  // Opacity transitions for seamless blending
  const opacity1 = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 0.6, 0.6, 0.3])
  const opacity2 = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.5, 0.8, 0.8, 0.5])
  const opacity3 = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.7, 1, 1, 0.7])
  
  return (
    <div ref={containerRef} className="relative h-[40vh] -mt-32 pointer-events-none overflow-hidden">
      {/* Gradient overlay for smooth color transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cream/30 to-warm-sand/20" />
      
      {/* Multiple wave layers for depth */}
      <svg 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 1000 300"
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
            <stop offset="0%" stopColor="rgb(188,201,194)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(239,227,203)" stopOpacity="0.2" />
          </linearGradient>
          
          <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(226,182,166)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(250,247,241)" stopOpacity="0.5" />
          </linearGradient>
          
          <linearGradient id="wave-gradient-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(250,247,241)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgb(239,227,203)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Floating particles for added depth */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-golden/30 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + i * 10}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}
