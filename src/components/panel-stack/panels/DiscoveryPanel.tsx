'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Eye, Heart, Star, ArrowRight, X, Check, HelpCircle, Book } from 'lucide-react';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { getAllServices } from '@/actions/services';
import { getCategoryColors } from '@/lib/category-colors';
import { getCategoryIcon } from '@/components/icons/CategoryIcons';
import type { Panel } from '@/types/panel-stack';
import type { DiscoveryState, DiscoveryStep, LashLook, ServiceJourney, SERVICE_PRIORITIES, LASH_LOOKS } from '@/types/discovery-panel';

interface DiscoveryPanelProps {
  panel: Panel;
}

// Import service priorities and lash looks from types
const servicePriorities = {
  'lashes': 1,
  'waxing': 2,
  'brows': 3,
  'permanent-makeup': 4,
  'facials': 5,
  'permanent-jewelry': 6,
  'botox': 7,
};

const orderedLashLooks: LashLook[] = ['classic', 'hybrid', 'volume', 'wet-angel'];

const lashLooks: Record<LashLook, { name: string; description: string }> = {
  'classic': {
    name: 'Classic',
    description: 'Natural, elegant look with one extension per natural lash for subtle enhancement',
  },
  'hybrid': {
    name: 'Hybrid',
    description: 'Perfect balance of Classic and Volume, offering texture and fullness',
  },
  'volume': {
    name: 'Volume',
    description: 'Dramatic, full look with multiple lightweight extensions per natural lash',
  },
  'wet-angel': {
    name: 'Wet/Angel',
    description: 'Glossy, wispy look with textured tips for a fresh, dewy appearance',
  },
};

// Service journeys configuration
const serviceJourneys: Record<string, ServiceJourney> = {
  'lashes': {
    id: 'lashes',
    name: 'Lashes',
    priority: 1,
    hasQuiz: true,
    hasEducation: true,
    introContent: {
      title: 'The Art of Permanent Lashes',
      philosophy: 'At Lash Pop, we believe your lashes should enhance your natural beauty while fitting seamlessly into your lifestyle.',
      description: 'Our expert artists craft personalized lash looks that complement your eye shape, facial features, and personal style. From subtle enhancement to dramatic transformation, we&apos;re here to help you discover your perfect lash journey.',
    },
    educationContent: {
      title: 'Everything You Need to Know About Lashes',
      sections: [
        {
          heading: 'The Application Process',
          content: 'Our certified lash artists apply individual extensions to each natural lash using medical-grade adhesive. The process is comfortable, relaxing, and typically takes 1.5-2 hours for a full set.',
        },
        {
          heading: 'Aftercare & Maintenance',
          content: 'With proper care, your lashes will last 4-6 weeks. We recommend fills every 2-3 weeks to maintain fullness. Avoid oil-based products and excessive moisture for the first 24 hours.',
        },
        {
          heading: 'Safety & Comfort',
          content: 'We use only premium, cruelty-free materials and maintain the highest sanitation standards. Our adhesives are formaldehyde-free and safe for sensitive eyes.',
        },
      ],
    },
  },
  'waxing': {
    id: 'waxing',
    name: 'Waxing',
    priority: 2,
    hasQuiz: false,
    hasEducation: true,
    introContent: {
      title: 'Professional Waxing Services',
      philosophy: 'Smooth, confident, and comfortable in your own skin.',
      description: 'Our expert estheticians provide gentle, efficient waxing services using premium products for all skin types.',
    },
  },
  'brows': {
    id: 'brows',
    name: 'Brows',
    priority: 3,
    hasQuiz: false,
    hasEducation: true,
    introContent: {
      title: 'Brow Artistry',
      philosophy: 'Frame your face with perfectly sculpted brows.',
      description: 'From shaping and tinting to lamination and microblading, we offer comprehensive brow services tailored to your facial structure.',
    },
  },
  'permanent-makeup': {
    id: 'permanent-makeup',
    name: 'Permanent Makeup',
    priority: 4,
    hasQuiz: false,
    hasEducation: true,
    introContent: {
      title: 'Wake Up Beautiful',
      philosophy: 'Enhance your natural features with semi-permanent makeup.',
      description: 'Our certified artists specialize in microblading, lip blushing, and eyeliner tattooing for effortless, lasting beauty.',
    },
  },
  'facials': {
    id: 'facials',
    name: 'Facials',
    priority: 5,
    hasQuiz: false,
    hasEducation: true,
    introContent: {
      title: 'Skincare Excellence',
      philosophy: 'Healthy, glowing skin starts with professional care.',
      description: 'Customized facial treatments designed to address your unique skin concerns and goals.',
    },
  },
  'permanent-jewelry': {
    id: 'permanent-jewelry',
    name: 'Permanent Jewelry',
    priority: 6,
    hasQuiz: false,
    hasEducation: true,
    introContent: {
      title: 'Forever Jewelry',
      philosophy: 'Create lasting connections with custom-fitted jewelry.',
      description: 'Experience the art of permanent jewelry - delicate chains custom-fitted and welded for a seamless, clasp-free finish.',
    },
  },
  'botox': {
    id: 'botox',
    name: 'Botox',
    priority: 7,
    hasQuiz: false,
    hasEducation: true,
    introContent: {
      title: 'Aesthetic Injectables',
      philosophy: 'Refresh and rejuvenate with expert precision.',
      description: 'Our certified injectors provide safe, natural-looking results with Botox and dermal fillers.',
    },
  },
  // Add stub for 'jewelry' if it comes in slightly different
};

