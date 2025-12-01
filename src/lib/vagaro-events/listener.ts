/**
 * Vagaro Widget Event Listener
 *
 * Core postMessage listener that handles events from the Vagaro booking widget.
 * Validates origin, checks config toggles, and dispatches to subscribers.
 */

import type {
  VagaroEventName,
  VagaroRawEvent,
  VagaroEvent,
  VagaroEventHandler,
  VagaroEventUnsubscribe,
} from './types';
import { VAGARO_EVENT_CONFIG, VAGARO_ORIGIN } from './config';

// ============================================================================
// Event Bus
// ============================================================================

type Subscriber = {
  eventName: VagaroEventName | '*';
  handler: VagaroEventHandler<any>;
};

const subscribers: Set<Subscriber> = new Set();

// ============================================================================
// Event Validation
// ============================================================================

/**
 * Known Vagaro event names
 */
const KNOWN_VAGARO_EVENTS: VagaroEventName[] = [
  'WidgetLoaded',
  'TabClicked',
  'BookNowClicked',
  'ServiceSearched',
  'TimeSlotClicked',
  'FormViewed',
  'FormResponseSubmitted',
  'CustomerLogin',
  'CreditCardCaptureViewed',
  'GiftCardApplied',
  'PromoCodeApplied',
  'BookingCompleted',
  'ProductAddedToCart',
  'ProductRemovedFromCart',
];

/**
 * Validates that a message is a valid Vagaro widget event.
 * More permissive validation to handle potential variations in event structure.
 */
function isValidVagaroEvent(data: unknown): data is VagaroRawEvent {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const event = data as Record<string, unknown>;

  // Must have eventName string
  if (typeof event.eventName !== 'string') {
    return false;
  }

  // Timestamp can be number or missing (we'll add one)
  // Some Vagaro events might not include timestamp

  // Check if eventName is a known Vagaro event
  return KNOWN_VAGARO_EVENTS.includes(event.eventName as VagaroEventName);
}

/**
 * Checks if an event is enabled in the config.
 */
function isEventEnabled(eventName: VagaroEventName): boolean {
  return VAGARO_EVENT_CONFIG[eventName] === true;
}

// ============================================================================
// Message Handler
// ============================================================================

/**
 * Checks if an origin is from Vagaro
 */
function isVagaroOrigin(origin: string): boolean {
  return (
    origin === VAGARO_ORIGIN ||
    origin === 'https://vagaro.com' ||
    origin.endsWith('.vagaro.com') ||
    origin.includes('vagaro')
  );
}

/**
 * Handles incoming postMessage events.
 * Matches Vagaro's documented format exactly.
 */
function handleMessage(event: MessageEvent): void {
  // Per Vagaro docs: Always verify the event origin
  if (event.origin !== 'https://www.vagaro.com') {
    return;
  }

  // Per Vagaro docs: The 'data' property contains the payload
  let message = event.data;

  // Vagaro sends data as JSON string - parse it if needed
  if (typeof message === 'string') {
    try {
      message = JSON.parse(message);
    } catch {
      // Not valid JSON, skip
      return;
    }
  }

  // Must be an object with eventName
  if (!message || typeof message !== 'object' || !('eventName' in message)) {
    return;
  }

  // Log for debugging
  console.log('%c[Vagaro Event Parsed]', 'background: #22c55e; color: white; padding: 2px 6px;', message.eventName, message);

  // Check if this event type is enabled in config
  if (!isEventEnabled(message.eventName as VagaroEventName)) {
    console.log('[Vagaro] Event disabled:', message.eventName);
    return;
  }

  // Normalize the event
  const vagaroEvent: VagaroRawEvent = {
    eventName: message.eventName,
    timestamp: typeof message.timestamp === 'number' ? message.timestamp : Date.now(),
    data: message.data || {},
  };

  // Dispatch to subscribers
  subscribers.forEach((subscriber) => {
    if (subscriber.eventName === '*' || subscriber.eventName === vagaroEvent.eventName) {
      try {
        subscriber.handler(vagaroEvent as VagaroEvent);
      } catch (error) {
        console.error(`[Vagaro] Handler error:`, error);
      }
    }
  });
}

// ============================================================================
// Listener Management
// ============================================================================

let isListening = false;

/**
 * Starts listening for Vagaro widget postMessage events.
 * Safe to call multiple times - only attaches listener once.
 */
export function startVagaroEventListener(): void {
  if (isListening) {
    console.log('[Vagaro] Listener already active');
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  // Add a catch-all debug listener that logs EVERYTHING
  window.addEventListener('message', (event) => {
    if (event.origin === 'https://www.vagaro.com') {
      console.log('%c[VAGARO postMessage]', 'background: green; color: white; font-size: 14px; padding: 4px;', event.data);
    }
  }, false);

  window.addEventListener('message', handleMessage, false);
  isListening = true;

  console.log('%c[Vagaro] Event listener STARTED - listening for messages from https://www.vagaro.com', 'background: #3b82f6; color: white; padding: 4px 8px;');
}

/**
 * Stops listening for Vagaro widget postMessage events.
 */
export function stopVagaroEventListener(): void {
  if (!isListening) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  window.removeEventListener('message', handleMessage, false);
  isListening = false;

  if (process.env.NODE_ENV === 'development') {
    console.log('[Vagaro Event] Listener stopped');
  }
}

/**
 * Checks if the listener is currently active.
 */
export function isVagaroEventListenerActive(): boolean {
  return isListening;
}

// ============================================================================
// Subscription API
// ============================================================================

/**
 * Subscribe to a specific Vagaro event.
 *
 * @param eventName - The event to subscribe to, or '*' for all events
 * @param handler - Callback function when event is received
 * @returns Unsubscribe function
 *
 * @example
 * // Subscribe to a specific event
 * const unsubscribe = subscribeToVagaroEvent('BookingCompleted', (event) => {
 *   console.log('Booking completed!', event.data);
 * });
 *
 * // Subscribe to all events
 * const unsubscribeAll = subscribeToVagaroEvent('*', (event) => {
 *   console.log('Event:', event.eventName);
 * });
 *
 * // Cleanup
 * unsubscribe();
 */
export function subscribeToVagaroEvent<T extends VagaroEventName>(
  eventName: T | '*',
  handler: VagaroEventHandler<T>
): VagaroEventUnsubscribe {
  const subscriber: Subscriber = {
    eventName,
    handler: handler as VagaroEventHandler<any>,
  };

  subscribers.add(subscriber);

  // Auto-start listener if not already running
  if (!isListening) {
    startVagaroEventListener();
  }

  return () => {
    subscribers.delete(subscriber);

    // Auto-stop listener if no subscribers left
    if (subscribers.size === 0) {
      stopVagaroEventListener();
    }
  };
}

/**
 * Get the current number of subscribers.
 * Useful for debugging.
 */
export function getSubscriberCount(): number {
  return subscribers.size;
}

/**
 * Clear all subscribers.
 * Useful for testing or cleanup.
 */
export function clearAllSubscribers(): void {
  subscribers.clear();
  stopVagaroEventListener();
}
