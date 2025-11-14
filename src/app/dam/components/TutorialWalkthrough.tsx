"use client"

import { useEffect, useCallback } from 'react'
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { useDamTutorial } from '@/contexts/DamTutorialContext'
import type { DesktopTutorialStep, MobileTutorialStep } from '@/contexts/DamTutorialContext'
import clsx from 'clsx'

interface TutorialStepContent {
  title: string
  description: string
  highlight?: string
  action?: {
    label: string
    description: string
  }
  autoAdvance?: boolean
  skipable?: boolean
}

const DESKTOP_STEP_CONTENT: Record<DesktopTutorialStep, TutorialStepContent> = {
  'welcome': {
    title: 'Welcome to LashPop DAM',
    description: "Let's take a quick 2-minute tour to help you get started with your digital asset management system. You'll learn how to organize, tag, and find your photos effortlessly.",
    skipable: true
  },
  'command-palette-intro': {
    title: 'Meet the Command Palette',
    description: 'This is your control center for everything in the DAM. Press / or ⌘K anytime to open it.',
    highlight: 'command-button',
    action: {
      label: 'Try it now',
      description: 'Press / or click the Command Palette button'
    }
  },
  'filtering-demo': {
    title: 'Filter Your Assets',
    description: "Let's filter your photos. Type 'style' in the Command Palette to see filtering options.",
    action: {
      label: 'Try filtering',
      description: 'Open Command Palette → Type "style" → Pick any style'
    }
  },
  'selection-demo': {
    title: 'Select Multiple Assets',
    description: 'Click and drag to select multiple photos at once. Hold ⌘ (Cmd) to select non-adjacent items.',
    highlight: 'dam-grid',
    action: {
      label: 'Try selecting',
      description: 'Click and drag on the grid to select photos'
    }
  },
  'bulk-tagging-demo': {
    title: 'Organize with Grouping',
    description: 'With the Command Palette, type "group" to organize your grid by categories like Team or Style.',
    action: {
      label: 'Try grouping',
      description: 'Open Command Palette → Type "group" → Select "Group by Team"'
    }
  },
  'collections-organization': {
    title: 'Collections & More',
    description: 'Create collections to curate sets of assets. Access collections and all other features through the Command Palette.',
    skipable: true
  },
  'completion': {
    title: "You're All Set! 🎉",
    description: "Great job! You now know the essentials. Press / anytime to explore more features. Visit Help in the Command Palette for tips and shortcuts.",
    skipable: false
  }
}

const MOBILE_STEP_CONTENT: Record<MobileTutorialStep, TutorialStepContent> = {
  'welcome': {
    title: 'Welcome to LashPop DAM',
    description: "Let's take a quick tour! You'll learn how to organize and tag your photos on mobile.",
    skipable: true
  },
  'command-button-intro': {
    title: 'Command Palette Button',
    description: 'Tap this button at the bottom to access all features - filtering, tagging, organizing, and more.',
    highlight: 'command-button',
    action: {
      label: 'Tap to open',
      description: 'Tap the Command Palette button'
    }
  },
  'filtering-demo': {
    title: 'Filter Your Photos',
    description: 'In the Command Palette, tap "Filtering" then select a tag to narrow your view.',
    action: {
      label: 'Try filtering',
      description: 'Open Command Palette → Filtering → Pick any tag'
    }
  },
  'selection-demo': {
    title: 'Select Photos',
    description: 'Long-press any photo to start selecting. Then tap more photos to add them to your selection.',
    highlight: 'dam-grid',
    action: {
      label: 'Try selecting',
      description: 'Long-press a photo, then tap others'
    }
  },
  'bulk-actions': {
    title: 'Bulk Tag & Organize',
    description: 'With photos selected, open the Command Palette to apply tags or assign team members to multiple photos at once.',
    action: {
      label: 'Try bulk tagging',
      description: 'Select photos → Open Command Palette → Apply tags'
    }
  },
  'lightbox-swipe': {
    title: 'Lightbox View',
    description: 'Tap any photo to view it full-screen. Swipe left/right to navigate. Use Command Palette to tag individual photos.',
    skipable: true
  },
  'completion': {
    title: "You're Ready! 🎉",
    description: 'Nice work! Tap the Command Palette button anytime to access all features. Check Help for more tips.',
    skipable: false
  }
}

