import { getAllServices } from "@/actions/services"
import { ServicesSectionClient } from "./ServicesSectionClient"

export async function ServicesSection() {
  const services = await getAllServices()

  // Transform database format to component format
  const formattedServices = services.map(service => ({
    id: service.slug,
    mainCategory: service.categoryName || "Featured",
    subCategory: "",
    title: service.name,
    fullTitle: service.name,
    subtitle: service.subtitle || '',
    description: service.description,
    duration: `${service.durationMinutes} min`,
    price: `$${(service.priceStarting / 100).toFixed(0)}+`,
    image: service.imageUrl || '',
    color: service.color || 'sage',
    displayOrder: service.displayOrder
  }))

  const mainCategories = Array.from(
    new Set(formattedServices.map(service => service.mainCategory))
  ).sort()

  return (
    <ServicesSectionClient
      services={formattedServices}
      mainCategories={mainCategories}
    />
  )
}
