/**
 * Vagaro Widget Event Types
 *
 * Type definitions for all postMessage events sent by the Vagaro booking widget.
 * Reference: docs/vagaro-widget-events.md
 */

// ============================================================================
// Event Names
// ============================================================================

export type VagaroEventName =
  | 'WidgetLoaded'
  | 'TabClicked'
  | 'BookNowClicked'
  | 'ServiceSearched'
  | 'TimeSlotClicked'
  | 'FormViewed'
  | 'FormResponseSubmitted'
  | 'CustomerLogin'
  | 'CreditCardCaptureViewed'
  | 'GiftCardApplied'
  | 'PromoCodeApplied'
  | 'BookingCompleted'
  | 'ProductAddedToCart'
  | 'ProductRemovedFromCart';

// ============================================================================
// Event Data Payloads
// ============================================================================

export interface WidgetLoadedData {
  // No additional data
}

export interface TabClickedData {
  customerId?: string;
  tabName: string;
}

export interface BookNowClickedData {
  customerId?: string;
  serviceName?: string;
}

export interface ServiceSearchedData {
  customerId?: string;
  serviceName: string;
  serviceProvider: string;
  searchDate: string;
}

export interface TimeSlotClickedData {
  customerId?: string;
  serviceName: string;
  serviceProvider: string;
  selectedTimeSlot: number;
}

export interface FormViewedData {
  customerId: string;
  formName: string;
  formId: string;
}

export interface FormResponseSubmittedData {
  customerId: string;
  formName: string;
  formId: string;
}

export interface CustomerLoginData {
  customerId: string;
}

export interface CreditCardCaptureViewedData {
  customerId: string;
}

export interface GiftCardAppliedData {
  customerId: string;
  giftCardNumber: string;
}

export interface PromoCodeAppliedData {
  customerId: string;
  promoCode: string;
}

export interface BookingCompletedData {
  customerId: string;
  cardOnFile?: boolean;
}

export interface ProductAddedToCartData {
  customerId: string;
  productName: string;
  quantity: number;
}

export interface ProductRemovedFromCartData {
  productName: string;
}

// ============================================================================
// Event Payload Union
// ============================================================================

export type VagaroEventData =
  | WidgetLoadedData
  | TabClickedData
  | BookNowClickedData
  | ServiceSearchedData
  | TimeSlotClickedData
  | FormViewedData
  | FormResponseSubmittedData
  | CustomerLoginData
  | CreditCardCaptureViewedData
  | GiftCardAppliedData
  | PromoCodeAppliedData
  | BookingCompletedData
  | ProductAddedToCartData
  | ProductRemovedFromCartData;

// ============================================================================
// Raw Event Structure (from postMessage)
// ============================================================================

export interface VagaroRawEvent {
  eventName: VagaroEventName;
  timestamp: number;
  data: VagaroEventData | null;
}

// ============================================================================
// Typed Event Interfaces
// ============================================================================

export interface VagaroEvent<T extends VagaroEventName = VagaroEventName> {
  eventName: T;
  timestamp: number;
  data: T extends 'WidgetLoaded'
    ? WidgetLoadedData | null
    : T extends 'TabClicked'
    ? TabClickedData
    : T extends 'BookNowClicked'
    ? BookNowClickedData
    : T extends 'ServiceSearched'
    ? ServiceSearchedData
    : T extends 'TimeSlotClicked'
    ? TimeSlotClickedData
    : T extends 'FormViewed'
    ? FormViewedData
    : T extends 'FormResponseSubmitted'
    ? FormResponseSubmittedData
    : T extends 'CustomerLogin'
    ? CustomerLoginData
    : T extends 'CreditCardCaptureViewed'
    ? CreditCardCaptureViewedData
    : T extends 'GiftCardApplied'
    ? GiftCardAppliedData
    : T extends 'PromoCodeApplied'
    ? PromoCodeAppliedData
    : T extends 'BookingCompleted'
    ? BookingCompletedData
    : T extends 'ProductAddedToCart'
    ? ProductAddedToCartData
    : T extends 'ProductRemovedFromCart'
    ? ProductRemovedFromCartData
    : VagaroEventData | null;
}

// ============================================================================
// Booking Flow State
// ============================================================================

export type BookingFlowStep =
  | 'idle'
  | 'widget_loaded'
  | 'service_selected'
  | 'calendar_view'
  | 'login_view'
  | 'form_view'
  | 'payment_view'
  | 'completed';

export interface VagaroWidgetState {
  currentStep: BookingFlowStep;
  previousStep: BookingFlowStep | null;
  customerId: string | null;
  selectedService: string | null;
  selectedProvider: string | null;
  selectedTimeSlot: number | null;
  lastEventTimestamp: number | null;
  isLoaded: boolean;
  hasError: boolean;
}

// ============================================================================
// Crop Settings
// ============================================================================

export interface CropSettings {
  /** Negative margin to pull iframe up and hide header */
  marginTop: number;
  /** Minimum height to ensure content is visible */
  minHeight: number;
  /** Height of gradient mask at top */
  maskHeight: number;
}

// ============================================================================
// Event Handler Types
// ============================================================================

export type VagaroEventHandler<T extends VagaroEventName = VagaroEventName> = (
  event: VagaroEvent<T>
) => void;

export type VagaroEventUnsubscribe = () => void;
