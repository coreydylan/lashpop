'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { BottomSheetFrame } from '../frames/BottomSheetFrame';
import type { Panel } from '@/types/panel-stack';

// Import panel components
import { CategoryPickerPanel } from '../panels/CategoryPickerPanel';
import { ServicePanel } from '../panels/ServicePanel';
import { DiscoveryPanel } from '../panels/DiscoveryPanel';
import { VagaroWidgetPanel } from '../panels/VagaroWidgetPanel';

// Snap points as percentages from top (0 = top of screen)
// Refined for better mobile UX - more usable space at each level
const SNAP_POINTS = {
  closed: 100,      // Off screen (translateY 100%)
  peek: 85,         // Header visible with content hint (~15% = ~120px on iPhone)
  comfortable: 35,  // Primary expanded state - shows content without blocking too much
  full: 5,          // Full takeover (leaves status bar)
} as const;

type SnapPoint = keyof typeof SNAP_POINTS;

// Spring animation config for natural feel
const springConfig = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 300,
};

/**
 * Renders panel content based on type.
 */
function PanelContent({ panel }: { panel: Panel }) {
  switch (panel.type) {
    case 'category-picker':
      return <CategoryPickerPanel panel={panel} />;
    case 'discovery':
      return <DiscoveryPanel panel={panel} />;
    case 'service-panel':
      return <ServicePanel panel={panel} />;
    case 'vagaro-widget':
      return <VagaroWidgetPanel panel={panel} />;
    default:
      return null;
  }
}

