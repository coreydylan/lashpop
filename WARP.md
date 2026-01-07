# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

LashPop is a modern booking and portfolio website for a luxury lash studio. Built with Next.js 15, it features a sophisticated cascading panel booking system, phone authentication, Vagaro API integration, and a Digital Asset Management (DAM) system for managing portfolio images.

## Common Development Commands

### Development & Build
```bash
npm run dev           # Start development server (localhost:3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run types         # TypeScript type checking (no emit)
```

### Database (Drizzle ORM with PostgreSQL/Supabase)
```bash
npm run db:generate   # Generate migration from schema changes
npm run db:migrate    # Apply migrations to database
npm run db:status     # Check migration status
npm run db:seed       # Seed database with initial data
npm run db:local      # Start local Supabase instance
npm run db:stop       # Stop local Supabase instance
```

Note: Use `drizzle-kit push` for quick schema updates during development (skips migration generation).

### Testing
There is no dedicated test command. Test booking flows and panels manually in the browser. Verify API routes using scripts in `/scripts` directory.

## Architecture Overview

### Panel System (Primary UI Pattern)
The app uses a **cascading panel system** for the booking flow. This is critical to understand:

- **Three panel contexts exist** but **CascadingPanelContext is primary** (`/src/contexts/CascadingPanelContext.tsx`)
- Panels stack vertically in a 4-level hierarchy:
  - Level 1: Entry points (`book-now`, `browse-services`, `browse-team`)
  - Level 2: Category selection (`category-picker`)
  - Level 3: Service browsing (`subcategory-services`)
  - Level 4: Details (`service-detail`, `provider-detail`, `schedule`)
- Panel components live in `/src/components/cascading-panels/panels/`
- Rendering handled by `/src/components/panel-stack/PanelStackContainer.tsx`

**Key insight**: PanelStackContext and legacy PanelContext also exist but should be avoided. Use CascadingPanelContext for new work.

### State Management
- **BookingOrchestratorContext** (`/src/contexts/BookingOrchestratorContext.tsx`) is the central state manager
  - Coordinates service selection, provider selection, journey tracking, and portfolio views
  - Uses event bus for cross-component communication
  - Manages page section registration for scroll tracking
- Use `useBookingOrchestrator()` to access booking state and actions
- Use `useCascadingPanels()` to manage panel operations

### Database Architecture
- **Drizzle ORM** with PostgreSQL (Supabase)
- Schema files in `/src/db/schema/` (36+ tables)
- Key tables:
  - `services` - Service catalog (synced from Vagaro, enriched locally)
  - `team_members` - Artists/employees (synced from Vagaro, enriched locally)
  - `appointments` - Bookings (synced from Vagaro via webhooks)
  - `assets` - DAM portfolio images (S3-backed)
  - `auth_user`, `auth_session`, `auth_verification` - BetterAuth phone authentication
  - `friend_booking_requests` - Friend booking invitation flow

### Vagaro Integration
- **Vagaro API is read-only** for appointments - cannot create bookings via API
- Use Vagaro widget (`VagaroBookingWidget.tsx`) embedded in scheduling panel for final checkout
- Data flow:
  1. Sync services and team members from Vagaro API (`/src/lib/vagaro-sync.ts`)
  2. Display in LashPop branded UI with local enrichments
  3. When user books: embed Vagaro widget for availability/payment
  4. Appointments sync back via webhooks (`/src/app/api/webhooks/vagaro/route.ts`)
  5. Auto-link appointments to users by phone number

- Team member filtering: Service records contain `servicePerformedBy` array in `vagaroData` JSON column - use this to filter which artists can provide each service

### Authentication System
- **BetterAuth** with Twilio phone verification (replaced Clerk)
- SMS OTP flow via Twilio Verify service
- 30-day sessions
- Progressive profile system (starts phone-only, builds up over time)
- Auth schema: `auth_user`, `auth_session`, `auth_verification`, `profiles`
- Vagaro customer linking via `vagaro_sync_mappings` table

