'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { HEADER_HEIGHT } from '@/types/panel-stack';

// Import panel components
import { CategoryPickerPanel } from './panels/CategoryPickerPanel';
import { ServicePanel } from './panels/ServicePanel';
import { DiscoveryPanel } from './panels/DiscoveryPanel';

export function PanelStackContainer() {
  const { state } = usePanelStack();
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate total height (no longer adding padding to page content)
  useEffect(() => {
    if (!containerRef.current) return;

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
    <div
      ref={containerRef}
      className="fixed left-0 right-0 z-40 bg-cream shadow-lg"
      style={{ top: `${HEADER_HEIGHT}px` }}
    >
      <AnimatePresence mode="popLayout">
        {sortedPanels.map(panel => (
          <div key={panel.id}>
            {panel.type === 'category-picker' && <CategoryPickerPanel panel={panel} />}
            {panel.type === 'discovery' && <DiscoveryPanel panel={panel} />}
            {panel.type === 'service-panel' && <ServicePanel panel={panel} />}
            {/* ServicePanel now handles service details internally */}
            {/* Schedule panel will be added later */}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
