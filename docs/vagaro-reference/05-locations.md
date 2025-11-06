# Business Locations

## Overview

The Business Locations API enables multi-location management, allowing you to retrieve and update location details for businesses operating across multiple sites.

## Endpoints

### Retrieve Business Locations

**Method:** `POST`

**Purpose:** Fetch information about all business locations or a specific location.

#### Request - All Locations

```http
POST /api/locations/retrieve
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{}
```

#### Request - Specific Location

```json
{
  "location_id": "loc_001"
}
```

#### Response

```json
{
  "locations": [
    {
      "location_id": "loc_001",
      "name": "Downtown Salon",
      "address": {
        "street": "456 Market Street",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94102",
        "country": "US"
      },
      "phone": "+14155551234",
      "email": "downtown@example.com",
      "timezone": "America/Los_Angeles",
      "business_hours": {
        "monday": {
          "open": "09:00",
          "close": "18:00"
        },
        "tuesday": {
          "open": "09:00",
          "close": "18:00"
        },
        "wednesday": {
          "open": "09:00",
          "close": "18:00"
        },
        "thursday": {
          "open": "09:00",
          "close": "20:00"
        },
        "friday": {
          "open": "09:00",
          "close": "20:00"
        },
        "saturday": {
          "open": "10:00",
          "close": "17:00"
        },
        "sunday": {
          "open": "10:00",
          "close": "16:00"
        }
      },
      "services": ["service_123", "service_456", "service_789"],
      "employees": ["emp_12345", "emp_67890"],
      "status": "active",
      "created_at": "2023-01-15T10:00:00Z"
    },
    {
      "location_id": "loc_002",
      "name": "Westside Spa",
      "address": {
        "street": "789 Valencia Street",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94110",
        "country": "US"
      },
      "phone": "+14155559876",
      "email": "westside@example.com",
      "timezone": "America/Los_Angeles",
      "business_hours": {
        "monday": {
          "open": "10:00",
          "close": "19:00"
        },
        "tuesday": {
          "open": "10:00",
          "close": "19:00"
        },
        "wednesday": {
          "open": "10:00",
          "close": "19:00"
        },
        "thursday": {
          "open": "10:00",
          "close": "19:00"
        },
        "friday": {
          "open": "10:00",
          "close": "19:00"
        },
        "saturday": {
          "open": "09:00",
          "close": "18:00"
        },
        "sunday": null
      },
      "services": ["service_123", "service_456"],
      "employees": ["emp_11111"],
      "status": "active",
      "created_at": "2024-03-20T10:00:00Z"
    }
  ]
}
```

---

### Update Business Location

**Method:** `PUT`

**Purpose:** Modify location details such as contact information, hours, or address.

#### Request

```http
PUT /api/locations/update
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "location_id": "loc_001",
  "name": "Downtown Salon & Spa",
  "phone": "+14155551234",
  "email": "downtown@example.com",
  "business_hours": {
    "monday": {
      "open": "09:00",
      "close": "19:00"
    },
    "tuesday": {
      "open": "09:00",
      "close": "19:00"
    },
    "wednesday": {
      "open": "09:00",
      "close": "19:00"
    },
    "thursday": {
      "open": "09:00",
      "close": "20:00"
    },
    "friday": {
      "open": "09:00",
      "close": "20:00"
    },
    "saturday": {
      "open": "10:00",
      "close": "18:00"
    },
    "sunday": {
      "open": "10:00",
      "close": "17:00"
    }
  }
}
```

#### Response

```json
{
  "success": true,
  "location_id": "loc_001",
  "updated_at": "2025-11-06T10:30:00Z"
}
```

---

## Location Data Fields

### Core Information
- `location_id` - Unique location identifier
- `name` - Location display name
- `address` - Complete address object
- `phone` - Primary contact phone number
- `email` - Location email address
- `timezone` - IANA timezone identifier

### Operational Data
- `business_hours` - Weekly operating schedule
- `services` - Array of service IDs available at location
- `employees` - Array of employee IDs assigned to location
- `status` - Location status (active, inactive, closed)

### Metadata
- `created_at` - Location creation timestamp
- `updated_at` - Last modification timestamp

---

## Common Use Cases

### Multi-Location Service Filtering

```javascript
async function getAvailableLocationsForService(serviceId) {
  const { locations } = await retrieveLocations();

  return locations.filter(location =>
    location.services.includes(serviceId) && location.status === 'active'
  );
}
```