### Digital Asset Management (DAM)
- Located at `/dam` route (password protected)
- Stores portfolio images in AWS S3
- Mobile-first tagging interface with:
  - Team member assignment
  - Service tagging (many-to-many via `asset_services`)
  - Lash characteristics (color, length, curl)
- Touch-optimized with long-press selection, bottom sheet UI
- Used to populate service galleries and team portfolios

## Data Flow Patterns

### Service Selection Flow
```
User clicks service card
  → ServiceDetailPanel opens (Level 4)
  → Gallery loads from DAM via getAssetsByServiceSlug()
  → Team members filtered by service.vagaroData.servicePerformedBy
  → User selects artist(s)
  → actions.selectService(serviceId) updates orchestrator
  → Ready for schedule panel (embeds Vagaro widget)
```

### Team Member → Booking Flow
```
User clicks team member on page
  → initiateBookingFromTeamMember() in orchestrator
  → TeamPortfolioView opens
  → Portfolio can compress to show booking panel alongside
  → Proceed to service selection or direct to schedule
```

### Appointment Sync Flow (Webhook-Based)
```
User books via Vagaro widget
  → Vagaro creates appointment
  → Vagaro sends webhook to /api/webhooks/vagaro
  → syncAppointment() upserts to appointments table
  → autoLinkAppointmentByPhone() matches user by phone number
  → Appointment appears in user's profile
```

## Key Patterns & Conventions

### Server Actions vs API Routes
- Use **server actions** (`/src/actions/`) for data fetching in React Server Components
- Use **API routes** (`/src/app/api/`) for:
  - Webhooks (Vagaro, Stripe)
  - File uploads (DAM)
  - Client-side mutations
  - External integrations

### Type Safety
- TypeScript strict mode enabled
- Key type files:
  - `/src/types/orchestrator.ts` - Booking state types
  - `/src/types/cascading-panels.ts` - Panel system types
  - `/src/types/panel-stack.ts` - Alternative panel types (less used)

### Path Aliases
- Use `@/*` to import from `/src/*`
- Example: `import { getServices } from '@/actions/services'`

### Styling
- Tailwind CSS with custom design system
- Brand colors: sage, dusty-rose, ocean-mist, warm-sand
- Mobile-first approach (design starts at mobile, scales up)
- Animations via Framer Motion, GSAP, Lenis (smooth scroll)

### Component Organization
```
/src/components/
├── ui/                    # Reusable UI primitives (Button, Card, etc.)
├── sections/              # Landing page sections (Hero, Services, Team)
├── cascading-panels/      # Primary booking panel system
├── panel-stack/           # Alternative panel implementation
├── bookings/              # Booking-specific components
├── auth/                  # Authentication components
├── admin/                 # Admin panel components
└── dam/                   # Digital Asset Management UI
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

**Required for development:**
- `DATABASE_URL` - PostgreSQL connection string (Supabase)
- `BETTER_AUTH_SECRET` - Min 32 chars (generate: `openssl rand -base64 32`)
- `NEXT_PUBLIC_BASE_URL` - `http://localhost:3000` for dev

**For phone auth (Twilio):**
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`, `TWILIO_PHONE_NUMBER`

**For Vagaro integration:**
- `VAGARO_CLIENT_ID`, `VAGARO_CLIENT_SECRET`, `VAGARO_BUSINESS_ID`, `VAGARO_REGION`

**For DAM (AWS S3):**
- `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

**Optional:**
- `STRIPE_SECRET_KEY` - For payment processing (future)
- `BRIGHTDATA_API_TOKEN` - For review scraping

## Working with Panels

### Opening a Panel
```typescript
const { actions } = useCascadingPanels()
actions.openPanel('service-detail', { service, categoryId }, { parentId })
```

### Adding a New Panel Type
1. Add type to `PanelType` union in `/src/types/cascading-panels.ts`
2. Create component in `/src/components/cascading-panels/panels/YourPanel.tsx`
3. Add rendering case in `PanelStackContainer.tsx`
4. Determine appropriate level (1-4) based on hierarchy

