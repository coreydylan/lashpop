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
 * BottomSheetFrame - Mobile-first panel wrapper
 *
 * This is now a minimal wrapper that provides:
 * - Entry/exit animations
 * - Full-bleed content layout by default
 *
 * The header chrome is handled by the child components (PanelWrapper)
 * to avoid double-header issues on mobile.
 */
export function BottomSheetFrame({ panel, children, fullWidthContent = false }: BottomSheetFrameProps) {
  const isExpanded = panel.state === 'expanded';
  const isDocked = panel.state === 'docked';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className={isDocked ? '' : ''}
    >
      {/* Content - children handle their own headers */}
      <AnimatePresence initial={false}>
        {(isExpanded || isDocked) && (
          <motion.div
            initial={isExpanded ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              opacity: { duration: 0.15 },
            }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
