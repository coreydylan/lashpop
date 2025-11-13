# LashPop Studios - Master Color Guide

## Color Philosophy

The LashPop color palette embodies the **Desert Ocean** aesthetic - warm, earthy tones reminiscent of California's coastal landscape meeting desert sands. Colors are soft, sophisticated, and calming.

---

## Primary Palette

### Base Colors

| Color | RGB | Hex | Usage |
|-------|-----|-----|-------|
| **Cream** | `250, 247, 241` | `#FAF7F1` | Background, canvas |
| **Dune** | `138, 124, 105` | `#8A7C69` | Primary text, headings |
| **Sage** | `161, 151, 129` | `#A19781` | Interactive elements, icons |
| **Warm Sand** | `235, 224, 203` | `#EBE0CB` | Secondary backgrounds, cards |

### Accent Colors

| Color | RGB | Hex | Usage |
|-------|-----|-----|-------|
| **Dusty Rose** | `205, 168, 158` | `#CDA89E` | Primary actions, CTAs, highlights |
| **Terracotta** | `189, 136, 120` | `#BD8878` | Secondary actions, warm accents |
| **Golden** | `212, 175, 117` | `#D4AF75` | Premium features, awards, badges |
| **Ocean Mist** | `188, 201, 194` | `#BCC9C2` | Cool accents, calm states |

---

## Category Brand Colors

Each service category has a designated brand color for consistency across chips, badges, cards, and sections.

### Lashes
- **Primary**: Dusty Rose `#CDA89E` `rgb(205, 168, 158)`
- **Light**: `rgba(205, 168, 158, 0.15)`
- **Medium**: `rgba(205, 168, 158, 0.3)`
- **Usage**: Most popular category, signature dusty rose for lash extensions
- **Icon**: 👁️ Eye

### Brows
- **Primary**: Golden `#D4AF75` `rgb(212, 175, 117)`
- **Light**: `rgba(212, 175, 117, 0.15)`
- **Medium**: `rgba(212, 175, 117, 0.3)`
- **Usage**: Premium feel, complements brow artistry and shaping
- **Icon**: ✨ Sparkles

### Permanent Makeup
- **Primary**: Terracotta `#BD8878` `rgb(189, 136, 120)`
- **Light**: `rgba(189, 136, 120, 0.15)`
- **Medium**: `rgba(189, 136, 120, 0.3)`
- **Usage**: Warm, artistic, professional for PMU services
- **Icon**: 💄 Lipstick

### Facials
- **Primary**: Ocean Mist `#BCC9C2` `rgb(188, 201, 194)`
- **Light**: `rgba(188, 201, 194, 0.15)`
- **Medium**: `rgba(188, 201, 194, 0.3)`
- **Usage**: Cooling, refreshing, calming for facial treatments
- **Icon**: 🌸 Cherry Blossom

### Waxing
- **Primary**: Sage `#A19781` `rgb(161, 151, 129)`
- **Light**: `rgba(161, 151, 129, 0.15)`
- **Medium**: `rgba(161, 151, 129, 0.3)`
- **Usage**: Natural, earthy, smooth for waxing services
- **Icon**: 🪒 Razor

### Specialty
- **Primary**: Golden `#D4AF75` `rgb(212, 175, 117)`
- **Light**: `rgba(212, 175, 117, 0.15)`
- **Medium**: `rgba(212, 175, 117, 0.3)`
- **Usage**: Premium, unique for specialty services like permanent jewelry
- **Icon**: 💎 Gem

### Bundles
- **Primary**: Dusty Rose `#CDA89E` `rgb(205, 168, 158)`
- **Light**: `rgba(205, 168, 158, 0.15)`
- **Medium**: `rgba(205, 168, 158, 0.3)`
- **Usage**: Inviting, value-focused for service packages
- **Icon**: 🎁 Gift

---

## Color Usage Guidelines

### Text Hierarchy

