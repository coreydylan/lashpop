# Smart Social Resizer - Intelligent Multi-Platform Asset Generator

> **Vision**: One source image → Perfect variants for every social platform, with intelligent cropping, composition awareness, and brand consistency.

**Last Updated**: 2025-01-16
**Status**: Design Phase
**Integration**: Part of AI-Powered DAM System

---

## 🎯 The Problem

Creating social media content is a nightmare:
- **16+ different image sizes** across platforms
- Manual cropping loses important content
- Inconsistent branding across sizes
- Hours of repetitive work
- Hard to track which variants exist
- Difficult to bulk export for publishing

---

## ✨ The Solution: Smart Social Resizer

### Core Concept

**Upload one hero image → AI automatically creates perfect variants for every platform**

```

Original Image (2400×1600)
         ↓
    [AI Analysis]
         ↓
┌────────┴────────┬────────┬────────┬────────┐
│                 │        │        │        │
Instagram       Facebook Twitter LinkedIn YouTube
  1:1             16:9     16:9     1.91:1    16:9
  4:5             1:1      2:1      1:1       9:16
  9:16            4:5
  Story
  Reel
```

**Smart Features**:
- 🧠 **AI-powered crop detection** - Finds optimal crop for each ratio
- 🎨 **Safe zone detection** - Ensures text/logos stay visible
- 👤 **Face detection** - Keeps faces in frame
- 📐 **Composition analysis** - Maintains rule of thirds
- 🎭 **Multiple strategies** - Crop, letterbox, or background extend
- 🏷️ **Auto-tagging** - Tags by platform/size for easy filtering
- 📦 **Bulk export** - "Export all Instagram posts from last week"

---

## 📊 Platform Specifications

### Complete Size Matrix

