'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
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
  collapsed: 92,    // Compact chip bar at bottom (~8% = ~64px visible)
  fullScreen: 5,    // Full takeover (leaves status bar)
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
 * - fullScreen: Full viewport content display
 *
 * Behaviors:
 * - Tap category chip → fullScreen with ServicePanel
 * - Tap Discover chip → fullScreen with DiscoveryPanel
 * - Swipe up (only after first interaction) → fullScreen
 * - Swipe down / tap minimize → collapsed
 * - Close all → hidden
 */
export function BottomSheetContainer() {
  const { state, actions } = usePanelStack();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>('hidden');
  const [isDragging, setIsDragging] = useState(false);
  const [contentAtTop, setContentAtTop] = useState(true);
  const dragStartY = useRef(0);

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
  const animateToSnap = useCallback((snap: SnapPoint) => {
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    controls.start({
      y: `${SNAP_POINTS[snap]}%`,
      transition: springConfig,
    });
    setCurrentSnap(snap);
  }, [controls]);

  // Handle content scroll
  const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setContentAtTop(scrollTop <= 0);
  }, []);

  // Reset scroll tracking on snap change
  useEffect(() => {
    if (currentSnap === 'collapsed' || currentSnap === 'hidden') {
      setContentAtTop(true);
    }
  }, [currentSnap]);

  // Sync snap point with panel state
  useEffect(() => {
    if (!hasAnyPanel) {
      animateToSnap('hidden');
    } else if (hasExpandedPanel) {
      // Has expanded panel → fullScreen
      animateToSnap('fullScreen');
    } else {
      // Has panels but none expanded → collapsed (chip bar)
      animateToSnap('collapsed');
    }
  }, [hasAnyPanel, hasExpandedPanel, animateToSnap]);

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasAnyPanel) {
        e.preventDefault();
        if (currentSnap === 'fullScreen') {
          // Go to collapsed
          animateToSnap('collapsed');
          actions.dockAll();
        } else if (currentSnap === 'collapsed') {
          // Close all
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

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
    dragStartY.current = SNAP_POINTS[currentSnap];
  };

  // Handle drag end
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    const velocity = info.velocity.y;
    const containerHeight = window.innerHeight;
    const dragDistance = info.offset.y;
    const dragPercentage = (dragDistance / containerHeight) * 100;
    const currentPercentage = dragStartY.current + dragPercentage;

    // Fast swipe down → collapse or close
    if (velocity > 500) {
      if (currentSnap === 'fullScreen') {
        animateToSnap('collapsed');
        actions.dockAll();
      } else {
        animateToSnap('hidden');
        actions.closeAll();
      }
      return;
    }

    // Fast swipe up → expand (only if user has interacted)
    if (velocity < -500 && state.hasUserInteracted) {
      if (currentSnap === 'collapsed') {
        animateToSnap('fullScreen');
        // Expand first docked panel
        const firstPanel = sortedPanels.find(p => p.state === 'docked');
        if (firstPanel) {
          actions.expandPanel(firstPanel.id);
        }
      }
      return;
    }

    // Slow drag - snap based on position
    if (currentPercentage > 95) {
      animateToSnap('hidden');
      actions.closeAll();
    } else if (currentPercentage > 50) {
      animateToSnap('collapsed');
      actions.dockAll();
    } else {
      animateToSnap('fullScreen');
    }
  };

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (currentSnap === 'fullScreen') {
      animateToSnap('collapsed');
      actions.dockAll();
    }
  };

  // Lock body scroll when sheet is expanded
  useEffect(() => {
    if (hasAnyPanel && currentSnap === 'fullScreen') {
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

  // Handle category selection from chip bar
  const handleCategorySelect = useCallback((category: Category) => {
    // Mark user as having interacted
    actions.setUserInteracted();

    const isSelected = state.categorySelections.some(c => c.categoryId === category.id);

    if (isSelected) {
      // Deselect: close the service panel
      actions.deselectCategory(category.id);
      const servicePanel = state.panels.find(
        p => p.type === 'service-panel' && p.data.categoryId === category.id
      );
      if (servicePanel) {
        actions.closePanel(servicePanel.id);
      }
    } else {
      // Select: open service panel and expand
      actions.selectCategory(category.id, category.name);

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
  }, [state.categorySelections, state.panels, state.services, actions, getSubcategories]);

  // Handle Discover selection
  const handleDiscoverSelect = useCallback(() => {
    // Mark user as having interacted
    actions.setUserInteracted();

    // Check if discovery panel already exists
    const existingDiscovery = state.panels.find(p => p.type === 'discovery');

    if (existingDiscovery) {
      // Expand existing
      actions.expandPanel(existingDiscovery.id);
    } else {
      // Open new discovery panel
      actions.openPanel(
        'discovery',
        { entryPoint: 'chip-bar' },
        { autoExpand: true, scrollToTop: true }
      );
    }
  }, [state.panels, actions]);

  // Handle close all
  const handleClose = useCallback(() => {
    animateToSnap('hidden');
    actions.closeAll();
  }, [animateToSnap, actions]);

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
        className={`
          fixed inset-x-0 bottom-0 z-50 bg-cream will-change-transform
          ${currentSnap === 'fullScreen' ? 'rounded-t-[20px] shadow-2xl' : 'shadow-lg'}
        `}
        style={{
          height: '100dvh',
          touchAction: 'none',
        }}
        initial={{ y: '100%' }}
        animate={controls}
        drag={currentSnap === 'fullScreen' || (currentSnap === 'collapsed' && state.hasUserInteracted) ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.3 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Collapsed State: Chip Bar */}
        <AnimatePresence mode="wait">
          {currentSnap === 'collapsed' && hasCategoryPicker && (
            <motion.div
              key="chip-bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CollapsedChipBar
                onCategorySelect={handleCategorySelect}
                onDiscoverSelect={handleDiscoverSelect}
                showDragIndicator={state.hasUserInteracted}
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
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* Drag Handle */}
              <div
                className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
              >
                <motion.div
                  className="w-10 h-1 bg-sage/40 rounded-full"
                  animate={{
                    width: isDragging ? 48 : 40,
                    backgroundColor: isDragging ? 'rgba(161, 151, 129, 0.6)' : 'rgba(161, 151, 129, 0.4)',
                  }}
                  transition={{ duration: 0.15 }}
                />
              </div>

              {/* Panel Content */}
              <div
                ref={contentRef}
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{
                  touchAction: contentAtTop ? 'none' : 'pan-y',
                  overscrollBehavior: 'contain',
                }}
                onScroll={handleContentScroll}
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
                <div className="h-20 bg-cream" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Minimize Button - fullScreen only */}
      <AnimatePresence>
        {currentSnap === 'fullScreen' && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ delay: 0.8, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={() => {
              animateToSnap('collapsed');
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