export function DiscoveryPanel({ panel }: DiscoveryPanelProps) {
  const { state: panelState, actions } = usePanelStack();

  // Discovery state
  const [state, setState] = useState<DiscoveryState>({
    currentStep: 'returning-visitor',
    isReturningVisitor: null,
    isRebooking: null,
    selectedServices: [],
    currentServiceIndex: 0,
    lashLookExplainerIndex: 0,
    lashQuizAnswers: {},
    aiQuestions: [],
    previousSteps: [],
    discoveryResult: null,
  });

  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load services and categories
  useEffect(() => {
    async function loadServices() {
      setIsLoading(true);
      try {
        const allServices = await getAllServices();
        setServices(allServices);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Map(
            allServices
              .filter(s => s.categoryId && s.categoryName)
              .map(s => [s.categoryId, {
                id: s.categoryId,
                name: s.categoryName,
                slug: s.categorySlug
              }])
          ).values()
        );
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, []);

  // Navigation helpers
  const goToStep = (step: DiscoveryStep) => {
    setState(prev => ({
      ...prev,
      previousSteps: [...prev.previousSteps, prev.currentStep],
      currentStep: step,
    }));
  };

  const goBack = () => {
    if (state.currentStep === 'lash-quiz-look-explainer' && state.lashLookExplainerIndex > 0) {
      // Special case: go back within explainer steps
      setState(prev => ({
        ...prev,
        lashLookExplainerIndex: prev.lashLookExplainerIndex - 1
      }));
      return;
    }

    if (state.previousSteps.length > 0) {
      const previousStep = state.previousSteps[state.previousSteps.length - 1];
      setState(prev => ({
        ...prev,
        currentStep: previousStep,
        previousSteps: prev.previousSteps.slice(0, -1),
        // Reset explainer index if leaving the explainer flow
        lashLookExplainerIndex: previousStep === 'lash-quiz-look-explainer' ? prev.lashLookExplainerIndex : 0
      }));
    }
  };

  // Handle returning visitor response
  const handleReturningVisitor = (isReturning: boolean) => {
    setState(prev => ({ ...prev, isReturningVisitor: isReturning }));
    if (isReturning) {
      goToStep('returning-visitor');
      // Show rebooking question
      setTimeout(() => {
        const rebookingStep = document.getElementById('rebooking-question');
        if (rebookingStep) {
          rebookingStep.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      goToStep('service-selection');
    }
  };

  // Handle rebooking response
  const handleRebookingResponse = (isRebooking: boolean) => {
    setState(prev => ({ ...prev, isRebooking }));
    if (isRebooking) {
      // Open services panel and close discovery
      actions.openPanel('service-panel', {
        categoryId: 'all',
        categoryName: 'All Services',
        services: services,
        subcategories: [],
      });
      actions.closePanel(panel.id);
    } else {
      goToStep('service-selection');
    }
  };

  // Handle service selection
  const handleServiceSelection = (selectedServiceIds: string[]) => {
    setState(prev => ({
      ...prev,
      selectedServices: selectedServiceIds,
      currentServiceIndex: 0,
    }));

    // Sort services by priority
    const sortedServices = selectedServiceIds.sort((a, b) => {
      const priorityA = servicePriorities[a as keyof typeof servicePriorities] || 999;
      const priorityB = servicePriorities[b as keyof typeof servicePriorities] || 999;
      return priorityA - priorityB;
    });

    // Start with the first service journey
    const firstService = sortedServices[0];
    if (firstService === 'lashes') {
      goToStep('lash-intro');
    } else {
      goToStep('other-service-intro');
    }
  };

  // Handle lash education choice
  const handleLashEducationChoice = (wantsEducation: boolean) => {
    if (wantsEducation) {
      goToStep('lash-education');
    } else {
      // Start sequential quiz v1
      setState(prev => ({ ...prev, lashLookExplainerIndex: 0 }));
      goToStep('lash-quiz-look-explainer');
    }
  };

  // Handle sequential explainer navigation
  const handleNextExplainer = () => {
    if (state.lashLookExplainerIndex < orderedLashLooks.length - 1) {
      setState(prev => ({
        ...prev,
        lashLookExplainerIndex: prev.lashLookExplainerIndex + 1
      }));
    } else {
      // Finished explainers, go to selection
      goToStep('lash-quiz-look-selection');
    }
  };

  // Handle lash look selection
  const handleLashLookSelection = (look: LashLook) => {
    setState(prev => ({
      ...prev,
      lashQuizAnswers: { ...prev.lashQuizAnswers, selectedLook: look },
    }));
    goToStep('lash-factors');
  };

  // Handle ready to book
  const handleReadyToBook = () => {
    // Open service panel with filters based on discovery
    const selectedCategories = state.selectedServices.map(serviceId => {
      const journey = serviceJourneys[serviceId];
      // Fallback if journey not found, though it should be
      if (!journey) return null;
      
      // Match against slugs
      return categories.find(c => c.slug === serviceId);
    }).filter(Boolean);

    if (selectedCategories.length > 0) {
      const firstCategory = selectedCategories[0];
      const categoryServices = services.filter(s => s.categoryId === firstCategory.id);

      actions.openPanel('service-panel', {
        categoryId: firstCategory.id,
        categoryName: firstCategory.name,
        services: categoryServices,
        subcategories: [],
        discoveryResult: state.discoveryResult,
      });

      // Dock the discovery panel
      actions.dockPanel(panel.id);
    } else {
        // Fallback if no categories matched (shouldn't happen if data integrity is good)
         actions.openPanel('service-panel', {
            categoryId: 'all',
            categoryName: 'All Services',
            services: services,
            subcategories: [],
        });
        actions.dockPanel(panel.id);
    }
  };

  // Update panel summary
  useEffect(() => {
    let summary = 'Discovery';
    if (state.currentStep === 'service-selection' && state.selectedServices.length > 0) {
      summary = `Selected: ${state.selectedServices.join(', ')}`;
    } else if (state.lashQuizAnswers.selectedLook) {
      summary = `Lash Style: ${lashLooks[state.lashQuizAnswers.selectedLook].name}`;
    }
    actions.updatePanelSummary(panel.id, summary);
  }, [state.currentStep, state.selectedServices, state.lashQuizAnswers.selectedLook, actions, panel.id]);

  return (
    <PanelWrapper
      panel={panel}
      title="Discover Your Perfect Service"
      subtitle="Let us help you find the ideal treatment"
    >
      <AnimatePresence mode="wait">
        {/* RETURNING VISITOR QUESTION */}
        {state.currentStep === 'returning-visitor' && (
          <motion.div
            key="returning-visitor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-dusty-rose mx-auto mb-4" />
              <h3 className="text-xl font-medium text-dune mb-3">
                Have you visited Lash Pop before?
              </h3>
              <p className="text-sage mb-8 max-w-md mx-auto">
                Let us personalize your experience based on your history with us
              </p>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReturningVisitor(true)}
                  className="px-8 py-3 rounded-full bg-dusty-rose text-white font-medium"
                >
                  Yes, I have
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReturningVisitor(false)}
                  className="px-8 py-3 rounded-full bg-sage/20 text-dune font-medium"
                >
                  First time
                </motion.button>
              </div>
            </div>

            {/* Rebooking question (appears after selecting "Yes") */}
            {state.isReturningVisitor && (
              <motion.div
                id="rebooking-question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 border-t border-sage/20"
              >
                <h3 className="text-lg font-medium text-dune mb-3">
                  Welcome back! Are you rebooking a service you&apos;ve had before?
                </h3>
                <div className="flex gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRebookingResponse(true)}
                    className="px-8 py-3 rounded-full bg-ocean-mist text-white font-medium"
                  >
                    Yes, rebooking
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRebookingResponse(false)}
                    className="px-8 py-3 rounded-full bg-sage/20 text-dune font-medium"
                  >
                    New service
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* SERVICE SELECTION */}
        {state.currentStep === 'service-selection' && (
          <motion.div
            key="service-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center py-4">
              <h3 className="text-xl font-medium text-dune mb-2">
                What services are you interested in?
              </h3>
              <p className="text-sage text-sm">
                Select all that apply - we&apos;ll guide you through each one
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {Object.entries(serviceJourneys).map(([id, journey]) => {
                const isSelected = state.selectedServices.includes(id);
                const colors = getCategoryColors(id);
                const IconComponent = getCategoryIcon(colors.iconName || 'Sparkles');

                return (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        selectedServices: isSelected
                          ? prev.selectedServices.filter(s => s !== id)
                          : [...prev.selectedServices, id],
                      }));
                    }}
                    className={`
                      relative px-4 py-3 rounded-full font-medium
                      transition-all duration-200 flex items-center gap-2
                      ${
                        isSelected
                          ? 'text-white shadow-lg transform scale-105'
                          : 'border hover:scale-105'
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.light,
                      borderColor: isSelected ? 'transparent' : colors.medium,
                      color: isSelected ? 'white' : colors.primary,
                      boxShadow: isSelected ? `0 4px 20px ${colors.ring}` : 'none',
                    }}
                  >
                    {/* Icon */}
                    <IconComponent className="w-4 h-4" />

                    {/* Category Name */}
                    <span className="text-sm capitalize">{journey.name}</span>

                    {/* Check Icon (selected only) */}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {state.selectedServices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center pt-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleServiceSelection(state.selectedServices)}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-terracotta text-white font-medium shadow-lg"
                >
                  Continue
                  <ArrowRight className="inline-block ml-2 w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* LASH INTRO */}
        {state.currentStep === 'lash-intro' && (
          <motion.div
            key="lash-intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sage hover:text-dusty-rose transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center py-6">
              <Eye className="w-12 h-12 text-dusty-rose mx-auto mb-4" />
              <h3 className="text-2xl font-medium text-dune mb-4">
                {serviceJourneys.lashes.introContent.title}
              </h3>
              <p className="text-dusty-rose font-medium mb-3">
                {serviceJourneys.lashes.introContent.philosophy}
              </p>
              <p className="text-sage max-w-lg mx-auto">
                {serviceJourneys.lashes.introContent.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleLashEducationChoice(true)}
                className="px-6 py-3 rounded-full bg-sage/20 text-dune font-medium flex items-center justify-center gap-2"
              >
                <Book className="w-4 h-4" />
                Tell me more
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleLashEducationChoice(false)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-terracotta text-white font-medium shadow-lg"
              >
                Find my look
                <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* LASH EDUCATION */}
        {state.currentStep === 'lash-education' && (
          <motion.div
            key="lash-education"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sage hover:text-dusty-rose transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <h3 className="text-xl font-medium text-dune text-center">
              {serviceJourneys.lashes.educationContent?.title}
            </h3>

            <div className="space-y-4">
              {serviceJourneys.lashes.educationContent?.sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-sage/5 border border-sage/10"
                >
                  <h4 className="font-medium text-dune mb-2">{section.heading}</h4>
                  <p className="text-sm text-sage">{section.content}</p>
                </motion.div>
              ))}
            </div>

            {/* AI Q&A Stub */}
            <div className="p-4 rounded-xl bg-ocean-mist/10 border border-ocean-mist/20">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-ocean-mist mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-dune mb-1">Have more questions?</p>
                  <p className="text-sm text-sage mb-3">
                    Ask our AI assistant anything about lash services
                  </p>
                  <button className="text-sm text-ocean-mist font-medium">
                    Coming soon...
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
               {/* Reuse the logic to go to find look */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    // Start sequential quiz
                    setState(prev => ({ ...prev, lashLookExplainerIndex: 0 }));
                    goToStep('lash-quiz-look-explainer');
                }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-terracotta text-white font-medium shadow-lg"
              >
                Find my perfect look
                <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* LASH QUIZ - SEQUENTIAL EXPLAINER */}
        {state.currentStep === 'lash-quiz-look-explainer' && (
          <motion.div
            key={`explainer-${state.lashLookExplainerIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
             <button
              onClick={goBack}
              className="flex items-center gap-2 text-sage hover:text-dusty-rose transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            {(() => {
                const currentLookKey = orderedLashLooks[state.lashLookExplainerIndex];
                const currentLook = lashLooks[currentLookKey];
                
                return (
                    <div className="text-center space-y-6">
                        <div className="w-full h-48 bg-sage/10 rounded-xl flex items-center justify-center mb-4">
                            <p className="text-sage/50 italic">Image for {currentLook.name}</p>
                        </div>
                        
                        <h3 className="text-2xl font-medium text-dune">{currentLook.name} Lashes</h3>
                        <p className="text-sage text-lg max-w-md mx-auto">{currentLook.description}</p>
                        
                         <div className="flex justify-center pt-8">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNextExplainer}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-terracotta text-white font-medium shadow-lg flex items-center gap-2"
                            >
                                {state.lashLookExplainerIndex < orderedLashLooks.length - 1 ? 'Next Style' : 'Compare All Styles'}
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </div>
                        
                         {/* Progress Indicator */}
                         <div className="flex justify-center gap-2 mt-4">
                            {orderedLashLooks.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        idx === state.lashLookExplainerIndex 
                                        ? 'bg-dusty-rose w-4' 
                                        : 'bg-sage/30'
                                    }`}
                                />
                            ))}
                         </div>
                    </div>
                );
            })()}
          </motion.div>
        )}

        {/* LASH QUIZ - FINAL SELECTION */}
        {state.currentStep === 'lash-quiz-look-selection' && (
          <motion.div
            key="lash-quiz-look-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sage hover:text-dusty-rose transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center">
              <h3 className="text-xl font-medium text-dune mb-2">
                Which one sounds most like you?
              </h3>
              <p className="text-sage text-sm">
                Select the style that best matches your desired aesthetic
              </p>
            </div>

            <div className="space-y-3">
              {(orderedLashLooks).map((id) => {
                const look = lashLooks[id];
                return (
                    <motion.button
                    key={id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLashLookSelection(id)}
                    className="w-full p-4 rounded-xl bg-sage/5 hover:bg-sage/10 border border-sage/10 text-left transition-all"
                    >
                    <h4 className="font-medium text-dune mb-1">{look.name}</h4>
                    <p className="text-sm text-sage">{look.description}</p>
                    </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* LASH FACTORS */}
        {state.currentStep === 'lash-factors' && (
          <motion.div
            key="lash-factors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sage hover:text-dusty-rose transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center py-6">
              <Star className="w-12 h-12 text-dusty-rose mx-auto mb-4" />
              <h3 className="text-xl font-medium text-dune mb-3">
                Perfect! You selected {state.lashQuizAnswers.selectedLook && lashLooks[state.lashQuizAnswers.selectedLook].name}
              </h3>
              <p className="text-sage max-w-md mx-auto mb-6">
                Other factors like curl, length, and thickness will be customized by your artist during your appointment based on your eye shape and natural lashes.
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
                <div className="p-4 rounded-xl bg-sage/10 flex flex-col items-center">
                  <span className="text-2xl mb-2">🌀</span>
                  <p className="text-xs text-sage uppercase tracking-wider mb-1">Curl</p>
                  <p className="font-medium text-dune text-sm">Custom</p>
                </div>
                <div className="p-4 rounded-xl bg-sage/10 flex flex-col items-center">
                  <span className="text-2xl mb-2">📏</span>
                  <p className="text-xs text-sage uppercase tracking-wider mb-1">Length</p>
                  <p className="font-medium text-dune text-sm">Custom</p>
                </div>
                <div className="p-4 rounded-xl bg-sage/10 flex flex-col items-center">
                  <span className="text-2xl mb-2">✨</span>
                  <p className="text-xs text-sage uppercase tracking-wider mb-1">Thickness</p>
                  <p className="font-medium text-dune text-sm">Custom</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => goToStep('ai-questions')}
                className="px-6 py-3 rounded-full bg-sage/20 text-dune font-medium flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                I have other questions
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReadyToBook}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-terracotta text-white font-medium shadow-lg"
              >
                Ready to book
                <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* OTHER SERVICE INTRO */}
        {state.currentStep === 'other-service-intro' && (
          <motion.div
            key="other-service-intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sage hover:text-dusty-rose transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {(() => {
              const currentService = state.selectedServices[state.currentServiceIndex];
              const journey = serviceJourneys[currentService];

              if (!journey) return null;

              return (
                <>
                  <div className="text-center py-6">
                    <Heart className="w-12 h-12 text-dusty-rose mx-auto mb-4" />
                    <h3 className="text-2xl font-medium text-dune mb-4">
                      {journey.introContent.title}
                    </h3>
                    <p className="text-dusty-rose font-medium mb-3">
                      {journey.introContent.philosophy}
                    </p>
                    <p className="text-sage max-w-lg mx-auto">
                      {journey.introContent.description}
                    </p>
                  </div>
                  
                  {journey.hasEducation && (
                     <div className="flex justify-center pt-4 pb-4">
                         {/* Simple education block if needed, for now direct to booking as per dictation for non-lash services (mostly) */}
                     </div>
                  )}

                  <div className="flex justify-center pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReadyToBook}
                      className="px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-terracotta text-white font-medium shadow-lg"
                    >
                      Ready to book
                      <ArrowRight className="inline-block ml-2 w-4 h-4" />
                    </motion.button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* AI QUESTIONS */}
        {state.currentStep === 'ai-questions' && (
          <motion.div
            key="ai-questions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sage hover:text-dusty-rose transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center py-6">
              <HelpCircle className="w-12 h-12 text-ocean-mist mx-auto mb-4" />
              <h3 className="text-xl font-medium text-dune mb-3">
                AI Assistant Coming Soon
              </h3>
              <p className="text-sage max-w-md mx-auto">
                Our AI-powered Q&A feature is currently in development. Soon you&apos;ll be able to ask any questions about our services and get instant, personalized answers.
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                   // After AI questions, AI will have a button "Open Services Panel" 
                   handleReadyToBook();
                }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-terracotta text-white font-medium shadow-lg"
              >
                Open Services Panel
                <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PanelWrapper>
  );
}
