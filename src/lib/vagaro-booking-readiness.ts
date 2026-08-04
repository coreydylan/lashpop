import widgetManifest from '../../workers/vagaro-sync/src/vagaro-widget-manifest.json'

export type VagaroBookingStatus =
  | 'ready'
  | 'pending'
  | 'retired'
  | 'identity-drift'
  | 'url-mismatch'

export interface VagaroBookingIdentity {
  vagaroServiceId?: string | null
  name?: string | null
  category?: string | null
  widgetUrl?: string | null
  isActive?: boolean | null
}

interface ManifestMapping {
  vagaroServiceId: string
  name: string
  category: string
  widgetUrl: string
}

const mappingByServiceId = new Map(
  (widgetManifest.mappings as ManifestMapping[]).map((mapping) => [
    mapping.vagaroServiceId,
    mapping,
  ]),
)

/**
 * Compare a mirrored Vagaro service with the exact static widget snapshot that
 * was generated for it. This is intentionally stricter than URL validation:
 * a valid Vagaro loader copied to the wrong row is still unsafe.
 *
 * The public catalog sync can discover IDs, names, categories, prices, and
 * photos without a merchant login. Vagaro does not publish the static widget
 * snapshot returned by Booking Widget -> Save, so a missing mapping remains
 * pending until the authenticated refresh workflow generates it.
 *
 * See docs/VAGARO_BOOKING_CONTRACT.md before weakening these checks.
 */
export function getVagaroBookingStatus(
  service: VagaroBookingIdentity,
): VagaroBookingStatus {
  const serviceId = service.vagaroServiceId?.trim()
  if (!serviceId) return 'pending'

  const mapping = mappingByServiceId.get(serviceId)
  if (!mapping) {
    // Pre-public-sync rows used Vagaro's old encoded v2 IDs. Inactive encoded
    // rows are historical tombstones, not newly discovered public services.
    if (service.isActive === false && !/^\d+$/.test(serviceId)) return 'retired'
    return 'pending'
  }

  if (
    (service.name?.trim() && service.name.trim() !== mapping.name) ||
    (service.category?.trim() && service.category.trim() !== mapping.category)
  ) {
    return 'identity-drift'
  }

  if (service.widgetUrl?.trim() !== mapping.widgetUrl) {
    return 'url-mismatch'
  }

  return 'ready'
}

export function hasVerifiedVagaroBooking(
  service: VagaroBookingIdentity,
): boolean {
  return getVagaroBookingStatus(service) === 'ready'
}
