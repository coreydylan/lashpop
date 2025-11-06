# LashPop x Vagaro Deep Integration Strategy

## Executive Summary

Based on your current site architecture and Vagaro's API capabilities, **you can achieve 90-95% on-site booking experience** with full styling control. Here's the strategic approach:

### ✅ What You CAN Do (Fully Custom)
- Service browsing with your existing design
- Provider/artist selection with your team section
- Availability calendar with your styling
- Time slot selection with custom UI
- Customer information collection
- Appointment confirmation flow
- Real-time availability updates via API

### ⚠️ What Requires Vagaro Widget (Limited Styling)
- **Payment processing** (PCI compliance requirement)
- **Final booking submission** (Vagaro needs to handle transaction)

### 🎯 Recommended Approach
**Build custom booking flow (Steps 1-6) → Seamless handoff to styled Vagaro widget (Step 7) → Return to your site (Step 8)**

---

## Integration Architecture Options

### Option 1: Hybrid Approach (RECOMMENDED)
**90% Custom + 10% Vagaro Widget**

**Your Custom Components (Steps 1-6):**
1. Service selection using your existing `ServiceDiscoveryQuiz`
2. Artist selection using your `EnhancedTeamSection`
3. Date picker with your design system
4. Time slot grid with your styling
5. Customer information form with your glass components
6. Appointment review with your design

**Vagaro Widget (Step 7):**
- Embedded, minimally-styled iframe for payment processing only
- Pre-filled with all selections from Steps 1-6
- Styled to match your color palette as much as possible

**Your Custom Components (Step 8):**
- Success page with your design
- Calendar download, email confirmation, etc.

#### Pros:
- ✅ Full control over 90% of the experience
- ✅ Customers stay on your domain throughout
- ✅ PCI-compliant payment handling by Vagaro
- ✅ Leverages existing design system
- ✅ Can optimize conversion at each step

#### Cons:
- ⚠️ Widget styling limited (but can be minimized)
- ⚠️ Requires syncing your DB with Vagaro
- ⚠️ More development effort

---

### Option 2: Full Custom (95% Control, More Complex)
**Build everything custom, only use Vagaro API**

Use Vagaro API for:
- Real-time availability checks
- Appointment creation
- Payment processing (via API)
- Webhook updates

#### Pros:
- ✅ 100% custom UI/UX
- ✅ Complete brand consistency
- ✅ No iframe/widget limitations

#### Cons:
- ⚠️ Must handle PCI compliance for payments
- ⚠️ More complex integration
- ⚠️ Payment gateway setup required
- ⚠️ Higher development cost

---

## Recommended: Hybrid Integration Deep Dive

### Phase 1: Data Strategy

#### Your Database (Source of Truth for Display)
Store local copies for **fast display and user experience**:

```typescript
// Your existing schema + additions
tables:
  - services (existing)
  - team_members (existing)
  - service_categories (existing)
  + vagaro_services (sync table)
  + vagaro_employees (sync table)
  + booking_sessions (temporary booking state)
  + appointment_confirmations (completed bookings)
```

#### Sync Strategy

**One-way sync from Vagaro → Your DB (Daily/Hourly)**
```typescript
// Scheduled job - runs every hour
async function syncFromVagaro() {
  // 1. Fetch services from Vagaro
  const vagaroServices = await vagaroClient.request('POST', '/api/services/retrieve', {})

  // 2. Match with your local services by name/ID mapping
  // 3. Update availability, pricing, duration
  // 4. Store in vagaro_services table

  // Same for employees/artists
  const vagaroEmployees = await vagaroClient.request('POST', '/api/employees/retrieve', {})

  // Match with your team_members table
}
```

**Real-time for availability checks:**
```typescript
// Always fetch live from Vagaro API
async function getAvailability(serviceId, artistId, date) {
  return await vagaroClient.request('POST', '/api/appointments/availability', {
    service_id: serviceId,
    employee_id: artistId,
    date: date
  })
}
```

**Why this approach:**
- ✅ Fast page loads (local data)
- ✅ Always accurate availability (live API)
- ✅ No stale appointment conflicts
- ✅ Your site works even if Vagaro API is slow

---

### Phase 2: Custom Booking Flow Components

#### Component 1: Service Selection (Already Have!)
```tsx
// Use your existing ServiceDiscoveryQuiz.tsx
// Just enhance to store selection in booking session

function ServiceDiscoveryQuiz() {
  const handleServiceSelect = async (serviceId: string) => {
    // Store in booking session
    await saveBookingSession({
      serviceId,
      step: 'service-selected'
    })

    // Move to artist selection
    router.push('/book/artist')
  }
}
```

