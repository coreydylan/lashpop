'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, X } from 'lucide-react';
import { usePanelStack } from '@/contexts/PanelStackContext';
import type { Panel } from '@/types/panel-stack';

interface BottomSheetFrameProps {
  panel: Panel;
  children: React.ReactNode;
}

export function BottomSheetFrame({ panel, children }: BottomSheetFrameProps) {
  const { actions } = usePanelStack();
  const isExpanded = panel.state === 'expanded';
  const isDocked = panel.state === 'docked';

  const handleHeaderClick = () => {
    if (isDocked) {
      actions.expandPanel(panel.id);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.closePanel(panel.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.togglePanel(panel.id);
  };

  // Get display title based on panel type
  const getTitle = () => {
    if (panel.type === 'category-picker') {
      return 'Browse Services';
    }
    if (panel.type === 'service-panel') {
      return panel.data.categoryName || 'Services';
    }
    if (panel.type === 'discovery') {
      return 'Discover';
    }
    return 'Panel';
  };

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
      className="border-b border-sage/10 last:border-b-0"
    >
      {/* Collapsible Header */}
      <div
        className={`
          flex items-center justify-between px-4 py-3
          transition-colors
          ${isDocked ? 'cursor-pointer active:bg-sage/5' : 'bg-cream/50'}
        `}
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Expand/Collapse indicator */}
          <motion.button
            onClick={handleToggle}
            className="p-1 -ml-1 rounded-full hover:bg-sage/10 transition-colors"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp className="w-5 h-5 text-sage" />
          </motion.button>

          {/* Title & Summary */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-dune truncate">
              {getTitle()}
            </p>
            {isDocked && panel.summary && (
              <p className="text-xs text-sage truncate mt-0.5">
                {panel.summary}
              </p>
            )}
          </div>

          {/* Badge */}
          {panel.badge && (
            <span className="px-2 py-0.5 rounded-full bg-dusty-rose text-white text-[10px] font-semibold flex-shrink-0 uppercase">
              {typeof panel.badge === 'number' ? panel.badge : panel.badge}
            </span>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="p-2 -mr-2 text-sage hover:text-dune hover:bg-sage/10 rounded-full transition-colors"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
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
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
