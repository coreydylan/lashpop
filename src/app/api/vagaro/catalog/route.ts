import { asc, isNotNull } from 'drizzle-orm'
import { getDb } from '@/db'
import { services } from '@/db/schema/services'
import { getVagaroBookingStatus } from '@/lib/vagaro-booking-readiness'

export const dynamic = 'force-dynamic'

/**
 * Login-free mirror of the public Vagaro service catalog.
 *
 * This endpoint is the programmatic discovery surface for future services:
 * the Cloudflare worker refreshes the mirror three times daily, including
 * inactive rows that are deliberately held back while their static Vagaro
 * booking snapshot is pending. No merchant cookies or private API credentials
 * are exposed here.
 */
export async function GET() {
  const db = getDb()
  const rows = await db
    .select({
      vagaroServiceId: services.vagaroServiceId,
      name: services.name,
      category: services.mainCategory,
      isActive: services.isActive,
      widgetUrl: services.vagaroWidgetUrl,
      lastSyncedAt: services.lastSyncedAt,
      displayOrder: services.displayOrder,
    })
    .from(services)
    .where(isNotNull(services.vagaroServiceId))
    .orderBy(asc(services.displayOrder))

  const catalog = rows.map((service) => ({
    vagaroServiceId: service.vagaroServiceId,
    name: service.name,
    category: service.category,
    isActive: service.isActive,
    bookingStatus: getVagaroBookingStatus(service),
    lastSyncedAt: service.lastSyncedAt,
  }))
  const ready = catalog.filter((service) => service.bookingStatus === 'ready')
  const needsAttention = catalog.filter(
    (service) => service.bookingStatus !== 'ready' && service.isActive,
  )
  const pending = catalog.filter(
    (service) => service.bookingStatus === 'pending' && !service.isActive,
  )
  const lastSyncedAt = catalog.reduce<Date | null>((latest, service) => {
    if (!service.lastSyncedAt) return latest
    const current = new Date(service.lastSyncedAt)
    return !latest || current > latest ? current : latest
  }, null)

  return Response.json(
    {
      source: 'LashPop public Vagaro mirror',
      schedule: '06:00, 14:00, and 22:00 UTC',
      lastSyncedAt,
      counts: {
        total: catalog.length,
        active: catalog.filter((service) => service.isActive).length,
        ready: ready.length,
        pending: pending.length,
        retired: catalog.filter((service) => service.bookingStatus === 'retired').length,
        needsAttention: needsAttention.length,
      },
      services: catalog,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    },
  )
}
