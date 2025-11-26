'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePanelStack } from '@/contexts/PanelStackContext';
import type { Panel, BreadcrumbStep } from '@/types/panel-stack';

interface PanelWrapperProps {
  panel: Panel;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  fullWidthContent?: boolean;
  onBreadcrumbClick?: (stepId: string) => void;
}

/**
 * PanelWrapper - Responsive panel header and content wrapper
 *
 * Mobile (< md): Simplified centered header with back arrow
 * Desktop (>= md): Original left-aligned breadcrumb navigation
 */
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

  // Get the previous breadcrumb for back navigation (mobile)
  const previousCrumb = hasBreadcrumbs
    ? panel.breadcrumbs![panel.breadcrumbs!.length - 2]
    : null;

  // Get current title from last breadcrumb or fallback to title prop
  const currentTitle = hasBreadcrumbs
    ? panel.breadcrumbs![panel.breadcrumbs!.length - 1].label
    : title;

  const handleToggle = () => {
    actions.togglePanel(panel.id);
  };

  const handleClose = () => {
    actions.closePanel(panel.id);
  };

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previousCrumb && onBreadcrumbClick) {
      onBreadcrumbClick(previousCrumb.id);
    }
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
      className="w-full md:border-b md:border-sage/10"
      style={{
        zIndex: 50 - panel.level,
      }}
    >
      {/* ===== MOBILE HEADER (< md) ===== */}
      <div
        className={`
          md:hidden flex items-center bg-cream/95 backdrop-blur-md transition-all
          ${isDocked
            ? 'h-12 cursor-pointer active:bg-warm-sand/5'
            : 'h-14 border-b border-sage/10'
          }
        `}
        onClick={isDocked ? handleToggle : undefined}
      >
        {/* Left: Back button or Toggle */}
        <div className="flex-shrink-0 w-12 flex items-center justify-center">
          {isExpanded && previousCrumb && onBreadcrumbClick ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-sage/10 transition-colors"
              aria-label={`Back to ${previousCrumb.label}`}
            >
              <ChevronLeft className="w-6 h-6 text-sage" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-sage/10 transition-colors"
              aria-label={isExpanded ? 'Minimize panel' : 'Expand panel'}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-sage" />
              ) : (
                <ChevronUp className="w-5 h-5 text-sage" />
              )}
            </motion.button>
          )}
        </div>

        {/* Center: Title and Subtitle */}
        <div className="flex-1 min-w-0 text-center px-2">
          {isDocked ? (
            <p className="text-sm text-dune truncate">
              {currentTitle}
              {panel.summary && (
                <span className="text-sage ml-1">· {panel.summary}</span>
              )}
            </p>
          ) : (
            <>
              <h3 className="font-serif text-base font-medium text-dune truncate">
                {currentTitle}
              </h3>
              {subtitle && (
                <p className="text-xs text-sage truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </>
          )}

          {isDocked && panel.badge && (
            <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-dusty-rose text-white text-[10px] font-semibold uppercase">
              {typeof panel.badge === 'number' ? panel.badge : panel.badge}
            </span>
          )}
        </div>

        {/* Right: Close button */}
        <div className="flex-shrink-0 w-12 flex items-center justify-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-sage/10 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5 text-sage" />
          </motion.button>
        </div>
      </div>

      {/* ===== DESKTOP HEADER (>= md) ===== */}
      <div
        className={`
          hidden md:flex items-center justify-between px-6 bg-cream/95 backdrop-blur-md
          transition-all cursor-pointer
          ${isDocked ? 'h-12 hover:bg-warm-sand/5' : 'h-14'}
          ${isExpanded ? 'border-b border-dusty-rose/20' : ''}
        `}
        onClick={isDocked ? handleToggle : undefined}
      >
        <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
          {/* Breadcrumbs (when available and expanded) */}
          {hasBreadcrumbs && isExpanded ? (
            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto scrollbar-hide">
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
                        ${isDocked ? 'text-sm' : 'text-base'}
                        ${isLast
                          ? 'text-dune font-medium cursor-default'
                          : 'text-sage hover:text-dusty-rose cursor-pointer'
                        }
                      `}
                    >
                      {crumb.label}
                    </button>
                    {!isLast && (
                      <ChevronRight className="w-4 h-4 text-sage/50 flex-shrink-0" />
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
                  ${isDocked ? 'text-base' : 'text-lg'}
                `}>
                  {title}
                </h3>
              )}

              {/* Summary (when docked) */}
              {isDocked && panel.summary && (
                <span className="text-sm text-sage truncate">
                  · {panel.summary}
                </span>
              )}
            </>
          )}

          {/* Breadcrumb summary when docked with breadcrumbs */}
          {hasBreadcrumbs && isDocked && (
            <span className="text-sm text-sage truncate">
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
            <span className="text-sm text-sage truncate">
              {subtitle}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggle}
            className="p-2 rounded-full hover:bg-sage/10 transition-colors"
            aria-label={isExpanded ? 'Dock panel' : 'Expand panel'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-sage" />
            ) : (
              <ChevronDown className="w-5 h-5 text-sage" />
            )}
          </motion.button>

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
                bg-cream overscroll-contain overflow-y-auto overflow-x-hidden
                max-h-[75vh] md:max-h-[60vh]
                ${fullWidthContent ? '' : 'pt-4 md:px-6 md:py-6'}
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
