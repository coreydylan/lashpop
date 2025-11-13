# Photo Grid Scroller - Implementation Plan

## Overview

A scroll-based photography showcase that creates a seamless transition from the hero section's archway to a full-screen mosaic image grid, then smoothly transitions to the next page section.

---

## Visual Experience Flow

### Phase 1: Hero with Archway Preview (0% scroll)
- User sees hero section with archway design element
- Through the archway, a "key image" is visible
- This key image is actually positioned in the grid layer below (subsurface)

### Phase 2: Archway Expansion (0-40% scroll)
- Hero section begins scrolling up and away
- Archway shape morphs/expands from its decorative shape to fill entire viewport (edge-to-edge)
- Key image remains perfectly positioned during this expansion

### Phase 3: Grid Reveal (40% scroll)
- Full mosaic grid is now revealed
- Key image is shown in context with surrounding grid images
- All images are edge-to-edge with no gaps (magazine-style layout)

### Phase 4: Grid Scroll Through (40-70% scroll)
- User scrolls through exactly **1 viewport height** of the mosaic grid
- Smooth scrolling experience with optional subtle parallax
- Photography-centric, beautiful visual journey

### Phase 5: Transition to Next Section (70-100% scroll)
- Grid smoothly fades/scrolls away
- Next page section comes into view
- Scroll control transfers back to normal page flow

---

## Technical Architecture

### Component Hierarchy

```
<HeroArchwayReveal>
  │
  ├─ Page Surface Layer (z-index: 10)
  │   └─ <HeroSection>
  │       ├─ [Hero content]
  │       └─ <ArchwayMask> (SVG clip-path/mask)
  │
  └─ Subsurface Layer (z-index: 1)
      └─ <ImageMosaic>
          ├─ <KeyImage> (positioned for archway alignment)
          └─ <MosaicImage[]> (dynamic grid items)
```

### Z-Index Strategy

- **Page Surface (z-10)**: Hero section with `position: sticky` or `position: fixed`
- **Subsurface (z-1)**: Image grid with `position: fixed` or `position: absolute`
- As hero scrolls away, grid "reveals" from underneath

### Core Technologies

- **Framer Motion**: Primary animation library (already in stack)
  - `useScroll()`: Track scroll position
  - `useTransform()`: Map scroll to animation values
  - `motion` components: Smooth animations
- **CSS Grid**: Mosaic layout with `grid-auto-flow: dense`
- **SVG Masks/Clip-paths**: Archway shape and expansion animation
- **DAM Integration**: Tagged images from asset manager

---

## DAM Integration Requirements

### Request for DAM Team

**Category Structure Needed:**

```
website/
└── grid-scroller/
    ├── [tagged images]
    └── [key-image flag on one image]
```

**Requirements:**
1. Create a new category called `website`
2. Create a subcategory under `website` called `grid-scroller`
3. Images tagged in `grid-scroller` will be included in the mosaic grid
4. One image should be flaggable/markable as the "key image" (the one shown through the archway)
5. System must support dynamic number of images (could be 10, could be 50)

**Query Interface:**
- Component will query DAM for images with tag: `website/grid-scroller`
- Key image will be identified by additional metadata flag
- Return image URLs, aspect ratios, and optimization hints

---

## Implementation Phases

### Phase 1: Foundation Setup

**Files to Create:**
- `src/components/HeroArchwayReveal/index.tsx` - Main orchestrator
- `src/components/HeroArchwayReveal/ImageMosaic.tsx` - Grid layout
- `src/components/HeroArchwayReveal/ArchwayMask.tsx` - SVG archway shape
- `src/components/HeroArchwayReveal/types.ts` - TypeScript interfaces
- `src/components/HeroArchwayReveal/utils.ts` - Layout calculations

**Tasks:**
1. Set up component file structure
2. Define TypeScript interfaces for grid images
3. Create basic component shells
4. Wire up to home page

**Key Types:**
```typescript
interface GridImage {
  id: string;
  url: string;
  aspectRatio: number;
  isKeyImage: boolean;
  alt: string;
}

interface ScrollPhase {
  start: number; // 0-1
  end: number;   // 0-1
  name: string;
}
```

---

### Phase 2: DAM Integration

**Tasks:**
1. Create DAM query function for `website/grid-scroller` images
2. Implement image fetching with error handling
3. Identify and isolate key image from result set
4. Add image preloading logic
5. Handle dynamic image count (works with any number of images)

**Smart Image Loading:**
- Preload key image immediately (critical for archway reveal)
- Lazy load grid images based on proximity to viewport
- Use next/image optimization
- Progressive loading with blur-up placeholders

---

### Phase 3: Mosaic Grid Layout

**Tasks:**
1. Implement CSS Grid layout with dynamic columns
2. Create algorithm to calculate optimal image placement
3. Position key image at specific coordinates for archway alignment
4. Ensure edge-to-edge layout (no gaps: `gap: 0`)
5. Handle various aspect ratios gracefully
6. Make responsive (mobile, tablet, desktop)

