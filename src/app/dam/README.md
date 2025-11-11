# LashPop DAM (Digital Asset Management)

A lightweight, mobile-first Digital Asset Management system for organizing and tagging lash portfolio photos and videos.

## Features

### Upload
- **Drag & Drop**: Desktop drag-and-drop support
- **Touch Friendly**: Mobile-optimized file picker
- **Bulk Upload**: Upload multiple files at once
- **Preview**: See thumbnails before uploading
- **Progress Tracking**: Visual upload status indicators

### Organization & Tagging
- **Team Members**: Link assets to specific team members
- **Services**: Tag with multiple service types (Classic, Volume, etc.)
- **Lash Characteristics**:
  - Color: Brown or Black
  - Length: S, M, L
  - Curl: 1, 2, 3, 4

### Mobile-First Interface
- **Touch Gestures**: Long-press to enter selection mode
- **Multi-Select**: Select multiple assets with tap
- **Bottom Sheet**: Mobile-optimized tagging interface
- **Responsive Grid**: Adapts to screen size
- **Smooth Animations**: Powered by Framer Motion

### Tagging Workflow

#### Bulk Tagging
1. Long-press any asset to enter selection mode
2. Tap additional assets to select them
3. Tagging sheet opens automatically
4. Set common tags for all selected assets
5. Save to apply tags

#### Individual Tagging
1. Tap a single asset
2. Tagging sheet opens
3. Set tags for that asset
4. Save

## Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: AWS S3
- **File Uploads**: Native browser APIs

## Database Schema

### `assets` Table
- File metadata (name, path, type, size, dimensions)
- Team member association
- Lash characteristics (color, length, curl)
- Timestamps (uploaded, updated)

### `asset_services` Junction Table
- Many-to-many relationship between assets and services
- Allows one asset to showcase multiple service types

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# AWS S3 (DAM Asset Storage)
AWS_REGION=us-west-2
AWS_S3_BUCKET_NAME=lashpop-dam-assets
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
NEXT_PUBLIC_S3_BUCKET_URL=https://lashpop-dam-assets.s3.us-west-2.amazonaws.com
```

### 2. Database Migration

Run the migration to create the DAM tables:

```bash
npm run db:migrate
```

### 3. AWS Credentials

Ensure your AWS credentials have the following S3 permissions:
- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`

### 4. Access the DAM

Navigate to `/dam` in your browser to access the DAM interface.

## API Endpoints

### Upload Assets
```
POST /api/dam/upload
Content-Type: multipart/form-data

Body:
- files: File[] (required)
- teamMemberId: string (optional)
```

### Get Assets
```
GET /api/dam/assets
Query Params:
- teamMemberId: string (optional)
- color: brown | black (optional)
- length: S | M | L (optional)
- curl: 1 | 2 | 3 | 4 (optional)
```

### Tag Assets
```
POST /api/dam/tag
Content-Type: application/json

Body:
{
  assetIds: string[],
  tags: {
    teamMemberId?: string,
    serviceIds?: string[],
    color?: "brown" | "black",
    length?: "S" | "M" | "L",
    curl?: "1" | "2" | "3" | "4"
  }
}
```

## File Structure

```
src/app/dam/
├── components/
│   ├── FileUploader.tsx      # Upload UI with drag & drop
│   ├── AssetGrid.tsx          # Grid view with multi-select
│   └── TaggingSheet.tsx       # Bottom sheet for tagging
├── page.tsx                   # Main DAM page
└── README.md                  # This file

src/app/api/dam/
├── upload/
│   └── route.ts              # Upload API endpoint
├── assets/
│   └── route.ts              # Get assets API endpoint
└── tag/
    └── route.ts              # Tag assets API endpoint

src/db/schema/
├── assets.ts                 # Assets table schema
└── asset_services.ts         # Junction table schema

src/lib/dam/
└── s3-client.ts              # S3 utility functions
```

## Future Enhancements

- [ ] Image optimization and resizing
- [ ] Video thumbnail generation
- [ ] Advanced filtering and search
- [ ] Bulk delete
- [ ] Asset metadata editing
- [ ] Export functionality
- [ ] Integration with team member profiles
- [ ] Integration with service pages
- [ ] Public gallery view
- [ ] AI-powered auto-tagging
- [ ] Image recognition for lash characteristics

## Mobile Best Practices Used

1. **Touch-Friendly Targets**: All interactive elements are min 44x44px
2. **Bottom Sheet Pattern**: Mobile-native pattern for modal actions
3. **Long-Press Selection**: Intuitive mobile selection pattern
4. **Responsive Grid**: Adapts columns based on screen size
5. **Smooth Animations**: Haptic-like feedback through animations
6. **Progressive Loading**: Fast initial render with lazy loading
7. **Touch Gestures**: Native mobile gestures throughout

## Notes

- Assets are stored in S3 with public read access
- File uploads are direct to S3 (not streamed through server)
- Images are not optimized on upload (consider adding sharp for production)
- Video thumbnails are not generated (consider adding ffmpeg for production)
- Team members and services currently use mock data (connect to real API)