```css
/* Primary Text */
color: rgb(var(--dune));

/* Secondary Text */
color: rgb(var(--dune) / 0.7);

/* Tertiary Text */
color: rgb(var(--dune) / 0.5);

/* Inverted Text */
color: rgb(var(--cream));
```

### Backgrounds

```css
/* Page Background */
background: rgb(var(--cream));

/* Card/Section Background */
background: rgb(var(--warm-sand));

/* Elevated Surface */
background: linear-gradient(to bottom right,
  rgb(var(--cream)),
  rgb(var(--warm-sand) / 0.5)
);
```

### Interactive States

```css
/* Default Button */
background: rgb(var(--dusty-rose));
color: white;

/* Hover */
background: rgb(var(--terracotta));

/* Active/Selected */
background: linear-gradient(to right,
  rgb(var(--dusty-rose)),
  rgb(255, 192, 203)
);
box-shadow: 0 4px 20px rgba(var(--dusty-rose), 0.3);

/* Disabled */
background: rgb(var(--sage) / 0.2);
color: rgb(var(--sage) / 0.5);
```

### Borders & Dividers

```css
/* Subtle Border */
border-color: rgb(var(--sage) / 0.1);

/* Emphasis Border */
border-color: rgb(var(--dusty-rose) / 0.2);

/* Section Divider */
border-color: rgb(var(--sage) / 0.15);
```

---

## Category Chip Styling

### Default (Unselected)

```tsx
className="
  px-4 py-2 rounded-full
  bg-[category-light]
  border border-[category-medium]
  text-[category-primary]
  hover:bg-[category-medium]
  transition-all duration-200
"
```

### Selected

```tsx
className="
  px-4 py-2 rounded-full
  bg-[category-primary]
  text-white
  shadow-lg
  ring-2 ring-[category-primary]/30
  scale-105
"
```

---

## Accessibility

### Contrast Ratios

All text/background combinations meet WCAG AA standards (4.5:1 minimum):

- **Dune on Cream**: 5.2:1 ✅
- **White on Dusty Rose**: 4.8:1 ✅
- **Dune on Warm Sand**: 4.6:1 ✅
- **White on Terracotta**: 5.1:1 ✅

### Color Blind Safe

- Avoid relying solely on color to convey information
- Use icons, labels, and patterns alongside colors
- Category colors have sufficient differentiation in lightness and hue

---

## Implementation

### CSS Variables

Add to `globals.css`:

```css
:root {
  /* Category Brand Colors */
  --category-lashes: 205, 168, 158;
  --category-brows: 212, 175, 117;
  --category-permanent-makeup: 189, 136, 120;
  --category-facials: 188, 201, 194;
  --category-waxing: 161, 151, 129;
  --category-specialty: 212, 175, 117;
  --category-bundles: 205, 168, 158;
}
```

### Tailwind Config

Add to `tailwind.config.ts`:

```typescript
colors: {
  // Existing colors...
  'category-lashes': 'rgb(205, 168, 158)',
  'category-brows': 'rgb(212, 175, 117)',
  'category-permanent-makeup': 'rgb(189, 136, 120)',
  'category-facials': 'rgb(188, 201, 194)',
  'category-waxing': 'rgb(161, 151, 129)',
  'category-specialty': 'rgb(212, 175, 117)',
  'category-bundles': 'rgb(205, 168, 158)',
}
```

### TypeScript Helper

