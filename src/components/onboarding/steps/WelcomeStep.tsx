/**
 * Welcome Step
 *
 * Introduction to the onboarding process
 */

'use client'

import { motion } from 'framer-motion'
import { Sparkles, Palette, Image, Wand2 } from 'lucide-react'

interface WelcomeStepProps {
  onNext: (data?: any) => void
  onBack: () => void
  onSkip: () => void
  isFirst: boolean
  isLast: boolean
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: Image,
      title: 'Connect Your Brand',
      description: 'Link your Instagram, website, or upload images to get started'
    },
    {
      icon: Sparkles,
      title: 'AI Brand Extraction',
      description: 'Our AI analyzes your content to understand your brand aesthetic'
    },
    {
      icon: Palette,
      title: 'Custom Color Scheme',
      description: 'Generate a personalized color palette that matches your brand'
    },
    {
      icon: Wand2,
      title: 'Magical Examples',
      description: 'See your brand come to life with AI-generated examples'
    }
  ]

  return (
    <div className="text-center max-w-3xl mx-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-dusty-rose to-golden mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-4xl md:text-5xl font-serif text-dune mb-4">
          Welcome to Your Brand Journey
        </h1>

        <p className="text-lg text-sage max-w-2xl mx-auto">
          Let's create a personalized experience that reflects your unique brand. This will only
          take a few minutes, and you can always customize later.
        </p>
      </motion.div>

      {/* Features grid */}
      <div className="grid md:grid-cols-2 gap-6 mt-12">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 text-left border border-sage/10"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-warm-sand mb-4">
              <feature.icon className="w-6 h-6 text-golden" />
            </div>
            <h3 className="text-lg font-medium text-dune mb-2">{feature.title}</h3>
            <p className="text-sm text-sage">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12"
      >
        <button
          onClick={() => onNext()}
          className="px-12 py-4 rounded-full bg-gradient-to-r from-dusty-rose to-golden text-white text-lg font-medium hover:shadow-xl transition-all"
        >
          Let's Get Started
        </button>
      </motion.div>
    </div>
  )
}
