'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { usePanelStack } from '@/contexts/PanelStackContext';
import type { Panel } from '@/types/panel-stack';

interface TopPanelFrameProps {
  panel: Panel;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function TopPanelFrame({
  panel,
  children,
  title,
  subtitle,
}: TopPanelFrameProps) {
  const { actions } = usePanelStack();
  const isExpanded = panel.state === 'expanded';
  const isDocked = panel.state === 'docked';

  const handleToggle = () => {
    actions.togglePanel(panel.id);
  };

  const handleClose = () => {
    actions.closePanel(panel.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="w-full border-b border-sage/10"
      style={{
        zIndex: 50 - panel.level,
      }}
    >
      {/* Docked Header */}
      <div
        className={`
          flex items-center justify-between px-4 md:px-6 bg-cream/95 backdrop-blur-md
          transition-all cursor-pointer
          ${isDocked ? 'h-8 md:h-12 hover:bg-warm-sand/5' : 'h-12 md:h-14'}
          ${isExpanded ? 'border-b border-dusty-rose/20' : ''}
        `}
        onClick={isDocked ? handleToggle : undefined}
      >
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {/* Title */}
          {title && (
            <h3 className={`
              font-serif text-dune font-medium truncate
              ${isDocked ? 'text-sm md:text-base' : 'text-base md:text-lg'}
            `}>
              {title}
            </h3>
          )}

          {/* Summary (when docked) */}
          {isDocked && panel.summary && (
            <span className="text-xs md:text-sm text-sage truncate hidden sm:inline">
              · {panel.summary}
            </span>
          )}

          {/* Badge */}
          {panel.badge && (
            <span className="px-2 py-0.5 rounded-full bg-dusty-rose text-white text-xs font-semibold">
              {typeof panel.badge === 'number' ? panel.badge : panel.badge.toUpperCase()}
            </span>
          )}

          {/* Subtitle (when expanded) */}
          {isExpanded && subtitle && (
            <span className="text-xs md:text-sm text-sage truncate hidden md:inline">
              {subtitle}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {/* Toggle button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggle}
            className="p-1.5 md:p-2 rounded-full hover:bg-sage/10 transition-colors"
            aria-label={isExpanded ? 'Dock panel' : 'Expand panel'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-sage" />
            ) : (
              <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-sage" />
            )}
          </motion.button>

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="p-1.5 md:p-2 rounded-full hover:bg-sage/10 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4 md:w-5 md:h-5 text-sage" />
          </motion.button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 25,
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden"
          >
            <div
              className="
                bg-cream overflow-y-auto overscroll-contain
                max-h-[80vh] md:max-h-[60vh]
                px-4 py-4 md:px-6 md:py-6
              "
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
