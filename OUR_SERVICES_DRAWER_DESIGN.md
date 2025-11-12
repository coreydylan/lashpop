# Our Services Drawer Design System
## Beautiful, Smart, Multi-Filter Service Navigation

---

## 🎨 Desktop Layout - Full Drawer View

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  OUR SERVICES                                                      [Minimize]  ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  Your Personalized Results:                                                   ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           ┌──────────┐  ║
║  │ 👁 Lashes    │ │ 💉 Injectables│ │ ✨ Natural   │  [Clear]  │ + Add    │  ║
║  │   Volume     │ │    Botox     │ │    Look      │           │  Filter  │  ║
║  └──────────────┘ └──────────────┘ └──────────────┘           └──────────┘  ║
║                                                                                ║
║  ─────────────────────────────────────────────────────────────────────────   ║
║                                                                                ║
║  BROWSE BY CATEGORY                                                           ║
║                                                                                ║
║  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            ║
║  │             │ │             │ │             │ │             │            ║
║  │  👁         │ │  💉         │ │  ✨         │ │  🎨         │            ║
║  │  LASHES     │ │ INJECTABLES │ │   SKINCARE  │ │    BROWS    │            ║
║  │             │ │             │ │             │ │             │            ║
║  │  12 services│ │  8 services │ │  6 services │ │  4 services │            ║
║  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘            ║
║                                                                                ║
║  MATCHING SERVICES (18 Results)                             Sort: Recommended ║
║                                                                                ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  Natural Volume Set                                      👁 LASHES       │ ║
║  │  ────────────────────────────────────────────────────                  │ ║
║  │  2-3D lightweight volume for everyday elegance                          │ ║
║  │                                                                          │ ║
║  │  ⏱ 90-120 min    💰 $175    ⭐ 4.9 (127 reviews)                      │ ║
║  │                                                                          │ ║
║  │  [View Details]                                       [Book Now →]      │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  Baby Botox                                          💉 INJECTABLES    │ ║
║  │  ────────────────────────────────────────────────────                  │ ║
║  │  Subtle, preventative treatment for fine lines                           │ ║
║  │                                                                          │ ║
║  │  ⏱ 30 min        💰 $295    ⭐ 5.0 (89 reviews)                       │ ║
║  │                                                                          │ ║
║  │  [View Details]                                       [Book Now →]      │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📱 Mobile Layout - Optimized for Touch

```
╔════════════════════════╗
║ OUR SERVICES      [−]  ║
╠════════════════════════╣
║ Active Filters (3)     ║
║ ┌────────┐ ┌────────┐ ║
║ │Lashes ×│ │Botox  ×│ ║
║ └────────┘ └────────┘ ║
║ ┌────────┐             ║
║ │Natural ×│ [+ Add]   ║
║ └────────┘             ║
╟────────────────────────╢
║ Categories             ║
║ ┌──────────────────┐   ║
║ │ 👁 Lashes (12)   │   ║
║ └──────────────────┘   ║
║ ┌──────────────────┐   ║
║ │ 💉 Inject. (8)   │   ║
║ └──────────────────┘   ║
║ ┌──────────────────┐   ║
║ │ ✨ Skincare (6)  │   ║
║ └──────────────────┘   ║
╟────────────────────────╢
║ 18 Matches  [Sort ▼]  ║
╟────────────────────────╢
║ ┌──────────────────┐   ║
║ │Natural Volume Set│   ║
║ │ 👁 • 90min • $175│   ║
║ │ ⭐⭐⭐⭐⭐ 4.9    │   ║
║ │   [Book Now →]   │   ║
║ └──────────────────┘   ║
║ ┌──────────────────┐   ║
║ │ Baby Botox       │   ║
║ │ 💉 • 30min • $295│   ║
║ │ ⭐⭐⭐⭐⭐ 5.0    │   ║
║ │   [Book Now →]   │   ║
║ └──────────────────┘   ║
╚════════════════════════╝
```

---

## 🔍 Navigation Hierarchy & Smart Titles

### Category Deep Dive View

When user clicks into "Lashes" category:

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  [← Back] > LASHES                                                            ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  Subcategories:                                                               ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        ║
║  │   CLASSIC    │ │    VOLUME    │ │ MEGA VOLUME  │ │  LIFT & TINT │        ║
║  │  3 services  │ │  4 services  │ │  3 services  │ │  2 services  │        ║
║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

