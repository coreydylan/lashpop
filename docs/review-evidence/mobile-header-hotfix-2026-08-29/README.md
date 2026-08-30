# Mobile header containment hotfix — 2026-08-29

Owner authorization: Corey supplied a current 390 px production screenshot showing the LashPop mobile header controls visually colliding with FAQ content and authorized a minimal production hotfix.

## Root cause

PR #47 intentionally server-rendered `MobileHeader` to remove a hydration flash. Its homepage scroll effect still queried only `.mobile-scroll-container`, a class added after hydration. The effect ran before that class existed, returned without a listener, and never retried. The header therefore remained transparent while the inner homepage scroller moved, allowing FAQ titles and cards to show through the logo, Book Now CTA, and menu.

## Before

- Production: `https://lashpopstudios.com`
- Deployment: `dpl_5gWjzXDXm8uMD8SrpsXL8rSs9bx1`
- Merge SHA: `331c420ef484d4df618d8f2183b6a00940611d4b`
- At 320 px and 390 px after scrolling to FAQ, the computed header background remained `rgba(0, 0, 0, 0)`.
- [320 px production regression](./before-faq-320.png)
- [390 px production regression](./before-faq-390.png)
- [Desktop production reference](./before-desktop.png)

## After

- The header binds to the server-rendered `#main-content` element before the mobile scroll class is added, so the listener remains attached when the element becomes the scroller.
- One shared mobile-header height includes `safe-area-inset-top` and drives the visible strip, anchor offsets, scroll padding, FAQ sticky controls, and the Work With Us spacer.
- At 320 px and 390 px after scrolling to FAQ, the computed header background is the approved ivory `rgb(250, 246, 242)`; the FAQ category rail begins exactly at the header bottom.
- Logo, Book Now, and menu controls remain inside the header and inside the viewport with no pairwise overlap.
- Reduced motion does not alter the layout or containment behavior.
- [320 px fixed local production build](./after-faq-320.png)
- [390 px fixed local production build](./after-faq-390.png)
- [Desktop fixed-build reference](./after-desktop.png)

No color, typography, spacing, radius, image-delivery, booking, data, DNS, D1, or Worker contract changed.
