'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getScroller } from '@/lib/smoothScroll';

export interface SectionConfig {
  id: string;
  label: string;
}

interface MobileSectionNavProps {
  sections: SectionConfig[];
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
}

/**
 * Mobile Section Navigation Rail
 *
 * A vertical rail of dots on the right side of the screen that:
 * - Shows current section with larger/filled dot
 * - Allows tap to jump to section
 * - Supports scrubbing (drag) to preview and jump to sections
 *
 * UX Justification:
 * - Right-side placement keeps thumb accessible on mobile
 * - Dots provide minimal visual footprint while maintaining discoverability
 * - Scrubbing allows rapid section browsing without lifting finger
 * - Labels appear on interaction to reduce visual clutter at rest
 */
export function MobileSectionNav({
  sections,
  currentSection,
  onSectionChange
}: MobileSectionNavProps) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const hideLabelsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate which section index the touch is closest to
  const getTouchSectionIndex = useCallback((touchY: number) => {
    if (!railRef.current) return 0;

    const rect = railRef.current.getBoundingClientRect();
    const relativeY = touchY - rect.top;
    const dotSpacing = rect.height / (sections.length - 1 || 1);

    // Clamp to valid index range
    const index = Math.round(relativeY / dotSpacing);
    return Math.max(0, Math.min(sections.length - 1, index));
  }, [sections.length]);

  // Scroll to a section with smooth behavior
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!element) return;

    const scroller = getScroller();
    const headerHeight = 80;

    if (scroller instanceof Window) {
      const rect = element.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - headerHeight;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    } else {
      const container = scroller as HTMLElement;
      const targetTop = (element as HTMLElement).offsetTop - headerHeight;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    }

    onSectionChange(sectionId);
  }, [onSectionChange]);

  // Handle tap on a specific dot
  const handleDotTap = useCallback((sectionId: string) => {
    if (isScrubbing) return;

    // Show labels briefly on tap
    setShowLabels(true);
    if (hideLabelsTimeoutRef.current) {
      clearTimeout(hideLabelsTimeoutRef.current);
    }
    hideLabelsTimeoutRef.current = setTimeout(() => {
      setShowLabels(false);
    }, 1500);

    scrollToSection(sectionId);
  }, [isScrubbing, scrollToSection]);

  // Touch handlers for scrubbing
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsScrubbing(true);
    setShowLabels(true);
    const touchY = e.touches[0].clientY;
    const index = getTouchSectionIndex(touchY);
    setScrubIndex(index);

    if (hideLabelsTimeoutRef.current) {
      clearTimeout(hideLabelsTimeoutRef.current);
    }
  }, [getTouchSectionIndex]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isScrubbing) return;

    const touchY = e.touches[0].clientY;
    const index = getTouchSectionIndex(touchY);

    if (index !== scrubIndex) {
      setScrubIndex(index);
      // Haptic feedback would be nice here on real devices
    }
  }, [isScrubbing, scrubIndex, getTouchSectionIndex]);

  const handleTouchEnd = useCallback(() => {
    if (scrubIndex !== null && scrubIndex >= 0 && scrubIndex < sections.length) {
      scrollToSection(sections[scrubIndex].id);
    }

    setIsScrubbing(false);
    setScrubIndex(null);

    // Hide labels after a short delay
    hideLabelsTimeoutRef.current = setTimeout(() => {
      setShowLabels(false);
    }, 800);
  }, [scrubIndex, sections, scrollToSection]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideLabelsTimeoutRef.current) {
        clearTimeout(hideLabelsTimeoutRef.current);
      }
    };
  }, []);

  // Get the active index for highlighting
  const activeIndex = sections.findIndex(s => s.id === currentSection);
  const highlightedIndex = isScrubbing ? scrubIndex : activeIndex;

  return (
    <div
      className="fixed right-3 top-1/2 -translate-y-1/2 z-50 flex items-center md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Labels container - appears to the left of dots */}
      <AnimatePresence>
        {showLabels && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-10 flex flex-col items-end"
            style={{ gap: '16px' }}
          >
            {sections.map((section, index) => (
              <motion.span
                key={section.id}
                className={`text-xs font-medium whitespace-nowrap px-2 py-1 rounded-full backdrop-blur-md transition-all duration-200 ${
                  highlightedIndex === index
                    ? 'bg-dusty-rose/90 text-cream'
                    : 'bg-cream/80 text-dune/70'
                }`}
                initial={{ opacity: 0, x: 10 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: highlightedIndex === index ? 1.05 : 1
                }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.02, duration: 0.15 }}
              >
                {section.label}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dot rail */}
      <div
        ref={railRef}
        className="flex flex-col items-center py-2 touch-none"
        style={{ gap: '16px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {sections.map((section, index) => {
          const isActive = highlightedIndex === index;
          const isCurrentSection = activeIndex === index;

          return (
            <button
              key={section.id}
              onClick={() => handleDotTap(section.id)}
              className="relative p-1 -m-1 touch-manipulation"
              aria-label={`Go to ${section.label}`}
            >
              {/* Outer ring for active section */}
              <motion.div
                className={`absolute inset-0 rounded-full border-2 ${
                  isCurrentSection && !isScrubbing
                    ? 'border-dusty-rose/40'
                    : 'border-transparent'
                }`}
                initial={false}
                animate={{
                  scale: isCurrentSection && !isScrubbing ? 1.5 : 1,
                  opacity: isCurrentSection && !isScrubbing ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
              />

              {/* Main dot */}
              <motion.div
                className={`rounded-full transition-colors duration-200 ${
                  isActive
                    ? 'bg-dusty-rose'
                    : 'bg-dune/30'
                }`}
                initial={false}
                animate={{
                  width: isActive ? 10 : 6,
                  height: isActive ? 10 : 6,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Scrubbing indicator line */}
      <AnimatePresence>
        {isScrubbing && highlightedIndex !== null && (
          <motion.div
            className="absolute right-full mr-2 h-0.5 bg-dusty-rose/50 rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 30, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            style={{
              top: `calc(50% - ${(sections.length - 1) / 2 * 16}px + ${highlightedIndex * 16}px + 8px)`,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
