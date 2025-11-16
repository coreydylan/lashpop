/**
 * Onboarding Wizard Component
 *
 * Multi-step wizard that guides users through:
 * 1. Welcome
 * 2. Connect accounts (Instagram, website, etc.)
 * 3. Scrape and import data
 * 4. AI brand extraction
 * 5. Color scheme generation
 * 6. Logo setup
 * 7. Example generation
 * 8. Final review
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WelcomeStep } from './steps/WelcomeStep'
import { ConnectAccountsStep } from './steps/ConnectAccountsStep'
import { ImportDataStep } from './steps/ImportDataStep'
import { BrandExtractionStep } from './steps/BrandExtractionStep'
import { ColorSchemeStep } from './steps/ColorSchemeStep'
import { LogoSetupStep } from './steps/LogoSetupStep'
import { ExampleGenerationStep } from './steps/ExampleGenerationStep'
import { FinalReviewStep } from './steps/FinalReviewStep'

interface OnboardingWizardProps {
  initialProgress?: any
  onComplete: () => void
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'connect', title: 'Connect Accounts', component: ConnectAccountsStep },
  { id: 'import', title: 'Import Data', component: ImportDataStep },
  { id: 'brand', title: 'Brand Extraction', component: BrandExtractionStep },
  { id: 'colors', title: 'Color Scheme', component: ColorSchemeStep },
  { id: 'logo', title: 'Logo Setup', component: LogoSetupStep },
  { id: 'examples', title: 'Generate Examples', component: ExampleGenerationStep },
  { id: 'review', title: 'Final Review', component: FinalReviewStep }
]

export function OnboardingWizard({ initialProgress, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialProgress?.currentStep || 0)
  const [stepData, setStepData] = useState<Record<string, any>>(initialProgress?.stepData || {})
  const [isAnimating, setIsAnimating] = useState(false)

  const CurrentStepComponent = STEPS[currentStep].component

  const handleNext = async (data?: any) => {
    if (data) {
      setStepData((prev) => ({ ...prev, [STEPS[currentStep].id]: data }))
    }

    if (currentStep < STEPS.length - 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        updateProgress(currentStep + 1, data)
        setIsAnimating(false)
      }, 300)
    } else {
      // Completed
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsAnimating(false)
      }, 300)
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  const updateProgress = async (step: number, data?: any) => {
    const completionPercentage = Math.round(((step + 1) / STEPS.length) * 100)

    await fetch('/api/onboarding/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentStep: step,
        status: 'in_progress',
        stepData: { ...stepData, ...data },
        completionPercentage
      })
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-sage/20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-dune">
              Step {currentStep + 1} of {STEPS.length}
            </h2>
            <span className="text-sm text-sage">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}% Complete
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-warm-sand rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-dusty-rose to-golden"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => {
                  if (index <= currentStep) {
                    setCurrentStep(index)
                  }
                }}
                className={`flex-1 text-xs text-center transition-colors ${
                  index === currentStep
                    ? 'text-dune font-medium'
                    : index < currentStep
                      ? 'text-sage cursor-pointer hover:text-dune'
                      : 'text-sage/40'
                }`}
              >
                {step.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                data={stepData[STEPS[currentStep].id]}
                allData={stepData}
                onNext={handleNext}
                onBack={handleBack}
                onSkip={handleSkip}
                isFirst={currentStep === 0}
                isLast={currentStep === STEPS.length - 1}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-lg border-t border-sage/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-warm-sand text-dune'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex gap-3">
            {currentStep < STEPS.length - 1 && (
              <button
                onClick={handleSkip}
                className="px-6 py-3 rounded-full text-sage hover:bg-warm-sand transition-all"
              >
                Skip for now
              </button>
            )}

            <button
              onClick={() => handleNext()}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-golden text-white hover:shadow-lg transition-all"
            >
              {currentStep === STEPS.length - 1 ? 'Complete' : 'Continue'}
              {currentStep < STEPS.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
