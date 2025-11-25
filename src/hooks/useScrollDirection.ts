'use client';

import { useState, useEffect, useRef } from 'react';
import { getScroller } from '@/lib/smoothScroll';

export type ScrollDirection = 'up' | 'down' | 'none';

interface UseScrollDirectionOptions {
  threshold?: number; // Minimum scroll delta to trigger direction change
  initialDirection?: ScrollDirection;
}

/**
 * Hook to track scroll direction
 *
 * UX Justification:
 * - Enables "smart" header behavior (hide on scroll down, show on scroll up)
 * - Threshold prevents jittery behavior from micro-scrolls
 * - Works with both window and custom scroll containers (mobile scroll container)
 */
export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, initialDirection = 'none' } = options;

  const [direction, setDirection] = useState<ScrollDirection>(initialDirection);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    // Get the scroller, but also listen on window for both
    // This ensures we catch scrolls regardless of container
    const mobileContainer = document.querySelector('.mobile-scroll-container');
    const isMobile = mobileContainer && window.innerWidth < 768;

    const getScrollY = () => {
      if (isMobile && mobileContainer) {
        return (mobileContainer as HTMLElement).scrollTop;
      }
      return window.scrollY;
    };

    const updateDirection = () => {
      const currentScrollY = getScrollY();
      const delta = currentScrollY - lastScrollY.current;

      // Update isAtTop
      setIsAtTop(currentScrollY < 20);

      // Only update direction if we've scrolled past threshold
      if (Math.abs(delta) >= threshold) {
        if (delta > 0) {
          setDirection('down');
        } else if (delta < 0) {
          setDirection('up');
        }
        lastScrollY.current = currentScrollY;
      }

      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateDirection);
        ticking.current = true;
      }
    };

    // Get initial position
    lastScrollY.current = getScrollY();
    setIsAtTop(lastScrollY.current < 20);

    // Listen on both window and mobile container
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (isMobile && mobileContainer) {
      mobileContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mobileContainer) {
        mobileContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [threshold]);

  return { direction, isAtTop };
}

/**
 * Hook to track current section based on scroll position
 * Uses IntersectionObserver for efficient tracking
 *
 * UX Justification:
 * - IntersectionObserver is more efficient than scroll listeners
 * - Works with both window scrolling and container scrolling
 * - Threshold array allows for smooth transitions between sections
 * - Root margin catches sections before they're fully in view
 */
export interface SectionInfo {
  id: string;
  label: string;
}

export function useCurrentSection(sections: SectionInfo[]) {
  const [currentSection, setCurrentSection] = useState<string>(sections[0]?.id || '');

  useEffect(() => {
    if (sections.length === 0) return;

    // Determine the root element for intersection observation
    // On mobile, we need to observe within the scroll container
    const mobileContainer = document.querySelector('.mobile-scroll-container');
    const isMobile = mobileContainer && window.innerWidth < 768;
    const root = isMobile ? mobileContainer : null;

    // Store visibility ratios for each section
    const visibleSections = new Map<string, number>();

    // Single observer for all sections (more efficient)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = (entry.target as HTMLElement).getAttribute('data-section-id');
          if (!sectionId) return;

          if (entry.isIntersecting) {
            visibleSections.set(sectionId, entry.intersectionRatio);
          } else {
            visibleSections.delete(sectionId);
          }
        });

        // Find the most visible section
        let maxRatio = 0;
        let mostVisibleSection = '';

        visibleSections.forEach((ratio, id) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            mostVisibleSection = id;
          }
        });

        // Update if we found a visible section and it's different
        if (mostVisibleSection && mostVisibleSection !== currentSection) {
          setCurrentSection(mostVisibleSection);
        }
      },
      {
        root,
        // Observe with margins that account for header and provide early detection
        rootMargin: '-15% 0px -35% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
      }
    );

    // Observe all sections
    sections.forEach((section) => {
      const element = document.querySelector(`[data-section-id="${section.id}"]`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sections, currentSection]);

  return currentSection;
}