```typescript
interface PlatformSpec {
  platform: SocialPlatform
  variant: string
  width: number
  height: number
  ratio: string
  maxFileSize?: string
  format?: string[]
  notes?: string
}

const SOCIAL_SPECS: PlatformSpec[] = [
  // ========================================
  // INSTAGRAM
  // ========================================
  {
    platform: 'instagram',
    variant: 'square-post',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    maxFileSize: '30MB',
    format: ['jpg', 'png'],
    notes: 'Classic Instagram post'
  },
  {
    platform: 'instagram',
    variant: 'portrait-post',
    width: 1080,
    height: 1350,
    ratio: '4:5',
    maxFileSize: '30MB',
    format: ['jpg', 'png'],
    notes: 'Portrait post (recommended)'
  },
  {
    platform: 'instagram',
    variant: 'landscape-post',
    width: 1080,
    height: 566,
    ratio: '1.91:1',
    maxFileSize: '30MB',
    format: ['jpg', 'png'],
    notes: 'Landscape post'
  },
  {
    platform: 'instagram',
    variant: 'story',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    maxFileSize: '30MB',
    format: ['jpg', 'png'],
    notes: 'Stories & Reels vertical'
  },
  {
    platform: 'instagram',
    variant: 'carousel',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    maxFileSize: '30MB',
    format: ['jpg', 'png'],
    notes: 'Carousel album images'
  },
  {
    platform: 'instagram',
    variant: 'profile-picture',
    width: 320,
    height: 320,
    ratio: '1:1',
    maxFileSize: '2MB',
    format: ['jpg', 'png'],
    notes: 'Profile photo (displayed at 110×110)'
  },

  // ========================================
  // FACEBOOK
  // ========================================
  {
    platform: 'facebook',
    variant: 'post-link',
    width: 1200,
    height: 630,
    ratio: '1.91:1',
    maxFileSize: '8MB',
    format: ['jpg', 'png'],
    notes: 'Link preview image'
  },
  {
    platform: 'facebook',
    variant: 'post-square',
    width: 1200,
    height: 1200,
    ratio: '1:1',
    maxFileSize: '8MB',
    format: ['jpg', 'png'],
    notes: 'Square post'
  },
  {
    platform: 'facebook',
    variant: 'post-portrait',
    width: 1200,
    height: 1500,
    ratio: '4:5',
    maxFileSize: '8MB',
    format: ['jpg', 'png'],
    notes: 'Portrait post'
  },
  {
    platform: 'facebook',
    variant: 'story',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    maxFileSize: '30MB',
    format: ['jpg', 'png'],
    notes: 'Facebook Stories'
  },
  {
    platform: 'facebook',
    variant: 'cover-photo',
    width: 820,
    height: 312,
    ratio: '2.63:1',
    maxFileSize: '100KB',
    format: ['jpg', 'png'],
    notes: 'Profile cover (desktop)'
  },
  {
    platform: 'facebook',
    variant: 'profile-picture',
    width: 180,
    height: 180,
    ratio: '1:1',
    maxFileSize: '100KB',
    format: ['jpg', 'png'],
    notes: 'Profile photo (displayed circular)'
  },
  {
    platform: 'facebook',
    variant: 'event-cover',
    width: 1920,
    height: 1005,
    ratio: '1.91:1',
    maxFileSize: '100MB',
    format: ['jpg', 'png'],
    notes: 'Event header image'
  },

  // ========================================
  // TWITTER / X
  // ========================================
  {
    platform: 'twitter',
    variant: 'post-landscape',
    width: 1200,
    height: 675,
    ratio: '16:9',
    maxFileSize: '5MB',
    format: ['jpg', 'png', 'gif'],
    notes: 'In-stream photo (landscape)'
  },
  {
    platform: 'twitter',
    variant: 'post-square',
    width: 1200,
    height: 1200,
    ratio: '1:1',
    maxFileSize: '5MB',
    format: ['jpg', 'png', 'gif'],
    notes: 'In-stream photo (square)'
  },
  {
    platform: 'twitter',
    variant: 'post-portrait',
    width: 1200,
    height: 1500,
    ratio: '4:5',
    maxFileSize: '5MB',
    format: ['jpg', 'png', 'gif'],
    notes: 'In-stream photo (portrait)'
  },
  {
    platform: 'twitter',
    variant: 'header',
    width: 1500,
    height: 500,
    ratio: '3:1',
    maxFileSize: '5MB',
    format: ['jpg', 'png'],
    notes: 'Profile header'
  },
  {
    platform: 'twitter',
    variant: 'profile-picture',
    width: 400,
    height: 400,
    ratio: '1:1',
    maxFileSize: '2MB',
    format: ['jpg', 'png'],
    notes: 'Profile photo (displayed circular)'
  },

  // ========================================
  // LINKEDIN
  // ========================================
  {
    platform: 'linkedin',
    variant: 'post-landscape',
    width: 1200,
    height: 627,
    ratio: '1.91:1',
    maxFileSize: '5MB',
    format: ['jpg', 'png'],
    notes: 'Link preview'
  },
  {
    platform: 'linkedin',
    variant: 'post-square',
    width: 1200,
    height: 1200,
    ratio: '1:1',
    maxFileSize: '5MB',
    format: ['jpg', 'png'],
    notes: 'Square post'
  },
  {
    platform: 'linkedin',
    variant: 'cover-photo-personal',
    width: 1584,
    height: 396,
    ratio: '4:1',
    maxFileSize: '8MB',
    format: ['jpg', 'png'],
    notes: 'Personal profile background'
  },
  {
    platform: 'linkedin',
    variant: 'cover-photo-company',
    width: 1128,
    height: 191,
    ratio: '5.9:1',
    maxFileSize: '4MB',
    format: ['jpg', 'png'],
    notes: 'Company page cover'
  },
  {
    platform: 'linkedin',
    variant: 'profile-picture',
    width: 400,
    height: 400,
    ratio: '1:1',
    maxFileSize: '8MB',
    format: ['jpg', 'png'],
    notes: 'Profile photo (square crop)'
  },
  {
    platform: 'linkedin',
    variant: 'company-logo',
    width: 300,
    height: 300,
    ratio: '1:1',
    maxFileSize: '4MB',
    format: ['jpg', 'png'],
    notes: 'Company page logo (square)'
  },

  // ========================================
  // YOUTUBE
  // ========================================
  {
    platform: 'youtube',
    variant: 'thumbnail',
    width: 1280,
    height: 720,
    ratio: '16:9',
    maxFileSize: '2MB',
    format: ['jpg', 'png'],
    notes: 'Video thumbnail'
  },
  {
    platform: 'youtube',
    variant: 'channel-cover',
    width: 2560,
    height: 1440,
    ratio: '16:9',
    maxFileSize: '6MB',
    format: ['jpg', 'png'],
    notes: 'Channel banner (safe zone: 1546×423)'
  },
  {
    platform: 'youtube',
    variant: 'profile-picture',
    width: 800,
    height: 800,
    ratio: '1:1',
    maxFileSize: '4MB',
    format: ['jpg', 'png'],
    notes: 'Channel icon (displayed circular)'
  },
  {
    platform: 'youtube',
    variant: 'community-post',
    width: 1200,
    height: 675,
    ratio: '16:9',
    maxFileSize: '16MB',
    format: ['jpg', 'png', 'gif'],
    notes: 'Community tab posts'
  },

  // ========================================
  // PINTEREST
  // ========================================
  {
    platform: 'pinterest',
    variant: 'standard-pin',
    width: 1000,
    height: 1500,
    ratio: '2:3',
    maxFileSize: '32MB',
    format: ['jpg', 'png'],
    notes: 'Standard pin (optimal)'
  },
  {
    platform: 'pinterest',
    variant: 'square-pin',
    width: 1000,
    height: 1000,
    ratio: '1:1',
    maxFileSize: '32MB',
    format: ['jpg', 'png'],
    notes: 'Square pin'
  },
  {
    platform: 'pinterest',
    variant: 'long-pin',
    width: 1000,
    height: 2100,
    ratio: '1:2.1',
    maxFileSize: '32MB',
    format: ['jpg', 'png'],
    notes: 'Infographic style (max)'
  },
  {
    platform: 'pinterest',
    variant: 'profile-picture',
    width: 165,
    height: 165,
    ratio: '1:1',
    maxFileSize: '10MB',
    format: ['jpg', 'png'],
    notes: 'Profile photo (displayed circular)'
  },

  // ========================================
  // TIKTOK
  // ========================================
  {
    platform: 'tiktok',
    variant: 'video-cover',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    maxFileSize: '500MB',
    format: ['jpg', 'png'],
    notes: 'Vertical video thumbnail'
  },
  {
    platform: 'tiktok',
    variant: 'profile-picture',
    width: 200,
    height: 200,
    ratio: '1:1',
    maxFileSize: '500KB',
    format: ['jpg', 'png'],
    notes: 'Profile photo (displayed circular)'
  }
]
```

