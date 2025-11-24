'use client';

import { useEffect, useRef } from 'react';
import { usePanelStack } from '@/contexts/PanelStackContext';

interface AutoDockOnScrollProps {
  /**
   * Scroll threshold in pixels before auto-docking panels
   * @default 100
   */
  scrollThreshold?: number;

  /**
   * Debounce delay in milliseconds
   * @default 150
   */
  debounceDelay?: number;

  /**
   * Whether the feature is enabled
   * @default true
   */
  enabled?: boolean;
}

export function AutoDockOnScroll({
  scrollThreshold = 100,
  debounceDelay = 150,
  enabled = true
}: AutoDockOnScrollProps) {
  const { state, actions } = usePanelStack();
  const { dockAll } = actions;
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasDockedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Check if there are any expanded panels
      const hasExpandedPanels = state.panels.some(p => p.state === 'expanded');

      if (!hasExpandedPanels) {
        // Reset the docked flag if no panels are expanded
        hasDockedRef.current = false;
        lastScrollY.current = currentScrollY;
        return;
      }

      // Check if user has scrolled beyond threshold
      if (scrollDelta >= scrollThreshold && !hasDockedRef.current) {
        // Debounce the dock action
        scrollTimeoutRef.current = setTimeout(() => {
          dockAll();
          hasDockedRef.current = true;
        }, debounceDelay);
      }

      lastScrollY.current = currentScrollY;
    };

    // Reset when panels are opened/closed
    const resetOnPanelChange = () => {
      hasDockedRef.current = false;
      lastScrollY.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Reset the docked flag when panels change
    resetOnPanelChange();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [enabled, scrollThreshold, debounceDelay, dockAll, state.panels]);

  // This component doesn't render anything
  return null;
}
