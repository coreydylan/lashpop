"use client"

import { useEffect, useRef, useState } from 'react'
import { TutorialTooltip } from '@/components/TutorialTooltip'
import { useTutorial } from '@/contexts/TutorialContext'

interface TutorialIntegrationProps {
  selectedAssets: string[]
  isCommandOpen: boolean
  hasInteractedWithGrid: boolean
}

export function TutorialIntegration({
  selectedAssets,
  isCommandOpen,
  hasInteractedWithGrid,
}: TutorialIntegrationProps) {
  const {
    currentStep,
    tutorialEnabled,
    startStep,
    completeStep,
    dismissStep,
  } = useTutorial()

  const [gridRef, setGridRef] = useState<HTMLElement | null>(null)
  const [commandButtonRef, setCommandButtonRef] = useState<HTMLElement | null>(null)

  // Find tutorial target elements
  useEffect(() => {
    // Find the main asset grid
    const grid = document.querySelector('.dam-grid') as HTMLElement
    if (grid) setGridRef(grid)

    // Find the command button
    const commandButton = document.querySelector('[data-tutorial="command-button"]') as HTMLElement
    if (commandButton) setCommandButtonRef(commandButton)
  }, [])

  // Trigger selection methods tutorial on first grid interaction
  useEffect(() => {
    if (hasInteractedWithGrid && tutorialEnabled && gridRef) {
      startStep('selection-methods')
    }
  }, [hasInteractedWithGrid, tutorialEnabled, gridRef, startStep])

  // Trigger command palette tutorial after first selection
  useEffect(() => {
    if (selectedAssets.length > 0 && tutorialEnabled && commandButtonRef) {
      startStep('command-palette')
    }
  }, [selectedAssets.length, tutorialEnabled, commandButtonRef, startStep])

  // Trigger tagging tutorial after opening command palette
  useEffect(() => {
    if (isCommandOpen && tutorialEnabled) {
      startStep('tagging-filtering')
    }
  }, [isCommandOpen, tutorialEnabled, startStep])

  // Trigger batch actions tutorial when multiple items selected
  useEffect(() => {
    if (selectedAssets.length >= 2 && tutorialEnabled) {
      startStep('batch-actions')
    }
  }, [selectedAssets.length, tutorialEnabled, startStep])

  return (
    <>
      {/* Selection Methods Tutorial */}
      <TutorialTooltip
        show={currentStep === 'selection-methods'}
        title="Selection Methods"
        description="Tap to select single items. On mobile, long-press an item to start multi-select mode. On desktop, click and drag to select multiple items at once."
        position="bottom"
        targetElement={gridRef}
        onComplete={() => completeStep('selection-methods')}
        onDismiss={dismissStep}
      />

      {/* Command Palette Tutorial */}
      <TutorialTooltip
        show={currentStep === 'command-palette'}
        title="Command Palette"
        description="Press '/' or click the Command button to open the palette. Search for tags, filters, and actions. Use keyboard shortcuts for faster workflow."
        position="top"
        targetElement={commandButtonRef}
        onComplete={() => completeStep('command-palette')}
        onDismiss={dismissStep}
      />

      {/* Tagging & Filtering Tutorial */}
      <TutorialTooltip
        show={currentStep === 'tagging-filtering'}
        title="Tagging & Filtering"
        description="Add tags to organize your assets. Use filters to quickly find specific items. Tags can be customized in the tag editor for your workflow."
        position="bottom"
        targetElement={commandButtonRef}
        onComplete={() => completeStep('tagging-filtering')}
        onDismiss={dismissStep}
      />

      {/* Batch Actions Tutorial */}
      <TutorialTooltip
        show={currentStep === 'batch-actions'}
        title="Batch Actions"
        description="With multiple items selected, you can perform bulk operations like adding tags, assigning team members, or deleting multiple assets at once."
        position="bottom"
        targetElement={gridRef}
        onComplete={() => completeStep('batch-actions')}
        onDismiss={dismissStep}
      />
    </>
  )
}
