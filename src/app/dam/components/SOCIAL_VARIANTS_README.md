# Social Media Variants UI Components

Complete UI system for generating, previewing, editing, and managing social media variants in your DAM.

## 📦 Components Overview

### Core Components

1. **SocialVariantGenerator** - Modal for configuring and generating variants
2. **VariantPreviewGrid** - Review and approve generated variants
3. **VariantEditor** - Fine-tune individual variant crops
4. **SocialVariantCard** - Display variant in asset grid
5. **PhotoLightboxVariantsTab** - Show variants in lightbox view
6. **AssetContextMenu** - Right-click menu for variant actions

## 🎯 Features

### SocialVariantGenerator
- **Platform Selection**: Instagram, Facebook, Twitter, LinkedIn, YouTube, Pinterest, TikTok
- **Multiple Sizes**: Each platform includes 3-6 standard variant sizes
- **Crop Strategies**:
  - Smart AI Crop (recommended) - AI-powered face/logo detection
  - Center Crop - Simple center-based cropping
  - Intelligent Letterbox - Preserves full image with blur/solid/extend borders
- **Live Preview**: Shows estimated generation time and file size
- **Naming Conventions**: Customizable output file naming

### VariantPreviewGrid
- **Platform Grouping**: Variants organized by platform with collapsible sections
- **Quality Indicators**: Visual quality scores and status badges (✅/⚠️/❌)
- **Batch Actions**: Approve all, regenerate all, or discard
- **Individual Controls**: Approve, edit, or regenerate each variant
- **Warning Detection**: Shows issues like "Face 15% cropped"
- **Export Options**: Auto-save, create collection, auto-tag with platform

### VariantEditor
- **Interactive Crop Box**: Drag to reposition, visual grid overlay
- **Safe Zone Detection**: Highlights faces, logos, text with visibility %
- **Quality Score**: Real-time crop quality analysis (0-100)
- **Smart Suggestions**: AI-powered recommendations for better crops
- **Zoom Controls**: Scale preview for precise adjustments
- **Quick Actions**: Reset, Auto-Fix, Switch to Letterbox mode

### SocialVariantCard
- **Platform Badge**: Visual platform identifier with icon
- **Variant Type**: Shows size/format (Square, Story, Header, etc.)
- **Status Indicator**: Perfect/Warning/Error badge
- **Quality Bar**: Visual quality score indicator
- **Dimensions Label**: Shows pixel dimensions
- **Export Status**: Indicates if variant has been exported
- **Source Link**: Small preview of source asset

### PhotoLightboxVariantsTab
- **No Variants State**: Beautiful empty state with "Generate Variants" CTA
- **Platform Sections**: Collapsible groups by platform
- **Grid Display**: Responsive thumbnail grid
- **Quick Actions**: Generate More, Export All
- **Variant Preview**: Click to view full-size

### AssetContextMenu
- **Right-Click Menu**: Professional context menu for assets
- **Variant Actions**:
  - Generate Social Variants...
  - View Variants (with count)
- **Standard Actions**: Edit, Download, Duplicate, Share, Delete
- **Variant Badge**: Shows variant count on asset cards

## 📁 File Structure

```
/home/user/lashpop/src/
├── types/
│   └── social-variants-ui.ts           # Shared types & constants
└── app/dam/components/
    ├── SocialVariantGenerator.tsx      # Main generator modal
    ├── VariantPreviewGrid.tsx          # Preview & approval grid
    ├── VariantEditor.tsx               # Crop editor
    ├── SocialVariantCard.tsx           # Variant display card
    ├── PhotoLightboxVariantsTab.tsx    # Lightbox integration
    ├── AssetContextMenu.tsx            # Context menu
    └── SocialVariantsIntegrationExample.tsx  # Usage examples
```

## 🚀 Quick Start

### 1. Import Types

```typescript
import type {
  GeneratedVariant,
  SocialVariantAsset,
  CropData,
  SocialPlatform
} from "@/types/social-variants-ui"
```

### 2. Add Context Menu to Assets

