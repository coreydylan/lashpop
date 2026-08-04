import widgetManifest from './vagaro-widget-manifest.json'

export interface BookingConfiguration {
  vagaroWidgetUrl?: string | null
  vagaroServiceCode?: string | null
  vagaroServiceId?: string | null
  serviceName?: string | null
  serviceCategory?: string | null
}

export interface ServiceSyncHealth {
  failed: number
  bookingMisconfigured: string[]
  bookingPending: string[]
}

/**
 * A booking mapping is structurally valid only when it contains Vagaro's
 * complete generated WidgetEmbeddedLoader URL and the generated version token.
 *
 * Do not weaken this to "any URL" or "a service code exists." Numeric
 * ServiceID URLs and BusinessWidget.aspx links can render the full menu, while
 * rebuilding a loader from a five-character code can use the wrong token.
 * When the numeric Vagaro service ID is available, the URL must also match the
 * checked-in manifest produced from Vagaro's authenticated widget builder.
 * This catches syntactically valid loaders copied onto the wrong service — the
 * failure mode that previously sent duplicate Microblading and Brow Shaping
 * rows to one another's booking screens.
 *
 * See ../../docs/VAGARO_BOOKING_CONTRACT.md.
 */
export function hasBookingConfiguration(service: BookingConfiguration): boolean {
  const widgetUrl = service.vagaroWidgetUrl?.trim()
  if (!widgetUrl) return false

  try {
    const parsed = new URL(widgetUrl)
    const isVagaroHost = parsed.hostname === 'vagaro.com' || parsed.hostname === 'www.vagaro.com'
    const isGeneratedLoader = parsed.pathname.includes('/resources/WidgetEmbeddedLoader/')
    const hasVersionToken = Boolean(parsed.searchParams.get('v')?.trim())

    const isGeneratedUrl =
      parsed.protocol === 'https:' &&
      isVagaroHost &&
      isGeneratedLoader &&
      hasVersionToken
    if (!isGeneratedUrl) return false

    const vagaroServiceId = service.vagaroServiceId?.trim()
    if (!vagaroServiceId) return true

    const verified = widgetManifest.mappings.find(
      mapping => mapping.vagaroServiceId === vagaroServiceId,
    )
    if (!verified || verified.widgetUrl !== widgetUrl) return false

    if (service.serviceName?.trim() && service.serviceName.trim() !== verified.name) {
      return false
    }
    if (
      service.serviceCategory?.trim() &&
      service.serviceCategory.trim() !== verified.category
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export function serviceSyncHealthError(health: ServiceSyncHealth): string | null {
  const issues: string[] = []

  if (health.failed > 0) {
    issues.push(`${health.failed} service record(s) failed`)
  }
  if (health.bookingMisconfigured.length > 0) {
    issues.push(
      `${health.bookingMisconfigured.length} active service(s) lack a verified Vagaro loader URL: ` +
      health.bookingMisconfigured.join(', ')
    )
  }
  if (health.bookingPending.length > 0) {
    issues.push(
      `${health.bookingPending.length} new service(s) are hidden pending a verified Vagaro loader URL: ` +
      health.bookingPending.join(', ')
    )
  }

  return issues.length > 0 ? issues.join(' | ') : null
}
