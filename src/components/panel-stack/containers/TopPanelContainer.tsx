'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { HEADER_HEIGHT } from '@/types/panel-stack';
import type { Panel } from '@/types/panel-stack';

// Import panel components
import { CategoryPickerPanel } from '../panels/CategoryPickerPanel';
import { ServicePanel } from '../panels/ServicePanel';
import { DiscoveryPanel } from '../panels/DiscoveryPanel';
import { VagaroWidgetPanel } from '../panels/VagaroWidgetPanel';

/**
 * Renders a panel component based on its type.
 * Vagaro widget panels are kept mounted but hidden when docked to preserve iframe state.
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

export function TopPanelContainer() {
  const { state } = usePanelStack();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track vagaro widget panels that have been opened (for persistence)
  const [persistedVagaroPanels, setPersistedVagaroPanels] = useState<Panel[]>([]);

  // Use ref to access state without triggering effect re-runs
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track vagaro widget panels for persistence
  useEffect(() => {
    const vagaroPanels = state.panels.filter(p => p.type === 'vagaro-widget');

    setPersistedVagaroPanels(prev => {
      // Keep existing persisted panels and add new ones
      const existingIds = new Set(prev.map(p => p.id));
      const currentIds = new Set(vagaroPanels.map(p => p.id));

      // Remove panels that have been explicitly closed (not in state at all)
      const stillValid = prev.filter(p => currentIds.has(p.id));

      // Add new panels
      const newPanels = vagaroPanels.filter(p => !existingIds.has(p.id));

      return [...stillValid, ...newPanels];
    });
  }, [state.panels]);

  // Handle visibility based on panel state (priority) or scroll position
  useEffect(() => {
    const hasPanels = state.panels.some(p => p.state !== 'closed');

    // If there are panels, always show (both mobile and desktop)
    if (hasPanels) {
      setIsVisible(true);
      return;
    }

    // No panels - on mobile, hide immediately
    if (isMobile) {
      setIsVisible(false);
      return;
    }

    // No panels on desktop - use scroll position to determine visibility
    // (for potential auto-trigger features)
    const handleScroll = () => {
      const showThreshold = window.innerHeight * 0.8;
      setIsVisible(window.scrollY > showThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, state.panels]);

  // Calculate total height (set CSS variable for potential use)
  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      const height = containerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty('--panel-stack-height', `${height}px`);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [state.panels]);

  // Sort panels by level, then by position
  const sortedPanels = [...state.panels]
    .filter(p => p.state !== 'closed')
    .sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.position - b.position;
    });

  // Get non-vagaro/non-service panels for normal rendering
  // Service panels need persistence to keep Vagaro iframe state when collapsing/expanding
  const regularPanels = sortedPanels.filter(p => p.type !== 'vagaro-widget' && p.type !== 'service-panel');

  // Get service panels (need persistence for embedded Vagaro widget)
  const servicePanels = sortedPanels.filter(p => p.type === 'service-panel');

  // Get vagaro panels with their current state
  const vagaroPanels = sortedPanels.filter(p => p.type === 'vagaro-widget');

  if (sortedPanels.length === 0 && persistedVagaroPanels.length === 0) {
    return null;
  }

  return (
    <motion.div
      ref={containerRef}
      data-panel-mode="top"
      className="fixed left-0 right-0 z-30 bg-cream shadow-lg"
      style={{ top: `${HEADER_HEIGHT}px` }}
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Regular panels with AnimatePresence for enter/exit animations */}
      <AnimatePresence mode="popLayout">
        {regularPanels.map(panel => (
          <div key={panel.id}>
            <PanelContent panel={panel} />
          </div>
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
            <PanelContent panel={panel} />
          </div>
        );
      })}

      {/* Vagaro widget panels - kept mounted but hidden when docked */}
      {persistedVagaroPanels.map(persistedPanel => {
        // Find the current state of this panel
        const currentPanel = state.panels.find(p => p.id === persistedPanel.id);
        const isExpanded = currentPanel?.state === 'expanded';
        const isInStack = currentPanel !== undefined;

        // If panel is no longer in stack at all, don't render
        if (!isInStack) {
          return null;
        }

        return (
          <div
            key={persistedPanel.id}
            style={{
              // Hide but keep mounted when docked
              display: isExpanded ? 'block' : 'none',
            }}
          >
            <PanelContent panel={currentPanel || persistedPanel} />
          </div>
        );
      })}
    </motion.div>
  );
}
