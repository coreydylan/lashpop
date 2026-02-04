/**
 * Services Schema Component
 *
 * Generates JSON-LD structured data for services offered.
 * Uses Service schema type for better representation in search results.
 */

import { getDb } from '@/db'
import { services } from '@/db/schema/services'
import { serviceCategories } from '@/db/schema/service_categories'
import { eq } from 'drizzle-orm'

interface Service {
  id: string
  name: string
  description: string | null
  priceStarting: number | null
  durationMinutes: number | null
  categoryName: string | null
}

interface ServicesSchemaProps {
  siteSettings: {
    businessName: string
    siteUrl: string
  }
}

async function getServices(): Promise<Service[]> {
  try {
    const db = getDb()
    const results = await db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        priceStarting: services.priceStarting,
        durationMinutes: services.durationMinutes,
        categoryName: serviceCategories.name
      })
      .from(services)
      .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(services.isActive, true))
      .limit(100)

    return results
  } catch {
    return []
  }
}

export async function ServicesSchema({ siteSettings }: ServicesSchemaProps) {
  const serviceList = await getServices()

  if (serviceList.length === 0) {
    return null
  }

  // Group services by category
  const servicesByCategory = serviceList.reduce((acc, service) => {
    const category = service.categoryName || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  // Create ItemList schema for services
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Services offered by ${siteSettings.businessName}`,
    itemListElement: serviceList.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.name,
        description: service.description || `${service.name} service`,
        provider: {
          '@id': `${siteSettings.siteUrl}/#organization`
        },
        ...(service.priceStarting && {
          offers: {
            '@type': 'Offer',
            price: service.priceStarting,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock'
          }
        }),
        ...(service.durationMinutes && {
          serviceOutput: {
            '@type': 'Thing',
            name: service.name
          }
        }),
        ...(service.categoryName && {
          serviceType: service.categoryName
        })
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default ServicesSchema
