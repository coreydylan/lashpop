# Smart Cropping Engine

A comprehensive image processing library for social media content optimization, featuring AI-powered smart cropping, safe zone detection, and multiple cropping strategies.

## Features

- **4 Cropping Strategies**: AI Smart Crop, Center-Weighted, Multi-Focal, and Intelligent Letterbox
- **Face Detection Integration**: Uses MediaPipe landmarks to optimize crops around faces
- **Safe Zone Detection**: Automatically detects and preserves important image regions
- **Crop Validation**: Validates crops against safe zones with importance levels
- **Platform Optimization**: Pre-configured specs for Instagram, Facebook, Twitter, etc.
- **Multiple Letterbox Methods**: Blur, solid color, and edge extension backgrounds

## Installation

The library uses Sharp for image processing:

```bash
npm install sharp
```

## Quick Start

```typescript
import { generateOptimalCrop, CropStrategy, PlatformSpec } from '@/lib/image-processing'
import fs from 'fs'

// Load your image
const imageBuffer = fs.readFileSync('photo.jpg')

// Define target platform
const instagramSquare: PlatformSpec = {
  name: 'Instagram Square',
  width: 1080,
  height: 1080,
  quality: 85
}

// Generate optimal crop
const result = await generateOptimalCrop(
  imageBuffer,
  instagramSquare,
  CropStrategy.SMART_CROP
)

// Save the result
fs.writeFileSync('cropped.jpg', result.croppedImage)
console.log('Validation Score:', result.validationScore)
console.log('Warnings:', result.validationWarnings)
```

## API Reference

### Main Functions

#### `generateOptimalCrop()`

The primary function for generating optimized crops.

```typescript
async function generateOptimalCrop(
  imageBuffer: Buffer,
  targetSpec: PlatformSpec,
  strategy?: CropStrategy,
  options?: SmartCropOptions
): Promise<OptimalCropResult>
```

**Parameters:**
- `imageBuffer`: Source image as Buffer
- `targetSpec`: Target platform specification (width, height, quality)
- `strategy`: Cropping strategy (default: `SMART_CROP`)
- `options`: Optional face landmarks and safe zones

**Returns:**
- `croppedImage`: Processed image buffer
- `cropData`: Crop coordinates and dimensions (if using crop strategy)
- `letterboxData`: Letterbox information (if using letterbox strategy)
- `validationScore`: Score 0-100 indicating crop quality
- `validationWarnings`: Array of warning messages

### Cropping Strategies

#### 1. AI Smart Crop (`CropStrategy.SMART_CROP`)

Uses face detection and composition rules to generate optimal crops.

```typescript
import { aiSmartCrop } from '@/lib/image-processing'

const result = await aiSmartCrop(imageBuffer, 1080, 1080, {
  faceLandmarks: [
    {
      leftEye: { x: 0.4, y: 0.35 },
      rightEye: { x: 0.6, y: 0.35 },
      nose: { x: 0.5, y: 0.4 },
      mouth: { x: 0.5, y: 0.5 },
      leftEyelidContour: [],
      rightEyelidContour: []
    }
  ]
})

console.log('Crop Score:', result.score)
console.log('Crop Data:', result.cropData)
```

**Features:**
- Face-centered composition
- Rule of thirds optimization
- Safe zone preservation
- Multiple candidate scoring

#### 2. Center-Weighted Crop (`CropStrategy.CENTER_WEIGHTED`)

Simple center-based cropping as a reliable fallback.

```typescript
import { centerWeightedCrop } from '@/lib/image-processing'

const result = await centerWeightedCrop(imageBuffer, 1080, 1080)
```

**Use Cases:**
- Landscapes without faces
- Abstract images
- Fallback when AI crop fails

#### 3. Multi-Focal Point Crop (`CropStrategy.MULTI_FOCAL`)

Keeps multiple important points in frame.

```typescript
import { multiFocalCrop, FocalPoint } from '@/lib/image-processing'

const focalPoints: FocalPoint[] = [
  { x: 500, y: 300, weight: 1.0 },
  { x: 1400, y: 700, weight: 0.8 }
]

const result = await multiFocalCrop(imageBuffer, 1080, 1080, focalPoints)
```

