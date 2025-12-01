/**
 * Vagaro Widget Events
 *
 * Public API for interacting with Vagaro booking widget events.
 */

// Types
export type {
  VagaroEventName,
  VagaroEvent,
  VagaroRawEvent,
  VagaroEventData,
  VagaroEventHandler,
  VagaroEventUnsubscribe,
  BookingFlowStep,
  VagaroWidgetState,
  CropSettings,
  // Individual event data types
  WidgetLoadedData,
  TabClickedData,
  BookNowClickedData,
  ServiceSearchedData,
  TimeSlotClickedData,
  FormViewedData,
  FormResponseSubmittedData,
  CustomerLoginData,
  CreditCardCaptureViewedData,
  GiftCardAppliedData,
  PromoCodeAppliedData,
  BookingCompletedData,
  ProductAddedToCartData,
  ProductRemovedFromCartData,
} from './types';

// Config
export {
  VAGARO_EVENT_CONFIG,
  EVENT_TO_STEP,
  CROP_CONFIG,
  VAGARO_ORIGIN,
  CROP_TRANSITION_DURATION,
} from './config';

// Listener
export {
  startVagaroEventListener,
  stopVagaroEventListener,
  isVagaroEventListenerActive,
  subscribeToVagaroEvent,
  getSubscriberCount,
  clearAllSubscribers,
} from './listener';
