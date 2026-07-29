/**
 * Vagaro Widget URL Utilities
 *
 * Handles constructing Vagaro embedded widget URLs from service codes.
 * The widget URLs follow this pattern:
 * https://www.vagaro.com//resources/WidgetEmbeddedLoader/[BUSINESS_PREFIX][SERVICE_CODE]
 */

// Business-specific prefix that identifies the Vagaro account
// This is constant for all services in the LashPop account
const VAGARO_BUSINESS_PREFIX = 'OZqsEJatCoPqFJ1y6BuSdBuOc1WJD1wOc1WO61Ctdg4tjxMG9pUxapkUcvCu7gCmjZcoapOUc9CvdfQOapkvdfoR';

// Version parameter required by Vagaro's widget loader
// Without this, the script loads but doesn't initialize the iframe
const VAGARO_VERSION_PARAM = '?v=hiLxqW4Klh4bZZdrYo8KnJ4QSz12Y9nutihT1iqCSyC#';

// Fallback code for "all services" widget
const ALL_SERVICES_CODE = '6PmS0';
const VAGARO_BOOKING_HOSTS = new Set(['vagaro.com', 'www.vagaro.com'])

/**
 * LashPop's public Vagaro BusinessWidget page.
 *
 * Vagaro's generated loader scripts eventually create this same iframe. The
 * opaque `enc` value identifies LashPop's public widget configuration; it is
 * shipped to every browser by Vagaro and is not a credential. Keeping one
 * canonical iframe template lets the current numeric service ID be the only
 * per-service mapping we maintain.
 *
 * `WidgetServiceId=0` is intentional. Old generated widgets retain a category
 * snapshot, which is why moved services such as Fine Line Tattoos could fall
 * back to the full menu. Clearing that snapshot and setting `ServiceID`
 * selects the exact current service.
 */
const VAGARO_DIRECT_BOOKING_PREFIX =
  'https://www.vagaro.com/Users/BusinessWidget.aspx?enc=MMLjhIwJMcwFQhXLL7ifVNktU+6gVG/xKebyJuJZAstemTnIIIKeu0QS8AhhSYXpPqb0D/obnhonLWVrRgENjVYs3JtTfqU8CaATRsRBExg82SjvbpaaJj/xgNGXz9tP05/mSHjXeIApPZOQ4417unuF/38gFm4LOsgznCtFcvfknouEkPRJzvFjgmuZxsCNNphibWlOXi33Q+uLIVjw6vX1VL6XX8djewz8V40GVgMfLfP7uXi/mcXkrtXYvUIp4qx4pm/R3xAWN1Z9ofHT3QCL3nrJ4nkPHE2HRtPKY0JjR4hn+ZSBmqPbWJ9nRi/SGr0fTbA5Zyv2g0HIy+Ht02Xc76Exb4O+SzfHKIrBxsJ5di+3pYTzSApYcOh7UtEydX4Rpd3IqiwPyLSYK71oTVWK23zdCOAmznJf2gftBwc=&WidgetServiceId=0&ServiceID='

/**
 * Constructs a Vagaro widget URL from a service code
 * @param serviceCode - The 5-character service-specific code (e.g., "6XoR0")
 * @returns The full Vagaro widget URL with version parameter
 */
export function getVagaroWidgetUrl(serviceCode: string | null | undefined): string {
  const code = serviceCode || ALL_SERVICES_CODE;
  return `https://www.vagaro.com//resources/WidgetEmbeddedLoader/${VAGARO_BUSINESS_PREFIX}${code}${VAGARO_VERSION_PARAM}`;
}

/**
 * Build LashPop's inline Vagaro iframe URL for one exact numeric service.
 */
export function getVagaroDirectBookingUrl(
  serviceId: string | null | undefined,
): string | null {
  const trimmedId = serviceId?.trim()
  if (!trimmedId || !/^\d+$/.test(trimmedId)) return null

  return `${VAGARO_DIRECT_BOOKING_PREFIX}${trimmedId}`
}

