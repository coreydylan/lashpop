# Hero Archway Reveal Component

A scroll-based photography showcase that creates a seamless, cinematic transition from the hero section to a full-screen mosaic image grid.

## Features

- **Scroll-Linked Animation**: Smooth transitions controlled by scroll position
- **Archway Expansion**: Hero archway morphs from decorative shape to full-screen reveal
- **Edge-to-Edge Mosaic**: Magazine-style photo grid with no gaps
- **DAM Integration**: Dynamically loads images tagged in the Digital Asset Manager
- **Reduced Motion Support**: Simplified layout for users who prefer reduced motion
- **Performance Optimized**: Lazy loading, image optimization, 60fps animations
- **Accessibility**: Keyboard navigation, screen reader support, ARIA labels
- **Responsive**: Works beautifully on mobile, tablet, and desktop

## How It Works

### The Experience

1. **Hero Visible (0-20% scroll)**
   - User sees hero section with archway design
   - Through archway, a "key image" is visible from the grid below

2. **Archway Expansion (20-40% scroll)**
   - Hero section scrolls up/away
   - Archway expands from decorative shape to fill entire viewport
   - Key image stays perfectly aligned during expansion

3. **Grid Revealed (40% scroll)**
   - Full mosaic grid is now visible
   - Key image shown in context with surrounding images
   - All images are edge-to-edge, no gaps

4. **Grid Scroll (40-70% scroll)**
   - User scrolls through exactly 1 viewport height of the grid
   - Subtle parallax effects add depth
   - Smooth hover interactions

5. **Transition Out (70-100% scroll)**
   - Grid fades away
   - Next page section slides in
   - Seamless handoff to normal page flow

### Technical Implementation

- **Framer Motion**: Scroll-linked animations via `useScroll` and `useTransform`
- **CSS Grid**: Dynamic masonry layout with `grid-auto-flow: dense`
- **Z-Index Layering**: Hero (z-10) slides over grid (z-1) subsurface
- **Next.js Image Optimization**: Automatic image optimization and lazy loading

## Usage

```tsx
import { HeroArchwayReveal } from '@/components/HeroArchwayReveal'
import { HeroSection } from '@/components/sections/HeroSection'
import { NextSection } from '@/components/sections/NextSection'

export default function HomePage() {
  return (
    <HeroArchwayReveal
      heroContent={<HeroSection />}
      nextSection={<NextSection />}
    />
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `heroContent` | `ReactNode` | Yes | The hero section content |
| `nextSection` | `ReactNode` | No | Content to appear after grid scroll |

## DAM Integration

Images are dynamically loaded from the Digital Asset Manager using tags:

1. **Category**: `website`
2. **Tag**: `grid-scroller`
3. **Key Image Tag**: `key-image` (applied to exactly one image)

See `DAM_GRID_SCROLLER_SETUP.md` in the project root for setup instructions.

### Fallback Behavior

If no images are tagged in the DAM, the component will use mock images from `/public/lashpop-images/gallery/` to ensure the feature works immediately.

## Configuration

### Layout Config

Adjust grid columns per breakpoint:

```typescript
// src/components/HeroArchwayReveal/types.ts
export const DEFAULT_LAYOUT_CONFIG: MosaicLayoutConfig = {
  columns: {
    mobile: 2,
    tablet: 3,
    desktop: 5,
    ultrawide: 7,
  },
  gap: 0, // Edge-to-edge
  scrollHeight: '100vh',
}
```

### Animation Config

Adjust scroll phase breakpoints:

```typescript
// src/components/HeroArchwayReveal/types.ts
export const SCROLL_PHASES = {
  HERO_VISIBLE: { start: 0, end: 0.2 },
  ARCHWAY_EXPAND: { start: 0.2, end: 0.4 },
  GRID_REVEALED: { start: 0.4, end: 0.4 },
  GRID_SCROLL: { start: 0.4, end: 0.7 },
  TRANSITION_OUT: { start: 0.7, end: 1.0 },
}
```

### Easing Curves

Adjust animation smoothness:

```typescript
// src/components/HeroArchwayReveal/animations/index.ts
export const DEFAULT_ANIMATION_CONFIG = {
  easing: [0.43, 0.13, 0.23, 0.96], // Custom soft easing
  duration: 1.2,
}
```

## Performance

### Optimizations

- **Image Prioritization**: First 6 images use `priority={true}`
- **Lazy Loading**: Images outside viewport lazy load
- **Will-Change**: Animated properties use GPU acceleration
- **Memoization**: Layout calculations cached with `useMemo`
- **Intersection Observer**: Tracks image visibility

### Performance Targets

- ✅ 60fps animations on mid-tier devices
- ✅ LCP < 2.5s
- ✅ CLS < 0.1
- ✅ FID < 100ms

## Accessibility

### Features

- **Reduced Motion Support**: Simplified layout for users who prefer reduced motion
- **Keyboard Navigation**: All images are keyboard accessible
- **Screen Reader Support**: Proper alt text and ARIA labels
- **Focus Management**: Maintains focus during scroll transitions

### Testing

Tested with:
- VoiceOver (macOS/iOS)
- NVDA (Windows)
- JAWS (Windows)
- Keyboard-only navigation

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Mobile 90+

## Development

### Debug Mode

In development, a debug panel shows current scroll phase and image count:

```
Phase: grid-scroll
Images: 13
```

### Testing Locally

```bash
npm run dev
```

Then navigate to `http://localhost:3000` and scroll down to see the effect.

### API Endpoint

Test the DAM integration:

```
GET http://localhost:3000/api/dam/grid-scroller
```

## File Structure

```
src/components/HeroArchwayReveal/
├── index.tsx                 # Main component
├── ImageMosaic.tsx           # Grid layout
├── ArchwayMask.tsx           # SVG archway shape (future)
├── types.ts                  # TypeScript interfaces
├── utils.ts                  # Layout calculations
├── hooks/
│   ├── useGridImages.ts      # DAM integration
│   ├── useScrollPhases.ts    # Scroll tracking
│   ├── useMosaicLayout.ts    # Grid layout
│   └── useReducedMotion.ts   # Accessibility
└── animations/
    └── index.ts              # Animation configs
```

## Troubleshooting

### Images Not Loading

1. Check DAM category exists: `website/grid-scroller`
2. Verify images are tagged correctly
3. Check API endpoint: `/api/dam/grid-scroller`
4. Review browser console for errors

### Animations Not Smooth

1. Check device performance (use Chrome DevTools Performance tab)
2. Reduce number of images (< 20 recommended)
3. Ensure images are optimized (< 500KB each)
4. Test on different network speeds

### Layout Issues

1. Verify aspect ratios are correct in DAM metadata
2. Check responsive breakpoints match your design
3. Test on various screen sizes
4. Review CSS Grid configuration

## Future Enhancements

- [ ] Add video support in grid
- [ ] Implement custom archway SVG shapes
- [ ] Add lightbox for image viewing
- [ ] Support for multiple key images (carousel)
- [ ] Add filtering/sorting options
- [ ] Implement virtual scrolling for very large grids

## Credits

Built with:
- [Framer Motion](https://www.framer.com/motion/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

Inspired by magazine-style layouts and cinematic scroll experiences.
