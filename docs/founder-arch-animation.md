# Founder Arch Animation - Design Challenge

## Goal

Create an Apple-quality scroll transition between the WelcomeSection and FounderLetterSection on mobile.

**Desired Effect:** As the user scrolls down from the WelcomeSection (front desk photo with LP logo and text), the FounderLetterSection (Emily's arch photo) should slide up and **cover** the WelcomeSection like a card stacking on top. The WelcomeSection stays in place while the arch slides over it.

**Secondary Effect:** A very subtle zoom (1.0 → 1.08) on the arch image as it scrolls up, adding depth.

**Critical Constraint:** The user must NEVER see the bottom edge of the arch PNG - it must always be off-screen or masked.

---

## Current Architecture

### Mobile Scroll System
- Uses a custom scroll container: `.mobile-scroll-container`
- GSAP-based soft snap system in `useMobileGSAPScroll.ts`
- Sections have `data-section-id` attributes for snap targeting
- NOT using CSS `scroll-snap` - uses custom JS-based snapping

### Z-Index Layers (Mobile)
- `z-0`: MobileHeroBackground (fixed, shows behind hero)
- `z-10`: Main content wrapper
- `z-20`: Cream wrapper containing FounderLetter onwards
- `z-30`: FounderLetterSection mobile container

---

## What We've Tried & Lessons Learned

### Attempts 1-6 (Previous)
- **GSAP Pinning**: Conflicted with custom snap system.
- **CSS Sticky**: Failed due to context/overflow issues in the custom scroll container.
- **Manual Transform**: Caused stuttering and fought with the snap system.
- **Fixed Layer**: Previously failed because it covered the Hero section (z-index issues).

---

## New Proposal: The "Conditional Fixed Layer" Pattern

We will implement a robust "Card Stack" effect by separating the **Visual Content** from the **Scroll Layout**.

### The Concept
1.  **The "Ghost" Spacer:** The `WelcomeSection` in the scroll flow will become a transparent container that preserves the height and layout position (for the snap system) but displays nothing.
2.  **The Fixed Layer:** We will render the actual Welcome Section content in a separate `position: fixed` container that sits *behind* the scrollable content.
3.  **Smart Visibility:** We will use a lightweight scroll listener to toggle the Fixed Layer's visibility so it **only** appears when we are scrolling past the Hero, preventing it from ever obscuring the Hero section.

### Why This Works
-   **No "Fighting":** The snap system tracks the "Ghost" spacer, which moves normally in the document flow. No custom math needed.
-   **Native Performance:** `position: fixed` is handled by the browser compositor (60fps).
-   **Visual Correctness:**
    -   User scrolls Hero -> Hero moves up.
    -   As Hero leaves, Fixed Welcome Layer is revealed (or becomes visible).
    -   User scrolls "Ghost" Welcome Spacer -> Fixed Welcome Layer stays put (visually pinned).
    -   Founder Section (with opaque background) slides UP over the Fixed Welcome Layer.
    -   Effect: Perfect card stack.

### Implementation Plan

1.  **Create `FixedWelcomeLayer` Component**:
    -   Contains the `WelcomeSection` content (Logo, Text).
    -   `position: fixed`, `top: 0`, `z-index: 5`.
    -   Initially `hidden` or `opacity: 0`.

2.  **Modify `LandingPageV2Client`**:
    -   Add `FixedWelcomeLayer` outside the scroll container.
    -   Update the existing `WelcomeSection` wrapper to be the "Ghost" (keep `data-section-id="welcome"` for snap, but make content transparent).
    -   Add a scroll listener to `.mobile-scroll-container`:
        -   If `scrollTop > heroHeight / 2`: Show Fixed Welcome Layer.
        -   Else: Hide Fixed Welcome Layer.

3.  **Z-Index Strategy**:
    -   Hero Background: `z-0`
    -   **Fixed Welcome Layer:** `z-5`
    -   Hero Content (Scrollable): `z-10`
    -   Founder/Team Content (Scrollable): `z-20` (Slides over z-5)

This approach bypasses all the complexity of sticky contexts and JS-based positioning.
