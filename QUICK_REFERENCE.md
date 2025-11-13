# LashPop Booking System - Quick Reference Guide

## At a Glance

### Three Panel Systems
1. **CascadingPanelContext** (PRIMARY) - Hierarchical 4-level system
2. **PanelStackContext** (ALTERNATIVE) - Flexible docking system
3. **Legacy PanelContext** - Being phased out

### Main Files You'll Work With

**State Management**:
- `/src/contexts/BookingOrchestratorContext.tsx` - Central booking orchestrator
- `/src/contexts/CascadingPanelContext.tsx` - Panel management

**Components**:
- `/src/components/cascading-panels/` - Main panel UI
- `/src/components/panel-stack/PanelStackContainer.tsx` - Renders panels

**Data Layer**:
- `/src/actions/services.ts` - Service queries
- `/src/actions/team.ts` - Team member queries
- `/src/db/schema/services.ts` - Service model
- `/src/db/schema/team_members.ts` - Team model
- `/src/db/schema/appointments.ts` - Booking model

**API Routes**:
- `/src/app/api/bookings/friend/route.ts` - Friend booking creation
- `/src/app/api/bookings/friend/[token]/accept/route.ts` - Accept booking
- `/src/app/api/bookings/friend/[token]/decline/route.ts` - Decline booking

---

## Common Tasks

### Add a New Panel Type
1. Add type to `PanelType` union in `/src/types/cascading-panels.ts`
2. Create panel component in `/src/components/cascading-panels/panels/`
3. Add rendering case in `PanelStackContainer.tsx`
4. Call `actions.openPanel('your-type', data)` to trigger

### Connect Service Data
```typescript
// In cascading panels
import { getAllServices } from '@/actions/services'

// In component
const { state } = useCascadingPanels()
const services = state.services // Already loaded in provider
```

### Access Booking Orchestrator
```typescript
import { useBookingOrchestrator } from '@/contexts/BookingOrchestratorContext'

export function MyComponent() {
  const { state, actions } = useBookingOrchestrator()
  
  // state.selectedServices
  // state.selectedProviders
  // actions.selectService(service)
  // actions.selectProvider(provider)
}
```

### Fetch Team Members
```typescript
import { getTeamMembers } from '@/actions/team'

const members = await getTeamMembers()
```

### Open the Book Now Panel
```typescript
const { actions } = useCascadingPanels()
actions.openPanel('book-now', {})
```

### Track User Journey
```typescript
const { actions } = useBookingOrchestrator()
actions.scrollToSection('team', { highlight: [providerId] })
```

---

## Data Flow Examples

### User Selects Category
```
User clicks category in CategoryPickerPanel
  ↓
toggleCategory(categoryId) called
  ↓
CascadingPanelState updated
  ↓
openPanel('subcategory-services') with filtered data
  ↓
SubcategoryServicePanel renders with filtered services
```

### User Selects Service
```
User clicks service card
  ↓
ServiceDetailPanel opens (Level 4)
  ↓
Component fetches gallery via getAssetsByServiceSlug()
  ↓
User selects artist
  ↓
selectService(serviceId) → orchestrator updated
  ↓
Ready to proceed to schedule (schedule panel to be built)
```

### User Clicks Team Member
```
User clicks team member on page
  ↓
initiateBookingFromTeamMember() called
  ↓
Orchestrator opens portfolio
  ↓
TeamPortfolioView renders
  ↓
Portfolio can show booking panel alongside
```

---

## Database Models Quick View

### Services
```
id (uuid) | name | slug | description | durationMinutes | priceStarting (cents)
categoryId (FK) | subcategoryId (FK) | isActive | vagaroServiceId
```

### Team Members
```
id (uuid) | name | role | type (employee/independent) | imageUrl
specialties (json) | favoriteServices (json) | isActive
bookingUrl | usesLashpopBooking | vagaroEmployeeId
```

### Appointments
```
id (uuid) | userId | vagaroAppointmentId (unique)
serviceTitle | startTime | endTime | bookingStatus
vagaroServiceId | vagaroServiceProviderId
friendBookingRequestId (for friend bookings)
```

---

## Event Bus Events

