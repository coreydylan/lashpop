import { getServices } from "@/actions/services"
import { ServicesSectionClient } from "./ServicesSectionClient"

export async function ServicesSection() {
  const services = await getServices()

  // Transform database format to component format
  const formattedServices = services.map(service => ({
    id: service.slug,
    category: service.category || 'lashes',
    title: service.name,
    subtitle: service.subtitle || '',
    description: service.description,
    duration: `${service.durationMinutes} min`,
    price: `$${(service.priceStarting / 100).toFixed(0)}+`,
    image: service.imageUrl || '',
    color: service.color || 'sage'
  }))

  return <ServicesSectionClient services={formattedServices} />
}
