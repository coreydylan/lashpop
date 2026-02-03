import { getAllServices } from "@/actions/services"
import { getTeamMembersWithServices } from "@/actions/team"
import { getHomepageReviews, getReviewStats } from "@/actions/reviews"
import { getInstagramPosts } from "@/actions/instagram"
import { getServiceCategories } from "@/actions/categories"
import { getFAQsGroupedByCategory } from "@/actions/faqs"
import { getSlideshowConfigs } from "@/actions/hero-slideshow"
import LandingPageV2Client from "./LandingPageV2Client"

// Ensure fresh data on each request (for admin-managed content)
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Fetch all data in parallel for faster loads
  const [
    services,
    teamMembers,
    reviews,
    reviewStats,
    instagramPosts,
    serviceCategories,
    faqData,
    heroConfig,
  ] = await Promise.all([
    getAllServices(),
    getTeamMembersWithServices(),
    getHomepageReviews(15),
    getReviewStats(),
    getInstagramPosts(20),
    getServiceCategories(),
    getFAQsGroupedByCategory(),
    getSlideshowConfigs(),
  ])

  // Format services for the drawer (keep hierarchy structure)
  const formattedServices = services.map(service => ({
    id: service.id || service.slug || `service-${service.name}`,
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
    subcategoryDisplayOrder: service.subcategoryDisplayOrder,
    vagaroWidgetUrl: service.vagaroWidgetUrl ?? undefined,
    vagaroServiceCode: service.vagaroServiceCode ?? undefined,
  }))

  // Transform database format to component format
  const formattedTeamMembers = teamMembers.map((member, index) => ({
    id: index, // Use index as ID since UUID can't be converted to number
    uuid: member.id, // Keep UUID for API calls
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
    funFact: member.funFact || undefined,
    // Quick facts from database
    quickFacts: member.quickFacts?.map((fact, index) => ({
      id: fact.id || `fact-${index}`,
      factType: fact.factType,
      customLabel: fact.customLabel,
      value: fact.value,
      customIcon: fact.customIcon,
      displayOrder: fact.displayOrder
    })) || [],
    // Photo crop URLs
    cropSquareUrl: member.cropSquareUrl || undefined,
    cropCloseUpCircleUrl: member.cropCloseUpCircleUrl || undefined,
    cropMediumCircleUrl: member.cropMediumCircleUrl || undefined,
    cropFullVerticalUrl: member.cropFullVerticalUrl || undefined,
  }))

  // Filter service categories to only include the main ones shown on the home page
  // These should match the defaultServiceCategories in ServicesSection.tsx
  const allowedCategorySlugs = ['lashes', 'brows', 'facials', 'waxing', 'permanent-makeup', 'specialty', 'injectables']
  const filteredServiceCategories = serviceCategories.filter(cat => allowedCategorySlugs.includes(cat.slug))

  return <LandingPageV2Client
    services={formattedServices}
    teamMembers={formattedTeamMembers}
    reviews={reviews}
    reviewStats={reviewStats}
    instagramPosts={instagramPosts}
    serviceCategories={filteredServiceCategories}
    faqData={faqData}
    heroConfig={heroConfig}
  />
}
