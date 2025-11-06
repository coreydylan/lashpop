# Services

## Overview

The Services API provides access to service offerings, including details about treatments, procedures, pricing, and availability at different locations.

## Endpoints

### Retrieve Services

**Method:** `POST`

**Purpose:** Display available service offerings with pricing, duration, and description information.

#### Request - All Services

```http
POST /api/services/retrieve
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{}
```

#### Request - Specific Service

```json
{
  "service_id": "service_123"
}
```

#### Request - Services by Location

```json
{
  "location_id": "loc_001"
}
```

#### Request - Services by Category

```json
{
  "category": "haircare"
}
```

#### Response

```json
{
  "services": [
    {
      "service_id": "service_123",
      "name": "Haircut and Style",
      "category": "haircare",
      "description": "Professional haircut with wash and style. Includes consultation for your perfect look.",
      "duration_minutes": 60,
      "price": 75.00,
      "currency": "USD",
      "locations": ["loc_001", "loc_002"],
      "employees": ["emp_12345", "emp_67890"],
      "image_url": "https://example.com/images/haircut.jpg",
      "requires_consultation": false,
      "deposit_required": false,
      "booking_buffer_minutes": 15,
      "cancellation_policy": "24 hours notice required",
      "status": "active",
      "created_at": "2023-01-15T10:00:00Z"
    },
    {
      "service_id": "service_456",
      "name": "Color Treatment",
      "category": "haircare",
      "description": "Full color service including consultation, application, and style. Multiple color options available.",
      "duration_minutes": 120,
      "price": 150.00,
      "currency": "USD",
      "price_range": {
        "min": 150.00,
        "max": 250.00
      },
      "locations": ["loc_001", "loc_002"],
      "employees": ["emp_12345"],
      "image_url": "https://example.com/images/color.jpg",
      "requires_consultation": true,
      "deposit_required": true,
      "deposit_amount": 50.00,
      "booking_buffer_minutes": 30,
      "cancellation_policy": "48 hours notice required, deposit non-refundable",
      "prerequisites": ["patch_test_required"],
      "status": "active",
      "created_at": "2023-01-15T10:00:00Z"
    },
    {
      "service_id": "service_789",
      "name": "Facial - Express",
      "category": "skincare",
      "description": "Quick 30-minute facial perfect for busy schedules. Cleansing, exfoliation, and moisturizing.",
      "duration_minutes": 30,
      "price": 60.00,
      "currency": "USD",
      "locations": ["loc_001"],
      "employees": ["emp_11111"],
      "image_url": "https://example.com/images/facial.jpg",
      "requires_consultation": false,
      "deposit_required": false,
      "booking_buffer_minutes": 10,
      "cancellation_policy": "4 hours notice required",
      "add_ons": [
        {
          "name": "LED Light Therapy",
          "duration_minutes": 15,
          "price": 25.00
        }
      ],
      "status": "active",
      "created_at": "2023-06-10T10:00:00Z"
    }
  ]
}
```

---

## Service Data Fields

### Basic Information
- `service_id` - Unique service identifier
- `name` - Service display name
- `category` - Service category/type
- `description` - Detailed service description
- `image_url` - Service image for display

### Pricing & Duration
- `price` - Base price
- `price_range` - Min/max price range (for variable pricing)
- `currency` - Currency code (ISO 4217)
- `duration_minutes` - Service duration
- `deposit_required` - Whether deposit is needed
- `deposit_amount` - Deposit amount if required

### Availability
- `locations` - Array of location IDs offering this service
- `employees` - Array of employee IDs who can perform service
- `status` - Service status (active, inactive, seasonal)

### Booking Requirements
- `requires_consultation` - Consultation needed before booking
- `prerequisites` - Required conditions (e.g., patch test)
- `booking_buffer_minutes` - Buffer time after service
- `cancellation_policy` - Cancellation terms

### Enhancements
- `add_ons` - Optional service additions
- `packages` - Related service packages

---

## Service Categories

Common service categories in beauty, fitness, and wellness:

### Beauty Services
- `haircare` - Cuts, styling, coloring
- `skincare` - Facials, treatments
- `nails` - Manicures, pedicures
- `makeup` - Application, lessons
- `waxing` - Hair removal services
- `lashes` - Extensions, lifts, tinting

### Wellness Services
- `massage` - Various massage types
- `spa` - Body treatments, wraps
- `wellness` - Holistic treatments

### Fitness Services
- `personal_training` - 1-on-1 training
- `group_classes` - Group fitness
- `yoga` - Yoga classes
- `pilates` - Pilates sessions

---

## Common Use Cases

### Service Catalog Display

```javascript
async function getServicesByCategory() {
  const { services } = await retrieveServices();

  const grouped = services
    .filter(s => s.status === 'active')
    .reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {});

  return grouped;
}
```

### Price Range Display

