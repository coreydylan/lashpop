'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePanelManager } from './PanelContext';
import ServiceDetailPanel from './ServiceDetailPanel';
import SchedulingPanel from './SchedulingPanel';

/**
 * PanelRenderer - Renders the active panel from the panel stack
 * This component should be placed at the root level of your app
 */
export function PanelRenderer() {
  const { activePanel, popPanel, clearPanels } = usePanelManager();

  if (!activePanel) {
    return null;
  }

  return (
    <AnimatePresence>
      {activePanel.type === 'service-detail' && (
        <ServiceDetailPanel
          service={activePanel.data}
          onClose={() => popPanel()}
        />
      )}

      {activePanel.type === 'scheduling' && (
        <SchedulingPanel
          service={activePanel.data.service}
          selectedProviders={activePanel.data.selectedProviders || []}
          onClose={() => clearPanels()}
          onBack={() => popPanel()}
        />
      )}

      {/* Add other panel types here as needed */}
      {/* {activePanel.type === 'provider-detail' && <ProviderDetailPanel ... />} */}
      {/* {activePanel.type === 'booking-confirmation' && <BookingConfirmationPanel ... />} */}
    </AnimatePresence>
  );
}