---

## 🧠 Smart Cropping Algorithm

### Multi-Strategy Approach

```typescript
interface CropStrategy {
  name: string
  priority: number
  apply: (image: Image, targetRatio: number) => CroppedImage
}

// Strategy 1: AI-Powered Smart Crop
async function aiSmartCrop(image: Image, targetRatio: number): Promise<CroppedImage> {
  // Use AI to detect important regions
  const analysis = await analyzeImage(image)

  // Detected elements
  const faces = analysis.faces  // Face detection
  const objects = analysis.objects  // Object detection
  const saliency = analysis.saliencyMap  // Attention heatmap
  const composition = analysis.composition  // Rule of thirds, leading lines

  // Calculate importance scores for all possible crops
  const crops = generateAllPossibleCrops(image, targetRatio)

  const scored = crops.map(crop => ({
    crop,
    score: calculateCropScore(crop, {
      faces,
      objects,
      saliency,
      composition,
      safeZones: detectTextSafeZones(image)
    })
  }))

  // Return highest scoring crop
  return scored.sort((a, b) => b.score - a.score)[0].crop
}

// Strategy 2: Center-Weighted Crop
function centerWeightedCrop(image: Image, targetRatio: number): CroppedImage {
  // Simple fallback: crop from center
  const sourceRatio = image.width / image.height

  if (targetRatio > sourceRatio) {
    // Target is wider - crop top/bottom
    const targetHeight = image.width / targetRatio
    const yOffset = (image.height - targetHeight) / 2

    return {
      x: 0,
      y: yOffset,
      width: image.width,
      height: targetHeight
    }
  } else {
    // Target is taller - crop left/right
    const targetWidth = image.height * targetRatio
    const xOffset = (image.width - targetWidth) / 2

    return {
      x: xOffset,
      y: 0,
      width: targetWidth,
      height: image.height
    }
  }
}

// Strategy 3: Intelligent Letterbox
function intelligentLetterbox(image: Image, targetRatio: number): CroppedImage {
  // Add background instead of cropping
  const sourceRatio = image.width / image.height

  // Extract dominant color or blur background
  const bgStrategy = detectBestBackgroundStrategy(image)

  if (bgStrategy === 'blur') {
    // Blur the source image for background
    return {
      method: 'letterbox-blur',
      background: blurImage(image, 50),
      overlay: image,
      targetRatio
    }
  } else if (bgStrategy === 'solid') {
    // Use dominant color
    const dominantColor = extractDominantColor(image)
    return {
      method: 'letterbox-solid',
      backgroundColor: dominantColor,
      overlay: image,
      targetRatio
    }
  } else {
    // Extend edges intelligently (AI inpainting)
    return {
      method: 'letterbox-extend',
      aiExtend: true,
      targetRatio
    }
  }
}

// Strategy 4: Multi-Focal Point
function multiFocalCrop(image: Image, targetRatio: number, focalPoints: Point[]): CroppedImage {
  // Keep multiple important points in frame
  const boundingBox = calculateBoundingBox(focalPoints)

  // Ensure bounding box fits target ratio
  const adjustedBox = adjustToRatio(boundingBox, targetRatio)

  // Center the crop around focal points
  return {
    x: adjustedBox.x,
    y: adjustedBox.y,
    width: adjustedBox.width,
    height: adjustedBox.height
  }
}
```

