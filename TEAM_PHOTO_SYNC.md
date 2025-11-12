# Team Member Photo Sync System

## Overview

The team member photo system maintains automatic synchronization between the DAM (Digital Asset Management) system and the main team member records. This ensures consistency across the entire platform.

## Architecture

### Database Tables

1. **team_members**
   - Contains core team member information
   - `imageUrl` field stores the URL of the current primary photo
   - This is the source of truth for displaying team members across the platform

2. **team_member_photos**
   - Stores all photos for each team member
   - Contains crop data for different display formats (vertical, horizontal, circle, square)
   - `isPrimary` flag indicates which photo is currently active
   - Links to `team_members` via `teamMemberId`

## Sync Mechanism

### How It Works

1. **Photo Upload** (`/api/dam/team/upload`)
   - New photos are uploaded and stored in `team_member_photos`
   - Photos are NOT automatically set as primary

2. **Set Primary** (`/api/dam/team/photos/[photoId]/set-primary`)
   - When a photo is set as primary:
     - All other photos for that team member are marked as `isPrimary: false`
     - The selected photo is marked as `isPrimary: true`
     - **SYNC HAPPENS HERE**: The team member's `imageUrl` is updated to match the primary photo's `filePath`

3. **Crop Editing** (`/api/dam/team/photos/[photoId]/crops`)
   - Crop settings are saved to the photo record
   - If the photo is primary, changes immediately affect how it displays platform-wide

### Data Flow

```
User sets photo as primary
  ↓
Update team_member_photos.isPrimary = true
  ↓
Update team_members.imageUrl = photo.filePath
  ↓
All platform components now show the new primary photo
```

## Migration

If you have existing team members with photos stored directly in `team_members.imageUrl`:

1. Run the migration script:
   ```bash
   npx tsx scripts/import-team-member-photos.ts
   ```

2. This will:
   - Import all existing photos into `team_member_photos`
   - Set them as primary
   - Set default crop positions
   - Maintain the sync between both tables

## Platform Integration

The `team_members.imageUrl` field is used throughout the platform:
- Team member listings
- Service provider displays
- DAM asset grouping headers
- Filter dropdowns
- Anywhere team members are shown

When you update a team member's primary photo in the DAM, the change propagates automatically to all these locations.

## Best Practices

1. **Always use the DAM to manage team photos**
   - Don't manually update `team_members.imageUrl`
   - Let the sync mechanism handle updates

2. **Set crops before making a photo primary**
   - Upload the photo
   - Edit crop settings for all formats
   - Then set as primary

3. **Keep at least one photo per team member**
   - The system expects each team member to have a primary photo
   - Use placeholders if needed

## Troubleshooting

### Photo not showing on platform
- Check if the photo is set as primary in the DAM
- Verify `team_members.imageUrl` matches `team_member_photos.filePath` for the primary photo

### Can't edit crop settings
- Ensure the photo exists in `team_member_photos` table
- Run migration script if dealing with legacy photos

### Changes not syncing
- Check that the photo is marked as `isPrimary: true`
- Verify the sync code is running in `set-primary/route.ts`
