'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'
import { SunIcon, CircleDecoration } from '../icons/DesertIcons'

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  
  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Soft gradient background - adjusted to blend better with transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgb(250,247,241)] via-[rgb(235,224,203)] to-[rgb(226,182,166)]" />

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

        {/* Additional floating element for smoother transition */}
        <motion.div
          style={{ y: useTransform(scrollY, [0, 500], [0, -60]) }}
          className="absolute bottom-32 right-20 w-16 h-16 md:w-24 md:h-24 opacity-50"
        >
          <CircleDecoration className="text-golden" />
        </motion.div>
      </div>
      
      {/* Main Content */}
      <motion.div 
        style={{ opacity }}
        className="relative z-10 container-wide"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-screen py-32">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
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
            
            {/* Main heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="h1 text-dune"
            >
              Where natural beauty
              <span className="block text-dusty-rose italic">
                meets artistry
              </span>
            </motion.h1>
            
            {/* Description */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="body-lg text-dune/80 max-w-md"
            >
              A sanctuary for lash artistry where each appointment becomes 
              a moment of tranquil transformation.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <button className="btn btn-primary">
                Book Appointment
              </button>
              <button className="btn btn-secondary">
                View Services
              </button>
            </motion.div>
            
            {/* Trust indicators */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex items-center gap-6 pt-8 border-t border-sage/20"
            >
              <div>
                <p className="text-2xl font-light text-golden">500+</p>
                <p className="caption text-dune/60">Happy Clients</p>
              </div>
              <div className="w-px h-10 bg-sage/20" />
              <div>
                <p className="text-2xl font-light text-golden">8+</p>
                <p className="caption text-dune/60">Years Experience</p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right Content - Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative">
              {/* Arch-shaped image container */}
              <div className="relative w-full aspect-[4/5] rounded-[200px_200px_0_0] overflow-hidden">
                <Image
                  src="/lashpop-images/studio/studio-photos-by-salome.jpg"
                  alt="LashPop Studio Interior"
                  fill
                  className="object-cover"
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
      
      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="caption text-dune/60">Scroll to explore</span>
          <div className="w-5 h-8 rounded-full border border-sage/30 flex justify-center pt-2">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-1 rounded-full bg-sage"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}