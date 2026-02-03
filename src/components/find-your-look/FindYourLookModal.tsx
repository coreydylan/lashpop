'use client';

import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, ArrowRight, AlertCircle } from 'lucide-react';

import { useQuizAlgorithm } from './useQuizAlgorithm';
import { PhotoComparisonRound } from './PhotoComparisonRound';
import {
  type LashStyle,
  type QuizPhoto,
  type Q1Answer,
  type Q2Answer,
  LASH_STYLE_DETAILS,
  RESULT_IMAGES,
  QUIZ_CONFIG,
} from './types';
import { getQuizPhotosForQuiz } from '@/actions/quiz-photos';

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

// Blur placeholder for smooth image loading - neutral warm tone matching brand
const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAcI/8QAIhAAAQMEAgIDAAAAAAAAAAAAAQIDBAUGEQASIQcxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQACAwEBAAAAAAAAAAAAAAABAgADESEE/9oADAMBAAIRAxEAPwC08j0+mVqm0eo02owZkCpR0TYr8d5LjT7TgCkLQoHCkqBBBHBBHJJFj8fUiDT+P7cZp0GOxAbpkJLLLSUNttBhGkJSAAlKR4AAAHjnOc0xWzGvBFy6mf/2Q==';

// Quiz step type - 0 = intro, 1 = q1, 2 = q2, 3 = photo comparison, 4 = results
type QuizStep = 0 | 1 | 2 | 3 | 4;

// Export types for external use
export type { LashStyle, QuizStep };
export { LASH_STYLE_DETAILS as lashStyleDetails, RESULT_IMAGES };

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
  disableAutoBook?: boolean;
  onStepChange?: (step: QuizStep, headerTitle: string) => void;
}

export const FindYourLookContent = forwardRef<FindYourLookContentRef, FindYourLookContentProps>(
  function FindYourLookContent({ onBook, onClose, isMobile, disableAutoBook, onStepChange }, ref) {
    const [step, setStep] = useState<QuizStep>(0);
    const [photosByStyle, setPhotosByStyle] = useState<Record<LashStyle, QuizPhoto[]>>({
      classic: [],
      hybrid: [],
      wetAngel: [],
      volume: [],
    });
    const [photosLoading, setPhotosLoading] = useState(false);
    const [photosError, setPhotosError] = useState<string | null>(null);

    // Quiz algorithm hook
    const quiz = useQuizAlgorithm({ photosByStyle });

    // Fetch photos when quiz starts
    useEffect(() => {
      const loadPhotos = async () => {
        setPhotosLoading(true);
        setPhotosError(null);
        try {
          const photos = await getQuizPhotosForQuiz();
          setPhotosByStyle(photos as Record<LashStyle, QuizPhoto[]>);
        } catch (error) {
          console.error('Error loading quiz photos:', error);
          setPhotosError('Failed to load quiz photos');
        } finally {
          setPhotosLoading(false);
        }
      };

      loadPhotos();
    }, []);

    const handleBack = useCallback(() => {
      if (step === 4) {
        // From results, go back to last photo comparison
        setStep(3);
        quiz.reset();
      } else if (step > 0) {
        setStep((s) => (s - 1) as QuizStep);
        if (step === 3) {
          // Reset quiz algorithm when going back from photo comparison
          quiz.reset();
        }
      }
    }, [step, quiz]);

    const getTotalSteps = () => {
      // Intro (0) + Q1 (1) + Q2 (2) + Photo rounds (3) + Result (4)
      // We show steps 1-4 in the indicator, with step 3 being "dynamic"
      return 4;
    };

    const getCurrentStepNumber = () => {
      if (step === 0) return 0;
      if (step === 4) return 4;
      if (step === 3) {
        // Photo comparison phase - show round progress
        return 3;
      }
      return step;
    };

    const getHeaderTitle = useCallback(() => {
      if (step === 0) return 'Find Your Look';
      if (step === 4) return 'Your Result';
      if (step === 3) {
        return `Comparing Looks`;
      }
      return `Question ${step} of 2`;
    }, [step]);

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
      quiz.applyQ1Answer(answer);
      setStep(2);
    };

    const handleQ2Answer = (answer: Q2Answer) => {
      quiz.applyQ2Answer(answer);
      // Start photo comparison
      quiz.startPhotoComparison();
      setStep(3);
    };

    const handlePhotoSelect = (selectedStyle: LashStyle) => {
      quiz.selectPhoto(selectedStyle);

      // Check if quiz is complete
      if (quiz.result) {
        setStep(4);
      }
    };

    // Watch for quiz result
    useEffect(() => {
      if (quiz.result && step === 3) {
        setStep(4);
      }
    }, [quiz.result, step]);

    const handleBookNow = () => {
      if (quiz.result) {
        onBook(quiz.result);
      }
    };

    // Check if quiz has enough photos
    const hasEnoughPhotos = Object.values(photosByStyle).every(
      photos => photos.filter(p => p.isEnabled !== false).length >= 2
    );

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
              <IntroScreen
                key="intro"
                onStart={handleStartQuiz}
                loading={photosLoading}
                error={photosError}
                hasEnoughPhotos={hasEnoughPhotos}
              />
            )}

            {step === 1 && (
              <Q1BeautyRoutine key="q1" onAnswer={handleQ1Answer} />
            )}

            {step === 2 && (
              <Q2LashLookFeel key="q2" onAnswer={handleQ2Answer} />
            )}

            {step === 3 && quiz.currentPair && (
              <PhotoComparisonRound
                key={`comparison-${quiz.roundNumber}`}
                pair={quiz.currentPair}
                onSelect={handlePhotoSelect}
              />
            )}

            {step === 4 && quiz.result && (
              <ResultScreen
                key="result"
                result={LASH_STYLE_DETAILS[quiz.result]}
                resultImage={RESULT_IMAGES[quiz.result]}
                onBook={handleBookNow}
                isMobile={isMobile}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }
);