```typescript
import { AssetCardWithVariants } from "./AssetContextMenu"

<AssetCardWithVariants
  asset={asset}
  variantCount={getVariantCount(asset.id)}
  onGenerateVariants={() => openGenerator(asset)}
  onViewVariants={() => showVariants(asset)}
>
  {/* Your existing asset card */}
</AssetCardWithVariants>
```

### 3. Implement Generation Flow

```typescript
const [showGenerator, setShowGenerator] = useState(false)
const [showPreview, setShowPreview] = useState(false)
const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([])

// Step 1: Open generator
const handleOpenGenerator = () => {
  setShowGenerator(true)
}

// Step 2: Handle generation
const handleGenerate = (variants: GeneratedVariant[]) => {
  setGeneratedVariants(variants)
  setShowGenerator(false)
  setShowPreview(true)
}

// Step 3: Handle approval
const handleApprove = (variantIds: string[]) => {
  const approved = generatedVariants.filter(v => variantIds.includes(v.id))
  saveVariantsToDatabase(approved)
  setShowPreview(false)
}

// Render
<SocialVariantGenerator
  sourceAsset={sourceAsset}
  open={showGenerator}
  onClose={() => setShowGenerator(false)}
  onGenerate={handleGenerate}
/>

<VariantPreviewGrid
  variants={generatedVariants}
  onApprove={handleApprove}
  onReject={handleReject}
  onAdjust={handleAdjust}
  onClose={() => setShowPreview(false)}
/>
```

### 4. Add to PhotoLightbox

```typescript
import { PhotoLightboxVariantsTab } from "./PhotoLightboxVariantsTab"

// Inside your lightbox overlay:
<PhotoLightboxVariantsTab
  sourceAssetId={currentAsset.id}
  variants={getVariantsForAsset(currentAsset.id)}
  onGenerateMore={() => openGenerator(currentAsset)}
  onExportAll={() => exportAllVariants(currentAsset.id)}
  onVariantClick={(variant) => viewVariantFullSize(variant)}
/>
```

## 🎨 Design System

All components use your existing Tailwind theme:

- **Colors**: dusty-rose, sage, dune, cream, warm-sand
- **Fonts**: Outfit (sans), Libre Baskerville (serif)
- **Components**: Match OmniBar, OmniChip, PhotoLightbox patterns
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React icons

## 📊 Platform & Variant Sizes

### Instagram (6 sizes)
- Square Post (1080×1080)
- Portrait Post (1080×1350)
- Landscape Post (1080×566)
- Story/Reel (1080×1920)
- Profile Picture (320×320)
- Carousel (1080×1080)

### Facebook (5 sizes)
- Post (1200×630)
- Story (1080×1920)
- Cover Photo (820×312)
- Profile Picture (180×180)
- Event Cover (1920×1005)

### Twitter (3 sizes)
- Post (1200×675)
- Header (1500×500)
- Profile Picture (400×400)

### LinkedIn (4 sizes)
- Post (1200×627)
- Article Cover (1200×627)
- Banner (1584×396)
- Profile Picture (400×400)

### YouTube (3 sizes)
- Thumbnail (1280×720)
- Channel Banner (2560×1440)
- Profile Picture (800×800)

### Pinterest (4 sizes)
- Pin (1000×1500)
- Long Pin (1000×2100)
- Square Pin (1000×1000)
- Profile Picture (165×165)

### TikTok (2 sizes)
- Video (1080×1920)
- Profile Picture (200×200)

## 🔧 Backend Integration

### Required API Endpoints

```typescript
// Generate variants (calls AI service)
POST /api/variants/generate
Body: {
  sourceAssetId: string
  platforms: SocialPlatform[]
  cropStrategy: CropStrategy
  letterboxStyle?: LetterboxStyle
}
Response: GeneratedVariant[]

// Save approved variants
POST /api/variants/save
Body: {
  variants: GeneratedVariant[]
  options: {
    autoSave: boolean
    createCollection: boolean
    autoTag: boolean
  }
}
Response: SocialVariantAsset[]

// Get variants for asset
GET /api/variants/by-source/:assetId
Response: SocialVariantAsset[]

// Update variant crop
PATCH /api/variants/:variantId/crop
Body: {
  cropData: CropData
}
Response: GeneratedVariant

// Export variants
POST /api/variants/export
Body: {
  variantIds: string[]
}
Response: { downloadUrl: string }
```

