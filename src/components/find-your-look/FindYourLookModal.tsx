'use client';

import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, ArrowRight } from 'lucide-react';

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Desktop modal with scale animation
const modalVariantsDesktop = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

// Mobile modal slides up from bottom
const modalVariantsMobile = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
};

// Quiz Question Images (Q3) - Photos from Emily for the Find Your Look quiz
const Q3_IMAGES = {
  lashLift: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945182293-ydc3xa-IMG_3301.png',
  classic: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945184945-vmeg4k-IMG_7768.png',
  hybrid: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945187288-ev1ez-IMG_8622.png',
  wet: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945191194-ahfs4b-IMG_3859.jpeg',
  volume: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945191750-burzjk-FullSizeRender_VSCO.jpeg',
} as const;

// Q4 Follow-up images (2 options each for paths that need refinement)
const Q4_IMAGES = {
  // For Classic path (B) - choose between Classic or Hybrid
  classicOption1: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945186253-845sj-IMG_0070.png',
  classicOption2: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945188685-cksu6v-IMG_3997.png',
  // For Hybrid/Wet path (C) - choose between Hybrid or Wet/Angel
  hybridOption1: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945189994-5bdlfa-IMG_0975.png',
  hybridOption2: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945191512-d4g84r-IMG_5272_VSCO.jpeg',
  // For Volume path (D) - choose between Volume or Hybrid
  volumeOption1: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945192028-4c4kyh-IMG_3927.jpeg',
  volumeOption2: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945188685-cksu6v-IMG_3997.png',
} as const;

// Quiz Result Images - Photos from Emily for results pages
const RESULT_IMAGES = {
  lashLift: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945192496-6oxub-IMG_2241.png',
  classic: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945194159-ku60w5-IMG_4302.png',
  hybrid: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945195614-f60pk8-IMG_0258.png',
  wetAngel: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945196786-ojjdf-IMG_0622.png',
  volume: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1768945198617-7qha6t-IMG_9329.png',
} as const;

// Collect all quiz images for preloading
const ALL_QUIZ_IMAGES = [
  ...Object.values(Q3_IMAGES),
  ...Object.values(Q4_IMAGES),
  ...Object.values(RESULT_IMAGES),
];

// Preload quiz images using native browser preloading
function preloadQuizImages() {
  ALL_QUIZ_IMAGES.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    // Check if already preloaded to avoid duplicates
    if (!document.querySelector(`link[href="${src}"]`)) {
      document.head.appendChild(link);
    }
  });
}

// Blur placeholder for smooth image loading - neutral warm tone matching brand
const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAcI/8QAIhAAAQMEAgIDAAAAAAAAAAAAAQIDBAUGEQASIQcxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQACAwEBAAAAAAAAAAAAAAABAgADESEE/9oADAMBAAIRAxEAPwC08j0+mVqm0eo02owZkCpR0TYr8d5LjT7TgCkLQoHCkqBBBHBBHJJFj8fUiDT+P7cZp0GOxAbpkJLLLLSUNttBhGkJSAAlKR4AAAHjnOc0xWzGvBFy6mf/2Q==';

// Quiz step type - 0 = intro, 1-4 = questions, 5 = results
type QuizStep = 0 | 1 | 2 | 3 | 4 | 5;

// Q1 Answer: Beauty routine
type Q1Answer = 'A' | 'B' | 'C' | 'D';

// Q2 Answer: Lash look feel
type Q2Answer = 'A' | 'B' | 'C' | 'D';

// Q3 Answer: Photo selection (4 lash types)
type Q3Answer = 'A' | 'B' | 'C' | 'D';

// Q4 Answer: Follow-up photo selection (only for B, C, D paths)
type Q4Answer = '1' | '2';

// Lash style result
type LashStyleResult = 'lashLift' | 'classic' | 'wetAngel' | 'hybrid' | 'volume';

interface QuizAnswers {
  q1?: Q1Answer;
  q2?: Q2Answer;
  q3?: Q3Answer;
  q4?: Q4Answer;
}