### Safe Zone Detection

```typescript
interface SafeZone {
  x: number
  y: number
  width: number
  height: number
  importance: 'critical' | 'important' | 'optional'
  type: 'face' | 'logo' | 'text' | 'product' | 'subject'
}

async function detectSafeZones(image: Image): Promise<SafeZone[]> {
  const zones: SafeZone[] = []

  // Detect faces (critical - must stay in frame)
  const faces = await detectFaces(image)
  faces.forEach(face => {
    zones.push({
      ...face.bounds,
      importance: 'critical',
      type: 'face'
    })
  })

  // Detect logos (important)
  const logos = await detectLogos(image)
  logos.forEach(logo => {
    zones.push({
      ...logo.bounds,
      importance: 'important',
      type: 'logo'
    })
  })

  // Detect text regions (important)
  const textRegions = await detectText(image)
  textRegions.forEach(text => {
    zones.push({
      ...text.bounds,
      importance: 'important',
      type: 'text'
    })
  })

  // Detect main subject (critical)
  const subjects = await detectSubjects(image)
  subjects.forEach(subject => {
    zones.push({
      ...subject.bounds,
      importance: 'critical',
      type: 'subject'
    })
  })

  return zones
}

function validateCrop(crop: CroppedImage, safeZones: SafeZone[]): {
  valid: boolean
  violations: SafeZone[]
  score: number
} {
  const violations: SafeZone[] = []
  let score = 100

  for (const zone of safeZones) {
    const overlap = calculateOverlap(crop, zone)

    if (zone.importance === 'critical' && overlap < 0.95) {
      // Critical zones must be 95% visible
      violations.push(zone)
      score -= 50
    } else if (zone.importance === 'important' && overlap < 0.8) {
      // Important zones should be 80% visible
      violations.push(zone)
      score -= 20
    } else if (overlap < 0.5) {
      // Any zone should be at least 50% visible
      score -= 10
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    score: Math.max(0, score)
  }
}
```