#### Component 2: Artist Selection (New - Matches Your Design)
```tsx
// src/components/booking/ArtistSelection.tsx
'use client'

import { motion } from 'framer-motion'
import { TeamMemberCard } from '@/components/team/TeamMemberCard'

export function ArtistSelection({ serviceId }: { serviceId: string }) {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch artists who can perform this service
    async function loadArtists() {
      // From your DB - artists who offer this service
      const localArtists = await getArtistsForService(serviceId)

      // Check real-time availability for each
      const withAvailability = await Promise.all(
        localArtists.map(async (artist) => {
          const nextAvailable = await getNextAvailableSlot(serviceId, artist.id)
          return { ...artist, nextAvailable }
        })
      )

      setArtists(withAvailability)
      setLoading(false)
    }

    loadArtists()
  }, [serviceId])

  return (
    <section className="py-[var(--space-xl)] bg-gradient-to-b from-cream via-warm-sand/10 to-cream">
      <div className="container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <span className="caption text-terracotta">Step 2 of 6</span>
            <h2 className="h2 text-dune">Choose Your Artist</h2>
            <p className="body-lg text-dune/70">
              Select from our talented team of specialists
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artists.map((artist) => (
              <motion.div
                key={artist.id}
                whileHover={{ y: -4 }}
                className="glass arch-full overflow-hidden cursor-pointer"
                onClick={() => handleArtistSelect(artist)}
              >
                <div className="relative h-64">
                  <Image
                    src={artist.imageUrl}
                    alt={artist.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-6 space-y-2">
                  <h3 className="h3 text-dune">{artist.name}</h3>
                  <p className="caption text-terracotta">{artist.role}</p>

                  {artist.nextAvailable && (
                    <div className="pt-4 border-t border-sage/20">
                      <p className="text-sm text-dune/70">Next available:</p>
                      <p className="font-medium text-sage">
                        {formatDate(artist.nextAvailable)}
                      </p>
                    </div>
                  )}

                  <button className="btn btn-secondary w-full mt-4">
                    Select {artist.name.split(' ')[0]}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Option to see any available artist */}
          <motion.div className="text-center pt-8">
            <button
              onClick={() => handleArtistSelect({ id: 'any', name: 'Any Available' })}
              className="btn btn-outline"
            >
              First Available Artist
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
```

#### Component 3: Date & Time Selection (New - Your Styling)
```tsx
// src/components/booking/DateTimeSelection.tsx
'use client'

import { motion } from 'framer-motion'
import { Calendar } from '@/components/ui/Calendar' // Your styled calendar
import { useState, useEffect } from 'react'

export function DateTimeSelection({
  serviceId,
  artistId
}: {
  serviceId: string
  artistId: string
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate) return

    async function fetchAvailability() {
      setLoading(true)

      // Live API call to Vagaro
      const response = await fetch('/api/booking/availability', {
        method: 'POST',
        body: JSON.stringify({
          serviceId,
          artistId,
          date: formatDate(selectedDate)
        })
      })

      const data = await response.json()
      setAvailableSlots(data.available_slots)
      setLoading(false)
    }

    fetchAvailability()
  }, [selectedDate, serviceId, artistId])

  return (
    <section className="py-[var(--space-xl)] bg-gradient-to-b from-cream via-warm-sand/10 to-cream">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <span className="caption text-terracotta">Step 3 of 6</span>
            <h2 className="h2 text-dune">Choose Your Date & Time</h2>
          </div>

          {/* Calendar - your styled component */}
          <div className="glass arch-full p-8">
            <Calendar
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="mx-auto"
              // Your custom styling
            />
          </div>

          {/* Time Slots Grid */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="h3 text-dune text-center">
                Available Times for {formatDate(selectedDate)}
              </h3>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sage border-t-transparent" />
                  <p className="mt-4 text-dune/70">Checking availability...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="glass arch-full p-12 text-center">
                  <p className="text-dune/70">
                    No availability on this date. Please select another date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {availableSlots.map((slot) => (
                    <motion.button
                      key={slot.start_time}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTimeSelect(slot)}
                      className="glass rounded-xl p-4 text-center hover:bg-sage/10 transition-all"
                    >
                      <p className="font-medium text-dune">
                        {formatTime(slot.start_time)}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
```

