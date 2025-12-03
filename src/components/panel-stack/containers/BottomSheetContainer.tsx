'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation, useDragControls } from 'framer-motion';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { BottomSheetFrame } from '../frames/BottomSheetFrame';
import { CollapsedChipBar } from './CollapsedChipBar';
import { getCategoryColors } from '@/lib/category-colors';
import type { Panel } from '@/types/panel-stack';

// Import panel components
import { CategoryPickerPanel } from '../panels/CategoryPickerPanel';
import { ServicePanel } from '../panels/ServicePanel';
import { DiscoveryPanel } from '../panels/DiscoveryPanel';
import { VagaroWidgetPanel } from '../panels/VagaroWidgetPanel';

// Simplified 3-state snap points
const SNAP_POINTS = {
  hidden: 100,      // Off screen (translateY 100%)
  collapsed: 88,    // Compact chip bar at bottom (~12% = ~96px visible, clears safe area)
  fullScreen: 5,    // Full takeover (leaves status bar)
} as const;

type SnapPoint = keyof typeof SNAP_POINTS;

// Smooth spring for state transitions
const springConfig = {
  type: 'spring' as const,
  damping: 35,
  stiffness: 400,
};

// Bouncy spring for initial appearance
const bounceConfig = {
  type: 'spring' as const,
  damping: 12,
  stiffness: 200,
  mass: 0.8,
};

// Quick attention bounce (subtle nudge)
const attentionBounceKeyframes = {
  y: ['88%', '84%', '88%'],
  transition: {
    duration: 0.4,
    ease: [0.22, 1, 0.36, 1] as const,
    times: [0, 0.4, 1],
  },
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

interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  colors: {
    primary: string;
    light: string;
    medium: string;
    ring: string;
  };
  serviceCount: number;
}

/**
 * BottomSheetContainer - 3-State Mobile Bottom Sheet
 *
 * States:
 * - hidden: Not visible
 * - collapsed: Compact chip bar docked at bottom
 * - fullScreen: Full viewport, locked in place
 *
 * Drag surfaces:
 * - Collapsed: Entire chip bar is draggable (swipe up after interaction)
 * - FullScreen: Only the drag handle at top is draggable (swipe down to collapse)
 * - Content area scrolls independently, never triggers sheet drag
 */
