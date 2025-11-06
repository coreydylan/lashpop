'use server'

import { getVagaroClient } from '@/lib/vagaro-client'

/**
 * Fetch all services from Vagaro API
 */
export async function getVagaroServices() {
  try {
    const client = getVagaroClient()
    const services = await client.getServices()

    // Transform Vagaro services to match our frontend format
    return services
      .filter(s => s.status === 'active')
      .map(service => ({
        id: service.service_id,
        name: service.name,
        category: service.category,
        description: service.description,
        duration: service.duration_minutes,
        price: service.price,
        priceRange: service.price_range
          ? {
              min: service.price_range.min,
              max: service.price_range.max,
            }
          : undefined,
        imageUrl: service.image_url,
        requiresConsultation: service.requires_consultation,
        depositRequired: service.deposit_required,
        depositAmount: service.deposit_amount,
        addOns: service.add_ons,
        cancellationPolicy: service.cancellation_policy,
      }))
  } catch (error) {
    console.error('Failed to fetch Vagaro services:', error)
    throw new Error('Failed to fetch services from Vagaro')
  }
}

/**
 * Fetch services by category from Vagaro API
 */
export async function getVagaroServicesByCategory(category: string) {
  try {
    const client = getVagaroClient()
    const services = await client.getServices({ category })

    return services
      .filter(s => s.status === 'active')
      .map(service => ({
        id: service.service_id,
        name: service.name,
        category: service.category,
        description: service.description,
        duration: service.duration_minutes,
        price: service.price,
        priceRange: service.price_range,
        imageUrl: service.image_url,
        requiresConsultation: service.requires_consultation,
        depositRequired: service.deposit_required,
      }))
  } catch (error) {
    console.error(`Failed to fetch Vagaro services for category ${category}:`, error)
    throw new Error(`Failed to fetch ${category} services from Vagaro`)
  }
}

/**
 * Group services by category
 */
export async function getVagaroServicesGrouped() {
  try {
    const services = await getVagaroServices()

    const grouped = services.reduce((acc, service) => {
      const category = service.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(service)
      return acc
    }, {} as Record<string, typeof services>)

    return grouped
  } catch (error) {
    console.error('Failed to group Vagaro services:', error)
    throw new Error('Failed to fetch and group services from Vagaro')
  }
}
