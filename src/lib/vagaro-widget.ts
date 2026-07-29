/**
 * Vagaro Widget URL Utilities
 *
 * Validates stored, generated Vagaro widget loader URLs.
 * See docs/VAGARO_BOOKING_CONTRACT.md before changing this integration.
 */

const VAGARO_BOOKING_HOSTS = new Set(['vagaro.com', 'www.vagaro.com'])

/**
 * Resolve the widget loader for one specific service.
 *
 * Vagaro issues a distinct version token in each stored widget URL. A loader
 * cannot be safely rebuilt from the five-character service code, so the
 * complete generated URL is the only accepted source.
 *
 * CRITICAL INTEGRATION CONTRACT:
 * Only a generated WidgetEmbeddedLoader URL is service-scoped. Neither
 * BusinessWidget.aspx nor the public /book-now URL becomes service-scoped by
 * adding a numeric ServiceID query parameter; both can render the full menu.
 * Keep this allowlist narrow and preserve the stored ?v= token. See
 * docs/VAGARO_BOOKING_CONTRACT.md before changing this resolver.
 */
export function resolveVagaroServiceWidgetUrl({
  widgetUrl,
}: {
  widgetUrl?: string | null
}): string | null {
  const trimmedUrl = widgetUrl?.trim()

  if (trimmedUrl) {
    try {
      const parsed = new URL(trimmedUrl)
      const isVagaroHost = VAGARO_BOOKING_HOSTS.has(parsed.hostname)
      const isWidgetLoader = parsed.pathname.includes('/resources/WidgetEmbeddedLoader/')
      const hasVersionToken = Boolean(parsed.searchParams.get('v')?.trim())

      if (parsed.protocol === 'https:' && isVagaroHost && isWidgetLoader && hasVersionToken) {
        return trimmedUrl
      }
    } catch {
      // Invalid stored URLs fail closed below.
    }
  }

  return null;
}