**Layout Algorithm:**
- Calculate optimal column count based on viewport width
- Use `grid-auto-flow: dense` for magazine-style packing
- Maintain aspect ratios while ensuring edge-to-edge fit
- Position key image strategically (likely center or golden ratio position)
- Handle vertical scrolling for exactly 1vh of content

**Responsive Breakpoints:**
- Mobile: 2-3 columns
- Tablet: 3-4 columns
- Desktop: 4-6 columns
- Ultra-wide: 6-8 columns

---

### Phase 4: Scroll Animation System

**Scroll Phases Definition:**
```typescript
const SCROLL_PHASES = {
  HERO_VISIBLE: { start: 0, end: 0.2 },
  ARCHWAY_EXPAND: { start: 0.2, end: 0.4 },
  GRID_REVEALED: { start: 0.4, end: 0.4 },
  GRID_SCROLL: { start: 0.4, end: 0.7 },
  TRANSITION_OUT: { start: 0.7, end: 1.0 }
}
```

**Tasks:**
1. Implement scroll tracking with `useScroll()`
2. Create scroll progress sections
3. Map scroll values to animation states using `useTransform()`
4. Ensure smooth 60fps performance
5. Add easing curves for soft aesthetic (easeInOut or custom bezier)

**Scroll Container Setup:**
```typescript
const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ["start start", "end start"]
});
```

---

### Phase 5: Archway Expansion Animation

**Tasks:**
1. Create SVG archway shape that matches hero design
2. Implement clip-path or mask animation
3. Morph archway shape from decorative → full viewport rectangle
4. Sync expansion with hero scroll-away timing
5. Ensure key image stays perfectly aligned during expansion

**Animation Approach:**

Option A: CSS Clip-Path Morph
```css
clip-path: path('M...archway shape...') → inset(0)
```

Option B: SVG Mask with viewBox animation
```svg
<mask id="archway">
  <path d="...archway..." /> <!-- morphs to full rect -->
</mask>
```

**Key Image Positioning:**
- Calculate exact coordinates where archway center appears
- Position key image in grid so its center aligns with archway center
- During expansion, image remains locked in position
- Creates illusion that archway is "revealing" what's behind

---

### Phase 6: Hero Scroll-Away

**Tasks:**
1. Apply scroll-linked transform to hero section
2. Fade out hero content during scroll
3. Use sticky/fixed positioning until archway fully expanded
4. Smooth transition timing with archway expansion
5. Ensure no jarring jumps or layout shifts

**Animation Values:**
```typescript
const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -100]);
const heroOpacity = useTransform(scrollYProgress, [0.2, 0.4], [1, 0]);
```

---

### Phase 7: Grid Reveal & Scroll Through

**Tasks:**
1. Keep grid fixed in place while hero scrolls away
2. Once revealed (40% scroll), enable vertical scroll through grid
3. Implement exactly 1 viewport height of scrollable content
4. Add optional subtle parallax on individual images
5. Ensure smooth scroll momentum

**Scroll Lock Mechanism:**
- During phases 1-3: Scroll affects hero position
- During phase 4: Scroll moves through grid content
- During phase 5: Scroll transitions to next section

**Optional Parallax:**
- Individual images can have slight Y-offset based on scroll position
- Creates depth and visual interest
- Must remain subtle to maintain soft aesthetic

---

### Phase 8: Transition to Next Section

**Tasks:**
1. Detect when user has scrolled through 1vh of grid
2. Smoothly fade out grid
3. Bring in next page section with smooth animation
4. Transfer scroll control back to normal page flow
5. Ensure seamless handoff (no scroll jumping)

**Transition Animation:**
```typescript
const gridOpacity = useTransform(scrollYProgress, [0.7, 0.9], [1, 0]);
const nextSectionY = useTransform(scrollYProgress, [0.7, 1.0], [100, 0]);
```

---

### Phase 9: Polish & Aesthetic Refinement

**Tasks:**
1. Match Desert Ocean soft aesthetic
2. Add subtle hover effects on grid images (scale: 1.02, brightness adjustment)
3. Implement smooth image loading transitions (fade-in)
4. Test and refine easing curves for buttery smooth feel
5. Add loading states with branded skeleton screens
6. Ensure all animations are 60fps
7. Test across screen sizes and devices

**Aesthetic Principles:**
- Soft, organic transitions (no harsh cuts)
- Photography-first (images are the star)
- Subtle interactions (hover, scroll)
- Smooth, luxurious feel
- Performance is part of the aesthetic (no jank)

---

### Phase 10: Performance Optimization

**Tasks:**
1. Use `will-change` CSS property on animated elements
2. Optimize re-renders with `useMemo` and `useCallback`
3. Implement intersection observer for lazy loading
4. Use next/image with appropriate sizes and quality settings
5. Test on low-end devices
6. Monitor Core Web Vitals (CLS, LCP, FID)
7. Add performance monitoring