interface FindYourLookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook?: (lashStyle: string) => void;
}

export function FindYourLookModal({ isOpen, onClose, onBook }: FindYourLookModalProps) {
  const [step, setStep] = useState<QuizStep>(0);
  const [photosByStyle, setPhotosByStyle] = useState<Record<LashStyle, QuizPhoto[]>>({
    classic: [],
    hybrid: [],
    wetAngel: [],
    volume: [],
  });
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Quiz algorithm hook
  const quiz = useQuizAlgorithm({ photosByStyle });

  // Reset quiz state when modal opens
  // Also fetch photos
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      quiz.reset();
      setPhotosError(null);

      // Fetch photos
      const loadPhotos = async () => {
        setPhotosLoading(true);
        try {
          const photos = await getQuizPhotosForQuiz();
          setPhotosByStyle(photos as Record<LashStyle, QuizPhoto[]>);
        } catch (error) {
          console.error('Error loading quiz photos:', error);
          setPhotosError('Failed to load quiz photos');
        } finally {
          setPhotosLoading(false);
        }
      };

      loadPhotos();
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
    if (step === 4) {
      setStep(3);
      // Don't reset quiz - keep scores, but need to restart photo comparison
    } else if (step === 3) {
      setStep(2);
      quiz.reset();
    } else if (step > 0) {
      setStep((s) => (s - 1) as QuizStep);
    }
  }, [step, quiz]);

  const handleClose = useCallback(() => {
    setStep(0);
    quiz.reset();
    onClose();
  }, [onClose, quiz]);

  const handleStartQuiz = () => {
    setStep(1);
  };

  const handleQ1Answer = (answer: Q1Answer) => {
    quiz.applyQ1Answer(answer);
    setStep(2);
  };

  const handleQ2Answer = (answer: Q2Answer) => {
    quiz.applyQ2Answer(answer);
    quiz.startPhotoComparison();
    setStep(3);
  };

  const handlePhotoSelect = (selectedStyle: LashStyle) => {
    quiz.selectPhoto(selectedStyle);
  };

  // Watch for quiz result
  useEffect(() => {
    if (quiz.result && step === 3) {
      setStep(4);
    }
  }, [quiz.result, step]);

  // Auto-open services modal when quiz completes with results
  useEffect(() => {
    if (step === 4 && quiz.result && onBook) {
      const timer = setTimeout(() => {
        onBook(quiz.result!);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, quiz.result, onBook]);

  const handleBookNow = () => {
    if (quiz.result && onBook) {
      onBook(quiz.result);
    }
  };

  // Get mobile title
  const getMobileTitle = () => {
    if (step === 0) return 'Find Your Look';
    if (step === 4) return 'Your Result';
    if (step === 3) return `Round ${quiz.roundNumber}`;
    return `Question ${step} of 2`;
  };

  // Check if quiz has enough photos
  const hasEnoughPhotos = Object.values(photosByStyle).every(
    photos => photos.filter(p => p.isEnabled !== false).length >= 2
  );

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
              className="relative w-full h-full md:w-full md:max-w-[480px] md:h-auto md:max-h-[90vh] bg-rose-mist md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
              style={isMobile ? {
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
              } : undefined}
            >
              {/* Mobile Header */}
              {isMobile ? (
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 shrink-0 bg-rose-mist/95 backdrop-blur-sm">
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

                  <h2 className="flex-1 text-center text-base font-display font-medium text-charcoal truncate px-2">
                    {getMobileTitle()}
                  </h2>

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
                <>
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white
                               text-charcoal hover:text-charcoal transition-all shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {step > 0 && (
                    <button
                      onClick={handleBack}
                      className="absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white
                                 text-charcoal hover:text-charcoal transition-all shadow-sm"
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
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                          (s <= 2 && step >= s) || (s === 3 && step === 3) || (s === 4 && step === 4)
                            ? s === step || (s === 3 && step === 3)
                              ? 'bg-terracotta w-5 md:w-6'
                              : 'bg-terracotta/40 w-1.5 md:w-2'
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
                      <IntroScreen
                        key="intro"
                        onStart={handleStartQuiz}
                        loading={photosLoading}
                        error={photosError}
                        hasEnoughPhotos={hasEnoughPhotos}
                      />
                    )}

                    {step === 1 && (
                      <Q1BeautyRoutine key="q1" onAnswer={handleQ1Answer} />
                    )}

                    {step === 2 && (
                      <Q2LashLookFeel key="q2" onAnswer={handleQ2Answer} />
                    )}

                    {step === 3 && quiz.currentPair && (
                      <PhotoComparisonRound
                        key={`comparison-${quiz.roundNumber}`}
                        pair={quiz.currentPair}
                        onSelect={handlePhotoSelect}
                      />
                    )}

                    {step === 4 && quiz.result && (
                      <ResultScreen
                        key="result"
                        result={LASH_STYLE_DETAILS[quiz.result]}
                        resultImage={RESULT_IMAGES[quiz.result]}
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
function IntroScreen({
  onStart,
  loading,
  error,
  hasEnoughPhotos
}: {
  onStart: () => void;
  loading?: boolean;
  error?: string | null;
  hasEnoughPhotos?: boolean;
}) {
  const canStart = !loading && !error && hasEnoughPhotos !== false;

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
      <p className="text-charcoal text-base md:text-lg leading-relaxed mb-8 max-w-sm">
        Answer a few quick questions and compare photo pairs to discover the lash style that fits your vibe.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-terracotta/10 border border-terracotta/30 flex items-start gap-3 max-w-sm">
          <AlertCircle className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
          <p className="text-sm text-charcoal">{error}</p>
        </div>
      )}

      {!hasEnoughPhotos && !loading && !error && (
        <div className="mb-6 p-4 rounded-xl bg-golden/10 border border-golden/30 flex items-start gap-3 max-w-sm">
          <AlertCircle className="w-5 h-5 text-golden flex-shrink-0 mt-0.5" />
          <p className="text-sm text-charcoal">Quiz photos are being set up. Please try again later.</p>
        </div>
      )}

      <motion.button
        whileHover={canStart ? { scale: 1.02 } : {}}
        whileTap={canStart ? { scale: 0.98 } : {}}
        onClick={onStart}
        disabled={!canStart}
        className="flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white text-white font-medium
                   hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading...
          </>
        ) : (
          <>
            Start Quiz
            <ArrowRight className="w-4 h-4" />
          </>
        )}
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
          When it comes to your lashes, you love a look that feels...
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

// Result Screen
interface ResultScreenProps {
  result: typeof LASH_STYLE_DETAILS[LashStyle];
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
          <p className="text-[11px] md:text-xs text-charcoal mt-1">Recommended Service: {result.recommendedService}</p>
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
        <p className="text-charcoal text-sm leading-relaxed mb-3 md:mb-4 shrink-0">
          {result.description}
        </p>

        {/* Best For */}
        <div className="mb-3 md:mb-4 shrink-0">
          <p className="text-charcoal font-medium text-sm mb-2">Best for you if:</p>
          <ul className="space-y-1 md:space-y-1.5">
            {result.bestFor.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-charcoal text-sm">
                <span className="text-dusty-rose mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Customization Note */}
        <div className="bg-cream/60 rounded-xl p-3 md:p-4 mb-3 md:mb-4 shrink-0">
          <p className="text-charcoal text-xs md:text-sm leading-relaxed">
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
              className="w-full py-4 rounded-full bg-dusty-rose hover:bg-dusty-rose/90 text-white font-medium
                         shadow-lg shadow-dusty-rose/30 transition-all duration-200 mb-3 shrink-0"
            >
              {result.bookingLabel} →
            </motion.button>

            <p className="text-xs text-charcoal/70 text-center leading-relaxed shrink-0">
              Every set is customized to your eye shape and natural lashes. Your artist will fine-tune your look during your appointment so you leave loving your lashes.
            </p>
          </>
        )}
      </div>

      {/* Mobile Sticky Book CTA */}
      {isMobile && (
        <div
          className="absolute bottom-0 left-0 right-0 p-4 bg-rose-mist/95 backdrop-blur-sm border-t border-white/20"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onBook}
            className="w-full py-3.5 rounded-full bg-dusty-rose text-white font-medium
                       shadow-lg shadow-dusty-rose/30 active:shadow-md transition-shadow"
          >
            {result.bookingLabel} →
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

export default FindYourLookModal;
