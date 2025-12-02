import { useEffect, useRef } from 'react';

interface UseMobileStackingCardsOptions {
  enabled: boolean;
  containerSelector: string;
  itemSelector: string;
}

/**
 * A hook that creates a "sticky stack" effect by manually transforming elements
 * to counteract scroll movement. This mimics position: sticky/fixed but works
 * reliably in custom scroll containers and doesn't affect layout flow (so snap systems work).
 */
export function useMobileStackingCards({
  enabled,
  containerSelector,
  itemSelector
}: UseMobileStackingCardsOptions) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemsRef = useRef<HTMLElement[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = document.querySelector(containerSelector) as HTMLElement;
    const items = Array.from(document.querySelectorAll(itemSelector)) as HTMLElement[];

    if (!container || items.length === 0) return;

    containerRef.current = container;
    itemsRef.current = items;

    // Helper to get layout position relative to scroll container
    // Must match the logic in useMobileGSAPScroll for consistency
    const getLayoutTop = (element: HTMLElement): number => {
      // If container is positioned, it's the offsetParent
      if (element.offsetParent === container) {
        return element.offsetTop;
      }
      // Otherwise calculate difference (fallback)
      return element.offsetTop - container.offsetTop;
    };

    const updatePositions = () => {
      if (!containerRef.current) return;
      
      const scrollTop = containerRef.current.scrollTop;
      
      itemsRef.current.forEach(item => {
        const itemTop = getLayoutTop(item);
        
        // Calculate how far we've scrolled past the start of the item
        const delta = scrollTop - itemTop;
        
        // If we've scrolled past it (delta > 0), translate it down by that amount
        // to keep it visually fixed at the top.
        // We only do this if we haven't scrolled WAY past it (optimization)
        if (delta > 0) {
          // Check if we should stop pinning (optional optimization: stop if fully covered)
          // For now, infinite pinning ensures it stays put until covered.
          item.style.transform = `translate3d(0, ${delta}px, 0)`;
        } else {
          // Reset if we scroll back up above it
          item.style.transform = 'translate3d(0, 0, 0)';
        }
      });

      rafRef.current = requestAnimationFrame(updatePositions);
    };

    // Start loop
    updatePositions();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Reset transforms on cleanup
      items.forEach(item => {
        item.style.transform = '';
      });
    };
  }, [enabled, containerSelector, itemSelector]);
}

