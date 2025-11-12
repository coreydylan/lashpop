# LashPop Studios Landing Page Redesign Plan
## Layered Drawer Architecture

## 🎯 Executive Summary

This plan transforms the current landing page into a sophisticated three-layer system with interactive drawers that create an engaging, guided user journey from discovery to service selection.

---

## 📐 Architecture Overview

### Z-Index Layer Structure

```
┌─────────────────────────────────────────────────────┐
│  Z-3: HEADER LAYER (Always on top)                 │
│  • Logo • Navigation • Account • Book Now          │
├─────────────────────────────────────────────────────┤
│  Z-2: DRAWER LAYER (Below header, above content)   │
│  • Discover Your Look Drawer                       │
│  • Our Services Drawer                             │
├─────────────────────────────────────────────────────┤
│  Z-1: PAGE SURFACE (Main content)                  │
│  • Hero • About • Team • Contact • Footer          │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Drawer States & Animations

### Three Drawer States

#### 1. INVISIBLE STATE (Off-screen)
```
     ┌─────────────────────────┐
     │       HEADER            │
     └─────────────────────────┘
     ↑ Drawer stored above viewport
─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─
     │    [Drawer Hidden]      │
─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─
     │                         │
     │     PAGE SURFACE        │
     │                         │
```

#### 2. DOCKED STATE (Peeking ~80px or 10vh)
```
┌─────────────────────────────────┐
│           HEADER                │
├─────────────────────────────────┤
│  ╔═══════════════════════════╗  │ ← Docked Drawer (80px height)
│  ║ 🎭 Discover Your Look     ║  │   Shows title & status widget
│  ╚═══════════════════════════╝  │
│                                 │
│        PAGE SURFACE             │
│                                 │
```

#### 3. EXPANDED STATE (Full extension)
```
┌─────────────────────────────────┐
│           HEADER                │
├─────────────────────────────────┤
│  ╔═══════════════════════════╗  │
│  ║  DISCOVER YOUR LOOK        ║  │
│  ║                            ║  │
│  ║  Step 1: Service Type      ║  │ ← Animated slide down
│  ║  [Classic] [Volume] [Mega] ║  │   from top (translateY)
│  ║                            ║  │
│  ║  Step 2: Experience        ║  │   Can extend to 80vh
│  ║  [First Time] [Regular]    ║  │   or full viewport
│  ║                            ║  │
│  ║  Step 3: Style Preference  ║  │
│  ║  [Natural] [Dramatic]      ║  │
│  ║                            ║  │
│  ║  [Complete Quiz →]         ║  │
│  ╚═══════════════════════════╝  │
│        PAGE SURFACE (dimmed)    │ ← Content dimmed/blurred
└─────────────────────────────────┘
```

---

## 🔄 User Journey Flow

### Interaction Sequence Diagram

```
   USER ACTION                    DRAWER BEHAVIOR                   VISUAL STATE

1. Page Load          ──────►    All drawers invisible    ──────►   Clean hero view

2. Click "Discover"   ──────►    Drawer 1 slides down    ──────►   ┌──────┐
   in Hero                       (Invisible → Expanded)            │HEADER│
                                                                    ├──────┤
                                                                    │DRAWER│
                                                                    │  #1  │
                                                                    └──────┘

3. Complete Quiz      ──────►    Drawer 1 → Docked       ──────►   ┌──────┐
                                 Drawer 2 → Expanded               │HEADER│
                                                                    ├──────┤
                                                                    │dock1 │
                                                                    ├──────┤
                                                                    │DRAWER│
                                                                    │  #2  │
                                                                    └──────┘

4. Scroll to          ──────►    Drawer 2 → Docked       ──────►   ┌──────┐
   Services Section                                                │HEADER│
                                                                    ├──────┤
                                                                    │dock1 │
                                                                    ├──────┤
                                                                    │dock2 │
                                                                    └──────┘
```

---

## 📋 Content Reorganization

### DRAWER 1: Discover Your Look
**Current Location:** Service Discovery Quiz section
**New Location:** Drawer Layer
**Content:**
```
┌─────────────────────────────────────────┐
│  DISCOVER YOUR LOOK                      │
├─────────────────────────────────────────┤
│  Find your perfect lash style with our   │
│  personalized quiz                       │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  STEP 1: Service Category       │    │
│  │  ○ Classic Extensions           │    │
│  │  ○ Volume Extensions            │    │
│  │  ○ Mega Volume                  │    │
│  │  ○ Lash Lift & Tint            │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  STEP 2: Experience Level       │    │
│  │  ○ First-timer                  │    │
│  │  ○ Regular client               │    │
│  │  ○ Lash expert                  │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  STEP 3: Desired Look           │    │
│  │  ○ Natural enhancement          │    │
│  │  ○ Everyday glam               │    │
│  │  ○ Dramatic statement           │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [View Recommendations →]                │
└─────────────────────────────────────────┘

