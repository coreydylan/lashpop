'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Clock, Sparkles, Heart } from 'lucide-react'
import { MagicMirror } from './MagicMirror'

interface LashEducationProps {
  onComplete: (selectedStyle?: string) => void
}

const lashStyles = [
  {
    id: 'classic',
    title: 'Classic',
    tagline: 'The Natural Choice',
    description: 'One extension applied to each natural lash for a refined, elegant look. Perfect for those who want to enhance their natural beauty without drama.',
    timeNeeded: '90 minutes',
    bestFor: 'Natural, everyday elegance',
    retention: '4-6 weeks'
  },
  {
    id: 'hybrid',
    title: 'Hybrid',
    tagline: 'Best of Both Worlds',
    description: 'A 50/50 blend of classic and volume techniques creates a textured, medium-full look with natural dimension. The most popular choice.',
    timeNeeded: '120 minutes',
    bestFor: 'Textured, medium-full look',
    retention: '4-6 weeks'
  },
  {
    id: 'volume',
    title: 'Volume',
    tagline: 'Maximum Drama',
    description: 'Multiple lightweight extensions fanned and applied to each natural lash for a full, fluffy, dramatic effect. Wake up with glamorous lashes.',
    timeNeeded: '150 minutes',
    bestFor: 'Full, dramatic glamour',
    retention: '4-6 weeks'
  }
]

export function LashEducation({ onComplete }: LashEducationProps) {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [showMirror, setShowMirror] = useState(false)

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId)
  }

  const handleContinue = () => {
    onComplete(selectedStyle || undefined)
  }

  return (
    <section className="py-[var(--space-xl)] bg-gradient-to-b from-cream via-warm-sand/10 to-cream">
      <div className="container max-w-6xl">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 space-y-4"
        >
          <span className="caption text-terracotta">Welcome to Lash Extensions</span>
          <h2 className="h2 text-dune">Your First Lash Experience</h2>
          <p className="body-lg text-dune/70 max-w-2xl mx-auto">
            New to lash extensions? Let&apos;s help you understand the process and find your perfect style.
          </p>
        </motion.div>

        {/* What to Expect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass arch-full p-8 mb-12"
        >
          <h3 className="h3 text-dune mb-6 text-center">What to Expect</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage to-ocean-mist flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-dune">Relaxing Process</h4>
              <p className="text-sm text-dune/70">Lie back and relax while your artist works their magic. Many clients even fall asleep!</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage to-ocean-mist flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-dune">Customized for You</h4>
              <p className="text-sm text-dune/70">Your artist will customize length, curl, and thickness to complement your unique features.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage to-ocean-mist flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-dune">Long-Lasting Results</h4>
              <p className="text-sm text-dune/70">Enjoy beautiful lashes for 4-6 weeks with proper care and regular fills.</p>
            </div>
          </div>
        </motion.div>

        {/* The Three Styles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h3 className="h3 text-dune mb-8 text-center">Choose Your Style</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {lashStyles.map((style, index) => (
              <motion.button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  glass arch-full p-6 text-left transition-all duration-300
                  ${selectedStyle === style.id
                    ? 'ring-2 ring-sage shadow-xl bg-gradient-to-br from-sage/10 to-ocean-mist/10'
                    : 'hover:shadow-lg'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="h4 text-dune">{style.title}</h4>
                    <p className="caption text-terracotta">{style.tagline}</p>
                  </div>
                  {selectedStyle === style.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-sage to-ocean-mist flex items-center justify-center"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
                <p className="body text-dune/80 mb-4">{style.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dune/60">Time needed:</span>
                    <span className="font-medium text-dune">{style.timeNeeded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dune/60">Best for:</span>
                    <span className="font-medium text-dune">{style.bestFor}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Important Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="glass arch-soft p-6 mb-12 text-center"
        >
          <p className="body text-dune/80">
            <strong className="text-dune">Why book by style?</strong> Each style requires a different amount of time.
            Don&apos;t worry about the finer details like exact length and curl – you&apos;ll work with your lash artist
            in person to create your perfect custom look!
          </p>
        </motion.div>

        {/* Magic Mirror Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12"
        >
          <MagicMirror onStyleSelect={handleStyleSelect} selectedStyle={selectedStyle} />
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center"
        >
          <button
            onClick={handleContinue}
            className="btn btn-primary"
          >
            {selectedStyle ? 'Explore Services' : 'Skip to Services'}
          </button>
        </motion.div>
      </div>
    </section>
  )
}