export function TutorialWalkthrough() {
  const {
    isActive,
    isMobile,
    currentStep,
    currentStepIndex,
    totalSteps,
    showOverlay,
    highlightElement,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    highlightElementById
  } = useDamTutorial()

  const stepContent = isMobile
    ? MOBILE_STEP_CONTENT[currentStep as MobileTutorialStep]
    : DESKTOP_STEP_CONTENT[currentStep as DesktopTutorialStep]

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stepContent?.skipable) {
        skipTutorial()
      } else if (e.key === 'ArrowRight') {
        nextStep()
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        previousStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, currentStepIndex, nextStep, previousStep, skipTutorial, stepContent])

  // Highlight elements
  useEffect(() => {
    if (stepContent?.highlight) {
      highlightElementById(stepContent.highlight)
    } else {
      highlightElementById(null)
    }

    return () => highlightElementById(null)
  }, [stepContent, highlightElementById])

  const handleNext = useCallback(() => {
    if (currentStep === 'completion') {
      completeTutorial()
    } else {
      nextStep()
    }
  }, [currentStep, completeTutorial, nextStep])

  if (!isActive || !currentStep || !stepContent) return null

  const isWelcome = currentStep === 'welcome'
  const isCompletion = currentStep === 'completion'

  return (
    <>
      {/* Mobile: Always show overlay backdrop for bottom sheet */}
      {isMobile && showOverlay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" />
      )}

      {/* Desktop: Show overlay only for welcome/completion screens (centered modals) */}
      {!isMobile && (isWelcome || isCompletion) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
      )}

      {/* Desktop: Pulse ring effect for highlighted elements during tutorial steps */}
      {!isMobile && highlightElement && !isWelcome && !isCompletion && (
        <style jsx global>{`
          [data-tutorial="${highlightElement}"] {
            position: relative;
            z-index: 50;
          }
          [data-tutorial="${highlightElement}"]::after {
            content: '';
            position: absolute;
            inset: -8px;
            border: 3px solid #BD8878;
            border-radius: 12px;
            pointer-events: none;
            animation: tutorial-pulse 2s ease-in-out infinite;
          }
          @keyframes tutorial-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.05); }
          }
        `}</style>
      )}

      {/* Tutorial card */}
      <div
        className={clsx(
          'bg-cream border-2 border-dusty-rose shadow-2xl',
          isMobile
            ? // Mobile: Fixed bottom sheet with overlay
              'fixed bottom-0 left-0 right-0 z-[10002] rounded-t-3xl max-h-[70vh]'
            : isWelcome || isCompletion
            ? // Desktop welcome/completion: Centered modal
              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-3xl w-full max-w-xl'
            : // Desktop steps: Inline card in top-right
              'fixed top-6 right-6 z-40 rounded-3xl w-full max-w-md animate-in slide-in-from-right duration-300'
        )}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-sage/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-dusty-rose" />
                <span className="text-xs font-bold uppercase tracking-wider text-sage">
                  Tutorial {currentStepIndex + 1}/{totalSteps}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-dune">{stepContent.title}</h2>
            </div>
            {stepContent.skipable && (
              <button
                onClick={skipTutorial}
                className="p-2 rounded-full hover:bg-sage/10 transition-colors"
                aria-label="Skip tutorial"
              >
                <X className="w-5 h-5 text-sage" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-base text-sage leading-relaxed mb-6">
            {stepContent.description}
          </p>

          {stepContent.action && (
            <div className="bg-warm-sand/30 rounded-2xl p-4 border border-sage/10">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-dusty-rose rounded-full flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-cream" />
                </div>
                <div>
                  <div className="font-semibold text-dune mb-1">{stepContent.action.label}</div>
                  <div className="text-sm text-sage">{stepContent.action.description}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sage/20 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={clsx(
                  'h-2 rounded-full transition-all',
                  idx === currentStepIndex
                    ? 'w-8 bg-dusty-rose'
                    : idx < currentStepIndex
                    ? 'w-2 bg-dusty-rose/40'
                    : 'w-2 bg-sage/20'
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStepIndex > 0 && !isWelcome && (
              <button
                onClick={previousStep}
                className="px-4 py-2 rounded-full border border-sage/30 text-sage hover:bg-sage/10 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-full bg-dusty-rose text-cream hover:bg-dusty-rose/90 transition-colors flex items-center gap-2 font-semibold"
            >
              {isCompletion ? 'Finish' : 'Next'}
              {!isCompletion && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