When user clicks into "Mega Volume":

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  [← Back] > Lashes > MEGA VOLUME                                              ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  Full Set                                        👁 Lashes • Mega Volume │ ║
║  │  ────────────────────────────────────────────────────                   │ ║
║  │  Maximum drama with 6D-10D fans                                          │ ║
║  │  ⏱ 150-180 min    💰 $295                                              │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  Fill                                            👁 Lashes • Mega Volume │ ║
║  │  ────────────────────────────────────────────────────                   │ ║
║  │  Maintain your mega volume (2-3 week touch-up)                           │ ║
║  │  ⏱ 90-120 min     💰 $125                                              │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Note the smart titles:**
- Service shows as "Full Set" not "Mega Volume Full Set"
- Context breadcrumb shows full path
- Category badge shows abbreviated path

---

## 🎯 Multi-Filter System

### Filter Combination Logic

```typescript
interface ServiceFilter {
  categories: string[];      // ["lashes", "injectables"]
  subcategories: string[];   // ["volume", "botox"]
  preferences: string[];     // ["natural", "dramatic"]
  priceRange?: [number, number];
  duration?: [number, number];
}

// Example: User wants both lashes AND botox
const userFilters: ServiceFilter = {
  categories: ["lashes", "injectables"],
  subcategories: ["volume", "botox"],
  preferences: ["natural"],
  priceRange: [100, 400],
  duration: [30, 120]
};
```

### Visual Filter Builder

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  BUILD YOUR FILTER                                                            ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  What are you interested in? (Select all that apply)                          ║
║                                                                                ║
║  ☑ Lashes          ☑ Injectables     ☐ Skincare      ☐ Brows                 ║
║                                                                                ║
║  For Lashes:                          For Injectables:                        ║
║  ☐ Classic         ☐ Lift & Tint     ☑ Botox         ☐ Fillers              ║
║  ☑ Volume          ☐ Removal         ☐ Sculptra      ☐ PRP                  ║
║  ☐ Mega Volume                                                                ║
║                                                                                ║
║  Your Style:                          Budget:                                 ║
║  ☑ Natural         ☐ Dramatic        [$100 ────────○──── $500]              ║
║  ☐ Everyday        ☐ Special                                                  ║
║                                                                                ║
║  Time Available:                                                              ║
║  [30 min ──────○────────── 180 min]                                          ║
║                                                                                ║
║                              [Apply Filters]  [Clear All]                     ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎨 Filter Pills & Tags

### Active Filter Display
```
Active Filters:
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ 👁 Lashes      │ │ 💉 Botox       │ │ ✨ Natural     │
│      ×         │ │      ×         │ │      ×         │
└────────────────┘ └────────────────┘ └────────────────┘

When hovering/long-press:
┌────────────────────────┐
│ Remove this filter     │
│ Edit filter settings   │
│ Apply only this filter │
└────────────────────────┘
```

---

## 📊 Smart Title Algorithm

```javascript
function getSmartServiceTitle(service, currentPath) {
  const fullTitle = service.name; // "Mega Volume Full Set"
  const pathSegments = currentPath.map(p => p.toLowerCase()); // ["lashes", "mega volume"]

  // Remove redundant words that appear in the current path
  let smartTitle = fullTitle;

  pathSegments.forEach(segment => {
    const words = segment.split(' ');
    words.forEach(word => {
      // Case-insensitive replacement of redundant words
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      smartTitle = smartTitle.replace(regex, '').trim();
    });
  });

  // Clean up extra spaces and capitalize
  smartTitle = smartTitle.replace(/\s+/g, ' ').trim();

  return smartTitle || fullTitle; // Fallback to full title if empty
}

// Examples:
// Path: ["Lashes", "Mega Volume"]
// "Mega Volume Full Set" → "Full Set"
// "Mega Volume Fill" → "Fill"
// "Mega Volume Removal" → "Removal"

// Path: ["Injectables", "Botox"]
// "Botox Forehead" → "Forehead"
// "Botox Crow's Feet" → "Crow's Feet"
// "Baby Botox Full Face" → "Baby Full Face"
```

