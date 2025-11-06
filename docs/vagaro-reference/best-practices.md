# Best Practices

## Overview

This guide covers best practices for integrating with the Vagaro API, including security, performance optimization, error handling, and production deployment strategies.

---

## Security

### 1. Credential Management

#### Use Environment Variables

```javascript
// ✓ GOOD - Use environment variables
require('dotenv').config();
const clientId = process.env.VAGARO_CLIENT_ID;
const clientSecret = process.env.VAGARO_CLIENT_SECRET;

// ✗ BAD - Never hardcode credentials
const clientId = 'my_client_id_123';
const clientSecret = 'my_secret_456';
```

#### Secure Storage

```javascript
// Use a secrets manager in production
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getVagaroCredentials() {
  const secret = await secretsManager
    .getSecretValue({ SecretId: 'vagaro/api/credentials' })
    .promise();

  return JSON.parse(secret.SecretString);
}
```

#### Rotate Credentials

```javascript
// Implement credential rotation
async function rotateAPICredentials() {
  // 1. Generate new credentials via Vagaro admin
  // 2. Test new credentials
  // 3. Update secrets manager
  // 4. Deploy updated configuration
  // 5. Deactivate old credentials after grace period
}

// Schedule rotation every 90 days
cron.schedule('0 0 1 */3 *', rotateAPICredentials);
```

### 2. Token Management

#### Cache Access Tokens

```javascript
// ✓ GOOD - Cache and reuse tokens
class TokenManager {
  constructor() {
    this.token = null;
    this.expiry = null;
  }

  async getToken() {
    if (this.token && Date.now() < this.expiry - 60000) {
      return this.token; // Reuse cached token
    }

    return await this.refreshToken();
  }

  async refreshToken() {
    const response = await authenticate();
    this.token = response.access_token;
    this.expiry = Date.now() + response.expires_in * 1000;
    return this.token;
  }
}

// ✗ BAD - Generate new token for every request
async function apiRequest(endpoint) {
  const token = await authenticate(); // Don't do this!
  return fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
```

#### Secure Token Storage

```javascript
// For server-side: Use in-memory cache
const NodeCache = require('node-cache');
const tokenCache = new NodeCache({ stdTTL: 3600 });

// For client-side: Use secure httpOnly cookies
res.cookie('vagaro_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
});
```

### 3. Webhook Security

#### Always Verify Signatures

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/webhooks/vagaro', (req, res) => {
  const signature = req.headers['x-vagaro-signature'];

  if (!verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
});
```

#### Prevent Replay Attacks

```javascript
function verifyWebhookTimestamp(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 300; // 5 minutes

  if (Math.abs(now - timestamp) > maxAge) {
    throw new Error('Webhook timestamp too old');
  }
}

app.post('/webhooks/vagaro', (req, res) => {
  const timestamp = req.headers['x-vagaro-timestamp'];

  verifyWebhookTimestamp(timestamp);
  // ... rest of webhook handling
});
```

#### Implement Idempotency

```javascript
const Redis = require('ioredis');
const redis = new Redis();

async function processWebhookIdempotent(event) {
  const key = `webhook:${event.event_id}`;

  // Check if already processed
  const exists = await redis.exists(key);
  if (exists) {
    console.log(`Event ${event.event_id} already processed`);
    return;
  }

  // Process event
  await processEvent(event);

  // Mark as processed (expire after 24 hours)
  await redis.setex(key, 86400, '1');
}
```

---

## Performance Optimization

### 1. API Request Optimization

#### Batch Requests

```javascript
// ✓ GOOD - Batch multiple operations
async function getMultipleCustomers(customerIds) {
  // If API supports batch retrieval
  return await client.request('POST', '/api/customers/batch', {
    customer_ids: customerIds
  });
}

// ✗ BAD - Sequential individual requests
async function getMultipleCustomers(customerIds) {
  const customers = [];
  for (const id of customerIds) {
    const customer = await client.request('POST', '/api/customers/retrieve', {
      customer_id: id
    });
    customers.push(customer);
  }
  return customers;
}
```

#### Parallel Requests

```javascript
// ✓ GOOD - Parallel independent requests
async function loadDashboardData() {
  const [locations, services, employees] = await Promise.all([
    client.request('POST', '/api/locations/retrieve', {}),
    client.request('POST', '/api/services/retrieve', {}),
    client.request('POST', '/api/employees/retrieve', {})
  ]);

  return { locations, services, employees };
}