**Use Cases:**
- Group photos
- Multiple subjects
- Product layouts

#### 4. Intelligent Letterbox

Fits entire image within target dimensions using various background methods.

**A. Blur Background (`CropStrategy.LETTERBOX_BLUR`)**

```typescript
import { intelligentLetterbox } from '@/lib/image-processing'

const result = await intelligentLetterbox(imageBuffer, 1080, 1920, 'blur')
```

**B. Solid Color Background (`CropStrategy.LETTERBOX_SOLID`)**

```typescript
const result = await intelligentLetterbox(imageBuffer, 1080, 1920, 'solid')
console.log('Background Color:', result.letterboxData.backgroundColor)
```

**C. Edge Extension (`CropStrategy.LETTERBOX_EXTEND`)**

```typescript
const result = await intelligentLetterbox(imageBuffer, 1080, 1920, 'extend')
```

**Use Cases:**
- Preserve entire image
- Extreme aspect ratio changes
- Cinematic effects

### Safe Zones

#### Detect Safe Zones

```typescript
import { detectSafeZones } from '@/lib/image-processing'

const safeZones = await detectSafeZones(imageBuffer, faceLandmarks)

safeZones.forEach(zone => {
  console.log(`${zone.label}: ${zone.importance}`)
  console.log(`Position: (${zone.x}, ${zone.y})`)
  console.log(`Size: ${zone.width}x${zone.height}`)
})
```

**Detected Zones:**
- **Face zones**: Critical importance, created from MediaPipe landmarks
- **Text regions**: Important importance, detected via edge detection

#### Validate Crop

```typescript
import { validateCrop, SafeZoneImportance } from '@/lib/image-processing'

const cropData = {
  x: 400,
  y: 200,
  width: 1080,
  height: 1080
}

const validation = validateCrop(cropData, safeZones, imageWidth, imageHeight)

console.log('Valid:', validation.valid)
console.log('Score:', validation.score)
console.log('Violations:', validation.violations.length)
validation.warnings.forEach(warning => console.log('⚠️', warning))
```

**Safe Zone Importance Levels:**
- `CRITICAL`: Must be 95%+ visible (e.g., faces)
- `IMPORTANT`: Should be 80%+ visible (e.g., text)
- `PREFERRED`: Nice to have 60%+ visible

### Utility Functions

#### Get Image Metadata

```typescript
import { getImageMetadata } from '@/lib/image-processing'

const metadata = await getImageMetadata(imageBuffer)
console.log(metadata)
// {
//   width: 1920,
//   height: 1080,
//   format: 'jpeg',
//   hasAlpha: false,
//   aspectRatio: 1.777
// }
```

#### Extract Dominant Color

```typescript
import { extractDominantColor } from '@/lib/image-processing'

const color = await extractDominantColor(imageBuffer)
console.log('Dominant Color:', color) // "#3498db"
```

#### Resize Image

```typescript
import { resizeImage } from '@/lib/image-processing'

const resized = await resizeImage(imageBuffer, 800, 600, 'cover')
```

## Platform Specifications

### Instagram

```typescript
const specs = {
  square: {
    name: 'Instagram Square',
    width: 1080,
    height: 1080,
    quality: 85
  },
  portrait: {
    name: 'Instagram Portrait',
    width: 1080,
    height: 1350,
    quality: 85
  },
  story: {
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    quality: 85
  }
}
```

### Facebook

```typescript
const specs = {
  feed: {
    name: 'Facebook Feed',
    width: 1200,
    height: 630,
    quality: 85
  },
  story: {
    name: 'Facebook Story',
    width: 1080,
    height: 1920,
    quality: 85
  }
}
```

### Twitter

```typescript
const specs = {
  card: {
    name: 'Twitter Card',
    width: 1200,
    height: 600,
    quality: 85
  }
}
```

## Advanced Examples

### Complete Workflow with Face Detection

