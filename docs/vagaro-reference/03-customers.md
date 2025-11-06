# Customer Management

## Overview

The Customer API provides access to customer profiles, contact information, and account management capabilities.

## Endpoints

### Retrieve Customer

**Method:** `POST`

**Purpose:** Access customer contact details, appointment history, and profile information.

#### Request

```http
POST /api/customers/retrieve
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "customer_id": "cust_67890"
}
```

#### Alternative Search

Search by email or phone:

```json
{
  "email": "customer@example.com"
}
```

or

```json
{
  "phone": "+1234567890"
}
```

#### Response

```json
{
  "customer_id": "cust_67890",
  "first_name": "Sarah",
  "last_name": "Johnson",
  "email": "sarah.johnson@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-05-15",
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94102",
    "country": "US"
  },
  "created_at": "2023-06-15T10:00:00Z",
  "last_visit": "2025-10-20T14:30:00Z",
  "total_appointments": 15,
  "preferences": {
    "email_notifications": true,
    "sms_notifications": true,
    "marketing_emails": false
  },
  "notes": "Prefers morning appointments",
  "status": "active"
}
```

---

### Delete Customer

**Method:** `POST`

**Purpose:** Remove a customer record from the system.

#### Request

```http
POST /api/customers/delete
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "customer_id": "cust_67890"
}
```

#### Response

```json
{
  "success": true,
  "customer_id": "cust_67890",
  "deleted_at": "2025-11-06T10:30:00Z"
}
```

---

## Customer Data Fields

### Required Fields
- `first_name` - Customer's first name
- `last_name` - Customer's last name
- `email` or `phone` - At least one contact method required

### Optional Fields
- `date_of_birth` - For age verification or birthday promotions
- `address` - Full address information
- `preferences` - Communication preferences
- `notes` - Internal notes about customer preferences
- `custom_fields` - Business-specific custom data

### Computed Fields
- `total_appointments` - Lifetime appointment count
- `last_visit` - Most recent appointment date
- `created_at` - Account creation timestamp
- `status` - Account status (active, inactive, blocked)

---

## Common Use Cases

### Customer Lookup

```javascript
// Lookup by ID
const customer = await retrieveCustomer({
  customer_id: 'cust_67890'
});

// Lookup by email
const customer = await retrieveCustomer({
  email: 'sarah.johnson@example.com'
});

// Lookup by phone
const customer = await retrieveCustomer({
  phone: '+1234567890'
});
```

### Customer Profile Display

```javascript
const customer = await retrieveCustomer({ customer_id: 'cust_67890' });

console.log(`${customer.first_name} ${customer.last_name}`);
console.log(`Contact: ${customer.email}, ${customer.phone}`);
console.log(`Total Visits: ${customer.total_appointments}`);
console.log(`Last Visit: ${customer.last_visit}`);
```

### Customer Lifecycle

1. **Creation** - Customers typically created during first booking
2. **Profile Updates** - Via admin interface or customer portal
3. **Retrieval** - Access customer data for appointments or marketing
4. **Deletion** - GDPR/privacy compliance or customer request

---

## Privacy & Compliance

### GDPR Considerations

1. **Right to Access** - Use Retrieve Customer endpoint
2. **Right to Deletion** - Use Delete Customer endpoint
3. **Data Portability** - Export customer data on request
4. **Consent Management** - Track marketing preferences

### Data Retention

- Customer data is permanently deleted when using Delete endpoint
- Ensure compliance with local data retention laws
- Maintain audit logs for deleted customers

### Best Practices

1. **Obtain Consent**
   - Clear opt-in for marketing communications
   - Separate consent for different communication types
   - Document consent timestamp and method

2. **Data Minimization**
   - Only collect necessary information
   - Regularly review and purge inactive accounts
   - Use custom_fields sparingly

3. **Security**
   - Never expose customer data in logs
   - Encrypt sensitive information at rest
   - Use secure connections (HTTPS) for all API calls

---

## Error Handling

### 404 Not Found

```json
{
  "error": "customer_not_found",
  "message": "No customer found with the provided identifier"
}
```

### 400 Bad Request

```json
{
  "error": "invalid_request",
  "message": "Must provide customer_id, email, or phone"
}
```

### 409 Conflict

```json
{
  "error": "customer_has_future_appointments",
  "message": "Cannot delete customer with upcoming appointments"
}
```

---

## Integration Examples

### Pre-Appointment Customer Check

```javascript
async function getOrCreateCustomer(email, phone, firstName, lastName) {
  try {
    // Try to find existing customer
    const customer = await retrieveCustomer({ email });
    return customer;
  } catch (error) {
    if (error.code === 'customer_not_found') {
      // Create new customer via admin interface
      console.log('New customer - create account');
      return null;
    }
    throw error;
  }
}
```

### Customer Data Export

```javascript
async function exportCustomerData(customerId) {
  const customer = await retrieveCustomer({ customer_id: customerId });

  return {
    personal_info: {
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      date_of_birth: customer.date_of_birth
    },
    account_info: {
      created_at: customer.created_at,
      total_appointments: customer.total_appointments,
      last_visit: customer.last_visit
    },
    preferences: customer.preferences
  };
}
```

---

## Related Sections

- [Appointments](./04-appointments.md) - Customer booking management
- [Webhooks - Customer Events](./09-webhooks.md#customer-webhooks) - Real-time customer updates
- [Booking Widget Events](./10-booking-widget-events.md) - Customer booking interactions