---

## 🎨 Social Variant Asset Type

```typescript
interface SocialVariantAsset extends BaseAsset {
  type: AssetType.SOCIAL_VARIANT

  // Link to source
  sourceAssetId: string  // Original image

  // Platform details
  platform: SocialPlatform
  variant: string

  // Dimensions
  width: number
  height: number
  ratio: string

  // Generation method
  cropStrategy: 'smart-crop' | 'center-crop' | 'letterbox' | 'extend'

  // Crop details (for smart crop)
  crop?: {
    x: number
    y: number
    width: number
    height: number
    safeZones: SafeZone[]
    score: number
  }

  // Letterbox details (if used)
  letterbox?: {
    method: 'blur' | 'solid' | 'extend'
    backgroundColor?: string
  }

  // Validation
  validation: {
    safeZonesPreserved: boolean
    qualityScore: number
    warnings?: string[]
  }

  // Storage
  storageKey: string  // S3 location of resized image

  // Export metadata
  exported: boolean
  exportedAt?: Date
  exportedTo?: string  // Platform, campaign name, etc.
}

enum SocialPlatform {
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
  PINTEREST = 'pinterest',
  TIKTOK = 'tiktok',
  SNAPCHAT = 'snapchat'
}
```

---

## 🎬 User Workflows

### Workflow 1: Generate All Social Variants

```
1. Select source image (hero photo)
2. Command: "generate social variants"
3. System shows platform selector:

   ┌─────────────────────────────────────────┐
   │ Generate Social Variants                │
   ├─────────────────────────────────────────┤
   │ Source: Summer_Campaign_Hero.jpg        │
   │                                          │
   │ SELECT PLATFORMS                         │
   │ ☑ Instagram (6 variants)                │
   │ ☑ Facebook (7 variants)                 │
   │ ☑ Twitter (5 variants)                  │
   │ ☐ LinkedIn (6 variants)                 │
   │ ☐ YouTube (4 variants)                  │
   │ ☐ Pinterest (4 variants)                │
   │ ☐ TikTok (2 variants)                   │
   │                                          │
   │ CROP STRATEGY                            │
   │ ◉ Smart AI crop (recommended)           │
   │ ○ Center crop                            │
   │ ○ Letterbox (add background)            │
   │                                          │
   │ NAMING                                   │
   │ ${source}_${platform}_${variant}        │
   │                                          │
   │ PREVIEW                                  │
   │ Will generate: 18 variants              │
   │ Estimated time: ~30 seconds             │
   │                                          │
   │ [Cancel]        [Generate All]          │
   └─────────────────────────────────────────┘

4. AI generates all variants
5. Shows preview grid for approval
6. Save to collection "Social Variants - Summer Campaign"
```

### Workflow 2: Review & Edit Variants

```
1. View source image in lightbox
2. See "Variants" tab showing all social variants

   ┌─────────────────────────────────────────┐
   │ Variants (18)                  [+ Add]  │
   ├─────────────────────────────────────────┤
   │                                          │
   │ INSTAGRAM (6)                            │
   │ [1:1]  [4:5]  [1.91:1]  [9:16]  [...]  │
   │  1080   1080    1080     1080           │
   │  ×1080  ×1350   ×566     ×1920          │
   │   ✅     ✅      ⚠️       ✅            │
   │                                          │
   │ FACEBOOK (7)                             │
   │ [1.91:1] [1:1] [4:5] [9:16] [...]      │
   │   ✅     ✅     ✅     ✅               │
   │                                          │
   │ TWITTER (5)                              │
   │ [16:9] [1:1] [4:5] [...]                │
   │   ✅    ✅    ✅                         │
   │                                          │
   └─────────────────────────────────────────┘

3. Click variant with warning (⚠️)
4. See issue: "Face partially cropped"
5. Click "Adjust crop"
6. Drag crop box to reframe
7. Save adjustment
```

### Workflow 3: Bulk Export by Platform