// ✗ BAD - Sequential requests
async function loadDashboardData() {
  const locations = await client.request('POST', '/api/locations/retrieve', {});
  const services = await client.request('POST', '/api/services/retrieve', {});
  const employees = await client.request('POST', '/api/employees/retrieve', {});

  return { locations, services, employees };
}
```

### 2. Caching Strategy

#### Cache Static Data

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

async function getServices(locationId) {
  const cacheKey = `services:${locationId}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const services = await client.request('POST', '/api/services/retrieve', {
    location_id: locationId
  });

  // Store in cache
  cache.set(cacheKey, services);

  return services;
}
```

#### Cache Invalidation

```javascript
// Invalidate cache on webhook events
app.post('/webhooks/vagaro', async (req, res) => {
  const event = req.body;

  switch (event.event_type) {
    case 'service.updated':
      cache.del(`services:${event.data.location_id}`);
      break;

    case 'employee.updated':
      cache.del(`employees:${event.data.location_id}`);
      break;
  }

  res.status(200).json({ received: true });
});
```

### 3. Rate Limiting

#### Implement Client-Side Rate Limiting

```javascript
const Bottleneck = require('bottleneck');

// Max 100 requests per minute
const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 600 // 600ms between requests = 100 req/min
});

async function rateLimitedRequest(method, endpoint, data) {
  return limiter.schedule(() => client.request(method, endpoint, data));
}
```

#### Handle Rate Limit Errors

```javascript
async function requestWithRateLimit(method, endpoint, data) {
  try {
    return await client.request(method, endpoint, data);
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      console.log(`Rate limited. Retrying after ${retryAfter}s`);
      await sleep(retryAfter * 1000);
      return requestWithRateLimit(method, endpoint, data);
    }
    throw error;
  }
}
```

---

## Error Handling

### 1. Retry Logic

#### Exponential Backoff

```javascript
async function requestWithRetry(
  method,
  endpoint,
  data,
  maxRetries = 3,
  baseDelay = 1000
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.request(method, endpoint, data);
    } catch (error) {
      const statusCode = error.response?.status;

      // Don't retry client errors
      if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        throw error;
      }

      // Last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      await sleep(delay);
    }
  }
}
```

### 2. Graceful Degradation

```javascript
async function getServiceWithFallback(serviceId) {
  try {
    return await client.request('POST', '/api/services/retrieve', {
      service_id: serviceId
    });
  } catch (error) {
    console.error('Failed to fetch service from API:', error);

    // Fallback to cached data
    const cached = cache.get(`service:${serviceId}`);
    if (cached) {
      console.log('Using cached service data');
      return cached;
    }

    // Return minimal data
    return {
      service_id: serviceId,
      name: 'Service',
      available: false,
      error: 'Service temporarily unavailable'
    };
  }
}
```

### 3. Comprehensive Error Logging

```javascript
class ErrorLogger {
  static log(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      statusCode: error.response?.status,
      endpoint: context.endpoint,
      method: context.method,
      userId: context.userId,
      requestId: context.requestId
    };

    // Log to monitoring service
    console.error('API Error:', errorInfo);

    // Send to error tracking (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, { extra: errorInfo });
    }
  }
}

// Usage
try {
  await client.request('POST', '/api/customers/retrieve', { customer_id: id });
} catch (error) {
  ErrorLogger.log(error, {
    endpoint: '/api/customers/retrieve',
    method: 'POST',
    userId: currentUser.id,
    requestId: req.id
  });
  throw error;
}
```

---

## Data Management

### 1. Data Validation

#### Validate Before API Calls

```javascript
const Joi = require('joi');

const appointmentSchema = Joi.object({
  location_id: Joi.string().required(),
  service_id: Joi.string().required(),
  employee_id: Joi.string().optional(),
  date: Joi.date().iso().required(),
  time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
});

