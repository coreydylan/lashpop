'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { LashEducation } from './LashEducation'

const serviceCategories = [
  { id: 'lashes', label: 'LASHES' },
  { id: 'brows', label: 'BROWS' },
  { id: 'skincare', label: 'SKINCARE' },
  { id: 'waxing', label: 'WAXING' },
  { id: 'permanent-makeup', label: 'PERMANENT MAKEUP' },
  { id: 'permanent-jewelry', label: 'PERMANENT JEWELRY' },
  { id: 'injectables', label: 'INJECTABLES' }
]

const lashStyles = [
  { id: 'classic', label: 'CLASSIC', description: 'Natural, elegant look' },
  { id: 'hybrid', label: 'HYBRID', description: 'Textured, medium-full' },
  { id: 'volume', label: 'VOLUME', description: 'Full, dramatic look' }
]

type QuizStep = 'categories' | 'lash-experience' | 'lash-style' | 'education' | 'complete'

interface QuizState {
  selectedCategories: string[]
  hasLashExperience: boolean | null
  lashStyle: string | null
  showEducation: boolean
}

export function ServiceDiscoveryQuiz() {
  const [currentStep, setCurrentStep] = useState<QuizStep>('categories')
  const [quizState, setQuizState] = useState<QuizState>({
    selectedCategories: [],
    hasLashExperience: null,
    lashStyle: null,
    showEducation: false
  })

  const toggleCategory = (categoryId: string) => {
    setQuizState(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }))
  }

  const handleCategoryContinue = () => {
    if (quizState.selectedCategories.length === 0) return

    // If lashes is selected, go to lash-specific questions
    if (quizState.selectedCategories.includes('lashes')) {
      setCurrentStep('lash-experience')
    } else {
      // Otherwise, go straight to filtered services
      handleComplete()
    }
  }

  const handleLashExperience = (hasExperience: boolean) => {
    setQuizState(prev => ({ ...prev, hasLashExperience: hasExperience }))

    if (hasExperience) {
      setCurrentStep('lash-style')
    } else {
      setQuizState(prev => ({ ...prev, showEducation: true }))
      setCurrentStep('education')
    }
  }

  const handleLashStyleSelect = (styleId: string) => {
    setQuizState(prev => ({ ...prev, lashStyle: styleId }))
    handleComplete()
  }

  const handleEducationComplete = (selectedStyle?: string) => {
    if (selectedStyle) {
      setQuizState(prev => ({ ...prev, lashStyle: selectedStyle }))
    }
    handleComplete()
  }

  const handleComplete = () => {
    setCurrentStep('complete')
    // Emit event with quiz results for the services section to pick up
    const event = new CustomEvent('service-quiz-complete', {
      detail: quizState
    })
    window.dispatchEvent(event)

    // Scroll to services section
    setTimeout(() => {
      const servicesSection = document.getElementById('services')
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 300)
  }

  if (currentStep === 'complete') {
    return null
  }

  if (currentStep === 'education') {
    return <LashEducation onComplete={handleEducationComplete} />
  }

  return (
    <section id="discover-your-look" className="py-[var(--space-xl)] bg-gradient-to-b from-cream via-warm-sand/10 to-cream">
      <div className="container max-w-4xl">
        <AnimatePresence mode="wait">
          {currentStep === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <span className="caption text-terracotta">Step 1 of 3</span>
                <h2 className="h2 text-dune">What services are you interested in?</h2>
                <p className="body-lg text-dune/70">Select all that apply</p>
              </div>

              {/* Category Chips */}
              <div className="flex flex-wrap gap-4 justify-center">
                {serviceCategories.map((category) => {
                  const isSelected = quizState.selectedCategories.includes(category.id)
                  return (
                    <motion.button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        relative px-6 py-4 rounded-full font-medium transition-all duration-300
                        ${isSelected
                          ? 'bg-gradient-to-r from-sage to-ocean-mist text-white shadow-lg'
                          : 'glass hover:bg-warm-sand/20 text-dune'
                        }
                      `}
                    >
                      <span className="flex items-center gap-2">
                        {category.label}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        )}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              {/* Continue Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: quizState.selectedCategories.length > 0 ? 1 : 0.5 }}
                className="text-center pt-8"
              >
                <button
                  onClick={handleCategoryContinue}
                  disabled={quizState.selectedCategories.length === 0}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </motion.div>
            </motion.div>
          )}

          {currentStep === 'lash-experience' && (
            <motion.div
              key="lash-experience"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <span className="caption text-terracotta">Step 2 of 3</span>
                <h2 className="h2 text-dune">Have you had lash extensions before?</h2>
              </div>

              {/* Yes/No Options */}
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <motion.button
                  onClick={() => handleLashExperience(true)}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass arch-full p-8 text-center hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-5xl mb-4">✨</div>
                  <h3 className="h3 text-dune mb-2">Yes</h3>
                  <p className="body text-dune/70">I&apos;ve had lash extensions before</p>
                </motion.button>

                <motion.button
                  onClick={() => handleLashExperience(false)}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass arch-full p-8 text-center hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-5xl mb-4">🌟</div>
                  <h3 className="h3 text-dune mb-2">No</h3>
                  <p className="body text-dune/70">I&apos;m a first-timer!</p>
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentStep === 'lash-style' && (
            <motion.div
              key="lash-style"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <span className="caption text-terracotta">Step 3 of 3</span>
                <h2 className="h2 text-dune">Which style are you interested in?</h2>
              </div>

              {/* Style Options */}
              <div className="grid md:grid-cols-3 gap-6">
                {lashStyles.map((style) => (
                  <motion.button
                    key={style.id}
                    onClick={() => handleLashStyleSelect(style.id)}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass arch-full p-8 text-center hover:shadow-xl transition-all duration-300"
                  >
                    <h3 className="h3 text-dune mb-2">{style.label}</h3>
                    <p className="body text-dune/70">{style.description}</p>
                  </motion.button>
                ))}
              </div>

              {/* Help Me Decide Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <button
                  onClick={() => {
                    setQuizState(prev => ({ ...prev, showEducation: true }))
                    setCurrentStep('education')
                  }}
                  className="btn btn-secondary"
                >
                  Help Me Find My Style
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
