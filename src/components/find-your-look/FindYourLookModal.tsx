'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';

// Hand-picked images from DAM for Step 2 (Aesthetic - full face/beauty shots)
const AESTHETIC_IMAGES = {
  natural: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913826908-6hzrr-Facetune_11-11-2025-17-14-06.jpeg',
  'clean-girl': 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913825367-ukjfzn-Facetune_11-11-2025-17-14-59.jpeg',
  textured: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913823492-qo5v6m-Facetune_11-11-2025-17-15-29.jpeg',
  dramatic: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913818972-vqyxvb-Facetune_20-09-2025-16-55-05.jpeg',
} as const;

// Hand-picked images from DAM for Step 3 (Style - lash close-ups)
const STYLE_IMAGES = {
  'soft-natural': 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913814498-011mtb-IMG_1268.JPG',
  'glossy-defined': 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913812439-dvx0zn-IMG_1266.JPG',
  'fuller-textured': 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913809619-nc5gi-IMG_1253.JPG',
  'bold-volume': 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913806903-vraq1-IMG_1246.JPG',
} as const;

// Hand-picked images from DAM for Step 4 (Results)
const RESULT_IMAGES = {
  classic: {
    before: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913804878-pkvu55-IMG_1245.JPG',
    after: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913803318-jp9r6-IMG_1244.JPG',
  },
  hybrid: {
    before: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913801621-qruz2e-IMG_1243.JPG',
    after: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913799255-mxoa8-IMG_1236.JPG',
  },
  'wet-angel': {
    before: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913797443-7iq5ps-IMG_1234.JPG',
    after: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913794167-0rr1xe-IMG_1090.JPG',
  },
  volume: {
    before: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913790698-tr0m4-IMG_1231.JPG',
    after: 'https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1762913788611-9tldje-IMG_1230.JPG',
  },
} as const;

// Quiz step type
type QuizStep = 1 | 2 | 3 | 4;

// Answer types
type LifestyleAnswer = 'low-maintenance' | 'polished' | 'glam';
type AestheticAnswer = 'natural' | 'clean-girl' | 'textured' | 'dramatic';
type StyleAnswer = 'soft-natural' | 'glossy-defined' | 'fuller-textured' | 'bold-volume';

// Lash style result
type LashStyleResult = 'classic' | 'hybrid' | 'wet-angel' | 'volume';

interface QuizAnswers {
  lifestyle?: LifestyleAnswer;
  aesthetic?: AestheticAnswer;
  style?: StyleAnswer;
}

// Lash style details for results
const lashStyleDetails: Record<LashStyleResult, {
  name: string;
  displayName: string;
  tagline: string;
  description: string;
}> = {
  'classic': {
    name: 'Classic',
    displayName: 'Classic Lashes',
    tagline: 'Effortlessly Natural',
    description: 'You love a subtle, refined look that enhances your natural beauty without looking "done." Classic lashes give you that perfect mascara-free, wake-up-ready elegance that\'s perfect for everyday life.',
  },
  'hybrid': {
    name: 'Hybrid',
    displayName: 'Hybrid Lashes',
    tagline: 'The Perfect Balance',
    description: 'You want the best of both worlds - natural definition with a hint of drama. Hybrid lashes blend classic and volume techniques for a textured, dimensional look that\'s both sophisticated and eye-catching.',
  },
  'wet-angel': {
    name: 'Wet / Angel',
    displayName: 'Wet / Angel Lashes',
    tagline: 'Modern & Glossy',
    description: 'You love a clean, effortless, "model off duty" look. Wet / Angel gives you glossy, defined lashes that feel modern, chic, and natural but elevated.',
  },
  'volume': {
    name: 'Volume',
    displayName: 'Volume Lashes',
    tagline: 'Bold & Beautiful',
    description: 'You\'re not afraid to make a statement. Volume lashes deliver dramatic fullness and dimension that command attention - perfect for those who love to glam up.',
  },
};

