# Mobile Scroll Snap System

## Overview

The mobile scroll snap system (`useMobileGSAPScroll` hook) provides smooth section-based scrolling with configurable snap points for each section on mobile devices.

## Architecture

- **Location**: `src/hooks/useMobileGSAPScroll.ts`
- **Scroll Container**: `.mobile-scroll-container` (the main scrollable element on mobile)
- **Section Selector**: `.mobile-section` with `data-section-id` attribute
- **Animation**: GSAP with ScrollToPlugin for smooth snapping

## Critical Implementation Details

### DO NOT use `offsetTop` for position calculations

The sections are nested inside wrapper divs (e.g., `<div className="bg-cream relative">`), which means `element.offsetTop` returns the position relative to the offset parent, NOT the scroll container.

**WRONG:**
```typescript
const sectionTop = section.offsetTop  // Returns position relative to offset parent!
```

**CORRECT:**
```typescript
// Use getBoundingClientRect for viewport-relative positions
const rect = section.getBoundingClientRect()
const containerRect = container.getBoundingClientRect()
const absoluteTop = container.scrollTop + (rect.top - containerRect.top)
```

### DO NOT use ScrollTrigger for section tracking

Using GSAP ScrollTrigger with `onEnter`/`onEnterBack` callbacks for tracking the current section causes rapid flashing of the section indicator when sections have variable heights or overlap.

**WRONG:**
```typescript
ScrollTrigger.create({
  trigger: section,
  onEnter: () => onSectionChange(sectionId),  // Causes flashing!
  onEnterBack: () => onSectionChange(sectionId)
})
```

**CORRECT:**
```typescript
// Simple viewport-center-based detection with change deduplication
const updateCurrentSection = () => {
  const viewportCenter = window.innerHeight / 2

  for (const section of sections) {
    const rect = section.getBoundingClientRect()
    if (rect.top <= viewportCenter && rect.bottom > viewportCenter) {
      if (sectionId !== lastReportedSection) {
        lastReportedSection = sectionId
        onSectionChange(sectionId)
      }
      break
    }
  }
}
```

## Per-Section Configuration

Each section can have custom snap behavior via `getDefaultSectionConfigs()`:

```typescript
{
  threshold: number,      // 0-1, how likely to snap (higher = more sensitive)
  anchorOffset: number,   // Pixels offset for where section lands
  disableSnap?: boolean   // If true, section handles its own snap (e.g., FAQ)
}
```

### Anchor Offset Guide
- `anchorOffset: 0` = section top aligns with viewport top
- `anchorOffset: vh * 0.10` = section appears 10% down from top (scroll less)
- `anchorOffset: vh * -0.18` = section appears higher (scroll more past it)

## Sections with `min-height: auto`

By default, `.mobile-section` has `min-height: 100dvh`. Sections with variable content height need to be added to the CSS override in `LandingPageV2Client.tsx`:

```css
.mobile-section[data-section-id="team"],
.mobile-section[data-section-id="instagram"],
.mobile-section[data-section-id="reviews"],
.mobile-section[data-section-id="faq"],
.mobile-section[data-section-id="map"] {
  min-height: auto;
  padding-bottom: 60px;
}
```

## FAQ Section Special Handling

The FAQ section has `disableSnap: true` and implements its own one-time entry snap using `IntersectionObserver`. This allows:
1. Snap once when entering the section (docks sticky header)
2. Free scrolling through FAQ cards
3. Reset when leaving the section

See `FAQSection.tsx` for the IntersectionObserver implementation.

## Debugging Tips

1. **Section indicator shows wrong section**: Check that `getBoundingClientRect()` is being used, not `offsetTop`
2. **Snapping to wrong position**: Verify the section is in the CSS `min-height: auto` list if it has variable height
3. **Menu flashing between sections**: Ensure section change callback only fires when section actually changes (deduplicate with `lastReportedSection`)
4. **Menu dropdown not appearing**: Check z-index and `pointer-events-auto` on the portal element

## Related Files

- `src/hooks/useMobileGSAPScroll.ts` - Main scroll snap hook
- `src/app/LandingPageV2Client.tsx` - Mobile section CSS and layout
- `src/components/landing-v2/MobileHeader.tsx` - Section indicator and menu
- `src/components/landing-v2/sections/FAQSection.tsx` - Custom FAQ snap handling
