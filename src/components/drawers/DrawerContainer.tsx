"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { useDrawer, DrawerName, DrawerState } from './DrawerContext';

interface DrawerContainerProps {
  name: DrawerName;
  title: string;
  children: React.ReactNode;
  dockedContent?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const drawerVariants: Variants = {
  invisible: {
    y: '-120%',
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  docked: {
    y: 0,
    opacity: 1,
    scale: 1,
    height: '72px',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  expanded: {
    y: 0,
    opacity: 1,
    scale: 1,
    height: 'auto',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function DrawerContainer({
  name,
  title,
  children,
  dockedContent,
  className = '',
  icon = <Sparkles className="w-5 h-5" />,
}: DrawerContainerProps) {
  const { drawerStates, toggleDrawer, minimizeDrawer, expandDrawer } = useDrawer();
  const currentState = drawerStates[name];
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate z-index based on drawer order and state
  const getZIndex = () => {
    if (currentState === 'invisible') return -1;
    if (currentState === 'expanded') return 50;
    return name === 'discover' ? 40 : 39;
  };

  // Calculate top position for stacking docked drawers
  const getTopPosition = () => {
    // Header height
    let top = 80; // Adjusted for new header design

    // If this is services drawer and discover is docked, add discover height
    if (name === 'services' && drawerStates.discover === 'docked') {
      top += 72; // Height of docked drawer
    }

    return `${top}px`;
  };

  // Focus management
  useEffect(() => {
    if (currentState === 'expanded' && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [currentState]);

  if (currentState === 'invisible') return null;

  return (
    <AnimatePresence mode="sync">
      <motion.div
        ref={containerRef}
        className={`fixed left-0 right-0 ${
          currentState === 'expanded'
            ? 'glass shadow-2xl'
            : 'bg-cream/95 backdrop-blur-md shadow-lg'
        } overflow-hidden ${className}`}
        style={{
          zIndex: getZIndex(),
          top: currentState === 'invisible' ? '-100%' : getTopPosition(),
          maxHeight: currentState === 'expanded' ? '85vh' : '72px',
          borderRadius: currentState === 'expanded' ? '0 0 24px 24px' : '0',
        }}
        variants={drawerVariants}
        initial="invisible"
        animate={currentState}
        exit="invisible"
        role="dialog"
        aria-label={title}
        aria-modal={currentState === 'expanded'}
      >
        {currentState === 'docked' ? (
          // Docked State - Minimal and Beautiful
          <motion.div
            className="h-full px-8 py-4 cursor-pointer group"
            onClick={() => expandDrawer(name)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-between h-full">
              {dockedContent || (
                <div className="flex items-center gap-4">
                  <div className="text-dusty-rose">{icon}</div>
                  <div>
                    <p className="caption text-dune/60">Click to expand</p>
                    <p className="font-light text-lg text-dune">{title}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-[2px] bg-sage/30 group-hover:bg-dusty-rose/50 transition-colors" />
                <div className="w-2 h-2 rounded-full bg-sage/30 group-hover:bg-dusty-rose/50 transition-colors" />
              </div>
            </div>
          </motion.div>
        ) : (
          // Expanded State - Full Content
          <>
            {/* Beautiful Header */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-warm-sand/30 via-transparent to-dusty-rose/20" />
              <div className="relative flex items-center justify-between px-8 py-6 border-b border-sage/10">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="text-dusty-rose"
                  >
                    {icon}
                  </motion.div>
                  <div>
                    <h2 className="h3 text-dune">{title}</h2>
                    <p className="caption text-sage mt-1">
                      {name === 'discover' ? 'Find your perfect style' : 'Browse our services'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => minimizeDrawer(name)}
                    className="p-2.5 rounded-full hover:bg-sage/10 transition-all group"
                    aria-label="Minimize drawer"
                  >
                    <Minimize2 className="w-5 h-5 text-sage group-hover:text-dusty-rose transition-colors" />
                  </button>
                  <button
                    onClick={() => toggleDrawer(name)}
                    className="p-2.5 rounded-full hover:bg-sage/10 transition-all group"
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5 text-sage group-hover:text-dusty-rose transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content with Beautiful Scrollbar */}
            <div
              className="drawer-content overflow-y-auto px-8 py-8"
              style={{
                maxHeight: 'calc(85vh - 100px)',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(161, 151, 129, 0.3) transparent',
              }}
            >
              {children}
            </div>

            {/* Decorative Bottom Border */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sage/20 to-transparent" />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}