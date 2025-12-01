import { getAllServices } from "@/actions/services"
import { getTeamMembersWithServices } from "@/actions/team"
import { getHomepageReviews, getReviewStats } from "@/actions/reviews"
import { getInstagramPosts } from "@/actions/instagram"
import { getServiceCategories } from "@/actions/categories"
import { getFAQsGroupedByCategory } from "@/actions/faqs"
import LandingPageV2Client from "./LandingPageV2Client"

// Ensure fresh data on each request (for admin-managed content)
export const dynamic = 'force-dynamic'

export default async function HomePage() {
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
    subcategorySlug: service.subcategorySlug,
    vagaroWidgetUrl: service.vagaroWidgetUrl ?? undefined,
    vagaroServiceCode: service.vagaroServiceCode ?? undefined,
  }))

  // Fetch team members from database with their service categories
  const teamMembers = await getTeamMembersWithServices()

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
    serviceCategories: member.serviceCategories, // Service categories from Vagaro
    bio: member.bio || undefined,
    quote: member.quote || undefined,
    availability: member.availability || undefined,
    instagram: member.instagram || undefined,
    bookingUrl: member.bookingUrl,
    favoriteServices: member.favoriteServices as string[] | undefined,
    funFact: member.funFact || undefined
  }))

  // Fetch reviews from database (uses admin-selected reviews if available)
  const reviews = await getHomepageReviews(15)

  // Fetch review stats from database
  const reviewStats = await getReviewStats()

  // Fetch Instagram posts
  const instagramPosts = await getInstagramPosts(20)

  // Fetch service categories
  const serviceCategories = await getServiceCategories()

  // Fetch FAQs
  const faqData = await getFAQsGroupedByCategory()

  return <LandingPageV2Client
    services={formattedServices}
    teamMembers={formattedTeamMembers}
    reviews={reviews}
    reviewStats={reviewStats}
    instagramPosts={instagramPosts}
    serviceCategories={serviceCategories}
    faqData={faqData}
  />
}