### Location Business Hours Check

```javascript
function isLocationOpen(location, dateTime) {
  const day = dateTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const time = dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const hours = location.business_hours[day];

  if (!hours) return false; // Closed this day

  return time >= hours.open && time < hours.close;
}
```

### Nearest Location Finder

```javascript
async function findNearestLocation(customerLat, customerLng) {
  const { locations } = await retrieveLocations();

  const activeLocations = locations.filter(loc => loc.status === 'active');

  // Calculate distance (simplified - use proper geolocation library)
  const withDistances = activeLocations.map(location => ({
    ...location,
    distance: calculateDistance(
      customerLat,
      customerLng,
      location.address.latitude,
      location.address.longitude
    )
  }));

  return withDistances.sort((a, b) => a.distance - b.distance)[0];
}
```

---

## Multi-Location Management

### Location Hierarchy

```
Business Account
├── Location 1 (Downtown)
│   ├── Employees: [emp_001, emp_002]
│   └── Services: [service_A, service_B, service_C]
├── Location 2 (Westside)
│   ├── Employees: [emp_003]
│   └── Services: [service_A, service_B]
└── Location 3 (Airport)
    ├── Employees: [emp_001, emp_004]
    └── Services: [service_A]
```

### Cross-Location Operations

```javascript
async function syncServiceAcrossLocations(serviceId) {
  const { locations } = await retrieveLocations();

  const updates = locations
    .filter(loc => loc.status === 'active')
    .map(loc => {
      if (!loc.services.includes(serviceId)) {
        // Add service to location (via admin interface)
        console.log(`Adding service ${serviceId} to ${loc.name}`);
      }
    });

  await Promise.all(updates);
}
```

---

## Integration with Other APIs

### Location-Based Availability Search

```javascript
async function searchAvailabilityAcrossLocations({
  serviceId,
  date,
  preferredLocationId
}) {
  const { locations } = await retrieveLocations();

  // Check preferred location first
  if (preferredLocationId) {
    const availability = await searchAvailability({
      location_id: preferredLocationId,
      service_id: serviceId,
      date: date
    });

    if (availability.available_slots.length > 0) {
      return {
        location_id: preferredLocationId,
        slots: availability.available_slots
      };
    }
  }

  // Check other locations
  const availableLocations = locations.filter(
    loc =>
      loc.services.includes(serviceId) &&
      loc.status === 'active' &&
      loc.location_id !== preferredLocationId
  );

  for (const location of availableLocations) {
    const availability = await searchAvailability({
      location_id: location.location_id,
      service_id: serviceId,
      date: date
    });

    if (availability.available_slots.length > 0) {
      return {
        location_id: location.location_id,
        location_name: location.name,
        slots: availability.available_slots
      };
    }
  }

  return null; // No availability at any location
}
```

---

## Error Handling

### 404 Not Found

```json
{
  "error": "location_not_found",
  "message": "Location with ID loc_001 does not exist"
}
```

### 400 Bad Request

```json
{
  "error": "invalid_business_hours",
  "message": "Opening time must be before closing time"
}
```

### 403 Forbidden

```json
{
  "error": "location_access_denied",
  "message": "You do not have permission to modify this location"
}
```

---

## Best Practices

### Location Data Management

1. **Keep Information Current**
   - Update business hours for holidays
   - Maintain accurate contact information
   - Verify address details regularly

2. **Timezone Handling**
   - Always use IANA timezone identifiers
   - Convert appointment times to location timezone
   - Display times in customer's local timezone

3. **Status Management**
   - Use status flags for temporary closures
   - Don't delete locations with historical data
   - Mark as inactive instead of deletion

### Multi-Location Strategy

1. **Service Consistency**
   - Maintain consistent service offerings
   - Standardize pricing across locations (or document differences)
   - Sync updates across all locations

2. **Employee Management**
   - Track primary location for each employee
   - Handle cross-location assignments carefully
   - Avoid scheduling conflicts

3. **Customer Experience**
   - Show nearest location by default
   - Allow location switching during booking
   - Display unique features per location

---

## Related Sections

- [Employees](./02-employees.md) - Employee assignment to locations
- [Services](./06-services.md) - Service availability per location
- [Appointments](./04-appointments.md) - Location-based booking
- [Webhooks - Location Events](./09-webhooks.md#business-location-webhooks) - Location change notifications
