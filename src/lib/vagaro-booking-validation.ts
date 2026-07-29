import { getExternalBookingUrl } from './booking-routes'
import {
  getVagaroDirectBookingUrl,
  isVagaroDirectBookingUrl,
} from './vagaro-widget'

export interface ActiveServiceBookingRecord {
  id: string
  name: string
  categorySlug?: string | null
  mainCategory?: string | null
  vagaroServiceId?: string | null
  vagaroWidgetUrl?: string | null
}

export interface BookingMappingAudit {
  total: number
  vagaro: number
  external: number
  issues: string[]
}

/**
 * Validate the complete active-service booking contract.
 *
 * A service is valid when it either:
 * - matches an intentional external route, or
 * - has one unique numeric Vagaro ID that produces an exact inline iframe URL.
 */
export function auditActiveServiceBookings(
  services: ActiveServiceBookingRecord[],
): BookingMappingAudit {
  const issues: string[] = []
  const serviceIdOwners = new Map<string, ActiveServiceBookingRecord>()
  let vagaro = 0
  let external = 0

  for (const service of services) {
    if (getExternalBookingUrl(service)) {
      external += 1
      continue
    }

    const serviceId = service.vagaroServiceId?.trim()
    if (!serviceId || !/^\d+$/.test(serviceId)) {
      issues.push(`${service.name}: missing a numeric vagaro_service_id`)
      continue
    }

    const existingOwner = serviceIdOwners.get(serviceId)
    if (existingOwner) {
      issues.push(
        `${service.name}: Vagaro service ID ${serviceId} is already used by ${existingOwner.name}`,
      )
      continue
    }
    serviceIdOwners.set(serviceId, service)

    const directUrl = getVagaroDirectBookingUrl(serviceId)
    if (!directUrl || !isVagaroDirectBookingUrl(directUrl)) {
      issues.push(`${service.name}: service ID ${serviceId} did not produce a valid inline Vagaro URL`)
      continue
    }

    const mappedServiceId = new URL(directUrl).searchParams.get('ServiceID')
    if (mappedServiceId !== serviceId) {
      issues.push(
        `${service.name}: generated iframe maps ${mappedServiceId || 'no service'} instead of ${serviceId}`,
      )
      continue
    }

    const storedUrl = service.vagaroWidgetUrl?.trim()
    if (storedUrl?.includes('/Users/BusinessWidget.aspx')) {
      if (!isVagaroDirectBookingUrl(storedUrl)) {
        issues.push(`${service.name}: stored BusinessWidget URL is malformed or not service-scoped`)
        continue
      }

      const storedServiceId = new URL(storedUrl).searchParams.get('ServiceID')
      if (storedServiceId !== serviceId) {
        issues.push(
          `${service.name}: stored BusinessWidget maps ${storedServiceId || 'no service'} instead of ${serviceId}`,
        )
        continue
      }
    }

    vagaro += 1
  }

  if (services.length === 0) {
    issues.push('No active services were returned from the production database')
  }

  if (vagaro + external + issues.length < services.length) {
    issues.push('Booking audit did not account for every active service')
  }

  return {
    total: services.length,
    vagaro,
    external,
    issues,
  }
}
