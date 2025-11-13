# Vagaro Integration Guide

Complete guide to the Vagaro API integration in LashPop, including booking flow, syncing strategy, and widget implementation.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Booking Flow](#booking-flow)
4. [API Integration](#api-integration)
5. [Widget Integration](#widget-integration)
6. [Appointment Syncing](#appointment-syncing)
7. [User Linking](#user-linking)
8. [Testing](#testing)

---

## Overview

LashPop integrates with Vagaro for:
- **Service Management**: Sync services from Vagaro, enrich locally
- **Team Member Management**: Sync employees, display in branded UI
- **Appointment Booking**: Use Vagaro widget for final checkout
- **Payment Processing**: Handled by Vagaro
- **Appointment Tracking**: Sync appointments back via webhooks

### Why Use Vagaro Widget?

Vagaro's API is **read-only for appointments**:
- ✅ Can fetch services, employees, availability
- ❌ Cannot create appointments via API
- ✅ Must use their widget for booking

The widget handles:
- Availability checking
- Payment processing
- Appointment creation
- Customer information collection

---

## Architecture

### Data Flow

```
┌─────────────────┐
│  Vagaro Cloud   │
└────────┬────────┘
         │
         ├── API (Read-Only)
         │   ├── Services
         │   ├── Employees
         │   └── Availability
         │
         ├── Widget (Booking)
         │   └── Creates Appointments
         │
         └── Webhooks (Push Updates)
             ├── Appointments
             ├── Customers
             ├── Transactions
             └── Forms

         ↓

┌─────────────────┐
│  LashPop DB     │
│  (Mirror)       │
└─────────────────┘
```

### File Structure

```
src/
├── lib/
│   ├── vagaro-client.ts          # API client
│   ├── vagaro-sync.ts            # Services & team sync
│   └── vagaro-sync-all.ts        # Comprehensive sync (appointments, etc.)
│
├── actions/
│   ├── vagaro-services.ts        # Service server actions
│   ├── vagaro-team.ts            # Team member server actions
│   ├── team.ts                   # Team queries (including service filtering)
│   └── appointments.ts           # Appointment management & linking
│
├── components/
│   ├── VagaroBookingWidget.tsx   # Widget component
│   └── panels/
│       ├── ServiceDetailPanel.tsx   # Service selection + artist selection
│       ├── SchedulingPanel.tsx      # Final checkout with widget
│       └── PanelRenderer.tsx        # Panel router
│
├── app/api/webhooks/vagaro/
│   └── route.ts                  # Webhook handler
│
└── db/schema/
    ├── services.ts               # Services table
    ├── team_members.ts           # Team members table
    ├── appointments.ts           # Appointments table
    ├── vagaro_customers.ts       # Customer data
    └── ...
```

---

## Booking Flow

### User Journey

1. **Service Discovery** (LashPop UI)
   - Browse categories
   - View service cards
   - Select service

2. **Service Detail** (LashPop UI)
   - View service description, pricing, photos
   - See available artists (filtered by service capability)
   - Select preferred artist(s)

3. **Scheduling** (Vagaro Widget)
   - Widget shows real-time availability
   - Customer selects date/time
   - Enters contact info (if new)
   - Completes payment

4. **Confirmation** (Hybrid)
   - Vagaro sends webhook with appointment
   - LashPop syncs appointment to DB
   - Auto-links to user via phone number
   - Shows confirmation in LashPop UI

### Implementation

**ServiceDetailPanel.tsx** (`src/components/panels/ServiceDetailPanel.tsx`)
```typescript
// Fetches team members filtered by service
const members = await getTeamMembersByServiceId(service.id)

// User selects artist
toggleProvider(providerId)

// Continue button opens scheduling panel
pushPanel({
  type: 'scheduling',
  data: { service, selectedProviders }
})
```

**SchedulingPanel.tsx** (`src/components/panels/SchedulingPanel.tsx`)
```typescript
// Embeds Vagaro widget with parameters
<VagaroBookingWidget
  businessId={businessId}
  serviceId={service.vagaroServiceId}
  employeeId={primaryProvider.vagaroEmployeeId}
/>

// Listens for booking completion (postMessage)
// Triggers polling or waits for webhook
```

---

## API Integration

### Authentication

**File**: `src/lib/vagaro-client.ts`

```typescript
const client = getVagaroClient()
// Automatically handles token caching and refresh
```

Credentials stored in `.env.local`:
```bash
VAGARO_REGION=us02
VAGARO_CLIENT_ID=...
VAGARO_CLIENT_SECRET=...
VAGARO_API_BASE_URL=https://api.vagaro.com
VAGARO_BUSINESS_ID=...
```

### Available Endpoints

| Endpoint | Method | Purpose | Implementation |
|----------|--------|---------|----------------|
| `/api/v2/services` | POST | Fetch services | `client.getServices()` |
| `/api/v2/employees` | POST | Fetch employees | `client.getEmployees()` |
| `/api/appointments/availability` | POST | Search availability | `client.searchAvailability()` |
| `/api/v2/merchants/business` | GET | Get business info | `client.getBusinessInfo()` |

### Syncing Services

**File**: `src/lib/vagaro-sync.ts`

```typescript
// Sync all services from Vagaro
await syncAllServices()

// Sync single service
await syncService(vagaroServiceData)
```

**Strategy**:
- Fetch from Vagaro API
- Upsert into local DB (by `vagaroServiceId`)
- Preserve local enrichments (images, descriptions, etc.)
- Store full Vagaro response in `vagaroData` JSONB column

### Syncing Team Members

```typescript
// Sync all team members
await syncAllTeamMembers()

// Filter by service
const members = await getTeamMembersByServiceId(serviceId)
```

**Filtering Logic** (`src/actions/team.ts:41-88`):
1. Get service from DB
2. Extract `servicePerformedBy` array from `vagaroData`
3. Query team members where `vagaroEmployeeId` IN employee list

---

## Widget Integration

### Component

**File**: `src/components/VagaroBookingWidget.tsx`

```typescript
<VagaroBookingWidget
  businessId="gPkAwudgKVSOL3jl3AV9aw=="  // Your Vagaro business ID
  serviceId="abc123"                      // Pre-select service
  employeeId="xyz789"                     // Pre-select employee
  className="min-h-[600px]"
/>
```

### URL Parameters

The widget is loaded via iframe with URL parameters:

**Base URL**: `https://www.vagaro.com/bookingwidget`

**Parameters**:
| Parameter | Key | Description | Example |
|-----------|-----|-------------|---------|
| Business ID | `bid` | Your Vagaro business ID | `bid=gPkAwudgKVSOL3jl3AV9aw==` |
| Service ID | `sid` | Pre-select specific service | `sid=abc123` |
| Employee ID | `eid` | Pre-select specific employee | `eid=xyz789` |

**Full Example**:
```
https://www.vagaro.com/bookingwidget?bid=gPkAwudgKVSOL3jl3AV9aw==&sid=abc123&eid=xyz789
```

### Additional Parameters (Research Needed)

These parameters are suspected but **not yet confirmed**:
- `date` - Pre-select date
- `time` - Pre-select time
- `fname` - Pre-fill first name
- `lname` - Pre-fill last name
- `phone` - Pre-fill phone number
- `email` - Pre-fill email

**Action Item**: Test these parameters and document which ones work.

### Event Handling

The widget may post messages when booking completes:

```typescript
window.addEventListener('message', (event) => {
  if (event.data?.type === 'vagaro-booking-complete') {
    // Booking completed!
    // Trigger polling or show confirmation
  }
})
```

**Status**: Not yet confirmed. Vagaro widget may not post messages.

---

## Appointment Syncing

### Webhook-Based Sync (Primary)

**File**: `src/app/api/webhooks/vagaro/route.ts`

**Flow**:
1. User books via Vagaro widget
2. Vagaro creates appointment in their system
3. Vagaro sends webhook to `/api/webhooks/vagaro`
4. LashPop syncs appointment to DB
5. Auto-links appointment to user (see below)

**Webhook Payload Example**:
```json
{
  "type": "appointment",
  "action": "created",
  "payload": {
    "appointmentId": "abc123",
    "customerId": "xyz789",
    "serviceProviderId": "emp456",
    "serviceId": "svc789",
    "serviceTitle": "Classic Full Set",
    "startTime": "2025-01-15T10:00:00Z",
    "endTime": "2025-01-15T12:00:00Z",
    "bookingStatus": "Confirmed",
    "amount": 120.00,
    ...
  }
}
```

**Sync Function** (`src/lib/vagaro-sync-all.ts:18-68`):
```typescript
await syncAppointment(payload)
```

- Extracts appointment data
- Upserts to `appointments` table
- Stores full payload in `vagaroData`

### Polling (Supplementary)

**File**: `src/actions/appointments.ts`

```typescript
// Poll for recent appointments (not yet fully implemented)
await pollRecentAppointments({
  serviceId: service.vagaroServiceId,
  employeeId: provider.vagaroEmployeeId,
  minutesAgo: 5
})
```

**Status**: Placeholder. Vagaro API may not support polling recent appointments. Rely on webhooks primarily.

---

## User Linking

### Auto-Linking by Phone Number

**File**: `src/actions/appointments.ts:93-163`

**Strategy**:
When an appointment is synced via webhook, automatically link it to LashPop user:

1. Get Vagaro customer ID from appointment
2. Fetch Vagaro customer record (has phone numbers)
3. Normalize phone number (remove formatting)
4. Find LashPop user with matching phone
5. Link appointment to user

**Implementation**:
```typescript
// Webhook calls this after syncing appointment
await autoLinkAppointmentByPhone(vagaroAppointmentId)
```

**Phone Number Matching**:
- Vagaro customers have: `mobilePhone`, `dayPhone`, `nightPhone`
- LashPop users have: `phone` (from auth system)
- Normalize both before comparing (remove +1, spaces, dashes, etc.)

### Manual Linking

```typescript
// Manually link appointment to user
await linkAppointmentToUser({
  vagaroAppointmentId: 'abc123',
  userId: 'user-uuid',
  isFriendBooking: false
})
```

### Friend Bookings

For friend bookings (one user books for another):

```typescript
await linkAppointmentToUser({
  vagaroAppointmentId: 'abc123',
  userId: 'friend-user-id',
  isFriendBooking: true,
  friendBookingRequestId: 'request-uuid'
})
```

---

## Testing

### Manual Testing Checklist

#### Service & Team Integration
- [ ] Services sync from Vagaro
- [ ] Team members sync from Vagaro
- [ ] ServiceDetailPanel shows real team members
- [ ] Team members filtered correctly by service
- [ ] Images and data display properly

#### Booking Flow
- [ ] Click service → ServiceDetailPanel opens
- [ ] Select artist → selection state updates
- [ ] Click "Continue" → SchedulingPanel opens
- [ ] Widget loads with correct parameters
- [ ] Widget shows availability
- [ ] Complete booking in widget

#### Appointment Syncing
- [ ] After booking, webhook received
- [ ] Appointment synced to DB
- [ ] Appointment data matches booking
- [ ] Auto-link works (phone number match)
- [ ] User sees appointment in their profile

#### Edge Cases
- [ ] No team members for service (shows empty state)
- [ ] Widget fails to load (shows error state)
- [ ] Webhook fails (retry logic)
- [ ] Phone number doesn't match any user (appointment orphaned)
- [ ] Multiple users with same phone (uses first match)

### Widget Parameter Testing

Test the following URLs to discover supported parameters:

```bash
# Test 1: Just business ID
https://www.vagaro.com/bookingwidget?bid=YOUR_BUSINESS_ID

# Test 2: Business + Service
https://www.vagaro.com/bookingwidget?bid=YOUR_BUSINESS_ID&sid=SERVICE_ID

# Test 3: Business + Employee
https://www.vagaro.com/bookingwidget?bid=YOUR_BUSINESS_ID&eid=EMPLOYEE_ID

# Test 4: All three
https://www.vagaro.com/bookingwidget?bid=YOUR_BUSINESS_ID&sid=SERVICE_ID&eid=EMPLOYEE_ID

# Test 5: Date preselection (unknown if supported)
https://www.vagaro.com/bookingwidget?bid=YOUR_BUSINESS_ID&sid=SERVICE_ID&date=2025-01-15

# Test 6: Customer info prefill (unknown if supported)
https://www.vagaro.com/bookingwidget?bid=YOUR_BUSINESS_ID&fname=John&lname=Doe&phone=5555555555
```

**Document results**: Which parameters work? Which don't? Any others discovered?

---

## Troubleshooting

### Common Issues

**Issue**: Team members not showing in ServiceDetailPanel
- **Check**: Are team members synced? `SELECT * FROM team_members`
- **Check**: Do they have `vagaroEmployeeId` set?
- **Check**: Is service's `vagaroData` populated with `servicePerformedBy`?

**Issue**: Widget not loading
- **Check**: Is `NEXT_PUBLIC_VAGARO_WIDGET_URL` set?
- **Check**: Is `businessId` passed correctly?
- **Check**: Browser console for errors

**Issue**: Appointments not auto-linking to users
- **Check**: Is webhook receiving appointment events?
- **Check**: Is Vagaro customer synced with phone number?
- **Check**: Does user's phone number match (check normalization)?

**Issue**: Webhook not receiving events
- **Check**: Is webhook URL configured in Vagaro dashboard?
- **Check**: Is webhook secret configured (if required)?
- **Check**: Check webhook logs: `GET /api/webhooks/vagaro`

---

## Next Steps

### Immediate
1. ✅ Integrate real Vagaro team members into ServiceDetailPanel
2. ✅ Create SchedulingPanel with widget
3. ✅ Implement auto-linking by phone
4. ⏳ Test widget parameter discovery
5. ⏳ Test complete booking flow

### Short-term
- [ ] Add loading/error states for widget
- [ ] Implement confirmation panel after booking
- [ ] Add appointment list to user dashboard
- [ ] Handle appointment cancellations/modifications
- [ ] Improve phone number normalization (handle international)

### Long-term
- [ ] Support multiple provider scheduling comparison
- [ ] Implement custom availability UI (reduce widget reliance)
- [ ] Add appointment reminders
- [ ] Sync appointment forms/questionnaires
- [ ] Track booking analytics

---

## Related Files

### Core Integration
- `src/lib/vagaro-client.ts` - API client
- `src/lib/vagaro-sync.ts` - Service & team sync
- `src/lib/vagaro-sync-all.ts` - Comprehensive sync
- `src/app/api/webhooks/vagaro/route.ts` - Webhook handler

### Server Actions
- `src/actions/vagaro-services.ts` - Service actions
- `src/actions/vagaro-team.ts` - Team actions
- `src/actions/team.ts` - Team queries (service filtering)
- `src/actions/appointments.ts` - Appointment management

### Components
- `src/components/VagaroBookingWidget.tsx` - Widget component
- `src/components/panels/ServiceDetailPanel.tsx` - Service + artist selection
- `src/components/panels/SchedulingPanel.tsx` - Final checkout
- `src/components/panels/PanelRenderer.tsx` - Panel router

### Database Schema
- `src/db/schema/services.ts`
- `src/db/schema/team_members.ts`
- `src/db/schema/appointments.ts`
- `src/db/schema/vagaro_customers.ts`
- `src/db/schema/business_locations.ts`
- `src/db/schema/transactions.ts`
- `src/db/schema/form_responses.ts`

---

## Contact & Support

For Vagaro-specific questions:
- Vagaro Developer Docs: https://docs.vagaro.com/
- Vagaro Support: Contact through your business dashboard

For LashPop implementation questions:
- Refer to this guide
- Check codebase comments
- Review git commit history for context

---

**Last Updated**: 2025-11-12
**Integration Status**: ✅ Core implementation complete, testing in progress
