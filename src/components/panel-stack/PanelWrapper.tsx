'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { usePanelStack } from '@/contexts/PanelStackContext';
import type { Panel, BreadcrumbStep } from '@/types/panel-stack';

interface PanelWrapperProps {
  panel: Panel;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  fullWidthContent?: boolean; // Remove padding from content area for full-width embeds
  onBreadcrumbClick?: (stepId: string) => void; // Handler for breadcrumb navigation
}

export function PanelWrapper({
  panel,
  children,
  title,
  subtitle,
  fullWidthContent = false,
  onBreadcrumbClick,
}: PanelWrapperProps) {
  const { actions } = usePanelStack();
  const isExpanded = panel.state === 'expanded';
  const isDocked = panel.state === 'docked';
  const hasBreadcrumbs = panel.breadcrumbs && panel.breadcrumbs.length > 1;

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
        zIndex: 50 - panel.level, // Higher levels appear "above" lower levels
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
        <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
          {/* Breadcrumbs (when available and expanded) */}
          {hasBreadcrumbs && isExpanded ? (
            <div className="flex items-center gap-1 md:gap-1.5 min-w-0 overflow-x-auto scrollbar-hide">
              {panel.breadcrumbs!.map((crumb, index) => {
                const isLast = index === panel.breadcrumbs!.length - 1;
                const isClickable = !isLast && onBreadcrumbClick;

                return (
                  <React.Fragment key={crumb.id}>
                    <button
                      onClick={(e) => {
                        if (isClickable) {
                          e.stopPropagation();
                          onBreadcrumbClick(crumb.id);
                        }
                      }}
                      disabled={isLast}
                      className={`
                        font-serif whitespace-nowrap transition-colors flex-shrink-0
                        ${isDocked ? 'text-xs md:text-sm' : 'text-sm md:text-base'}
                        ${isLast
                          ? 'text-dune font-medium cursor-default'
                          : 'text-sage hover:text-dusty-rose cursor-pointer'
                        }
                      `}
                    >
                      {crumb.label}
                    </button>
                    {!isLast && (
                      <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-sage/50 flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <>
              {/* Title (fallback when no breadcrumbs) */}
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
            </>
          )}

          {/* Breadcrumb summary when docked with breadcrumbs */}
          {hasBreadcrumbs && isDocked && (
            <span className="text-xs md:text-sm text-sage truncate">
              {panel.breadcrumbs!.map(c => c.label).join(' › ')}
            </span>
          )}

          {/* Badge */}
          {panel.badge && (
            <span className="px-2 py-0.5 rounded-full bg-dusty-rose text-white text-xs font-semibold flex-shrink-0">
              {typeof panel.badge === 'number' ? panel.badge : panel.badge.toUpperCase()}
            </span>
          )}

          {/* Subtitle (when expanded, no breadcrumbs) */}
          {isExpanded && subtitle && !hasBreadcrumbs && (
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
              className={`
                bg-cream overscroll-contain
                max-h-[80vh] md:max-h-[60vh]
                ${fullWidthContent ? 'px-0 py-0 overflow-x-hidden overflow-y-auto' : 'px-4 py-4 md:px-6 md:py-6 overflow-y-auto'}
              `}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
