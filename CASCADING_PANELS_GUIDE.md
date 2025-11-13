# Cascading Panel System

A hierarchical, context-aware booking flow where panels stack vertically and maintain parent-child relationships.

## Architecture

### Panel Hierarchy (4 Levels)

1. **Level 1**: Entry points
   - `book-now` - Main booking entry point
   - `browse-services` - Service browsing entry
   - `browse-team` - Team browsing entry

2. **Level 2**: Category selection
   - `category-picker` - Select service categories (Lashes, Brows, Waxing, etc.)

3. **Level 3**: Subcategory + services
   - `subcategory-services` - Tabs for subcategories + horizontal scrolling service cards

4. **Level 4**: Detail panels
   - `service-detail` - Full service info, provider selection, DAM gallery
   - `provider-detail` - Provider portfolio and details
   - `schedule` - Appointment booking (to be built)

## User Flow

```
Click "Book Now"
  → BookNowPanel (Level 1)
    → CategoryPickerPanel (Level 2)
      → SubcategoryServicePanel (Level 3, one per selected category)
        → ServiceDetailPanel (Level 4)
          → SchedulePanel (Level 4)
```

## Components

### Core System

- **CascadingPanelContext** (`src/contexts/CascadingPanelContext.tsx`)
  - State management with reducer
  - Event bus for panel events
  - Panel CRUD operations (open, close, collapse, expand)
  - Accepts `services` prop to provide real data to all panels

- **CascadingPanelContainer** (`src/components/cascading-panels/CascadingPanelContainer.tsx`)
  - Main rendering container
  - Drawer-aware positioning (respects header + docked drawers)
  - Renders panels by level for proper z-ordering
  - Scrollable with backdrop overlay

- **PanelWrapper** (`src/components/cascading-panels/PanelWrapper.tsx`)
  - Reusable wrapper with consistent styling
  - Collapse/expand functionality
  - Close button with cascading child closure
  - Framer Motion animations with stagger delays

### Panel Components

All panels in `src/components/cascading-panels/panels/`:

- **BookNowPanel** - Entry point with "Get Started" button
- **CategoryPickerPanel** - Grid of selectable categories built from real services
- **SubcategoryServicePanel** - Tabs + horizontal scrolling service cards
- **ServiceDetailPanel** - Service details, DAM gallery, provider selection

## Integration

### 1. Wrap with Provider

```tsx
// In your page component
<CascadingPanelProvider services={services}>
  <CascadingPanelContainer />
  {/* Your page content */}
</CascadingPanelProvider>
```

### 2. Trigger Panel Flow

```tsx
import { useCascadingPanels } from '@/contexts/CascadingPanelContext';

function MyComponent() {
  const { actions } = useCascadingPanels();

  return (
    <button onClick={() => actions.openPanel('book-now', { entryPoint: 'hero' })}>
      Book Now
    </button>
  );
}
```

## Data Flow

1. **Services** are fetched server-side and passed to `CascadingPanelProvider`
2. **CategoryPickerPanel** builds category hierarchy from services using `useMemo`
3. **SubcategoryServicePanel** receives filtered services when opened
4. **ServiceDetailPanel** receives individual service with full details + DAM gallery

## Styling

- Uses glass morphism: `className="glass"` (backdrop-blur effects)
- Theme colors: `dusty-rose`, `warm-sand`, `sage`, `ocean-mist`, `dune`
- Framer Motion animations with easing: `[0.22, 1, 0.36, 1]`
- Stagger delays: `panel.position * 0.05`

## Viewport Awareness

The system is **drawer-aware**:
- Calculates available height based on docked drawer positions
- Respects header height
- Updates dimensions when drawers change state
- Provides proper scrolling within available space

## Current Status

✅ Complete:
- Core architecture (types, context, container, wrapper)
- 4 panels built (BookNow, CategoryPicker, SubcategoryService, ServiceDetail)
- Real service data integration
- Hero "Book Now" button triggers flow

🚧 To Build:
- SchedulePanel (appointment booking)
- ProviderDetailPanel (team member portfolio from panel)
- ProviderServicesPanel (services offered by specific provider)
- Mobile responsive optimizations
- Keyboard navigation

## Example: Adding a New Panel

```tsx
// 1. Add type to src/types/cascading-panels.ts
export type PanelType =
  | 'my-new-panel' // Level 3
  | ...;

// 2. Create panel component
export function MyNewPanel({ panel }: { panel: PanelStackItem }) {
  const { state, actions } = useCascadingPanels();
  const data = panel.data as MyPanelData;

  return (
    <PanelWrapper panel={panel} title="My Panel">
      {/* Panel content */}
    </PanelWrapper>
  );
}

// 3. Add to CascadingPanelContainer.tsx
import { MyNewPanel } from './panels/MyNewPanel';

// In render:
{panel.type === 'my-new-panel' && <MyNewPanel panel={panel} />}

// 4. Update openPanel level mapping in CascadingPanelContext.tsx
if (type === 'my-new-panel') level = 3;
```

## Files Modified

**New Files:**
- `src/types/cascading-panels.ts` - Type definitions
- `src/contexts/CascadingPanelContext.tsx` - State management
- `src/components/cascading-panels/CascadingPanelContainer.tsx` - Main container
- `src/components/cascading-panels/PanelWrapper.tsx` - Reusable wrapper
- `src/components/cascading-panels/panels/BookNowPanel.tsx`
- `src/components/cascading-panels/panels/CategoryPickerPanel.tsx`
- `src/components/cascading-panels/panels/SubcategoryServicePanel.tsx`
- `src/components/cascading-panels/panels/ServiceDetailPanel.tsx`

**Modified Files:**
- `src/app/landing-v2/LandingPageV2Client.tsx` - Added providers and container
- `src/components/landing-v2/HeroSection.tsx` - "Book Now" button triggers panels

## API Reference

### CascadingPanelActions

```typescript
interface CascadingPanelActions {
  // Panel operations
  openPanel: (type: PanelType, data: any, options?: OpenPanelOptions) => string;
  closePanel: (panelId: string, closeChildren?: boolean) => void;
  collapsePanel: (panelId: string) => void;
  expandPanel: (panelId: string) => void;

  // Category management
  toggleCategory: (categoryId: string, categoryName: string) => void;
  selectSubcategory: (categoryId: string, subcategoryId: string, subcategoryName: string) => void;

  // Selection tracking
  selectService: (serviceId: string) => void;
  selectProvider: (providerId: string) => void;

  // Navigation
  scrollToPanel: (panelId: string) => void;
  closeAllPanels: () => void;
  closePanelsFromLevel: (level: number) => void;
}
```

### OpenPanelOptions

```typescript
interface OpenPanelOptions {
  parentId?: string;          // Parent panel ID for hierarchy
  replaceExisting?: boolean;  // Replace existing panel of same type
  closeChildren?: boolean;    // Close children when closing this panel
  scrollIntoView?: boolean;   // Auto-scroll to panel when opened
}
```