#### Component 4: Customer Information (New - Your Form Styling)
```tsx
// src/components/booking/CustomerInformation.tsx
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export function CustomerInformation({ bookingSession }: { bookingSession: BookingSession }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  })

  return (
    <section className="py-[var(--space-xl)] bg-gradient-to-b from-cream via-warm-sand/10 to-cream">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <span className="caption text-terracotta">Step 4 of 6</span>
            <h2 className="h2 text-dune">Your Information</h2>
          </div>

          <form onSubmit={handleSubmit} className="glass arch-full p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="caption text-dune/70">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl glass border border-sage/20 focus:border-sage focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="caption text-dune/70">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl glass border border-sage/20 focus:border-sage focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="caption text-dune/70">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl glass border border-sage/20 focus:border-sage focus:outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="caption text-dune/70">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl glass border border-sage/20 focus:border-sage focus:outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="caption text-dune/70">Special Requests (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl glass border border-sage/20 focus:border-sage focus:outline-none resize-none"
                placeholder="Any allergies, preferences, or special requests..."
              />
            </div>

            <button type="submit" className="btn btn-primary w-full">
              Continue to Review
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  )
}
```

#### Component 5: Booking Review (Your Styling)
```tsx
// src/components/booking/BookingReview.tsx
'use client'

import { motion } from 'framer-motion'

export function BookingReview({ booking }: { booking: BookingSession }) {
  return (
    <section className="py-[var(--space-xl)] bg-gradient-to-b from-cream via-warm-sand/10 to-cream">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <span className="caption text-terracotta">Step 5 of 6</span>
            <h2 className="h2 text-dune">Review Your Appointment</h2>
          </div>

          <div className="glass arch-full p-8 space-y-6">
            {/* Service */}
            <div className="flex items-center gap-4 pb-6 border-b border-sage/20">
              <Image
                src={booking.service.imageUrl}
                alt={booking.service.name}
                width={80}
                height={80}
                className="rounded-xl"
              />
              <div>
                <h3 className="h3 text-dune">{booking.service.name}</h3>
                <p className="caption text-terracotta">{booking.service.duration}</p>
              </div>
            </div>

            {/* Artist */}
            <div className="flex items-center gap-4 pb-6 border-b border-sage/20">
              <Image
                src={booking.artist.imageUrl}
                alt={booking.artist.name}
                width={80}
                height={80}
                className="rounded-full"
              />
              <div>
                <h3 className="h3 text-dune">{booking.artist.name}</h3>
                <p className="caption text-terracotta">{booking.artist.role}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="pb-6 border-b border-sage/20">
              <p className="caption text-dune/70 mb-2">Date & Time</p>
              <p className="text-xl font-light text-dune">
                {formatDate(booking.date)}, {formatTime(booking.time)}
              </p>
            </div>

            {/* Customer Info */}
            <div className="pb-6 border-b border-sage/20">
              <p className="caption text-dune/70 mb-2">Contact Information</p>
              <p className="text-dune">{booking.customer.firstName} {booking.customer.lastName}</p>
              <p className="text-dune/70">{booking.customer.email}</p>
              <p className="text-dune/70">{booking.customer.phone}</p>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between text-2xl">
              <span className="text-dune/70">Total</span>
              <span className="font-light text-sage">{booking.service.price}</span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleProceedToPayment}
              className="btn btn-primary w-full"
            >
              Proceed to Payment
            </button>

            <button
              onClick={() => router.back()}
              className="btn btn-secondary w-full"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

---

### Phase 3: Vagaro Widget Integration (Payment Step)

#### Styled Widget Wrapper
```tsx
// src/components/booking/VagaroPaymentWidget.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function VagaroPaymentWidget({ bookingSession }: { bookingSession: BookingSession }) {
  const [widgetUrl, setWidgetUrl] = useState('')

  useEffect(() => {
    // Generate pre-filled Vagaro widget URL
    async function prepareWidget() {
      const response = await fetch('/api/booking/prepare-widget', {
        method: 'POST',
        body: JSON.stringify(bookingSession)
      })

      const { widgetUrl } = await response.json()
      setWidgetUrl(widgetUrl)
    }

    prepareWidget()
  }, [bookingSession])

  return (
    <section className="py-[var(--space-xl)] bg-gradient-to-b from-cream via-warm-sand/10 to-cream">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <span className="caption text-terracotta">Step 6 of 6</span>
            <h2 className="h2 text-dune">Complete Your Booking</h2>
            <p className="body text-dune/70">Secure payment processed by Vagaro</p>
          </div>

          {/* Styled iframe container */}
          <div className="glass arch-full p-4 overflow-hidden">
            <iframe
              src={widgetUrl}
              className="w-full h-[600px] border-0"
              style={{
                colorScheme: 'light',
                // Pass your colors via URL params to Vagaro widget
              }}
              onLoad={handleWidgetLoad}
            />
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-dune/60">
            <span className="flex items-center gap-2">
              <LockIcon className="w-4 h-4" />
              Secure Payment
            </span>
            <span className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4" />
              PCI Compliant
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

#### Backend: Prepare Widget URL
```typescript
// src/app/api/booking/prepare-widget/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const bookingSession = await request.json()

  // Generate Vagaro widget URL with pre-filled data
  const widgetParams = new URLSearchParams({
    business_id: process.env.VAGARO_BUSINESS_ID!,
    service_id: bookingSession.service.vagaroId,
    employee_id: bookingSession.artist.vagaroId,
    date: bookingSession.date,
    time: bookingSession.time,
    customer_first_name: bookingSession.customer.firstName,
    customer_last_name: bookingSession.customer.lastName,
    customer_email: bookingSession.customer.email,
    customer_phone: bookingSession.customer.phone,
    // Your brand colors
    primary_color: 'rgb(161,151,129)', // sage
    secondary_color: 'rgb(205,168,158)', // dusty-rose
    // Return URL back to your site
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/review`
  })

  const widgetUrl = `https://www.vagaro.com/bookingwidget?${widgetParams.toString()}`

  return NextResponse.json({ widgetUrl })
}
```

---

### Phase 4: Success Flow (Back to Your Site)

```tsx
// src/app/booking/success/page.tsx
'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Calendar, Mail, Phone } from 'lucide-react'

