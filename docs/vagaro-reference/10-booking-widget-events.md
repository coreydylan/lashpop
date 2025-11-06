# Booking Widget Events

## Overview

The Vagaro Booking Widget emits 14 distinct user interaction events that allow you to track customer behavior throughout the booking journey. These events enable analytics, conversion optimization, and enhanced user experience monitoring.

## Event Categories

### Navigation Events
- `widget_loaded` - Initial widget display
- `tab_clicked` - Tab navigation within widget
- `book_now_clicked` - Primary booking CTA clicked

### Service Selection
- `service_searched` - Search functionality used
- `time_slot_clicked` - Available time selected

### Form Interactions
- `form_viewed` - Form displayed to user
- `form_response_submitted` - Form data submitted

### Payment & Completion
- `credit_card_capture_viewed` - Payment form displayed
- `booking_completed` - Successful booking confirmation

### Promotional Features
- `gift_card_applied` - Gift card code redeemed
- `promo_code_applied` - Promotional code used

### Account Actions
- `customer_login` - Customer authentication

### Shopping Cart
- `product_added_to_cart` - Product selected for purchase
- `product_removed_from_cart` - Product removed from selection

---

## Event Tracking Implementation

### Basic Setup

```javascript
// Initialize Vagaro widget with event tracking
window.vagaroWidget = {
  config: {
    businessId: 'your_business_id',
    onEvent: handleWidgetEvent
  }
};

function handleWidgetEvent(event) {
  console.log('Widget event:', event);

  // Send to analytics
  trackEvent(event.type, event.data);

  // Custom handling
  handleCustomLogic(event);
}
```

---

## Event Details

### Widget Loaded

**Event:** `widget_loaded`

Fired when the booking widget initially loads and renders.

#### Payload

```json
{
  "type": "widget_loaded",
  "timestamp": "2025-11-06T10:00:00Z",
  "data": {
    "widget_id": "widget_abc123",
    "business_id": "biz_123",
    "location_id": "loc_001",
    "referrer": "https://example.com/services",
    "user_agent": "Mozilla/5.0...",
    "device_type": "desktop"
  }
}
```

#### Use Cases

```javascript
function handleWidgetLoaded(event) {
  // Track page views
  analytics.pageView('Booking Widget');

  // A/B testing
  assignExperimentVariant(event.data.widget_id);

  // Load preferences
  loadCustomerPreferences();
}
```

---

### Tab Clicked

**Event:** `tab_clicked`

Fired when user navigates between tabs in the widget (Services, Team, About, etc.).

#### Payload

```json
{
  "type": "tab_clicked",
  "timestamp": "2025-11-06T10:01:00Z",
  "data": {
    "tab_name": "Services",
    "previous_tab": "Home",
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleTabClicked(event) {
  // Track navigation patterns
  analytics.track('Widget Navigation', {
    from: event.data.previous_tab,
    to: event.data.tab_name
  });

  // Preload content
  if (event.data.tab_name === 'Services') {
    preloadServiceImages();
  }
}
```

---

### Book Now Clicked

**Event:** `book_now_clicked`

Fired when user clicks the primary booking call-to-action button.

#### Payload

```json
{
  "type": "book_now_clicked",
  "timestamp": "2025-11-06T10:02:00Z",
  "data": {
    "location": "hero_section",
    "service_id": "service_123",
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleBookNowClicked(event) {
  // Track conversion intent
  analytics.track('Booking Intent', {
    location: event.data.location,
    service: event.data.service_id
  });

  // Optimize for conversion
  if (isFirstTimeVisitor()) {
    showTrustSignals();
  }
}
```

---

### Service Searched

**Event:** `service_searched`

Fired when user uses search functionality to find services.

#### Payload

```json
{
  "type": "service_searched",
  "timestamp": "2025-11-06T10:03:00Z",
  "data": {
    "search_term": "haircut",
    "results_count": 5,
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleServiceSearched(event) {
  // Track search analytics
  analytics.track('Service Search', {
    term: event.data.search_term,
    results: event.data.results_count
  });

  // Improve search
  if (event.data.results_count === 0) {
    logZeroResultsSearch(event.data.search_term);
    showAlternativeSuggestions();
  }
}
```

---

### Time Slot Clicked

**Event:** `time_slot_clicked`

Fired when user selects an available appointment time.

#### Payload

```json
{
  "type": "time_slot_clicked",
  "timestamp": "2025-11-06T10:05:00Z",
  "data": {
    "service_id": "service_123",
    "employee_id": "emp_12345",
    "date": "2025-11-15",
    "time": "14:00",
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleTimeSlotClicked(event) {
  // Track booking progress
  analytics.track('Time Selected', {
    service: event.data.service_id,
    date: event.data.date,
    time: event.data.time
  });

  // Urgency messaging
  const slotsRemaining = await getRemainingSlotsForDay(event.data.date);
  if (slotsRemaining < 3) {
    showLimitedAvailabilityMessage();
  }
}
```

