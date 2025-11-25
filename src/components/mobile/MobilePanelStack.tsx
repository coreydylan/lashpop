'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { MobileBottomSheet, SheetState } from './MobileBottomSheet';
import type { Panel } from '@/types/panel-stack';

// Import panel content components
import { CategoryPickerPanel } from '@/components/panel-stack/panels/CategoryPickerPanel';
import { ServicePanel } from '@/components/panel-stack/panels/ServicePanel';
import { DiscoveryPanel } from '@/components/panel-stack/panels/DiscoveryPanel';

/**
 * Mobile Panel Stack
 *
 * Converts the desktop panel stack system into mobile bottom sheets.
 * Each panel type maps to a bottom sheet with appropriate configuration.
 *
 * UX Justification:
 * - Bottom sheets are the native mobile pattern for secondary content
 * - Maintains same panel hierarchy and data flow as desktop
 * - Gesture-based interactions feel natural on touch devices
 * - Peeked state allows users to see summary without full expansion
 */
export function MobilePanelStack() {
  const { state, actions } = usePanelStack();
  const [sheetStates, setSheetStates] = useState<Record<string, SheetState>>({});

  // Get sorted panels (same as desktop container)
  const sortedPanels = useMemo(() => {
    return [...state.panels]
      .filter(p => p.state !== 'closed')
      .sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.position - b.position;
      });
  }, [state.panels]);

  // Initialize sheet states for new panels
  useEffect(() => {
    sortedPanels.forEach(panel => {
      if (!(panel.id in sheetStates)) {
        // New panel - set initial state based on panel state
        setSheetStates(prev => ({
          ...prev,
          [panel.id]: panel.state === 'expanded' ? 'expanded' : 'peeked'
        }));
      }
    });

    // Cleanup removed panels
    Object.keys(sheetStates).forEach(panelId => {
      if (!sortedPanels.find(p => p.id === panelId)) {
        setSheetStates(prev => {
          const next = { ...prev };
          delete next[panelId];
          return next;
        });
      }
    });
  }, [sortedPanels]);

  // Handle sheet state change
  const handleStateChange = useCallback((panelId: string, newState: SheetState) => {
    setSheetStates(prev => ({
      ...prev,
      [panelId]: newState
    }));

    // Sync with panel stack context
    if (newState === 'expanded') {
      actions.expandPanel(panelId);
    } else if (newState === 'peeked') {
      actions.dockPanel(panelId);
    }
  }, [actions]);

  // Handle sheet close
  const handleClose = useCallback((panelId: string) => {
    setSheetStates(prev => ({
      ...prev,
      [panelId]: 'closed'
    }));

    // Close in context after animation
    setTimeout(() => {
      actions.closePanel(panelId);
    }, 300);
  }, [actions]);

  // Get panel title based on type and data
  const getPanelTitle = useCallback((panel: Panel): string => {
    switch (panel.type) {
      case 'category-picker':
        return 'Browse Services';
      case 'service-panel':
        return panel.data?.categoryName || 'Services';
      case 'discovery':
        return 'Find Your Perfect Treatment';
      default:
        return 'Details';
    }
  }, []);

  // Get panel summary for peeked state
  const getPanelSummary = useCallback((panel: Panel): React.ReactNode => {
    if (panel.summary) {
      return <span>{panel.summary}</span>;
    }

    switch (panel.type) {
      case 'category-picker':
        const selectedCount = state.categorySelections.length;
        return selectedCount > 0
          ? <span>{selectedCount} {selectedCount === 1 ? 'category' : 'categories'} selected</span>
          : <span>Tap to explore our services</span>;
      case 'service-panel':
        return <span>View {panel.data?.categoryName || 'services'}</span>;
      case 'discovery':
        return <span>Take our quiz to find your perfect treatment</span>;
      default:
        return null;
    }
  }, [state.categorySelections]);

  // Render panel content based on type
  const renderPanelContent = useCallback((panel: Panel) => {
    switch (panel.type) {
      case 'category-picker':
        return <CategoryPickerPanel panel={panel} />;
      case 'service-panel':
        return <ServicePanel panel={panel} />;
      case 'discovery':
        return <DiscoveryPanel panel={panel} />;
      default:
        return <div className="p-4 text-dune/60">Unknown panel type</div>;
    }
  }, []);

  // Get z-index for each panel (stacking order)
  const getZIndex = useCallback((index: number) => {
    return 50 + index;
  }, []);

  // Only show the topmost expanded panel (or all peeked panels)
  const visiblePanels = useMemo(() => {
    // Find the topmost expanded panel
    const expandedPanels = sortedPanels.filter(p => sheetStates[p.id] === 'expanded');

    if (expandedPanels.length > 0) {
      // Show only the topmost expanded panel
      const topExpanded = expandedPanels[expandedPanels.length - 1];

      // Also show peeked panels that are below the expanded one
      const peekedBelow = sortedPanels.filter(
        p => p.level < topExpanded.level && sheetStates[p.id] === 'peeked'
      );

      return [...peekedBelow, topExpanded];
    }

    // No expanded panels - show all as peeked
    return sortedPanels;
  }, [sortedPanels, sheetStates]);

  if (sortedPanels.length === 0) {
    return null;
  }

  return (
    <div className="md:hidden">
      <AnimatePresence mode="sync">
        {visiblePanels.map((panel, index) => (
          <MobileBottomSheet
            key={panel.id}
            isOpen={sheetStates[panel.id] !== 'closed'}
            state={sheetStates[panel.id] || 'peeked'}
            onStateChange={(newState) => handleStateChange(panel.id, newState)}
            onClose={() => handleClose(panel.id)}
            title={getPanelTitle(panel)}
            summary={getPanelSummary(panel)}
            peekHeight={panel.type === 'category-picker' ? 100 : 80}
            expandedHeight={panel.type === 'category-picker' ? '90vh' : '85vh'}
            showHandle={true}
            allowPeek={true}
            zIndex={getZIndex(index)}
          >
            {renderPanelContent(panel)}
          </MobileBottomSheet>
        ))}
      </AnimatePresence>
    </div>
  );
}