// Lash style details for results
const lashStyleDetails: Record<LashStyleResult, {
  name: string;
  displayName: string;
  recommendedService: string;
  description: string;
  bestFor: string[];
  duration?: string;
  bookingLabel: string;
}> = {
  lashLift: {
    name: 'Lash Lift',
    displayName: 'Lash Lift + Tint',
    recommendedService: 'Lash Lift + Tint',
    description: 'You love a natural, low-maintenance look that still makes your eyes pop, and a lash lift is perfect for that. A lash lift gently curls and lifts your own natural lashes from the base, making them look longer, darker, and more defined without adding extensions. Easier mornings with minimal maintenance. Pair it with a tint and you\'ll look like you\'re wearing mascara.',
    bestFor: [
      'You want the lowest maintenance option',
      'You want very natural results',
      'You want a fresh makeup-free look',
    ],
    duration: 'Results last about 6–8 weeks',
    bookingLabel: 'Book Lash Lift + Tint',
  },
  classic: {
    name: 'Classic',
    displayName: 'Classic Lashes',
    recommendedService: 'Classic Lashes',
    description: 'You love a natural, polished look that still makes your eyes stand out. Classic lashes add length and definition by placing one extension on each natural lash, while keeping things soft and effortless. That "better than mascara" but without the mascara look.',
    bestFor: [
      'First-time extension clients',
      'Natural makeup lovers',
      'Everyday wear',
    ],
    bookingLabel: 'Book Classic Full Set',
  },
  wetAngel: {
    name: 'Wet / Angel',
    displayName: 'Wet / Angel Lashes',
    recommendedService: 'Wet / Angel Set',
    description: 'You love a modern, clean, model-off-duty look. Wet and Angel sets give you glossy, defined lashes that feel natural but elevated. Wet / angel lashes create soft, wispy spikes that give your eyes a bright, fresh look. Perfect if you want definition and texture while still keeping things light and airy.',
    bestFor: [
      'You like a soft but noticeable lash look',
      'You love a fresh, dewy, "model off duty" vibe',
      'You love a minimal makeup routine',
    ],
    bookingLabel: 'Book Wet / Angel Set',
  },
  hybrid: {
    name: 'Hybrid',
    displayName: 'Hybrid Lashes',
    recommendedService: 'Hybrid Lashes',
    description: 'You like your lashes a little fuller and more textured but still a soft and everyday look. Hybrid lashes blend classic and volume techniques for the perfect balance of texture and fullness.',
    bestFor: [
      'You want more fullness than classic, but not too dramatic',
      'You love a fluffy, textured finish',
      'You want a look that transitions easily from day to night',
    ],
    bookingLabel: 'Book Hybrid Full Set',
  },
  volume: {
    name: 'Volume',
    displayName: 'Volume Lashes',
    recommendedService: 'Volume Lashes',
    description: 'You love bold, fluffy lashes that make a statement. Volume sets give you maximum fullness and drama for a high-impact look.',
    bestFor: [
      'Full glam fans',
      'Sparse natural lashes',
      'You love a dark and full lash line',
    ],
    bookingLabel: 'Book Volume Full Set',
  },
};

// Determine result based on Q3 and Q4 answers
function calculateResult(answers: QuizAnswers): LashStyleResult {
  const { q3, q4 } = answers;

  // If Q3 = A (Lash Lift), go directly to Lash Lift result
  if (q3 === 'A') {
    return 'lashLift';
  }

  // If Q3 = B (Classic path) - Classic or Hybrid
  if (q3 === 'B') {
    if (q4 === '1') return 'classic';
    if (q4 === '2') return 'hybrid';
    return 'classic'; // fallback
  }

  // If Q3 = C (Hybrid/Wet path) - Hybrid or Wet/Angel
  if (q3 === 'C') {
    if (q4 === '1') return 'hybrid';
    if (q4 === '2') return 'wetAngel';
    return 'hybrid'; // fallback
  }

  // If Q3 = D (Volume path) - Volume or Hybrid
  if (q3 === 'D') {
    if (q4 === '1') return 'volume';
    if (q4 === '2') return 'hybrid';
    return 'volume'; // fallback
  }

  return 'classic'; // fallback
}

// Export types for external use
export type { LashStyleResult, QuizStep };
export { lashStyleDetails, RESULT_IMAGES };