export function BottomSheetContainer() {
  const { state, actions } = usePanelStack();
  const controls = useAnimation();
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>('hidden');
  const [isDragging, setIsDragging] = useState(false);
  const [isFirstAppearance, setIsFirstAppearance] = useState(true);

  // Track vagaro widget panels for persistence
  const [persistedVagaroPanels, setPersistedVagaroPanels] = useState<Panel[]>([]);

  // Get panels that need to be shown
  const sortedPanels = useMemo(() =>
    [...state.panels]
      .filter(p => p.state !== 'closed')
      .sort((a, b) => a.level - b.level),
    [state.panels]
  );

  const hasExpandedPanel = sortedPanels.some(p => p.state === 'expanded');
  const hasAnyPanel = sortedPanels.length > 0;

  // Check if we have a category-picker panel (determines if we show chip bar)
  const hasCategoryPicker = sortedPanels.some(p => p.type === 'category-picker');

  // Build category list from services for chip bar
  const categories = useMemo(() => {
    const categoryMap = new Map<string, Category>();

    state.services.forEach(service => {
      if (!service.categorySlug || !service.categoryName) return;

      if (!categoryMap.has(service.categorySlug)) {
        const colors = getCategoryColors(service.categorySlug);

        categoryMap.set(service.categorySlug, {
          id: service.categorySlug,
          name: service.categoryName,
          slug: service.categorySlug,
          iconName: colors.iconName,
          colors: {
            primary: colors.primary,
            light: colors.light,
            medium: colors.medium,
            ring: colors.ring,
          },
          serviceCount: 0,
        });
      }

      const category = categoryMap.get(service.categorySlug)!;
      category.serviceCount++;
    });

    return Array.from(categoryMap.values());
  }, [state.services]);

  // Get subcategories for a category
  const getSubcategories = useCallback((categoryId: string) => {
    const subcatMap = new Map<string, { id: string; name: string; slug: string }>();

    state.services
      .filter(s => s.categorySlug === categoryId && s.subcategorySlug && s.subcategoryName)
      .forEach(s => {
        if (!subcatMap.has(s.subcategorySlug)) {
          subcatMap.set(s.subcategorySlug, {
            id: s.subcategorySlug,
            name: s.subcategoryName,
            slug: s.subcategorySlug,
          });
        }
      });

    return Array.from(subcatMap.values());
  }, [state.services]);

  // Track vagaro widget panels for persistence
  useEffect(() => {
    const vagaroPanels = state.panels.filter(p => p.type === 'vagaro-widget');

    setPersistedVagaroPanels(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const currentIds = new Set(vagaroPanels.map(p => p.id));

      const stillValid = prev.filter(p => currentIds.has(p.id));
      const newPanels = vagaroPanels.filter(p => !existingIds.has(p.id));

      return [...stillValid, ...newPanels];
    });
  }, [state.panels]);

  // Animate to a snap point
  const animateToSnap = useCallback((snap: SnapPoint, useBounce = false) => {
    // Haptic feedback on state change
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }

    // Use bounce animation for first appearance of collapsed state
    const transition = useBounce ? bounceConfig : springConfig;

    controls.start({
      y: `${SNAP_POINTS[snap]}%`,
      transition,
    });
    setCurrentSnap(snap);
  }, [controls]);

  // Sync snap point with panel state
  useEffect(() => {
    if (!hasAnyPanel) {
      animateToSnap('hidden');
      // Reset first appearance when sheet is hidden
      setIsFirstAppearance(true);
    } else if (hasExpandedPanel) {
      animateToSnap('fullScreen');
      setIsFirstAppearance(false);
    } else {
      // Collapsed state - use bounce on first appearance
      animateToSnap('collapsed', isFirstAppearance);
      setIsFirstAppearance(false);
    }
  }, [hasAnyPanel, hasExpandedPanel, animateToSnap, isFirstAppearance]);

  // Attention bounce when triggered (e.g., Book Now clicked when chip bar already visible)
  const lastBounceCount = useRef(state.attentionBounceCount);
  useEffect(() => {
    if (state.attentionBounceCount > lastBounceCount.current && currentSnap === 'collapsed') {
      // Haptic feedback
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
      // Trigger attention bounce animation
      controls.start(attentionBounceKeyframes);
    }
    lastBounceCount.current = state.attentionBounceCount;
  }, [state.attentionBounceCount, currentSnap, controls]);

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasAnyPanel) {
        e.preventDefault();
        if (currentSnap === 'fullScreen') {
          animateToSnap('collapsed');
          actions.dockAll();
        } else if (currentSnap === 'collapsed') {
          animateToSnap('hidden');
          actions.closeAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasAnyPanel, currentSnap, animateToSnap, actions]);

  // Android back button
  useEffect(() => {
    if (!hasAnyPanel) return;

    window.history.pushState({ bottomSheet: true }, '');

    const handlePopState = () => {
      if (currentSnap !== 'hidden') {
        window.history.pushState({ bottomSheet: true }, '');

        if (currentSnap === 'fullScreen') {
          animateToSnap('collapsed');
          actions.dockAll();
        } else {
          animateToSnap('hidden');
          actions.closeAll();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasAnyPanel, currentSnap, animateToSnap, actions]);

  // Handle drag on the drag handle (fullScreen state)
  const handleDragHandlePointerDown = (e: React.PointerEvent) => {
    if (currentSnap === 'fullScreen') {
      dragControls.start(e);
    }
  };

  // Handle swipe on collapsed chip bar
  const handleChipBarSwipe = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up') {
      // Mark as interacted on swipe up
      actions.setUserInteracted();
      // Expand first docked panel (or the service panel if exists)
      const servicePanel = sortedPanels.find(p => p.type === 'service-panel');
      const firstDockedPanel = sortedPanels.find(p => p.state === 'docked');
      const panelToExpand = servicePanel || firstDockedPanel;
      if (panelToExpand) {
        actions.expandPanel(panelToExpand.id);
      }
    } else if (direction === 'down') {
      animateToSnap('hidden');
      actions.closeAll();
    }
  }, [sortedPanels, actions, animateToSnap]);

  // Handle backdrop click - collapse to chip bar
  const handleBackdropClick = () => {
    if (currentSnap === 'fullScreen') {
      animateToSnap('collapsed');
      actions.dockAll();
    }
  };

  // Lock body scroll when sheet is in fullScreen
  useEffect(() => {
    if (currentSnap === 'fullScreen') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [currentSnap]);

  // Handle category selection from chip bar
  // Single surface model: clicking a category switches the view, doesn't open/close panels
  const handleCategorySelect = useCallback((category: Category) => {
    actions.setUserInteracted();

    const isSelected = state.categorySelections.some(c => c.categoryId === category.id);
    const existingServicePanel = state.panels.find(p => p.type === 'service-panel');

    if (isSelected) {
      // Clicking already selected category - deselect and collapse to chip bar
      actions.deselectCategory(category.id);
      if (existingServicePanel) {
        actions.dockPanel(existingServicePanel.id);
      }
    } else {
      // Clear any existing category selections first (single selection model)
      state.categorySelections.forEach(sel => {
        actions.deselectCategory(sel.categoryId);
      });

      // Select new category
      actions.selectCategory(category.id, category.name);

      if (existingServicePanel) {
        // Update existing panel's data instead of opening a new one
        actions.updatePanelData(existingServicePanel.id, {
          categoryId: category.id,
          categoryName: category.name,
          subcategories: getSubcategories(category.id),
          services: state.services.filter(s => s.categorySlug === category.id),
        });
        actions.expandPanel(existingServicePanel.id);
      } else {
        // No existing panel - open new one
        const categoryPickerPanel = state.panels.find(p => p.type === 'category-picker');

        actions.openPanel(
          'service-panel',
          {
            categoryId: category.id,
            categoryName: category.name,
            subcategories: getSubcategories(category.id),
            services: state.services.filter(s => s.categorySlug === category.id),
          },
          {
            parentId: categoryPickerPanel?.id,
            autoExpand: true,
            scrollToTop: true,
          }
        );
      }
    }
  }, [state.categorySelections, state.panels, state.services, actions, getSubcategories]);

  // Handle Discover selection
  const handleDiscoverSelect = useCallback(() => {
    actions.setUserInteracted();

    const existingDiscovery = state.panels.find(p => p.type === 'discovery');

    if (existingDiscovery) {
      actions.expandPanel(existingDiscovery.id);
    } else {
      actions.openPanel(
        'discovery',
        { entryPoint: 'chip-bar' },
        { autoExpand: true, scrollToTop: true }
      );
    }
  }, [state.panels, actions]);

  // Don't render if no panels
  if (!hasAnyPanel) {
    return null;
  }

  // Separate panels by type for rendering
  const regularPanels = sortedPanels.filter(p => p.type !== 'vagaro-widget' && p.type !== 'service-panel');
  const servicePanels = sortedPanels.filter(p => p.type === 'service-panel');

  return (
    <>
      {/* Backdrop overlay - only in fullScreen */}
      <AnimatePresence>
        {currentSnap === 'fullScreen' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-dune/30 backdrop-blur-sm z-40"
            onClick={handleBackdropClick}
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <motion.div
        ref={containerRef}
        data-panel-mode="bottom"
        className={`
          fixed inset-x-0 bottom-0 z-50 bg-cream will-change-transform
          ${currentSnap === 'fullScreen' ? 'rounded-t-[24px] shadow-2xl' : ''}
        `}
        style={{ height: '100dvh' }}
        initial={{ y: '100%' }}
        animate={controls}
        drag={currentSnap === 'fullScreen' ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          const velocity = info.velocity.y;
          const offset = info.offset.y;

          // Swipe down from fullScreen → collapse (lower thresholds for stickier feel)
          if (velocity > 150 || offset > 60) {
            animateToSnap('collapsed');
            actions.dockAll();
          } else {
            // Snap back to fullScreen
            animateToSnap('fullScreen');
          }
        }}
      >
        {/* Collapsed State: Chip Bar - entire area is swipeable */}
        <AnimatePresence mode="wait">
          {currentSnap === 'collapsed' && hasCategoryPicker && (
            <motion.div
              key="chip-bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.15}
              dragDirectionLock
              onDragEnd={(_, info) => {
                const velocity = info.velocity.y;
                const offset = info.offset.y;
                // Swipe up to expand (always works now, not just after interaction)
                if (velocity < -100 || offset < -20) {
                  handleChipBarSwipe('up');
                } else if (velocity > 150 || offset > 30) {
                  // Swipe down to close
                  handleChipBarSwipe('down');
                }
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <CollapsedChipBar
                onCategorySelect={handleCategorySelect}
                onDiscoverSelect={handleDiscoverSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Screen State: Content */}
        <AnimatePresence mode="wait">
          {currentSnap === 'fullScreen' && (
            <motion.div
              key="full-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full flex flex-col"
            >
              {/* Drag Handle - large touch target for swipe down */}
              <div
                className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
                onPointerDown={handleDragHandlePointerDown}
                style={{
                  touchAction: 'none',
                  minHeight: '56px',
                  paddingTop: '12px',
                  paddingBottom: '8px',
                }}
              >
                <motion.div
                  className="w-12 h-1.5 rounded-full"
                  animate={{
                    width: isDragging ? 56 : 48,
                    backgroundColor: isDragging ? 'rgba(161, 151, 129, 0.7)' : 'rgba(161, 151, 129, 0.4)',
                  }}
                  transition={{ duration: 0.1 }}
                />
                {/* Invisible touch target extension */}
                <div className="w-full h-6" />
              </div>

              {/* Panel Content - scrolls independently */}
              <div
                ref={contentRef}
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{ touchAction: 'pan-y' }}
              >
                {/* Regular panels */}
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

                {/* Service panels - kept mounted for Vagaro persistence */}
                {servicePanels.map(panel => {
                  const isExpanded = panel.state === 'expanded';

                  return (
                    <div
                      key={panel.id}
                      style={{ display: isExpanded ? 'block' : 'none' }}
                    >
                      <BottomSheetFrame panel={panel} fullWidthContent={false}>
                        <PanelContent panel={panel} />
                      </BottomSheetFrame>
                    </div>
                  );
                })}

                {/* Vagaro widget panels - kept mounted for persistence */}
                {persistedVagaroPanels.map(persistedPanel => {
                  const currentPanel = state.panels.find(p => p.id === persistedPanel.id);
                  const isExpanded = currentPanel?.state === 'expanded';
                  const isInStack = currentPanel !== undefined;

                  if (!isInStack) return null;

                  return (
                    <div
                      key={persistedPanel.id}
                      style={{ display: isExpanded ? 'block' : 'none' }}
                    >
                      <BottomSheetFrame panel={currentPanel || persistedPanel} fullWidthContent={true}>
                        <PanelContent panel={currentPanel || persistedPanel} />
                      </BottomSheetFrame>
                    </div>
                  );
                })}

                {/* Bottom safe area padding */}
                <div className="h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
