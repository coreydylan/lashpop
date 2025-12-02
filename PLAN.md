# Hero Arch Slideshow Feature Plan

## Overview

Transform the hero arch image into a premium slideshow system with:
- Multiple beautiful transition effects (WebGL shaders, Ken Burns, crossfade, slide, etc.)
- Scroll/swipe navigation (matching Instagram carousel behavior)
- Auto-advance capability with timing controls
- Configuration presets that can be saved/loaded and applied to desktop/mobile separately
- Full admin panel for managing all settings

---

## Architecture

### 1. Database Schema

Add a new section to `website_settings` table:

```typescript
// Section: 'hero_slideshow_configs' - stores saved configuration presets
interface SlideshowConfigPreset {
  id: string                    // UUID
  name: string                  // "Default", "Ken Burns Classic", etc.
  images: SlideshowImage[]      // Array of images with per-image settings
  transition: TransitionConfig
  timing: TimingConfig
  navigation: NavigationConfig
  createdAt: string
  updatedAt: string
}

// Section: 'hero_slideshow_assignments' - which preset is active for desktop/mobile
interface SlideshowAssignments {
  desktop: string | null        // Preset ID or null (falls back to single image)
  mobile: string | null         // Preset ID or null
}
```

### 2. Type Definitions

```typescript
// Individual image in the slideshow
interface SlideshowImage {
  id: string
  assetId: string
  url: string
  fileName: string
  position: { x: number; y: number }   // Object position
  objectFit: 'cover' | 'contain'
  kenBurns?: {                         // Optional per-image Ken Burns override
    startScale: number
    endScale: number
    startPosition: { x: number; y: number }
    endPosition: { x: number; y: number }
  }
}

// Transition effect configuration
interface TransitionConfig {
  type: TransitionType
  duration: number              // ms (500-3000 typical)
  easing: string               // 'ease', 'ease-in-out', 'linear', custom cubic-bezier
  // WebGL-specific options
  webglTransition?: string     // Name from gl-transitions (e.g., 'morph', 'crosswarp')
  webglParams?: Record<string, number>  // Transition-specific parameters
}

type TransitionType =
  | 'fade'           // Simple crossfade
  | 'slide'          // Horizontal slide
  | 'slideUp'        // Vertical slide up
  | 'kenBurns'       // Zoom/pan during fade
  | 'webgl'          // WebGL shader transition
  | 'morph'          // Image morph effect
  | 'blur'           // Blur transition
  | 'zoom'           // Zoom in/out transition
  | 'wipe'           // Wipe from edge
  | 'dissolve'       // Dissolve/pixel effect

// Timing configuration
interface TimingConfig {
  autoAdvance: boolean
  interval: number              // ms between slides (3000-10000 typical)
  pauseOnHover: boolean
  pauseOnInteraction: boolean   // Pause when user scrolls/swipes
  resumeDelay: number           // ms before resuming after interaction
}

// Navigation configuration
interface NavigationConfig {
  scrollEnabled: boolean        // Respond to scroll wheel
  swipeEnabled: boolean         // Respond to touch swipe
  scrollSensitivity: number     // 0.5-2.0, affects scroll speed
  snapBehavior: 'immediate' | 'momentum'  // Snap on release vs momentum scroll
  showIndicators: boolean       // Dot indicators
  indicatorPosition: 'bottom' | 'side' | 'hidden'
}
```

### 3. Component Architecture

```
src/
├── components/
│   └── landing-v2/
│       ├── HeroArchSlideshow.tsx          # Main slideshow component
│       ├── slideshow/
│       │   ├── SlideshowImage.tsx         # Individual slide with Ken Burns
│       │   ├── SlideshowTransition.tsx    # Handles transition animations
│       │   ├── SlideshowWebGLLayer.tsx    # WebGL shader transitions
│       │   ├── SlideshowIndicators.tsx    # Navigation dots
│       │   └── useSlideshowController.ts  # State/timing/navigation hook
│       └── MobileHeroBackground.tsx       # Updated to use slideshow
│
├── app/
│   ├── admin/website/hero/
│   │   └── page.tsx                       # Updated admin panel
│   └── api/
│       └── admin/website/
│           ├── hero-slideshow-configs/
│           │   └── route.ts               # CRUD for presets
│           └── hero-slideshow-assignments/
│               └── route.ts               # Desktop/mobile assignments
│
├── actions/
│   └── hero-slideshow.ts                  # Server actions
│
└── hooks/
    └── useSlideshowNavigation.ts          # Scroll/swipe hook (like useCarouselWheelScroll)
```

