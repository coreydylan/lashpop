'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useCascadingPanels } from '@/contexts/CascadingPanelContext';
import type { PanelStackItem } from '@/types/cascading-panels';

interface PanelWrapperProps {
  panel: PanelStackItem;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showCollapseToggle?: boolean;
}

export function PanelWrapper({
  panel,
  children,
  title,
  subtitle,
  showCollapseToggle = false,
}: PanelWrapperProps) {
  const { actions } = useCascadingPanels();

  const handleClose = () => {
    actions.closePanel(panel.id, true);
  };

  const handleToggleCollapse = () => {
    if (panel.isCollapsed) {
      actions.expandPanel(panel.id);
    } else {
      actions.collapsePanel(panel.id);
    }
  };

  return (
    <AnimatePresence>
      {!panel.isClosing && (
        <motion.div
          id={panel.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
            delay: panel.position * 0.05, // Stagger delay
          }}
          className="w-full mb-4"
        >
          <div className="glass rounded-2xl overflow-hidden shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sage/10 bg-gradient-to-r from-warm-sand/10 to-transparent">
              <div className="flex-1">
                {title && (
                  <h3 className="font-serif text-xl text-dune font-medium">{title}</h3>
                )}
                {subtitle && (
                  <p className="text-sm text-sage mt-1">{subtitle}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {showCollapseToggle && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleCollapse}
                    className="p-2 rounded-full hover:bg-sage/10 transition-colors"
                    aria-label={panel.isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {panel.isCollapsed ? (
                      <ChevronDown className="w-5 h-5 text-sage" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-sage" />
                    )}
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-sage/10 transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5 text-sage" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence>
              {!panel.isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6">
                    {children}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
