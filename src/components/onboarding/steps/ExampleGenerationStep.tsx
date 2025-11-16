/**
 * Example Generation Step - Show AI-generated examples
 */

'use client'

import { motion } from 'framer-motion'
import { Sparkles, Image, Layout, Palette } from 'lucide-react'

interface ExampleGenerationStepProps {
  onNext: (data?: any) => void
  allData: any
}

export function ExampleGenerationStep({ onNext, allData }: ExampleGenerationStepProps) {
  const theme = allData.colors?.theme

  const examples = [
    {
      icon: Layout,
      title: 'Branded Interface',
      description: 'Your custom colors applied throughout the app'
    },
    {
      icon: Palette,
      title: 'Color Harmony',
      description: 'Complementary colors that match your brand'
    },
    {
      icon: Image,
      title: 'Asset Organization',
      description: 'Your imported images ready to use'
    }
  ]

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-dusty-rose to-golden mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-serif text-dune mb-3">Your Brand is Ready!</h2>
        <p className="text-sage">Here's what we've created for you</p>
      </div>

      {/* Example preview */}
      <div
        className="rounded-3xl p-8 mb-8"
        style={{
          background: `linear-gradient(135deg, ${theme?.primaryColor || '#A19781'}, ${theme?.secondaryColor || '#CDA89E'})`
        }}
      >
        <div className="bg-white/95 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            {allData.logo?.logoUrl && (
              <img src={allData.logo.logoUrl} alt="Logo" className="h-8 object-contain" />
            )}
            <h3 className="text-xl font-serif" style={{ color: theme?.textColor }}>
              Your Branded Experience
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.values(theme?.colorPalette || {})
              .slice(0, 6)
              .map((color, i) => (
                <div key={i} className="aspect-square rounded-xl" style={{ backgroundColor: color as string }} />
              ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {examples.map((example, i) => (
          <motion.div
            key={example.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-6"
          >
            <example.icon className="w-8 h-8 text-golden mx-auto mb-3" />
            <h4 className="font-medium text-dune mb-1">{example.title}</h4>
            <p className="text-sm text-sage">{example.description}</p>
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => onNext()}
        className="px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-golden text-white hover:shadow-lg transition-all"
      >
        Continue to Review
      </button>
    </div>
  )
}
