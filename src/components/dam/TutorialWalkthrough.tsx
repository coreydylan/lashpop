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
    title: 'Welcome to Media',
    description: 'This short tutorial shows how to organize, tag and find photos.',
    skipable: true
  },
  'command-palette-intro': {
    title: 'Open Actions',
    description: 'Press / or ⌘K to open Actions. Use it to add tags, filter files, change the grid and manage Media.',
    highlight: 'command-button',
    skipable: false
  },
  'filtering-demo': {
    title: 'Filter files',
    description: 'Open Actions and search for a tag or team member. Choose a result to show matching files.',
    skipable: false
  },
  'selection-demo': {
    title: 'Select several files',
    description: 'Click and drag across the grid. You can also hold ⌘ to select separate files or hold Shift to select a range.',
    highlight: 'dam-grid',
    skipable: false
  },
  'bulk-tagging-demo': {
    title: 'Group files',
    description: 'Open Actions and search for “group”. Choose a category such as Team or Style to split the grid into labelled groups.',
    skipable: false
  },
  'collections-organization': {
    title: 'Use collections',
    description: 'A collection is a saved group of media files. Create, rename or open collections from Actions.',
    skipable: true
  },
  'completion': {
    title: 'Tutorial complete',
    description: 'You can now find, select, tag and group files. Open Help in Actions to see more instructions and keyboard shortcuts.',
    skipable: false
  }
}

const MOBILE_STEP_CONTENT: Record<MobileTutorialStep, TutorialStepContent> = {
  'welcome': {
    title: 'Welcome to Media',
    description: 'This short tutorial shows how to organize, tag and find photos on a phone.',
    skipable: true
  },
  'action-button-intro': {
    title: 'The Actions button',
    description: 'The sparkle button is at the bottom right. Its options change when files are selected. With no selection, it opens the main Actions menu.',
    highlight: 'action-button',
    skipable: false
  },
  'command-palette-intro': {
    title: 'Open Actions on a phone',
    description: 'Choose Actions at the top of the sparkle-button menu to search, filter and organize files.',
    skipable: false
  },
  'command-palette-explore': {
    title: 'Search Actions',
    description: 'Search for a team member, style, tag or task. Choose a matching action from the list.',
    skipable: false
  },
  'selection-demo': {
    title: 'Select photos',
    description: 'Press and hold a photo, then tap any other photos you want to select. The Actions button shows the number selected.',
    highlight: 'dam-grid',
    skipable: false
  },
  'bulk-actions': {
    title: 'Change several photos',
    description: 'After selecting photos, use the Actions button to add tags, add the photos to a collection or clear the selection.',
    highlight: 'action-button',
    skipable: false
  },
  'completion': {
    title: 'Tutorial complete',
    description: 'You can now find, select and organize photos on a phone. Press and hold a photo to select more than one.',
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
                Media tutorial
              </h2>
            </div>
            <p className="text-sm text-sage">
              {isMobile ? 'Phone' : 'Computer'}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-base text-sage leading-relaxed mb-4">
              {isMobile
                ? 'Start a short tutorial on selecting, tagging and finding photos on a phone?'
                : 'Start a short tutorial on selecting, tagging and finding photos on a computer?'}
            </p>
            <div className="bg-warm-sand/30 rounded-2xl p-4 border border-sage/10">
              <ul className="space-y-2 text-sm text-sage">
                {isMobile ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Open the Actions menu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Search for actions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Select and tag several photos</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Open Actions with the keyboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Filter and group files</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-dusty-rose font-bold">•</span>
                      <span>Add tags to several files</span>
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
              Start tutorial
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