### 4. Transition Implementation Strategy

#### GSAP-based transitions (Ken Burns, fade, slide):
- Use GSAP's `gsap.to()` with timeline for complex sequences
- Ken Burns: Animate `scale` and `objectPosition` simultaneously
- Crossfade: Overlap two images, animate opacity

#### WebGL Shader transitions:
- Install `react-gl-transition-image` for ready-made effects
- The library accepts a `progress` prop (0-1) which we control via GSAP
- Available effects: morph, glitch, ripple, crosswarp, directional wipe, etc.

```typescript
// Example: GSAP controlling WebGL transition progress
gsap.to(progressRef, {
  current: 1,
  duration: config.transition.duration / 1000,
  ease: config.transition.easing,
  onUpdate: () => setProgress(progressRef.current)
})
```

### 5. Navigation System

Reuse the pattern from Instagram carousel:
- Hover detection to activate wheel scroll
- Convert vertical wheel delta to horizontal navigation
- Touch swipe detection for mobile
- Momentum/physics-based scrolling option

Key difference from carousel: This is a slideshow (discrete slides) not continuous scroll.
- Each scroll gesture advances one slide
- Option for momentum mode where fast scroll = multiple slides

---

## Admin Panel Design

### Main Tabs:
1. **Current Settings** - Quick view of what's active on desktop/mobile
2. **Configuration Library** - List of saved presets with preview
3. **Create/Edit Preset** - Full editor for slideshow configuration

### Preset Editor Sections:

#### Images Panel
- Drag-drop reorder
- Add from DAM
- Per-image position controls
- Per-image Ken Burns settings

#### Transition Panel
- Dropdown to select transition type
- Preview button to see effect
- Duration slider
- Easing selector
- WebGL-specific: Sub-dropdown for shader type + parameters

#### Timing Panel
- Auto-advance toggle
- Interval slider (3-15 seconds)
- Pause on hover toggle
- Pause on interaction toggle
- Resume delay slider

#### Navigation Panel
- Scroll enabled toggle
- Swipe enabled toggle
- Sensitivity slider
- Snap behavior selector
- Indicators toggle + position

#### Preview
- Live preview of the slideshow with current settings
- Device toggle (desktop/mobile aspect ratio)

### Assignment Panel
- Two dropdowns: Desktop Preset, Mobile Preset
- "Same as desktop" checkbox for mobile
- Preview of each assignment

---

## Implementation Phases

### Phase 1: Foundation
1. Install `react-gl-transition-image` package
2. Create type definitions file
3. Create database API routes for presets
4. Create server actions

### Phase 2: Core Slideshow Component
1. Build `HeroArchSlideshow.tsx` with basic fade transition
2. Build `useSlideshowController.ts` hook for timing/state
3. Integrate with HeroSection (desktop) and MobileHeroBackground

### Phase 3: Transitions
1. Implement GSAP-based transitions (fade, slide, kenBurns)
2. Integrate WebGL transitions layer
3. Build transition preview system

### Phase 4: Navigation
1. Build `useSlideshowNavigation.ts` hook
2. Add scroll/wheel support
3. Add swipe support for mobile
4. Add navigation indicators

### Phase 5: Admin Panel
1. Update existing hero admin page structure
2. Build preset library management
3. Build preset editor with all panels
4. Build assignment controls

### Phase 6: Polish
1. Add loading states and error handling
2. Add transition preview animations in admin
3. Performance optimization (preload images, lazy WebGL)
4. Testing on various devices

---

## Dependencies to Add

```json
{
  "react-gl-transition-image": "^x.x.x"
}
```

Note: We already have GSAP, Framer Motion, and Three.js installed.

---

## Migration Path

The existing `HeroArchwayConfig` (single image per device) will remain as a fallback:
- If no slideshow preset is assigned → use single image config
- This ensures backwards compatibility

---

## Questions Resolved

1. **Device configs**: Separate presets for desktop/mobile, but presets are reusable (can assign same preset to both)
2. **Transitions**: Full library of effects - GSAP for standard, WebGL shaders for premium
3. **Navigation**: Transition type dictates scroll behavior (discrete vs momentum)
