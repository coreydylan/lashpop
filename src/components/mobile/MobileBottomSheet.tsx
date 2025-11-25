'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform, animate } from 'framer-motion';
import { X, ChevronDown, GripHorizontal } from 'lucide-react';

export type SheetState = 'closed' | 'peeked' | 'expanded';

interface MobileBottomSheetProps {
  isOpen: boolean;
  state: SheetState;
  onStateChange: (state: SheetState) => void;
  onClose: () => void;
  title?: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
  peekHeight?: number;
  expandedHeight?: string; // e.g., '85vh', '90%'
  showHandle?: boolean;
  allowPeek?: boolean;
  zIndex?: number;
}

/**
 * Mobile Bottom Sheet Component
 *
 * A gesture-driven bottom sheet that supports three states:
 * - closed: Fully hidden
 * - peeked: Partially visible showing summary/header (for quick access)
 * - expanded: Fully open with scrollable content
 *
 * UX Justification:
 * - Bottom sheets are the natural pattern for secondary content on mobile
 * - Gesture-based interaction (swipe down to minimize, swipe up to expand) is intuitive
 * - Peeked state allows persistent visibility of key actions without obscuring content
 * - Smooth spring animations provide satisfying, premium feel
 * - Handle provides visual affordance for draggability
 */
export function MobileBottomSheet({
  isOpen,
  state,
  onStateChange,
  onClose,
  title,
  summary,
  children,
  peekHeight = 80,
  expandedHeight = '85vh',
  showHandle = true,
  allowPeek = true,
  zIndex = 50
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [contentScrollTop, setContentScrollTop] = useState(0);

  // Motion values for drag interaction
  const y = useMotionValue(0);

  // Calculate heights
  const expandedHeightPx = typeof expandedHeight === 'string' && expandedHeight.includes('vh')
    ? (parseInt(expandedHeight) / 100) * (typeof window !== 'undefined' ? window.innerHeight : 800)
    : parseInt(expandedHeight as string) || 600;

  // Transform y to opacity for backdrop
  const backdropOpacity = useTransform(
    y,
    [0, expandedHeightPx],
    [0.5, 0]
  );

  // Determine the target Y position based on state
  const getTargetY = useCallback((targetState: SheetState) => {
    switch (targetState) {
      case 'closed':
        return expandedHeightPx + 100; // Fully off screen
      case 'peeked':
        return expandedHeightPx - peekHeight;
      case 'expanded':
        return 0;
      default:
        return expandedHeightPx + 100;
    }
  }, [expandedHeightPx, peekHeight]);

  // Animate to target state
  useEffect(() => {
    if (!isOpen) {
      animate(y, getTargetY('closed'), {
        type: 'spring',
        damping: 30,
        stiffness: 300
      });
      return;
    }

    const targetY = getTargetY(state);
    animate(y, targetY, {
      type: 'spring',
      damping: 30,
      stiffness: 300
    });
  }, [state, isOpen, y, getTargetY]);

  // Handle drag end - determine which state to snap to
  const handleDragEnd = useCallback((
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);
    const currentY = y.get();
    const velocity = info.velocity.y;

    // Thresholds for state transitions
    const expandedThreshold = expandedHeightPx * 0.3;
    const peekThreshold = expandedHeightPx - peekHeight - 50;

    // Use velocity for quick gestures
    if (Math.abs(velocity) > 500) {
      if (velocity > 0) {
        // Swiping down
        if (state === 'expanded') {
          if (allowPeek) {
            onStateChange('peeked');
          } else {
            onClose();
          }
        } else {
          onClose();
        }
      } else {
        // Swiping up
        onStateChange('expanded');
      }
      return;
    }

    // Use position for slow drags
    if (currentY < expandedThreshold) {
      onStateChange('expanded');
    } else if (allowPeek && currentY < peekThreshold) {
      onStateChange('peeked');
    } else {
      onClose();
    }
  }, [y, expandedHeightPx, peekHeight, state, allowPeek, onStateChange, onClose]);

  // Handle drag - prevent closing if content is scrolled
  const handleDrag = useCallback((
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // If content is scrolled and user is dragging up, allow content scroll
    if (contentScrollTop > 0 && info.delta.y < 0) {
      return;
    }
  }, [contentScrollTop]);

  // Track content scroll position
  const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setContentScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Should we allow drag? Only from handle or when content is at top
  const shouldAllowDrag = useCallback(() => {
    return contentScrollTop === 0 || state === 'peeked';
  }, [contentScrollTop, state]);

  // Handle clicking the peeked area to expand
  const handlePeekClick = useCallback(() => {
    if (state === 'peeked') {
      onStateChange('expanded');
    }
  }, [state, onStateChange]);

  if (!isOpen && state === 'closed') {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black md:hidden"
            style={{ opacity: backdropOpacity, zIndex: zIndex - 1 }}
            initial={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (state === 'expanded') {
                if (allowPeek) {
                  onStateChange('peeked');
                } else {
                  onClose();
                }
              } else {
                onClose();
              }
            }}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className="fixed left-0 right-0 bottom-0 bg-cream rounded-t-3xl shadow-2xl md:hidden overflow-hidden"
            style={{
              y,
              zIndex,
              height: expandedHeight,
              maxHeight: `calc(100vh - env(safe-area-inset-top, 0px) - 80px)`,
            }}
            drag={shouldAllowDrag() ? 'y' : false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            initial={{ y: expandedHeightPx + 100 }}
            exit={{ y: expandedHeightPx + 100 }}
          >
            {/* Handle */}
            {showHandle && (
              <div
                className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
                onClick={handlePeekClick}
              >
                <div className="w-10 h-1 rounded-full bg-dune/20" />
              </div>
            )}

            {/* Header - always visible */}
            <div
              className={`px-5 pb-3 ${state === 'peeked' ? 'cursor-pointer' : ''}`}
              onClick={handlePeekClick}
            >
              <div className="flex items-center justify-between">
                {title && (
                  <h3 className="text-lg font-medium text-dune">{title}</h3>
                )}

                <div className="flex items-center gap-2">
                  {state === 'expanded' && allowPeek && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStateChange('peeked');
                      }}
                      className="p-2 -mr-1 rounded-full hover:bg-dune/5 transition-colors"
                      aria-label="Minimize"
                    >
                      <ChevronDown size={20} className="text-dune/60" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="p-2 -mr-2 rounded-full hover:bg-dune/5 transition-colors"
                    aria-label="Close"
                  >
                    <X size={20} className="text-dune/60" />
                  </button>
                </div>
              </div>

              {/* Summary - visible in peeked state */}
              {summary && state === 'peeked' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-dune/70"
                >
                  {summary}
                </motion.div>
              )}
            </div>

            {/* Content - scrollable */}
            <motion.div
              ref={contentRef}
              className={`px-5 pb-safe overflow-y-auto transition-opacity duration-200 ${
                state === 'peeked' ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              style={{
                height: `calc(100% - ${showHandle ? '60px' : '48px'})`,
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)'
              }}
              onScroll={handleContentScroll}
            >
              {children}
            </motion.div>

            {/* Expand hint for peeked state */}
            {state === 'peeked' && (
              <motion.div
                className="absolute bottom-4 left-0 right-0 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-1 text-xs text-dune/50">
                  <GripHorizontal size={16} />
                  <span>Swipe up to expand</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
