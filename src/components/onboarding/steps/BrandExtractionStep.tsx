/**
 * Brand Extraction Step - AI analyzes imported content
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Sparkles, Palette, Type } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

interface BrandExtractionStepProps {
  onNext: (data?: any) => void
}

export function BrandExtractionStep({ onNext }: BrandExtractionStepProps) {
  const [extractionComplete, setExtractionComplete] = useState(false)
  const [brandData, setBrandData] = useState<any>(null)

  const extractMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/onboarding/extract-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (!response.ok) throw new Error('Failed to extract brand')
      return response.json()
    },
    onSuccess: (data) => {
      setBrandData(data.brandData)
      setExtractionComplete(true)
    }
  })

  useEffect(() => {
    extractMutation.mutate()
  }, [])

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-serif text-dune mb-3">Analyzing Your Brand</h2>
      <p className="text-sage mb-12">Our AI is extracting your unique brand identity</p>

      {!extractionComplete ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12">
          <Loader2 className="w-16 h-16 animate-spin text-golden mx-auto mb-6" />
          <p className="text-sage">Analyzing images and extracting brand elements...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8">
            <Sparkles className="w-12 h-12 text-golden mx-auto mb-4" />
            <h3 className="text-xl font-medium text-dune mb-6">Brand Analysis Complete!</h3>

            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="bg-warm-sand rounded-2xl p-4">
                <Palette className="w-6 h-6 text-golden mb-2" />
                <div className="text-sm text-sage mb-1">Colors</div>
                <div className="flex gap-2">
                  {brandData?.colorPalette?.colors?.slice(0, 5).map((color: string, i: number) => (
                    <div key={i} className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>

              <div className="bg-warm-sand rounded-2xl p-4">
                <Type className="w-6 h-6 text-golden mb-2" />
                <div className="text-sm text-sage mb-1">Style</div>
                <div className="text-sm font-medium text-dune">{brandData?.brandPersonality}</div>
              </div>

              <div className="bg-warm-sand rounded-2xl p-4">
                <Sparkles className="w-6 h-6 text-golden mb-2" />
                <div className="text-sm text-sage mb-1">Keywords</div>
                <div className="text-xs text-dune">{brandData?.brandKeywords?.slice(0, 3).join(', ')}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNext({ brandData })}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-golden text-white hover:shadow-lg transition-all"
          >
            Continue to Color Scheme
          </button>
        </motion.div>
      )}
    </div>
  )
}