async function createAppointment(data) {
  // Validate input
  const { error, value } = appointmentSchema.validate(data);

  if (error) {
    throw new Error(`Invalid appointment data: ${error.message}`);
  }

  // Make API call
  return await client.request('POST', '/api/appointments/create', value);
}
```

### 2. Data Sanitization

```javascript
function sanitizeCustomerData(data) {
  return {
    first_name: sanitizeString(data.first_name),
    last_name: sanitizeString(data.last_name),
    email: sanitizeEmail(data.email),
    phone: sanitizePhone(data.phone)
  };
}

function sanitizeString(str) {
  return str.trim().replace(/[<>]/g, '');
}

function sanitizeEmail(email) {
  return email.toLowerCase().trim();
}

function sanitizePhone(phone) {
  // Remove non-digit characters
  return phone.replace(/\D/g, '');
}
```

### 3. Data Privacy

#### PII Handling

```javascript
// Never log sensitive data
function logAPIRequest(endpoint, data) {
  const sanitized = { ...data };

  // Remove PII fields
  const piiFields = [
    'email',
    'phone',
    'ssn',
    'credit_card',
    'date_of_birth'
  ];

  piiFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  console.log('API Request:', endpoint, sanitized);
}
```

---

## Monitoring & Observability

### 1. Metrics Collection

```javascript
const prometheus = require('prom-client');

// Define metrics
const apiRequestCounter = new prometheus.Counter({
  name: 'vagaro_api_requests_total',
  help: 'Total number of Vagaro API requests',
  labelNames: ['method', 'endpoint', 'status']
});

const apiRequestDuration = new prometheus.Histogram({
  name: 'vagaro_api_request_duration_seconds',
  help: 'Duration of Vagaro API requests',
  labelNames: ['method', 'endpoint']
});

// Track metrics
async function monitoredRequest(method, endpoint, data) {
  const startTime = Date.now();

  try {
    const response = await client.request(method, endpoint, data);

    apiRequestCounter.inc({
      method,
      endpoint,
      status: 'success'
    });

    return response;
  } catch (error) {
    apiRequestCounter.inc({
      method,
      endpoint,
      status: 'error'
    });

    throw error;
  } finally {
    const duration = (Date.now() - startTime) / 1000;
    apiRequestDuration.observe({ method, endpoint }, duration);
  }
}
```

### 2. Health Checks

```javascript
async function healthCheck() {
  const checks = {
    api_authentication: false,
    api_connectivity: false,
    webhook_endpoint: false
  };

  try {
    // Test authentication
    await client.authenticate();
    checks.api_authentication = true;

    // Test API connectivity
    await client.request('POST', '/api/locations/retrieve', {});
    checks.api_connectivity = true;

    // Test webhook endpoint
    const webhookTest = await testWebhookEndpoint();
    checks.webhook_endpoint = webhookTest;
  } catch (error) {
    console.error('Health check failed:', error);
  }

  return {
    status: Object.values(checks).every(Boolean) ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  };
}

