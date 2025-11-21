"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Star } from 'lucide-react';
import DrawerContainer from './DrawerContainer';
import { useDrawer } from './DrawerContext';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { getAllServices } from '@/actions/services';

// Beautiful sun icon from v1
function SunIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"
        strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
    </svg>
  )
}

interface QuizStep {
  id: number;
  title: string;
  subtitle: string;
  options: {
    id: string;
    label: string;
    description: string;
    emoji?: string;
  }[];
}

const quizSteps: QuizStep[] = [
  {
    id: 1,
    title: "Have you visited Lash Pop before?",
    subtitle: "Let us personalize your experience",
    options: [
      { id: 'returning', label: 'Yes, I have', description: 'Welcome back!' },
      { id: 'new', label: 'First time', description: "Let's discover your perfect service" },
    ],
  },
  {
    id: 2,
    title: "What services are you interested in?",
    subtitle: "Select all that apply - we'll guide you through each one",
    options: [
      { id: 'lashes', label: 'Lashes', description: 'Extensions, lifts, and tints' },
      { id: 'brows', label: 'Brows', description: 'Shaping, tinting, and lamination' },
      { id: 'waxing', label: 'Waxing', description: 'Professional hair removal' },
      { id: 'permanent-makeup', label: 'Permanent Makeup', description: 'Semi-permanent beauty enhancements' },
      { id: 'facials', label: 'Facials', description: 'Customized skincare treatments' },
      { id: 'permanent-jewelry', label: 'Permanent Jewelry', description: 'Custom-fitted, clasp-free chains' },
      { id: 'botox', label: 'Botox', description: 'Aesthetic injectables' },
    ],
  },
  {
    id: 3,
    title: "Choose your lash style",
    subtitle: "Each style creates a unique aesthetic",
    options: [
      { id: 'classic', label: 'Classic', description: 'Natural, elegant look with one extension per natural lash' },
      { id: 'hybrid', label: 'Hybrid', description: 'Perfect balance of Classic and Volume for texture and fullness' },
      { id: 'volume', label: 'Volume', description: 'Dramatic, full look with multiple lightweight extensions' },
      { id: 'wet-angel', label: 'Wet/Angel', description: 'Glossy, wispy look with textured tips for a dewy appearance' },
    ],
  },
];

