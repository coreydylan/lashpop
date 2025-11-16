# AI-Powered DAM - Master Vision Document

> **Vision**: Transform the DAM from a simple photo library into an **intelligent brand orchestration system** - where AI understands your brand, helps you create, maintains consistency, and tracks the entire creative lineage of every asset.

**Last Updated**: 2025-01-16
**Status**: Vision & Architecture Phase
**Codename**: "PRISM" (Polymorphic Resource Intelligence & Synthesis Manager)

---

## 🌟 The Big Idea

### From Photo Library → Brand Intelligence System

**Traditional DAM**: Store photos, tag them, filter them.

**PRISM**: A living, breathing brand system that:
- Understands your brand DNA (colors, style, voice, values)
- Generates new assets that match your aesthetic
- Maintains brand consistency across all outputs
- Tracks creative lineage (what inspired what)
- Suggests improvements and variations
- Learns from your preferences
- Orchestrates multi-asset AI workflows

---

## 📋 Table of Contents

1. [Core Concepts](#core-concepts)
2. [Polymorphic Asset System](#polymorphic-asset-system)
3. [Asset Types](#asset-types)
4. [AI Integration Architecture](#ai-integration-architecture)
5. [Creative Lineage & Derivation Tracking](#creative-lineage--derivation-tracking)
6. [Cross-Collection Intelligence](#cross-collection-intelligence)
7. [AI Filter Library](#ai-filter-library)
8. [Command Palette Integration](#command-palette-integration)
9. [Technical Architecture](#technical-architecture)
10. [Database Schema](#database-schema)
11. [UI/UX Designs](#uiux-designs)
12. [Implementation Roadmap](#implementation-roadmap)
13. [Magical Features](#magical-features)

---

## 💎 Core Concepts

### 1. Polymorphic Assets
**Every item in the system is an "asset"** but can be:
- Photo
- Video
- Color Palette
- Logo Variant
- Font Pairing
- Brand Guideline Document
- AI-Generated Derivative
- Theme/Style Template
- SVG/Vector Asset
- 3D Asset (future)

### 2. Smart Collections
Collections are **typed and intelligent**:
- **Photo Collection**: Traditional image gallery
- **Color Palette Collection**: Brand colors, gradients, themes
- **Logo System Collection**: All logo variants with validation
- **Brand Kit Collection**: Cross-asset brand system
- **AI Workspace Collection**: Experiments and derivatives
- **Theme Collection**: Reusable style systems

### 3. Creative Lineage
Every asset knows its **family tree**:
- Source assets (what it was created from)
- Derivative assets (what was created from it)
- AI prompts used
- Transformations applied
- Human edits made
- Influence relationships

### 4. Brand Intelligence
The system **learns your brand**:
- Extracts color palettes from photos
- Identifies dominant styles
- Understands brand voice from text
- Suggests consistent variations
- Flags off-brand assets
- Auto-tags based on brand taxonomy

### 5. AI Orchestration
**Multi-asset AI workflows**:
- Select 3 photos + 1 color palette + brand guidelines → Generate consistent marketing image
- Select logo variants → Generate social media templates
- Select color palette + style photos → Generate new product photography
- Select text guidelines → Generate brand-consistent copy

---

## 🧬 Polymorphic Asset System

### Base Asset Model

```typescript
interface BaseAsset {
  id: string
  type: AssetType

  // Core metadata
  name: string
  description?: string
  tags: Tag[]
  collections: Collection[]

  // Ownership
  createdBy: string
  createdAt: Date
  updatedAt: Date

  // Storage
  storageKey?: string  // S3/storage location (if applicable)

  // AI metadata
  aiGenerated: boolean
  aiMetadata?: {
    model: string
    prompt?: string
    parameters?: Record<string, any>
    cost?: number
    generatedAt: Date
  }

  // Lineage
  derivedFrom?: string[]  // Parent asset IDs
  derivatives?: string[]  // Child asset IDs
  transformations?: Transformation[]

  // Brand metadata
  brandAlignment?: {
    colorHarmony: number  // 0-100 score
    styleConsistency: number
    onBrand: boolean
    suggestions?: string[]
  }
}

enum AssetType {
  PHOTO = 'photo',
  VIDEO = 'video',
  COLOR_PALETTE = 'color_palette',
  LOGO = 'logo',
  VECTOR = 'vector',
  FONT_PAIRING = 'font_pairing',
  DOCUMENT = 'document',
  BRAND_GUIDELINE = 'brand_guideline',
  AI_DERIVATIVE = 'ai_derivative',
  THEME = 'theme',
  FILTER_PRESET = 'filter_preset'
}
```

### Type-Specific Extensions

```typescript
// Photo Asset
interface PhotoAsset extends BaseAsset {
  type: AssetType.PHOTO
  photo: {
    width: number
    height: number
    format: string
    fileSize: number
    exif?: ExifData
    dominantColors?: Color[]
    extractedPalette?: string  // Color palette asset ID
    faces?: FaceDetection[]
    objects?: ObjectDetection[]
  }
}

// Color Palette Asset
interface ColorPaletteAsset extends BaseAsset {
  type: AssetType.COLOR_PALETTE
  palette: {
    colors: Color[]
    gradients?: Gradient[]
    name: string
    category: 'brand' | 'extracted' | 'generated' | 'custom'

    // Relationships
    extractedFrom?: string[]  // Photo asset IDs
    usedIn?: string[]  // Asset IDs that use this palette

    // AI generation
    generationPrompt?: string
    harmonyType?: 'complementary' | 'analogous' | 'triadic' | 'monochromatic'

    // Export formats
    exports?: {
      css?: string
      scss?: string
      tailwind?: string
      figma?: string
      sketch?: string
    }
  }
}

interface Color {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  name?: string  // "Primary Blue", "Accent Gold"
  role?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic'
  accessibility?: {
    contrastRatio: Record<string, number>  // Against other colors
    wcagAAA: boolean
    wcagAA: boolean
  }
}

interface Gradient {
  id: string
  name: string
  type: 'linear' | 'radial' | 'conic'
  stops: Array<{
    color: string
    position: number  // 0-100
  }>
  angle?: number  // For linear
  css?: string
}

// Logo Asset
interface LogoAsset extends BaseAsset {
  type: AssetType.LOGO
  logo: {
    variant: LogoVariant
    format: 'svg' | 'png' | 'pdf'

    // Logo system
    logoSystemId?: string  // Groups all variants together
    isComplete: boolean  // Has all required variants

    // Specifications
    minWidth?: number
    minHeight?: number
    clearSpace?: number

    // Colors
    colorMode: 'full-color' | 'monochrome' | 'black' | 'white' | 'custom'
    colors?: string[]  // Color palette IDs or hex codes

    // Usage guidelines
    usage?: {
      backgrounds: 'light' | 'dark' | 'both'
      contexts: string[]
      restrictions?: string[]
    }

    // SVG manipulation
    svg?: {
      content: string
      layers?: SVGLayer[]
      editableColors?: string[]
      editableText?: string[]
    }
  }
}

enum LogoVariant {
  PRIMARY = 'primary',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  STACKED = 'stacked',
  ICON_ONLY = 'icon_only',
  WORDMARK = 'wordmark',
  MONOCHROME = 'monochrome',
  REVERSED = 'reversed',
  FAVICON = 'favicon',
  SOCIAL_SQUARE = 'social_square',
  SOCIAL_WIDE = 'social_wide'
}

// Brand Guideline Asset
interface BrandGuidelineAsset extends BaseAsset {
  type: AssetType.BRAND_GUIDELINE
  guideline: {
    category: 'voice' | 'visual' | 'values' | 'usage' | 'complete'

    content: {
      text?: string  // Markdown content
      rules?: Rule[]
      examples?: Example[]
      dosDonts?: DoDont[]
    }

    // Linked assets
    referencedAssets?: {
      colors?: string[]
      logos?: string[]
      fonts?: string[]
      photos?: string[]
    }

    // AI understanding
    embedding?: number[]  // Semantic vector for AI
    keywords?: string[]
  }
}

// AI Filter Preset
interface FilterPresetAsset extends BaseAsset {
  type: AssetType.FILTER_PRESET
  filter: {
    name: string
    category: 'style' | 'color' | 'composition' | 'creative'

    // Filter definition
    aiModel: string  // 'img2img', 'style-transfer', etc.
    parameters: Record<string, any>

    // Input requirements
    inputTypes: AssetType[]
    requiredInputs?: number
    optionalInputs?: {
      colorPalette?: boolean
      referenceStyle?: boolean
      mask?: boolean
    }

    // Preview
    thumbnailExamples?: string[]  // Before/after pairs

    // Usage stats
    applyCount: number
    avgRating?: number

    // Batch processing
    batchable: boolean
    estimatedCostPerImage?: number
  }
}

// Theme Asset
interface ThemeAsset extends BaseAsset {
  type: AssetType.THEME
  theme: {
    name: string
    description: string

    // Complete design system
    colors: string[]  // Color palette IDs
    typography?: {
      headingFont: string
      bodyFont: string
      monoFont?: string
      scale?: number[]
    }

    // Component styles
    components?: {
      buttons?: ComponentStyle
      cards?: ComponentStyle
      forms?: ComponentStyle
    }

    // AI application
    applicableTo: AssetType[]

    // Export
    exports?: {
      css?: string
      figma?: string
      sketch?: string
      tailwind?: string
    }
  }
}
```

---

## 🎨 Asset Types (Detailed)

### 1. Color Palette Assets

**Purpose**: Manage brand colors, extracted palettes, AI-generated harmonies

#### Features:

**Creation Methods**:
- Extract from photo (AI-powered)
- Generate from prompt ("vibrant sunset palette")
- Generate harmonious variations
- Import from other tools
- Manual creation

**Color Management**:
- Name each color with role
- Define hierarchies (primary, secondary, accent)
- Accessibility checker (WCAG compliance)
- Color contrast matrix
- Export to all formats (CSS, SCSS, Tailwind, Figma, Sketch)

**Gradient Editor**:
- Visual gradient builder
- Preset libraries
- CSS/SVG export
- Animated gradients

**Smart Features**:
- Suggest complementary palettes
- Find similar palettes in library
- "Make this more vibrant/muted/warm/cool"
- Generate variations (lighter/darker)
- Accessibility-first mode

**Lightbox View**:
```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Grid            "Summer Brand 2025"    [Edit]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PRIMARY COLORS                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐                      │
│  │ #FF6B6B│ │ #4ECDC4│ │ #FFE66D│                      │
│  │ Coral  │ │  Teal  │ │ Butter │                      │
│  │ Primary│ │Secondary│ │ Accent │                      │
│  └────────┘ └────────┘ └────────┘                      │
│                                                          │
│  NEUTRALS                                                │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                        │
│  │███│ │███│ │███│ │███│ │███│                        │
│  └───┘ └───┘ └───┘ └───┘ └───┘                        │
│                                                          │
│  GRADIENTS                                               │
│  ┌──────────────────────────────────┐                   │
│  │ ████████████████████████████████ │                   │
│  │ Sunrise (Coral → Teal → Butter)  │                   │
│  └──────────────────────────────────┘                   │
│                                                          │
│  ACCESSIBILITY                                           │
│  ✅ All colors pass WCAG AAA                            │
│  ⚠️  Coral on Butter: AA only (4.2:1)                   │
│                                                          │
│  USED IN (12 assets)                                     │
│  • Summer Campaign Hero                                 │
│  • Product Photography Set A                            │
│  • Social Media Templates (8)                           │
│                                                          │
│  EXTRACTED FROM                                          │
│  📷 Beach Sunset Photo (IMG_2847.jpg)                   │
│                                                          │
│  EXPORT                                                  │
│  [CSS] [SCSS] [Tailwind] [Figma] [Sketch] [Copy Hex]  │
│                                                          │
│  AI ACTIONS                                              │
│  🎨 Generate variations                                 │
│  🔄 Create complementary palette                        │
│  ✨ Apply to selected images                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### 2. Logo System Collections

**Purpose**: Manage complete logo systems with validation and guidelines

#### Deterministic Logo Template:

Every brand needs these variants:
```
✅ Required Variants (8):
  1. Primary Full Color
  2. Horizontal Layout
  3. Vertical/Stacked Layout
  4. Icon/Symbol Only
  5. Wordmark/Text Only
  6. Monochrome (Black)
  7. Monochrome (White/Reversed)
  8. Favicon (Square, Small)

✨ Recommended Variants (4):
  9. Social Media Square (1:1)
  10. Social Media Wide (1200×630)
  11. Simplified (for small sizes)
  12. Seasonal/Special Edition

📏 Required Sizes (per variant):
  - SVG (vector, scalable)
  - PNG @1x, @2x, @3x
  - Favicon: 16×16, 32×32, 64×64
  - Social: Platform-specific sizes
```

#### Logo Collection View:

```
┌─────────────────────────────────────────────────────────┐
│  Logo System: "Lash Pop Branding"                       │
│  Status: 75% Complete (9/12 variants)     [+ Add Variant]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  REQUIRED VARIANTS                    [Validation: 6/8] │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ [LOGO]   │ │ [LOGO]   │ │   LOGO   │ │    ○     │  │
│  │          │ │          │ │   ○○○    │ │          │  │
│  │ Primary  │ │Horizontal│ │ Vertical │ │Icon Only │  │
│  │   ✅     │ │   ✅     │ │   ✅     │ │   ✅     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ LASHPOP  │ │  ████    │ │  ░░░░    │ │  [16px]  │  │
│  │          │ │  ████    │ │  ░░░░    │ │  Missing │  │
│  │Wordmark  │ │ Black    │ │  White   │ │ Favicon  │  │
│  │   ✅     │ │   ✅     │ │   ❌     │ │   ❌     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  RECOMMENDED VARIANTS                 [Optional: 3/4]   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  [1:1]   │ │ [1200×   │ │ Simple   │ │ Holiday  │  │
│  │  Social  │ │  630]    │ │ Version  │ │ Edition  │  │
│  │   ✅     │ │   ✅     │ │   ✅     │ │   ❌     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  MISSING ASSETS                                          │
│  ⚠️  White/Reversed variant needed                      │
│  ⚠️  Favicon variants needed                            │
│                                                          │
│  QUICK ACTIONS                                           │
│  🤖 AI: Generate missing variants                       │
│  🎨 AI: Colorize with palette                           │
│  📐 AI: Resize all to standard sizes                    │
│  📦 Download complete kit as ZIP                        │
│  📋 Copy brand guidelines                                │
│                                                          │
│  USAGE GUIDELINES                                        │
│  Min Size: 24px height                                  │
│  Clear Space: 0.5× logo height on all sides            │
│  Backgrounds: Light preferred, dark with white variant  │
│  Don'ts: No stretching, no rotation, no gradients       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### AI Logo Features:

```typescript
// Generate missing variants
"AI: Generate favicon from primary logo"
"AI: Create monochrome version"
"AI: Simplify logo for small sizes"

// Manipulate SVG
"AI: Change logo colors to match palette [Summer Brand 2025]"
"AI: Make this logo more modern"
"AI: Vectorize this raster logo"

// Validate
"AI: Check if this logo is readable at 16px"
"AI: Suggest improvements for better scalability"
```

---

### 3. Brand Guideline Assets

**Purpose**: Store written guidelines that AI can understand and enforce

#### Types:

**Voice & Tone**:
- Brand personality traits
- Writing style examples
- Dos and don'ts
- Vocabulary preferences

**Visual Guidelines**:
- Color usage rules
- Typography hierarchy
- Spacing standards
- Image style preferences

**Usage Rules**:
- Logo placement
- Partner guidelines
- Social media specs
- Print requirements

**AI Integration**:
```typescript
// The system embeds guideline text for semantic search
const embedding = await generateEmbedding(guideline.content)

// Then can check if assets align
const isOnBrand = await checkBrandAlignment({
  asset: newImage,
  guidelines: brandGuidelines,
  threshold: 0.85
})

// Or generate with guidelines
const generated = await generateImage({
  prompt: "Product photography",
  guidelines: brandGuidelines,
  styleReference: selectedPhotos,
  colorPalette: brandColors
})
```

---

## 🤖 AI Integration Architecture

### AI Capabilities

#### 1. Image Generation (Multiple Sources)

**From Scratch**:
```typescript
interface ImageGenerationRequest {
  prompt: string
  negativePrompt?: string
  variations: number  // Generate up to X versions

  // Context (optional but powerful)
  styleReferences?: string[]  // Photo asset IDs
  colorPalette?: string  // Color palette asset ID
  brandGuidelines?: string[]  // Guideline asset IDs
  aspectRatio?: string

  // Model selection
  model: 'midjourney' | 'dalle-3' | 'stable-diffusion' | 'custom'

  // Advanced
  seed?: number
  cfgScale?: number
  steps?: number
}

// Example command:
"generate 5 variations of: professional product photography,
 using [Summer Brand Colors],
 in the style of [IMG_2847, IMG_2901],
 following [Brand Visual Guidelines]"
```

**From Existing Images** (Image-to-Image):
```typescript
interface ImageTransformRequest {
  sourceImages: string[]  // Up to N source images
  prompt: string
  strength: number  // How much to change (0-1)

  // Blend modes
  mode: 'blend' | 'composite' | 'morph' | 'style-transfer'

  // Context
  colorPalette?: string
  referenceStyle?: string[]

  // Masks (for selective editing)
  mask?: {
    regions: MaskRegion[]
    inpaint?: boolean
    outpaint?: boolean
  }
}

// Example:
"combine [IMG_1.jpg] and [IMG_2.jpg]
 with [Summer Palette]
 to create a cohesive brand hero image"
```

**Pure Editing**:
```typescript
interface ImageEditRequest {
  sourceImage: string
  edits: ImageEdit[]
}

interface ImageEdit {
  type: 'remove-background' | 'enhance' | 'recolor' | 'inpaint' | 'expand' | 'restore'
  parameters: any
}

// Examples:
"remove background from [IMG_001.jpg]"
"enhance quality and lighting"
"recolor to match [Brand Palette]"
"expand canvas to 16:9"
"restore old photo quality"
```

#### 2. Color Intelligence

```typescript
// Extract palette from photo
"extract color palette from [IMG_123.jpg]"
→ Creates new ColorPaletteAsset

// Generate harmonious palettes
"create a complementary palette based on [Summer Palette]"
"generate analogous variations"
"make this palette more vibrant"
"create a monochromatic palette from #FF6B6B"

// Apply palettes
"recolor [selected images] using [Autumn Palette]"
"apply [Brand Colors] to [Logo_v2.svg]"
```

#### 3. SVG/Vector Manipulation

```typescript
"change logo colors to [Brand Palette]"
"simplify SVG for better performance"
"convert [raster_logo.png] to SVG"
"make logo more minimalist"
"extract individual layers from [complex_logo.svg]"
```

#### 4. Batch Processing with Filters

```typescript
interface BatchFilterJob {
  filter: string  // Filter preset asset ID
  targets: string[]  // Asset IDs

  // Overrides
  parameterOverrides?: Record<string, any>

  // Output
  saveAsDerivatives: boolean
  namingPattern: string

  // Processing
  parallel: boolean
  maxConcurrent?: number
}

// Example:
"apply [Vintage Film Filter] to all images in [Summer Campaign]"
"batch process [selected] with [Brand Consistency Filter]"
```

---

### Creative Lineage & Derivation Tracking

**The Family Tree of Assets**

Every AI-generated or edited asset maintains its lineage:

```typescript
interface Derivation {
  id: string

  // Lineage
  sourceAssets: string[]  // Parent asset IDs
  derivativeAssets: string[]  // Children created from this

  // Creation method
  method: DerivationMethod

  // AI details
  aiPrompt?: string
  aiModel?: string
  aiParameters?: Record<string, any>

  // Human edits
  humanEdits?: Edit[]

  // Relationships
  influences?: Influence[]  // Other assets that influenced this

  // Metadata
  createdAt: Date
  createdBy: string
  cost?: number
  processingTime?: number
}

enum DerivationMethod {
  AI_GENERATION = 'ai_generation',
  AI_EDIT = 'ai_edit',
  AI_BLEND = 'ai_blend',
  AI_STYLE_TRANSFER = 'ai_style_transfer',
  AI_UPSCALE = 'ai_upscale',
  FILTER_APPLIED = 'filter_applied',
  MANUAL_EDIT = 'manual_edit',
  COLOR_ADJUSTMENT = 'color_adjustment',
  COMPOSITE = 'composite'
}

interface Influence {
  assetId: string
  type: 'style' | 'color' | 'composition' | 'content'
  strength: number  // 0-1
}
```

#### Lineage Viewer UI:

```
┌─────────────────────────────────────────────────────────┐
│  Asset Lineage: "Summer_Campaign_Hero_v3.jpg"           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  GENERATION 1 (Source Assets)                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│  │ Beach   │  │ Product │  │ Summer  │                │
│  │ Sunset  │  │ Photo   │  │ Palette │                │
│  │ IMG_123 │  │ IMG_456 │  │ Colors  │                │
│  └────┬────┘  └────┬────┘  └────┬────┘                │
│       │            │             │                      │
│       └────────────┴─────────────┘                      │
│                    │                                     │
│  ┌─────────────────▼──────────────────┐                │
│  │ AI Blend: "Combine beach mood      │                │
│  │ with product, using summer colors" │                │
│  │ Model: DALL-E 3                    │                │
│  │ Cost: $0.12 • Time: 18s            │                │
│  └─────────────────┬──────────────────┘                │
│                    │                                     │
│  GENERATION 2                                           │
│  ┌────────────────▼─────────────────┐                  │
│  │ Summer_Campaign_Hero_v1.jpg      │                  │
│  │ 2048×1536 • June 15, 2025        │                  │
│  └────────────────┬─────────────────┘                  │
│                   │                                      │
│  ┌────────────────▼─────────────────┐                  │
│  │ Human Edit: Color correction     │                  │
│  │ Editor: Alice • 3 min            │                  │
│  └────────────────┬─────────────────┘                  │
│                   │                                      │
│  GENERATION 3                                           │
│  ┌────────────────▼─────────────────┐                  │
│  │ Summer_Campaign_Hero_v2.jpg      │                  │
│  └────────────────┬─────────────────┘                  │
│                   │                                      │
│  ┌────────────────▼─────────────────┐                  │
│  │ AI Edit: "Add floating product"  │                  │
│  │ Model: Stable Diffusion Inpaint  │                  │
│  └────────────────┬─────────────────┘                  │
│                   │                                      │
│  GENERATION 4 (Current)                                 │
│  ┌────────────────▼─────────────────┐                  │
│  │ Summer_Campaign_Hero_v3.jpg  ⭐  │                  │
│  │ ✅ Selected for campaign         │                  │
│  └──────────────────────────────────┘                  │
│                   │                                      │
│  DERIVATIVES (3)  │                                      │
│  ┌───────────────┴─────┬───────────────────┐           │
│  ▼                     ▼                   ▼           │
│ [Social] [Instagram]  [Email]           [Print]        │
│ Square   Story        Header            Poster         │
│                                                          │
│  [View Full Tree] [Export Lineage] [Compare Versions]  │
└─────────────────────────────────────────────────────────┘
```

---

### Cross-Collection Intelligence

**Select across asset types and collections**

```typescript
interface CrossCollectionSelection {
  id: string
  name: string

  // Selected items
  photos: string[]
  colorPalettes: string[]
  logos: string[]
  guidelines: string[]
  themes: string[]

  // Purpose
  purpose: 'ai-generation' | 'export' | 'comparison' | 'moodboard'

  // AI context
  aiContext?: {
    prompt: string
    goal: string
    constraints?: string[]
  }
}

// Example selections:

Selection: "Summer Campaign Assets"
  📷 Photos (12)
  🎨 Color Palettes (2)
  📋 Brand Guidelines (1)

  → Submit to AI:
     "Create 5 hero images for summer campaign using these"

Selection: "Brand Consistency Check"
  📷 Recent uploads (47)
  🎨 Brand Colors
  📐 Logo variants
  📋 Visual Guidelines

  → Submit to AI:
     "Check if these new photos match our brand, flag issues"

Selection: "Social Media Kit"
  📷 Product photos (8)
  🎨 Social Palette
  📐 Social logos
  🎭 Theme: Instagram Feed 2025

  → Submit to AI:
     "Generate Instagram post templates using these"
```

---

## 🎨 AI Filter Library

**Reusable, branded AI transformations**

### Filter Types:

#### Style Filters
```typescript
{
  name: "Lash Pop Brand Style",
  description: "Applies consistent Lash Pop aesthetic",
  type: "style-transfer",
  inputs: {
    sourceImage: true,
    styleReferences: [/* reference photos */],
    colorPalette: "brand-palette-id"
  },
  parameters: {
    strength: 0.75,
    preserveColors: false,
    model: "stable-diffusion-xl"
  }
}
```

#### Color Grading Filters
```typescript
{
  name: "Warm Golden Hour",
  description: "Sunset warmth with enhanced glow",
  type: "color-grade",
  inputs: {
    sourceImage: true,
    colorPalette: "golden-hour-palette"
  },
  adjustments: {
    temperature: +20,
    tint: +5,
    highlights: +15,
    shadows: -10,
    saturation: +10
  }
}
```

#### Composition Filters
```typescript
{
  name: "Rule of Thirds Crop",
  description: "AI-powered smart crop using rule of thirds",
  type: "composition",
  inputs: {
    sourceImage: true,
    aspectRatio: "16:9"
  },
  aiModel: "composition-analyzer"
}
```

#### Background Filters
```typescript
{
  name: "Brand Background Replacement",
  description: "Replace background with brand-appropriate scene",
  type: "background-replace",
  inputs: {
    sourceImage: true,
    backgroundStyle: "studio" | "lifestyle" | "minimal"
  }
}
```

### Filter UI:

```
┌─────────────────────────────────────────────────────────┐
│  AI Filter Library                          [+ Create]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  MY FILTERS (8)                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ [Preview]    │  │ [Preview]    │  │ [Preview]    │ │
│  │              │  │              │  │              │ │
│  │ Brand Style  │  │ Golden Hour  │  │ Clean BG    │ │
│  │ Applied: 127 │  │ Applied: 89  │  │ Applied: 45 │ │
│  │ ⭐⭐⭐⭐⭐    │  │ ⭐⭐⭐⭐☆    │  │ ⭐⭐⭐⭐⭐    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  COMMUNITY FILTERS (Browse)                              │
│  • Vintage Film Look (trending)                         │
│  • Minimal Product Photography                          │
│  • Instagram Aesthetic 2025                             │
│  • Moody Dark Photography                               │
│                                                          │
│  SELECTED IMAGES (5)                                     │
│  [IMG_1] [IMG_2] [IMG_3] [IMG_4] [IMG_5]              │
│                                                          │
│  APPLY FILTER                                            │
│  ┌────────────────────────────────────┐                │
│  │ Filter: [Brand Style     ▼]        │                │
│  │ Mode: ◉ Create derivatives          │                │
│  │       ○ Replace originals           │                │
│  │ Naming: ${original}_branded         │                │
│  │                                      │                │
│  │ Estimated: $0.45 • ~2 min           │                │
│  │                                      │                │
│  │ [Preview First] [Apply to All (5)]  │                │
│  └────────────────────────────────────┘                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 💫 Magical Features

### 1. Brand DNA Extraction

**AI learns your brand automatically**

```typescript
async function analyzeBrandDNA(assets: BaseAsset[]) {
  const dna = {
    visualStyle: await extractVisualStyle(photos),
    colorProfile: await extractDominantPalettes(photos),
    composition: await analyzeCompositionPatterns(photos),
    voice: await analyzeTextGuidelines(guidelines),
    values: await extractBrandValues(allAssets)
  }

  return {
    ...dna,
    confidence: calculateConfidence(dna),
    suggestions: generateImprovementSuggestions(dna)
  }
}

// UI:
"AI: Analyze my entire library and tell me my brand DNA"
→ Generates comprehensive brand profile
→ Suggests missing elements
→ Flags inconsistencies
```

### 2. Smart Asset Suggestions

```typescript
// When creating new content
"AI: What photos should I use for this campaign?"
→ Suggests best matches based on:
  - Current selection context
  - Brand guidelines
  - Past successful campaigns
  - Color harmony
  - Composition balance

"AI: Find photos that would work well with [Summer Palette]"
→ Searches library for color-compatible images

"AI: Show me assets that need better alternatives"
→ Identifies low-quality, off-brand, or outdated assets
```

### 3. Automatic Derivative Generation

```typescript
// When you upload a new photo
→ Auto-extracts color palette
→ Auto-generates social media sizes
→ Auto-checks brand alignment
→ Auto-suggests tags
→ Auto-detects objects/faces
→ Auto-adds to relevant collections

// When you finalize a design
→ Auto-generates all required sizes
→ Auto-creates platform-specific versions
→ Auto-optimizes for web/print
→ Auto-creates derivatives in brand colors
```

### 4. Intelligent Search

```typescript
// Natural language search across all asset types
"photos of products with warm colors"
"logos that would work on dark backgrounds"
"color palettes similar to sunset"
"all assets created from [IMG_123.jpg]"
"brand guidelines about social media"
"everything generated using DALL-E this month"

// Visual similarity search
"find images similar to this"
"find logos with similar style"
"find color palettes that would complement this"
```

### 5. Consistency Enforcement

```typescript
// Before saving/publishing
async function checkBrandConsistency(asset: BaseAsset) {
  const checks = {
    colorAlignment: checkColorAlignment(asset, brandColors),
    styleMatch: checkStyleMatch(asset, brandGuidelines),
    qualityStandards: checkQualityStandards(asset),
    usageCompliance: checkUsageRules(asset)
  }

  if (checks.colorAlignment.score < 0.7) {
    return {
      approved: false,
      warnings: ["Colors don't match brand palette"],
      suggestions: [
        "Apply [Brand Color Correction] filter",
        "Use [Brand Colors] palette instead"
      ]
    }
  }
}
```

### 6. Automated Brand Kit Generation

```typescript
"AI: Create a complete brand kit"
→ Analyzes existing assets
→ Identifies gaps
→ Generates missing pieces:
  - Logo variants
  - Color palettes
  - Typography samples
  - Social templates
  - Email headers
  - Print templates
→ Packages everything for download
```

### 7. Collaborative AI Sessions

```typescript
interface AISession {
  id: string
  name: string
  participants: string[]

  // Conversation history
  messages: AIMessage[]

  // Assets in context
  activeAssets: string[]

  // Generated assets
  outputs: string[]

  // Iterations
  iterations: Iteration[]
}

// UI: Chat-based AI collaboration
User: "Create a summer campaign hero image"
AI: "I'll use your Summer Palette and beach photos. Should it be lifestyle or product-focused?"
User: "Lifestyle with subtle product placement"
AI: [Generates 3 variations]
User: "Make #2 more vibrant"
AI: [Refines variation #2]
User: "Perfect! Now create social media versions"
AI: [Generates Instagram, Facebook, Twitter sizes]
```

### 8. Smart Collections

```typescript
// Collections that auto-populate based on rules
{
  name: "Off-Brand Assets",
  type: "smart",
  rules: {
    brandAlignmentScore: { lt: 0.6 },
    excludeTags: ["reviewed", "approved"]
  },
  autoUpdate: true
}

{
  name: "Unused High-Quality Photos",
  type: "smart",
  rules: {
    qualityScore: { gte: 0.9 },
    usageCount: 0,
    uploadedBefore: "30 days ago"
  }
}

{
  name: "AI Experiments This Week",
  type: "smart",
  rules: {
    aiGenerated: true,
    createdAfter: "7 days ago"
  }
}
```

### 9. Template & Preset System

```typescript
// Save entire workflows as templates
{
  name: "Product Photography Workflow",
  steps: [
    { action: "remove-background" },
    { action: "enhance-lighting" },
    { action: "apply-filter", filter: "Brand Style" },
    { action: "apply-palette", palette: "Product Colors" },
    { action: "resize", sizes: ["1200×1200", "600×600", "300×300"] },
    { action: "add-watermark", logo: "watermark-logo" }
  ]
}

// One-click apply entire workflow
"Apply [Product Photography Workflow] to selected images"
```

### 10. AI-Powered Organization

```typescript
// Let AI organize your library
"AI: Organize my library"
→ Creates smart collections
→ Suggests tagging improvements
→ Identifies duplicates
→ Groups related assets
→ Archives outdated content
→ Highlights gaps in brand kit

// Auto-tagging
Upload photo → AI automatically adds:
  - Object tags (product, person, background)
  - Style tags (lifestyle, studio, outdoor)
  - Color tags (warm, cool, vibrant)
  - Quality tags (high-res, web-ready)
  - Brand tags (on-brand, needs-review)
```

---

## 🎮 Command Palette Integration

All AI features accessible via natural language commands:

```typescript
// Generation
"generate 5 product photos using [Summer Palette] and [IMG_123]"
"create logo variations in [Brand Colors]"
"generate complementary palette for #FF6B6B"

// Editing
"remove background from selected"
"enhance all selected images"
"apply [Brand Style Filter] to [Campaign Photos]"
"recolor [Logo] using [New Palette]"

// Analysis
"check brand consistency of selected"
"extract color palette from [IMG_456]"
"analyze my brand DNA"
"find similar images to this"

// Organization
"create smart collection for off-brand assets"
"auto-tag all untagged photos"
"organize by color palette"

// Batch operations
"apply [Vintage Filter] to all [Summer Collection]"
"generate social media sizes for selected"
"create derivatives in all brand colors"

// Lineage
"show lineage of [current image]"
"find all derivatives of [IMG_123]"
"compare versions of [Logo_v1] through [Logo_v5]"
```

---

## 🗄️ Database Schema

```typescript
// Extended Asset table (polymorphic)
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  type asset_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Storage
  storage_key TEXT,  -- S3 key (null for non-file assets)

  -- Ownership
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- AI metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_metadata JSONB,  -- model, prompt, params, cost

  -- Type-specific data (JSONB for flexibility)
  photo_data JSONB,
  color_palette_data JSONB,
  logo_data JSONB,
  guideline_data JSONB,
  filter_data JSONB,
  theme_data JSONB,

  -- Brand alignment
  brand_alignment_score DECIMAL(3,2),  -- 0.00 to 1.00
  brand_metadata JSONB,

  -- Search
  tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) STORED
)

-- Derivation tracking
CREATE TABLE derivations (
  id UUID PRIMARY KEY,
  derivative_asset_id UUID REFERENCES assets(id),
  source_asset_ids UUID[],  -- Array of source IDs

  method derivation_method NOT NULL,

  -- AI details
  ai_prompt TEXT,
  ai_model TEXT,
  ai_parameters JSONB,

  -- Human involvement
  human_edits JSONB,

  -- Influence relationships
  influences JSONB,  -- { assetId, type, strength }

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  processing_time_ms INTEGER,
  cost_usd DECIMAL(10,4)
)

-- AI Filter presets
CREATE TABLE filter_presets (
  id UUID PRIMARY KEY,
  asset_id UUID REFERENCES assets(id),  -- Links to FilterPresetAsset

  name TEXT NOT NULL,
  category TEXT,

  ai_model TEXT NOT NULL,
  parameters JSONB NOT NULL,

  -- Usage
  apply_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),

  -- Access
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
)

-- Cross-collection selections
CREATE TABLE cross_selections (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id),

  -- Selected assets by type
  photo_ids UUID[],
  color_palette_ids UUID[],
  logo_ids UUID[],
  guideline_ids UUID[],
  theme_ids UUID[],

  -- Purpose
  purpose TEXT,
  ai_context JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Logo systems (groups of logo variants)
CREATE TABLE logo_systems (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,

  -- Validation
  required_variants TEXT[],  -- Array of LogoVariant enum values
  completion_percentage INTEGER,

  -- Associated assets
  logo_asset_ids UUID[],

  -- Guidelines
  min_width INTEGER,
  min_height INTEGER,
  clear_space INTEGER,
  usage_rules JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Brand DNA profile
CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),

  -- Extracted intelligence
  visual_style JSONB,
  color_profile JSONB,
  composition_patterns JSONB,
  voice_analysis JSONB,
  values JSONB,

  -- Confidence scores
  confidence_score DECIMAL(3,2),

  -- Metadata
  asset_count INTEGER,  -- Number of assets analyzed
  last_analyzed TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- AI sessions (collaborative AI conversations)
CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY,
  name TEXT,
  user_id UUID REFERENCES users(id),

  -- Conversation
  messages JSONB,  -- Array of messages

  -- Context
  active_asset_ids UUID[],
  output_asset_ids UUID[],

  -- Metadata
  total_cost_usd DECIMAL(10,4),
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW()
)
```

---

## 🎨 UI/UX Designs

### Universal Grid View (All Asset Types)

```
┌─────────────────────────────────────────────────────────┐
│  All Assets                         [Grid ▼] [Filter]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [📷 Photos (234)] [🎨 Colors (12)] [📐 Logos (8)]     │
│  [📋 Guidelines (3)] [🎭 Themes (5)] [✨ Filters (6)]  │
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Photo  │ │ ████   │ │ [LOGO] │ │ Brand  │          │
│  │ Beach  │ │ ████   │ │ Primary│ │ Guide  │          │
│  │ 📷     │ │ 🎨     │ │ 📐     │ │ 📋     │          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Filter │ │ Theme  │ │ Color  │ │ AI Gen │          │
│  │ Vintage│ │ Modern │ │ Sunset │ │ Hero   │          │
│  │ ✨     │ │ 🎭     │ │ 🎨     │ │ 🤖     │          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### AI Generation Panel

```
┌─────────────────────────────────────────────────────────┐
│  AI Generation Studio                            [×]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CONTEXT SELECTION                                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Selected Assets (7)                                │ │
│  │ • 3 photos                                         │ │
│  │ • 1 color palette                                  │ │
│  │ • 2 brand guidelines                               │ │
│  │ • 1 logo                                           │ │
│  │                                            [Edit]  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  GENERATION TYPE                                         │
│  ◉ From scratch                                          │
│  ○ Transform existing                                    │
│  ○ Blend multiple                                        │
│  ○ Apply style                                           │
│                                                          │
│  PROMPT                                                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Professional product photography of lash           │ │
│  │ extensions, warm lighting, minimal background...   │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  AI MODEL                                                │
│  [DALL-E 3        ▼]  Est. $0.12 per image             │
│                                                          │
│  VARIATIONS                                              │
│  Generate [3 ▼] variations                              │
│                                                          │
│  ADVANCED                                                │
│  ▼ Style Strength: ━━━━━●━━━━ 75%                      │
│  ▼ Color Palette: [Summer Brand Colors ✓]              │
│  ▼ Aspect Ratio: [16:9 ▼]                              │
│  ▼ Quality: [High ▼]                                    │
│                                                          │
│  PREVIEW COST                                            │
│  3 variations × $0.12 = $0.36                           │
│  Est. time: ~45 seconds                                 │
│                                                          │
│  [Cancel]                     [Generate Images]         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Lineage Graph View

```
┌─────────────────────────────────────────────────────────┐
│  Asset Graph View                                  [×]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│              GEN 1           GEN 2           GEN 3       │
│                                                          │
│           ┌─────────┐                                    │
│           │ Photo 1 │                                    │
│           │ Beach   │────┐                              │
│           └─────────┘    │                              │
│                          │   ┌──────────┐               │
│           ┌─────────┐    └──▶│ AI Blend │──┐           │
│           │ Photo 2 │        │ DALL-E   │  │           │
│           │ Product │───────▶│ $0.12    │  │           │
│           └─────────┘        └──────────┘  │           │
│                                             │            │
│           ┌─────────┐                      │            │
│           │ Palette │                       │            │
│           │ Summer  │──────────────────────┘            │
│           └─────────┘                       │            │
│                                             │            │
│                                   ┌─────────▼────────┐  │
│                                   │ Hero_v1.jpg      │  │
│                                   │ June 15, 2025    │──┤
│                                   └─────────┬────────┘  │
│                                             │            │
│                                   ┌─────────▼────────┐  │
│                                   │ Human Edit       │  │
│                                   │ Color correct    │  │
│                                   └─────────┬────────┘  │
│                                             │            │
│                                   ┌─────────▼────────┐  │
│                                   │ Hero_v2.jpg  ⭐  │  │
│                                   │ FINAL            │  │
│                                   └──────────────────┘  │
│                                             │            │
│                     ┌──────────┬────────────┼───────┐   │
│                     ▼          ▼            ▼       ▼   │
│                 [Social]  [Email]      [Print] [Web]   │
│                                                          │
│  [Zoom] [Filter] [Export SVG] [Timeline View]          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Polymorphic asset system
- [ ] Color palette asset type
- [ ] Extended database schema
- [ ] Asset type switching in UI

### Phase 2: Logo System (Weeks 3-4)
- [ ] Logo asset type
- [ ] Logo system collections
- [ ] Variant validation
- [ ] Logo lightbox view
- [ ] SVG manipulation basics

### Phase 3: AI Integration (Weeks 5-8)
- [ ] AI service architecture
- [ ] Image generation (DALL-E, Midjourney)
- [ ] Image-to-image transformations
- [ ] Derivation tracking system
- [ ] Lineage viewer UI

### Phase 4: Advanced AI (Weeks 9-12)
- [ ] Filter preset system
- [ ] Batch processing
- [ ] Color intelligence
- [ ] SVG/vector AI manipulation
- [ ] Brand DNA extraction

### Phase 5: Cross-Collection (Weeks 13-14)
- [ ] Cross-collection selection
- [ ] Multi-asset AI context
- [ ] Brand guideline assets
- [ ] AI sessions/conversations

### Phase 6: Intelligence (Weeks 15-16)
- [ ] Smart collections
- [ ] Auto-tagging
- [ ] Brand consistency checking
- [ ] Asset suggestions
- [ ] Workflow templates

### Phase 7: Polish (Weeks 17-18)
- [ ] Command palette integration
- [ ] Advanced search
- [ ] Performance optimization
- [ ] Mobile experience
- [ ] Documentation

---

## ✨ The Magic Moments

### 1. "It Just Knows My Brand"
Upload a photo → System instantly:
- Checks if colors match brand
- Suggests complementary palette
- Auto-tags with brand-relevant terms
- Recommends which collections to add to
- Flags if it's off-brand

### 2. "One Command, Complete Kit"
`"create complete social media kit from [these 3 photos]"`
→ System generates:
- Instagram posts (10 variations)
- Stories (5 variations)
- Reels covers (3 variations)
- Profile pictures (2 variations)
All in brand colors, with correct sizes, ready to download.

### 3. "Show Me the Journey"
Click any asset → See its entire creative lineage
- What inspired it
- How it was created
- What it inspired
- Every edit made
- Every person who touched it
Full creative genealogy.

### 4. "Fix My Whole Library"
`"make all my photos match my brand"`
→ AI analyzes brand DNA
→ Identifies off-brand assets
→ Suggests/applies corrections
→ Creates consistent aesthetic
→ Maintains quality

### 5. "Collaborative Creation"
Open AI session → Team works with AI
- Everyone suggests ideas
- AI generates variations
- Team refines together
- Full history saved
- Best versions saved to library

---

**This is the future of brand management.**

Next steps: Which component should we build first?
