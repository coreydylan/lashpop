# Export Functionality & Smart Collections for Social Variants

This guide documents the complete implementation of export functionality and smart collections for social media variants in the Lashpop DAM system.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Export Service](#export-service)
4. [Smart Collections](#smart-collections)
5. [UI Components](#ui-components)
6. [API Endpoints](#api-endpoints)
7. [Usage Examples](#usage-examples)
8. [Installation](#installation)
9. [Database Migration](#database-migration)

## Overview

The export and smart collections system provides:

- **Export Functionality**: Export social media variants as ZIP archives with format conversion, quality control, and flexible organization
- **Smart Collections**: Auto-populated collections that dynamically update based on rules (platform, quality, export status, etc.)
- **Export History**: Track all exports with metadata and re-download capabilities
- **Bulk Operations**: Export entire collections with one click

## Database Schema

### Social Variants Table

**File**: `/home/user/lashpop/src/db/schema/social_variants.ts`

Stores social media variant assets generated from source images:

```typescript
{
  id: uuid                    // Primary key
  sourceAssetId: uuid         // Reference to source asset
  fileName: string            // Variant filename
  filePath: string            // S3 URL
  fileSize: number            // Size in bytes
  width: number               // Image width
  height: number              // Image height
  mimeType: string            // MIME type
  platform: string            // 'instagram', 'facebook', etc.
  variant: string             // 'square-post', 'story', etc.
  ratio: string               // '1:1', '9:16', etc.
  dimensions: string          // '1080x1080', etc.
  cropStrategy: string        // 'smart-crop', 'manual', etc.
  cropData: jsonb             // Crop coordinates and settings
  validationScore: number     // 0-100 quality score
  validationWarnings: jsonb   // Array of warnings
  exported: boolean           // Export status
  exportedAt: timestamp       // Last export timestamp
  exportCount: number         // Number of times exported
  metadata: jsonb             // Additional metadata
  altText: string             // Accessibility text
  caption: string             // Caption
  createdAt: timestamp        // Created timestamp
  updatedAt: timestamp        // Updated timestamp
}
```

### Export History Table

**File**: `/home/user/lashpop/src/db/schema/export_history.ts`

Tracks all export operations:

```typescript
{
  id: uuid                      // Primary key
  assetIds: jsonb               // Array of exported variant IDs
  exportedBy: string            // User ID
  format: string                // 'original', 'jpg', 'png'
  quality: number               // JPEG quality (0-100)
  organization: string          // 'flat', 'by-platform', etc.
  includeMetadata: boolean      // Metadata files included
  includeSourceImages: boolean  // Source images included
  fileCount: number             // Total files in export
  totalSize: number             // Total size in bytes
  downloadUrl: string           // S3 presigned URL
  urlExpiresAt: timestamp       // URL expiration
  manifest: jsonb               // File manifest
  metadata: jsonb               // Additional export metadata
  createdAt: timestamp          // Export timestamp
}
```

## Export Service

**File**: `/home/user/lashpop/src/lib/export/social-variant-export.ts`

Core export functionality with ZIP creation and format conversion.

### Features

- **Format Conversion**: Original, JPEG, or PNG export
- **Quality Control**: Adjustable JPEG quality (0-100)
- **Organization Strategies**:
  - **Flat**: All files in root directory
  - **By Platform**: Organized into platform folders (instagram/, facebook/, etc.)
  - **By Variant**: Organized by variant type (instagram-square/, instagram-story/, etc.)
  - **By Source**: Organized by source image name
- **Metadata Export**: Optional JSON files with variant details
- **Source Images**: Optional inclusion of original source images
- **Streaming**: Efficient handling of large exports
- **Auto README**: Generated README.txt explaining structure

### Usage Examples

```typescript
// Example 1: Basic export with default settings
import { exportSocialVariants } from '@/lib/export/social-variant-export'

const result = await exportSocialVariants({
  assetIds: ['uuid-1', 'uuid-2', 'uuid-3']
})

// Example 2: Export as JPEG with platform organization
const result = await exportSocialVariants({
  assetIds: ['uuid-1', 'uuid-2'],
  format: 'jpg',
  quality: 90,
  organize: 'by-platform',
  includeMetadata: true
})

// Example 3: Export with source images
const result = await exportSocialVariants({
  assetIds: ['uuid-1', 'uuid-2'],
  organize: 'by-source',
  includeSourceImages: true,
  includeMetadata: true
})

// Example 4: Estimate export size before downloading
import { estimateExportSize } from '@/lib/export/social-variant-export'

const estimatedBytes = await estimateExportSize(['uuid-1', 'uuid-2'])
console.log(`Estimated size: ${estimatedBytes / 1024 / 1024} MB`)

// Example 5: Preview folder structure
import { getOrganizationPreview } from '@/lib/export/social-variant-export'

const preview = await getOrganizationPreview(
  ['uuid-1', 'uuid-2'],
  'by-platform'
)
// Returns: { 'instagram': 3, 'facebook': 2 }
```

### Organization Examples

**By Platform**:
```
/instagram/
  square_post_1.jpg
  story_1.jpg
/facebook/
  link_preview_1.jpg
```

**By Variant**:
```
/instagram-square/
  image1.jpg
  image2.jpg
/instagram-story/
  image1.jpg
```

**By Source**:
```
/summer_hero/
  instagram_square.jpg
  facebook_post.jpg
/winter_promo/
  instagram_square.jpg
```

## Smart Collections

**File**: `/home/user/lashpop/src/lib/collections/social-variant-collections.ts`

Auto-populated collections that dynamically update based on rules.

### Available Collections

1. **Instagram Posts - Ready to Export**
   - Platform: Instagram
   - Validation Score: ≥ 80
   - Not yet exported
   - Icon: instagram | Color: #E4405F

2. **Facebook Posts - Ready to Export**
   - Platform: Facebook
   - Validation Score: ≥ 80
   - Not yet exported
   - Icon: facebook | Color: #1877F2

3. **Twitter/X Posts - Ready to Export**
   - Platform: Twitter
   - Validation Score: ≥ 80
   - Not yet exported
   - Icon: twitter | Color: #1DA1F2

4. **LinkedIn Posts - Ready to Export**
   - Platform: LinkedIn
   - Validation Score: ≥ 80
   - Not yet exported
   - Icon: linkedin | Color: #0A66C2

5. **Social Variants - This Week**
   - Created in last 7 days
   - Icon: calendar | Color: #6366F1

6. **Social Variants - Today**
   - Created today
   - Icon: clock | Color: #8B5CF6

7. **Needs Re-crop (Face Issues)**
   - Validation warnings containing "face"
   - Highlight: warning
   - Icon: alert-triangle | Color: #F59E0B

8. **Low Quality Variants**
   - Validation Score: < 70
   - Highlight: warning
   - Icon: alert-circle | Color: #EF4444

9. **Exported Social Content**
   - Exported: true
   - Sorted by export date
   - Icon: download | Color: #10B981

10. **High Quality Variants**
    - Validation Score: ≥ 90
    - Icon: star | Color: #FBBF24

11. **All Story Formats**
    - Ratio: 9:16
    - Icon: smartphone | Color: #EC4899

12. **All Square Posts**
    - Ratio: 1:1
    - Icon: square | Color: #14B8A6

13. **All Landscape Posts**
    - Ratio: 16:9
    - Icon: monitor | Color: #06B6D4

14. **Instagram Stories**
    - Platform: Instagram AND Ratio: 9:16
    - Icon: instagram | Color: #E4405F

15. **Instagram Square Posts**
    - Platform: Instagram AND Ratio: 1:1
    - Icon: instagram | Color: #E4405F

16. **Recently Exported**
    - Exported in last 7 days
    - Icon: download-cloud | Color: #10B981

17. **Never Exported**
    - Never exported AND Validation Score: ≥ 80
    - Icon: archive | Color: #6366F1

### Collection Query Engine

**File**: `/home/user/lashpop/src/lib/collections/query-engine.ts`

Evaluates collection rules and queries the database.

#### Features

- **Rule Evaluation**: Supports complex AND/OR logic
- **Operators**: eq, neq, gte, lte, gt, lt, contains, in, notIn
- **Date Ranges**: createdAfter, createdBefore (days or absolute dates)
- **Caching**: 60-second cache for performance
- **Sorting**: Multiple sort options (createdAt, validationScore, etc.)

#### Usage Examples

```typescript
import { querySocialVariantCollection, getCollectionCount } from '@/lib/collections/query-engine'

// Query a collection
const assets = await querySocialVariantCollection('instagram-ready')

// Get collection count
const count = await getCollectionCount('instagram-ready')

// Get all collection counts
import { getAllCollectionCounts } from '@/lib/collections/query-engine'
const counts = await getAllCollectionCounts()
// Returns: { 'instagram-ready': 47, 'facebook-ready': 32, ... }

// Clear cache after bulk updates
import { clearQueryCache } from '@/lib/collections/query-engine'
clearQueryCache()
```

## UI Components

### ExportManager Component

**File**: `/home/user/lashpop/src/app/dam/components/ExportManager.tsx`

Modal dialog for configuring and executing exports.

#### Features

- Format selection (Original, JPG, PNG)
- Quality slider for JPEG (60-100)
- Organization dropdown
- Checkboxes for metadata, source images, and auto-mark as exported
- Live preview of file count and estimated size
- Folder structure preview
- Progress bar during export
- Error and success notifications
- Auto-download of ZIP file

#### Usage

```typescript
import { ExportManager } from '@/app/dam/components/ExportManager'

function MyComponent() {
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])

  return (
    <>
      <button onClick={() => setIsExportOpen(true)}>
        Export Selected
      </button>

      <ExportManager
        assetIds={selectedAssets}
        open={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExportComplete={(result) => {
          console.log(`Exported ${result.fileCount} files`)
        }}
      />
    </>
  )
}
```

### SmartCollectionsSidebar Component

**File**: `/home/user/lashpop/src/app/dam/components/SmartCollectionsSidebar.tsx`

Sidebar displaying smart collections with live counts.

#### Features

- Expandable/collapsible sidebar
- Live collection counts (auto-refresh every 30 seconds)
- Color-coded icons
- Warning badges for collections needing attention
- Selection highlighting
- Tooltips with descriptions

#### Usage

```typescript
import { SmartCollectionsSidebar } from '@/app/dam/components/SmartCollectionsSidebar'

function DAMPage() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)

  return (
    <div className="flex gap-4">
      <SmartCollectionsSidebar
        onSelectCollection={setSelectedCollection}
        selectedCollectionId={selectedCollection}
        className="w-80"
      />

      <div className="flex-1">
        {/* Main content area */}
      </div>
    </div>
  )
}
```

### CollectionExportButton Component

**File**: `/home/user/lashpop/src/app/dam/components/CollectionExportButton.tsx`

One-click export button for collections.

#### Usage

```typescript
import { CollectionExportButton } from '@/app/dam/components/CollectionExportButton'

function CollectionHeader({ collection }) {
  return (
    <div className="flex items-center justify-between">
      <h2>{collection.name}</h2>

      <CollectionExportButton
        collectionId={collection.id}
        collectionName={collection.name}
        assetCount={collection.count}
      />
    </div>
  )
}
```

## API Endpoints

### Export Endpoints

#### POST `/api/dam/export`
Export social variants as ZIP file.

**Request Body**:
```json
{
  "assetIds": ["uuid-1", "uuid-2"],
  "format": "jpg",
  "quality": 90,
  "organization": "by-platform",
  "includeMetadata": true,
  "includeSourceImages": false,
  "markAsExported": true
}
```

**Response**: ZIP file download

#### POST `/api/dam/export/estimate-size`
Estimate export size before downloading.

**Request Body**:
```json
{
  "assetIds": ["uuid-1", "uuid-2"]
}
```

**Response**:
```json
{
  "size": 15728640
}
```

#### POST `/api/dam/export/folder-preview`
Preview folder structure for organization strategy.

**Request Body**:
```json
{
  "assetIds": ["uuid-1", "uuid-2"],
  "organization": "by-platform"
}
```

**Response**:
```json
{
  "folders": {
    "instagram": 3,
    "facebook": 2
  }
}
```

#### GET `/api/dam/export/history`
Retrieve export history.

**Query Params**:
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "history": [
    {
      "id": "uuid",
      "assetIds": ["uuid-1", "uuid-2"],
      "exportedBy": "user@example.com",
      "format": "jpg",
      "organization": "by-platform",
      "fileCount": 5,
      "totalSize": 15728640,
      "createdAt": "2025-11-16T10:30:00Z"
    }
  ]
}
```

### Smart Collection Endpoints

#### GET `/api/dam/collections/smart`
Get all smart collections with optional counts.

**Query Params**:
- `includeCounts`: Include asset counts (default: false)
- `sidebarOnly`: Only return sidebar collections (default: false)

**Response**:
```json
{
  "collections": [
    {
      "id": "instagram-ready",
      "name": "Instagram Posts - Ready to Export",
      "description": "Validated Instagram variants not yet exported",
      "icon": "instagram",
      "color": "#E4405F",
      "count": 47
    }
  ]
}
```

#### GET `/api/dam/collections/smart/[collectionId]`
Get assets for a specific smart collection.

**Response**:
```json
{
  "collection": {
    "id": "instagram-ready",
    "name": "Instagram Posts - Ready to Export",
    "count": 47
  },
  "assets": [
    {
      "id": "uuid",
      "fileName": "variant.jpg",
      "platform": "instagram",
      "ratio": "1:1",
      "validationScore": 95
    }
  ]
}
```

## Installation

### 1. Install Dependencies

```bash
npm install archiver @types/archiver
```

### 2. Database Migration

Create and run migration for new tables:

```sql
-- Create social_variants table
CREATE TABLE social_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  variant TEXT NOT NULL,
  ratio TEXT NOT NULL,
  dimensions TEXT NOT NULL,
  crop_strategy TEXT,
  crop_data JSONB,
  validation_score INTEGER,
  validation_warnings JSONB,
  exported BOOLEAN DEFAULT FALSE,
  exported_at TIMESTAMP,
  export_count INTEGER DEFAULT 0,
  metadata JSONB,
  alt_text TEXT,
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create export_history table
CREATE TABLE export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_ids JSONB NOT NULL,
  exported_by TEXT NOT NULL,
  format TEXT,
  quality INTEGER,
  organization TEXT,
  include_metadata JSONB,
  include_source_images JSONB,
  file_count INTEGER,
  total_size INTEGER,
  download_url TEXT,
  url_expires_at TIMESTAMP,
  manifest JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_social_variants_platform ON social_variants(platform);
CREATE INDEX idx_social_variants_exported ON social_variants(exported);
CREATE INDEX idx_social_variants_validation_score ON social_variants(validation_score);
CREATE INDEX idx_social_variants_ratio ON social_variants(ratio);
CREATE INDEX idx_social_variants_created_at ON social_variants(created_at);
CREATE INDEX idx_export_history_created_at ON export_history(created_at);
```

Or use Drizzle Kit:

```bash
# Generate migration
npm run db:generate

# Run migration
npm run db:migrate
```

### 3. Environment Variables

Ensure these are set in `.env`:

```bash
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
```

## Usage Examples

### Complete Workflow Example

```typescript
// 1. Load smart collections in sidebar
import { SmartCollectionsSidebar } from '@/app/dam/components/SmartCollectionsSidebar'

function DAMPage() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [collectionAssets, setCollectionAssets] = useState([])

  // Load collection assets when selected
  useEffect(() => {
    if (selectedCollection) {
      fetch(`/api/dam/collections/smart/${selectedCollection}`)
        .then(res => res.json())
        .then(({ assets }) => setCollectionAssets(assets))
    }
  }, [selectedCollection])

  return (
    <div className="flex gap-4">
      <SmartCollectionsSidebar
        onSelectCollection={setSelectedCollection}
        selectedCollectionId={selectedCollection}
      />

      <div className="flex-1">
        {/* Show collection assets */}
        {collectionAssets.map(asset => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  )
}

// 2. Export selected assets
import { ExportManager } from '@/app/dam/components/ExportManager'

function AssetGrid({ assets }) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isExportOpen, setIsExportOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsExportOpen(true)}
        disabled={selectedAssets.length === 0}
      >
        Export {selectedAssets.length} Selected
      </button>

      <ExportManager
        assetIds={selectedAssets}
        open={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExportComplete={(result) => {
          console.log(`Successfully exported ${result.fileCount} files`)
          setSelectedAssets([])
        }}
      />
    </>
  )
}

// 3. Export entire collection with one click
import { CollectionExportButton } from '@/app/dam/components/CollectionExportButton'

function CollectionHeader({ collection }) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <h2>{collection.name}</h2>
        <p>{collection.description}</p>
      </div>

      <CollectionExportButton
        collectionId={collection.id}
        collectionName={collection.name}
        assetCount={collection.count}
      />
    </div>
  )
}
```

## Summary

This implementation provides a complete export and smart collections system for social media variants with:

- ✅ Flexible export options (format, quality, organization)
- ✅ 17 predefined smart collections
- ✅ Auto-updating collection counts
- ✅ Export history tracking
- ✅ Bulk export from collections
- ✅ UI components for all functionality
- ✅ API endpoints for all operations
- ✅ Database schemas for variants and export history
- ✅ Comprehensive documentation and examples

All files are created and ready to use. Install dependencies and run database migrations to get started.