**Performance Targets:**
- LCP < 2.5s (Largest Contentful Paint)
- CLS < 0.1 (Cumulative Layout Shift)
- FID < 100ms (First Input Delay)
- Smooth 60fps animations on mid-tier devices

---

### Phase 11: Accessibility

**Tasks:**
1. Implement `prefers-reduced-motion` support
   - Disable/simplify animations for users who prefer reduced motion
   - Maintain functionality without animations
2. Keyboard navigation fallbacks
   - Allow keyboard users to navigate through images
   - Ensure focus management during transitions
3. Screen reader support
   - Announce scroll phase changes
   - Provide alt text for all images
   - Ensure grid is semantically correct
4. Test with screen readers (VoiceOver, NVDA)

**Reduced Motion Fallback:**
```typescript
const prefersReducedMotion = useReducedMotion();

// Simplified version without scroll animations
if (prefersReducedMotion) {
  return <SimplifiedGridView />;
}
```

---

## File Structure

```
src/components/HeroArchwayReveal/
├── index.tsx                 # Main component, scroll orchestration
├── ImageMosaic.tsx           # Grid layout and image rendering
├── ArchwayMask.tsx           # SVG archway shape + expansion
├── ScrollPhases.tsx          # Scroll phase management
├── types.ts                  # TypeScript interfaces
├── utils.ts                  # Layout calculations, helpers
├── hooks/
│   ├── useGridImages.ts      # DAM integration hook
│   ├── useScrollPhases.ts    # Scroll phase tracking
│   └── useMosaicLayout.ts    # Grid layout calculations
├── animations/
│   ├── archway.ts            # Archway expansion configs
│   ├── hero.ts               # Hero scroll-away configs
│   └── grid.ts               # Grid reveal configs
└── styles.module.css         # Component styles
```

---

## Configuration & Customization

**Adjustable Parameters:**
```typescript
const CONFIG = {
  // Scroll phase breakpoints (0-1)
  phases: {
    archwayExpandStart: 0.2,
    archwayExpandEnd: 0.4,
    gridScrollEnd: 0.7,
  },

  // Grid layout
  grid: {
    columns: {
      mobile: 2,
      tablet: 4,
      desktop: 6,
    },
    scrollHeight: '100vh', // 1 viewport height
  },

  // Animation
  animation: {
    easing: [0.43, 0.13, 0.23, 0.96], // Custom bezier
    duration: 1.2, // seconds
  },

  // Performance
  performance: {
    lazyLoadThreshold: 0.5,
    preloadKeyImage: true,
  },
};
```

---

## Testing Strategy

### Visual Regression Tests
- Capture screenshots at each scroll phase
- Compare against baseline images
- Test across screen sizes

### Performance Tests
- Measure frame rate during scroll
- Test with 10, 25, 50, 100 images
- Profile memory usage

### Cross-Browser Tests
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

### User Testing
- Test with real users for smoothness perception
- Gather feedback on animation timing
- Validate intuitive scroll behavior

---

## Success Metrics

1. **Performance**: Maintains 60fps during all scroll phases
2. **Smoothness**: No janky animations or layout shifts
3. **Load Time**: Key image loads in < 1s, grid images progressively load
4. **Responsiveness**: Works beautifully on all screen sizes
5. **Accessibility**: Full keyboard navigation + screen reader support
6. **Aesthetic**: Matches Desert Ocean soft, photography-first vibe
7. **Flexibility**: Handles any number of DAM images dynamically

---

## Risks & Mitigation

### Risk: Too many images causing performance issues
**Mitigation**: Implement aggressive lazy loading, image optimization, virtual scrolling if needed

### Risk: Complex animations causing jank on mobile
**Mitigation**: Use CSS transforms (GPU-accelerated), test early on low-end devices, simplify if needed

### Risk: Archway expansion not looking smooth
**Mitigation**: Prototype early, iterate on easing curves, consider multiple expansion techniques

### Risk: DAM images not loading or missing
**Mitigation**: Implement robust error handling, fallback images, loading states

---

## Timeline Estimate

- **Phase 1-2** (Foundation + DAM): 1-2 days
- **Phase 3** (Mosaic Layout): 1-2 days
- **Phase 4-7** (Scroll Animations): 2-3 days
- **Phase 8** (Transition): 1 day
- **Phase 9-11** (Polish, Performance, A11y): 2-3 days

**Total: ~7-11 days** for complete implementation

---

## Next Steps

1. ✅ DAM team creates `website/grid-scroller` category structure
2. Start Phase 1: Build component foundation
3. Prototype archway expansion animation
4. Implement basic scroll system
5. Integrate DAM and build mosaic layout
6. Polish and optimize

---

## Notes

- This is a signature feature - invest time in getting it perfect
- Photography must be the hero - code serves the visuals
- Smooth performance is non-negotiable
- Every detail matters for the soft aesthetic
- Test early, test often, especially on mobile
