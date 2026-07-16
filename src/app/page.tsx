import { getAllServices } from "@/actions/services"
import { getTeamMembersWithServices } from "@/actions/team"
import { getHomepageReviews, getReviewStats } from "@/actions/reviews"
import { getInstagramPosts, getInstagramSettings } from "@/actions/instagram"
import { getServiceCategories } from "@/actions/categories"
import { getFAQsGroupedByCategory } from "@/actions/faqs"
import { getSlideshowConfigs } from "@/actions/hero-slideshow"
import { getSEOSettings } from "@/actions/seo"
import { getStudioSettings } from "@/actions/studio"
import { getFounderLetter } from "@/actions/founder-letter"
import { getHomepageServices } from "@/actions/homepage-services"
import { ReviewSchema } from "@/components/seo"
import LandingPageV2Client from "./LandingPageV2Client"

// Ensure fresh data on each request (for admin-managed content)
export const dynamic = 'force-dynamic'
// Allow up to 60 seconds for database queries
export const maxDuration = 60

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
    seoSettings,
    studio,
    founderLetterContent,
    homepageServices,
    instagramSettings,
  ] = await Promise.all([
    getAllServices(),
    getTeamMembersWithServices(),
    getHomepageReviews(15),
    getReviewStats(),
    getInstagramPosts(),
    getServiceCategories(),
    getFAQsGroupedByCategory(),
    getSlideshowConfigs(),
    getSEOSettings(),
    getStudioSettings(),
    getFounderLetter(),
    getHomepageServices(),
    getInstagramSettings(),
  ])

  // Homepage "Choose a Service" marketing cards (editable in admin). Only the
  // enabled cards render; shape matches ServicesSection's ServiceCategory.
  const homepageServiceCards = homepageServices.cards
    .filter((card) => card.enabled)
    .map((card) => ({
      id: card.id,
      slug: card.slug,
      title: card.title,
      tagline: card.tagline,
      description: card.description,
      icon: card.icon,
    }))

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
    // Vagaro is source of truth for staff photos; fall back to local imageUrl, then nothing.
    image: member.vagaroPhotoUrl || member.imageUrl,
    phone: member.phone,
    // Component types still carry a `specialties` field for legacy mock data
    // and orchestrator handoff; the live DB column is gone. Pass the same
    // serviceCategories array so any downstream fallback path sees something
    // sensible instead of an empty placeholder.
    specialties: member.serviceCategories ?? [],
    serviceCategories: member.serviceCategories, // From dual-mode router in actions/team.ts
    // Vagaro bio (BusinessSummary) wins; fall back to locally-entered bio
    bio: member.vagaroBio || member.bio || undefined,
    quote: member.quote || undefined,
    availability: member.availability || undefined,
    instagram: member.instagram || undefined,
    instagramUrl: member.instagramUrl || undefined,
    bookingUrl: member.bookingUrl,
    usesLashpopBooking: member.usesLashpopBooking,
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
    credentials: (member.credentials as any[] | null) || [],
    // Photo crop URLs
    cropSquareUrl: member.cropSquareUrl || undefined,
    cropCloseUpCircleUrl: member.cropCloseUpCircleUrl || undefined,
    cropMediumCircleUrl: member.cropMediumCircleUrl || undefined,
    cropFullVerticalUrl: member.cropFullVerticalUrl || undefined,
  }))

  return <>
    <LandingPageV2Client
      services={formattedServices}
      teamMembers={formattedTeamMembers}
      reviews={reviews}
      reviewStats={reviewStats}
      instagramPosts={instagramPosts}
      instagramSettings={instagramSettings}
      serviceCategories={serviceCategories}
      homepageServices={homepageServiceCards}
      faqData={faqData}
      heroConfig={heroConfig}
      studio={studio}
      founderLetterContent={founderLetterContent}
    />
    {/* Keep review JSON-LD aligned with the reviews visitors can actually see. */}
    <ReviewSchema siteSettings={seoSettings.site} reviews={reviews} maxReviews={15} />
  </>
}
