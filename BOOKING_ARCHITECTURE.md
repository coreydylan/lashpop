# LashPop Booking Flow & Architecture Overview

## Executive Summary

The LashPop application implements a sophisticated multi-layer booking system with cascading panels, an orchestrator pattern for state management, and Vagaro API integration. The architecture separates concerns into contexts, components, server actions, and API routes.

---

## 1. PANEL SYSTEMS

### 1.1 Three Panel Architectures in Codebase

#### A. **Cascading Panels Context** (Primary - Most Recent)
**File**: `/src/contexts/CascadingPanelContext.tsx`

**Purpose**: Hierarchical, context-aware panel system with vertical stacking

**Key Features**:
- 4-level hierarchy with parent-child relationships
- Event bus for inter-panel communication
- Category tracking and selection state
- Panel collapsing/expanding capabilities

**Panel Levels**:
```
Level 1: Entry points (book-now, browse-services, browse-team)
  ↓
Level 2: Category selection (category-picker)
  ↓
Level 3: Subcategory + services (subcategory-services)
  ↓
Level 4: Detail panels (service-detail, provider-detail, schedule)
```

**State Structure**:
```typescript
{
  panels: PanelStackItem[]           // All open panels
  activeLevel: number                // Highest active level
  categorySelections: CategorySelection[]
  selectedServiceId?: string
  selectedProviderId?: string
  services: any[]                    // Service data
}
```

**Key Actions**:
- `openPanel(type, data, options)` - Opens panel at calculated level
- `closePanel(panelId, closeChildren)` - Closes panel + children
- `toggleCategory(categoryId, categoryName)` - Manages category selection
- `selectService(serviceId)` - Marks service as selected

#### B. **Panel Stack Context** (Alternative)
**File**: `/src/contexts/PanelStackContext.tsx`

**Purpose**: More flexible panel management with docking/expansion states

**Panel States**:
- `expanded`: Full-height, user-focused
- `docked`: Summarized, sidebar view
- `closed`: Removed from DOM

**Key Difference**: Tracks expanded panel per level, allows side-by-side docking

#### C. **Legacy Panel Context** (Deprecated)
**File**: `/src/components/panels/PanelContext.tsx`

**Purpose**: Simple panel stack with provider selection

**Status**: Being replaced by cascading panels

---

## 2. ACTION PANELS IMPLEMENTATION

### 2.1 Panel Components Location
```
/src/components/
├── cascading-panels/
│   ├── panels/
│   │   ├── BookNowPanel.tsx (Entry point)
│   │   ├── CategoryPickerPanel.tsx (Level 2)
│   │   ├── SubcategoryServicePanel.tsx (Level 3)
│   │   └── ServiceDetailPanel.tsx (Level 4)
│   └── PanelWrapper.tsx (Base wrapper)
├── panel-stack/
│   ├── panels/
│   │   ├── CategoryPickerPanel.tsx
│   │   ├── ServicePanel.tsx
│   │   └── ServiceDetailPanel.tsx
│   ├── PanelWrapper.tsx
│   └── PanelStackContainer.tsx
└── panels/
    ├── PanelContext.tsx (Legacy)
    ├── PanelRenderer.tsx
    ├── ServiceDetailPanel.tsx (Legacy)
    └── PanelStack.tsx
```

### 2.2 How Panels Work

**Cascading Panels Flow**:

1. **BookNowPanel** (Entry Point)
   - User clicks "Book Now" button
   - Opens category picker panel

2. **CategoryPickerPanel** (Level 2)
   - Displays all service categories
   - Uses CATEGORY_STYLING for icons/colors
   - Emits `CATEGORY_SELECTED` event
   - Opens SubcategoryServicePanel on click

3. **SubcategoryServicePanel** (Level 3)
   - Shows services filtered by category
   - Can show subcategories
   - Opens ServiceDetailPanel on service click

4. **ServiceDetailPanel** (Level 4)
   - Shows full service details
   - Displays gallery of work (from DAM)
   - Provider selection grid
   - Book button to proceed to schedule

### 2.3 Panel Animation & Rendering

**Container**: `/src/components/panel-stack/PanelStackContainer.tsx`

