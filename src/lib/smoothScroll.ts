export const getScroller = (): Window | Element => {
  if (typeof document === 'undefined') return window; // SSR safety
  // Check for mobile scroll container (used in landing page v2)
  const mobileScrollContainer = document.querySelector('.mobile-scroll-container');
  if (mobileScrollContainer && getComputedStyle(mobileScrollContainer).display !== 'none') {
    return mobileScrollContainer;
  }
  // Fallback to old mobile-snap-container if it exists
  const snapContainer = document.querySelector('.mobile-snap-container');
  if (snapContainer && getComputedStyle(snapContainer).display !== 'none') {
    return snapContainer;
  }
  return window;
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

/**
 * Scrolls a homepage section (#services, #team, #reviews, etc.) into the
 * spot the in-page nav uses. Mobile and desktop have different headers and
 * different preferred alignments, so the decision tree below mirrors the
 * per-section logic in MobileHeader.handleMenuItemClick (mobile) and
 * Navigation.handleNavClick (desktop). Keeping both branches here means
 * cross-page deep links (e.g. /work-with-us → /#services) land at the
 * same spot as clicking the nav from the homepage itself.
 */
export const scrollToHomepageSection = (
  href: string,
  isMobile: boolean,
  duration: number = 800,
) => {
  if (!href.startsWith('#')) return;

  if (isMobile) {
    // Mobile header is a 60px strip. Every section just needs to clear it —
    // earlier extra padding on gallery + reviews was over-shooting their
    // titles, so they use the bare HEADER offset like the rest.
    const HEADER = 60;
    smoothScrollToElement(href, HEADER, duration, 'top');
    return;
  }

  // Desktop: every section lands at top with 80px clearance for the nav.
  // FAQ needs slightly more room for its category chips below the heading,
  // but the chips sit BELOW the h2, not above, so the offset is modest.
  if (href === '#faq') {
    smoothScrollToElement(href, 110, duration, 'top');
  } else {
    smoothScrollToElement(href, 80, duration, 'top');
  }
};