### Panel Best Practices
- Always pass `parentId` to maintain parent-child relationships
- Use panel-local state for UI state, orchestrator for business state
- Emit events via `eventBus` for cross-panel communication
- Close children when closing parent: `actions.closePanel(panelId, true)`

## Syncing Data

### Sync Services from Vagaro
```typescript
import { syncAllServices } from '@/lib/vagaro-sync'
await syncAllServices()
```

### Sync Team Members from Vagaro
```typescript
import { syncAllTeamMembers } from '@/lib/vagaro-sync'
await syncAllTeamMembers()
```

### Get Team Members Who Can Perform a Service
```typescript
import { getTeamMembersByServiceId } from '@/actions/team'
const members = await getTeamMembersByServiceId(serviceId)
// Filters by service.vagaroData.servicePerformedBy array
```

## File Organization Notes

- **Extensive documentation exists**: See `BOOKING_ARCHITECTURE.md`, `QUICK_REFERENCE.md`, `SETUP_GUIDE.md`, `VAGARO_INTEGRATION.md`
- **Design specs**: `LASHPOP-COMPLETE-SPECIFICATION.md`, `COLOR_GUIDE.md`, `CASCADING_PANELS_GUIDE.md`
- **Planning docs**: Multiple markdown files for features like slideshow, scrollytelling, mobile improvements
- **Scripts directory**: `/scripts` contains utility scripts for API testing, data migration, Twilio account comparison

## Known Gotchas

- **React Strict Mode is disabled** (`reactStrictMode: false` in `next.config.js`) - likely due to animation libraries
- **Images are unoptimized** (`images.unoptimized: true`) - consider for production optimization
- **Three panel systems**: CascadingPanelContext is primary. PanelStackContext and legacy PanelContext exist but are deprecated/alternative
- **Mock data exists**: ServiceDetailPanel uses MOCK_PROVIDERS - needs replacement with real team member queries
- **Schedule panel not implemented**: Framework exists but schedule/availability panel is TODO
- **Vagaro widget parameters undocumented**: Widget URL parameters (date prefill, customer prefill) need testing/discovery
- **TypeScript excludes**: `scripts`, `theatre`, and `scrollytelling` directories excluded from type checking

## Reference Documentation

Comprehensive guides exist for all major systems:
- **BOOKING_ARCHITECTURE.md** - Complete panel and orchestrator architecture
- **QUICK_REFERENCE.md** - Quick lookup for common tasks
- **SETUP_GUIDE.md** - Phone auth and database setup
- **VAGARO_INTEGRATION.md** - Complete Vagaro integration guide
- **DAM_DEPLOYMENT_GUIDE.md** - Digital Asset Management setup
- **PHONE_AUTH_SYSTEM_PROPOSAL.md** - Phone auth architecture details

## Development Workflow

1. **Start local database**: `npm run db:local` (if using Supabase local)
2. **Run migrations**: `npm run db:migrate`
3. **Start dev server**: `npm run dev`
4. **Type check**: `npm run types` (before committing)
5. **Test flows manually**: Booking flow, auth flow, admin panels
6. **Check Vagaro sync**: Verify services/team members sync correctly

When making schema changes:
1. Edit schema files in `/src/db/schema/`
2. Generate migration: `npm run db:generate`
3. Review migration in `/drizzle` directory
4. Apply: `npm run db:migrate`

## Deployment Notes

- Hosted on Vercel (implied by `vercel.json` presence)
- Database: Supabase PostgreSQL
- Asset storage: AWS S3
- SMS: Twilio Verify
- Booking: Vagaro widget (iframe embed)
- Webhooks must be configured in Vagaro dashboard to point to production webhook URL

## Future Work (From Documentation)

Immediate priorities:
- Schedule/availability panel implementation
- Replace mock provider data with real team member queries
- Test Vagaro widget parameter discovery (date/customer prefill)
- Appointment management UI (view, reschedule, cancel)

Medium-term:
- Payment integration (Stripe)
- Email confirmations
- Calendar integration
- Loyalty points system