```typescript
// Sorts panels by level, filters closed ones
const sortedPanels = state.panels
  .filter(p => p.state !== 'closed')
  .sort((a, b) => a.level - b.level)

// Renders appropriate component based on type
{panel.type === 'category-picker' && <CategoryPickerPanel />}
{panel.type === 'service-panel' && <ServicePanel />}
```

**Wrapper Component**: `PanelWrapper.tsx`
- Handles collapse/expand toggle
- Manages scrolling
- Animation entry/exit
- Close button

---

## 3. SERVICES FLOW

### 3.1 Service Data Sources

#### Database Layer
**File**: `/src/db/schema/services.ts`

```typescript
services {
  id: uuid (primary key)
  vagaroServiceId: text (unique) → Links to Vagaro
  categoryId: uuid (FK) → service_categories
  subcategoryId: uuid (FK) → service_subcategories
  
  // Core data
  name: text
  slug: text
  subtitle: text
  description: text
  durationMinutes: integer (in minutes)
  priceStarting: integer (in cents)
  imageUrl: text
  color: text
  displayOrder: integer
  isActive: boolean
  
  // Metadata
  vagaroData: jsonb (full Vagaro response)
  createdAt, updatedAt, lastSyncedAt: timestamp
}
```

#### Service Actions (Server)
**File**: `/src/actions/services.ts`

```typescript
getServices()                    // All active services
getServicesByCategory(slug)      // Services for category
getAllServices()                 // All with category/subcategory names
```

#### Vagaro Integration
**File**: `/src/actions/vagaro-services.ts`

```typescript
getVagaroServices()              // Fetch all from API
getVagaroServicesByCategory(id)  // Fetch by category
getVagaroServicesGrouped()       // Return grouped by category
```

### 3.2 Service Display Flow

**1. Browse Services** (Page Load)
```
Page.tsx
  ↓
ServicesSection (server component)
  ↓
Call getServices() action
  ↓
Render ServiceCard components
  ↓
User clicks service
  ↓
Push ServiceDetailPanel
```

**2. Filter by Category** (Quiz or Category Panel)
```
CategoryPickerPanel
  ↓
toggleCategory() action
  ↓
Filter: state.services.filter(s => s.categorySlug === categoryId)
  ↓
Open SubcategoryServicePanel
  ↓
Show filtered services
```

**3. Service Details**
```
ServiceDetailPanel receives:
  - service object (full data)
  - Fetches gallery via getAssetsByServiceSlug()
  - Displays: description, duration, price, gallery
```

### 3.3 Service Selection

**In Cascading Panels**:
```typescript
handleBookService() {
  actions.selectService(service.id)
  actions.openPanel('schedule', {
    service,
    providerIds: Array.from(selectedProviders)
  }, { parentId: panel.id })
}
```

---

## 4. TEAM MEMBERS FLOW

### 4.1 Team Data Model

**File**: `/src/db/schema/team_members.ts`

```typescript
teamMembers {
  id: uuid (primary key)
  vagaroEmployeeId: text (unique) → Links to Vagaro
  
  // Core (synced from Vagaro)
  name: text
  phone: text
  email: text
  
  // Local enrichment
  role: text
  type: enum('employee', 'independent')
  bio: text
  quote: text
  instagram: text
  bookingUrl: text
  imageUrl: text
  specialties: jsonb (array)
  favoriteServices: jsonb (array)
  usesLashpopBooking: boolean
  displayOrder: text
  isActive: boolean
  
  // Metadata
  vagaroData: jsonb
  createdAt, updatedAt, lastSyncedAt: timestamp
}
```

### 4.2 Team Member Actions

**File**: `/src/actions/team.ts`

```typescript
getTeamMembers()                    // All active members
getTeamMembersByType(type)          // Filter by employee/independent
```

### 4.3 Team Member Selection & Booking

**In ServiceDetailPanel** (Cascading):
```typescript
// Mock providers currently used
const MOCK_PROVIDERS: Provider[] = [
  { id: '1', name: 'Sarah', role: 'Lead Lash Artist' },
  // ...
]

// Handler
handleProviderToggle(providerId) {
  setSelectedProviders(prev => {
    const newSet = new Set(prev)
    if (newSet.has(providerId)) {
      newSet.delete(providerId)
    } else {
      newSet.add(providerId)
    }
    return newSet
  })
}

// Button to proceed
handleBookService() {
  actions.selectService(service.id)
  actions.openPanel('schedule', {
    service,
    providerIds: Array.from(selectedProviders)
  })
}
```