---

### Form Viewed

**Event:** `form_viewed`

Fired when a form is displayed to the user (intake forms, booking forms, etc.).

#### Payload

```json
{
  "type": "form_viewed",
  "timestamp": "2025-11-06T10:06:00Z",
  "data": {
    "form_id": "form_001",
    "form_name": "Customer Information",
    "step_number": 3,
    "total_steps": 5,
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleFormViewed(event) {
  // Track funnel progression
  analytics.track('Form Viewed', {
    form: event.data.form_name,
    step: `${event.data.step_number}/${event.data.total_steps}`
  });

  // Form assistance
  if (event.data.step_number === event.data.total_steps) {
    showCompletionEncouragement();
  }
}
```

---

### Form Response Submitted

**Event:** `form_response_submitted`

Fired when user submits form data.

#### Payload

```json
{
  "type": "form_response_submitted",
  "timestamp": "2025-11-06T10:08:00Z",
  "data": {
    "form_id": "form_001",
    "form_name": "Customer Information",
    "field_count": 5,
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleFormSubmitted(event) {
  // Track form completion
  analytics.track('Form Submitted', {
    form: event.data.form_name,
    fields: event.data.field_count
  });

  // Progress indicator
  updateProgressBar('payment');
}
```

---

### Credit Card Capture Viewed

**Event:** `credit_card_capture_viewed`

Fired when payment form is displayed.

#### Payload

```json
{
  "type": "credit_card_capture_viewed",
  "timestamp": "2025-11-06T10:09:00Z",
  "data": {
    "amount": 75.00,
    "currency": "USD",
    "deposit_required": false,
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleCreditCardCaptureViewed(event) {
  // Track payment funnel
  analytics.track('Payment Form Viewed', {
    amount: event.data.amount,
    currency: event.data.currency
  });

  // Trust signals
  showSecurityBadges();
  displayCancellationPolicy();
}
```

---

### Booking Completed

**Event:** `booking_completed`

Fired when booking is successfully confirmed.

#### Payload

```json
{
  "type": "booking_completed",
  "timestamp": "2025-11-06T10:12:00Z",
  "data": {
    "appointment_id": "appt_98765",
    "service_id": "service_123",
    "employee_id": "emp_12345",
    "date": "2025-11-15",
    "time": "14:00",
    "amount": 75.00,
    "session_id": "session_xyz789",
    "time_to_book_seconds": 720
  }
}
```

#### Use Cases

```javascript
function handleBookingCompleted(event) {
  // Conversion tracking
  analytics.track('Booking Completed', {
    value: event.data.amount,
    service: event.data.service_id,
    conversion_time: event.data.time_to_book_seconds
  });

  // Retargeting pixel
  fbq('track', 'Purchase', {
    value: event.data.amount,
    currency: 'USD'
  });

  // Next steps
  showConfirmationMessage();
  offerCalendarDownload();
}
```

---

### Gift Card Applied

**Event:** `gift_card_applied`

Fired when customer redeems a gift card.

#### Payload

```json
{
  "type": "gift_card_applied",
  "timestamp": "2025-11-06T10:10:00Z",
  "data": {
    "gift_card_code": "GIFT1234",
    "amount": 50.00,
    "remaining_balance": 0.00,
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleGiftCardApplied(event) {
  // Track gift card usage
  analytics.track('Gift Card Redeemed', {
    amount: event.data.amount,
    code: event.data.gift_card_code
  });

  // Update pricing display
  updateTotalAmount(-event.data.amount);
}
```

---

### Promo Code Applied

**Event:** `promo_code_applied`

Fired when promotional code is successfully applied.

#### Payload

```json
{
  "type": "promo_code_applied",
  "timestamp": "2025-11-06T10:07:00Z",
  "data": {
    "promo_code": "WINTER20",
    "discount_amount": 15.00,
    "discount_type": "percentage",
    "discount_value": 20,
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handlePromoCodeApplied(event) {
  // Track promotion effectiveness
  analytics.track('Promo Code Used', {
    code: event.data.promo_code,
    discount: event.data.discount_amount,
    type: event.data.discount_type
  });

  // Marketing attribution
  attributeToMarketingCampaign(event.data.promo_code);
}
```

---

### Customer Login

**Event:** `customer_login`

Fired when customer authenticates in the widget.

#### Payload

```json
{
  "type": "customer_login",
  "timestamp": "2025-11-06T10:04:00Z",
  "data": {
    "customer_id": "cust_67890",
    "login_method": "email",
    "returning_customer": true,
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleCustomerLogin(event) {
  // Track authentication
  analytics.track('Customer Login', {
    method: event.data.login_method,
    returning: event.data.returning_customer
  });

  // Personalization
  if (event.data.returning_customer) {
    loadCustomerHistory(event.data.customer_id);
    showPersonalizedRecommendations();
  }
}
```

---

### Product Added To Cart

**Event:** `product_added_to_cart`

Fired when customer adds a product to their cart.

