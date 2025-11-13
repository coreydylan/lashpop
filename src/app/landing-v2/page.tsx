import { getAllServices } from "@/actions/services"
import { getTeamMembers } from "@/actions/team"
import LandingPageV2Client from "./LandingPageV2Client"

export default async function LandingPageV2() {
  // Fetch services from database
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

  // Fetch team members from database
  const teamMembers = await getTeamMembers()

  // Transform database format to component format
  const formattedTeamMembers = teamMembers.map((member, index) => ({
    id: index, // Use index as ID since UUID can't be converted to number
    name: member.name,
    role: member.role,
    type: member.type as 'employee' | 'independent',
    businessName: member.businessName || undefined,
    image: member.imageUrl,
    phone: member.phone,
    specialties: member.specialties as string[],
    bio: member.bio || undefined,
    quote: member.quote || undefined,
    availability: member.availability || undefined,
    instagram: member.instagram || undefined,
    bookingUrl: member.bookingUrl,
    favoriteServices: member.favoriteServices as string[] | undefined,
    funFact: member.funFact || undefined
  }))

  return <LandingPageV2Client services={formattedServices} mainCategories={mainCategories} teamMembers={formattedTeamMembers} />
}