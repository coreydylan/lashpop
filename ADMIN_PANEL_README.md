# Landing Page v2 Admin Panel

A comprehensive admin panel for managing the content and configuration of the Lashpop landing page v2.

## Overview

The admin panel provides a section-by-section editor for all components of the landing page, allowing you to:

- Configure hero section content and arch image positioning
- Manage grid scroller images from the DAM
- Edit founder letter content with HTML support
- Full CRUD operations on team members
- Curate Instagram carousel content
- Select and order reviews for the homepage
- Manage FAQs with categorization

## Getting Started

### Prerequisites

1. User account with DAM access (admin privileges)
2. Database migrations applied
3. Environment variables configured

### Accessing the Admin Panel

Navigate to `/admin/landing-v2` in your browser. You must be logged in with an account that has `damAccess` set to `true`.

## Database Setup

### Running Migrations

Apply the landing page CMS migration:

```bash
# Using psql or your database client
psql $DATABASE_URL -f drizzle/0019_landing_page_cms.sql

# Or using Drizzle Kit (if configured)
npm run db:migrate
```

### Database Schema

The admin panel adds the following tables:

- `landing_page_sections` - Section visibility and ordering
- `landing_page_hero` - Hero section configuration
- `landing_page_content` - Text content for sections like founder letter
- `landing_page_reviews` - Selected reviews and their order
- `landing_page_instagram` - Instagram carousel settings
- `landing_page_grid_scroller` - Grid scroller configuration
- `landing_page_faqs` - FAQ items

## Section Editors

### 1. Hero Section (`/admin/landing-v2/hero`)

**Features:**
- **Arch Image Selection** - Choose images from DAM tagged with `website/hero-arch`
- **Image Positioning** - Visual editor with controls for:
  - Horizontal position (X offset)
  - Vertical position (Y offset)
  - Scale (0.5x - 3x)
  - Rotation (-180° to 180°)
- **Content Editing** - Edit heading, tagline, description, location
- **Trust Indicators** - Configure stats shown (e.g., "10+ Years Experience")
- **CTA Buttons** - Configure primary and secondary call-to-action buttons

**API Endpoints:**
- `GET /api/admin/landing-v2/hero` - Fetch current configuration
- `POST /api/admin/landing-v2/hero` - Save configuration

### 2. Grid Scroller (`/admin/landing-v2/grid-scroller`)

**Features:**
- **DAM Integration** - Pulls images tagged with `website/grid-scroller`
- **Layout Settings**:
  - Maximum number of images (5-50)
  - Target row height (200-500px)
  - Row padding (0-20px)
  - Container max width (1000-2000px)
- **Animation Settings**:
  - Enable/disable parallax effect
  - Parallax scroll speed
  - Lazy loading toggle

**API Endpoints:**
- `GET /api/admin/landing-v2/grid-scroller` - Fetch configuration
- `POST /api/admin/landing-v2/grid-scroller` - Save configuration

### 3. Founder Letter (`/admin/landing-v2/founder-letter`)

**Features:**
- **HTML Editor** - Full HTML editing with live preview
- **Content Fields**:
  - Heading and subheading
  - Rich HTML content
  - Arch image selection
  - SVG graphic path
- **Preview Mode** - Toggle between HTML editor and rendered preview

**API Endpoints:**
- `GET /api/admin/landing-v2/founder-letter` - Fetch content
- `POST /api/admin/landing-v2/founder-letter` - Save content

### 4. Team Management (`/admin/landing-v2/team`)

**Features:**
- **Full CRUD Operations** - Create, read, update, delete team members
- **Vagaro Integration** - View and manage Vagaro-synced employees
- **Visibility Control** - Toggle visibility on website without deleting
- **Profile Management**:
  - Name, role, type (employee/independent)
  - Contact info (phone, email)
  - Bio, quote, fun fact
  - Specialties and favorite services
  - Profile photo (linked to DAM)
  - Booking URL

**API Endpoints:**
- `GET /api/admin/landing-v2/team` - List all team members
- `POST /api/admin/landing-v2/team` - Create new team member
- `PATCH /api/admin/landing-v2/team/[id]` - Update team member
- `DELETE /api/admin/landing-v2/team/[id]` - Delete team member

### 5. Instagram Carousel (`/admin/landing-v2/instagram`)

**Features:**
- **DAM Integration** - Pulls images tagged with `ig_carousel`
- **Carousel Settings**:
  - Maximum images (5-30)
  - Autoplay toggle
  - Scroll speed (1000-10000ms)
  - Loop toggle
  - Dots toggle
  - Transition duration (200-1000ms)

**API Endpoints:**
- `GET /api/admin/landing-v2/instagram` - Fetch configuration
- `POST /api/admin/landing-v2/instagram` - Save configuration

### 6. Reviews Manager (`/admin/landing-v2/reviews`)

**Features:**
- **Review Selection** - Choose from all 4+ star reviews
- **Drag-to-Reorder** - Drag reviews to change their display order
- **Visibility Control** - Show/hide individual reviews
- **Featured Reviews** - Highlight specific reviews
- **Source Filtering** - Filter by Google, Yelp, Vagaro

**API Endpoints:**
- `GET /api/admin/landing-v2/reviews/all` - List all available reviews
- `GET /api/admin/landing-v2/reviews/selected` - Get selected reviews with order
- `POST /api/admin/landing-v2/reviews` - Save review selections

### 7. FAQs Manager (`/admin/landing-v2/faqs`)

**Features:**
- **CRUD Operations** - Create, edit, delete FAQs
- **Categorization** - Optional category grouping
- **Visibility Toggle** - Show/hide individual FAQs
- **Drag-to-Reorder** - Change FAQ display order
- **Modal Editor** - Full-screen editing experience

