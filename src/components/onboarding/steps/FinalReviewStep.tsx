/**
 * Final Review Step - Summary and completion
 */

'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

interface FinalReviewStepProps {
  onNext: (data?: any) => void
  allData: any
}

export function FinalReviewStep({ onNext, allData }: FinalReviewStepProps) {
  const connectedAccounts = allData.connect?.connectedAccounts?.length || 0
  const importedImages = allData.import?.importedData?.reduce(
    (sum: number, d: any) => sum + (d.importedAssets?.length || 0),
    0
  ) || 0
  const hasTheme = !!allData.colors?.theme
  const hasLogo = !!allData.logo?.logoUrl

  const summary = [
    { label: 'Connected Accounts', value: connectedAccounts, show: connectedAccounts > 0 },
    { label: 'Imported Images', value: importedImages, show: importedImages > 0 },
    { label: 'Custom Theme', value: 'Applied', show: hasTheme },
    { label: 'Logo', value: 'Uploaded', show: hasLogo }
  ].filter((item) => item.show)

  return (
    <div className="max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-dusty-rose to-golden mb-6"
      >
        <Check className="w-10 h-10 text-white" />
      </motion.div>

      <h2 className="text-4xl font-serif text-dune mb-3">You're All Set!</h2>
      <p className="text-lg text-sage mb-12">
        Your personalized brand experience is ready to use
      </p>

      {/* Summary cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        {summary.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-sage mb-1">{item.label}</div>
                <div className="text-2xl font-medium text-dune">{item.value}</div>
              </div>
              <Check className="w-6 h-6 text-golden" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-warm-sand to-ocean-mist/30 rounded-3xl p-8">
        <Sparkles className="w-12 h-12 text-golden mx-auto mb-4" />
        <h3 className="text-xl font-medium text-dune mb-2">
          Ready to explore your branded experience?
        </h3>
        <p className="text-sage mb-6">
          Your custom theme, colors, and assets are ready to use
        </p>
        <button
          onClick={() => onNext()}
          className="px-12 py-4 rounded-full bg-gradient-to-r from-dusty-rose to-golden text-white text-lg font-medium hover:shadow-xl transition-all"
        >
          Launch Your Experience
        </button>
      </div>
    </div>
  )
}
