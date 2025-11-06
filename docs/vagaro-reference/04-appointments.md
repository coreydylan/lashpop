# Appointments

## Overview

The Appointments API handles booking management, availability search, and appointment details including status, timing, and service providers.

## Endpoints

### Search Appointment Availability

**Method:** `POST`

**Purpose:** Identify open time slots for booking based on service, location, and employee availability.

#### Request

```http
POST /api/appointments/availability
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "location_id": "loc_001",
  "service_id": "service_123",
  "employee_id": "emp_12345",
  "date": "2025-11-15",
  "duration_minutes": 60
}
```

#### Optional Parameters

- `employee_id` - Search for specific employee (omit for any available)
- `start_time` - Minimum time of day (e.g., "09:00")
- `end_time` - Maximum time of day (e.g., "17:00")

#### Response

```json
{
  "date": "2025-11-15",
  "location_id": "loc_001",
  "service_id": "service_123",
  "available_slots": [
    {
      "start_time": "09:00",
      "end_time": "10:00",
      "employee_id": "emp_12345",
      "employee_name": "Jane Smith"
    },
    {
      "start_time": "10:00",
      "end_time": "11:00",
      "employee_id": "emp_12345",
      "employee_name": "Jane Smith"
    },
    {
      "start_time": "11:00",
      "end_time": "12:00",
      "employee_id": "emp_12345",
      "employee_name": "Jane Smith"
    },
    {
      "start_time": "14:00",
      "end_time": "15:00",
      "employee_id": "emp_67890",
      "employee_name": "Mike Johnson"
    }
  ]
}
```

---

### Retrieve Appointment

**Method:** `POST`

**Purpose:** Get detailed information about a specific appointment including status, customer, service, and provider.

#### Request

```http
POST /api/appointments/retrieve
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "appointment_id": "appt_98765"
}
```

#### Response

```json
{
  "appointment_id": "appt_98765",
  "customer_id": "cust_67890",
  "customer_name": "Sarah Johnson",
  "customer_email": "sarah.johnson@example.com",
  "customer_phone": "+1234567890",
  "location_id": "loc_001",
  "location_name": "Downtown Salon",
  "employee_id": "emp_12345",
  "employee_name": "Jane Smith",
  "service_id": "service_123",
  "service_name": "Haircut and Style",
  "start_time": "2025-11-15T14:00:00Z",
  "end_time": "2025-11-15T15:00:00Z",
  "duration_minutes": 60,
  "status": "confirmed",
  "price": 75.00,
  "currency": "USD",
  "notes": "Customer prefers layered cut",
  "created_at": "2025-11-01T10:30:00Z",
  "updated_at": "2025-11-01T10:30:00Z"
}
```

---

## Appointment Status Values

| Status | Description |
|--------|-------------|
| `pending` | Awaiting confirmation |
| `confirmed` | Appointment confirmed |
| `checked_in` | Customer has arrived |
| `in_progress` | Service currently being provided |
| `completed` | Service finished |
| `cancelled` | Cancelled by customer or business |
| `no_show` | Customer did not arrive |

---

## Common Use Cases

### Find Next Available Slot

```javascript
async function findNextAvailable(serviceId, locationId, startDate) {
  let currentDate = new Date(startDate);
  const maxDaysToCheck = 14;

  for (let i = 0; i < maxDaysToCheck; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];

    const availability = await searchAvailability({
      location_id: locationId,
      service_id: serviceId,
      date: dateStr
    });

    if (availability.available_slots.length > 0) {
      return availability.available_slots[0];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return null; // No availability found
}
```

### Check Appointment Status

```javascript
async function isAppointmentUpcoming(appointmentId) {
  const appointment = await retrieveAppointment({
    appointment_id: appointmentId
  });

  const now = new Date();
  const appointmentTime = new Date(appointment.start_time);

  return appointment.status === 'confirmed' && appointmentTime > now;
}
```

### Multi-Service Booking Availability

```javascript
async function findAvailabilityForMultipleServices(
  locationId,
  serviceIds,
  date
) {
  const availabilityPromises = serviceIds.map(serviceId =>
    searchAvailability({
      location_id: locationId,
      service_id: serviceId,
      date: date
    })
  );

  const results = await Promise.all(availabilityPromises);

  return serviceIds.map((serviceId, index) => ({
    service_id: serviceId,
    available_slots: results[index].available_slots
  }));
}
```

---

## Appointment Workflow

### Standard Booking Flow

1. **Search Availability**
   - Customer selects service
   - System searches available slots
   - Display options to customer

2. **Create Appointment**
   - Customer selects preferred slot
   - Collect customer information
   - Create appointment (via admin interface)

3. **Confirmation**
   - Send confirmation email/SMS
   - Add to customer's calendar
   - Update employee schedule

4. **Reminders**
   - Send reminder 24 hours before
   - Send reminder 2 hours before
   - Check-in notification

5. **Service Delivery**
   - Mark as checked_in when customer arrives
   - Mark as in_progress during service
   - Mark as completed when done

6. **Follow-up**
   - Request feedback/review
   - Suggest next appointment
   - Apply loyalty rewards

---

## Integration with Other APIs

### Complete Booking Example

```javascript
async function completeBooking({
  customerId,
  locationId,
  serviceId,
  employeeId,
  date,
  timeSlot
}) {
  // 1. Verify customer exists
  const customer = await retrieveCustomer({ customer_id: customerId });

  // 2. Confirm slot still available
  const availability = await searchAvailability({
    location_id: locationId,
    service_id: serviceId,
    employee_id: employeeId,
    date: date
  });

  const slotAvailable = availability.available_slots.some(
    slot => slot.start_time === timeSlot
  );

  if (!slotAvailable) {
    throw new Error('Time slot no longer available');
  }

  // 3. Create appointment (via admin interface)
  console.log('Create appointment:', {
    customer,
    location: locationId,
    service: serviceId,
    employee: employeeId,
    time: timeSlot
  });

  // 4. Send confirmation (via webhook or admin interface)

  return { success: true };
}
```

---

## Error Handling

### 404 Not Found

```json
{
  "error": "appointment_not_found",
  "message": "Appointment with ID appt_98765 does not exist"
}
```

### 400 Bad Request

```json
{
  "error": "invalid_date",
  "message": "Date must be in the future"
}
```

### 409 Conflict

```json
{
  "error": "time_slot_unavailable",
  "message": "The requested time slot is no longer available"
}
```

---

## Best Practices

### Availability Search

1. **Cache Results**
   - Cache availability for 5-10 minutes
   - Refresh when customer selects slot
   - Show "checking availability" when refreshing

2. **User Experience**
   - Show multiple days at once
   - Highlight popular time slots
   - Indicate limited availability

3. **Performance**
   - Limit date range searches
   - Use employee_id when known
   - Batch requests for multiple services

### Booking Management

1. **Double-Booking Prevention**
   - Always verify availability before creating
   - Use optimistic locking if supported
   - Handle race conditions gracefully

2. **Status Updates**
   - Update status in real-time
   - Use webhooks for notifications
   - Sync with calendar systems

3. **Customer Communication**
   - Send immediate confirmation
   - Provide calendar file (.ics)
   - Include cancellation/reschedule links

---

## Related Sections

- [Customers](./03-customers.md) - Customer information for bookings
- [Employees](./02-employees.md) - Service provider availability
- [Services](./06-services.md) - Service details and pricing
- [Business Locations](./05-locations.md) - Location information
- [Webhooks - Appointment Events](./09-webhooks.md#appointment-webhooks) - Real-time booking notifications
