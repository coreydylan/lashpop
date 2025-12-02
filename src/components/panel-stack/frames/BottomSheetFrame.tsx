'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Panel } from '@/types/panel-stack';

interface BottomSheetFrameProps {
  panel: Panel;
  children: React.ReactNode;
  fullWidthContent?: boolean;
}

/**
 * BottomSheetFrame - Full-screen panel wrapper for mobile bottom sheet
 *
 * In the new 3-state design, this frame only renders when the sheet
 * is in fullScreen state. Content is displayed at full width.
 *
 * Features:
 * - Smooth enter/exit animations
 * - Full-bleed content layout
 * - Header chrome handled by child components (ServicePanel, DiscoveryPanel, etc.)
 */
export function BottomSheetFrame({ panel, children, fullWidthContent = false }: BottomSheetFrameProps) {
  const isExpanded = panel.state === 'expanded';

  // In the new design, we only render expanded content
  // Docked panels show in the collapsed chip bar, not here
  if (!isExpanded) {
    return null;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{
        layout: { type: 'spring', stiffness: 350, damping: 35 },
        opacity: { duration: 0.15 },
      }}
      className="min-h-0"
    >
      <AnimatePresence initial={false}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={fullWidthContent ? '' : ''}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
