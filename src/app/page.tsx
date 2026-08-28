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
import { getHeroContent } from "@/actions/hero-content"
import { ReviewSchema } from "@/components/seo"
import { resolveTeamPhotoParity } from "@/lib/team-portrait"
import LandingPageV2Client from "./LandingPageV2Client"
import type { CarouselDisplayPhoto } from '@/actions/work-with-us-carousel'

type HomePageData = {
  services: Awaited<ReturnType<typeof getAllServices>>
  teamMembers: Awaited<ReturnType<typeof getTeamMembersWithServices>>
  reviews: Awaited<ReturnType<typeof getHomepageReviews>>
  reviewStats: Awaited<ReturnType<typeof getReviewStats>>
  instagramPosts: Awaited<ReturnType<typeof getInstagramPosts>>
  serviceCategories: Awaited<ReturnType<typeof getServiceCategories>>
  faqData: Awaited<ReturnType<typeof getFAQsGroupedByCategory>>
  heroConfig: Awaited<ReturnType<typeof getSlideshowConfigs>>
  seoSettings: Awaited<ReturnType<typeof getSEOSettings>>
  studio: Awaited<ReturnType<typeof getStudioSettings>>
  founderLetterContent: Awaited<ReturnType<typeof getFounderLetter>>
  homepageServices: Awaited<ReturnType<typeof getHomepageServices>>
  instagramSettings: Awaited<ReturnType<typeof getInstagramSettings>>
  heroContent: Awaited<ReturnType<typeof getHeroContent>>
  workWithUsPhotos: CarouselDisplayPhoto[]
}

async function getHomePageData(): Promise<HomePageData> {
  if (process.env.PLAYWRIGHT_FIXTURES === "1") {
    const [servicesFixture, teamFixture, contentFixture, socialFixture] = await Promise.all([
      import("@/test-fixtures/homepage-services.json"),
      import("@/test-fixtures/homepage-team.json"),
      import("@/test-fixtures/homepage-content.json"),
      import("@/test-fixtures/homepage-social.json"),
    ])

    const socialData = {
      ...socialFixture.default,
      reviews: socialFixture.default.reviews.map((review) => ({
        ...review,
        reviewDate: review.reviewDate ? new Date(review.reviewDate) : null,
      })),
      reviewStats: socialFixture.default.reviewStats.map((stat) => ({
        ...stat,
        updatedAt: new Date(stat.updatedAt),
      })),
    }

    return {
      ...servicesFixture.default,
      ...teamFixture.default,
      ...contentFixture.default,
      ...socialData,
      workWithUsPhotos: [],
    } as unknown as HomePageData
  }

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
    heroContent,
    workWithUsPhotos,
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
    getHeroContent(),
    import('@/actions/work-with-us-carousel').then(({ getEnabledCarouselPhotos }) => getEnabledCarouselPhotos()),
  ])

  return {
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
    heroContent,
    workWithUsPhotos,
  }
}

// Ensure fresh data on each request (for admin-managed content)
export const dynamic = 'force-dynamic'
// Allow up to 60 seconds for database queries
export const maxDuration = 60

export default async function HomePage() {
  const {
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
    heroContent,
    workWithUsPhotos,
  } = await getHomePageData()

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
    // Shared with Admin Team Photography so the control surface always shows
    // the exact portrait selected by the public website.
    image: resolveTeamPhotoParity(member).effectiveImageUrl,
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
      disableExperiencePreload={process.env.PLAYWRIGHT_FIXTURES === "1"}
      workWithUsPhotos={workWithUsPhotos}
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
      heroContent={heroContent}
      studio={studio}
      founderLetterContent={founderLetterContent}
    />
    {/* Keep review JSON-LD aligned with the reviews visitors can actually see. */}
    <ReviewSchema siteSettings={seoSettings.site} reviews={reviews} maxReviews={15} />
  </>
}