/**
 * Returns true only for Vagaro's service-specific embeddable booking page.
 *
 * A plain `/book-now?ServiceId=...` URL does not preserve the service in
 * Vagaro. Their generated BusinessWidget iframe does recognize `ServiceID`,
 * so stale widget configurations can use that page directly while keeping
 * the booking flow inline.
 */
export function isVagaroDirectBookingUrl(url: string | null | undefined): boolean {
  const trimmedUrl = url?.trim()
  if (!trimmedUrl) return false

  try {
    const parsed = new URL(trimmedUrl)
    const serviceId = parsed.searchParams.get('ServiceID')
    const widgetServiceId = parsed.searchParams.get('WidgetServiceId')

    return (
      parsed.protocol === 'https:' &&
      VAGARO_BOOKING_HOSTS.has(parsed.hostname) &&
      parsed.pathname.toLowerCase() === '/users/businesswidget.aspx' &&
      Boolean(parsed.searchParams.get('enc')) &&
      widgetServiceId === '0' &&
      Boolean(serviceId && /^\d+$/.test(serviceId))
    )
  } catch {
    return false
  }
}

/**
 * Resolve the widget loader for one specific service.
 *
 * Vagaro issues a distinct version token in each stored widget URL. Rebuilding
 * every URL with the account-level token can make Vagaro open a different
 * service, so a valid stored URL must win over the derived-code fallback.
 */
export function resolveVagaroServiceWidgetUrl({
  widgetUrl,
  serviceCode,
}: {
  widgetUrl?: string | null
  serviceCode?: string | null
}): string | null {
  const trimmedUrl = widgetUrl?.trim()

  if (trimmedUrl) {
    try {
      const parsed = new URL(trimmedUrl)
      const isVagaroHost = VAGARO_BOOKING_HOSTS.has(parsed.hostname)
      const isWidgetLoader = parsed.pathname.includes('/resources/WidgetEmbeddedLoader/')

      if (parsed.protocol === 'https:' && isVagaroHost && isWidgetLoader) {
        return trimmedUrl
      }
    } catch {
      // Invalid stored URLs fall through to the service-code fallback.
    }
  }

  const trimmedCode = serviceCode?.trim()
  return trimmedCode ? getVagaroWidgetUrl(trimmedCode) : null
}

/**
 * Extracts the service code from a full Vagaro widget URL
 * @param url - The full Vagaro widget URL
 * @returns The 5-character service code, or null if invalid
 */
export function extractVagaroServiceCode(url: string): string | null {
  if (!url) return null;

  // Remove query params and hash
  const cleanUrl = url.split('?')[0].split('#')[0];

  // Check if it's a valid Vagaro widget URL
  if (!cleanUrl.includes('WidgetEmbeddedLoader/')) {
    return null;
  }

  // Extract everything after the business prefix
  const afterLoader = cleanUrl.split('WidgetEmbeddedLoader/')[1];
  if (!afterLoader || afterLoader.length < VAGARO_BUSINESS_PREFIX.length) {
    return null;
  }

  // The service code is everything after the business prefix
  const serviceCode = afterLoader.slice(VAGARO_BUSINESS_PREFIX.length);

  // Validate: codes are typically 5 characters
  if (serviceCode.length >= 4 && serviceCode.length <= 6) {
    return serviceCode;
  }

  return null;
}

/**
 * Gets the all-services widget URL (shows full service menu)
 */
export function getAllServicesWidgetUrl(): string {
  return getVagaroWidgetUrl(ALL_SERVICES_CODE);
}

// Export constants for reference
export const VAGARO_CONSTANTS = {
  BUSINESS_PREFIX: VAGARO_BUSINESS_PREFIX,
  ALL_SERVICES_CODE,
  DIRECT_BOOKING_PREFIX: VAGARO_DIRECT_BOOKING_PREFIX,
} as const;