---

## 🔄 Filter Persistence & State

### From Quiz to Services
```
QUIZ RESULTS                      →    SERVICE FILTERS
─────────────────────────────────────────────────────────
Category: Volume Lashes           →    categories: ["lashes"]
Experience: First-timer           →    subcategories: ["volume"]
Style: Natural Look              →    preferences: ["natural", "beginner-friendly"]
                                       priceRange: [150, 250] // Adjusted for beginners
```

### Filter State Management
```typescript
interface DrawerState {
  activeFilters: ServiceFilter;
  filterHistory: ServiceFilter[]; // For undo/redo
  savedFilters: {
    name: string;
    filter: ServiceFilter;
  }[];
  quickFilters: ServiceFilter[]; // Pre-built common combinations
}

// Quick filter presets
const quickFilters = [
  {
    name: "First Visit",
    filter: {
      categories: ["lashes"],
      preferences: ["natural", "beginner-friendly"]
    }
  },
  {
    name: "Maintenance",
    filter: {
      subcategories: ["fill", "touch-up", "removal"]
    }
  },
  {
    name: "Special Event",
    filter: {
      preferences: ["dramatic", "glamorous"],
      duration: [120, 240]
    }
  },
  {
    name: "Lunch Break",
    filter: {
      duration: [15, 45],
      categories: ["injectables", "skincare"]
    }
  }
];
```

---

## 🎯 Mobile-Specific Optimizations

### Swipe Gestures
```
                 Swipe Right
    [Filters] ←─────────────→ [Categories]
                 Swipe Left

    ┌──────────────────────┐
    │                      │
    │   Service Card       │  ← Swipe up for details
    │                      │  ← Swipe right to save
    │   [Book Now]         │  ← Tap to book
    │                      │
    └──────────────────────┘
```

### Bottom Sheet Filters (Mobile)
```
╔════════════════════════╗
║         Handle         ║ ← Drag to expand
╠════════════════════════╣
║ 3 Active Filters       ║
║ ────────────────────   ║
║ Lashes • Botox • Natural║
╟────────────────────────╢
↓  Expands to full filter ↓
```

---

## 🎨 Visual Hierarchy & Typography

### Service Card Information Architecture
```
Priority 1: Service Name (Smart Title)     24px Bold
Priority 2: Description                    16px Regular
Priority 3: Duration • Price               14px Medium
Priority 4: Rating • Reviews               12px Regular
Priority 5: Category Badge                 10px Uppercase

Color Coding:
- Active filters: Primary brand color with 10% opacity background
- Categories: Icon color coding (👁 = purple, 💉 = blue, etc.)
- Price: Green for deals, standard for regular
- Availability: Green (available), Orange (limited), Red (booked)
```

---

## 💡 Smart Features

### 1. Contextual Recommendations
```
"Since you selected Natural Lashes + Botox, you might like:"
- Lash Lift & Tint (enhances natural lashes)
- Baby Botox (subtle, natural-looking results)
```

### 2. Filter Conflicts Resolution
```
⚠️ "Dramatic Look" and "Natural Look" are conflicting preferences.
   Would you like to:
   [ ] See all options
   [ ] Keep Natural only
   [ ] Keep Dramatic only
```

### 3. Smart Grouping
When multiple filters are active, services are grouped:
```
PERFECT MATCHES (5)         // Matches all filters
- Natural Volume Set
- Baby Botox
- ...

PARTIAL MATCHES (12)        // Matches some filters
- Classic Full Set (matches: Lashes, Natural)
- Lip Flip (matches: Injectables)
- ...
```

### 4. Search Within Filters
```
╔═══════════════════════════════════════════════════════════════╗
║ 🔍 Search within 18 filtered results...                       ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🚀 Implementation Notes

1. **Performance**: Virtual scrolling for large service lists
2. **Accessibility**: Full keyboard navigation, ARIA labels
3. **Analytics**: Track filter combinations for personalization
4. **Caching**: Remember user's filter preferences
5. **Deep Linking**: Share filtered views via URL parameters

This design creates a beautiful, intuitive service navigation system that adapts perfectly to both desktop and mobile, handles complex multi-filter scenarios, and smartly presents information without redundancy.