export default function BookingSuccessPage() {
  const [appointment, setAppointment] = useState(null)

  useEffect(() => {
    // Fetch confirmed appointment from Vagaro webhook or API
    async function fetchAppointment() {
      const response = await fetch('/api/booking/latest')
      const data = await response.json()
      setAppointment(data)
    }

    fetchAppointment()
  }, [])

  return (
    <section className="min-h-screen py-[var(--space-xl)] bg-gradient-to-b from-cream via-warm-sand/10 to-cream flex items-center">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-sage/20"
          >
            <CheckCircle className="w-12 h-12 text-sage" />
          </motion.div>

          <div className="space-y-4">
            <h1 className="h1 text-dune">You're All Set!</h1>
            <p className="body-lg text-dune/70">
              Your appointment has been confirmed
            </p>
          </div>

          {/* Appointment Details */}
          {appointment && (
            <div className="glass arch-full p-8 space-y-6 text-left">
              <div className="pb-6 border-b border-sage/20">
                <p className="caption text-dune/70 mb-2">Service</p>
                <p className="text-xl text-dune">{appointment.service.name}</p>
              </div>

              <div className="pb-6 border-b border-sage/20">
                <p className="caption text-dune/70 mb-2">With</p>
                <p className="text-xl text-dune">{appointment.artist.name}</p>
              </div>

              <div>
                <p className="caption text-dune/70 mb-2">When</p>
                <p className="text-xl text-dune">
                  {formatDate(appointment.date)} at {formatTime(appointment.time)}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 pt-4">
            <button
              onClick={downloadCalendarFile}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Add to Calendar
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button className="btn btn-secondary flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" />
                Email Confirmation
              </button>

              <button className="btn btn-secondary flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Text Reminder
              </button>
            </div>
          </div>

          {/* What's Next */}
          <div className="glass rounded-2xl p-6 text-left space-y-4">
            <h3 className="h3 text-dune">What's Next?</h3>
            <ul className="space-y-3 text-dune/70">
              <li className="flex gap-3">
                <span className="text-sage">•</span>
                <span>You'll receive a confirmation email shortly</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sage">•</span>
                <span>We'll send a reminder 24 hours before your appointment</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sage">•</span>
                <span>Please arrive 5-10 minutes early</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => router.push('/')}
            className="btn btn-outline"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    </section>
  )
}
```

---

## Technical Implementation Plan

### Week 1: Setup & Data Sync
- [ ] Set up Vagaro API client
- [ ] Create sync tables in database
- [ ] Implement hourly sync job
- [ ] Map your services/team to Vagaro IDs
- [ ] Test API connections

### Week 2: Core Booking Components
- [ ] Build Artist Selection component
- [ ] Build Date/Time Selection component
- [ ] Build Customer Information form
- [ ] Build Booking Review component
- [ ] Implement booking session state management

### Week 3: API Integration
- [ ] Create `/api/booking/availability` endpoint
- [ ] Create `/api/booking/session` endpoints
- [ ] Implement real-time availability checks
- [ ] Add loading states and error handling

### Week 4: Vagaro Widget Integration
- [ ] Set up Vagaro widget with pre-filled data
- [ ] Style widget iframe to match design
- [ ] Implement widget callbacks
- [ ] Build success/failure flows

### Week 5: Webhooks & Real-time Updates
- [ ] Set up webhook endpoint
- [ ] Handle appointment webhooks
- [ ] Update booking confirmations
- [ ] Send custom notifications

### Week 6: Testing & Polish
- [ ] End-to-end booking flow testing
- [ ] Mobile responsiveness
- [ ] Error scenarios
- [ ] Performance optimization

---

## Booking Widget Limitations & Workarounds

### What the Vagaro Widget CAN'T Do:
❌ Full custom styling (limited CSS overrides)
❌ Remove Vagaro branding entirely
❌ Custom animations/transitions
❌ Complete UI restructuring

### What You CAN Do to Minimize Widget Exposure:

#### 1. Pre-fill Everything
```typescript
// Minimize steps in widget by pre-filling all data
const widgetConfig = {
  service_id: booking.service.vagaroId,
  employee_id: booking.artist.vagaroId,
  date: booking.date,
  time: booking.time,
  // Customer info
  first_name: booking.customer.firstName,
  last_name: booking.customer.lastName,
  email: booking.customer.email,
  phone: booking.customer.phone,
  // Jump straight to payment
  skip_selection: true,
  skip_customer_form: true,
  // Styling
  primary_color: '#A19781', // sage
  hide_header: true,
  hide_footer: true,
  compact_mode: true
}
```

#### 2. Wrap in Your UI
```tsx
// Make widget look like part of your site
<div className="glass arch-full p-8">
  <div className="mb-6">
    <h3 className="h3 text-dune">Secure Payment</h3>
    <p className="caption text-dune/70">Powered by Vagaro</p>
  </div>

  <iframe src={widgetUrl} className="w-full rounded-xl" />

  <div className="mt-6 flex items-center justify-center gap-4">
    {/* Your trust badges */}
  </div>
</div>
```

#### 3. Use Booking Widget Events
```typescript
// Track user progress through widget
window.addEventListener('message', (event) => {
  if (event.data.type === 'vagaro-widget-event') {
    switch (event.data.event) {
      case 'payment_started':
        trackEvent('payment_initiated')
        break
      case 'booking_completed':
        // Redirect to your success page immediately
        router.push('/booking/success')
        break
      case 'booking_cancelled':
        router.push('/booking/review')
        break
    }
  }
})
```

---

## Reverse Booking Flow (Provider → Customer)

Your site also supports **provider-first selection**:

### Flow 1: Service → Provider
1. User selects service (your quiz)
2. Show providers who offer that service
3. Show availability for selected provider
4. Complete booking

### Flow 2: Provider → Service
1. User clicks artist in team section
2. Show all services that artist offers
3. Show availability
4. Complete booking

Both flows are supported with same components!

```tsx
// Team section - add booking button
<TeamMemberCard member={artist}>
  <button
    onClick={() => startBookingWithArtist(artist.id)}
    className="btn btn-primary"
  >
    Book with {artist.name}
  </button>
</TeamMemberCard>
```

---

## Final Recommendation

### Go with Hybrid Approach (Option 1)

**Build:**
1. ✅ Custom service selection (already have)
2. ✅ Custom artist selection
3. ✅ Custom date/time picker
4. ✅ Custom customer form
5. ✅ Custom review page
6. ⚠️ Minimal Vagaro widget (payment only)
7. ✅ Custom success page

**Result:**
- 90% stays on your site with your design
- 10% quick handoff to Vagaro for payment
- Seamless experience for customers
- PCI-compliant and secure
- Full control over conversion optimization

**Estimated Development Time:** 4-6 weeks

**Estimated Cost:** If outsourced, $15k-25k. DIY with your team: 4-6 weeks of dedicated dev time.

---

## Questions to Ask Vagaro

Before implementation, confirm with Vagaro:

1. Can we pre-fill widget with all booking data and skip directly to payment?
2. What CSS customization is available for the widget?
3. Can we remove/customize Vagaro branding in the widget?
4. What widget events are available for tracking?
5. Can we use custom return URLs after booking completion?
6. What's the rate limit for availability API calls?
7. Do webhooks fire in real-time or is there delay?

---

## Next Steps

Want me to build any of these components for you? I can start with:

1. Artist Selection component
2. Date/Time picker with live availability
3. API routes for booking session management
4. Vagaro API client implementation
5. Webhook handler setup

Let me know which part you want to tackle first!