**API Endpoints:**
- `GET /api/admin/landing-v2/faqs` - List all FAQs
- `POST /api/admin/landing-v2/faqs` - Create new FAQ
- `PATCH /api/admin/landing-v2/faqs/[id]` - Update FAQ
- `DELETE /api/admin/landing-v2/faqs/[id]` - Delete FAQ

## DAM Integration

Many sections integrate with the Digital Asset Manager (DAM):

### Hero Section
- **Tag**: `website/hero-arch`
- **Limit**: 1 image (can be changed in settings)
- **Features**: Visual positioning within arch shape

### Grid Scroller
- **Tag**: `website/grid-scroller`
- **Limit**: Configurable (default 20)
- **Features**: Justified layout algorithm

### Instagram Carousel
- **Tag**: `ig_carousel`
- **Limit**: Configurable (default 10)
- **Features**: Automatic Instagram sync if configured

### Managing DAM Tags

1. Navigate to `/dam`
2. Select images
3. Add/remove tags via the tagging interface
4. Images will automatically appear in corresponding admin sections

## Security & Authentication

### Admin Access

The admin panel checks for DAM access on every API request:

```typescript
// Users must have damAccess: true in the database
const hasAccess = user.damAccess === true
```

### Granting Access

1. Navigate to `/admin/dam-users`
2. Find the user in the list
3. Click "Grant" to enable DAM access
4. User can now access all admin panels

### API Protection

All API routes are protected with the `isAdmin()` helper:

```typescript
async function isAdmin(req: NextRequest): Promise<boolean> {
  // Checks for valid auth token and DAM access
}
```

## Development

### File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── landing-v2/
│   │       ├── layout.tsx           # Sidebar navigation
│   │       ├── page.tsx             # Overview dashboard
│   │       ├── hero/
│   │       │   └── page.tsx         # Hero editor
│   │       ├── grid-scroller/
│   │       │   └── page.tsx         # Grid scroller manager
│   │       ├── founder-letter/
│   │       │   └── page.tsx         # Founder letter editor
│   │       ├── team/
│   │       │   └── page.tsx         # Team CRUD
│   │       ├── instagram/
│   │       │   └── page.tsx         # Instagram manager
│   │       ├── reviews/
│   │       │   └── page.tsx         # Reviews selector
│   │       └── faqs/
│   │           └── page.tsx         # FAQs manager
│   └── api/
│       └── admin/
│           └── landing-v2/
│               ├── hero/
│               │   └── route.ts
│               ├── grid-scroller/
│               │   └── route.ts
│               ├── founder-letter/
│               │   └── route.ts
│               ├── team/
│               │   ├── route.ts
│               │   └── [id]/
│               │       └── route.ts
│               ├── instagram/
│               │   └── route.ts
│               ├── reviews/
│               │   ├── route.ts
│               │   ├── all/
│               │   │   └── route.ts
│               │   └── selected/
│               │       └── route.ts
│               └── faqs/
│                   ├── route.ts
│                   └── [id]/
│                       └── route.ts
└── db/
    └── schema/
        ├── landing_page_sections.ts
        ├── landing_page_hero.ts
        ├── landing_page_content.ts
        ├── landing_page_reviews.ts
        ├── landing_page_instagram.ts
        ├── landing_page_grid_scroller.ts
        └── landing_page_faqs.ts
```

### Adding New Sections

1. **Create Schema** - Add new table in `src/db/schema/`
2. **Create UI** - Add page in `src/app/admin/landing-v2/[section]/`
3. **Create API** - Add route in `src/app/api/admin/landing-v2/[section]/`
4. **Update Navigation** - Add to `sections` array in `layout.tsx`
5. **Run Migration** - Create and apply migration SQL

### Common Patterns

#### Section Configuration (Single Row)

```typescript
// Check if config exists, update or insert
const existing = await db.select().from(table).limit(1)

if (existing.length > 0) {
  await db.update(table).set(data).where(eq(table.id, existing[0].id))
} else {
  await db.insert(table).values(data)
}
```

#### CRUD Operations

```typescript
// GET - List all
await db.select().from(table).orderBy(table.displayOrder)

// POST - Create
await db.insert(table).values(data).returning()

// PATCH - Update
await db.update(table).set(data).where(eq(table.id, id)).returning()

// DELETE - Remove
await db.delete(table).where(eq(table.id, id))
```

## Troubleshooting

### Admin panel shows "Unauthorized"
- Check that your user has `damAccess: true` in the database
- Verify you're logged in (check for `auth_token` cookie)
- Check session expiration in `auth_session` table

### Changes not appearing on landing page
- Ensure the section `isVisible` is set to `true`
- Clear browser cache and refresh
- Check database to confirm data was saved

### Images not showing from DAM
- Verify images have the correct tag in DAM
- Check S3 bucket permissions and URLs
- Ensure `maxImages` setting allows enough images

### Migration errors
- Check if tables already exist (migration may have run already)
- Verify database connection in `.env.local`
- Run migrations in order (check migration numbering)

## Support

For issues or questions:
1. Check this README
2. Review the code comments in relevant files
3. Check the DAM README at `/src/app/dam/README.md`
4. Create an issue in the project repository

## Future Enhancements

Potential features for future development:

- [ ] Drag-to-reorder sections on overview page
- [ ] Section templates and presets
- [ ] A/B testing capabilities
- [ ] Version history and rollback
- [ ] Preview mode before publishing
- [ ] Scheduled content publishing
- [ ] Analytics integration
- [ ] SEO metadata editing per section
- [ ] Multi-language support

## License

Internal tool for Lashpop website management.