export function BottomSheetContainer() {
  const { state, actions } = usePanelStack();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>('closed');
  const [isDragging, setIsDragging] = useState(false);
  const [contentAtTop, setContentAtTop] = useState(true);
  const [showDragHint, setShowDragHint] = useState(true);
  const dragStartY = useRef(0);

  // Track vagaro widget panels for persistence
  const [persistedVagaroPanels, setPersistedVagaroPanels] = useState<Panel[]>([]);

  // Sort panels by level
  const sortedPanels = [...state.panels]
    .filter(p => p.state !== 'closed')
    .sort((a, b) => a.level - b.level);

  const hasExpandedPanel = sortedPanels.some(p => p.state === 'expanded');
  const hasAnyPanel = sortedPanels.length > 0;

  // Track vagaro widget panels for persistence
  useEffect(() => {
    const vagaroPanels = state.panels.filter(p => p.type === 'vagaro-widget');

    setPersistedVagaroPanels(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const currentIds = new Set(vagaroPanels.map(p => p.id));

      // Remove panels that have been explicitly closed
      const stillValid = prev.filter(p => currentIds.has(p.id));

      // Add new panels
      const newPanels = vagaroPanels.filter(p => !existingIds.has(p.id));

      return [...stillValid, ...newPanels];
    });
  }, [state.panels]);

  // Animate to a snap point
  const animateToSnap = useCallback((snap: SnapPoint) => {
    // Add haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10); // Short 10ms vibration
    }
    controls.start({
      y: `${SNAP_POINTS[snap]}%`,
      transition: springConfig,
    });
    setCurrentSnap(snap);
  }, [controls]);

  // Handle content scroll - track when at top for drag behavior
  const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setContentAtTop(scrollTop <= 0);
  }, []);

  // Reset content scroll position tracking when panels change or snap changes
  useEffect(() => {
    // Reset to top when snap changes to peek or closed
    if (currentSnap === 'peek' || currentSnap === 'closed') {
      setContentAtTop(true);
    }
    // Also reset when returning to comfortable/full from peek
    if ((currentSnap === 'comfortable' || currentSnap === 'full') && contentRef.current) {
      const scrollTop = contentRef.current.scrollTop;
      setContentAtTop(scrollTop <= 0);
    }
  }, [currentSnap, sortedPanels.length]);

  // Sync snap point with panel state
  useEffect(() => {
    if (!hasAnyPanel) {
      animateToSnap('closed');
    } else if (hasExpandedPanel) {
      animateToSnap('comfortable');
    } else {
      // Has panels but none expanded = peek
      animateToSnap('peek');
    }
  }, [hasAnyPanel, hasExpandedPanel, animateToSnap]);

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasAnyPanel) {
        e.preventDefault();
        if (currentSnap === 'comfortable' || currentSnap === 'full') {
          animateToSnap('peek');
          actions.dockAll();
        } else if (currentSnap === 'peek') {
          animateToSnap('closed');
          actions.closeAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasAnyPanel, currentSnap, animateToSnap, actions]);

  // Android back button (History API)
  useEffect(() => {
    if (!hasAnyPanel) return;

    // Push a state when sheet opens
    window.history.pushState({ bottomSheet: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      if (currentSnap !== 'closed') {
        // Prevent navigation, collapse sheet instead
        e.preventDefault();
        window.history.pushState({ bottomSheet: true }, '');

        if (currentSnap === 'comfortable' || currentSnap === 'full') {
          animateToSnap('peek');
          actions.dockAll();
        } else {
          animateToSnap('closed');
          actions.closeAll();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasAnyPanel, currentSnap, animateToSnap, actions]);

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
        animateToSnap('comfortable');
      } else if (currentSnap === 'comfortable') {
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
        animateToSnap('comfortable');
        // Expand first panel
        const firstPanel = sortedPanels[0];
        if (firstPanel && firstPanel.state === 'docked') {
          actions.expandPanel(firstPanel.id);
        }
      } else if (currentSnap === 'comfortable') {
        animateToSnap('full');
      }
      return;
    }

    // Slow drag - snap to nearest based on final position
    if (currentPercentage > 92) {
      animateToSnap('closed');
      actions.closeAll();
    } else if (currentPercentage > 60) {
      animateToSnap('peek');
      actions.dockAll();
    } else if (currentPercentage > 20) {
      animateToSnap('comfortable');
    } else {
      animateToSnap('full');
    }
  };

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (currentSnap === 'comfortable' || currentSnap === 'full') {
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

  // Hide drag hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDragHint(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Don't render if no panels
  if (!hasAnyPanel) {
    return null;
  }

  // Separate regular panels from panels that need persistence (vagaro-widget and service-panel with booking)
  // Service panels need persistence to keep Vagaro iframe state when collapsing/expanding
  const regularPanels = sortedPanels.filter(p => p.type !== 'vagaro-widget' && p.type !== 'service-panel');
  const servicePanels = sortedPanels.filter(p => p.type === 'service-panel');

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
        className="fixed inset-x-0 bottom-0 z-50 bg-cream rounded-t-[20px] shadow-2xl will-change-transform"
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
        {/* Drag Handle - Enhanced and prominent */}
        <div
          className="flex flex-col items-center py-4 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <motion.div
            className="w-12 h-1.5 bg-sage/50 rounded-full"
            animate={{
              width: isDragging ? 56 : 48,
              backgroundColor: isDragging ? 'rgba(161, 151, 129, 0.7)' : 'rgba(161, 151, 129, 0.5)',
              scale: showDragHint && !isDragging ? [1, 1.05, 1] : 1,
            }}
            transition={{
              width: { duration: 0.15 },
              backgroundColor: { duration: 0.15 },
              scale: {
                duration: 2,
                repeat: showDragHint ? Infinity : 0,
                repeatType: 'loop' as const
              },
            }}
          />
          <AnimatePresence>
            {showDragHint && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="mt-1.5 text-xs text-sage/60 select-none"
              >
                Drag to resize
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Panel Content */}
        <div
          ref={contentRef}
          className="overflow-y-auto overscroll-contain"
          style={{
            height: 'calc(100dvh - 20px)',
            touchAction: (currentSnap === 'full' || currentSnap === 'comfortable')
              ? (contentAtTop ? 'none' : 'pan-y')
              : 'none',
            overscrollBehavior: 'contain',
          }}
          onScroll={handleContentScroll}
        >
          {/* Regular panels with AnimatePresence */}
          <AnimatePresence mode="popLayout">
            {regularPanels.map(panel => (
              <BottomSheetFrame
                key={panel.id}
                panel={panel}
                fullWidthContent={false}
              >
                <PanelContent panel={panel} />
              </BottomSheetFrame>
            ))}
          </AnimatePresence>

          {/* Service panels - kept mounted but hidden when docked to preserve Vagaro widget state */}
          {servicePanels.map(panel => {
            const isExpanded = panel.state === 'expanded';

            return (
              <div
                key={panel.id}
                style={{
                  display: isExpanded ? 'block' : 'none',
                }}
              >
                <BottomSheetFrame
                  panel={panel}
                  fullWidthContent={false}
                >
                  <PanelContent panel={panel} />
                </BottomSheetFrame>
              </div>
            );
          })}

          {/* Vagaro widget panels - kept mounted but hidden when docked */}
          {persistedVagaroPanels.map(persistedPanel => {
            const currentPanel = state.panels.find(p => p.id === persistedPanel.id);
            const isExpanded = currentPanel?.state === 'expanded';
            const isInStack = currentPanel !== undefined;

            if (!isInStack) {
              return null;
            }

            return (
              <div
                key={persistedPanel.id}
                style={{
                  display: isExpanded ? 'block' : 'none',
                }}
              >
                <BottomSheetFrame
                  panel={currentPanel || persistedPanel}
                  fullWidthContent={true}
                >
                  <PanelContent panel={currentPanel || persistedPanel} />
                </BottomSheetFrame>
              </div>
            );
          })}

          {/* Bottom safe area padding */}
          <div className="h-8 bg-cream" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        </div>
      </motion.div>

      {/* Floating Minimize Button - appears at comfortable/full snap points */}
      <AnimatePresence>
        {(currentSnap === 'comfortable' || currentSnap === 'full') && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{
              delay: 1,
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            onClick={() => {
              animateToSnap('peek');
              actions.dockAll();
            }}
            className="fixed left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-full bg-cream/95 backdrop-blur-md shadow-lg border border-sage/20 hover:bg-cream hover:shadow-xl active:scale-95 transition-all"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 24px) + 24px)',
            }}
          >
            <ChevronDown className="w-4 h-4 text-sage" />
            <span className="text-sm font-medium text-dune">Minimize</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
