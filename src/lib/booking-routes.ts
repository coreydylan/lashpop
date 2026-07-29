export const NATURTOX_BOOKING_URL = 'https://www.naturtox.com/'

interface BookingRouteService {
  name?: string | null
  categorySlug?: string | null
  mainCategory?: string | null
}

/**
 * Return the explicit non-Vagaro booking destination for a service.
 *
 * Keep intentional exceptions here so the frontend and the booking audit use
 * the same rule. Every service not matched here must have a numeric Vagaro ID.
 */
export function getExternalBookingUrl({
  name,
  categorySlug,
  mainCategory,
}: BookingRouteService): string | null {
  const normalizedCategory = (categorySlug || mainCategory || '').trim().toLowerCase()

  if (normalizedCategory === 'injectables' || /\bbotox\b/i.test(name || '')) {
    return NATURTOX_BOOKING_URL
  }

  return null
}