### AI Service Integration

The Smart AI Crop strategy requires:

1. **Face Detection**: Detects human faces in images
2. **Logo Detection**: Identifies brand logos and important graphics
3. **Text Detection**: Finds text regions in images
4. **Smart Cropping**: Calculates optimal crop boxes that preserve important elements

Example services:
- Google Cloud Vision API
- AWS Rekognition
- Azure Computer Vision
- Cloudinary AI Crop

## 🎭 Crop Strategies Explained

### Smart AI Crop (Recommended)
- Uses AI to detect faces, logos, text
- Calculates optimal crop box to preserve all important elements
- Provides quality scores and warnings
- Best for: Photos with people, branded content

### Center Crop
- Simple center-based cropping
- Fast, no AI processing required
- Best for: Centered subjects, symmetrical compositions

### Intelligent Letterbox
- Preserves entire image
- Adds borders as needed
- Three styles:
  - **Blur**: Blurred background from source image
  - **Solid**: Solid color background (customizable)
  - **Extend**: AI-extended edges from source image
- Best for: Images that shouldn't be cropped

## 📱 Mobile Responsiveness

All components are fully responsive:

- **SocialVariantGenerator**: Stacks on mobile, full modal on desktop
- **VariantPreviewGrid**: 1 col mobile → 6 cols desktop
- **VariantEditor**: Full-screen on mobile, sidebar on desktop
- **PhotoLightboxVariantsTab**: Horizontal scroll on mobile
- **AssetContextMenu**: Touch-friendly tap interactions

## ♿ Accessibility

- **ARIA labels** on all interactive elements
- **Keyboard navigation** support (Tab, Enter, Escape)
- **Screen reader** friendly labels and descriptions
- **Focus management** for modals and overlays
- **Color contrast** meets WCAG AA standards

## 🧪 Testing Considerations

```typescript
// Test variant generation
test('generates correct number of variants', async () => {
  const platforms = ['instagram', 'facebook']
  const variants = await generateVariants(sourceAsset, platforms)

  // Instagram has 6 sizes, Facebook has 5
  expect(variants.length).toBe(11)
})

// Test quality scoring
test('calculates quality score based on safe zones', () => {
  const crop = { x: 10, y: 10, width: 80, height: 80 }
  const safeZones = [
    { type: 'face', visibility: 100, status: 'perfect' },
    { type: 'logo', visibility: 85, status: 'warning' }
  ]

  const score = calculateQualityScore(crop, safeZones)
  expect(score).toBeGreaterThan(85)
})

// Test crop editing
test('updates crop data when dragging', () => {
  const { getByRole } = render(<VariantEditor variant={variant} />)
  const cropBox = getByRole('button', { name: /crop box/i })

  fireEvent.mouseDown(cropBox, { clientX: 100, clientY: 100 })
  fireEvent.mouseMove(window, { clientX: 150, clientY: 150 })
  fireEvent.mouseUp(window)

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    x: expect.any(Number),
    y: expect.any(Number)
  }))
})
```

## 🎯 Best Practices

1. **Performance**
   - Use lazy loading for variant thumbnails
   - Implement virtual scrolling for large variant lists
   - Cache generated variants to avoid regeneration

2. **UX**
   - Show progress indicators during generation
   - Provide clear warnings for problematic crops
   - Allow quick batch operations
   - Enable keyboard shortcuts

3. **Quality**
   - Set minimum quality score thresholds
   - Warn users about potential issues
   - Provide suggestions for improvements
   - Allow manual overrides

4. **Integration**
   - Store variant metadata with source asset
   - Tag variants automatically
   - Create collections for variant sets
   - Track export/usage analytics

## 📚 Additional Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [Social Media Image Sizes Guide](https://sproutsocial.com/insights/social-media-image-sizes-guide/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🤝 Support

For questions or issues:
1. Check the integration example: `SocialVariantsIntegrationExample.tsx`
2. Review the types file: `types/social-variants-ui.ts`
3. Refer to existing patterns: OmniBar, OmniChip, PhotoLightbox

---

Built with ❤️ for LashPop DAM
