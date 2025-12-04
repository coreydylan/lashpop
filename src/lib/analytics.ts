// Type for GA4 window object
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

// Check if GA is available
export const isGAAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

// Track page view
export const trackPageView = (url: string, title?: string) => {
  if (!isGAAvailable()) return
  window.gtag?.('event', 'page_view', {
    page_path: url,
    page_title: title,
  })
}

// Track custom events
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (!isGAAvailable()) return
  window.gtag?.('event', eventName, parameters)
}

// Specific tracking functions for the booking flow
export const trackBookingStarted = (service?: string, provider?: string) => {
  trackEvent('booking_started', { service, provider })
}

export const trackBookingComplete = (service?: string, provider?: string, value?: number) => {
  trackEvent('booking_complete', { service, provider, value, currency: 'USD' })
}

export const trackServiceView = (serviceName: string, category?: string) => {
  trackEvent('service_view', { service_name: serviceName, category })
}

export const trackPhoneClick = () => {
  trackEvent('phone_click', { method: 'click' })
}

export const trackEmailClick = () => {
  trackEvent('email_click', { method: 'click' })
}

export const trackSocialClick = (platform: string) => {
  trackEvent('social_click', { platform })
}
