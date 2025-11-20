"use client"

import { useEffect, useCallback } from 'react'
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { useDamTutorial } from '@/contexts/DamTutorialContext'
import type { DesktopTutorialStep, MobileTutorialStep } from '@/contexts/DamTutorialContext'
import { CoachingTooltip } from './CoachingTooltip'
import clsx from 'clsx'

interface TutorialStepContent {
  title: string
  description: string
  highlight?: string
  action?: {
    label: string
    description: string
    coachingHint?: string
    coachingTarget?: string
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
      description: 'Press / or click the Command Palette button',
      coachingHint: 'Press / or ⌘K to open',
      coachingTarget: 'body'
    }
  },
  'filtering-demo': {
    title: 'Filter Your Assets',
    description: "Let's filter your photos. Type 'style' in the Command Palette to see filtering options.",
    action: {
      label: 'Try filtering',
      description: 'Open Command Palette → Type "style" → Pick any style',
      coachingHint: 'Type "style" to see filters',
      coachingTarget: '[data-omnisearch="input"]'
    }
  },
  'selection-demo': {
    title: 'Select Multiple Assets',
    description: 'Click and drag to select multiple photos at once. Hold ⌘ (Cmd) to select non-adjacent items.',
    highlight: 'dam-grid',
    action: {
      label: 'Try selecting',
      description: 'Click and drag on the grid to select photos',
      coachingHint: 'Click and drag to select multiple',
      coachingTarget: '.dam-grid'
    }
  },
  'bulk-tagging-demo': {
    title: 'Organize with Grouping',
    description: 'With the Command Palette, type "group" to organize your grid by categories like Team or Style.',
    action: {
      label: 'Try grouping',
      description: 'Open Command Palette → Type "group" → Select "Group by Team"',
      coachingHint: 'Type "group" to organize',
      coachingTarget: '[data-omnisearch="input"]'
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
    description: "Let's take a quick tour of the mobile interface! You'll learn how to organize, tag, and find your photos on the go.",
    skipable: true
  },
  'action-button-intro': {
    title: 'Your Action Button',
    description: 'See that sparkle button on the right? It gives you quick access to everything. Let\'s try it!',
    highlight: 'action-button',
    action: {
      label: 'Try it',
      description: 'Tap the sparkle button on the right',
      coachingHint: 'Tap here to open menu',
      coachingTarget: '[data-tutorial="action-button"]'
    }
  },
  'command-palette-intro': {
    title: 'Great! Now Find Command Palette',
    description: 'The menu is open! The Command Palette at the top is your control center for everything.',
    highlight: 'action-button-command-palette',
    action: {
      label: 'Open Command Palette',
      description: 'Tap "Command Palette" at the top of the menu',
      coachingHint: 'Tap Command Palette here',
      coachingTarget: '[data-tutorial="action-button-command-palette"]'
    }
  },
  'command-palette-explore': {
    title: 'Explore Your Control Center',
    description: 'Excellent! This is where you can search for anything - filters, tags, team members, and more. Try typing something or explore the options.',
    skipable: false
  },
  'selection-demo': {
    title: 'Selecting Multiple Photos',
    description: 'Now let\'s select some photos. Long-press any photo to start, then tap others to add them.',
    highlight: 'dam-grid',
    action: {
      label: 'Try selecting',
      description: 'Long-press a photo, then tap 2 more',
      coachingHint: 'Long-press any photo to start',
      coachingTarget: '.dam-grid'
    }
  },
  'bulk-actions': {
    title: 'Organize Your Selection',
    description: 'Perfect! You have photos selected. Now open the Action Button to see what you can do with them.',
    action: {
      label: 'Open Action Button',
      description: 'Tap the Action Button to see options',
      coachingHint: 'Open Action Button for options',
      coachingTarget: '[data-tutorial="action-button"]'
    }
  },
  'completion': {
    title: "You're All Set! 🎉",
    description: 'Excellent work! You now know the essentials. The Action Button is always there when you need it. Tap anytime to filter, tag, or organize your photos.',
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
    showPromptDialog,
    isMinimized,
    isWaitingForAction,
    currentSubAction,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    highlightElementById,
    dismissPrompt,
    acceptPrompt,
    minimizeTutorial,
    maximizeTutorial,
    startWaitingForAction,
    updateSubAction,
    completeAction
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
      // Just go to next step, don't minimize on Next button
      nextStep()
    }
  }, [currentStep, completeTutorial, nextStep])

  // Handle action button click
  const handleTryAction = useCallback(() => {
    startWaitingForAction()
  }, [startWaitingForAction])

  // Show prompt dialog if needed (takes precedence over tutorial)
  if (showPromptDialog) {
    return (
      <>
        {/* Overlay backdrop */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" />

        {/* Prompt Dialog */}
        <div
          className={clsx(
            'bg-cream border-2 border-dusty-rose shadow-2xl',
            isMobile
              ? 'fixed bottom-0 left-0 right-0 z-[10002] rounded-t-3xl'
              : 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10002] rounded-3xl w-full max-w-xl'
          )}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-sage/20">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-dusty-rose" />
              <h2 className="text-2xl font-bold text-dune">
                Welcome to LashPop DAM
              </h2>
            </div>
            <p className="text-sm text-sage">
              {isMobile ? 'Mobile Version' : 'Desktop Version'}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-base text-sage leading-relaxed mb-4">
              {isMobile
                ? "Would you like a quick tour of the mobile interface? We'll show you how to use the Action Button, Command Palette, and organize your photos on the go."
                : "Would you like a quick 2-minute tour? We'll show you how to organize, tag, and find your photos effortlessly."}
            </p>
            <div className="bg-warm-sand/30 rounded-2xl p-4 border border-sage/10">
              <ul className="space-y-2 text-sm text-sage">
                {isMobile ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Discover the Action Button & Command Palette</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Learn quick access shortcuts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Master mobile selection & tagging</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Learn the command palette shortcuts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Discover filtering and grouping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Master bulk tagging workflows</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-sage/20 flex items-center justify-between gap-3">
            <button
              onClick={dismissPrompt}
              className="flex-1 px-6 py-3 rounded-full border-2 border-sage/30 text-sage hover:bg-sage/10 transition-colors font-semibold"
            >
              Not now
            </button>
            <button
              onClick={acceptPrompt}
              className="flex-1 px-6 py-3 rounded-full bg-dusty-rose text-cream hover:bg-dusty-rose/90 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              Start Tour
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </>
    )
  }

  if (!isActive || !currentStep || !stepContent) return null

  const isWelcome = currentStep === 'welcome'
  const isCompletion = currentStep === 'completion'

  return (
    <>
      {/* Mobile: Always show overlay backdrop for bottom sheet unless minimized */}
      {isMobile && showOverlay && !isMinimized && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" />
      )}

      {/* Desktop: Show overlay only for welcome/completion screens (centered modals) */}
      {!isMobile && (isWelcome || isCompletion) && !isMinimized && (
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

      {/* Minimized state - small progress indicator */}
      {isMinimized && (
        <div
          onClick={maximizeTutorial}
          className={clsx(
            'fixed z-[10001] bg-cream border-2 border-dusty-rose shadow-lg rounded-full px-4 py-2 cursor-pointer hover:scale-105 transition-transform',
            isMobile ? 'bottom-6 right-6' : 'top-6 right-6'
          )}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-dusty-rose animate-pulse" />
            <span className="text-xs font-medium text-dune">
              {isWaitingForAction ? 'Following along...' : `Step ${currentStepIndex + 1}/${totalSteps}`}
            </span>
          </div>
        </div>
      )}

      {/* Coaching tooltips when waiting for action */}
      {isWaitingForAction && (
        <>
          {/* Show coaching hint based on current sub-action or default */}
          {currentSubAction === 'command-palette' ? (
            <CoachingTooltip
              message="Perfect! Now tap Command Palette"
              targetSelector="[data-tutorial='action-button-command-palette']"
              position="auto"
            />
          ) : currentSubAction === 'select-more' ? (
            <CoachingTooltip
              message="Great! Now tap 2 more photos"
              targetSelector=".dam-grid"
              position="auto"
            />
          ) : currentSubAction === 'tag-organize' ? (
            <CoachingTooltip
              message="Tap 'Tag & Organize' to continue"
              targetSelector="[data-tutorial='action-button-command-palette']"
              position="auto"
            />
          ) : stepContent?.action?.coachingHint ? (
            <CoachingTooltip
              message={stepContent.action.coachingHint}
              targetSelector={stepContent.action.coachingTarget}
              position="auto"
            />
          ) : null}
        </>
      )}

      {/* Tutorial card - hidden when minimized */}
      {!isMinimized && (
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
                <div className="flex-1">
                  <div className="font-semibold text-dune mb-1">{stepContent.action.label}</div>
                  <div className="text-sm text-sage mb-3">{stepContent.action.description}</div>
                  <button
                    onClick={handleTryAction}
                    className="px-4 py-2 bg-dusty-rose text-cream rounded-full text-sm font-medium hover:bg-dusty-rose/90 transition-colors"
                  >
                    Try it now
                  </button>
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
      )}
    </>
  )
}
