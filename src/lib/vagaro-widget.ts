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

// Fallback code for "all services" widget
const ALL_SERVICES_CODE = '6PmS0';

/**
 * Constructs a Vagaro widget URL from a service code
 * @param serviceCode - The 5-character service-specific code (e.g., "6XoR0")
 * @returns The full Vagaro widget URL
 */
export function getVagaroWidgetUrl(serviceCode: string | null | undefined): string {
  const code = serviceCode || ALL_SERVICES_CODE;
  return `https://www.vagaro.com//resources/WidgetEmbeddedLoader/${VAGARO_BUSINESS_PREFIX}${code}`;
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
} as const;