```
1. Command palette: "export all instagram images created in last 5 days"
2. System filters:
   - assetType: SOCIAL_VARIANT
   - platform: INSTAGRAM
   - createdAt: >= 5 days ago
3. Shows selection: 47 Instagram variants
4. Export options:

   ┌─────────────────────────────────────────┐
   │ Export 47 Instagram Variants            │
   ├─────────────────────────────────────────┤
   │                                          │
   │ FORMAT                                   │
   │ ◉ Original (PNG/JPG as created)        │
   │ ○ Force JPG (optimize for upload)      │
   │ ○ Force PNG (preserve quality)          │
   │                                          │
   │ QUALITY                                  │
   │ ━━━━━━●━━━ 85% (Instagram optimized)    │
   │                                          │
   │ ORGANIZATION                             │
   │ ◉ Organize by variant type              │
   │   └─ /instagram-square/                 │
   │   └─ /instagram-portrait/               │
   │   └─ /instagram-story/                  │
   │ ○ Flat structure                         │
   │ ○ By source image                       │
   │                                          │
   │ NAMING                                   │
   │ ${source}_${variant}_${date}            │
   │                                          │
   │ INCLUDE                                  │
   │ ☑ Metadata (JSON file)                  │
   │ ☐ Source images                          │
   │                                          │
   │ Total size: ~24 MB                      │
   │                                          │
   │ [Cancel]        [Download ZIP]          │
   └─────────────────────────────────────────┘

5. Downloads organized ZIP
6. Marks all as exported
```

### Workflow 4: Platform-Specific Batch

```
Command: "create facebook posts from [selected 10 images]"

→ System generates:
  - 10 × Facebook Post (1200×630) = 10 variants
  - 10 × Facebook Square (1200×1200) = 10 variants
  - 10 × Facebook Portrait (1200×1500) = 10 variants
  Total: 30 variants

→ Auto-groups into collection: "Facebook - [Date]"
→ Ready for bulk export
```

---

## 🎛️ UI Components

### Social Variant Generator Modal

```tsx
<SocialVariantGenerator
  sourceAsset={currentImage}
  onGenerate={(variants) => {
    // Save variants
    // Show preview
  }}
/>
```

**UI:**
```
┌─────────────────────────────────────────────────────────┐
│  Generate Social Variants                         [×]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SOURCE IMAGE                                            │
│  ┌────────────────────────────────┐                     │
│  │                                 │                     │
│  │     [Preview Image]             │                     │
│  │     2400 × 1600 (3:2)          │                     │
│  │                                 │                     │
│  └────────────────────────────────┘                     │
│                                                          │
│  PLATFORMS & VARIANTS                                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  ☑ Instagram                            [6 sizes]  │ │
│  │    Square (1:1), Portrait (4:5), Landscape (1.91:1) │ │
│  │    Story (9:16), Carousel, Profile                 │ │
│  │                                                     │ │
│  │  ☑ Facebook                             [7 sizes]  │ │
│  │    Link Preview (1.91:1), Square (1:1), Portrait   │ │
│  │    Story (9:16), Cover, Profile, Event             │ │
│  │                                                     │ │
│  │  ☑ Twitter                              [5 sizes]  │ │
│  │    Landscape (16:9), Square (1:1), Portrait (4:5)  │ │
│  │    Header (3:1), Profile                           │ │
│  │                                                     │ │
│  │  ☐ LinkedIn                             [6 sizes]  │ │
│  │  ☐ YouTube                              [4 sizes]  │ │
│  │  ☐ Pinterest                            [4 sizes]  │ │
│  │  ☐ TikTok                               [2 sizes]  │ │
│  │                                                     │ │
│  │  [Select All Platforms]  [Select Common Only]     │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  CROP STRATEGY                                           │
│  ◉ Smart AI Crop                                        │
│    Uses AI to detect faces, objects, and composition   │
│    and finds optimal crop for each size                │
│                                                          │
│  ○ Center Crop                                          │
│    Simple center-weighted crop (faster)                │
│                                                          │
│  ○ Intelligent Letterbox                                │
│    Adds background instead of cropping (preserves all) │
│    Background: ◉ Blur  ○ Solid Color  ○ AI Extend     │
│                                                          │
│  SAFE ZONES (Optional)                                   │
│  ☑ Auto-detect faces                                    │
│  ☑ Auto-detect text/logos                               │
│  ☐ Manual safe zone selection                           │
│                                                          │
│  NAMING CONVENTION                                       │
│  [${source}_${platform}_${variant}     ▼]              │
│  Preview: "summer_hero_instagram_square.jpg"            │
│                                                          │
│  PREVIEW                                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Will generate: 18 variants                         │ │
│  │ Estimated time: ~35 seconds                        │ │
│  │ Total size: ~12 MB                                 │ │
│  │                                                     │ │
│  │ Platforms: Instagram (6), Facebook (7), Twitter (5)│ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Cancel]  [Preview First]  [Generate All]              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Variant Preview Grid

```tsx
<VariantPreviewGrid
  variants={generatedVariants}
  onApprove={handleApprove}
  onReject={handleReject}
  onAdjust={handleAdjust}
