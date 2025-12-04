import { getAllServices } from "@/actions/services"
import { getTeamMembersWithServices } from "@/actions/team"
import { getHomepageReviews, getReviewStats } from "@/actions/reviews"
import { getInstagramPosts } from "@/actions/instagram"
import { getServiceCategories } from "@/actions/categories"
import { getFAQsGroupedByCategory } from "@/actions/faqs"
import { getSlideshowConfigs } from "@/actions/hero-slideshow"
import { getBusinessInfo, getSocialLinks, getServiceAreas, getOpeningHours } from '@/actions/site-settings'
import { LocalBusinessSchema } from '@/components/seo'
import LandingPageV2Client from "./LandingPageV2Client"

// Ensure fresh data on each request (for admin-managed content)
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Fetch site settings from database
  const [businessInfo, socialLinks, serviceAreas, openingHours] = await Promise.all([
    getBusinessInfo(),
    getSocialLinks(),
    getServiceAreas(),
    getOpeningHours()
  ])

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
    quickFacts: member.quickFacts?.map(fact => ({
      id: fact.id,
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

  // Fetch reviews from database (uses admin-selected reviews if available)
  const reviews = await getHomepageReviews(15)

  // Fetch review stats from database
  const reviewStats = await getReviewStats()

  // Calculate total reviews and average rating for SEO schema
  const totalReviews = reviewStats.reduce((sum, stat) => sum + stat.reviewCount, 0)
  const averageRating = reviewStats.length > 0
    ? reviewStats.reduce((sum, stat) => sum + parseFloat(stat.rating) * stat.reviewCount, 0) / totalReviews
    : 5.0

  // Fetch Instagram posts
  const instagramPosts = await getInstagramPosts(20)

  // Fetch service categories
  const serviceCategories = await getServiceCategories()

  // Fetch FAQs
  const faqData = await getFAQsGroupedByCategory()

  // Fetch hero slideshow/image settings (includes fallback to single image)
  const heroConfig = await getSlideshowConfigs()

  return (
    <>
      <LocalBusinessSchema
        totalReviews={totalReviews}
        averageRating={averageRating}
        businessInfo={{
          ...businessInfo,
          url: 'https://lashpopstudios.com',
          description: 'Award-winning lash extension studio in Oceanside, CA',
          telephone: businessInfo.phone,
        }}
        socialLinks={socialLinks}
        serviceAreas={serviceAreas.cities}
        openingHours={openingHours}
      />
      <LandingPageV2Client
        services={formattedServices}
        teamMembers={formattedTeamMembers}
        reviews={reviews}
        reviewStats={reviewStats}
        instagramPosts={instagramPosts}
        serviceCategories={serviceCategories}
        faqData={faqData}
        heroConfig={heroConfig}
        businessInfo={businessInfo}
        socialLinks={socialLinks}
        serviceAreas={serviceAreas}
        openingHours={openingHours}
      />
    </>
  )
}
