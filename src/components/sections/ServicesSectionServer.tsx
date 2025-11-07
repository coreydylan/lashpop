import { getAllServices, getMainCategories, getSubCategories } from "@/actions/services"
import { ServicesSectionClient } from "./ServicesSectionClient"

export async function ServicesSection() {
  const [services, mainCategories, subCategories] = await Promise.all([
    getAllServices(),
    getMainCategories(),
    getSubCategories()
  ])

  // Transform database format to component format
  const formattedServices = services.map(service => ({
    id: service.slug,
    mainCategory: service.mainCategory,
    subCategory: service.subCategory || '',
    title: service.displayTitle || service.name, // Use displayTitle if available, fallback to name
    fullTitle: service.name, // Keep full name for reference if needed
    subtitle: service.subtitle || '',
    description: service.description,
    duration: `${service.durationMinutes} min`,
    price: `$${(service.priceStarting / 100).toFixed(0)}+`,
    image: service.imageUrl || '',
    color: service.color || 'sage',
    displayOrder: service.displayOrder
  }))

  return (
    <ServicesSectionClient
      services={formattedServices}
      mainCategories={mainCategories}
      allSubCategories={subCategories}
    />
  )
}
