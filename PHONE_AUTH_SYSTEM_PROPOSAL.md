# LashPop Phone-First Authentication & Profile System
## Comprehensive Design Proposal

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [Profile System](#profile-system)
7. [Friend Booking Feature](#friend-booking-feature)
8. [Vagaro Integration](#vagaro-integration)
9. [Implementation Phases](#implementation-phases)
10. [Security Considerations](#security-considerations)
11. [Cost Analysis](#cost-analysis)

---

## Executive Summary

This proposal outlines a **phone-first authentication system** that enables frictionless onboarding while maintaining robust profile management and third-party integration capabilities.

### Key Features
- **Phone-first login** via SMS OTP (no passwords initially)
- **Progressive profile enrichment** (start with phone, add email/details later)
- **Friend booking with consent** (proxy appointments with SMS verification)
- **Bidirectional Vagaro sync** (maintain single source of truth for appointments)
- **Unified profile system** (bridge LashPop users ↔ Vagaro customers)

### User Journey
```
New User → Enter Phone → Receive OTP → Verify → Browse & Book
         ↓
    (Optional) Add Email, Name, Preferences later
         ↓
    Book for Friend → Friend gets SMS → They consent/verify → Account created
```

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     LashPop Frontend                         │
│  (Next.js 15 App Router + BetterAuth Client)                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              BetterAuth Server (Phone Plugin)                │
│  • Phone verification (Twilio/other SMS provider)            │
│  • Session management                                        │
│  • OTP generation & validation                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│            PostgreSQL Database (Supabase)                    │
│  Tables:                                                     │
│  • users (BetterAuth managed)                               │
│  • profiles (LashPop custom)                                │
│  • appointments                                              │
│  • vagaro_customers (synced)                                │
│  • vagaro_sync_mappings (NEW - links users to Vagaro)      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│               Vagaro API Integration Layer                   │
│  • Webhook receiver (appointments, customers)                │
│  • Sync service (bidirectional)                             │
│  • Customer matching algorithm                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Authentication
**Recommended: BetterAuth** (replacing Clerk)

**Why BetterAuth over Clerk?**
- ✅ **Phone-first native support** with phone number plugin
- ✅ **Open-source** and self-hosted (no vendor lock-in)
- ✅ **Built for Next.js** with excellent App Router integration
- ✅ **Lightweight** (~30KB) vs Clerk's larger bundle
- ✅ **Cost-effective** (only pay for SMS, not per-user fees)
- ✅ **Full control** over user data and auth flow
- ✅ **TypeScript-first** with excellent DX

**SMS Provider Options:**
1. **Twilio** (most reliable, $0.0079/SMS in US)
2. **AWS SNS** ($0.00645/SMS, good if using AWS already)
3. **Vonage** ($0.0072/SMS)
4. **Plivo** ($0.0070/SMS, slightly cheaper)

**Recommendation:** Start with Twilio for reliability, optimize costs later

### Database Extensions Needed
- Add BetterAuth tables (auto-generated via migration)
- Add custom profile tables
- Add sync mapping tables

---

## Database Schema

### New Tables

#### 1. `user` (BetterAuth managed)
```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  phone_verified BOOLEAN DEFAULT FALSE,
  email TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `session` (BetterAuth managed)
```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `verification` (BetterAuth managed - for OTP codes)
```sql
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL, -- phone number or email
  value TEXT NOT NULL,      -- OTP code
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `profiles` (Custom - extends BetterAuth user)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,

  -- Contact info (progressive enrichment)
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,

  -- Marketing preferences
  sms_marketing_opt_in BOOLEAN DEFAULT FALSE,
  email_marketing_opt_in BOOLEAN DEFAULT FALSE,

  -- Preferences
  preferred_location_id UUID REFERENCES business_locations(id),
  preferred_team_member_id UUID REFERENCES team_members(id),

  -- Lash history
  lash_type TEXT, -- classic, hybrid, volume, mega
  lash_curl TEXT, -- C, D, L, etc.
  lash_length TEXT, -- 9mm, 10mm, etc.
  allergies TEXT,
  notes TEXT,

  -- Loyalty/tier (future)
  loyalty_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'standard', -- standard, vip, elite

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  profile_completion_percentage INTEGER DEFAULT 0
);
```

#### 5. `vagaro_sync_mappings` (NEW - critical for integration)
```sql
CREATE TABLE vagaro_sync_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- LashPop side
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Vagaro side
  vagaro_customer_id TEXT UNIQUE NOT NULL,
  vagaro_business_ids TEXT[] DEFAULT '{}', -- Array of business IDs

  -- Sync metadata
  sync_status TEXT DEFAULT 'active', -- active, pending, failed
  last_synced_at TIMESTAMP,
  sync_direction TEXT DEFAULT 'bidirectional', -- bidirectional, lashpop_to_vagaro, vagaro_to_lashpop

  -- Conflict resolution
  conflict_resolution_strategy TEXT DEFAULT 'vagaro_wins', -- vagaro_wins, lashpop_wins, manual
  last_conflict_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, vagaro_customer_id)
);
```

#### 6. `friend_booking_requests` (NEW - for friend appointments)
```sql
CREATE TABLE friend_booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Requester (who's making the booking)
  requester_user_id TEXT NOT NULL REFERENCES user(id),
  requester_phone TEXT NOT NULL,

  -- Friend (who the booking is for)
  friend_phone TEXT NOT NULL,
  friend_user_id TEXT REFERENCES user(id), -- NULL if not yet a user
  friend_name TEXT, -- Optional name provided by requester

  -- Appointment details
  service_id UUID REFERENCES services(id),
  team_member_id UUID REFERENCES team_members(id),
  requested_date_time TIMESTAMP,

  -- Request state
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
  consent_token TEXT UNIQUE NOT NULL, -- For SMS link verification
  consent_token_expires_at TIMESTAMP NOT NULL,

  -- Response tracking
  consented_at TIMESTAMP,
  declined_at TIMESTAMP,
  declined_reason TEXT,

  -- If accepted, link to created appointment
  appointment_id UUID REFERENCES appointments(id),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. Modified `appointments` table
```sql
-- Add new columns to existing appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS
  user_id TEXT REFERENCES user(id), -- LashPop user who owns this appointment

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS
  booked_by_user_id TEXT REFERENCES user(id), -- Who made the booking (could be different for friend bookings)

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS
  is_friend_booking BOOLEAN DEFAULT FALSE,

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS
  friend_booking_request_id UUID REFERENCES friend_booking_requests(id);
```

---

## Authentication Flow

### 1. Initial Sign-Up / Sign-In (Phone-First)

```typescript
// Frontend: components/auth/PhoneLoginForm.tsx
'use client'

import { useAuth } from '@/lib/auth-client'
import { useState } from 'react'

export function PhoneLoginForm() {
  const { phoneNumber } = useAuth()
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [code, setCode] = useState('')

  const handleSendOTP = async () => {
    await phoneNumber.sendOtp({ phoneNumber: phone })
    setStep('verify')
  }

  const handleVerifyOTP = async () => {
    await phoneNumber.verifyOtp({
      phoneNumber: phone,
      otp: code
    })
    // User is now signed in!
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOTP}>
        <input
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button>Send Code</button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOTP}>
      <input
        type="text"
        placeholder="Enter 6-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button>Verify & Continue</button>
    </form>
  )
}
```

### 2. Server-Side Auth Setup

```typescript
// lib/auth.ts (server)
import { betterAuth } from 'better-auth'
import { phoneNumber } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import { sendSMS } from '@/lib/sms-provider'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg'
  }),

  plugins: [
    phoneNumber({
      // OTP sending logic
      sendOTP: async ({ phoneNumber, code }, request) => {
        await sendSMS({
          to: phoneNumber,
          message: `Your LashPop verification code is: ${code}\n\nThis code expires in 10 minutes.`
        })
      },

      // OTP configuration
      otpLength: 6,
      expiresIn: 600, // 10 minutes

      // Allow sign-up on first verification
      allowSignUp: true,

      // After verification, create profile automatically
      afterVerification: async (user) => {
        // Check if profile exists
        const existingProfile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, user.id)
        })

        if (!existingProfile) {
          // Create profile
          await db.insert(profiles).values({
            userId: user.id,
            profileCompletionPercentage: 20 // Only phone verified
          })

          // Try to match with existing Vagaro customer
          await matchAndLinkVagaroCustomer(user)
        }
      }
    })
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 // Update every 24 hours
  }
})
```

### 3. SMS Provider Integration

```typescript
// lib/sms-provider.ts
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendSMS({
  to,
  message
}: {
  to: string
  message: string
}) {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    })

    console.log(`SMS sent to ${to}: ${result.sid}`)
    return result
  } catch (error) {
    console.error('SMS send failed:', error)
    throw new Error('Failed to send verification code')
  }
}
```

---

## Profile System

### Progressive Profile Enrichment

Users start with **minimal data** (just phone) and progressively add more:

#### Phase 1: Phone Only (Required)
```
✓ Phone number verified
→ User can browse and book immediately
```

#### Phase 2: Basic Info (Prompted after first booking)
```
+ First name
+ Last name
+ Email (optional but recommended)
```

#### Phase 3: Preferences (Collected over time)
```
+ Preferred location
+ Preferred lash artist
+ Lash preferences (type, curl, length)
+ Allergies/notes
```

#### Phase 4: Marketing & Loyalty
```
+ Marketing consent (SMS/email)
+ Loyalty program enrollment
+ Birthday for rewards
```

### Profile Completion Tracking

```typescript
// actions/profiles.ts
export async function calculateProfileCompletion(userId: string): Promise<number> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId)
  })

  if (!profile) return 0

  let score = 0

  // Required fields
  if (profile.userId) score += 20 // Phone verified (via user table)

  // Basic info (40 points total)
  if (profile.firstName) score += 10
  if (profile.lastName) score += 10
  if (profile.email) score += 20

  // Preferences (20 points)
  if (profile.preferredLocationId) score += 10
  if (profile.preferredTeamMemberId) score += 10

  // Additional details (20 points)
  if (profile.dateOfBirth) score += 10
  if (profile.lashType || profile.lashCurl || profile.lashLength) score += 10

  return score
}
```

### Profile UI Component

```typescript
// components/profile/ProfileCompletion.tsx
export function ProfileCompletion({ user, profile }) {
  const completion = profile.profileCompletionPercentage

  return (
    <div className="profile-completion">
      <div className="progress-bar">
        <div style={{ width: `${completion}%` }} />
      </div>
      <p>{completion}% Complete</p>

      {completion < 100 && (
        <div className="suggestions">
          <h4>Complete your profile to:</h4>
          <ul>
            {!profile.firstName && <li>Add your name for personalized service</li>}
            {!profile.email && <li>Add email for appointment confirmations</li>}
            {!profile.preferredTeamMemberId && <li>Choose your favorite lash artist</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
```

---

## Friend Booking Feature

### User Flow

1. **User wants to book for friend**
   - Selects service, date, time
   - Clicks "Book for a friend instead"
   - Enters friend's phone number (optionally name)

2. **System checks if friend exists**
   - If friend has account: Send confirmation SMS
   - If friend is new: Send invitation SMS with consent request

3. **Friend receives SMS**
   ```
   Hi! [Your Name] wants to book you a lash appointment at LashPop on [Date] at [Time].

   Tap here to confirm: https://lashpop.com/confirm/abc123

   This will create a LashPop account for you (takes 30 seconds!)
   ```

4. **Friend clicks link**
   - If existing user: Verify OTP → Confirm → Appointment created
   - If new user: Verify phone → Mini profile → Confirm → Account + Appointment created

5. **Appointment reserved**
   - Held for 24 hours pending confirmation
   - If not confirmed, slot released
   - Friend and booker both get confirmation

### Implementation

```typescript
// app/api/bookings/friend/route.ts
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { friendBookingRequests, appointments } from '@/db/schema'
import { sendSMS } from '@/lib/sms-provider'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { friendPhone, friendName, serviceId, teamMemberId, dateTime } = await req.json()

  // Check if friend already has account
  const existingUser = await db.query.user.findFirst({
    where: eq(user.phoneNumber, friendPhone)
  })

  // Generate consent token
  const consentToken = nanoid(32)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Create friend booking request
  const [request] = await db.insert(friendBookingRequests).values({
    requesterUserId: session.user.id,
    requesterPhone: session.user.phoneNumber,
    friendPhone,
    friendName,
    friendUserId: existingUser?.id,
    serviceId,
    teamMemberId,
    requestedDateTime: dateTime,
    consentToken,
    consentTokenExpiresAt: expiresAt,
    status: 'pending'
  }).returning()

  // Send SMS to friend
  const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/confirm/${consentToken}`
  const service = await getServiceById(serviceId)

  const message = existingUser
    ? `Hi! ${session.user.name || 'A friend'} booked you for ${service.name} at LashPop on ${formatDate(dateTime)}. Confirm here: ${confirmUrl}`
    : `Hi${friendName ? ' ' + friendName : ''}! ${session.user.name || 'A friend'} wants to book you for ${service.name} at LashPop on ${formatDate(dateTime)}. Create your account & confirm: ${confirmUrl}`

  await sendSMS({ to: friendPhone, message })

  return Response.json({ success: true, requestId: request.id })
}
```

```typescript
// app/confirm/[token]/page.tsx
export default async function ConfirmFriendBooking({ params }) {
  const { token } = params

  // Get booking request
  const request = await db.query.friendBookingRequests.findFirst({
    where: eq(friendBookingRequests.consentToken, token)
  })

  if (!request || request.consentTokenExpiresAt < new Date()) {
    return <div>This link has expired</div>
  }

  if (request.status !== 'pending') {
    return <div>This booking has already been {request.status}</div>
  }

  // If user already exists, just verify and confirm
  // If new user, show phone verification + mini profile form

  return (
    <FriendBookingConfirmation request={request} />
  )
}
```

---

## Vagaro Integration

### Strategy: Bidirectional Sync with Conflict Resolution

#### Core Principles
1. **Vagaro is the source of truth for appointments** (they manage calendar, availability)
2. **LashPop is the source of truth for user preferences** (lash history, marketing consent)
3. **Phone number is the universal identifier** for matching
4. **Webhooks drive real-time updates**, cron jobs handle batch sync

### Matching Algorithm

When a LashPop user signs up or books, we need to link them to Vagaro:

```typescript
// lib/vagaro-matching.ts
export async function matchAndLinkVagaroCustomer(user: User) {
  const phoneNumber = user.phoneNumber

  // 1. Check if already linked
  const existing = await db.query.vagaroSyncMappings.findFirst({
    where: eq(vagaroSyncMappings.userId, user.id)
  })
  if (existing) return existing

  // 2. Search Vagaro for customer with matching phone
  const vagaroCustomers = await db.query.vagaroCustomers.findMany({
    where: sql`phones @> ${JSON.stringify([phoneNumber])}`
  })

  if (vagaroCustomers.length === 1) {
    // Perfect match - create mapping
    const [mapping] = await db.insert(vagaroSyncMappings).values({
      userId: user.id,
      profileId: profile.id,
      vagaroCustomerId: vagaroCustomers[0].vagaroCustomerId,
      vagaroBusinessIds: vagaroCustomers[0].vagaroBusinessIds,
      syncStatus: 'active',
      lastSyncedAt: new Date()
    }).returning()

    // Import their appointment history
    await syncAppointmentHistory(mapping)

    return mapping
  }

  if (vagaroCustomers.length > 1) {
    // Multiple matches - use fuzzy matching with name/email
    const bestMatch = await fuzzyMatchCustomer(user, vagaroCustomers)
    if (bestMatch.confidence > 0.8) {
      // Create mapping with high confidence
      return await createMapping(user, bestMatch.customer)
    } else {
      // Flag for manual review
      await flagForManualReview(user, vagaroCustomers)
    }
  }

  // No match found - create new Vagaro customer when they book
  return null
}
```

### Webhook Handling

```typescript
// app/api/webhooks/vagaro/route.ts
export async function POST(req: Request) {
  const signature = req.headers.get('x-vagaro-signature')
  const payload = await req.json()

  // Verify webhook signature
  if (!verifyVagaroSignature(signature, payload)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const { event, data } = payload

  switch (event) {
    case 'appointment.created':
    case 'appointment.updated':
      await handleAppointmentSync(data)
      break

    case 'appointment.cancelled':
      await handleAppointmentCancellation(data)
      break

    case 'customer.created':
    case 'customer.updated':
      await handleCustomerSync(data)
      break

    default:
      console.log(`Unhandled webhook event: ${event}`)
  }

  return Response.json({ success: true })
}

async function handleAppointmentSync(vagaroAppointment: any) {
  // 1. Upsert appointment to local DB
  const appointment = await db.insert(appointments)
    .values({
      vagaroAppointmentId: vagaroAppointment.id,
      vagaroCustomerId: vagaroAppointment.customerId,
      startTime: vagaroAppointment.startTime,
      endTime: vagaroAppointment.endTime,
      serviceTitle: vagaroAppointment.service.name,
      bookingStatus: vagaroAppointment.status,
      // ... other fields
    })
    .onConflictDoUpdate({
      target: appointments.vagaroAppointmentId,
      set: {
        startTime: vagaroAppointment.startTime,
        bookingStatus: vagaroAppointment.status,
        // ... updates
      }
    })
    .returning()

  // 2. Find mapped user
  const mapping = await db.query.vagaroSyncMappings.findFirst({
    where: eq(vagaroSyncMappings.vagaroCustomerId, vagaroAppointment.customerId)
  })

  if (mapping) {
    // 3. Link appointment to user
    await db.update(appointments)
      .set({ userId: mapping.userId })
      .where(eq(appointments.id, appointment.id))

    // 4. Send notification to user
    await sendAppointmentNotification(mapping.userId, appointment)
  }
}
```

### Sync Service (Batch)

```typescript
// lib/vagaro-sync-service.ts
export async function syncAllFromVagaro() {
  console.log('Starting Vagaro sync...')

  // 1. Sync customers
  const vagaroCustomers = await fetchAllVagaroCustomers()
  await upsertVagaroCustomers(vagaroCustomers)

  // 2. Sync appointments
  const vagaroAppointments = await fetchRecentAppointments()
  await upsertAppointments(vagaroAppointments)

  // 3. Try to auto-match unlinked users
  await autoMatchUnlinkedUsers()

  console.log('Vagaro sync complete')
}

// Cron job: runs every 6 hours
// Or on-demand via admin dashboard
```

### Creating Vagaro Customers from LashPop

When a LashPop user books and doesn't exist in Vagaro:

```typescript
// lib/vagaro-customer-creation.ts
export async function createVagaroCustomer(user: User, profile: Profile) {
  const vagaroClient = getVagaroClient()

  // Call Vagaro API to create customer
  const vagaroCustomer = await vagaroClient.createCustomer({
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: user.phoneNumber,
    email: user.email,
    // ... other fields
  })

  // Create mapping
  await db.insert(vagaroSyncMappings).values({
    userId: user.id,
    profileId: profile.id,
    vagaroCustomerId: vagaroCustomer.id,
    syncDirection: 'lashpop_to_vagaro',
    lastSyncedAt: new Date()
  })

  return vagaroCustomer
}
```

---

## Implementation Phases

### Phase 1: Authentication Foundation (Week 1-2)
**Goal:** Replace Clerk with BetterAuth phone authentication

**Tasks:**
- [ ] Install BetterAuth and phone number plugin
- [ ] Set up Twilio account and credentials
- [ ] Create database migrations for BetterAuth tables
- [ ] Implement phone login UI components
- [ ] Set up SMS sending service
- [ ] Test OTP flow end-to-end
- [ ] Add session management
- [ ] Create protected routes middleware

**Deliverables:**
- Users can sign up/log in with phone number
- OTP verification works reliably
- Sessions persist for 30 days

---

### Phase 2: Profile System (Week 2-3)
**Goal:** Build progressive profile enrichment

**Tasks:**
- [ ] Create `profiles` table migration
- [ ] Build profile creation flow (triggered after first auth)
- [ ] Create profile editing UI
- [ ] Implement profile completion tracking
- [ ] Add profile completion widget
- [ ] Build onboarding flow (optional email, name, etc.)
- [ ] Add profile preferences (location, team member)

**Deliverables:**
- Users have customizable profiles
- Progressive disclosure of profile fields
- Profile completion percentage tracked

---

### Phase 3: Vagaro Integration - Matching (Week 3-4)
**Goal:** Link LashPop users to Vagaro customers

**Tasks:**
- [ ] Create `vagaro_sync_mappings` table
- [ ] Build phone number matching algorithm
- [ ] Implement fuzzy matching for edge cases
- [ ] Create manual review queue for ambiguous matches
- [ ] Build admin UI for reviewing/approving matches
- [ ] Import appointment history for matched users
- [ ] Test matching with real Vagaro data

**Deliverables:**
- Automatic matching of 80%+ of users
- Manual review flow for ambiguous cases
- Historical appointments imported

---

### Phase 4: Vagaro Integration - Sync (Week 4-5)
**Goal:** Real-time bidirectional sync

**Tasks:**
- [ ] Set up Vagaro webhooks (appointment, customer events)
- [ ] Build webhook receiver endpoint
- [ ] Implement webhook signature verification
- [ ] Create appointment sync handler
- [ ] Create customer sync handler
- [ ] Build batch sync cron job (fallback)
- [ ] Add conflict resolution logic
- [ ] Test webhook reliability

**Deliverables:**
- Real-time appointment updates from Vagaro
- Customer data stays in sync
- Fallback batch sync every 6 hours

---

### Phase 5: Friend Booking Feature (Week 5-6)
**Goal:** Enable booking for friends with consent

**Tasks:**
- [ ] Create `friend_booking_requests` table
- [ ] Build "Book for friend" UI flow
- [ ] Create consent token generation
- [ ] Build friend confirmation page
- [ ] Implement new user onboarding from friend invite
- [ ] Add SMS notification for friend booking
- [ ] Handle appointment creation after consent
- [ ] Add expiration/cancellation logic (24-hour hold)
- [ ] Build UI for managing friend bookings

**Deliverables:**
- Users can book for friends
- Friends get SMS invitation
- Consent flow works for both new and existing users
- Appointments held for 24 hours

---

### Phase 6: Appointment Management (Week 6-7)
**Goal:** Full appointment lifecycle in LashPop

**Tasks:**
- [ ] Build appointment list UI (upcoming, past)
- [ ] Add appointment details view
- [ ] Implement appointment cancellation
- [ ] Add appointment modification (if Vagaro API supports)
- [ ] Build calendar view
- [ ] Add reminders/notifications
- [ ] Link appointments to profiles
- [ ] Show lash history from past appointments

**Deliverables:**
- Users can view all appointments
- Cancellation works (syncs to Vagaro)
- Email/SMS reminders sent

---

### Phase 7: Enhanced Features (Week 7-8)
**Goal:** Loyalty, preferences, and analytics

**Tasks:**
- [ ] Build loyalty points system
- [ ] Add tier system (standard, VIP, elite)
- [ ] Implement lash preference tracking
- [ ] Build recommendation engine (products, services)
- [ ] Add analytics dashboard (admin)
- [ ] Create customer insights (lash artist view)
- [ ] Build marketing automation (birthday, re-engagement)

**Deliverables:**
- Loyalty program active
- Personalized recommendations
- Admin can see customer analytics

---

## Security Considerations

### 1. Phone Number Validation
```typescript
// Prevent abuse via rate limiting
import { ratelimit } from '@/lib/redis'

export async function sendOTP(phoneNumber: string) {
  // Rate limit: 3 OTP requests per phone per hour
  const { success } = await ratelimit.limit(`otp:${phoneNumber}`)
  if (!success) {
    throw new Error('Too many OTP requests. Please try again later.')
  }

  // Validate phone number format
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new Error('Invalid phone number format')
  }

  // Send OTP
  await sendSMS({ to: phoneNumber, code: generateOTP() })
}
```

### 2. Consent Token Security
```typescript
// Use cryptographically secure tokens
import { nanoid } from 'nanoid'

const consentToken = nanoid(32) // 32-character random string

// Expire after 24 hours
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

// One-time use (mark as used after consumption)
```

### 3. Webhook Signature Verification
```typescript
import crypto from 'crypto'

function verifyVagaroSignature(signature: string, payload: any): boolean {
  const secret = process.env.VAGARO_WEBHOOK_SECRET
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')

  return signature === hash
}
```

### 4. PII Protection
- Encrypt phone numbers at rest (use PostgreSQL pgcrypto)
- Mask phone numbers in logs
- GDPR compliance: allow data export and deletion
- Regular security audits

---

## Cost Analysis

### SMS Costs (Twilio)
- **OTP per login:** $0.0079
- **Friend booking invite:** $0.0079
- **Appointment reminders:** $0.0079

**Monthly estimate (1,000 active users):**
- 1,000 logins/month: $7.90
- 500 friend invites: $3.95
- 2,000 reminders: $15.80
- **Total: ~$28/month**

**At scale (10,000 users):**
- **~$280/month** for SMS

### BetterAuth vs Clerk Cost Comparison

| Users | Clerk (Pro) | BetterAuth + Twilio | Savings |
|-------|-------------|---------------------|---------|
| 1K    | $25/mo base + $0.02/user = $45/mo | $28/mo SMS only | **$17/mo** |
| 10K   | $25/mo base + $200 = $225/mo | $280/mo | **Break-even** |
| 50K   | $25/mo + $1,000 = $1,025/mo | $1,400/mo | Clerk cheaper |

**Recommendation:** BetterAuth is cheaper until ~10K users, then Clerk becomes competitive. But BetterAuth gives you:
- Full data ownership
- No vendor lock-in
- More customization
- Better for regulatory compliance

---

## API Endpoints Reference

### Authentication
```
POST /api/auth/phone/send-otp
POST /api/auth/phone/verify-otp
POST /api/auth/logout
GET  /api/auth/session
```

### Profile
```
GET    /api/profile
PUT    /api/profile
GET    /api/profile/completion
POST   /api/profile/preferences
```

### Appointments
```
GET    /api/appointments (list user's appointments)
GET    /api/appointments/:id (appointment details)
POST   /api/appointments (create new - Vagaro integration)
PUT    /api/appointments/:id (modify)
DELETE /api/appointments/:id (cancel)
```

### Friend Booking
```
POST   /api/bookings/friend (initiate friend booking)
GET    /api/bookings/friend/:token (get request details)
POST   /api/bookings/friend/:token/accept (confirm)
POST   /api/bookings/friend/:token/decline (reject)
```

### Vagaro Webhooks
```
POST   /api/webhooks/vagaro (receive all webhook events)
```

### Admin/Sync
```
POST   /api/admin/sync/vagaro (trigger manual sync)
GET    /api/admin/sync/status (sync status)
GET    /api/admin/matches/pending (unlinked users)
POST   /api/admin/matches/:id/approve (manual match approval)
```

---

## Environment Variables Required

```bash
# BetterAuth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=https://lashpop.com

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Vagaro (existing)
VAGARO_CLIENT_ID=...
VAGARO_CLIENT_SECRET=...
VAGARO_BUSINESS_ID=...
VAGARO_WEBHOOK_SECRET=...

# Database (existing)
DATABASE_URL=postgresql://...

# App
NEXT_PUBLIC_BASE_URL=https://lashpop.com
```

---

## Next Steps

1. **Review this proposal** - Discuss with team, validate assumptions
2. **Choose SMS provider** - Sign up for Twilio account
3. **Create timeline** - Prioritize phases based on business needs
4. **Set up dev environment** - Install BetterAuth, configure test DB
5. **Start Phase 1** - Authentication foundation

---

## Questions & Decisions Needed

1. **SMS Provider?** Twilio (recommended) vs AWS SNS vs other?
2. **Conflict resolution?** Should Vagaro or LashPop win on data conflicts?
3. **Manual matching?** What % of users are we okay manually reviewing?
4. **Friend booking limits?** Max # of friends you can book for at once?
5. **Appointment hold time?** 24 hours for friend consent - is this right?
6. **Marketing consent?** Double opt-in for SMS/email marketing?

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**Author:** Claude Code
**Status:** Proposal - Awaiting Review