// Ref handle for controlling quiz from parent
export interface FindYourLookContentRef {
  handleBack: () => void;
  canGoBack: boolean;
  currentStep: QuizStep;
  getHeaderTitle: () => string;
}

// Embedded quiz content component (no modal wrapper) for morphing animation
interface FindYourLookContentProps {
  onBook: (lashStyle: string) => void;
  onClose: () => void;
  isMobile: boolean;
  disableAutoBook?: boolean; // When true, don't auto-call onBook on results
  onStepChange?: (step: QuizStep, headerTitle: string) => void; // Notify parent of step changes
}

export const FindYourLookContent = forwardRef<FindYourLookContentRef, FindYourLookContentProps>(
  function FindYourLookContent({ onBook, onClose, isMobile, disableAutoBook, onStepChange }, ref) {
  const [step, setStep] = useState<QuizStep>(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState<LashStyleResult | null>(null);

  const handleBack = useCallback(() => {
    if (step > 0) {
      if (step === 5) {
        if (answers.q3 === 'A') {
          setStep(3);
        } else {
          setStep(4);
        }
        setResult(null);
      } else {
        setStep((s) => (s - 1) as QuizStep);
      }
    }
  }, [step, answers.q3]);

  const getTotalSteps = () => {
    if (step === 0) return 4;
    if (answers.q3 === 'A') return 4;
    return 5;
  };

  const getCurrentStepNumber = () => {
    if (step === 0) return 0;
    if (step === 5) return getTotalSteps();
    return step;
  };

  const getHeaderTitle = useCallback(() => {
    if (step === 0) return 'Find Your Look';
    if (step === 5) return 'Your Result';
    const totalSteps = answers.q3 === 'A' ? 4 : 5;
    return `Question ${step} of ${totalSteps}`;
  }, [step, answers.q3]);

  // Notify parent of step changes for header updates
  useEffect(() => {
    if (onStepChange) {
      onStepChange(step, getHeaderTitle());
    }
  }, [step, getHeaderTitle, onStepChange]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleBack,
    canGoBack: step > 0,
    currentStep: step,
    getHeaderTitle,
  }), [handleBack, step, getHeaderTitle]);

  const handleStartQuiz = () => {
    setStep(1);
  };

  const handleQ1Answer = (answer: Q1Answer) => {
    setAnswers((prev) => ({ ...prev, q1: answer }));
    setStep(2);
  };

  const handleQ2Answer = (answer: Q2Answer) => {
    setAnswers((prev) => ({ ...prev, q2: answer }));
    setStep(3);
  };

  const handleQ3Answer = (answer: Q3Answer) => {
    const newAnswers = { ...answers, q3: answer };
    setAnswers(newAnswers);

    if (answer === 'A') {
      setResult('lashLift');
      setStep(5);
    } else {
      setStep(4);
    }
  };

  const handleQ4Answer = (answer: Q4Answer) => {
    const newAnswers = { ...answers, q4: answer };
    setAnswers(newAnswers);
    const calculatedResult = calculateResult(newAnswers);
    setResult(calculatedResult);
    setStep(5);
  };

  const handleBookNow = () => {
    if (result) {
      onBook(result);
    }
  };

  return (
    <div
      className="flex-1 min-h-0 p-4 md:p-8 flex flex-col overflow-y-auto"
      style={isMobile ? {
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      } : undefined}
    >
      {/* Step indicator dots (hidden on intro) */}
      {step > 0 && (
        <div className="flex justify-center gap-2 md:gap-2.5 mb-4 md:mb-5 shrink-0">
          {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                s === getCurrentStepNumber()
                  ? 'bg-terracotta w-5 md:w-6'
                  : s < getCurrentStepNumber()
                  ? 'bg-terracotta/40 w-1.5 md:w-2'
                  : 'bg-cream w-1.5 md:w-2'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step content */}
      <motion.div
        className="flex-1 min-h-0 overflow-hidden"
        layout
        transition={{
          layout: {
            type: 'spring',
            stiffness: 180,
            damping: 28,
            mass: 1,
          }
        }}
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <IntroScreen key="intro" onStart={handleStartQuiz} />
          )}

          {step === 1 && (
            <Q1BeautyRoutine key="q1" onAnswer={handleQ1Answer} />
          )}

          {step === 2 && (
            <Q2LashLookFeel key="q2" onAnswer={handleQ2Answer} />
          )}

          {step === 3 && (
            <Q3PhotoSelection key="q3" onAnswer={handleQ3Answer} images={Q3_IMAGES} />
          )}

          {step === 4 && (
            <Q4FollowUp
              key="q4"
              q3Answer={answers.q3!}
              onAnswer={handleQ4Answer}
              images={Q4_IMAGES}
            />
          )}

          {step === 5 && result && (
            <ResultScreen
              key="result"
              result={lashStyleDetails[result]}
              resultImage={RESULT_IMAGES[result]}
              onBook={handleBookNow}
              isMobile={isMobile}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

interface FindYourLookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook?: (lashStyle: string) => void;
}

export function FindYourLookModal({ isOpen, onClose, onBook }: FindYourLookModalProps) {
  const [step, setStep] = useState<QuizStep>(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState<LashStyleResult | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Reset quiz state when modal opens (ensures fresh start each time)
  // Also preload all quiz images for instant loading
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setAnswers({});
      setResult(null);
      // Preload all quiz images when modal opens
      preloadQuizImages();
    }
  }, [isOpen]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      // If on results, go back to Q4 or Q3 depending on path
      if (step === 5) {
        if (answers.q3 === 'A') {
          setStep(3); // Go back to Q3 for lash lift path (no Q4)
        } else {
          setStep(4); // Go back to Q4 for B, C, D paths
        }
        setResult(null);
      } else {
        setStep((s) => (s - 1) as QuizStep);
      }
    }
  }, [step, answers.q3]);

  const handleClose = useCallback(() => {
    setStep(0);
    setAnswers({});
    setResult(null);
    onClose();
  }, [onClose]);

  const handleStartQuiz = () => {
    setStep(1);
  };

  const handleQ1Answer = (answer: Q1Answer) => {
    setAnswers((prev) => ({ ...prev, q1: answer }));
    setStep(2);
  };

  const handleQ2Answer = (answer: Q2Answer) => {
    setAnswers((prev) => ({ ...prev, q2: answer }));
    setStep(3);
  };

  const handleQ3Answer = (answer: Q3Answer) => {
    const newAnswers = { ...answers, q3: answer };
    setAnswers(newAnswers);

    // Only Lash Lift (A) goes directly to results
    if (answer === 'A') {
      setResult('lashLift');
      setStep(5);
    } else {
      // B, C, D all go to Q4 for follow-up refinement
      setStep(4);
    }
  };

  const handleQ4Answer = (answer: Q4Answer) => {
    const newAnswers = { ...answers, q4: answer };
    setAnswers(newAnswers);
    const calculatedResult = calculateResult(newAnswers);
    setResult(calculatedResult);
    setStep(5);
  };

  // Auto-open services modal when quiz completes with results
  useEffect(() => {
    if (step === 5 && result && onBook) {
      // Small delay to let the results page render briefly before transitioning
      const timer = setTimeout(() => {
        onBook(result);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, result, onBook]);

  const handleBookNow = () => {
    if (result && onBook) {
      onBook(result);
      // Note: handleQuizResult in ServiceBrowserContext already closes the quiz
      // and opens the services modal, so we don't call handleClose() here
    }
  };

  // Calculate total steps based on path (4 for lash lift, 5 for others with Q4)
  const getTotalSteps = () => {
    if (step === 0) return 4; // Before starting
    if (answers.q3 === 'A') return 4; // Lash lift path: no Q4
    return 5; // B, C, D paths: includes Q4 for refinement
  };

  // Get current step number for display (excluding intro)
  const getCurrentStepNumber = () => {
    if (step === 0) return 0;
    if (step === 5) return getTotalSteps();
    return step;
  };

  // Get title for mobile header
  const getMobileTitle = () => {
    if (step === 0) return 'Find Your Look';
    if (step === 5) return 'Your Result';
    return `Question ${step} of ${getTotalSteps()}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - hidden on mobile for fullscreen feel */}
          <motion.div
            key="find-your-look-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 hidden md:block"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="find-your-look-modal"
            variants={isMobile ? modalVariantsMobile : modalVariantsDesktop}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: isMobile ? 0.35 : 0.3,
              ease: isMobile ? [0.32, 0.72, 0, 1] : [0.4, 0, 0.2, 1]
            }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6 pointer-events-none"
          >
            <div
              className="relative w-full h-full md:w-full md:max-w-[480px] md:h-auto md:max-h-[90vh] bg-ivory md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
              style={isMobile ? {
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
              } : undefined}
            >
              {/* Mobile Header - Full-width with safe area support */}
              {isMobile ? (
                <div className="flex items-center justify-between px-4 py-3 border-b border-sage/10 shrink-0 bg-ivory/95 backdrop-blur-sm">
                  {/* Left side - Back button or spacer */}
                  <div className="w-10 flex justify-start">
                    {step > 0 && (
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full hover:bg-sage/10 active:bg-sage/20 transition-colors"
                        aria-label="Go back"
                      >
                        <ChevronLeft className="w-5 h-5 text-dune" />
                      </motion.button>
                    )}
                  </div>

                  {/* Center - Title */}
                  <h2 className="flex-1 text-center text-base font-display font-medium text-charcoal truncate px-2">
                    {getMobileTitle()}
                  </h2>

                  {/* Right side - Close button */}
                  <div className="w-10 flex justify-end">
                    <button
                      onClick={handleClose}
                      className="p-2 -mr-2 rounded-full hover:bg-sage/10 active:bg-sage/20 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-dune" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Desktop floating buttons */
                <>
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white
                               text-sage hover:text-charcoal transition-all shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {step > 0 && (
                    <button
                      onClick={handleBack}
                      className="absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white
                                 text-sage hover:text-charcoal transition-all shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}

              {/* Content */}
              <div
                className="flex-1 min-h-0 p-4 md:p-8 flex flex-col overflow-y-auto"
                style={isMobile ? {
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                } : undefined}
              >
                {/* Step indicator dots (hidden on intro) */}
                {step > 0 && (
                  <div className="flex justify-center gap-2 md:gap-2.5 mb-4 md:mb-5 shrink-0">
                    {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((s) => (
                      <div
                        key={s}
                        className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                          s === getCurrentStepNumber()
                            ? 'bg-terracotta w-5 md:w-6'
                            : s < getCurrentStepNumber()
                            ? 'bg-terracotta/40 w-1.5 md:w-2'
                            : 'bg-cream w-1.5 md:w-2'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Step content */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {step === 0 && (
                      <IntroScreen key="intro" onStart={handleStartQuiz} />
                    )}

                    {step === 1 && (
                      <Q1BeautyRoutine key="q1" onAnswer={handleQ1Answer} />
                    )}

                    {step === 2 && (
                      <Q2LashLookFeel key="q2" onAnswer={handleQ2Answer} />
                    )}

                    {step === 3 && (
                      <Q3PhotoSelection key="q3" onAnswer={handleQ3Answer} images={Q3_IMAGES} />
                    )}

                    {step === 4 && (
                      <Q4FollowUp
                        key="q4"
                        q3Answer={answers.q3!}
                        onAnswer={handleQ4Answer}
                        images={Q4_IMAGES}
                      />
                    )}

                    {step === 5 && result && (
                      <ResultScreen
                        key="result"
                        result={lashStyleDetails[result]}
                        resultImage={RESULT_IMAGES[result]}
                        onBook={handleBookNow}
                        isMobile={isMobile}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Intro Screen
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col items-center justify-center text-center px-4"
    >
      <h1 className="text-3xl md:text-4xl font-display font-medium text-charcoal mb-4">
        Find Your Perfect Lash Look
      </h1>
      <p className="text-sage text-base md:text-lg leading-relaxed mb-8 max-w-sm">
        Answer a few quick questions and we&apos;ll match you with the lash style that fits your vibe, lifestyle, and natural lashes.
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="flex items-center gap-2 px-8 py-4 rounded-full bg-terracotta hover:bg-rust text-white font-medium
                   shadow-lg shadow-terracotta/30 transition-all duration-200"
      >
        Start Quiz
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

// Q1: Beauty Routine
function Q1BeautyRoutine({ onAnswer }: { onAnswer: (answer: Q1Answer) => void }) {
  const options: { value: Q1Answer; label: string }[] = [
    { value: 'A', label: 'Sunscreen, lip balm, and I\'m out the door' },
    { value: 'B', label: 'Light makeup, soft and natural' },
    { value: 'C', label: 'Full makeup and all the glam' },
    { value: 'D', label: 'It depends - sometimes simple, sometimes glam' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col justify-center"
    >
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-display font-medium text-charcoal">
          How would you describe your everyday beauty routine?
        </h2>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onAnswer(option.value)}
            className="w-full p-4 md:p-5 rounded-xl bg-cream/50 hover:bg-cream border border-blush/30
                       text-left transition-all duration-200 group"
          >
            <span className="text-charcoal group-hover:text-terracotta transition-colors text-sm md:text-base">
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Q2: Lash Look Feel
function Q2LashLookFeel({ onAnswer }: { onAnswer: (answer: Q2Answer) => void }) {
  const options: { value: Q2Answer; label: string }[] = [
    { value: 'A', label: 'Barely there, just a subtle boost' },
    { value: 'B', label: 'Soft and natural, perfect for everyday' },
    { value: 'C', label: 'Fuller with a little texture' },
    { value: 'D', label: 'Bold and dramatic' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col justify-center"
    >
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-display font-medium text-charcoal">
          When it comes to your lashes, you love a look that feels…
        </h2>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onAnswer(option.value)}
            className="w-full p-4 md:p-5 rounded-xl bg-cream/50 hover:bg-cream border border-blush/30
                       text-left transition-all duration-200 group"
          >
            <span className="text-charcoal group-hover:text-terracotta transition-colors text-sm md:text-base">
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Q3: Photo Selection (4 main lash types in 2x2 grid)
interface Q3Props {
  onAnswer: (answer: Q3Answer) => void;
  images: typeof Q3_IMAGES;
}

function Q3PhotoSelection({ onAnswer, images }: Q3Props) {
  // Show 4 main lash types in a 2x2 grid for clear visibility
  const options: { value: Q3Answer; image: string; label: string }[] = [
    { value: 'A', image: images.lashLift, label: 'Lash Lift' },
    { value: 'B', image: images.classic, label: 'Classic' },
    { value: 'C', image: images.hybrid, label: 'Hybrid' },
    { value: 'D', image: images.wet, label: 'Wet / Angel' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      <div className="text-center mb-4 shrink-0">
        <h2 className="text-xl md:text-2xl font-display font-medium text-charcoal mb-2">
          Tap the look you&apos;re most drawn to
        </h2>
        <p className="text-xs md:text-sm text-sage leading-relaxed max-w-xs mx-auto">
          We&apos;ll customize everything to you at your appointment.
        </p>
      </div>

      {/* 2x2 grid with large, visible images */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1 min-h-0">
        {options.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(option.value)}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-md"
          >
            <Image
              src={option.image}
              alt={option.label}
              fill
              priority
              sizes="(max-width: 768px) 45vw, 200px"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
              <span className="text-white text-sm md:text-base font-medium drop-shadow-lg">
                {option.label}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Q4: Follow-up Photo Selection (2 images based on Q3)
interface Q4Props {
  q3Answer: Q3Answer;
  onAnswer: (answer: Q4Answer) => void;
  images: typeof Q4_IMAGES;
}

function Q4FollowUp({ q3Answer, onAnswer, images }: Q4Props) {
  // Get the two image options based on Q3 answer
  const getOptions = (): { value: Q4Answer; image: string; label: string }[] => {
    switch (q3Answer) {
      case 'B': // Classic path - Classic or Hybrid
        return [
          { value: '1', image: images.classicOption1, label: 'Classic' },
          { value: '2', image: images.classicOption2, label: 'Hybrid' },
        ];
      case 'C': // Hybrid/Wet path - Hybrid or Wet/Angel
        return [
          { value: '1', image: images.hybridOption1, label: 'Hybrid' },
          { value: '2', image: images.hybridOption2, label: 'Wet / Angel' },
        ];
      case 'D': // Volume path - Volume or Hybrid
        return [
          { value: '1', image: images.volumeOption1, label: 'Volume' },
          { value: '2', image: images.volumeOption2, label: 'Hybrid' },
        ];
      default:
        return [];
    }
  };

  const options = getOptions();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      <div className="text-center mb-4 shrink-0">
        <h2 className="text-lg md:text-xl font-display font-medium text-charcoal mb-2">
          Which style feels most like you?
        </h2>
        <p className="text-xs md:text-sm text-sage leading-relaxed max-w-sm mx-auto">
          Length, curl and color can all be customized by your lash stylist to fit your preference.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
        {options.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(option.value)}
            className="relative aspect-[3/4] rounded-xl overflow-hidden group"
          >
            <Image
              src={option.image}
              alt={option.label}
              fill
              sizes="(max-width: 768px) 45vw, 200px"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
              <span className="text-white text-sm font-medium">
                {option.label}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Result Screen
interface ResultScreenProps {
  result: typeof lashStyleDetails[LashStyleResult];
  resultImage: string;
  onBook: () => void;
  isMobile?: boolean;
}

function ResultScreen({ result, resultImage, onBook, isMobile }: ResultScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      {/* Scrollable content area */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20' : ''}`}>
        {/* Header */}
        <div className="text-center mb-3 md:mb-4 shrink-0">
          <p className="text-xs md:text-sm text-terracotta font-medium mb-1">Your Perfect Match</p>
          <h2 className="text-lg md:text-2xl font-display font-medium text-charcoal">
            {result.displayName}
          </h2>
          <p className="text-[11px] md:text-xs text-sage mt-1">Recommended Service: {result.recommendedService}</p>
        </div>

        {/* Result Image */}
        <div className="relative w-full h-36 md:h-48 rounded-xl overflow-hidden mb-3 md:mb-4 shrink-0">
          <Image
            src={resultImage}
            alt={result.displayName}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover"
          />
        </div>

        {/* Description */}
        <p className="text-sage text-sm leading-relaxed mb-3 md:mb-4 shrink-0">
          {result.description}
        </p>

        {/* Best For */}
        <div className="mb-3 md:mb-4 shrink-0">
          <p className="text-charcoal font-medium text-sm mb-2">Best for you if:</p>
          <ul className="space-y-1 md:space-y-1.5">
            {result.bestFor.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sage text-sm">
                <span className="text-terracotta mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Duration (for Lash Lift only) */}
        {result.duration && (
          <p className="text-sage text-sm italic mb-3 md:mb-4 shrink-0">{result.duration}</p>
        )}

        {/* Customization Note */}
        <div className="bg-cream/60 rounded-xl p-3 md:p-4 mb-3 md:mb-4 shrink-0">
          <p className="text-sage text-xs md:text-sm leading-relaxed">
            <span className="font-medium text-charcoal">Love this vibe but want some adjustments?</span>{' '}
            Length, curl, color, shape and fullness are fully customizable. Feel free to save any lash photos you love and bring them to your appointment to show your lash artist for inspiration.
          </p>
        </div>

        {/* Desktop Book CTA */}
        {!isMobile && (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBook}
              className="w-full py-4 rounded-full bg-terracotta hover:bg-rust text-white font-medium
                         shadow-lg shadow-terracotta/30 transition-all duration-200 mb-3 shrink-0"
            >
              {result.bookingLabel} →
            </motion.button>

            {/* Universal Note */}
            <p className="text-xs text-sage/70 text-center leading-relaxed shrink-0">
              Every set is customized to your eye shape and natural lashes. Your artist will fine-tune your look during your appointment so you leave loving your lashes.
            </p>
          </>
        )}
      </div>

      {/* Mobile Sticky Book CTA */}
      {isMobile && (
        <div
          className="absolute bottom-0 left-0 right-0 p-4 bg-ivory/95 backdrop-blur-sm border-t border-sage/10"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onBook}
            className="w-full py-3.5 rounded-full bg-terracotta text-white font-medium
                       shadow-lg shadow-terracotta/30 active:shadow-md transition-shadow"
          >
            {result.bookingLabel} →
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

export default FindYourLookModal;
