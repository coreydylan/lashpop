'use client';

import React, { useState, useCallback, useEffect } from 'react';
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

// Placeholder images - these should be updated with actual DAM images
// Q3 Images (4 lash style photos)
const Q3_IMAGES = {
  lashLift: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913826908-6hzrr-Facetune_11-11-2025-17-14-06.jpeg',
  classic: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913825367-ukjfzn-Facetune_11-11-2025-17-14-59.jpeg',
  hybridWet: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913823492-qo5v6m-Facetune_11-11-2025-17-15-29.jpeg',
  volume: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913818972-vqyxvb-Facetune_20-09-2025-16-55-05.jpeg',
} as const;

// Q4 Follow-up images (2 options each for B, C, D paths)
const Q4_IMAGES = {
  // For Classic path (B) - choose between Classic or Hybrid
  classicOption1: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913814498-011mtb-IMG_1268.JPG',
  classicOption2: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913812439-dvx0zn-IMG_1266.JPG',
  // For Hybrid/Wet path (C) - choose between Hybrid or Volume
  hybridOption1: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913809619-nc5gi-IMG_1253.JPG',
  hybridOption2: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913806903-vraq1-IMG_1246.JPG',
  // For Volume path (D) - choose between Hybrid or Volume
  volumeOption1: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913801621-qruz2e-IMG_1243.JPG',
  volumeOption2: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913799255-mxoa8-IMG_1236.JPG',
} as const;

// Result page images
const RESULT_IMAGES = {
  lashLift: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913826908-6hzrr-Facetune_11-11-2025-17-14-06.jpeg',
  classic: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913804878-pkvu55-IMG_1245.JPG',
  wetAngel: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913797443-7iq5ps-IMG_1234.JPG',
  hybrid: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913801621-qruz2e-IMG_1243.JPG',
  volume: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913790698-tr0m4-IMG_1231.JPG',
} as const;

// Quiz step type - 0 = intro, 1-4 = questions, 5 = results
type QuizStep = 0 | 1 | 2 | 3 | 4 | 5;

// Q1 Answer: Beauty routine
type Q1Answer = 'A' | 'B' | 'C' | 'D';

// Q2 Answer: Lash look feel
type Q2Answer = 'A' | 'B' | 'C' | 'D';

// Q3 Answer: Photo selection
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

  // If Q3 = B (Classic path)
  if (q3 === 'B') {
    if (q4 === '1') return 'classic';
    if (q4 === '2') return 'hybrid';
    return 'classic'; // fallback
  }

  // If Q3 = C (Hybrid/Wet path)
  if (q3 === 'C') {
    if (q4 === '1') return 'hybrid';
    if (q4 === '2') return 'volume';
    return 'hybrid'; // fallback
  }

  // If Q3 = D (Volume path)
  if (q3 === 'D') {
    if (q4 === '1') return 'hybrid';
    if (q4 === '2') return 'volume';
    return 'volume'; // fallback
  }

  return 'classic'; // fallback
}

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
          setStep(3); // Go back to Q3 for lash lift path
        } else {
          setStep(4); // Go back to Q4 for other paths
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

    // If Lash Lift (A), go directly to results
    if (answer === 'A') {
      setResult('lashLift');
      setStep(5);
    } else {
      // Otherwise, go to Q4 for follow-up
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
    if (result && onBook) {
      onBook(result);
    }
    handleClose();
  };

  // Calculate total steps based on path (4 for lash lift, 5 for others)
  const getTotalSteps = () => {
    if (step === 0) return 4; // Before starting
    if (answers.q3 === 'A') return 4; // Lash lift path: intro, Q1, Q2, Q3, result
    return 5; // Other paths: intro, Q1, Q2, Q3, Q4, result
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
    { value: 'D', label: 'It depends — sometimes simple, sometimes glam' },
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

// Q3: Photo Selection (4 images)
interface Q3Props {
  onAnswer: (answer: Q3Answer) => void;
  images: typeof Q3_IMAGES;
}

function Q3PhotoSelection({ onAnswer, images }: Q3Props) {
  const options: { value: Q3Answer; image: string }[] = [
    { value: 'A', image: images.lashLift },
    { value: 'B', image: images.classic },
    { value: 'C', image: images.hybridWet },
    { value: 'D', image: images.volume },
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
        <h2 className="text-xl md:text-2xl font-display font-medium text-charcoal">
          Which lash look are you most drawn to?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
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
              alt={`Lash style option ${option.value}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
      case 'C': // Hybrid/Wet path - Hybrid or Volume
        return [
          { value: '1', image: images.hybridOption1, label: 'Hybrid' },
          { value: '2', image: images.hybridOption2, label: 'Volume' },
        ];
      case 'D': // Volume path - Hybrid or Volume
        return [
          { value: '1', image: images.volumeOption1, label: 'Hybrid' },
          { value: '2', image: images.volumeOption2, label: 'Volume' },
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
      <div className="text-center mb-6 shrink-0">
        <h2 className="text-xl md:text-2xl font-display font-medium text-charcoal">
          Which style feels most like you?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
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
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
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