/>
```

**UI:**
```
┌─────────────────────────────────────────────────────────┐
│  Review Generated Variants                    [18/18]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  INSTAGRAM (6)                                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │ 1:1  │ │ 4:5  │ │1.91:1│ │ 9:16 │ │Carous│ │Profil││
│  │      │ │      │ │      │ │      │ │ sel  │ │ e    ││
│  │  ✅  │ │  ✅  │ │  ⚠️  │ │  ✅  │ │  ✅  │ │  ✅  ││
│  │[Edit]│ │[Edit]│ │[Edit]│ │[Edit]│ │[Edit]│ │[Edit]││
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
│           Warning: Face 15% cropped ↑                   │
│                                                          │
│  FACEBOOK (7)                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ...     │
│  │      │ │      │ │      │ │      │ │      │          │
│  │  ✅  │ │  ✅  │ │  ✅  │ │  ✅  │ │  ✅  │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                          │
│  TWITTER (5)                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │      │ │      │ │      │ │      │ │      │          │
│  │  ✅  │ │  ✅  │ │  ✅  │ │  ✅  │ │  ✅  │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                          │
│  LEGEND                                                  │
│  ✅ Perfect crop   ⚠️  Minor issue   ❌ Needs adjustment│
│                                                          │
│  ACTIONS                                                 │
│  ☑ Auto-save approved variants                          │
│  ☑ Create collection: "Social - Summer Campaign"       │
│  ☑ Tag with: #summer #campaign #social                  │
│                                                          │
│  [Regenerate All] [Approve 17/18] [Discard]             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Variant Editor (Crop Adjustment)

```
┌─────────────────────────────────────────────────────────┐
│  Adjust Crop: Instagram Landscape (1.91:1)       [×]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │    ╔════════════════════════════╗                 │ │
│  │    ║                             ║                 │ │
│  │    ║   [Image with crop box]     ║                 │ │
│  │    ║                             ║                 │ │
│  │    ║   👤 ← Face detected       ║                 │ │
│  │    ║                             ║                 │ │
│  │    ╚════════════════════════════╝                 │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  SAFE ZONES                                              │
│  ☑ Face (100% visible) ✅                               │
│  ☑ Logo (85% visible) ⚠️                                │
│  ☐ Text (Not detected)                                  │
│                                                          │
│  CROP QUALITY: 72/100 ⚠️                                │
│  • Face: Perfect ✅                                     │
│  • Logo: Partially cropped ⚠️                           │
│  • Composition: Good rule of thirds ✅                  │
│                                                          │
│  SUGGESTIONS                                             │
│  • Shift left 50px to include full logo                │
│  • Alternative: Use letterbox mode                      │
│                                                          │
│  [Reset] [Auto-Fix] [Switch to Letterbox] [Save]       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Command Palette Integration

### Natural Language Commands

```typescript
// Generation
"generate social variants"
"create instagram posts from selected"
"make facebook versions of this image"
"generate all social sizes for [selected]"

