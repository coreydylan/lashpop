'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { BottomSheetFrame } from '../frames/BottomSheetFrame';

// Import panel components
import { CategoryPickerPanel } from '../panels/CategoryPickerPanel';
import { ServicePanel } from '../panels/ServicePanel';
import { DiscoveryPanel } from '../panels/DiscoveryPanel';

// Snap points as percentages from bottom (0 = bottom of screen)
const SNAP_POINTS = {
  closed: 100,    // Off screen (translateY 100%)
  peek: 88,       // Just handle + header visible (~12% of screen = ~96px on iPhone)
  half: 45,       // Half screen visible
  full: 8,        // Nearly full (leaves status bar area)
} as const;

type SnapPoint = keyof typeof SNAP_POINTS;

// Spring animation config for natural feel
const springConfig = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 300,
};

export function BottomSheetContainer() {
  const { state, actions } = usePanelStack();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>('closed');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  // Sort panels by level
  const sortedPanels = [...state.panels]
    .filter(p => p.state !== 'closed')
    .sort((a, b) => a.level - b.level);

  const hasExpandedPanel = sortedPanels.some(p => p.state === 'expanded');
  const hasAnyPanel = sortedPanels.length > 0;

  // Animate to a snap point
  const animateToSnap = useCallback((snap: SnapPoint) => {
    controls.start({
      y: `${SNAP_POINTS[snap]}%`,
      transition: springConfig,
    });
    setCurrentSnap(snap);
  }, [controls]);

  // Sync snap point with panel state
  useEffect(() => {
    if (!hasAnyPanel) {
      animateToSnap('closed');
    } else if (hasExpandedPanel) {
      animateToSnap('half');
    } else {
      // Has panels but none expanded = peek
      animateToSnap('peek');
    }
  }, [hasAnyPanel, hasExpandedPanel, animateToSnap]);

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
    dragStartY.current = SNAP_POINTS[currentSnap];
  };

  // Handle drag end - snap to nearest point
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    const velocity = info.velocity.y;
    const containerHeight = window.innerHeight;
    const dragDistance = info.offset.y;
    const dragPercentage = (dragDistance / containerHeight) * 100;
    const currentPercentage = dragStartY.current + dragPercentage;

    // Fast swipe down = close/dock
    if (velocity > 500) {
      if (currentSnap === 'full') {
        animateToSnap('half');
      } else if (currentSnap === 'half') {
        animateToSnap('peek');
        actions.dockAll();
      } else {
        animateToSnap('closed');
        actions.closeAll();
      }
      return;
    }

    // Fast swipe up = expand
    if (velocity < -500) {
      if (currentSnap === 'peek' || currentSnap === 'closed') {
        animateToSnap('half');
        // Expand first panel
        const firstPanel = sortedPanels[0];
        if (firstPanel && firstPanel.state === 'docked') {
          actions.expandPanel(firstPanel.id);
        }
      } else if (currentSnap === 'half') {
        animateToSnap('full');
      }
      return;
    }

    // Slow drag - snap to nearest based on final position
    if (currentPercentage > 94) {
      animateToSnap('closed');
      actions.closeAll();
    } else if (currentPercentage > 66) {
      animateToSnap('peek');
      actions.dockAll();
    } else if (currentPercentage > 26) {
      animateToSnap('half');
    } else {
      animateToSnap('full');
    }
  };

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (currentSnap === 'half' || currentSnap === 'full') {
      animateToSnap('peek');
      actions.dockAll();
    }
  };

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (hasAnyPanel && currentSnap !== 'closed') {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [hasAnyPanel, currentSnap]);

  // Don't render if no panels
  if (!hasAnyPanel) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {currentSnap !== 'peek' && currentSnap !== 'closed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-dune/40 backdrop-blur-sm z-40"
            onClick={handleBackdropClick}
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <motion.div
        ref={containerRef}
        data-panel-mode="bottom"
        className="fixed inset-x-0 bottom-0 z-50 bg-cream rounded-t-3xl shadow-2xl will-change-transform"
        style={{
          height: '100dvh',
          touchAction: 'none',
        }}
        initial={{ y: '100%' }}
        animate={controls}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.3 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <motion.div
            className="w-10 h-1 bg-sage/40 rounded-full"
            animate={{
              width: isDragging ? 48 : 40,
              backgroundColor: isDragging ? 'rgb(161, 151, 129)' : 'rgba(161, 151, 129, 0.4)',
            }}
            transition={{ duration: 0.15 }}
          />
        </div>

        {/* Panel Content */}
        <div
          ref={contentRef}
          className="overflow-y-auto overscroll-contain"
          style={{
            height: 'calc(100dvh - 24px)',
            touchAction: currentSnap === 'full' ? 'pan-y' : 'none',
            overscrollBehavior: 'contain',
          }}
        >
          <AnimatePresence mode="popLayout">
            {sortedPanels.map(panel => (
              <BottomSheetFrame key={panel.id} panel={panel}>
                {panel.type === 'category-picker' && <CategoryPickerPanel panel={panel} />}
                {panel.type === 'discovery' && <DiscoveryPanel panel={panel} />}
                {panel.type === 'service-panel' && <ServicePanel panel={panel} />}
              </BottomSheetFrame>
            ))}
          </AnimatePresence>

          {/* Bottom safe area padding */}
          <div className="h-8 bg-cream" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        </div>
      </motion.div>
    </>
  );
}