### 4.4 Team Portfolio View

**File**: `/src/components/portfolio/TeamPortfolioView.tsx`

- Shows provider portfolio when `state.portfolio.state === 'expanded'`
- Triggered by orchestra methods
- Can be compressed to show booking panel alongside

---

## 5. BOOKING ORCHESTRATOR (Central State Management)

### 5.1 Overview

**File**: `/src/contexts/BookingOrchestratorContext.tsx`

**Purpose**: Central coordination of entire booking journey

**Key Concept**: Acts as "brain" coordinating all booking-related interactions across:
- Service selection
- Provider selection
- Panel visibility
- Portfolio display
- Journey tracking
- Section visibility/scrolling

### 5.2 State Structure

```typescript
BookingOrchestratorState {
  selectedServices: Service[]
  selectedProviders: Provider[]
  selectedCategories: string[]
  quizResults: QuizResults | null
  
  journey: {
    entryPoint: 'hero' | 'services-section' | 'team-section' | 'discover-quiz'
    currentStep: 'browsing' | 'service-selected' | 'provider-selected' | 'scheduling' | 'viewing-portfolio'
    timestamp: number
    breadcrumbs: string[]
  }
  
  sections: PageSection[]
  portfolio: {
    state: 'closed' | 'compressed' | 'expanded'
    providerId: string | null
    withBookingPanel: boolean
  }
  
  highlights: {
    services: string[]
    providers: string[]
    categories: string[]
  }
  
  viewport: ViewportDimensions
}
```

### 5.3 Key Actions

**Selection**:
```typescript
selectService(service, options?)      // Add to selectedServices
selectProvider(provider, options?)     // Add to selectedProviders
toggleProvider(provider)               // Toggle in/out
selectCategory(category)               // Add to selectedCategories
clearSelections()                      // Clear all
```

**Navigation**:
```typescript
scrollToSection(sectionId, options?)   // Smooth scroll + highlight
openPortfolio(providerId, options?)    // Show portfolio
closePortfolio()                       // Close portfolio
compressPortfolio()                    // Thumbnail mode
expandPortfolio()                      // Full screen mode
```

**Workflows** (Orchestrated):
```typescript
initiateBookingFromTeamMember(memberId)         // Click team member → pre-select
initiatePortfolioFromService(serviceId, providerId) // Service detail → portfolio
completeQuizWorkflow(results)                   // Quiz → category selection
```

**Section Registry**:
```typescript
registerSection(id, element)           // Register page section
updateSectionBounds(id, bounds)        // Track section position
```

### 5.4 Event Bus

Event-driven architecture for inter-component communication:

```typescript
eventBus.subscribe('SERVICE_SELECTED', handler)
eventBus.subscribe('PROVIDER_SELECTED', handler)
eventBus.subscribe('PORTFOLIO_OPENED', handler)
eventBus.subscribe('BOOKING_PANEL_OPENED', handler)
// etc...
```

---

## 6. BOOKING/CHECKOUT FLOW

### 6.1 Complete User Journey

```
┌─ DISCOVERY ─────────────────────────────────────┐
│                                                  │
│  1. User lands on page                         │
│     - Navigation visible                       │
│     - Hero section                             │
│                                                  │
│  2. Entry points:                              │
│     - Click "Book Now" button → BookNowPanel   │
│     - Quiz → Category filtered services        │
│     - Click service card → ServiceDetailPanel  │
│     - Click team member → Portfolio            │
│                                                  │
└──────────────────────────────────────────────────┘
                      ↓
┌─ SELECTION ──────────────────────────────────────┐
│                                                  │
│  3. Category Selection (if not from quiz)      │
│     - CategoryPickerPanel                      │
│     - Select one or more categories            │
│     - Breadcrumb tracking                      │
│                                                  │
│  4. Service Selection                          │
│     - Browse services in category              │
│     - Click service → ServiceDetailPanel       │
│     - View details, gallery, team artists      │
│     - Select 1+ artists                        │
│                                                  │
└──────────────────────────────────────────────────┘
                      ↓
┌─ SCHEDULING ─────────────────────────────────────┐
│                                                  │
│  5. Time Selection (FUTURE)                    │
│     - Schedule panel shows availability        │
│     - Fetched from Vagaro API                  │
│     - Compare multiple artists' schedules      │
│                                                  │
│  6. Confirmation                               │
│     - Review selection: service + artist + time│
│     - Provide contact info (if guest)          │
│                                                  │
└──────────────────────────────────────────────────┘
                      ↓
┌─ BOOKING ────────────────────────────────────────┐
│                                                  │
│  7. Create Appointment                         │
│     - POST /api/bookings/create (FUTURE)       │
│     - Write to appointments table              │
│     - Sync with Vagaro                         │
│                                                  │
│  8. Payment (FUTURE)                           │
│     - Stripe integration                       │
│     - Deposit or full payment                  │
│                                                  │
│  9. Confirmation                               │
│     - Email/SMS confirmation                  │
│     - Calendar invite                          │
│     - Booking details page                     │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 6.2 Existing API Routes

**Friend Booking System** (Currently Implemented):
```
POST   /api/bookings/friend
       - Create booking request for friend
       - Send SMS invite with consent token
       - Input: friendPhone, serviceId, teamMemberId, dateTime

