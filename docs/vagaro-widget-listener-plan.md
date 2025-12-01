# Vagaro Widget Event Listener Service - Implementation Plan

## Overview

This document outlines the plan for implementing a Vagaro widget event listener service that:
1. Provides easy toggle flags for enabling/disabling specific event listeners
2. Enables dynamic widget crop adjustment based on booking flow step
3. Maintains widget state across panel open/close cycles

---

## Part 1: Event Listener Service Architecture

### Design Goals
- **Zero-config for consumers**: Components just import and use
- **Toggleable listeners**: Simple boolean flags to enable/disable events
- **Type-safe**: Full TypeScript support for all events
- **Centralized state**: Single source of truth for widget state
- **React-friendly**: Hooks-based API with proper cleanup

### File Structure

```
src/
├── lib/
│   └── vagaro-events/
│       ├── index.ts              # Public exports
│       ├── types.ts              # Event type definitions
│       ├── config.ts             # Toggle flags configuration
│       ├── listener.ts           # Core postMessage listener
│       └── state-machine.ts      # Booking flow state machine
├── contexts/
│   └── VagaroWidgetContext.tsx   # React context for widget state
└── hooks/
    └── useVagaroEvents.ts        # Consumer hook
```

### Toggle Configuration (`config.ts`)

```typescript
/**
 * Vagaro Widget Event Listener Configuration
 *
 * Toggle individual event listeners on/off.
 * When an event is disabled, the listener ignores it (no processing, no state updates).
 */
export const VAGARO_EVENT_CONFIG = {
  // ============================================================================
  // LIFECYCLE EVENTS
  // ============================================================================
  /** Widget finished loading */
  WidgetLoaded: true,

  // ============================================================================
  // NAVIGATION EVENTS
  // ============================================================================
  /** User clicked a tab (Services, Classes, Gift Cards) */
  TabClicked: false,

  // ============================================================================
  // SERVICE SELECTION EVENTS
  // ============================================================================
  /** User clicked "Book Now" or "Request" on a service */
  BookNowClicked: true,    // ENABLED: Needed for crop adjustment

  /** User searched for a service */
  ServiceSearched: false,

  // ============================================================================
  // SCHEDULING EVENTS
  // ============================================================================
  /** User selected a time slot */
  TimeSlotClicked: true,   // ENABLED: Needed for crop adjustment

  // ============================================================================
  // FORM EVENTS
  // ============================================================================
  /** Form was displayed to user */
  FormViewed: true,        // ENABLED: Needed for crop adjustment

  /** User submitted form response */
  FormResponseSubmitted: true,  // ENABLED: Needed for crop adjustment

  // ============================================================================
  // AUTHENTICATION EVENTS
  // ============================================================================
  /** User logged in */
  CustomerLogin: true,     // ENABLED: Needed for crop adjustment

  // ============================================================================
  // PAYMENT EVENTS
  // ============================================================================
  /** Credit card form displayed */
  CreditCardCaptureViewed: true,  // ENABLED: Needed for crop adjustment

  /** Gift card applied */
  GiftCardApplied: false,

  /** Promo code applied */
  PromoCodeApplied: false,

  // ============================================================================
  // BOOKING COMPLETION
  // ============================================================================
  /** Booking successfully completed */
  BookingCompleted: true,  // ENABLED: Needed for success state

  // ============================================================================
  // CART EVENTS
  // ============================================================================
  /** Product added to cart */
  ProductAddedToCart: false,

  /** Product removed from cart */
  ProductRemovedFromCart: false,
} as const;

export type VagaroEventName = keyof typeof VAGARO_EVENT_CONFIG;
```

### Usage Example

To enable/disable a listener, simply change the boolean:

```typescript
// Before: Not listening to TabClicked
TabClicked: false,

// After: Now listening to TabClicked
TabClicked: true,
```

---

## Part 2: Booking Flow State Machine

### User Flow Mapping

Based on your description of the current flow:

```
Step 0: WIDGET_LOADED    → Widget initializes
Step 1: SERVICE_SELECTED → User clicks "Request" on service
Step 2: CALENDAR_VIEW    → Calendar with providers loads
Step 3: LOGIN_VIEW       → Login screen appears
Step 4: BOOKING_FORM     → Service booking form (may include questionnaire)
Step 5: PAYMENT_VIEW     → Credit card capture (if required)
Step 6: COMPLETED        → Booking confirmed
```

### State Machine Definition