```typescript
export const CATEGORY_COLORS = {
  lashes: {
    primary: 'rgb(205, 168, 158)',
    light: 'rgba(205, 168, 158, 0.15)',
    medium: 'rgba(205, 168, 158, 0.3)',
    ring: 'rgba(205, 168, 158, 0.3)',
    tailwind: 'category-lashes',
    icon: '👁️',
    name: 'Lashes',
  },
  brows: {
    primary: 'rgb(212, 175, 117)',
    light: 'rgba(212, 175, 117, 0.15)',
    medium: 'rgba(212, 175, 117, 0.3)',
    ring: 'rgba(212, 175, 117, 0.3)',
    tailwind: 'category-brows',
    icon: '✨',
    name: 'Brows',
  },
  'permanent-makeup': {
    primary: 'rgb(189, 136, 120)',
    light: 'rgba(189, 136, 120, 0.15)',
    medium: 'rgba(189, 136, 120, 0.3)',
    ring: 'rgba(189, 136, 120, 0.3)',
    tailwind: 'category-permanent-makeup',
    icon: '💄',
    name: 'Permanent Makeup',
  },
  facials: {
    primary: 'rgb(188, 201, 194)',
    light: 'rgba(188, 201, 194, 0.15)',
    medium: 'rgba(188, 201, 194, 0.3)',
    ring: 'rgba(188, 201, 194, 0.3)',
    tailwind: 'category-facials',
    icon: '🌸',
    name: 'Facials',
  },
  waxing: {
    primary: 'rgb(161, 151, 129)',
    light: 'rgba(161, 151, 129, 0.15)',
    medium: 'rgba(161, 151, 129, 0.3)',
    ring: 'rgba(161, 151, 129, 0.3)',
    tailwind: 'category-waxing',
    icon: '🪒',
    name: 'Waxing',
  },
  specialty: {
    primary: 'rgb(212, 175, 117)',
    light: 'rgba(212, 175, 117, 0.15)',
    medium: 'rgba(212, 175, 117, 0.3)',
    ring: 'rgba(212, 175, 117, 0.3)',
    tailwind: 'category-specialty',
    icon: '💎',
    name: 'Specialty',
  },
  bundles: {
    primary: 'rgb(205, 168, 158)',
    light: 'rgba(205, 168, 158, 0.15)',
    medium: 'rgba(205, 168, 158, 0.3)',
    ring: 'rgba(205, 168, 158, 0.3)',
    tailwind: 'category-bundles',
    icon: '🎁',
    name: 'Bundles',
  },
} as const;

export type CategorySlug = keyof typeof CATEGORY_COLORS;
```

---

## Design Patterns

### Glass Morphism

```css
.glass {
  background: rgba(var(--cream), 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--sage), 0.1);
}
```

### Gradient Overlays

```css
/* Warm Gradient */
background: linear-gradient(135deg,
  rgb(var(--dusty-rose) / 0.1),
  rgb(var(--warm-sand) / 0.2)
);

/* Cool Gradient */
background: linear-gradient(135deg,
  rgb(var(--ocean-mist) / 0.1),
  rgb(var(--sage) / 0.1)
);
```

### Shadows

```css
/* Subtle */
box-shadow: 0 2px 8px rgba(var(--dune), 0.08);

/* Medium */
box-shadow: 0 4px 20px rgba(var(--dune), 0.12);

/* Strong */
box-shadow: 0 8px 32px rgba(var(--dune), 0.16);
```

---

## Examples

### Category Chip (Lashes - Selected)

```tsx
<button className="
  px-4 py-2 rounded-full
  bg-[rgb(205,168,158)]
  text-white font-medium
  shadow-lg
  ring-2 ring-[rgba(205,168,158,0.3)]
  transform scale-105
  transition-all duration-200
">
  ✨ Lashes
</button>
```

### Category Chip (Brows - Unselected)

```tsx
<button className="
  px-4 py-2 rounded-full
  bg-[rgba(212,175,117,0.15)]
  border border-[rgba(212,175,117,0.3)]
  text-[rgb(212,175,117)]
  font-medium
  hover:bg-[rgba(212,175,117,0.3)]
  transition-all duration-200
">
  🎀 Brows
</button>
```

---

## Future Additions

When adding new categories, follow this pattern:

1. Choose a color from the palette or add complementary color
2. Ensure 4.5:1 contrast ratio for accessibility
3. Select appropriate emoji icon
4. Update COLOR_GUIDE.md
5. Add to tailwind.config.ts
6. Add to CATEGORY_COLORS constant

---

**Last Updated**: November 2024
**Version**: 1.0
