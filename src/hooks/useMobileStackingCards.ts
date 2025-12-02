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
 *
 * Updated: Now uses scroll event listener instead of continuous RAF loop for better performance.
 */
export function useMobileStackingCards({
  enabled,
  containerSelector,
  itemSelector
}: UseMobileStackingCardsOptions) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemsRef = useRef<HTMLElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const itemTopsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const container = document.querySelector(containerSelector) as HTMLElement;
    const items = Array.from(document.querySelectorAll(itemSelector)) as HTMLElement[];

    if (!container || items.length === 0) return;

    containerRef.current = container;
    itemsRef.current = items;

    // Helper to get layout position relative to scroll container
    const getLayoutTop = (element: HTMLElement): number => {
      if (element.offsetParent === container) {
        return element.offsetTop;
      }
      return element.offsetTop - container.offsetTop;
    };

    // Cache item tops on mount (recalculate on resize if needed)
    itemTopsRef.current = items.map(item => getLayoutTop(item));

    const updatePositions = () => {
      if (!containerRef.current) return;

      const scrollTop = containerRef.current.scrollTop;

      itemsRef.current.forEach((item, index) => {
        const itemTop = itemTopsRef.current[index];
        const delta = scrollTop - itemTop;

        if (delta > 0) {
          item.style.transform = `translate3d(0, ${delta}px, 0)`;
        } else {
          item.style.transform = 'translate3d(0, 0, 0)';
        }
      });
    };

    // Throttled scroll handler using RAF
    const handleScroll = () => {
      if (rafRef.current) return; // Skip if already scheduled

      rafRef.current = requestAnimationFrame(() => {
        updatePositions();
        rafRef.current = null;
      });
    };

    // Initial position update
    updatePositions();

    // Listen to scroll events instead of continuous RAF loop
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
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