// Quiz logic - determine result based on answers
function calculateResult(answers: QuizAnswers): LashStyleResult {
  const { lifestyle, aesthetic, style } = answers;

  // Scoring system
  let scores: Record<LashStyleResult, number> = {
    'classic': 0,
    'hybrid': 0,
    'wet-angel': 0,
    'volume': 0,
  };

  // Lifestyle scoring
  if (lifestyle === 'low-maintenance') {
    scores['classic'] += 2;
    scores['wet-angel'] += 1;
  } else if (lifestyle === 'polished') {
    scores['hybrid'] += 2;
    scores['wet-angel'] += 2;
  } else if (lifestyle === 'glam') {
    scores['volume'] += 2;
    scores['hybrid'] += 1;
  }

  // Aesthetic scoring
  if (aesthetic === 'natural') {
    scores['classic'] += 2;
  } else if (aesthetic === 'clean-girl') {
    scores['wet-angel'] += 3;
  } else if (aesthetic === 'textured') {
    scores['hybrid'] += 2;
    scores['volume'] += 1;
  } else if (aesthetic === 'dramatic') {
    scores['volume'] += 3;
  }

  // Style scoring
  if (style === 'soft-natural') {
    scores['classic'] += 2;
  } else if (style === 'glossy-defined') {
    scores['wet-angel'] += 3;
  } else if (style === 'fuller-textured') {
    scores['hybrid'] += 2;
  } else if (style === 'bold-volume') {
    scores['volume'] += 3;
  }

  // Find highest score
  let result: LashStyleResult = 'classic';
  let maxScore = 0;
  for (const [style, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      result = style as LashStyleResult;
    }
  }

  return result;
}

interface FindYourLookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook?: (lashStyle: string) => void;
}

