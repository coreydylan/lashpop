'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { LashEducation } from './LashEducation'
import { usePanelStack } from '@/contexts/PanelStackContext'
import { getAllServices } from '@/actions/services'

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
  { id: 'classic', label: 'CLASSIC', description: 'Natural, elegant look with one extension per natural lash' },
  { id: 'hybrid', label: 'HYBRID', description: 'Perfect balance of Classic and Volume for texture and fullness' },
  { id: 'volume', label: 'VOLUME', description: 'Dramatic, full look with multiple lightweight extensions' },
  { id: 'wet-angel', label: 'WET/ANGEL', description: 'Glossy, wispy look with textured tips for a dewy appearance' }
]

type QuizStep = 'returning-visitor' | 'rebooking-question' | 'categories' | 'lash-intro' | 'lash-education-choice' | 'lash-style' | 'lash-factors' | 'education' | 'other-service-intro' | 'complete'

interface QuizState {
  selectedCategories: string[]
  isReturningVisitor: boolean | null
  isRebooking: boolean | null
  hasLashExperience: boolean | null
  lashStyle: string | null
  showEducation: boolean
  currentServiceIndex: number
}

export function ServiceDiscoveryQuiz() {
  const { actions: panelActions } = usePanelStack()
  const [currentStep, setCurrentStep] = useState<QuizStep>('returning-visitor')
  const [quizState, setQuizState] = useState<QuizState>({
    selectedCategories: [],
    isReturningVisitor: null,
    isRebooking: null,
    hasLashExperience: null,
    lashStyle: null,
    showEducation: false,
    currentServiceIndex: 0
  })
  const [services, setServices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load services data
  useEffect(() => {
    async function loadServices() {
      setIsLoading(true)
      try {
        const allServices = await getAllServices()
        setServices(allServices)
      } catch (error) {
        console.error('Failed to load services:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadServices()
  }, [])

  const toggleCategory = (categoryId: string) => {
    setQuizState(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }))
  }

  const handleReturningVisitor = (isReturning: boolean) => {
    setQuizState(prev => ({ ...prev, isReturningVisitor: isReturning }))
    if (isReturning) {
      setCurrentStep('rebooking-question')
    } else {
      setCurrentStep('categories')
    }
  }

  const handleRebooking = (isRebooking: boolean) => {
    setQuizState(prev => ({ ...prev, isRebooking }))
    if (isRebooking) {
      // For rebooking, just open the category picker so they can choose any service
      const categoryPickerExists = panelActions.getPanelsByLevel(1).some(p => p.type === 'category-picker')
      if (!categoryPickerExists) {
        panelActions.openPanel('category-picker', { entryPoint: 'rebooking' })
      }
      setCurrentStep('complete')
    } else {
      setCurrentStep('categories')
    }
  }

  const handleCategoryContinue = () => {
    if (quizState.selectedCategories.length === 0) return

    // Priority order: lashes first, then others
    if (quizState.selectedCategories.includes('lashes')) {
      setCurrentStep('lash-intro')
    } else if (quizState.selectedCategories.length > 0) {
      // Show intro for first selected non-lash service
      setCurrentStep('other-service-intro')
    }
  }

  const handleLashIntro = (choice: 'learn-more' | 'find-look') => {
    if (choice === 'learn-more') {
      setQuizState(prev => ({ ...prev, showEducation: true }))
      setCurrentStep('education')
    } else {
      setCurrentStep('lash-style')
    }
  }

  const handleLashStyleSelect = (styleId: string) => {
    setQuizState(prev => ({ ...prev, lashStyle: styleId }))
    setCurrentStep('lash-factors')
  }

  const handleLashFactorsContinue = () => {
    // Check if there are other services to show
    const otherServices = quizState.selectedCategories.filter(cat => cat !== 'lashes')
    if (otherServices.length > 0 && quizState.currentServiceIndex < otherServices.length - 1) {
      setQuizState(prev => ({ ...prev, currentServiceIndex: prev.currentServiceIndex + 1 }))
      setCurrentStep('other-service-intro')
    } else {
      handleComplete()
    }
  }

  const handleEducationComplete = (selectedStyle?: string) => {
    if (selectedStyle) {
      setQuizState(prev => ({ ...prev, lashStyle: selectedStyle }))
    }
    handleComplete()
  }

  const handleComplete = () => {
    // First, open the category picker if not already open
    const categoryPickerExists = panelActions.getPanelsByLevel(1).some(p => p.type === 'category-picker')
    if (!categoryPickerExists) {
      panelActions.openPanel('category-picker', { entryPoint: 'discovery' })
    }

    // Get the primary category from selection
    const primaryCategory = quizState.selectedCategories[0] || 'lashes'

    // Map our category IDs to the actual database category slugs
    const categoryMapping: Record<string, string> = {
      'lashes': 'lashes',
      'brows': 'brows',
      'skincare': 'facials', // Map skincare to facials
      'waxing': 'waxing',
      'permanent-makeup': 'permanent-makeup',
      'permanent-jewelry': 'permanent-jewelry',
      'injectables': 'botox' // Map injectables to botox
    }

    const mappedCategorySlug = categoryMapping[primaryCategory] || primaryCategory

    // Find services for this category
    let categoryServices = services.filter(s =>
      s.categorySlug === mappedCategorySlug ||
      s.categoryName?.toLowerCase() === mappedCategorySlug
    )

    // Get category details from services
    const categoryService = categoryServices[0]
    const categoryName = categoryService?.categoryName || primaryCategory
    const categoryId = categoryService?.categoryId || mappedCategorySlug

    // Build subcategories from services
    const subcategoriesMap = new Map()
    categoryServices.forEach(service => {
      if (service.subcategorySlug && service.subcategoryName) {
        if (!subcategoriesMap.has(service.subcategorySlug)) {
          subcategoriesMap.set(service.subcategorySlug, {
            id: service.subcategorySlug,
            name: service.subcategoryName,
            slug: service.subcategorySlug
          })
        }
      }
    })
    const subcategories = Array.from(subcategoriesMap.values())

    // If lashes were selected and a style was chosen, filter to matching services
    if (mappedCategorySlug === 'lashes' && quizState.lashStyle) {
      const styleMappings: Record<string, string[]> = {
        'classic': ['classic', 'natural', 'individual'],
        'hybrid': ['hybrid', 'mixed', 'combination'],
        'volume': ['volume', 'russian', 'mega', 'dramatic'],
        'wet-angel': ['wet', 'angel', 'wispy', 'textured']
      }

      const styleKeywords = styleMappings[quizState.lashStyle] || []
      if (styleKeywords.length > 0) {
        // Filter but keep at least some services if no exact matches
        const filteredServices = categoryServices.filter(service =>
          styleKeywords.some(keyword =>
            service.name?.toLowerCase().includes(keyword) ||
            service.description?.toLowerCase().includes(keyword) ||
            service.subtitle?.toLowerCase().includes(keyword)
          )
        )

        // Use filtered if we found matches, otherwise show all lash services
        if (filteredServices.length > 0) {
          categoryServices = filteredServices
        }
      }
    }

    // Don't call selectCategory - that triggers CategoryPickerPanel to open its own panel
    // Instead, directly open our filtered service panel

    // Open service panel with our filtered services
    panelActions.openPanel(
      'service-panel',
      {
        categoryId: categoryId,
        categoryName: categoryName,
        subcategories: subcategories,
        services: categoryServices,
        discoveryResult: {
          selectedCategories: quizState.selectedCategories,
          lashStyle: quizState.lashStyle,
          isReturningVisitor: quizState.isReturningVisitor
        }
      },
      {
        parentId: panelActions.getPanelsByLevel(1)[0]?.id, // Parent is category picker
        autoExpand: true,
        scrollToTop: true
      }
    )

    // Hide the discovery quiz
    setCurrentStep('complete')
  }

  if (currentStep === 'complete') {
    return null
  }

  if (currentStep === 'education') {
    return <LashEducation onComplete={handleEducationComplete} />
  }

  // Calculate progress steps
  const getProgressStep = () => {
    const steps = ['returning-visitor', 'rebooking-question', 'categories', 'lash-intro', 'lash-style', 'lash-factors']
    const index = steps.indexOf(currentStep)
    return index === -1 ? 1 : index + 1
  }

  const getTotalSteps = () => {
    if (quizState.isReturningVisitor && quizState.isRebooking) return 2
    if (quizState.selectedCategories.includes('lashes')) return 5
    return 3
  }

  return (
    <section id="discover-your-look" className="py-[var(--space-xl)] bg-gradient-to-b from-cream via-warm-sand/10 to-cream">
      <div className="container max-w-4xl">
        <AnimatePresence mode="wait">
          {/* RETURNING VISITOR QUESTION */}
          {currentStep === 'returning-visitor' && (
            <motion.div
              key="returning-visitor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <h2 className="h2 text-dune">Have you visited Lash Pop before?</h2>
                <p className="body-lg text-dune/70">Let us personalize your experience</p>
              </div>

              {/* Yes/No Options */}
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <motion.button
                  onClick={() => handleReturningVisitor(true)}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass arch-full p-8 text-center hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="h3 text-dune mb-2">Yes, I have</h3>
                  <p className="body text-dune/70">Welcome back!</p>
                </motion.button>

                <motion.button
                  onClick={() => handleReturningVisitor(false)}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass arch-full p-8 text-center hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="h3 text-dune mb-2">First time</h3>
                  <p className="body text-dune/70">Let&apos;s discover your perfect service</p>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* REBOOKING QUESTION */}
          {currentStep === 'rebooking-question' && (
            <motion.div
              key="rebooking-question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <h2 className="h2 text-dune">Welcome back! Are you rebooking a service?</h2>
                <p className="body-lg text-dune/70">Or looking to try something new?</p>
              </div>

              {/* Options */}
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <motion.button
                  onClick={() => handleRebooking(true)}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass arch-full p-8 text-center hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="h3 text-dune mb-2">Rebooking</h3>
                  <p className="body text-dune/70">I want the same service as before</p>
                </motion.button>

                <motion.button
                  onClick={() => handleRebooking(false)}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass arch-full p-8 text-center hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="h3 text-dune mb-2">New service</h3>
                  <p className="body text-dune/70">I want to explore other options</p>
                </motion.button>
              </div>
            </motion.div>
          )}

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
                <span className="caption text-terracotta">Step {getProgressStep()} of {getTotalSteps()}</span>
                <h2 className="h2 text-dune">What services are you interested in?</h2>
                <p className="body-lg text-dune/70">Select all that apply - we&apos;ll guide you through each one</p>
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

          {/* LASH INTRO */}
          {currentStep === 'lash-intro' && (
            <motion.div
              key="lash-intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <span className="caption text-terracotta">Lash Journey</span>
                <h2 className="h2 text-dune">The Art of Permanent Lashes</h2>
                <p className="body-lg text-dusty-rose font-medium">
                  We believe your lashes should enhance your natural beauty while fitting seamlessly into your lifestyle
                </p>
                <p className="body text-dune/70 max-w-2xl mx-auto">
                  Our expert artists craft personalized lash looks that complement your eye shape, facial features, and personal style. From subtle enhancement to dramatic transformation, we&apos;re here to help you discover your perfect lash journey.
                </p>
              </div>

              {/* Options */}
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <motion.button
                  onClick={() => handleLashIntro('learn-more')}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass arch-full p-8 text-center hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="h3 text-dune mb-2">Tell me more</h3>
                  <p className="body text-dune/70">Learn about lashes and answer questions</p>
                </motion.button>

                <motion.button
                  onClick={() => handleLashIntro('find-look')}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass arch-full p-8 text-center hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-dusty-rose/10 to-warm-sand/10"
                >
                  <h3 className="h3 text-dune mb-2">Find my look</h3>
                  <p className="body text-dune/70">Discover your perfect lash style</p>
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
                <span className="caption text-terracotta">Choose Your Look</span>
                <h2 className="h2 text-dune">Select your lash style</h2>
                <p className="body-lg text-dune/70">Each style creates a unique aesthetic</p>
              </div>

              {/* Style Options - 2x2 grid */}
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {lashStyles.map((style) => (
                  <motion.button
                    key={style.id}
                    onClick={() => handleLashStyleSelect(style.id)}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass arch-full p-6 text-left hover:shadow-xl transition-all duration-300"
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

          {/* LASH FACTORS */}
          {currentStep === 'lash-factors' && (
            <motion.div
              key="lash-factors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <span className="caption text-terracotta">Perfect!</span>
                <h2 className="h2 text-dune">
                  You selected {quizState.lashStyle && lashStyles.find(s => s.id === quizState.lashStyle)?.label}
                </h2>
                <p className="body-lg text-dune/70 max-w-2xl mx-auto">
                  Other factors like curl, length, and thickness will be customized by your artist during your appointment based on your eye shape and natural lashes
                </p>
              </div>

              {/* Customization Preview */}
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="glass arch-lg p-4 text-center">
                  <p className="caption text-sage mb-1">Curl</p>
                  <p className="h4 text-dune">Custom</p>
                </div>
                <div className="glass arch-lg p-4 text-center">
                  <p className="caption text-sage mb-1">Length</p>
                  <p className="h4 text-dune">Custom</p>
                </div>
                <div className="glass arch-lg p-4 text-center">
                  <p className="caption text-sage mb-1">Thickness</p>
                  <p className="h4 text-dune">Custom</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <motion.button
                  onClick={handleComplete}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-primary"
                >
                  Ready to book
                </motion.button>
                <motion.button
                  onClick={() => setCurrentStep('education')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-secondary"
                >
                  I have questions
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* OTHER SERVICE INTRO */}
          {currentStep === 'other-service-intro' && (
            <motion.div
              key="other-service-intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Dynamic content based on selected services */}
              {(() => {
                const otherServices = quizState.selectedCategories.filter(cat => cat !== 'lashes')
                const currentService = otherServices[quizState.currentServiceIndex]
                const serviceInfo = {
                  'brows': {
                    title: 'Brow Artistry',
                    philosophy: 'Frame your face with perfectly sculpted brows',
                    description: 'From shaping and tinting to lamination and microblading, we offer comprehensive brow services tailored to your facial structure.'
                  },
                  'skincare': {
                    title: 'Skincare Excellence',
                    philosophy: 'Healthy, glowing skin starts with professional care',
                    description: 'Customized facial treatments designed to address your unique skin concerns and goals.'
                  },
                  'waxing': {
                    title: 'Professional Waxing',
                    philosophy: 'Smooth, confident, and comfortable in your own skin',
                    description: 'Our expert estheticians provide gentle, efficient waxing services using premium products for all skin types.'
                  },
                  'permanent-makeup': {
                    title: 'Wake Up Beautiful',
                    philosophy: 'Enhance your natural features with semi-permanent makeup',
                    description: 'Our certified artists specialize in microblading, lip blushing, and eyeliner tattooing for effortless, lasting beauty.'
                  },
                  'permanent-jewelry': {
                    title: 'Forever Jewelry',
                    philosophy: 'Create lasting connections with custom-fitted jewelry',
                    description: 'Experience the art of permanent jewelry - delicate chains custom-fitted and welded for a seamless, clasp-free finish.'
                  },
                  'injectables': {
                    title: 'Aesthetic Injectables',
                    philosophy: 'Refresh and rejuvenate with expert precision',
                    description: 'Our certified injectors provide safe, natural-looking results with Botox and dermal fillers.'
                  }
                }[currentService] || {
                  title: 'Discover Our Services',
                  philosophy: 'Excellence in every treatment',
                  description: 'Explore our range of professional beauty services.'
                }

                return (
                  <>
                    <div className="text-center space-y-4">
                      <h2 className="h2 text-dune">{serviceInfo.title}</h2>
                      <p className="body-lg text-dusty-rose font-medium">
                        {serviceInfo.philosophy}
                      </p>
                      <p className="body text-dune/70 max-w-2xl mx-auto">
                        {serviceInfo.description}
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <motion.button
                        onClick={handleComplete}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn btn-primary"
                      >
                        Ready to book
                      </motion.button>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
