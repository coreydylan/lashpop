'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { X, Minus } from 'lucide-react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onDock?: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  isDocked?: boolean;
  onExpand?: () => void;
  className?: string;
  zIndex?: number;
}

const DOCK_HEIGHT = 72;
const EXPANDED_HEIGHT_RATIO = 0.85; // 85% of viewport
const DRAG_THRESHOLD = 50;

export function MobileBottomSheet({
  isOpen,
  onClose,
  onDock,
  title,
  subtitle,
  children,
  isDocked = false,
  onExpand,
  className = '',
  zIndex = 50,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Update viewport height
  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const expandedHeight = viewportHeight * EXPANDED_HEIGHT_RATIO;

  // Animate to correct state when isDocked changes
  useEffect(() => {
    if (!isOpen) return;

    if (isDocked) {
      controls.start({
        y: viewportHeight - DOCK_HEIGHT,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
      });
    } else {
      controls.start({
        y: viewportHeight - expandedHeight,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
      });
    }
  }, [isDocked, isOpen, viewportHeight, expandedHeight, controls]);

  // Handle drag end
  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      setIsDragging(false);
      const { velocity, offset } = info;

      // Determine action based on drag direction and velocity
      if (offset.y > DRAG_THRESHOLD || velocity.y > 500) {
        // Dragging down
        if (isDocked) {
          // Close the sheet
          onClose();
        } else {
          // Dock the sheet
          onDock?.();
        }
      } else if (offset.y < -DRAG_THRESHOLD || velocity.y < -500) {
        // Dragging up - expand if docked
        if (isDocked) {
          onExpand?.();
        }
      } else {
        // Return to current state
        if (isDocked) {
          controls.start({
            y: viewportHeight - DOCK_HEIGHT,
            transition: { type: 'spring', stiffness: 300, damping: 30 },
          });
        } else {
          controls.start({
            y: viewportHeight - expandedHeight,
            transition: { type: 'spring', stiffness: 300, damping: 30 },
          });
        }
      }
    },
    [isDocked, onClose, onDock, onExpand, viewportHeight, expandedHeight, controls]
  );

  // Handle tap on docked state to expand
  const handleDockedTap = () => {
    if (isDocked && onExpand) {
      onExpand();
    }
  };

  if (!isOpen || viewportHeight === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isDocked ? 0 : 0.3 }}
            exit={{ opacity: 0 }}
            onClick={isDocked ? undefined : onDock}
            className="fixed inset-0 bg-black"
            style={{ zIndex: zIndex - 1, pointerEvents: isDocked ? 'none' : 'auto' }}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: viewportHeight }}
            animate={controls}
            exit={{ y: viewportHeight }}
            drag="y"
            dragConstraints={{
              top: viewportHeight - expandedHeight,
              bottom: viewportHeight,
            }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className={`fixed left-0 right-0 bg-cream rounded-t-3xl shadow-2xl ${className}`}
            style={{
              zIndex,
              height: expandedHeight,
              touchAction: 'none',
            }}
          >
            {/* Drag Handle */}
            <div
              className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onClick={handleDockedTap}
            >
              <div className="w-10 h-1 bg-sage/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-sage/10">
              <div className="flex-1 min-w-0">
                {title && (
                  <h3 className="font-serif text-base font-medium text-dune truncate">
                    {title}
                  </h3>
                )}
                {subtitle && !isDocked && (
                  <p className="text-xs text-sage truncate">{subtitle}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Dock button (when expanded) */}
                {!isDocked && onDock && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDock();
                    }}
                    className="p-2 rounded-full hover:bg-sage/10 transition-colors"
                    aria-label="Minimize"
                  >
                    <Minus className="w-5 h-5 text-sage" />
                  </motion.button>
                )}

                {/* Close button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-2 rounded-full hover:bg-sage/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-sage" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div
              className={`
                overflow-y-auto overscroll-contain px-5 py-4
                transition-opacity duration-200
                ${isDocked ? 'opacity-0 pointer-events-none' : 'opacity-100'}
              `}
              style={{
                maxHeight: expandedHeight - 80, // Account for header and handle
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