export function FindYourLookModal({ isOpen, onClose, onBook }: FindYourLookModalProps) {
  const [step, setStep] = useState<QuizStep>(1);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState<LashStyleResult | null>(null);

  const totalSteps = 4;

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((s) => (s - 1) as QuizStep);
    }
  }, [step]);

  const handleClose = useCallback(() => {
    // Reset state on close
    setStep(1);
    setAnswers({});
    setResult(null);
    onClose();
  }, [onClose]);

  const handleLifestyleAnswer = (answer: LifestyleAnswer) => {
    setAnswers((prev) => ({ ...prev, lifestyle: answer }));
    setStep(2);
  };

  const handleAestheticAnswer = (answer: AestheticAnswer) => {
    setAnswers((prev) => ({ ...prev, aesthetic: answer }));
    setStep(3);
  };

  const handleStyleAnswer = (answer: StyleAnswer) => {
    const newAnswers = { ...answers, style: answer };
    setAnswers(newAnswers);
    const calculatedResult = calculateResult(newAnswers);
    setResult(calculatedResult);
    setStep(4);
  };

  const handleBookNow = () => {
    if (result && onBook) {
      onBook(result);
    }
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 pointer-events-none"
          >
            <div
              className="relative w-full max-w-[460px] bg-ivory rounded-3xl shadow-2xl overflow-hidden pointer-events-auto
                         h-full md:h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white
                           text-sage hover:text-charcoal transition-all shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Back button (steps 2, 3, and 4) */}
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white
                             text-sage hover:text-charcoal transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Content - fixed height container */}
              <div className="p-6 md:h-[580px] h-full flex flex-col">
                {/* Step indicator dots */}
                <div className="flex justify-center gap-2.5 mb-5 shrink-0">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        s === step
                          ? 'bg-terracotta w-6'
                          : s < step
                          ? 'bg-terracotta/40 w-2'
                          : 'bg-cream w-2'
                      }`}
                    />
                  ))}
                </div>

                {/* Step content - fixed height */}
                <div className="h-[510px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <Step1Lifestyle
                        key="step1"
                        onAnswer={handleLifestyleAnswer}
                      />
                    )}

                    {step === 2 && (
                      <Step2Aesthetic
                        key="step2"
                        onAnswer={handleAestheticAnswer}
                        images={AESTHETIC_IMAGES}
                      />
                    )}

                    {step === 3 && (
                      <Step3Style
                        key="step3"
                        onAnswer={handleStyleAnswer}
                        images={STYLE_IMAGES}
                      />
                    )}

                    {step === 4 && result && (
                      <Step4Results
                        key="step4"
                        result={lashStyleDetails[result]}
                        resultImages={RESULT_IMAGES[result]}
                        onBook={handleBookNow}
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

// Step 1: Lifestyle Question
function Step1Lifestyle({ onAnswer }: { onAnswer: (answer: LifestyleAnswer) => void }) {
  const options: { value: LifestyleAnswer; label: string }[] = [
    { value: 'low-maintenance', label: 'Super low-maintenance—gym, errands, busy days' },
    { value: 'polished', label: 'Polished but not overdone' },
    { value: 'glam', label: 'Events, nights out, I love glam' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-[510px] flex flex-col justify-center"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-medium text-charcoal">
          Which best describes your everyday routine?
        </h2>
      </div>

      <div className="space-y-4">
        {options.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(option.value)}
            className="w-full p-5 rounded-xl bg-cream/50 hover:bg-cream border border-blush/30
                       text-left transition-all duration-200 group"
          >
            <span className="text-charcoal group-hover:text-terracotta transition-colors">
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Step 2: Aesthetic Photo Grid
interface Step2Props {
  onAnswer: (answer: AestheticAnswer) => void;
  images: typeof AESTHETIC_IMAGES;
}

function Step2Aesthetic({ onAnswer, images }: Step2Props) {
  const options: { value: AestheticAnswer; label: string }[] = [
    { value: 'natural', label: 'My natural lashes...just darker' },
    { value: 'clean-girl', label: 'Glossy, defined, clean-girl lashes' },
    { value: 'textured', label: 'Natural but fuller & textured' },
    { value: 'dramatic', label: 'Bold, dramatic, full glam' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-[510px] flex flex-col"
    >
      <div className="text-center mb-4 shrink-0">
        <h2 className="text-xl font-display font-medium text-charcoal">
          What kind of lash look are you most drawn to?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {options.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(option.value)}
            className="relative h-[215px] rounded-xl overflow-hidden group"
          >
            <Image
              src={images[option.value]}
              alt={option.label}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <span className="text-white text-xs font-medium leading-tight block">
                {option.label}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Step 3: Lash Style Close-ups
interface Step3Props {
  onAnswer: (answer: StyleAnswer) => void;
  images: typeof STYLE_IMAGES;
}

function Step3Style({ onAnswer, images }: Step3Props) {
  const options: { value: StyleAnswer; label: string }[] = [
    { value: 'soft-natural', label: 'Sexy, soft and natural' },
    { value: 'glossy-defined', label: 'Glossy defined clean girl lashes' },
    { value: 'fuller-textured', label: 'Natural but fuller & textured' },
    { value: 'bold-volume', label: 'Bold and full volume' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-[510px] flex flex-col"
    >
      <div className="text-center mb-4 shrink-0">
        <h2 className="text-xl font-display font-medium text-charcoal">
          Which style feels most like you?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {options.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(option.value)}
            className="relative h-[215px] rounded-xl overflow-hidden group"
          >
            <Image
              src={images[option.value]}
              alt={option.label}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <span className="text-white text-xs font-medium leading-tight block">
                {option.label}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Step 4: Results
interface Step4Props {
  result: typeof lashStyleDetails[LashStyleResult];
  resultImages: { before: string; after: string };
  onBook: () => void;
}

function Step4Results({ result, resultImages, onBook }: Step4Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-[510px] flex flex-col"
    >
      <div className="text-center mb-2 shrink-0">
        <p className="text-sm text-terracotta font-medium mb-1">{result.tagline}</p>
        <h2 className="text-xl font-display font-medium text-charcoal">
          Your Match: {result.displayName}
        </h2>
      </div>

      <p className="text-sage text-center text-xs leading-relaxed mb-3 shrink-0">
        {result.description}
      </p>

      {/* Before/After Images */}
      <div className="flex gap-3 mb-3 h-[240px] shrink-0">
        <div className="flex-1 relative h-full rounded-xl overflow-hidden">
          <Image
            src={resultImages.before}
            alt="Before"
            fill
            className="object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            Example
          </div>
        </div>
        <div className="flex-1 relative h-full rounded-xl overflow-hidden">
          <Image
            src={resultImages.after}
            alt={result.name}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-terracotta text-white text-xs px-2 py-1 rounded">
            {result.name}
          </div>
        </div>
      </div>

      {/* Book CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBook}
        className="w-full py-4 rounded-full bg-terracotta hover:bg-rust text-white font-medium
                   shadow-lg shadow-terracotta/30 transition-all duration-200 mb-2 shrink-0"
      >
        Book {result.displayName} Now
      </motion.button>

      {/* Fine print */}
      <p className="text-xs text-sage/70 text-center leading-relaxed shrink-0">
        Every set is customized to your eye shape and natural lashes. Your artist will fine tune during your consultation.
      </p>
    </motion.div>
  );
}

export default FindYourLookModal;