```typescript
import {
  generateOptimalCrop,
  detectSafeZones,
  CropStrategy
} from '@/lib/image-processing'
import { detectFaceLandmarks } from '@/lib/mediapipe-face'

// 1. Detect faces (client-side with MediaPipe)
const video = document.querySelector('video')
const faceLandmarks = await detectFaceLandmarks(video, Date.now())

// 2. Load image buffer (server-side)
const imageBuffer = await loadImageFromVideo(video)

// 3. Detect safe zones
const safeZones = await detectSafeZones(imageBuffer, faceLandmarks ? [faceLandmarks] : undefined)

// 4. Generate optimal crop
const result = await generateOptimalCrop(
  imageBuffer,
  { name: 'Instagram Square', width: 1080, height: 1080, quality: 85 },
  CropStrategy.SMART_CROP,
  { faceLandmarks: faceLandmarks ? [faceLandmarks] : undefined, safeZones }
)

// 5. Check validation
if (result.validationScore < 80) {
  console.warn('Crop quality is low:', result.validationWarnings)
  // Maybe use letterbox instead
  const letterboxResult = await generateOptimalCrop(
    imageBuffer,
    { name: 'Instagram Square', width: 1080, height: 1080, quality: 85 },
    CropStrategy.LETTERBOX_BLUR
  )
}
```

### Batch Processing for Multiple Platforms

```typescript
import { generateOptimalCrop, CropStrategy } from '@/lib/image-processing'

const platforms = [
  { name: 'Instagram Square', width: 1080, height: 1080, quality: 85 },
  { name: 'Instagram Story', width: 1080, height: 1920, quality: 85 },
  { name: 'Facebook Feed', width: 1200, height: 630, quality: 85 },
  { name: 'Twitter Card', width: 1200, height: 600, quality: 85 }
]

const results = await Promise.all(
  platforms.map(spec =>
    generateOptimalCrop(imageBuffer, spec, CropStrategy.SMART_CROP, { faceLandmarks })
  )
)

results.forEach((result, i) => {
  console.log(`${platforms[i].name}: Score ${result.validationScore}`)
  fs.writeFileSync(`output-${platforms[i].name}.jpg`, result.croppedImage)
})
```

### Custom Safe Zones

```typescript
import { generateOptimalCrop, SafeZone, SafeZoneImportance } from '@/lib/image-processing'

// Define custom safe zones (e.g., logo position)
const customSafeZones: SafeZone[] = [
  {
    x: 50,
    y: 50,
    width: 200,
    height: 100,
    importance: SafeZoneImportance.IMPORTANT,
    type: 'custom',
    label: 'Company Logo'
  },
  {
    x: 1650,
    y: 950,
    width: 250,
    height: 100,
    importance: SafeZoneImportance.PREFERRED,
    type: 'custom',
    label: 'Watermark'
  }
]

const result = await generateOptimalCrop(
  imageBuffer,
  { name: 'Instagram Square', width: 1080, height: 1080, quality: 85 },
  CropStrategy.SMART_CROP,
  { safeZones: customSafeZones }
)
```

## Scoring Algorithm

The AI Smart Crop uses a weighted scoring system:

- **Face Score (50%)**: Face coverage, positioning, and centering
- **Composition Score (20%)**: Rule of thirds, aspect ratio preferences
- **Safe Zone Score (30%)**: Safe zone preservation

Total score range: 0-100

## Performance Considerations

- **Face Detection**: Use MediaPipe on the client to avoid server processing
- **Batch Processing**: Process multiple crops in parallel with `Promise.all()`
- **Image Size**: Consider resizing very large images before processing
- **Quality Settings**: Adjust JPEG quality based on use case (default: 85)

## Error Handling

```typescript
try {
  const result = await generateOptimalCrop(imageBuffer, spec, strategy, options)

  if (result.validationScore < 70) {
    console.warn('Low quality crop, consider using different strategy')
  }

  if (result.validationWarnings.length > 0) {
    result.validationWarnings.forEach(warning => {
      console.warn('⚠️', warning)
    })
  }

} catch (error) {
  console.error('Crop generation failed:', error)
  // Fallback to simple center crop
  const fallback = await centerWeightedCrop(imageBuffer, width, height)
}
```

## Testing

Run the test suite:

```bash
npm test src/lib/image-processing/__tests__
```

See test files for comprehensive usage examples:
- `smart-crop.test.ts`: All cropping strategies
- `safe-zones.test.ts`: Safe zone detection and validation

## License

Part of the LashPop DAM system.