export default function DiscoverDrawer() {
  const { setQuizResults, drawerStates, quizResults, toggleDrawer } = useDrawer();
  const { actions: panelActions } = usePanelStack();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Load services data
  useEffect(() => {
    async function loadServices() {
      try {
        const allServices = await getAllServices();
        setServices(allServices);
      } catch (error) {
        console.error('Failed to load services:', error);
      }
    }
    loadServices();
  }, []);

  const handleAnswer = (questionId: string, answerId: string) => {
    // Handle multi-select for services
    if (currentStep === 2) {
      setSelectedServices(prev => {
        if (prev.includes(answerId)) {
          return prev.filter(id => id !== answerId);
        } else {
          return [...prev, answerId];
        }
      });
      return; // Don't auto-advance for multi-select
    }

    setAnswers(prev => ({ ...prev, [questionId]: answerId }));

    // Handle flow logic
    if (currentStep === 1) {
      if (answerId === 'returning') {
        // For returning visitors, could add a rebooking question here
        setTimeout(() => setCurrentStep(2), 400);
      } else {
        setTimeout(() => setCurrentStep(2), 400);
      }
    } else if (currentStep === 3) {
      // Lash style selected - complete the quiz and open panel
      openServicePanel('lashes', answerId);
    } else if (currentStep < quizSteps.length) {
      setTimeout(() => setCurrentStep(currentStep + 1), 400);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(1);
    setAnswers({});
    setSelectedServices([]);
  };

  const handleContinueFromServices = () => {
    if (selectedServices.includes('lashes')) {
      setCurrentStep(3); // Go to lash styles
    } else {
      // Complete the quiz for non-lash services and open panel
      openServicePanel(selectedServices[0], null);
    }
  };

  const openServicePanel = (categoryId: string, lashStyle: string | null) => {
    // Map our category IDs to the actual database category slugs
    const categoryMapping: Record<string, string> = {
      'lashes': 'lashes',
      'brows': 'brows',
      'waxing': 'waxing',
      'permanent-makeup': 'permanent-makeup',
      'facials': 'facials',
      'permanent-jewelry': 'permanent-jewelry',
      'botox': 'botox'
    };

    const mappedCategorySlug = categoryMapping[categoryId] || categoryId;

    // Find services for this category
    let categoryServices = services.filter(s =>
      s.categorySlug === mappedCategorySlug ||
      s.categoryName?.toLowerCase() === mappedCategorySlug
    );

    // Get category details from services
    const categoryService = categoryServices[0];
    const categoryName = categoryService?.categoryName || categoryId;
    const actualCategoryId = categoryService?.categoryId || mappedCategorySlug;

    // Build subcategories from services
    const subcategoriesMap = new Map();
    categoryServices.forEach(service => {
      if (service.subcategorySlug && service.subcategoryName) {
        if (!subcategoriesMap.has(service.subcategorySlug)) {
          subcategoriesMap.set(service.subcategorySlug, {
            id: service.subcategorySlug,
            name: service.subcategoryName,
            slug: service.subcategorySlug
          });
        }
      }
    });
    const subcategories = Array.from(subcategoriesMap.values());

    // If lashes and a style was chosen, filter to matching services
    if (mappedCategorySlug === 'lashes' && lashStyle) {
      const styleMappings: Record<string, string[]> = {
        'classic': ['classic', 'natural', 'individual'],
        'hybrid': ['hybrid', 'mixed', 'combination'],
        'volume': ['volume', 'russian', 'mega', 'dramatic'],
        'wet-angel': ['wet', 'angel', 'wispy', 'textured']
      };

      const styleKeywords = styleMappings[lashStyle] || [];
      if (styleKeywords.length > 0) {
        const filteredServices = categoryServices.filter(service =>
          styleKeywords.some(keyword =>
            service.name?.toLowerCase().includes(keyword) ||
            service.description?.toLowerCase().includes(keyword) ||
            service.subtitle?.toLowerCase().includes(keyword)
          )
        );

        if (filteredServices.length > 0) {
          categoryServices = filteredServices;
        }
      }
    }

    // Don't call selectCategory - that triggers CategoryPickerPanel to open its own panel
    // Instead, directly open our filtered service panel

    // Open service panel with our filtered services
    panelActions.openPanel(
      'service-panel',
      {
        categoryId: actualCategoryId,
        categoryName: categoryName,
        subcategories: subcategories,
        services: categoryServices,
        discoveryResult: {
          selectedServices,
          lashStyle,
          isReturningVisitor: answers['1'] === 'returning'
        }
      },
      {
        parentId: panelActions.getPanelsByLevel(1)[0]?.id,
        autoExpand: true,
        scrollToTop: true
      }
    );

    // Store results
    const results = {
      serviceCategory: selectedServices,
      experience: answers['1'] || '',
      style: lashStyle || '',
      timestamp: Date.now(),
    };
    setQuizResults(results);

    // Close the drawer
    toggleDrawer('discover');
  };

  const currentStepData = quizSteps[currentStep - 1];

  // Beautiful docked content
  const dockedContent = quizResults ? (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-full bg-dusty-rose/10">
          <Heart className="w-5 h-5 text-dusty-rose" />
        </div>
        <div>
          <p className="caption text-sage">Your Style Profile</p>
          <p className="text-lg font-light text-dune">
            {quizResults.style === 'classic' && 'Classic'}
            {quizResults.style === 'hybrid' && 'Hybrid'}
            {quizResults.style === 'volume' && 'Volume'}
            {quizResults.style === 'wet-angel' && 'Wet/Angel'}
            {quizResults.serviceCategory && quizResults.serviceCategory.length > 0 && ' • '}
            {quizResults.serviceCategory && quizResults.serviceCategory.join(', ')}
          </p>
        </div>
      </div>
      <button
        onClick={resetQuiz}
        className="text-sm text-terracotta hover:text-dusty-rose transition-colors"
        style={{ fontWeight: 400, letterSpacing: '0.05em' }}
      >
        Retake
      </button>
    </div>
  ) : (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-full bg-warm-sand/50">
          <Sparkles className="w-5 h-5 text-golden" />
        </div>
        <div>
          <p className="caption text-sage">Ready to discover?</p>
          <p className="text-lg font-light text-dune">Find your perfect lash style</p>
        </div>
      </div>
    </div>
  );

  return (
    <DrawerContainer
      name="discover"
      title="Discover Your Look"
      dockedContent={dockedContent}
      icon={<Star className="w-5 h-5" />}
    >
      <div className="max-w-3xl mx-auto">
        {/* Progress Dots */}
        <div className="flex justify-center gap-3 mb-10">
          {[1, 2, 3].map((step) => (
            <motion.div
              key={step}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                step <= currentStep ? 'bg-dusty-rose w-8' : 'bg-sage/30'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: step * 0.1 }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Step Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-block mb-4"
              >
                <SunIcon className="w-8 h-8 text-golden" />
              </motion.div>
              <h3 className="h2 text-dune mb-3">
                {currentStepData.title}
              </h3>
              <p className="body-lg text-dune/60">
                {currentStepData.subtitle}
              </p>
            </div>

            {/* Beautiful Options Grid */}
            <div className={`grid ${currentStep === 2 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
              {currentStepData.options.map((option, index) => {
                const isSelected = currentStep === 2
                  ? selectedServices.includes(option.id)
                  : answers[String(currentStep)] === option.id;

                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleAnswer(String(currentStep), option.id)}
                    className={`
                      relative p-6 rounded-2xl text-left transition-all group
                      ${isSelected
                        ? 'glass shadow-lg scale-[1.02]'
                        : 'bg-cream/50 hover:bg-cream/80 hover:shadow-md'
                      }
                    `}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                      <div className="absolute top-2 right-2 w-12 h-12 rounded-full bg-gradient-to-br from-dusty-rose to-terracotta" />
                    </div>

                    <div className="relative">
                      <div className="flex items-start gap-4">
                        {option.emoji && <span className="text-2xl">{option.emoji}</span>}
                        <div className="flex-1">
                          <p className="font-light text-lg text-dune mb-1">{option.label}</p>
                          <p className="text-sm text-dune/60">{option.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute bottom-3 right-3 w-6 h-6 bg-dusty-rose rounded-full flex items-center justify-center"
                      >
                        <div className="w-2 h-2 bg-cream rounded-full" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Continue button for multi-select step */}
            {currentStep === 2 && selectedServices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mt-6"
              >
                <button
                  onClick={handleContinueFromServices}
                  className="px-8 py-3 rounded-full bg-dusty-rose text-cream font-light hover:bg-terracotta transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-10">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="caption text-sage hover:text-dusty-rose transition-colors"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              <span className="caption text-sage/60">
                Step {currentStep} of {quizSteps.length}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Quiz Complete Message */}
        {quizResults && currentStep === quizSteps.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 p-8 rounded-3xl bg-gradient-to-br from-warm-sand/30 to-dusty-rose/20 text-center"
          >
            <div className="inline-block mb-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-10 h-10 text-golden" />
              </motion.div>
            </div>
            <h3 className="h3 text-dune mb-3">
              Perfect! Your personalized recommendations await
            </h3>
            <p className="body text-dune/70">
              Browse our services below to find your ideal match
            </p>
          </motion.div>
        )}
      </div>
    </DrawerContainer>
  );
}