When Docked (80px):
┌─────────────────────────────────────────┐
│ 🎭 Your Style: Natural Volume | Edit     │
└─────────────────────────────────────────┘
```

### DRAWER 2: Our Services
**Current Location:** Services Section
**New Location:** Drawer Layer
**Content:**
```
┌─────────────────────────────────────────┐
│  OUR SERVICES                            │
├─────────────────────────────────────────┤
│  Filtered for: Natural Volume Look       │
│                                          │
│  Categories:                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │Volume│ │Hybrid│ │ Lift │ │ Care │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                          │
│  Popular Services:                       │
│  ┌─────────────────────────────────┐    │
│  │ Natural Volume Set               │    │
│  │ 2-3D lightweight volume          │    │
│  │ 90-120 min | $175                │    │
│  │ [Book Now]                       │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Wispy Hybrid Set                 │    │
│  │ Mix of classic & volume          │    │
│  │ 120 min | $195                   │    │
│  │ [Book Now]                       │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘

When Docked (80px):
┌─────────────────────────────────────────┐
│ 📦 4 Services Match Your Style | Explore │
└─────────────────────────────────────────┘
```

### PAGE SURFACE: Reorganized Sections

```
1. HERO SECTION (Enhanced)
   ├── Background video/image
   ├── Headline: "Luxury Lashes, Tailored to You"
   ├── Subheading
   ├── CTA: "Discover Your Look" → Triggers Drawer 1
   └── Secondary CTA: "View Services" → Triggers Drawer 2

2. ABOUT SECTION (Moved up)
   ├── Company mission
   ├── 3 core values with icons
   └── Trust indicators

3. TEAM SECTION
   ├── Team gallery grid
   └── Modal popups for bios

4. TESTIMONIALS
   ├── Client reviews
   └── Before/after gallery

5. CONTACT & LOCATION
   ├── Contact form
   ├── Location map
   └── Hours of operation

6. FOOTER
   └── Standard footer content
```

---

## 💻 Technical Implementation Plan

### File Structure
```
src/
├── app/
│   ├── page.tsx (Modified main page)
│   └── landing-v2/
│       └── page.tsx (New landing page)
├── components/
│   ├── drawers/
│   │   ├── DrawerSystem.tsx
│   │   ├── DrawerContainer.tsx
│   │   ├── DiscoverDrawer.tsx
│   │   ├── ServicesDrawer.tsx
│   │   └── DrawerContext.tsx
│   ├── landing-v2/
│   │   ├── HeroSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── TeamSection.tsx
│   │   └── ContactSection.tsx
│   └── ui/
│       └── drawer-primitives/
```

### Core Components

#### 1. DrawerSystem Component
```typescript
interface DrawerState {
  discover: 'invisible' | 'docked' | 'expanded';
  services: 'invisible' | 'docked' | 'expanded';
  activeDrawer: 'discover' | 'services' | null;
  quizResults: QuizResults | null;
}

// Manages all drawer states and transitions
// Handles z-index layering
// Controls animations and scroll behavior
```

#### 2. Animation System
```css
/* Drawer animations */
.drawer {
  transform: translateY(-100%); /* Invisible */
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer.docked {
  transform: translateY(0);
  height: 80px;
}

.drawer.expanded {
  transform: translateY(0);
  height: auto;
  max-height: 80vh;
}
```

#### 3. Scroll Triggers
```typescript
// Auto-dock service drawer when scrolling past services
const handleScroll = () => {
  const servicesSection = document.getElementById('services');
  if (servicesSection && window.scrollY > servicesSection.offsetTop) {
    setDrawerState('services', 'docked');
  }
};
```

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create drawer system architecture
- [ ] Implement state management
- [ ] Build animation system
- [ ] Set up z-index layering

### Phase 2: Drawer Content (Week 2)
- [ ] Migrate quiz to Discover drawer
- [ ] Migrate services to Services drawer
- [ ] Implement docked state widgets
- [ ] Add drawer interactions

### Phase 3: Page Surface (Week 3)
- [ ] Reorganize remaining sections
- [ ] Update hero with new CTAs
- [ ] Implement scroll triggers
- [ ] Add backdrop dimming

### Phase 4: Polish & Testing (Week 4)
- [ ] Mobile responsiveness
- [ ] Animation tuning
- [ ] Accessibility (ARIA, keyboard nav)
- [ ] Performance optimization

---

## 📱 Mobile Considerations

### Drawer Behavior on Mobile
```
┌─────────────┐
│   HEADER    │ ← Compact mobile header
├─────────────┤
│  DRAWER     │ ← Full width on mobile
│  (Expanded) │ ← Max height: 70vh
│             │ ← Swipe down to close
├─────────────┤
│   SURFACE   │
└─────────────┘
```

- Touch gestures for drawer control
- Reduced docked height (60px)
- Bottom sheet variant option
- Simplified animations

---

## 🎯 Key Benefits

1. **Guided User Journey**: Natural progression from discovery to booking
2. **Persistent Context**: Quiz results stay visible and affect service filtering
3. **Clean Interface**: Drawers hide complexity until needed
4. **Modern UX**: Smooth animations and layered interactions
5. **Conversion Focused**: Reduces friction from interest to booking

---

## 🔄 Migration Strategy

1. **Parallel Development**: Build as `/landing-v2` first
2. **Component Reuse**: Leverage existing service data and team components
3. **A/B Testing**: Run both versions to compare metrics
4. **Gradual Rollout**: Switch based on performance data

---

## Next Steps

1. Review and approve this plan
2. Create detailed component specifications
3. Begin Phase 1 implementation
4. Set up development environment for new page

This architecture creates an engaging, modern experience that guides users through a personalized journey from discovery to booking, while maintaining the sophisticated aesthetic of LashPop Studios.