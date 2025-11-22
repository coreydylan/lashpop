import { getAllServices } from "@/actions/services"
import { getTeamMembers } from "@/actions/team"
import { getHighRatedReviews, getReviewStats } from "@/actions/reviews"
import { getInstagramPosts } from "@/actions/instagram"
import LandingPageV2Client from "./LandingPageV2Client"

export default async function LandingPageV2() {
  // Fetch services from database
  const services = await getAllServices()

  // Format services for the drawer (keep hierarchy structure)
  const formattedServices = services.map(service => ({
    id: service.slug,
    name: service.name,
    slug: service.slug,
    subtitle: service.subtitle,
    description: service.description,
    durationMinutes: service.durationMinutes,
    priceStarting: service.priceStarting,
    imageUrl: service.imageUrl,
    color: service.color,
    displayOrder: service.displayOrder,
    categoryName: service.categoryName,
    categorySlug: service.categorySlug,
    subcategoryName: service.subcategoryName,
    subcategorySlug: service.subcategorySlug
  }))

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

  // Fetch reviews from database
  const reviews = await getHighRatedReviews(15)

  // Fetch review stats from database
  const reviewStats = await getReviewStats()

  // Fetch Instagram posts
  const instagramPosts = await getInstagramPosts(20)

  return <LandingPageV2Client
    services={formattedServices}
    teamMembers={formattedTeamMembers}
    reviews={reviews}
    reviewStats={reviewStats}
    instagramPosts={instagramPosts}
  />
}