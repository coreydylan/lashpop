'use client';

/**
 * Feedback Layer
 *
 * A full-screen overlay that allows users to click/tap anywhere to leave feedback.
 * Renders above all other content (z-[10000]) but is only interactive when enabled.
 *
 * Desktop: Right-click to place a feedback pin
 * Mobile: Press and hold (500ms) to place a feedback pin
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Check,
  Trash2,
  Download,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  MousePointerClick,
  Hand,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { useFeedback, type FeedbackPin } from '@/contexts/FeedbackContext';

// ============================================================================
// Constants
// ============================================================================

const LONG_PRESS_DURATION = 500; // ms
const TUTORIAL_STEPS_DESKTOP = [
  {
    title: 'Welcome to Feedback Mode',
    description: 'You can now leave feedback on any part of the page. This helps us improve your experience.',
    icon: MessageCircle,
  },
  {
    title: 'Right-Click to Add Feedback',
    description: 'Simply right-click anywhere on the page to place a feedback pin. A form will appear where you can type your thoughts.',
    icon: MousePointerClick,
  },
  {
    title: 'Manage Your Feedback',
    description: 'Click on any pin to edit or delete it. Use the toolbar at the bottom to export all feedback or clear pins.',
    icon: Check,
  },
];

const TUTORIAL_STEPS_MOBILE = [
  {
    title: 'Welcome to Feedback Mode',
    description: 'You can now leave feedback on any part of the page. This helps us improve your experience.',
    icon: MessageCircle,
  },
  {
    title: 'Press & Hold to Add Feedback',
    description: 'Press and hold anywhere on the screen for half a second. A ripple animation will appear, then release to place your feedback.',
    icon: Hand,
  },
  {
    title: 'Manage Your Feedback',
    description: 'Tap any pin to edit or delete it. Use the toolbar at the bottom to export all feedback or clear pins.',
    icon: Check,
  },
];

// ============================================================================
// Sub-Components
// ============================================================================

interface FeedbackTutorialProps {
  isMobile: boolean;
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
  totalSteps: number;
}

function FeedbackTutorial({ isMobile, step, onNext, onPrev, onDismiss, totalSteps }: FeedbackTutorialProps) {
  const steps = isMobile ? TUTORIAL_STEPS_MOBILE : TUTORIAL_STEPS_DESKTOP;
  const currentStep = steps[step] || steps[0];
  const Icon = currentStep.icon;
  const isLastStep = step >= totalSteps - 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        layout
        className="w-full max-w-md bg-cream rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header with illustration */}
        <div className="relative bg-gradient-to-br from-dusty-rose to-terracotta p-8 text-white">
          <div className="absolute top-4 right-4 flex gap-2">
            <span className="text-sm text-white/70">
              {step + 1} / {totalSteps}
            </span>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-medium mb-2">{currentStep.title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-dune text-base leading-relaxed mb-6">
            {currentStep.description}
          </p>

          {/* Device indicator */}
          <div className="flex items-center gap-2 text-sm text-sage mb-6">
            {isMobile ? (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Mobile instructions</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                <span>Desktop instructions</span>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={onPrev}
              disabled={step === 0}
              className="flex items-center gap-1 px-4 py-2 text-sage disabled:opacity-30 disabled:cursor-not-allowed hover:text-dune transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {isLastStep ? (
              <button
                onClick={onDismiss}
                className="flex items-center gap-2 px-6 py-3 bg-dusty-rose text-white rounded-full font-medium hover:bg-terracotta transition-colors"
              >
                Get Started
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-6 py-3 bg-dusty-rose text-white rounded-full font-medium hover:bg-terracotta transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Skip option */}
          <button
            onClick={onDismiss}
            className="w-full mt-4 text-sm text-sage hover:text-dune transition-colors"
          >
            Skip tutorial
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface FeedbackInputModalProps {
  position: { x: number; y: number; viewportY: number };
  onConfirm: (feedback: string, authorName?: string) => void;
  onCancel: () => void;
  isMobile: boolean;
  initialFeedback?: string;
  isEditing?: boolean;
}

function FeedbackInputModal({
  position,
  onConfirm,
  onCancel,
  isMobile,
  initialFeedback = '',
  isEditing = false,
}: FeedbackInputModalProps) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [authorName, setAuthorName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus textarea on mount
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      onConfirm(feedback.trim(), authorName.trim() || undefined);
    }
  };

  // Position the modal near the pin but ensure it stays on screen
  const getModalPosition = () => {
    if (isMobile) {
      // On mobile, show as bottom sheet
      return {
        position: 'fixed' as const,
        bottom: 0,
        left: 0,
        right: 0,
      };
    }

    // On desktop, position near the click
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const modalWidth = 320;
    const modalHeight = 280;

    let left = position.x;
    let top = position.viewportY;

    // Keep within viewport bounds
    if (left + modalWidth > viewportWidth - 20) {
      left = viewportWidth - modalWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }
    if (top + modalHeight > viewportHeight - 20) {
      top = viewportHeight - modalHeight - 20;
    }
    if (top < 20) {
      top = 20;
    }

    return {
      position: 'fixed' as const,
      left,
      top,
    };
  };

  const modalPosition = getModalPosition();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10003]"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Modal */}
      <motion.div
        initial={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={modalPosition}
        className={`bg-cream shadow-2xl ${
          isMobile
            ? 'rounded-t-2xl pb-safe-bottom'
            : 'rounded-xl w-80'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-warm-sand">
            <h3 className="font-serif text-lg text-dune">
              {isEditing ? 'Edit Feedback' : 'Add Feedback'}
            </h3>
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-sage hover:text-dune transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-sage mb-1">Your feedback</label>
              <textarea
                ref={textareaRef}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What would you like to share about this area?"
                className="w-full h-24 px-3 py-2 bg-white border border-warm-sand rounded-lg text-dune placeholder:text-sage/50 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 resize-none"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-sm text-sage mb-1">Your name (optional)</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full px-3 py-2 bg-white border border-warm-sand rounded-lg text-dune placeholder:text-sage/50 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 p-4 border-t border-warm-sand">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sage hover:text-dune transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedback.trim()}
              className="flex-1 px-4 py-2 bg-dusty-rose text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-terracotta transition-colors"
            >
              {isEditing ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

interface FeedbackPinComponentProps {
  pin: FeedbackPin;
  scrollY: number;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onResolve: () => void;
  isMobile: boolean;
}

function FeedbackPinComponent({
  pin,
  scrollY,
  isActive,
  onClick,
  onEdit,
  onDelete,
  onResolve,
  isMobile,
}: FeedbackPinComponentProps) {
  // Calculate viewport position from document position
  const viewportTop = pin.y - scrollY;

  // Hide if pin is off-screen
  const isVisible = viewportTop > -50 && viewportTop < window.innerHeight + 50;

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      data-feedback-pin
      style={{
        position: 'fixed',
        left: `${pin.x}%`,
        top: viewportTop,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto',
      }}
      className="z-[10001]"
    >
      {/* Pin marker */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          pin.resolved
            ? 'bg-sage text-white'
            : 'bg-dusty-rose text-white'
        } ${isActive ? 'ring-4 ring-dusty-rose/30' : ''}`}
      >
        {pin.resolved ? (
          <Check className="w-4 h-4" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}

        {/* Pulse animation for new pins */}
        {!pin.resolved && (
          <span className="absolute inset-0 rounded-full bg-dusty-rose animate-ping opacity-30" />
        )}
      </motion.button>

      {/* Expanded card when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-cream rounded-lg shadow-xl border border-warm-sand overflow-hidden ${
              isMobile ? 'w-72' : 'w-64'
            }`}
          >
            {/* Feedback content */}
            <div className="p-3">
              <p className="text-sm text-dune leading-relaxed">{pin.feedback}</p>
              {pin.authorName && (
                <p className="text-xs text-sage mt-2">— {pin.authorName}</p>
              )}
              <p className="text-xs text-sage/60 mt-1">
                {pin.timestamp.toLocaleDateString()} at {pin.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex border-t border-warm-sand">
              <button
                onClick={onEdit}
                className="flex-1 px-3 py-2 text-sm text-sage hover:bg-warm-sand/50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onResolve}
                className={`flex-1 px-3 py-2 text-sm transition-colors ${
                  pin.resolved
                    ? 'text-sage hover:bg-warm-sand/50'
                    : 'text-dusty-rose hover:bg-dusty-rose/10'
                }`}
              >
                {pin.resolved ? 'Unresolve' : 'Resolve'}
              </button>
              <button
                onClick={onDelete}
                className="flex-1 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface LongPressIndicatorProps {
  position: { x: number; y: number };
}

function LongPressIndicator({ position }: LongPressIndicatorProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      className="z-[10001] pointer-events-none"
    >
      {/* Ripple rings */}
      <motion.div
        animate={{
          scale: [1, 2.5],
          opacity: [0.6, 0],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute inset-0 w-12 h-12 -ml-6 -mt-6 rounded-full border-2 border-dusty-rose"
      />
      <motion.div
        animate={{
          scale: [1, 2],
          opacity: [0.4, 0],
        }}
        transition={{
          duration: 0.5,
          delay: 0.15,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute inset-0 w-12 h-12 -ml-6 -mt-6 rounded-full border-2 border-dusty-rose"
      />

      {/* Center dot */}
      <div className="w-4 h-4 -ml-2 -mt-2 rounded-full bg-dusty-rose shadow-lg" />

      {/* Progress ring */}
      <svg
        className="absolute -ml-8 -mt-8 w-16 h-16"
        viewBox="0 0 64 64"
      >
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="rgb(205, 168, 158)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: LONG_PRESS_DURATION / 1000, ease: 'linear' }}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
      </svg>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function FeedbackLayer() {
  const { state, actions } = useFeedback();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [scrollY, setScrollY] = useState(0);

  // Track scroll position for pin rendering
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial value
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get element info at position
  const getElementInfo = useCallback((x: number, y: number): { sectionId: string | null; elementInfo: string | null } => {
    const element = document.elementFromPoint(x, y);

    if (!element) return { sectionId: null, elementInfo: null };

    // Find closest section
    const section = element.closest('[data-section-id]');
    const sectionId = section?.getAttribute('data-section-id') || null;

    // Build element info
    let elementInfo = element.tagName.toLowerCase();
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').slice(0, 3).join(' ');
      if (classes) elementInfo += `.${classes.replace(/\s+/g, '.')}`;
    }
    if (element.id) elementInfo = `#${element.id}`;

    return { sectionId, elementInfo };
  }, []);

  // Document-level event listeners for right-click and touch (allows scrolling to work)
  useEffect(() => {
    if (!state.isEnabled || state.showTutorial) return;

    // Handle right-click on desktop
    const handleContextMenu = (e: MouseEvent) => {
      if (state.isMobile) return;

      e.preventDefault();

      const { sectionId, elementInfo } = getElementInfo(e.clientX, e.clientY);

      actions.setPendingPin({
        x: (e.clientX / window.innerWidth) * 100,
        y: e.clientY + window.scrollY,
        viewportY: e.clientY,
        sectionId,
        elementInfo,
      });
    };

    // Handle touch events for mobile long-press
    const handleTouchStart = (e: TouchEvent) => {
      if (!state.isMobile) return;

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      actions.setPressActive(true, { x: touch.clientX, y: touch.clientY });

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        if (touchStartRef.current) {
          const { sectionId, elementInfo } = getElementInfo(
            touchStartRef.current.x,
            touchStartRef.current.y
          );

          actions.setPressActive(false);
          actions.setPendingPin({
            x: (touchStartRef.current.x / window.innerWidth) * 100,
            y: touchStartRef.current.y + window.scrollY,
            viewportY: touchStartRef.current.y,
            sectionId,
            elementInfo,
          });

          // Prevent the subsequent click
          e.preventDefault();
        }
      }, LONG_PRESS_DURATION);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      // Cancel if moved too far (allows scrolling)
      if (dx > 10 || dy > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        touchStartRef.current = null;
        actions.setPressActive(false);
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      touchStartRef.current = null;
      actions.setPressActive(false);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [state.isEnabled, state.isMobile, state.showTutorial, actions, getElementInfo]);

  // Handle clicking a pin
  const handlePinClick = useCallback((pinId: string) => {
    if (state.activePinId === pinId) {
      actions.editPin(''); // Deselect if clicking same pin
    } else {
      actions.editPin(pinId);
    }
  }, [state.activePinId, actions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.pendingPin) {
          actions.cancelPin();
        } else if (state.activePinId) {
          actions.cancelPin();
        } else if (state.showTutorial) {
          actions.dismissTutorial();
        } else if (state.isEnabled) {
          actions.disable();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isEnabled, state.pendingPin, state.activePinId, state.showTutorial, actions]);

  // Close active pin when clicking elsewhere
  useEffect(() => {
    if (!state.activePinId) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking on a pin or its card
      if (target.closest('[data-feedback-pin]')) return;
      actions.cancelPin();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [state.activePinId, actions]);

  if (!state.isEnabled) {
    return null;
  }

  const tutorialSteps = state.isMobile ? TUTORIAL_STEPS_MOBILE : TUTORIAL_STEPS_DESKTOP;

  return (
    <>
      {/* Visual overlay - pointer-events: none so scrolling works */}
      <div className="fixed inset-0 z-[10000] pointer-events-none">
        {/* Visual border to indicate feedback mode is active */}
        <div className="absolute inset-0 border-4 border-dusty-rose/30 rounded-lg m-1" />

        {/* Active mode indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-dusty-rose text-white rounded-full shadow-lg flex items-center gap-2 text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          Feedback Mode Active
        </motion.div>

        {/* Long press indicator */}
        <AnimatePresence>
          {state.isPressActive && state.pressPosition && (
            <LongPressIndicator position={state.pressPosition} />
          )}
        </AnimatePresence>
      </div>

      {/* Pins container - renders pins at their document positions */}
      <div className="fixed inset-0 z-[10001] pointer-events-none overflow-visible">
        <AnimatePresence>
          {state.pins.map((pin) => (
            <FeedbackPinComponent
              key={pin.id}
              pin={pin}
              scrollY={scrollY}
              isActive={state.activePinId === pin.id}
              onClick={() => handlePinClick(pin.id)}
              onEdit={() => {
                const p = state.pins.find(p => p.id === pin.id);
                if (p) {
                  actions.setPendingPin({
                    x: p.x,
                    y: p.y,
                    viewportY: p.viewportY,
                    sectionId: p.sectionId,
                    elementInfo: p.elementInfo,
                  });
                  actions.deletePin(pin.id);
                }
              }}
              onDelete={() => actions.deletePin(pin.id)}
              onResolve={() => pin.resolved ? actions.unresolvePin(pin.id) : actions.resolvePin(pin.id)}
              isMobile={state.isMobile}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Tutorial overlay */}
      <AnimatePresence>
        {state.showTutorial && (
          <FeedbackTutorial
            isMobile={state.isMobile}
            step={state.tutorialStep}
            onNext={actions.nextTutorialStep}
            onPrev={actions.prevTutorialStep}
            onDismiss={actions.dismissTutorial}
            totalSteps={tutorialSteps.length}
          />
        )}
      </AnimatePresence>

      {/* Feedback input modal */}
      <AnimatePresence>
        {state.pendingPin && (
          <FeedbackInputModal
            position={{
              x: (state.pendingPin.x / 100) * window.innerWidth,
              y: state.pendingPin.y,
              viewportY: state.pendingPin.viewportY,
            }}
            onConfirm={actions.confirmPin}
            onCancel={actions.cancelPin}
            isMobile={state.isMobile}
          />
        )}
      </AnimatePresence>

      {/* Bottom toolbar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`fixed z-[10001] ${
          state.isMobile
            ? 'bottom-0 left-0 right-0 pb-safe-bottom'
            : 'bottom-6 left-1/2 -translate-x-1/2'
        }`}
      >
        <div className={`flex items-center justify-center gap-2 p-3 bg-cream/95 backdrop-blur-sm shadow-lg ${
          state.isMobile
            ? 'border-t border-warm-sand'
            : 'rounded-full border border-warm-sand'
        }`}>
          {/* Pin count */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-warm-sand/50 rounded-full text-sm text-dune">
            <MessageCircle className="w-4 h-4" />
            <span>{state.pins.length} pin{state.pins.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-warm-sand" />

          {/* Help button */}
          <button
            onClick={actions.showTutorial}
            className="p-2 text-sage hover:text-dune hover:bg-warm-sand/50 rounded-full transition-colors"
            title="Show tutorial"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Export button */}
          <button
            onClick={() => {
              const json = actions.exportFeedback();
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `feedback-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={state.pins.length === 0}
            className="p-2 text-sage hover:text-dune hover:bg-warm-sand/50 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Export feedback"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Clear all button */}
          <button
            onClick={() => {
              if (window.confirm('Clear all feedback pins?')) {
                actions.clearAllPins();
              }
            }}
            disabled={state.pins.length === 0}
            className="p-2 text-sage hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Clear all pins"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-warm-sand" />

          {/* Exit button */}
          <button
            onClick={actions.disable}
            className="flex items-center gap-1 px-4 py-1.5 bg-dusty-rose text-white rounded-full text-sm font-medium hover:bg-terracotta transition-colors"
          >
            <X className="w-4 h-4" />
            Exit
          </button>
        </div>
      </motion.div>
    </>
  );
}