GET    /api/bookings/friend/[token]/accept
       - Accept friend booking request
       - Create appointment

GET    /api/bookings/friend/[token]/decline
       - Decline friend booking request
```

**File**: `/src/app/api/bookings/friend/route.ts`

```typescript
POST /api/bookings/friend {
  friendPhone: string
  friendName?: string
  serviceId: string
  teamMemberId?: string
  dateTime: string
}
↓
Creates: friendBookingRequests record
Sends: SMS with acceptance link
Returns: { success, requestId, message }
```

### 6.3 Appointments Data Model

**File**: `/src/db/schema/appointments.ts`

```typescript
appointments {
  id: uuid (primary key)
  
  // LashPop user linking
  userId: text                        // User who owns appointment
  bookedByUserId: text                // Who booked (for friend bookings)
  isFriendBooking: boolean
  friendBookingRequestId: uuid (FK)
  
  // Vagaro Integration (source of truth)
  vagaroAppointmentId: text (unique, NOT NULL)
  vagaroCustomerId: text
  vagaroServiceProviderId: text
  vagaroServiceId: text
  vagaroBusinessId: text
  
  // Appointment details
  serviceTitle: text
  serviceCategory: text
  startTime: timestamp
  endTime: timestamp
  bookingStatus: text              // 'Confirmed', 'Cancelled', etc
  eventType: text                  // 'Service', 'Class', 'PersonalOff'
  
  // Metadata
  amount: numeric(10,2)
  onlineVsInhouse: text
  appointmentTypeCode: text        // 'NR', 'NNR', 'RR', 'RNR'
  formResponseIds: text (JSON array)
  
  // Sync tracking
  createdAt, updatedAt, lastSyncedAt: timestamp
  vagaroCreatedAt, vagaroModifiedAt: timestamp
}
```

---

## 7. API INTEGRATIONS

### 7.1 Vagaro Integration

**Client**: `/src/lib/vagaro-client.ts`

**Key Endpoints Used**:
- `getServices()` - Fetch all services
- `getServices({ categoryId })` - By category
- `getEmployees()` - Team members
- `getAvailability(serviceId, employeeId)` - Schedule slots
- `createAppointment()` - Book appointment

### 7.2 Vagaro Data Sync

**Stored Data**:
- Full Vagaro response in `vagaroData` column (JSONB)
- Last sync timestamp in `lastSyncedAt`
- Unique ID mapping (`vagaroServiceId`, `vagaroEmployeeId`, `vagaroAppointmentId`)

**Local Enrichment**:
- Custom categories/subcategories (not in Vagaro)
- Images and gallery (from DAM)
- Team member bios, quotes, specialties
- Custom colors and display order

### 7.3 SMS Provider

**File**: `/src/lib/sms-provider.ts`

**Used for**:
- Friend booking invites (Twilio)
- Booking confirmations (FUTURE)
- Appointment reminders (FUTURE)

---

## 8. TYPE DEFINITIONS

### 8.1 Main Type Files

**Orchestrator**: `/src/types/orchestrator.ts`
- Service, Provider interfaces
- Journey tracking types
- Event definitions
- Viewport management

**Cascading Panels**: `/src/types/cascading-panels.ts`
- Panel types, levels, states
- Panel data interfaces
- Action interfaces
- Event types

**Panel Stack**: `/src/types/panel-stack.ts`
- Alternative panel system types
- Panel animation config
- Stack operations

---

## 9. PAGE LAYOUT & STRUCTURE

### 9.1 Root Page

**File**: `/src/app/page.tsx`

```tsx
<BookingOrchestratorProvider>
  <PanelManagerProvider>
    <Navigation />
    <TeamPortfolioView />      // Provider portfolio
    <PanelRenderer />          // Panel stack rendering
    <main>
      <HeroSection />
      <PhotoTransition />
      <ServiceDiscoveryQuiz />
      <ServicesSection />      // Shows all services
      <TestimonialsSection />
      <AboutSection />
      <EnhancedTeamSection />  // Shows team members
      <ContactSection />
    </main>
    <Footer />
  </PanelManagerProvider>
