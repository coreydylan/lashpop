export interface BookingConfiguration {
  vagaroServiceId?: string | null
  vagaroWidgetUrl?: string | null
  vagaroServiceCode?: string | null
}

export interface ServiceSyncHealth {
  failed: number
  bookingMisconfigured: string[]
  bookingPending: string[]
}

export function hasBookingConfiguration(service: BookingConfiguration): boolean {
  const serviceId = service.vagaroServiceId?.trim()
  return Boolean(
    (serviceId && /^\d+$/.test(serviceId))
    || service.vagaroWidgetUrl?.trim()
    || service.vagaroServiceCode?.trim(),
  )
}

export function serviceSyncHealthError(health: ServiceSyncHealth): string | null {
  const issues: string[] = []

  if (health.failed > 0) {
    issues.push(`${health.failed} service record(s) failed`)
  }
  if (health.bookingMisconfigured.length > 0) {
    issues.push(
      `${health.bookingMisconfigured.length} active service(s) lack booking configuration: ` +
      health.bookingMisconfigured.join(', ')
    )
  }
  if (health.bookingPending.length > 0) {
    issues.push(
      `${health.bookingPending.length} new service(s) are hidden pending booking configuration: ` +
      health.bookingPending.join(', ')
    )
  }

  return issues.length > 0 ? issues.join(' | ') : null
}
