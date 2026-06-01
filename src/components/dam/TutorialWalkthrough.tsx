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
  skipable?: boolean
}

const DESKTOP_STEP_CONTENT: Record<DesktopTutorialStep, TutorialStepContent> = {
  'welcome': {
    title: 'Welcome to LashPop DAM',
    description: "Let's take a quick tour to help you get started with your digital asset management system. You'll learn how to organize, tag, and find your photos effortlessly.",
    skipable: true
  },
  'command-palette-intro': {
    title: 'The Command Palette',
    description: 'The Command Palette is your control center for everything in the DAM. You can open it anytime by pressing the / key or ⌘K. It gives you instant access to all features, filters, and actions.',
    highlight: 'command-button',
    skipable: false
  },
  'filtering-demo': {
    title: 'Filtering Your Assets',
    description: 'Use the Command Palette to filter your photos by style, team member, or any tag. Simply type what you\'re looking for - like "natural" or "team" - and select from the suggestions that appear.',
    skipable: false
  },
  'selection-demo': {
    title: 'Selecting Multiple Assets',
    description: 'Select multiple photos at once by clicking and dragging across the grid. You can also hold ⌘ (Cmd) to select non-adjacent items, or use Shift to select a range.',
    highlight: 'dam-grid',
    skipable: false
  },
  'bulk-tagging-demo': {
    title: 'Organizing with Groups',
    description: 'Organize your view by grouping assets. In the Command Palette, type "group" to see grouping options like Team or Style. This creates visual sections in your grid for easier navigation.',
    skipable: false
  },
  'collections-organization': {
    title: 'Collections & More',
    description: 'Collections let you curate specific sets of assets for campaigns or projects. You can create, manage, and switch between collections - all through the Command Palette.',
    skipable: true
  },
  'completion': {
    title: "You're All Set! 🎉",
    description: "You now know the essentials of LashPop DAM. Remember, the Command Palette (/) is your gateway to everything. Explore the Help section there for more tips and keyboard shortcuts.",
    skipable: false
  }
}

const MOBILE_STEP_CONTENT: Record<MobileTutorialStep, TutorialStepContent> = {
  'welcome': {
    title: 'Welcome to LashPop DAM',
    description: "Let's take a quick tour of the mobile interface. You'll learn how to organize, tag, and find your photos on the go.",
    skipable: true
  },
  'action-button-intro': {
    title: 'The Action Button',
    description: 'The sparkle button in the bottom right is your gateway to all actions. It\'s context-aware - changing based on what you\'re doing. When nothing is selected, it opens the main menu.',
    highlight: 'action-button',
    skipable: false
  },
  'command-palette-intro': {
    title: 'Command Palette on Mobile',
    description: 'The Command Palette gives you quick access to search, filter, and organize. You\'ll find it at the top of the Action Button menu. It works just like the desktop version.',
    skipable: false
  },
  'command-palette-explore': {
    title: 'Using the Command Palette',
    description: 'In the Command Palette, you can search for anything - team members, styles, tags, or actions. Just type what you need and select from the suggestions.',
    skipable: false
  },
  'selection-demo': {
    title: 'Selecting Photos',
    description: 'To select multiple photos, long-press any image to enter selection mode. Then tap additional photos to add them to your selection. The Action Button will show a count of selected items.',
    highlight: 'dam-grid',
    skipable: false
  },
  'bulk-actions': {
    title: 'Bulk Actions',
    description: 'When you have photos selected, the Action Button transforms to show contextual actions. You can tag multiple photos at once, add them to collections, or clear your selection.',
    highlight: 'action-button',
    skipable: false
  },
  'completion': {
    title: "You're All Set! 🎉",
    description: "You now know the mobile basics! Remember: The sparkle Action Button is your main control, and long-press starts selection mode. Enjoy using LashPop DAM!",
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
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    highlightElementById,
    dismissPrompt,
    acceptPrompt
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
      {(
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
          <p className="text-base text-sage leading-relaxed">
            {stepContent.description}
          </p>
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
