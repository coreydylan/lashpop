# Quick Start Guide

## Overview

This guide walks you through integrating with the Vagaro API in under 30 minutes. By the end, you'll be able to authenticate, retrieve data, and handle webhook events.

## Prerequisites

- Vagaro business account with API access enabled
- Development environment with Node.js, Python, or your preferred language
- HTTPS-enabled server for webhook testing (or ngrok for local development)

## Step 1: Get API Credentials

### Obtain Credentials

1. Log in to your Vagaro business account
2. Navigate to Settings → API Configuration
3. Generate new API credentials
4. Save your `client_id` and `client_secret`

**Important:** Store credentials securely and never commit them to version control.

```bash
# .env file
VAGARO_CLIENT_ID=your_client_id_here
VAGARO_CLIENT_SECRET=your_client_secret_here
VAGARO_API_BASE_URL=https://api.vagaro.com
```

---

## Step 2: Authentication

### Generate Access Token

Create a function to authenticate and obtain an access token:

#### Node.js Example

```javascript
require('dotenv').config();
const axios = require('axios');

class VagaroClient {
  constructor() {
    this.baseURL = process.env.VAGARO_API_BASE_URL;
    this.clientId = process.env.VAGARO_CLIENT_ID;
    this.clientSecret = process.env.VAGARO_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials'
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      console.log('✓ Authentication successful');
      return this.accessToken;
    } catch (error) {
      console.error('✗ Authentication failed:', error.response?.data);
      throw error;
    }
  }

  async getAccessToken() {
    // Return cached token if valid
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    // Otherwise get new token
    return await this.authenticate();
  }

  async request(method, endpoint, data = null) {
    const token = await this.getAccessToken();

    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.response?.data);
      throw error;
    }
  }
}

module.exports = VagaroClient;
```

#### Python Example

```python
import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

class VagaroClient:
    def __init__(self):
        self.base_url = os.getenv('VAGARO_API_BASE_URL')
        self.client_id = os.getenv('VAGARO_CLIENT_ID')
        self.client_secret = os.getenv('VAGARO_CLIENT_SECRET')
        self.access_token = None
        self.token_expiry = None

    def authenticate(self):
        try:
            response = requests.post(
                f'{self.base_url}/api/auth/token',
                json={
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'grant_type': 'client_credentials'
                }
            )
            response.raise_for_status()

            data = response.json()
            self.access_token = data['access_token']
            self.token_expiry = datetime.now() + timedelta(seconds=data['expires_in'])

            print('✓ Authentication successful')
            return self.access_token
        except requests.exceptions.RequestException as e:
            print(f'✗ Authentication failed: {e}')
            raise

    def get_access_token(self):
        # Return cached token if valid
        if self.access_token and datetime.now() < self.token_expiry - timedelta(minutes=1):
            return self.access_token

        # Otherwise get new token
        return self.authenticate()

    def request(self, method, endpoint, data=None):
        token = self.get_access_token()

        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        try:
            response = requests.request(
                method,
                f'{self.base_url}{endpoint}',
                headers=headers,
                json=data
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f'API Error [{endpoint}]: {e}')
            raise
```

---

## Step 3: Make Your First API Call

### Retrieve Business Locations

```javascript
// Node.js
const VagaroClient = require('./vagaro-client');

async function main() {
  const client = new VagaroClient();

  // Authenticate
  await client.authenticate();

  // Get locations
  const locations = await client.request('POST', '/api/locations/retrieve', {});

  console.log('Your locations:', locations);
}

main().catch(console.error);
```

```python
# Python
from vagaro_client import VagaroClient

def main():
    client = VagaroClient()

    # Authenticate
    client.authenticate()

    # Get locations
    locations = client.request('POST', '/api/locations/retrieve', {})

    print('Your locations:', locations)

if __name__ == '__main__':
    main()
```

**Expected Output:**

```json
{
  "locations": [
    {
      "location_id": "loc_001",
      "name": "Downtown Salon",
      "address": {...},
      "phone": "+14155551234",
      "status": "active"
    }
  ]
}
```

---

## Step 4: Common Operations

### Search Available Appointments

```javascript
async function findAvailability(client, serviceId, date) {
  const availability = await client.request(
    'POST',
    '/api/appointments/availability',
    {
      service_id: serviceId,
      date: date,
      location_id: 'loc_001'
    }
  );

  console.log(`Available slots on ${date}:`, availability.available_slots);
  return availability;
}

// Usage
await findAvailability(client, 'service_123', '2025-11-15');
```

### Retrieve Customer Information

```javascript
async function getCustomer(client, customerId) {
  const customer = await client.request(
    'POST',
    '/api/customers/retrieve',
    { customer_id: customerId }
  );

  console.log(`Customer: ${customer.first_name} ${customer.last_name}`);
  return customer;
}

// Usage
await getCustomer(client, 'cust_67890');
```

### Get Services

```javascript
async function getServices(client, locationId) {
  const services = await client.request(
    'POST',
    '/api/services/retrieve',
    { location_id: locationId }
  );

  console.log(`Available services: ${services.services.length}`);
  return services;
}

// Usage
await getServices(client, 'loc_001');
```

---

## Step 5: Set Up Webhooks

### Create Webhook Endpoint

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Webhook secret (get from Vagaro dashboard)
const WEBHOOK_SECRET = process.env.VAGARO_WEBHOOK_SECRET;