```javascript
function formatServicePrice(service) {
  if (service.price_range) {
    return `$${service.price_range.min} - $${service.price_range.max}`;
  }
  return `$${service.price}`;
}
```

### Service Package Builder

```javascript
async function createServicePackage(serviceIds) {
  const { services } = await retrieveServices();

  const selectedServices = services.filter(s =>
    serviceIds.includes(s.service_id)
  );

  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + s.duration_minutes + (s.booking_buffer_minutes || 0),
    0
  );

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Apply package discount
  const packageDiscount = 0.1; // 10% discount
  const discountedPrice = totalPrice * (1 - packageDiscount);

  return {
    services: selectedServices,
    duration_minutes: totalDuration,
    original_price: totalPrice,
    package_price: discountedPrice,
    savings: totalPrice - discountedPrice
  };
}
```

---

## Service Booking Validation

### Pre-Booking Checks

```javascript
async function validateServiceBooking(serviceId, locationId, employeeId) {
  const { services } = await retrieveServices({ service_id: serviceId });
  const service = services[0];

  const validations = {
    service_active: service.status === 'active',
    location_offers_service: service.locations.includes(locationId),
    employee_can_perform: service.employees.includes(employeeId),
    consultation_needed: service.requires_consultation,
    deposit_required: service.deposit_required,
    deposit_amount: service.deposit_amount || 0,
    prerequisites: service.prerequisites || []
  };

  return validations;
}
```

### Duration Calculation

```javascript
function calculateAppointmentDuration(service, addOns = []) {
  let totalDuration = service.duration_minutes;

  // Add buffer time
  totalDuration += service.booking_buffer_minutes || 0;

  // Add add-ons
  if (addOns.length > 0) {
    const addOnDuration = addOns.reduce(
      (sum, addOn) => sum + addOn.duration_minutes,
      0
    );
    totalDuration += addOnDuration;
  }

  return totalDuration;
}
```

---

## Integration with Other APIs

### Complete Service Booking Flow

```javascript
async function bookServiceWithValidation({
  serviceId,
  locationId,
  employeeId,
  customerId,
  date,
  timeSlot
}) {
  // 1. Get service details
  const { services } = await retrieveServices({ service_id: serviceId });
  const service = services[0];

  // 2. Validate booking requirements
  const validation = await validateServiceBooking(
    serviceId,
    locationId,
    employeeId
  );

  if (!validation.service_active) {
    throw new Error('Service is not currently available');
  }

  if (!validation.location_offers_service) {
    throw new Error('Service not available at this location');
  }

  if (!validation.employee_can_perform) {
    throw new Error('Employee cannot perform this service');
  }

  // 3. Check consultation requirement
  if (validation.consultation_needed) {
    // Check if customer has had consultation
    console.log('Consultation required before booking');
  }

  // 4. Calculate duration with buffer
  const duration = calculateAppointmentDuration(service);

  // 5. Search availability
  const availability = await searchAvailability({
    location_id: locationId,
    service_id: serviceId,
    employee_id: employeeId,
    date: date,
    duration_minutes: duration
  });

  // 6. Verify slot is available
  const slotAvailable = availability.available_slots.some(
    slot => slot.start_time === timeSlot
  );

  if (!slotAvailable) {
    throw new Error('Selected time slot is not available');
  }

  // 7. Handle deposit if required
  if (validation.deposit_required) {
    console.log(`Deposit required: $${validation.deposit_amount}`);
    // Process deposit payment
  }

  // 8. Create appointment (via admin interface)
  return {
    success: true,
    service: service.name,
    duration: duration,
    price: service.price,
    deposit_required: validation.deposit_required
  };
}
```

---

## Error Handling

### 404 Not Found

```json
{
  "error": "service_not_found",
  "message": "Service with ID service_123 does not exist"
}
```

### 400 Bad Request

```json
{
  "error": "invalid_category",
  "message": "Service category 'invalid' is not recognized"
}
```

---

## Best Practices

### Service Management

1. **Clear Descriptions**
   - Include what's included in the service
   - Specify any exclusions
   - List prerequisites clearly

2. **Accurate Pricing**
   - Use price ranges for variable services
   - Clearly state when consultation affects price
   - Include all fees in pricing

3. **Realistic Duration**
   - Include buffer time for cleanup/setup
   - Account for consultation time
   - Consider back-to-back booking feasibility

### Service Display

1. **Categorization**
   - Use consistent category names
   - Group related services
   - Enable easy filtering

2. **Visual Presentation**
   - Include high-quality service images
   - Show before/after photos when appropriate
   - Display pricing prominently

3. **Add-Ons and Packages**
   - Suggest relevant add-ons
   - Create package deals
   - Highlight savings

---

## Related Sections

- [Appointments](./04-appointments.md) - Service booking
- [Business Locations](./05-locations.md) - Service availability by location
- [Employees](./02-employees.md) - Service providers
- [Booking Widget Events](./10-booking-widget-events.md) - Service selection tracking
