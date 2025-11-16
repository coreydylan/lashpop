/**
 * Color Scheme Step - Preview and customize color scheme
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Palette, Check, RefreshCw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

interface ColorSchemeStepProps {
  onNext: (data?: any) => void
  allData: any
}

export function ColorSchemeStep({ onNext, allData }: ColorSchemeStepProps) {
  const [theme, setTheme] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const brandData = allData.brand?.brandData

  const generateThemeMutation = useMutation({
    mutationFn: async (applyBrandColors: boolean) => {
      const response = await fetch('/api/onboarding/generate-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyBrandColors })
      })
      if (!response.ok) throw new Error('Failed to generate theme')
      return response.json()
    },
    onSuccess: (data) => {
      setTheme(data.theme)
      setIsGenerating(false)
    }
  })

  useEffect(() => {
    setIsGenerating(true)
    generateThemeMutation.mutate(true)
  }, [])

  const regenerate = () => {
    setIsGenerating(true)
    generateThemeMutation.mutate(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-dune mb-3">Your Custom Color Scheme</h2>
        <p className="text-sage">We've created a palette based on your brand colors</p>
      </div>

      {isGenerating ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-golden mx-auto mb-4" />
          <p className="text-sage">Generating your perfect color scheme...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Color palette preview */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8">
            <h3 className="text-lg font-medium text-dune mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Color Palette
            </h3>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {Object.entries(theme?.colorPalette || {}).map(([name, color]) => (
                <div key={name} className="text-center">
                  <div
                    className="w-full aspect-square rounded-2xl mb-2 shadow-lg"
                    style={{ backgroundColor: color as string }}
                  />
                  <div className="text-xs text-sage capitalize">{name.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="text-xs font-mono text-dune">{color as string}</div>
                </div>
              ))}
            </div>

            {/* Theme preview */}
            <div className="bg-gradient-to-br rounded-2xl p-6 mb-6" style={{
              background: `linear-gradient(135deg, ${theme?.primaryColor}, ${theme?.secondaryColor})`
            }}>
              <div className="bg-white/90 rounded-xl p-6">
                <h4 className="text-xl font-serif mb-2" style={{ color: theme?.textColor }}>
                  {theme?.themeName}
                </h4>
                <p style={{ color: theme?.textSecondaryColor }}>
                  This is how your brand colors will look throughout the interface
                </p>
                <div className="flex gap-2 mt-4">
                  <div className="px-4 py-2 rounded-full text-white" style={{ backgroundColor: theme?.primaryColor }}>
                    Primary
                  </div>
                  <div className="px-4 py-2 rounded-full text-white" style={{ backgroundColor: theme?.accentColor }}>
                    Accent
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={regenerate}
              className="w-full py-3 rounded-2xl border border-sage/20 text-sage hover:bg-warm-sand transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Different Scheme
            </button>
          </div>

          <button
            onClick={() => onNext({ theme })}
            className="w-full px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-golden text-white hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Apply This Color Scheme
          </button>
        </motion.div>
      )}
    </div>
  )
}