// Verify webhook signature
function verifySignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Webhook endpoint
app.post('/webhooks/vagaro', (req, res) => {
  const signature = req.headers['x-vagaro-signature'];
  const event = req.body;

  // Verify signature
  if (!verifySignature(event, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Respond immediately
  res.status(200).json({ received: true });

  // Process asynchronously
  processWebhook(event).catch(console.error);
});

async function processWebhook(event) {
  console.log(`Processing ${event.event_type}`);

  switch (event.event_type) {
    case 'appointment.created':
      await handleNewAppointment(event.data);
      break;

    case 'customer.created':
      await handleNewCustomer(event.data);
      break;

    case 'appointment.cancelled':
      await handleCancelledAppointment(event.data);
      break;

    default:
      console.log(`Unhandled event type: ${event.event_type}`);
  }
}

async function handleNewAppointment(data) {
  console.log(`New appointment: ${data.appointment_id}`);
  // Send confirmation email
  // Update calendar
  // Notify employee
}

async function handleNewCustomer(data) {
  console.log(`New customer: ${data.customer_id}`);
  // Send welcome email
  // Add to CRM
}

async function handleCancelledAppointment(data) {
  console.log(`Cancelled appointment: ${data.appointment_id}`);
  // Send cancellation email
  // Update calendar
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Test Webhooks Locally with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your webhook server
node webhook-server.js

# In another terminal, start ngrok
ngrok http 3000

# Use the ngrok URL in Vagaro webhook settings
# Example: https://abc123.ngrok.io/webhooks/vagaro
```

---

## Step 6: Error Handling

### Robust Error Handling

```javascript
class VagaroClient {
  // ... previous code ...

  async requestWithRetry(method, endpoint, data = null, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request(method, endpoint, data);
      } catch (error) {
        lastError = error;
        const statusCode = error.response?.status;

        // Don't retry client errors (4xx)
        if (statusCode >= 400 && statusCode < 500) {
          throw error;
        }

        // Retry server errors (5xx) and network errors
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retry attempt ${attempt} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
```

---

## Step 7: Complete Example

### Full Booking Flow

```javascript
const VagaroClient = require('./vagaro-client');

async function completeBookingFlow() {
  const client = new VagaroClient();

  try {
    // 1. Authenticate
    console.log('1. Authenticating...');
    await client.authenticate();

    // 2. Get available services
    console.log('2. Fetching services...');
    const services = await client.request('POST', '/api/services/retrieve', {
      location_id: 'loc_001'
    });
    console.log(`   Found ${services.services.length} services`);

    // 3. Search availability
    console.log('3. Searching availability...');
    const availability = await client.request(
      'POST',
      '/api/appointments/availability',
      {
        location_id: 'loc_001',
        service_id: 'service_123',
        date: '2025-11-15'
      }
    );
    console.log(`   Found ${availability.available_slots.length} available slots`);

    // 4. Get customer information
    console.log('4. Retrieving customer...');
    const customer = await client.request('POST', '/api/customers/retrieve', {
      email: 'customer@example.com'
    });
    console.log(`   Customer: ${customer.first_name} ${customer.last_name}`);

    // 5. Create appointment (via admin interface in this example)
    console.log('5. Appointment would be created here');
    console.log('   ✓ Booking flow completed successfully!');
  } catch (error) {
    console.error('✗ Booking flow failed:', error.message);
  }
}

completeBookingFlow();
```

---

## Next Steps

### Explore Advanced Features

1. **Multi-Location Management**
   - [Business Locations](./05-locations.md)
   - [Employee Assignment](./02-employees.md)

2. **Customer Management**
   - [Customer API](./03-customers.md)
   - [Customer Webhooks](./09-webhooks.md#customer-webhooks)

3. **Booking Optimization**
   - [Appointment API](./04-appointments.md)
   - [Services](./06-services.md)

4. **Analytics & Tracking**
   - [Booking Widget Events](./10-booking-widget-events.md)
   - [Webhook Events](./09-webhooks.md)

### Implementation Checklist

- [ ] Obtain API credentials
- [ ] Set up authentication
- [ ] Test basic API calls
- [ ] Configure webhook endpoint
- [ ] Implement webhook verification
- [ ] Test webhook events
- [ ] Add error handling
- [ ] Implement retry logic
- [ ] Set up logging and monitoring
- [ ] Review security best practices

### Resources

- [API Reference](https://docs.vagaro.com/public/reference/api-introduction)
- [Webhook Documentation](https://docs.vagaro.com/public/docs/introduction)
- [Best Practices](./best-practices.md)
- [Access Control](./08-access-control.md)

---

## Troubleshooting

### Common Issues

#### Authentication Fails

```
Error: 401 Unauthorized - invalid_client
```

**Solution:** Verify your client_id and client_secret are correct and that API access is enabled for your account.

#### Token Expired

```
Error: 401 Unauthorized - token_expired
```

**Solution:** Implement token refresh logic to get a new token before expiration.

#### Webhook Signature Verification Fails

```
Error: Invalid webhook signature
```

**Solution:** Ensure you're using the correct webhook secret and verifying the raw request body.

#### Rate Limiting

```
Error: 429 Too Many Requests
```

**Solution:** Implement exponential backoff and respect rate limits. Cache access tokens instead of generating new ones for each request.

---

## Support

For API support:
- Check [official documentation](https://docs.vagaro.com)
- Contact Vagaro developer support
- Review [best practices](./best-practices.md)