```typescript
export type BookingFlowStep =
  | 'idle'
  | 'widget_loaded'
  | 'service_selected'
  | 'calendar_view'
  | 'login_view'
  | 'form_view'
  | 'payment_view'
  | 'completed';

export interface VagaroWidgetState {
  currentStep: BookingFlowStep;
  customerId: string | null;
  selectedService: string | null;
  selectedProvider: string | null;
  selectedTimeSlot: number | null;
  timestamp: number;
}

// Event → State transitions
const STATE_TRANSITIONS: Record<string, BookingFlowStep> = {
  'WidgetLoaded': 'widget_loaded',
  'BookNowClicked': 'service_selected',
  'TimeSlotClicked': 'calendar_view',  // After selecting time, still on calendar
  'CustomerLogin': 'login_view',       // Login completed
  'FormViewed': 'form_view',
  'CreditCardCaptureViewed': 'payment_view',
  'BookingCompleted': 'completed',
};
```

---

## Part 3: Dynamic Crop Configuration

### Crop Values Per Step

```typescript
export const CROP_CONFIG: Record<BookingFlowStep, CropSettings> = {
  idle: {
    marginTop: -330,      // Default: Hide Vagaro header
    minHeight: 800,
    maskHeight: 30,
  },
  widget_loaded: {
    marginTop: -330,      // Same as idle - service list view
    minHeight: 800,
    maskHeight: 30,
  },
  service_selected: {
    marginTop: -280,      // Slightly less crop - loading state
    minHeight: 700,
    maskHeight: 20,
  },
  calendar_view: {
    marginTop: -250,      // Calendar needs more vertical space
    minHeight: 900,       // Calendar is tall
    maskHeight: 15,
  },
  login_view: {
    marginTop: -200,      // Login form is shorter
    minHeight: 500,
    maskHeight: 10,
  },
  form_view: {
    marginTop: -220,      // Questionnaire form
    minHeight: 700,
    maskHeight: 15,
  },
  payment_view: {
    marginTop: -180,      // Payment form is compact
    minHeight: 450,
    maskHeight: 10,
  },
  completed: {
    marginTop: -150,      // Success message is short
    minHeight: 400,
    maskHeight: 5,
  },
};
```

### CSS Variable Injection

Instead of hardcoding CSS, inject CSS variables that update reactively:

```typescript
// In VagaroWidgetPanel.tsx
const { currentStep } = useVagaroWidgetState();
const cropSettings = CROP_CONFIG[currentStep];

// Inject as CSS custom properties
<div
  style={{
    '--vagaro-crop-margin': `${cropSettings.marginTop}px`,
    '--vagaro-min-height': `${cropSettings.minHeight}px`,
    '--vagaro-mask-height': `${cropSettings.maskHeight}px`,
  } as React.CSSProperties}
>
```

```css
.vagaro-iframe-wrapper {
  margin-top: var(--vagaro-crop-margin, -330px);
}

.vagaro-widget-container iframe {
  min-height: var(--vagaro-min-height, 800px) !important;
}

.vagaro-crop-mask {
  height: var(--vagaro-mask-height, 30px);
}
```

---

## Part 4: State Persistence Across Panel Open/Close

### Problem
When the panel is closed (docked) and reopened, the widget reloads and loses its internal state.

### Solutions

#### Option A: Never Unmount (Recommended)

Keep the widget mounted but hidden when panel is docked:

```typescript
// In VagaroWidgetPanel.tsx
const panel = usePanelStack().state.panels.find(p => p.id === panelId);
const isDocked = panel?.state === 'docked';

return (
  <div style={{ display: isDocked ? 'none' : 'block' }}>
    {/* Widget stays mounted, just hidden */}
    <VagaroWidget />
  </div>
);
```

**Pros:**
- Widget maintains all internal state (user login, form progress, etc.)
- No re-fetch/reload when expanding
- Best UX

**Cons:**
- Multiple widgets stay in DOM if user opens several services
- Slightly higher memory usage

#### Option B: Session Storage Cache

Store the booking flow step and restore on remount:

```typescript
// Save state when unmounting
useEffect(() => {
  return () => {
    sessionStorage.setItem(
      `vagaro-state-${serviceId}`,
      JSON.stringify(widgetState)
    );
  };
}, [widgetState, serviceId]);

// Restore state when mounting
useEffect(() => {
  const cached = sessionStorage.getItem(`vagaro-state-${serviceId}`);
  if (cached) {
    const state = JSON.parse(cached);
    // Apply cached crop settings immediately
    setCurrentStep(state.currentStep);
  }
}, [serviceId]);
```