</BookingOrchestratorProvider>
```

### 9.2 Sections Registered

Sections register with orchestrator for scroll tracking:
- `#hero` - Hero section
- `#services` - Services showcase
- `#team` - Team members
- `#about` - About section

---

## 10. KEY FILE LOCATIONS SUMMARY

```
Core Architecture:
├── /src/contexts/
│   ├── BookingOrchestratorContext.tsx    (Main state management)
│   ├── CascadingPanelContext.tsx         (Panel system)
│   └── PanelStackContext.tsx             (Alternative panels)
│
Action Panels:
├── /src/components/cascading-panels/
│   ├── panels/
│   │   ├── BookNowPanel.tsx
│   │   ├── CategoryPickerPanel.tsx
│   │   ├── SubcategoryServicePanel.tsx
│   │   └── ServiceDetailPanel.tsx
│   ├── PanelWrapper.tsx
│   └── PanelStackContainer.tsx
│
Data Actions:
├── /src/actions/
│   ├── services.ts                       (Service queries)
│   ├── team.ts                           (Team member queries)
│   ├── vagaro-services.ts                (Vagaro API calls)
│   └── vagaro-team.ts                    (Team from Vagaro)
│
Database:
├── /src/db/schema/
│   ├── services.ts                       (Service model)
│   ├── team_members.ts                   (Team model)
│   ├── appointments.ts                   (Booking model)
│   └── friend_booking_requests.ts        (Friend booking)
│
API Routes:
├── /src/app/api/bookings/
│   └── friend/
│       ├── route.ts                      (Create friend booking)
│       └── [token]/
│           ├── accept/route.ts           (Accept invitation)
│           └── decline/route.ts          (Decline invitation)
│
Types:
├── /src/types/
│   ├── orchestrator.ts                   (Booking orchestrator types)
│   ├── cascading-panels.ts               (Panel system types)
│   └── panel-stack.ts                    (Alternative panel types)
```

---

## 11. FUTURE ENHANCEMENTS NEEDED

### Immediate (In Progress):
- [ ] Schedule/availability panel
- [ ] Appointment creation API
- [ ] Payment integration (Stripe)
- [ ] Confirmation page/email

### Short Term:
- [ ] Real team member provider selection (not mock)
- [ ] Integration with Vagaro availability
- [ ] Appointment management (view, reschedule, cancel)
- [ ] User profile & booking history

### Medium Term:
- [ ] Add-ons/extras selection
- [ ] Form response handling
- [ ] Deposit/payment processing
- [ ] Calendar integration

---

## 12. STATE FLOW DIAGRAM

```
User Action
    ↓
┌─────────────────────────────────┐
│ Panel Component (CategoryPicker) │
└─────────────────────────────────┘
    ↓ calls
┌─────────────────────────────────┐
│ CascadingPanelContext.actions   │
│ (openPanel, toggleCategory)     │
└─────────────────────────────────┘
    ↓ updates
┌─────────────────────────────────┐
│ CascadingPanelState (reducer)   │
└─────────────────────────────────┘
    ↓ emits (optional)
┌─────────────────────────────────┐
│ EventBus.emit('CATEGORY_SELECTED')│
└─────────────────────────────────┘
    ↓ consumed by (optional)
┌─────────────────────────────────┐
│ BookingOrchestrator             │
│ (for cross-concern coordination)│
└─────────────────────────────────┘
    ↓
Panel components re-render with updated state
```
