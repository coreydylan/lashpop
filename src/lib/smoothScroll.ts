export const getScroller = (): Window | Element => {
  if (typeof document === 'undefined') return window; // SSR safety
  const container = document.querySelector('.mobile-snap-container');
  const isMobileContainerActive = container && getComputedStyle(container).display !== 'none';
  return isMobileContainerActive ? container : window;
};

// Cubic easing for a more natural, less "sticky" feel
const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const smoothScrollTo = (targetY: number, duration: number = 1000, scroller: Window | Element = window) => {
  const startY = scroller instanceof Window ? scroller.scrollY : (scroller as HTMLElement).scrollTop;
  const difference = targetY - startY;
  const startTime = performance.now();

  const step = () => {
    const currentTime = performance.now();
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const ease = easeInOutCubic(progress);

    const currentY = startY + difference * ease;

    if (scroller instanceof Window) {
      scroller.scrollTo(0, currentY);
    } else {
      (scroller as HTMLElement).scrollTop = currentY;
    }

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

export type ScrollAlignment = 'top' | 'center' | 'bottom';

export const smoothScrollToElement = (
  elementId: string, 
  offset: number = 80, 
  duration: number = 1000, 
  alignment: ScrollAlignment = 'top'
) => {
  const element = document.querySelector(elementId);
  if (!element) return;

  const scroller = getScroller();
  
  const startY = scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop;
  const elementRect = element.getBoundingClientRect();
  
  let targetY = startY + elementRect.top - offset;

  if (alignment === 'center') {
    const viewportHeight = window.innerHeight;
    const elementHeight = elementRect.height;
    
    // Calculate center position:
    // We want the center of the element to be at the center of the viewport
    // Center of element relative to document = startY + elementRect.top + (elementHeight / 2)
    // Center of viewport relative to document = ScrollPos + (viewportHeight / 2)
    // So: TargetScrollPos = (startY + elementRect.top + elementHeight / 2) - (viewportHeight / 2)
    
    // Simplified: TargetY = startY + elementRect.top - (viewportHeight - elementHeight) / 2
    // We ignore the 'offset' parameter for centering typically, unless we want to center within a subset of the viewport (e.g. minus header)
    // Let's account for the header offset in the available viewport space if we want to be precise, 
    // but usually true center is what's desired. Let's stick to true center.
    
    targetY = startY + elementRect.top - (viewportHeight - elementHeight) / 2;
  }

  smoothScrollTo(targetY, duration, scroller);
};
