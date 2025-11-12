"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Star } from 'lucide-react';
import DrawerContainer from './DrawerContainer';
import { useDrawer } from './DrawerContext';

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
    title: "What brings you here today?",
    subtitle: "Let's start with your lash goals",
    options: [
      { id: 'classic', label: 'Classic Elegance', description: 'Natural, one-to-one application', emoji: '✨' },
      { id: 'volume', label: 'Soft Volume', description: 'Light and fluffy 2-6D fans', emoji: '🌸' },
      { id: 'mega', label: 'Mega Drama', description: 'Bold 6-10D for maximum impact', emoji: '💫' },
      { id: 'lift', label: 'Lash Lift', description: 'Enhance your natural lashes', emoji: '🌿' },
    ],
  },
  {
    id: 2,
    title: "Tell us about your experience",
    subtitle: "We'll customize your service accordingly",
    options: [
      { id: 'first_timer', label: "It's my first time", description: "Welcome! We'll take extra care", emoji: '🌱' },
      { id: 'occasional', label: 'I visit occasionally', description: 'Great to see you again', emoji: '🌺' },
      { id: 'regular', label: "I'm a regular", description: 'Welcome back, beauty', emoji: '🌹' },
      { id: 'expert', label: 'Lash connoisseur', description: 'You know exactly what you love', emoji: '👑' },
    ],
  },
  {
    id: 3,
    title: "Your signature style",
    subtitle: "How do you want to feel?",
    options: [
      { id: 'natural', label: 'Naturally Beautiful', description: 'Effortless, barely-there enhancement', emoji: '🕊' },
      { id: 'everyday', label: 'Everyday Confidence', description: 'Polished and put-together', emoji: '☀️' },
      { id: 'dramatic', label: 'Bold & Beautiful', description: 'Turn heads wherever you go', emoji: '🦋' },
      { id: 'special', label: 'Special Occasions', description: 'For those memorable moments', emoji: '✨' },
    ],
  },
];

export default function DiscoverDrawer() {
  const { setQuizResults, drawerStates, quizResults } = useDrawer();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswer = (questionId: string, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));

    if (currentStep < quizSteps.length) {
      setTimeout(() => setCurrentStep(currentStep + 1), 400);
    } else {
      // Quiz complete
      const results = {
        serviceCategory: [answers['1'] || ''],
        experience: answers['2'] || '',
        style: answers['3'] || '',
        timestamp: Date.now(),
      };
      setQuizResults(results);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(1);
    setAnswers({});
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
            {quizResults.style === 'natural' && 'Naturally Beautiful'}
            {quizResults.style === 'everyday' && 'Everyday Confidence'}
            {quizResults.style === 'dramatic' && 'Bold & Beautiful'}
            {quizResults.style === 'special' && 'Special Occasions'}
            {' • '}
            {quizResults.serviceCategory.includes('classic') && 'Classic'}
            {quizResults.serviceCategory.includes('volume') && 'Volume'}
            {quizResults.serviceCategory.includes('mega') && 'Mega'}
            {quizResults.serviceCategory.includes('lift') && 'Lift'}
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
            <div className="grid sm:grid-cols-2 gap-4">
              {currentStepData.options.map((option, index) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleAnswer(String(currentStep), option.id)}
                  className={`
                    relative p-6 rounded-2xl text-left transition-all group
                    ${answers[String(currentStep)] === option.id
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
                      <span className="text-2xl">{option.emoji}</span>
                      <div className="flex-1">
                        <p className="font-light text-lg text-dune mb-1">{option.label}</p>
                        <p className="text-sm text-dune/60">{option.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {answers[String(currentStep)] === option.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute bottom-3 right-3 w-6 h-6 bg-dusty-rose rounded-full flex items-center justify-center"
                    >
                      <div className="w-2 h-2 bg-cream rounded-full" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

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