// Platform-specific
"create instagram square from this"
"generate twitter header from [IMG_123]"
"make linkedin post from selected"

// Batch operations
"generate social variants for all [Summer Campaign]"
"create instagram posts from last 10 uploads"

// Export
"export all instagram images"
"export all facebook posts created this week"
"export all instagram images created in last 5 days"
"download all social variants from [Summer Campaign]"

// Platform-date combinations
"export all twitter posts from last month"
"download instagram stories created today"
"export facebook posts tagged #campaign"

// Advanced
"regenerate all instagram variants for [IMG_456]"
"replace all social variants of [old_image] with [new_image]"
"show me all social variants that need regeneration"
```

### Command Implementation

```typescript
// In command grammar
{
  id: 'generate-social-variants',
  verb: 'generate',
  object: 'social variants',
  modifiers: ['for selected', 'for all', 'instagram only', 'facebook only'],

  execute: async (selection, modifiers) => {
    const sources = selection.photos
    const platforms = modifiers.platforms || 'all'

    const results = await generateSocialVariants({
      sources,
      platforms,
      strategy: 'smart-crop'
    })

    return {
      generated: results.length,
      collection: await createCollection({
        name: `Social Variants - ${new Date().toISOString()}`,
        assets: results
      })
    }
  }
}

{
  id: 'export-social-by-platform-date',
  verb: 'export',
  object: 'social variants',
  filters: {
    platform: SocialPlatform,
    timeRange: TimeRange
  },

  execute: async (filters) => {
    const variants = await querySocialVariants({
      platform: filters.platform,
      createdAfter: filters.timeRange.start,
      createdBefore: filters.timeRange.end
    })

    const zip = await createSocialVariantZip(variants, {
      organize: 'by-variant',
      includeMetadata: true
    })

    // Mark as exported
    await markAsExported(variants.map(v => v.id))

    return { zip, count: variants.length }
  }
}
```

---

## 🔄 Auto-Generation on Upload

```typescript
// Optional: Auto-generate variants on upload
interface UploadSettings {
  autoGenerateSocial: boolean
  platforms: SocialPlatform[]
  strategy: CropStrategy
  skipPreview: boolean  // Auto-approve
}

async function handlePhotoUpload(file: File, settings: UploadSettings) {
  // Upload original
  const asset = await uploadAsset(file)

  // Auto-generate social variants if enabled
  if (settings.autoGenerateSocial) {
    const variants = await generateSocialVariants({
      source: asset.id,
      platforms: settings.platforms,
      strategy: settings.strategy
    })

    if (settings.skipPreview) {
      // Auto-approve and save
      await saveVariants(variants)
    } else {
      // Show preview for approval
      showVariantPreview(variants)
    }
  }

  return asset
}
```

---

## 🎯 Smart Collections for Social Variants

```typescript
// Auto-populated smart collections

{
  name: "Instagram Posts - Ready to Export",
  type: "smart",
  rules: {
    assetType: "social_variant",
    platform: "instagram",
    exported: false,
    validation: { safeZonesPreserved: true }
  },
  autoUpdate: true
}

{
  name: "Social Variants - This Week",
  type: "smart",
  rules: {
    assetType: "social_variant",
    createdAfter: "7 days ago"
  }
}

{
  name: "Needs Re-crop (Face Issues)",
  type: "smart",
  rules: {
    assetType: "social_variant",
    "validation.warnings": { contains: "face" }
  }
}

{
  name: "Exported Social Content",
  type: "smart",
  rules: {
    assetType: "social_variant",
    exported: true
  },
  sortBy: "exportedAt",
  sortOrder: "desc"
}
```

---

## 🚀 Next Steps

This feature integrates with:
1. **Polymorphic Asset System** - Social variants are a new asset type
2. **Command Palette** - Natural language commands for generation/export
3. **AI System** - Smart cropping, safe zone detection
4. **Derivative Tracking** - All variants linked to source
5. **Smart Collections** - Auto-organize by platform/status

**Implementation Priority**: HIGH
This is a massive time-saver and key differentiator!

Should we build this? 🎨📱