// Expose health check endpoint
app.get('/health', async (req, res) => {
  const health = await healthCheck();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### 3. Alerting

```javascript
const nodemailer = require('nodemailer');

async function sendAlert(severity, message, details) {
  if (severity === 'critical') {
    // Send email
    await mailer.sendMail({
      to: 'ops-team@example.com',
      subject: `[CRITICAL] Vagaro Integration Alert`,
      text: `${message}\n\nDetails: ${JSON.stringify(details, null, 2)}`
    });

    // Send to Slack
    await slack.send({
      channel: '#alerts',
      text: `:rotating_light: ${message}`,
      attachments: [
        {
          color: 'danger',
          fields: [
            { title: 'Severity', value: severity },
            { title: 'Details', value: JSON.stringify(details) }
          ]
        }
      ]
    });
  }
}

// Monitor webhook failures
const webhookFailures = new Map();

function trackWebhookFailure(eventId) {
  const count = (webhookFailures.get(eventId) || 0) + 1;
  webhookFailures.set(eventId, count);

  if (count >= 3) {
    sendAlert('critical', 'Webhook processing failing repeatedly', {
      event_id: eventId,
      failure_count: count
    });
  }
}
```

---

## Testing

### 1. Unit Tests

```javascript
const { expect } = require('chai');
const sinon = require('sinon');

describe('VagaroClient', () => {
  let client;
  let axiosStub;

  beforeEach(() => {
    client = new VagaroClient();
    axiosStub = sinon.stub(axios, 'post');
  });

  afterEach(() => {
    axiosStub.restore();
  });

  it('should authenticate successfully', async () => {
    axiosStub.resolves({
      data: {
        access_token: 'test_token',
        expires_in: 3600
      }
    });

    const token = await client.authenticate();

    expect(token).to.equal('test_token');
    expect(axiosStub.calledOnce).to.be.true;
  });

  it('should handle authentication failure', async () => {
    axiosStub.rejects({
      response: {
        status: 401,
        data: { error: 'invalid_client' }
      }
    });

    try {
      await client.authenticate();
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error.response.status).to.equal(401);
    }
  });
});
```

### 2. Integration Tests

```javascript
describe('Vagaro API Integration', () => {
  let client;

  before(async () => {
    client = new VagaroClient();
    await client.authenticate();
  });

  it('should retrieve locations', async () => {
    const locations = await client.request('POST', '/api/locations/retrieve', {});

    expect(locations).to.have.property('locations');
    expect(locations.locations).to.be.an('array');
  });

  it('should handle invalid customer lookup', async () => {
    try {
      await client.request('POST', '/api/customers/retrieve', {
        customer_id: 'invalid_id'
      });
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error.response.status).to.equal(404);
    }
  });
});
```

### 3. Webhook Testing

```javascript
const request = require('supertest');

describe('Webhook Endpoint', () => {
  it('should accept valid webhook', async () => {
    const payload = {
      event_type: 'appointment.created',
      event_id: 'test_123',
      timestamp: new Date().toISOString(),
      data: {}
    };

    const signature = generateSignature(payload, WEBHOOK_SECRET);

    const response = await request(app)
      .post('/webhooks/vagaro')
      .set('x-vagaro-signature', signature)
      .send(payload);

    expect(response.status).to.equal(200);
  });

  it('should reject invalid signature', async () => {
    const response = await request(app)
      .post('/webhooks/vagaro')
      .set('x-vagaro-signature', 'invalid_signature')
      .send({ event_type: 'test' });

    expect(response.status).to.equal(401);
  });
});
```

---

## Deployment

### 1. Environment Configuration

```javascript
// config.js
module.exports = {
  development: {
    vagaroApiUrl: 'https://api-dev.vagaro.com',
    logLevel: 'debug',
    cacheEnabled: false
  },
  staging: {
    vagaroApiUrl: 'https://api-staging.vagaro.com',
    logLevel: 'info',
    cacheEnabled: true
  },
  production: {
    vagaroApiUrl: 'https://api.vagaro.com',
    logLevel: 'warn',
    cacheEnabled: true
  }
};
```

### 2. Graceful Shutdown

```javascript
let server;

async function startServer() {
  server = app.listen(3000, () => {
    console.log('Server started');
  });
}

async function shutdown() {
  console.log('Shutting down gracefully...');

  // Stop accepting new requests
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Flush pending webhooks
  await webhookQueue.close();

  // Close database connections
  await db.close();

  // Exit
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

---

## Checklist

### Pre-Production Checklist

- [ ] Credentials stored securely (not hardcoded)
- [ ] Token caching implemented
- [ ] Webhook signature verification enabled
- [ ] Error handling and retry logic in place
- [ ] Rate limiting respected
- [ ] Logging and monitoring configured
- [ ] Health check endpoint implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Security review completed

### Production Monitoring

- [ ] API request success/failure rates
- [ ] Average response times
- [ ] Error rates and types
- [ ] Webhook processing success rate
- [ ] Cache hit/miss rates
- [ ] Token refresh failures
- [ ] Rate limit violations

---

## Related Documentation

- [Quick Start Guide](./quick-start.md)
- [Authentication](./01-authentication.md)
- [Webhooks](./09-webhooks.md)
- [Official Vagaro Docs](https://docs.vagaro.com)
