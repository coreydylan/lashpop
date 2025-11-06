# Webhooks

## Overview

Vagaro webhooks provide real-time event notifications for appointments, customers, employees, transactions, form responses, and business locations. Configure webhook endpoints to receive automatic updates when events occur in your system.

## Webhook Categories

### Available Event Types

1. **[Appointments](#appointment-webhooks)** - Booking and modification notifications
2. **[Customers](#customer-webhooks)** - New customers and profile changes
3. **[Employees](#employee-webhooks)** - Employee creation and updates
4. **[Transactions](#transaction-webhooks)** - Payment processing notifications
5. **[Form Responses](#form-response-webhooks)** - Form submission data
6. **[Business Locations](#business-location-webhooks)** - Location changes

---

## Getting Started

### 1. Configure Webhook Endpoint

Set up an HTTPS endpoint to receive webhook events:

```javascript
// Express.js example
app.post('/webhooks/vagaro', express.json(), async (req, res) => {
  const event = req.body;

  try {
    await handleWebhookEvent(event);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

### 2. Register Webhook URL

Register your endpoint with Vagaro (typically via admin interface):

- Webhook URL: `https://your-domain.com/webhooks/vagaro`
- Events: Select which event types to receive
- Secret: Save webhook signing secret for verification

### 3. Verify Webhook Signatures

Always verify webhook authenticity:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Appointment Webhooks

### Events
- `appointment.created` - New appointment booked
- `appointment.updated` - Appointment details changed
- `appointment.cancelled` - Appointment cancelled
- `appointment.completed` - Service completed
- `appointment.no_show` - Customer did not arrive

### Payload Example

```json
{
  "event_type": "appointment.created",
  "event_id": "evt_abc123",
  "timestamp": "2025-11-06T10:30:00Z",
  "data": {
    "appointment_id": "appt_98765",
    "customer": {
      "customer_id": "cust_67890",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "email": "sarah.johnson@example.com",
      "phone": "+1234567890"
    },
    "location": {
      "location_id": "loc_001",
      "name": "Downtown Salon",
      "timezone": "America/Los_Angeles"
    },
    "employee": {
      "employee_id": "emp_12345",
      "first_name": "Jane",
      "last_name": "Smith"
    },
    "service": {
      "service_id": "service_123",
      "name": "Haircut and Style",
      "duration_minutes": 60
    },
    "start_time": "2025-11-15T14:00:00Z",
    "end_time": "2025-11-15T15:00:00Z",
    "status": "confirmed",
    "price": 75.00,
    "currency": "USD",
    "notes": "Customer prefers layered cut"
  }
}
```

### Use Cases

```javascript
async function handleAppointmentWebhook(event) {
  switch (event.event_type) {
    case 'appointment.created':
      await sendConfirmationEmail(event.data);
      await addToCalendar(event.data);
      await notifyEmployee(event.data.employee);
      break;

    case 'appointment.updated':
      await sendUpdateNotification(event.data);
      await syncCalendar(event.data);
      break;

    case 'appointment.cancelled':
      await sendCancellationEmail(event.data);
      await removeFromCalendar(event.data);
      await notifyEmployee(event.data.employee);
      break;

    case 'appointment.completed':
      await requestFeedback(event.data.customer);
      await updateLoyaltyPoints(event.data);
      break;

    case 'appointment.no_show':
      await logNoShow(event.data);
      await applyNoShowPolicy(event.data.customer);
      break;
  }
}
```

---

## Customer Webhooks

### Events
- `customer.created` - New customer account
- `customer.updated` - Profile information changed
- `customer.deleted` - Customer account removed

### Payload Example

```json
{
  "event_type": "customer.created",
  "event_id": "evt_def456",
  "timestamp": "2025-11-06T11:00:00Z",
  "data": {
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
    "created_at": "2025-11-06T11:00:00Z",
    "source": "booking_widget"
  }
}
```

### Use Cases

```javascript
async function handleCustomerWebhook(event) {
  switch (event.event_type) {
    case 'customer.created':
      await sendWelcomeEmail(event.data);
      await addToMarketingList(event.data);
      await createLoyaltyAccount(event.data);
      break;

    case 'customer.updated':
      await syncCRM(event.data);
      await updateMarketingPreferences(event.data);
      break;

    case 'customer.deleted':
      await removeFromMarketingList(event.data);
      await anonymizeData(event.data);
      break;
  }
}
```

---

## Employee Webhooks

### Events
- `employee.created` - New employee added
- `employee.updated` - Employee information changed
- `employee.deleted` - Employee removed

### Payload Example

```json
{
  "event_type": "employee.created",
  "event_id": "evt_ghi789",
  "timestamp": "2025-11-06T09:00:00Z",
  "data": {
    "employee_id": "emp_12345",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1234567890",
    "locations": ["loc_001", "loc_002"],
    "services": ["service_123", "service_456"],
    "hire_date": "2025-11-01",
    "access_level": "employee",
    "status": "active"
  }
}
```

### Use Cases

```javascript
async function handleEmployeeWebhook(event) {
  switch (event.event_type) {
    case 'employee.created':
      await sendOnboardingEmail(event.data);
      await createUserAccount(event.data);
      await setupCalendarAccess(event.data);
      break;

    case 'employee.updated':
      await syncHRSystem(event.data);
      await updateCalendarAccess(event.data);
      break;

    case 'employee.deleted':
      await revokeAccess(event.data);
      await reassignAppointments(event.data);
      break;
  }
}
```

---

## Transaction Webhooks

### Events
- `transaction.created` - New transaction processed
- `transaction.completed` - Payment completed successfully
- `transaction.failed` - Payment processing failed
- `transaction.refunded` - Refund processed

### Payload Example

```json
{
  "event_type": "transaction.completed",
  "event_id": "evt_jkl012",
  "timestamp": "2025-11-06T15:00:00Z",
  "data": {
    "transaction_id": "txn_54321",
    "appointment_id": "appt_98765",
    "customer_id": "cust_67890",
    "amount": 75.00,
    "currency": "USD",
    "payment_method": "credit_card",
    "card_last4": "4242",
    "status": "completed",
    "tip_amount": 15.00,
    "total_amount": 90.00,
    "processed_at": "2025-11-06T15:00:00Z"
  }
}
```

### Use Cases

```javascript
async function handleTransactionWebhook(event) {
  switch (event.event_type) {
    case 'transaction.completed':
      await sendReceipt(event.data);
      await updateAccounting(event.data);
      await awardLoyaltyPoints(event.data);
      break;

    case 'transaction.failed':
      await notifyPaymentFailure(event.data);
      await retryPayment(event.data);
      break;

    case 'transaction.refunded':
      await sendRefundConfirmation(event.data);
      await updateAccounting(event.data);
      break;
  }
}
```

---

## Form Response Webhooks

### Events
- `form.submitted` - Form completed and submitted

### Payload Example

```json
{
  "event_type": "form.submitted",
  "event_id": "evt_mno345",
  "timestamp": "2025-11-06T12:00:00Z",
  "data": {
    "form_id": "form_001",
    "form_name": "New Client Intake",
    "response_id": "resp_98765",
    "customer_id": "cust_67890",
    "submitted_at": "2025-11-06T12:00:00Z",
    "fields": [
      {
        "field_id": "field_001",
        "label": "Any allergies?",
        "value": "None"
      },
      {
        "field_id": "field_002",
        "label": "Previous hair treatments",
        "value": "Keratin treatment 6 months ago"
      },
      {
        "field_id": "field_003",
        "label": "Preferred stylist",
        "value": "Jane Smith"
      }
    ]
  }
}
```

### Use Cases

```javascript
async function handleFormWebhook(event) {
  switch (event.event_type) {
    case 'form.submitted':
      await storeFormResponse(event.data);
      await updateCustomerProfile(event.data);
      await notifyRelevantStaff(event.data);
      break;
  }
}
```

---

## Business Location Webhooks

### Events
- `location.created` - New location added
- `location.updated` - Location details changed
- `location.deleted` - Location removed

### Payload Example

```json
{
  "event_type": "location.updated",
  "event_id": "evt_pqr678",
  "timestamp": "2025-11-06T16:00:00Z",
  "data": {
    "location_id": "loc_001",
    "name": "Downtown Salon & Spa",
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
    "status": "active",
    "changes": {
      "name": {
        "old": "Downtown Salon",
        "new": "Downtown Salon & Spa"
      }
    }
  }
}
```

### Use Cases

```javascript
async function handleLocationWebhook(event) {
  switch (event.event_type) {
    case 'location.created':
      await setupLocationResources(event.data);
      await notifyStaff(event.data);
      break;

    case 'location.updated':
      await syncLocationData(event.data);
      await updateWebsite(event.data);
      break;

    case 'location.deleted':
      await archiveLocationData(event.data);
      await notifyAffectedCustomers(event.data);
      break;
  }
}
```

---

## Webhook Security

### 1. Signature Verification

```javascript
function verifyWebhook(req, webhookSecret) {
  const signature = req.headers['x-vagaro-signature'];
  const timestamp = req.headers['x-vagaro-timestamp'];
  const payload = req.body;

  // Check timestamp to prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    // 5 minutes
    throw new Error('Webhook timestamp too old');
  }

  // Verify signature
  const isValid = verifyWebhookSignature(payload, signature, webhookSecret);

  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }
}
```

### 2. Idempotency Handling

```javascript
const processedEvents = new Set();

async function handleWebhookWithIdempotency(event) {
  // Check if event already processed
  if (processedEvents.has(event.event_id)) {
    console.log(`Event ${event.event_id} already processed`);
    return;
  }

  // Process event
  await processEvent(event);

  // Mark as processed
  processedEvents.add(event.event_id);

  // Clean up old events (implement with database)
  cleanupOldEvents();
}
```

### 3. Error Handling and Retries

```javascript
async function handleWebhookWithRetry(event) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await processEvent(event);
      return { success: true };
    } catch (error) {
      attempt++;
      console.error(`Webhook processing attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        // Log to dead letter queue
        await logFailedWebhook(event, error);
        throw error;
      }

      // Exponential backoff
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

---

## Retry Policy

Vagaro implements the following retry policy for webhooks:

1. **Initial Delivery** - Immediate delivery attempt
2. **Retry 1** - After 1 minute
3. **Retry 2** - After 5 minutes
4. **Retry 3** - After 15 minutes
5. **Retry 4** - After 1 hour
6. **Final Retry** - After 6 hours

### Response Requirements

- **Success:** Return 2xx status code
- **Temporary Failure:** Return 5xx status code (will retry)
- **Permanent Failure:** Return 4xx status code (no retry)

---

## Best Practices

### 1. Respond Quickly

```javascript
app.post('/webhooks/vagaro', async (req, res) => {
  // Acknowledge receipt immediately
  res.status(200).json({ received: true });

  // Process asynchronously
  processWebhookAsync(req.body).catch(error => {
    console.error('Async webhook processing failed:', error);
  });
});
```

### 2. Use Queue System

```javascript
const queue = new Queue('webhooks');

app.post('/webhooks/vagaro', async (req, res) => {
  await queue.add('process-webhook', req.body);
  res.status(200).json({ received: true });
});

queue.process('process-webhook', async (job) => {
  await handleWebhookEvent(job.data);
});
```

### 3. Monitor Webhook Health

```javascript
const webhookMetrics = {
  received: 0,
  processed: 0,
  failed: 0,
  avgProcessingTime: 0
};

async function trackWebhookProcessing(event, startTime) {
  webhookMetrics.received++;

  try {
    await processEvent(event);
    webhookMetrics.processed++;
  } catch (error) {
    webhookMetrics.failed++;
    throw error;
  } finally {
    const processingTime = Date.now() - startTime;
    updateAvgProcessingTime(processingTime);
  }
}
```

### 4. Implement Logging

```javascript
async function logWebhookEvent(event, result) {
  await db.webhook_logs.create({
    event_id: event.event_id,
    event_type: event.event_type,
    timestamp: event.timestamp,
    processed_at: new Date(),
    result: result,
    payload: JSON.stringify(event)
  });
}
```

---

## Testing Webhooks

### Local Testing with ngrok

```bash
# Start ngrok tunnel
ngrok http 3000

# Use ngrok URL as webhook endpoint
# https://abc123.ngrok.io/webhooks/vagaro
```

### Mock Webhook Events

```javascript
const mockAppointmentCreated = {
  event_type: 'appointment.created',
  event_id: 'test_evt_123',
  timestamp: new Date().toISOString(),
  data: {
    appointment_id: 'test_appt_123',
    customer: {
      customer_id: 'test_cust_123',
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com'
    }
    // ... rest of payload
  }
};

// Test webhook handler
await handleWebhookEvent(mockAppointmentCreated);
```

---

## Related Sections

- [Authentication](./01-authentication.md) - Securing webhook endpoints
- [Appointments](./04-appointments.md) - Appointment events
- [Customers](./03-customers.md) - Customer events
- [Employees](./02-employees.md) - Employee events
- [Business Locations](./05-locations.md) - Location events
