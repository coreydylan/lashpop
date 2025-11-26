'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { HEADER_HEIGHT } from '@/types/panel-stack';

// Import panel components
import { CategoryPickerPanel } from '../panels/CategoryPickerPanel';
import { ServicePanel } from '../panels/ServicePanel';
import { DiscoveryPanel } from '../panels/DiscoveryPanel';
import { VagaroWidgetPanel } from '../panels/VagaroWidgetPanel';

export function TopPanelContainer() {
  const { state } = usePanelStack();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  if (sortedPanels.length === 0) {
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
      <AnimatePresence mode="popLayout">
        {sortedPanels.map(panel => (
          <div key={panel.id}>
            {panel.type === 'category-picker' && <CategoryPickerPanel panel={panel} />}
            {panel.type === 'discovery' && <DiscoveryPanel panel={panel} />}
            {panel.type === 'service-panel' && <ServicePanel panel={panel} />}
            {panel.type === 'vagaro-widget' && <VagaroWidgetPanel panel={panel} />}
          </div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