```typescript
// Service selection
eventBus.subscribe('SERVICE_SELECTED', handler)

// Provider selection
eventBus.subscribe('PROVIDER_SELECTED', handler)

// Category selection
eventBus.subscribe('CATEGORY_SELECTED', handler)

// Portfolio state
eventBus.subscribe('PORTFOLIO_OPENED', handler)
eventBus.subscribe('PORTFOLIO_CLOSED', handler)

// Panel operations
eventBus.subscribe('PANEL_OPENED', handler)
eventBus.subscribe('PANEL_CLOSED', handler)

// Booking panels
eventBus.subscribe('BOOKING_PANEL_OPENED', handler)
eventBus.subscribe('BOOKING_PANEL_CLOSED', handler)
```

---

## Panel Level Hierarchy

```
Level 1: Entry points
  ├─ book-now (start booking flow)
  ├─ browse-services
  └─ browse-team

Level 2: Category selection
  └─ category-picker (show all categories)

Level 3: Subcategory + services
  └─ subcategory-services (filter by category)

Level 4: Detail panels
  ├─ service-detail (full service info + gallery + artists)
  ├─ provider-detail (artist profile)
  ├─ provider-services (artist's service offerings)
  └─ schedule (availability calendar - FUTURE)
```

Each level can have multiple panels (different categories, services, etc.)
Parent-child relationships maintained for context

---

## Styling Patterns

### Category Icons & Colors
```typescript
const CATEGORY_STYLING: Record<string, { icon: string; color: string }> = {
  lashes: { icon: '✨', color: 'from-dusty-rose/20 to-pink-100' },
  brows: { icon: '🎀', color: 'from-warm-sand/20 to-amber-100' },
  waxing: { icon: '💫', color: 'from-sage/20 to-green-100' },
  facials: { icon: '🌸', color: 'from-ocean-mist/20 to-blue-100' },
}
```

### Colors Used
- Primary: sage, dusty-rose, ocean-mist, warm-sand
- Backgrounds: cream, dune, terracotta
- Grays: dune/70 for secondary text

---

## Mock Data Currently Used

### Team Members (ServiceDetailPanel)
```typescript
const MOCK_PROVIDERS: Provider[] = [
  { id: '1', name: 'Sarah', imageUrl: '/placeholder-team.jpg', role: 'Lead Lash Artist' },
  { id: '2', name: 'Maya', imageUrl: '/placeholder-team.jpg', role: 'Lash Specialist' },
  { id: '3', name: 'Jamie', imageUrl: '/placeholder-team.jpg', role: 'Lash Artist' },
]
```

**TODO**: Replace with real data from `getTeamMembers()` action

---

## Integration Checklist

- [x] Services display and selection
- [x] Team member data model
- [x] Panel hierarchy system
- [x] Gallery/DAM integration
- [x] Friend booking requests
- [ ] Schedule panel (availability)
- [ ] Appointment creation API
- [ ] Payment processing (Stripe)
- [ ] Real team member provider selection
- [ ] Appointment management UI

---

## Testing the Flow

1. **Load page** → See hero, services, team sections
2. **Click "Book Now"** → BookNowPanel opens (empty - ready for category picker)
3. **Select category** → SubcategoryServicePanel shows filtered services
4. **Click service** → ServiceDetailPanel opens with gallery
5. **Select artist** → Button enabled to proceed
6. **Click proceed** → (Currently opens schedule panel - not yet built)

---

## Key Dependencies

- **Framer Motion** - Panel animations
- **Lucide Icons** - UI icons
- **Next.js App Router** - Pages and API routes
- **Drizzle ORM** - Database queries
- **Vagaro API** - Service and team member data
- **Twilio** - SMS for friend bookings

---

## Contact Points

**Vagaro API Client**: `/src/lib/vagaro-client.ts`
- Service fetching
- Employee/provider data
- Availability checking
- Appointment creation

**SMS Provider**: `/src/lib/sms-provider.ts`
- Friend booking invites
- Confirmation messages

**DAM**: `/src/actions/dam.ts`
- Service gallery images
- Team member photos

---

## Notes for Development

1. **IMPORTANT**: Three panel systems exist. Cascading is primary.
2. **Mock data**: Team members in ServiceDetailPanel use mocks, need connection to real data
3. **Schedule panel**: Not yet implemented, framework ready
4. **Appointment creation**: API route exists for friend bookings, needs main booking flow
5. **Payment**: Not integrated yet, ready for Stripe
6. **Mobile first**: Design is mobile-optimized with responsive considerations
