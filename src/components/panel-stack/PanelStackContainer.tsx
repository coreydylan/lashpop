'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { HEADER_HEIGHT } from '@/types/panel-stack';
import { MobileBottomSheet } from './MobileBottomSheet';

// Import panel components
import { CategoryPickerPanel } from './panels/CategoryPickerPanel';
import { ServicePanel } from './panels/ServicePanel';
import { DiscoveryPanel } from './panels/DiscoveryPanel';

// Panel title mapping
const getPanelTitle = (type: string, data?: any): string => {
  switch (type) {
    case 'category-picker':
      return 'Choose a Service';
    case 'discovery':
      return 'Discover Your Look';
    case 'service-panel':
      return data?.categoryName || 'Services';
    case 'service-detail':
      return data?.serviceName || 'Service Details';
    case 'schedule':
      return 'Book Appointment';
    default:
      return 'Panel';
  }
};

export function PanelStackContainer() {
  const { state, actions } = usePanelStack();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle visibility based on scroll position or panel state
  useEffect(() => {
    // On mobile, always show if there are panels
    if (isMobile) {
      setIsVisible(state.panels.some(p => p.state !== 'closed'));
      return;
    }

    // On desktop, use scroll position
    const handleScroll = () => {
      // Show when scrolled past hero (approx 80vh)
      const showThreshold = window.innerHeight * 0.8;
      setIsVisible(window.scrollY > showThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, state.panels]);

  // Calculate total height (no longer adding padding to page content)
  useEffect(() => {
    if (!containerRef.current || isMobile) return;

    const updateHeight = () => {
      const height = containerRef.current?.offsetHeight || 0;
      // Set CSS variable for potential future use, but don't add padding
      document.documentElement.style.setProperty('--panel-stack-height', `${height}px`);
    };

    updateHeight();

    // Watch for height changes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [state.panels, isMobile]);

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

  // Render panel content based on type
  const renderPanelContent = (panel: typeof sortedPanels[0]) => {
    switch (panel.type) {
      case 'category-picker':
        return <CategoryPickerPanel panel={panel} />;
      case 'discovery':
        return <DiscoveryPanel panel={panel} />;
      case 'service-panel':
        return <ServicePanel panel={panel} />;
      default:
        return null;
    }
  };

  // Mobile: Render as bottom sheets
  if (isMobile) {
    return (
      <>
        {sortedPanels.map((panel, index) => (
          <MobileBottomSheet
            key={panel.id}
            isOpen={panel.state !== 'closed'}
            isDocked={panel.state === 'docked'}
            onClose={() => actions.closePanel(panel.id)}
            onDock={() => actions.dockPanel(panel.id)}
            onExpand={() => actions.expandPanel(panel.id)}
            title={getPanelTitle(panel.type, panel.data)}
            subtitle={panel.summary}
            zIndex={50 + index}
          >
            {renderPanelContent(panel)}
          </MobileBottomSheet>
        ))}
      </>
    );
  }

  // Desktop: Render as top-down panel stack
  return (
    <motion.div
      ref={containerRef}
      className="fixed left-0 right-0 z-30 bg-cream shadow-lg top-[80px]"
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
            {renderPanelContent(panel)}
          </div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