#### Payload

```json
{
  "type": "product_added_to_cart",
  "timestamp": "2025-11-06T10:08:00Z",
  "data": {
    "product_id": "prod_456",
    "product_name": "Hair Serum",
    "quantity": 1,
    "price": 35.00,
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleProductAddedToCart(event) {
  // E-commerce tracking
  analytics.track('Product Added', {
    product_id: event.data.product_id,
    name: event.data.product_name,
    price: event.data.price,
    quantity: event.data.quantity
  });

  // Cart optimization
  updateCartTotal();
  showCrossSellSuggestions(event.data.product_id);
}
```

---

### Product Removed From Cart

**Event:** `product_removed_from_cart`

Fired when customer removes a product from cart.

#### Payload

```json
{
  "type": "product_removed_from_cart",
  "timestamp": "2025-11-06T10:09:00Z",
  "data": {
    "product_id": "prod_456",
    "product_name": "Hair Serum",
    "quantity": 1,
    "price": 35.00,
    "session_id": "session_xyz789"
  }
}
```

#### Use Cases

```javascript
function handleProductRemovedFromCart(event) {
  // Track cart abandonment signals
  analytics.track('Product Removed', {
    product_id: event.data.product_id,
    name: event.data.product_name
  });

  // Retention attempt
  if (isLastProductInCart()) {
    offerDiscount();
  }
}
```

---

## Complete Event Tracking Implementation

### Full Analytics Integration

```javascript
class VagaroWidgetAnalytics {
  constructor() {
    this.sessionId = generateSessionId();
    this.eventHistory = [];
  }

  trackEvent(event) {
    // Add to history
    this.eventHistory.push({
      ...event,
      session_id: this.sessionId
    });

    // Route to appropriate handler
    const handler = this.eventHandlers[event.type];
    if (handler) {
      handler(event);
    }

    // Send to analytics platforms
    this.sendToAnalytics(event);
  }

  sendToAnalytics(event) {
    // Google Analytics
    gtag('event', event.type, event.data);

    // Facebook Pixel
    if (event.type === 'booking_completed') {
      fbq('track', 'Purchase', {
        value: event.data.amount,
        currency: 'USD'
      });
    }

    // Custom analytics
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }

  getFunnelMetrics() {
    const funnel = {
      widget_loaded: 0,
      service_searched: 0,
      time_slot_clicked: 0,
      form_viewed: 0,
      payment_viewed: 0,
      booking_completed: 0
    };

    this.eventHistory.forEach(event => {
      if (funnel.hasOwnProperty(event.type)) {
        funnel[event.type]++;
      }
    });

    return funnel;
  }
}
```

---

## Conversion Optimization

### Funnel Drop-off Analysis

```javascript
function analyzeBookingFunnel(events) {
  const stages = [
    'widget_loaded',
    'book_now_clicked',
    'service_searched',
    'time_slot_clicked',
    'form_viewed',
    'credit_card_capture_viewed',
    'booking_completed'
  ];

  const funnelData = stages.map((stage, index) => {
    const count = events.filter(e => e.type === stage).length;
    const previous = index > 0 ? funnelData[index - 1].count : count;
    const dropoff = previous > 0 ? ((previous - count) / previous) * 100 : 0;

    return { stage, count, dropoff };
  });

  // Identify problem areas
  const criticalDropoffs = funnelData.filter(stage => stage.dropoff > 30);

  return { funnelData, criticalDropoffs };
}
```

---

## Best Practices

### 1. Event Tracking

```javascript
// Always include session context
function enrichEvent(event) {
  return {
    ...event,
    session_id: getSessionId(),
    user_id: getUserId(),
    timestamp: new Date().toISOString(),
    page_url: window.location.href,
    referrer: document.referrer
  };
}
```

### 2. Privacy Compliance

```javascript
// Respect user privacy preferences
function shouldTrackEvent(event) {
  const consent = getConsentPreferences();

  const analyticsEvents = [
    'widget_loaded',
    'booking_completed',
    'service_searched'
  ];

  if (analyticsEvents.includes(event.type)) {
    return consent.analytics;
  }

  return true;
}
```

### 3. Performance

```javascript
// Batch events for efficiency
class EventBatcher {
  constructor() {
    this.batch = [];
    this.flushInterval = 5000; // 5 seconds
    this.startBatching();
  }

  add(event) {
    this.batch.push(event);
    if (this.batch.length >= 10) {
      this.flush();
    }
  }

  startBatching() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  async flush() {
    if (this.batch.length === 0) return;

    const events = [...this.batch];
    this.batch = [];

    await fetch('/api/analytics/batch', {
      method: 'POST',
      body: JSON.stringify({ events })
    });
  }
}
```

---

## Related Sections

- [Appointments](./04-appointments.md) - Booking completion
- [Customers](./03-customers.md) - Customer login and tracking
- [Services](./06-services.md) - Service selection
- [Webhooks](./09-webhooks.md) - Server-side event processing
