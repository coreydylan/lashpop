'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCascadingPanels } from '@/contexts/CascadingPanelContext';
import { useBookingOrchestrator } from '@/contexts/BookingOrchestratorContext';
import { BookNowPanel } from './panels/BookNowPanel';
import { CategoryPickerPanel } from './panels/CategoryPickerPanel';
import { SubcategoryServicePanel } from './panels/SubcategoryServicePanel';
import { ServiceDetailPanel } from './panels/ServiceDetailPanel';

export function CascadingPanelContainer() {
  const { state } = useCascadingPanels();
  const orchestrator = useBookingOrchestrator();
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate available height based on drawer positions (drawer-aware)
  const availableHeight = orchestrator.state.viewport.availableHeight;
  const topOffset = orchestrator.state.viewport.topOffset;

  useEffect(() => {
    // Update viewport dimensions when drawers change
    orchestrator.actions.updateViewportDimensions();
  }, [orchestrator.actions]);

  if (state.panels.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 pointer-events-none"
        style={{ top: `${topOffset}px` }}
      >
        {/* Background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-dune/20 backdrop-blur-sm pointer-events-auto"
          onClick={() => {
            // Click outside closes all panels
            // Optionally implement
          }}
        />

        {/* Scrollable panel container */}
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-y-auto pointer-events-auto px-4 py-8"
          style={{
            maxHeight: `${availableHeight}px`,
          }}
        >
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Render panels by level for proper ordering */}
            {[1, 2, 3, 4].map(level => (
              <React.Fragment key={level}>
                {state.panels
                  .filter(panel => panel.level === level)
                  .sort((a, b) => a.position - b.position)
                  .map(panel => (
                    <div key={panel.id}>
                      {panel.type === 'book-now' && <BookNowPanel panel={panel} />}
                      {panel.type === 'category-picker' && <CategoryPickerPanel panel={panel} />}
                      {panel.type === 'subcategory-services' && <SubcategoryServicePanel panel={panel} />}
                      {panel.type === 'service-detail' && <ServiceDetailPanel panel={panel} />}
                    </div>
                  ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
