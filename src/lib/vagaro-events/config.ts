/**
 * Vagaro Widget Event Listener Configuration
 *
 * Toggle individual event listeners on/off.
 * When an event is disabled, the listener ignores it (no processing, no state updates).
 *
 * To enable/disable a listener, simply change the boolean value.
 */

import type { VagaroEventName, BookingFlowStep, CropSettings } from './types';

// ============================================================================
// EVENT TOGGLES
// ============================================================================

export const VAGARO_EVENT_CONFIG: Record<VagaroEventName, boolean> = {
  // ---------------------------------------------------------------------------
  // LIFECYCLE EVENTS
  // ---------------------------------------------------------------------------
  /** Widget finished loading */
  WidgetLoaded: true,

  // ---------------------------------------------------------------------------
  // NAVIGATION EVENTS
  // ---------------------------------------------------------------------------
  /** User clicked a tab (Services, Classes, Gift Cards) */
  TabClicked: false,

  // ---------------------------------------------------------------------------
  // SERVICE SELECTION EVENTS
  // ---------------------------------------------------------------------------
  /** User clicked "Book Now" or "Request" on a service */
  BookNowClicked: true,

  /** User searched for a service */
  ServiceSearched: false,

  // ---------------------------------------------------------------------------
  // SCHEDULING EVENTS
  // ---------------------------------------------------------------------------
  /** User selected a time slot */
  TimeSlotClicked: true,

  // ---------------------------------------------------------------------------
  // FORM EVENTS
  // ---------------------------------------------------------------------------
  /** Form was displayed to user */
  FormViewed: true,

  /** User submitted form response */
  FormResponseSubmitted: true,

  // ---------------------------------------------------------------------------
  // AUTHENTICATION EVENTS
  // ---------------------------------------------------------------------------
  /** User logged in */
  CustomerLogin: true,

  // ---------------------------------------------------------------------------
  // PAYMENT EVENTS
  // ---------------------------------------------------------------------------
  /** Credit card form displayed */
  CreditCardCaptureViewed: true,

  /** Gift card applied */
  GiftCardApplied: false,

  /** Promo code applied */
  PromoCodeApplied: false,

  // ---------------------------------------------------------------------------
  // BOOKING COMPLETION
  // ---------------------------------------------------------------------------
  /** Booking successfully completed */
  BookingCompleted: true,

  // ---------------------------------------------------------------------------
  // CART EVENTS
  // ---------------------------------------------------------------------------
  /** Product added to cart */
  ProductAddedToCart: false,

  /** Product removed from cart */
  ProductRemovedFromCart: false,
};

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

/**
 * Maps Vagaro events to booking flow steps.
 * Used by the state machine to determine which step the user is on.
 */
export const EVENT_TO_STEP: Partial<Record<VagaroEventName, BookingFlowStep>> = {
  WidgetLoaded: 'widget_loaded',
  BookNowClicked: 'service_selected',
  TimeSlotClicked: 'calendar_view',
  CustomerLogin: 'login_view',
  FormViewed: 'form_view',
  CreditCardCaptureViewed: 'payment_view',
  BookingCompleted: 'completed',
};

// ============================================================================
// CROP CONFIGURATION
// ============================================================================

/**
 * Crop settings for each booking flow step (DESKTOP).
 *
 * These values control how much of the Vagaro widget header is hidden
 * and the minimum height of the widget container.
 *
 * Adjust these values based on testing with the actual widget.
 */
export const CROP_CONFIG: Record<BookingFlowStep, CropSettings> = {
  idle: {
    marginTop: -330,
    minHeight: 800,
    maskHeight: 30,
  },
  widget_loaded: {
    marginTop: -330,
    minHeight: 800,
    maskHeight: 30,
  },
  service_selected: {
    marginTop: -280,
    minHeight: 750,
    maskHeight: 25,
  },
  calendar_view: {
    marginTop: -250,
    minHeight: 900,
    maskHeight: 20,
  },
  login_view: {
    marginTop: -200,
    minHeight: 550,
    maskHeight: 15,
  },
  form_view: {
    marginTop: -220,
    minHeight: 700,
    maskHeight: 15,
  },
  payment_view: {
    marginTop: -180,
    minHeight: 500,
    maskHeight: 10,
  },
  completed: {
    marginTop: -150,
    minHeight: 400,
    maskHeight: 5,
  },
};

/**
 * Crop settings for each booking flow step (MOBILE).
 *
 * Mobile screens need less aggressive cropping because:
 * 1. Less vertical space means less header to hide
 * 2. Content needs to be visible without excessive scrolling
 * 3. Touch targets need to remain accessible
 */
export const CROP_CONFIG_MOBILE: Record<BookingFlowStep, CropSettings> = {
  idle: {
    marginTop: -180,
    minHeight: 600,
    maskHeight: 20,
  },
  widget_loaded: {
    marginTop: -180,
    minHeight: 600,
    maskHeight: 20,
  },
  service_selected: {
    marginTop: -150,
    minHeight: 550,
    maskHeight: 15,
  },
  calendar_view: {
    marginTop: -130,
    minHeight: 700,
    maskHeight: 15,
  },
  login_view: {
    marginTop: -100,
    minHeight: 450,
    maskHeight: 10,
  },
  form_view: {
    marginTop: -120,
    minHeight: 550,
    maskHeight: 10,
  },
  payment_view: {
    marginTop: -100,
    minHeight: 400,
    maskHeight: 8,
  },
  completed: {
    marginTop: -80,
    minHeight: 350,
    maskHeight: 5,
  },
};

// ============================================================================
// ORIGIN VALIDATION
// ============================================================================

/** Trusted origin for Vagaro widget postMessage events */
export const VAGARO_ORIGIN = 'https://www.vagaro.com';

// ============================================================================
// TRANSITION ANIMATION
// ============================================================================

/** Duration in ms for crop transition animations */
export const CROP_TRANSITION_DURATION = 300;
