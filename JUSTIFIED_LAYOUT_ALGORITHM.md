# Justified Layout Algorithm

## Overview

The Photo Grid Scroller now uses a **justified layout algorithm** (similar to Google Photos or Flickr) that creates a perfect-fit mosaic where images of different sizes fill the container with **zero gaps**.

## How It Works

### Algorithm Steps

1. **Row Grouping**
   - Images are grouped into rows
   - Each row is filled until reaching target row height
   - Algorithm considers aspect ratios to optimize spacing

2. **Width Scaling**
   - Each row is scaled to exactly match container width
   - Images in the row are proportionally adjusted
   - Maintains aspect ratios while ensuring perfect fit

3. **Height Adjustment**
   - Row heights are clamped between min/max values
   - Last row is adjusted to reach exactly 1 viewport height
   - Creates seamless top-to-bottom fill

4. **Dynamic Recalculation**
   - Layout recalculates on window resize
   - Automatically adjusts when images are added/removed
   - Maintains perfect fit at all times

## Key Features

### Zero Gaps
- Images fit edge-to-edge horizontally
- No vertical gaps between rows
- 100% width utilization

### Aspect Ratio Preservation
- Images maintain their natural proportions
- Minimal cropping (only for perfect alignment)
- Honors portrait, landscape, and square formats

### Variable Sizes
- Not all images are the same size
- Creates visual interest and rhythm
- More natural, magazine-style layout

### Performance
- Efficient packing algorithm
- Minimal DOM elements
- GPU-accelerated animations

## Configuration

### Row Height Settings

```typescript
// In ImageMosaicJustified.tsx
const rowHeight = containerWidth < 640 ? 200 : containerWidth < 1024 ? 250 : 300
const maxRowHeight = containerWidth < 640 ? 300 : containerWidth < 1024 ? 350 : 400
const minRowHeight = containerWidth < 640 ? 150 : 200
```

**Adjust these to control:**
- `rowHeight`: Ideal height for rows (smaller = more rows)
- `maxRowHeight`: Maximum allowed row height
- `minRowHeight`: Minimum allowed row height

### Target Height

```typescript
const targetHeight = window.innerHeight // 1vh
```

The algorithm ensures the total grid height equals exactly 1 viewport height.

## Algorithm Comparison

### Before (Grid-based)
```
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │  All images same size
├───┼───┼───┼───┤  Gaps if aspect ratios vary
│ 5 │ 6 │ 7 │ 8 │  Less visually interesting
└───┴───┴───┴───┘
```

### After (Justified)
```
┌─────────┬─────┬───────┐
│    1    │  2  │   3   │  Variable widths
├───┬─────┴─────┴───┬───┤  Perfect edge-to-edge fit
│ 4 │       5       │ 6 │  Dynamic row heights
└───┴───────────────┴───┘  Zero gaps
```

## Image Size Determination

The algorithm intelligently sizes images based on:

1. **Aspect Ratio**
   - Landscape (>1.5): Wider tiles
   - Portrait (<0.7): Taller tiles
   - Square (~1.0): Standard tiles

2. **Position**
   - Key image gets 2x space
   - Strategic placement for visual flow

3. **Available Space**
   - Fits within column constraints
   - Adjusts to remaining row width

## Responsive Behavior

### Mobile (< 640px)
- Smaller row heights (200px target)
- More conservative spacing
- Optimized for vertical scroll

### Tablet (640-1024px)
- Medium row heights (250px target)
- Balanced layout
- Good visual rhythm

### Desktop (> 1024px)
- Larger row heights (300px target)
- Maximum visual impact
- More images per row

## Performance Optimization

### Layout Calculation
- Uses `useMemo` to cache calculations
- Only recalculates on resize or image change
- Efficient row packing algorithm

### Rendering
- Absolute positioning (no flexbox/grid reflow)
- GPU-accelerated transforms
- Lazy loading for off-screen images

### Memory
- Minimal DOM nodes
- Efficient React reconciliation
- No unnecessary re-renders

## Usage Example

```tsx
import { ImageMosaicJustified } from '@/components/HeroArchwayReveal'

<ImageMosaicJustified
  images={gridImages}
  scrollYProgress={scrollYProgress}
/>
```

## Algorithm Source

Located in: `src/components/HeroArchwayReveal/algorithms/justifiedLayout.ts`

### Main Function

```typescript
calculateJustifiedLayout(
  images: GridImage[],
  containerWidth: number,
  targetHeight: number,
  rowHeight?: number,
  maxRowHeight?: number,
  minRowHeight?: number
): JustifiedLayoutResult
```

**Returns:**
```typescript
{
  images: LayoutImage[], // Positioned images
  totalHeight: number,   // Total grid height
  rows: number          // Number of rows
}
```

**LayoutImage:**
```typescript
{
  image: GridImage,
  width: number,   // Calculated width
  height: number,  // Calculated height
  x: number,       // X position
  y: number,       // Y position
  scale: number    // Scale factor
}
```

## Benefits Over Grid Layout

✅ **Visual Appeal**: More natural, magazine-style layout
✅ **Space Efficiency**: Zero wasted space, perfect fit
✅ **Flexibility**: Works with any image count/aspect ratio mix
✅ **Responsiveness**: Adapts beautifully to any screen size
✅ **Performance**: Efficient algorithm, minimal reflows

## Debugging

Enable debug mode in development:

```typescript
// In index.tsx, the debug panel shows:
Phase: grid-scroll
Images: 15
Rows: 4      // Number of rows created
Height: 1080 // Total height (should match viewport)
```

## Future Enhancements

- [ ] Smarter image ordering (size-based)
- [ ] Custom gap support (optional spacing)
- [ ] Variable target heights (not just 1vh)
- [ ] Crop position control (focus point)
- [ ] Lazy row loading for huge galleries

## References

- [Google Photos Layout](https://medium.com/@jtreitz/the-algorithm-for-a-perfectly-balanced-photo-gallery-914c94a5d8af)
- [Flickr Justified View](https://github.com/flickr/justified-layout)
- [Chromatic Gallery](https://github.com/chromaui/chromatic-gallery)
