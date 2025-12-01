# Vagaro Booking Widget Events

Reference documentation for Vagaro's postMessage events sent from embedded booking widgets.

## Overview

When the Vagaro widget is embedded in an iframe, it sends real-time notifications to the parent page via `Window.postMessage()`. This enables tracking user interactions throughout the booking flow.

## Listening for Events

```typescript
window.addEventListener('message', function(event) {
  // Verify origin for security
  if (event.origin !== 'https://www.vagaro.com') {
    return;
  }

  const message = event.data;
  // Handle event based on message.eventName
}, false);
```

## Event Payload Format

All events follow this structure:

```typescript
interface VagaroWidgetEvent {
  eventName: string;      // Event identifier
  timestamp: number;      // Unix epoch milliseconds
  data: object | null;    // Event-specific data
}
```

---

## Available Events

### Widget Lifecycle

#### `WidgetLoaded`
Triggered when the booking widget has completed loading.

```json
{
  "eventName": "WidgetLoaded",
  "timestamp": 1672924800000,
  "data": null
}
```

---

### Navigation Events

#### `TabClicked`
Triggered when a user clicks on any tab in the booking widget.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID (only if logged in) |
| tabName | string | Tab name: "Services", "Classes", "Gift Cards" |

```json
{
  "eventName": "TabClicked",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A==",
    "tabName": "Services"
  }
}
```

---

### Service Selection Events

#### `BookNowClicked`
Triggered when a "Book Now" button is clicked.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID (only if logged in) |
| serviceName | string | Name of the service |

```json
{
  "eventName": "BookNowClicked",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A==",
    "serviceName": "Women's Blowdry"
  }
}
```

#### `ServiceSearched`
Triggered when the search button is clicked.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID (only if logged in) |
| serviceName | string | Service name searched |
| serviceProvider | string | Provider name |
| searchDate | string | Date searched (yyyy-MM-DD) |

```json
{
  "eventName": "ServiceSearched",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A==",
    "serviceName": "Women's Blowdry",
    "serviceProvider": "Jane Doe",
    "searchDate": "2025-01-06"
  }
}
```

---

### Scheduling Events

#### `TimeSlotClicked`
Triggered when a time slot is selected.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID (only if logged in) |
| serviceName | string | Service name |
| serviceProvider | string | Provider name |
| selectedTimeSlot | number | Unix timestamp of selected slot |

```json
{
  "eventName": "TimeSlotClicked",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A==",
    "serviceName": "Women's Blowdry",
    "serviceProvider": "Jane Doe",
    "selectedTimeSlot": 1672924800000
  }
}
```

---

### Form Events

#### `FormViewed`
Triggered when a form is presented.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID |
| formName | string | Form name |
| formId | string | Form ID |

```json
{
  "eventName": "FormViewed",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A==",
    "formName": "Sample Test Form",
    "formId": "67368d061c4cb188d4f00bf4"
  }
}
```

#### `FormResponseSubmitted`
Triggered when a form response is submitted.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID |
| formName | string | Form name |
| formId | string | Form ID |

```json
{
  "eventName": "FormResponseSubmitted",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A==",
    "formName": "Sample Test Form",
    "formId": "67368d061c4cb188d4f00bf4"
  }
}
```

---

### Authentication Events

#### `CustomerLogin`
Triggered when a customer logs in.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID |

```json
{
  "eventName": "CustomerLogin",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A=="
  }
}
```

---

### Payment Events

#### `CreditCardCaptureViewed`
Triggered when credit card capture form is displayed.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID |

```json
{
  "eventName": "CreditCardCaptureViewed",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A=="
  }
}
```

#### `GiftCardApplied`
Triggered when a gift card is applied.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID |
| giftCardNumber | string | Gift card number |

```json
{
  "eventName": "GiftCardApplied",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A==",
    "giftCardNumber": "1234ABCD"
  }
}
```

#### `PromoCodeApplied`
Triggered when a promo code is applied.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID |
| promoCode | string | Promo code |

```json
{
  "eventName": "PromoCodeApplied",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A==",
    "promoCode": "TestPromoCode"
  }
}
```

---

### Booking Completion

#### `BookingCompleted`
Triggered when a booking is successfully completed.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID |
| cardOnFile | boolean | Whether payment used saved card |

```json
{
  "eventName": "BookingCompleted",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A==",
    "cardOnFile": true
  }
}
```

---

### Shopping Cart Events

#### `ProductAddedToCart`
Triggered when a product is added to cart.

| Property | Type | Description |
|----------|------|-------------|
| customerId | string | Customer ID |
| productName | string | Product name |
| quantity | number | Quantity added |

```json
{
  "eventName": "ProductAddedToCart",
  "timestamp": 1672924800000,
  "data": {
    "customerId": "0AYr~GsT3ObuReX7Ww3J9A==",
    "productName": "Signature Shampoo",
    "quantity": 2
  }
}
```

#### `ProductRemovedFromCart`
Triggered when a product is removed from cart.

| Property | Type | Description |
|----------|------|-------------|
| productName | string | Product name |

```json
{
  "eventName": "ProductRemovedFromCart",
  "timestamp": 1672924800000,
  "data": {
    "productName": "Signature Shampoo"
  }
}
```

---

## User Flow Mapping

For our implementation with pre-filtered service URLs, the typical event sequence is:

```
1. WidgetLoaded           → Widget ready
2. BookNowClicked         → User clicks "Request" on service
3. TimeSlotClicked        → User selects appointment time
4. CustomerLogin          → User authenticates (if not logged in)
5. FormViewed             → Questionnaire shown (service-dependent)
6. FormResponseSubmitted  → Questionnaire completed
7. CreditCardCaptureViewed → Payment form shown (if required)
8. BookingCompleted       → Booking confirmed
```

---

## Security

Always validate the event origin:

```typescript
if (event.origin !== 'https://www.vagaro.com') {
  return; // Ignore events from other origins
}
```

---

## Source

Vagaro Enterprise Business API V2 Documentation
https://docs.vagaro.com/