**Pros:**
- Lower memory footprint
- Works across page refreshes

**Cons:**
- Widget still reloads (user must re-navigate internally)
- Only crop settings are restored, not actual booking progress

#### Option C: URL State Encoding

Encode booking progress in URL hash/params:

```typescript
// When state changes, update URL
useEffect(() => {
  const url = new URL(window.location.href);
  url.searchParams.set('vagaro-step', currentStep);
  window.history.replaceState({}, '', url);
}, [currentStep]);
```

**Pros:**
- Shareable/bookmarkable URLs
- Survives page refresh

**Cons:**
- Doesn't help with widget internal state
- URL clutter

### Recommendation

**Use Option A (Never Unmount)** for the VagaroWidgetPanel:

1. Modify `PanelWrapper` or the panel rendering logic
2. When panel state is `docked`, apply `visibility: hidden` instead of unmounting
3. The widget iframe stays alive, user can pick up where they left off

Implementation:

```typescript
// In PanelStackRenderer.tsx or BottomSheetContainer.tsx
{panels.map(panel => (
  <div
    key={panel.id}
    style={{
      // Hide but keep mounted for vagaro-widget panels
      visibility: panel.state === 'docked' && panel.type === 'vagaro-widget'
        ? 'hidden'
        : 'visible',
      position: panel.state === 'docked' && panel.type === 'vagaro-widget'
        ? 'absolute'
        : 'relative',
      pointerEvents: panel.state === 'docked' ? 'none' : 'auto',
    }}
  >
    <PanelComponent panel={panel} />
  </div>
))}
```

---

## Part 5: Implementation Phases

### Phase 1: Foundation (Est. 2-3 hours)
- [ ] Create `src/lib/vagaro-events/` directory structure
- [ ] Implement `types.ts` with all event interfaces
- [ ] Implement `config.ts` with toggle flags
- [ ] Implement `listener.ts` core postMessage handler

### Phase 2: React Integration (Est. 2 hours)
- [ ] Create `VagaroWidgetContext.tsx`
- [ ] Implement `useVagaroEvents.ts` hook
- [ ] Add provider to app layout

### Phase 3: State Machine (Est. 1-2 hours)
- [ ] Implement `state-machine.ts` with flow transitions
- [ ] Add state persistence logic
- [ ] Test state transitions manually

### Phase 4: Dynamic Cropping (Est. 2-3 hours)
- [ ] Define crop settings per step
- [ ] Update `VagaroWidgetPanel.tsx` to use dynamic CSS vars
- [ ] Add smooth transitions between crop states
- [ ] Test all booking flow steps

### Phase 5: Panel Persistence (Est. 1-2 hours)
- [ ] Modify panel rendering to keep vagaro-widget mounted
- [ ] Test open/close/reopen cycle
- [ ] Verify widget state is maintained

### Phase 6: Testing & Polish (Est. 2 hours)
- [ ] Test full booking flow with dynamic crops
- [ ] Verify all toggle flags work
- [ ] Add error boundaries
- [ ] Performance optimization (debounce state updates)

---

## Appendix: Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     VAGARO WIDGET (iframe)                       │
│                                                                  │
│  User Action ──► Internal Navigation ──► postMessage() ────────►│
└──────────────────────────────────────────────────────────────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PARENT PAGE (lashpop.co)                     │
│                                                                  │
│  window.addEventListener('message') ──► VagaroEventListener     │
│                                                │                 │
│                         ┌──────────────────────┤                 │
│                         ▼                      ▼                 │
│                   Config Check          State Machine            │
│                   (enabled?)            (transition)             │
│                         │                      │                 │
│                         └──────────┬───────────┘                 │
│                                    ▼                             │
│                           VagaroWidgetContext                    │
│                           (React state update)                   │
│                                    │                             │
│                                    ▼                             │
│                        VagaroWidgetPanel                         │
│                        (CSS vars update)                         │
│                                    │                             │
│                                    ▼                             │
│                           Dynamic Crop Applied                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Questions Before Implementation

1. **Crop values**: The specific pixel values in `CROP_CONFIG` are estimates. Do you want to test with the actual widget first to determine optimal values?

2. **Transition animations**: Should the crop change be instant or animated (e.g., 300ms ease)?

3. **Error handling**: If the widget fails to load or an event fails to parse, should we show an error UI or fail silently?

4. **Analytics**: Should we log these events to an analytics service (e.g., track funnel drop-off)?

5. **Multiple widgets**: If a user opens multiple service panels, should each maintain independent state?
