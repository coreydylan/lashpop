import { getAllServices } from "../src/actions/services"
import { getTeamMembersWithServices } from "../src/actions/team"
import { getHomepageReviews, getReviewStats } from "../src/actions/reviews"
import { getInstagramPosts, getInstagramSettings } from "../src/actions/instagram"
import { getServiceCategories } from "../src/actions/categories"
import { getSlideshowConfigs } from "../src/actions/hero-slideshow"
import { getSEOSettings } from "../src/actions/seo"
import { getStudioSettings } from "../src/actions/studio"
import { getFounderLetter } from "../src/actions/founder-letter"
import { getHomepageServices } from "../src/actions/homepage-services"
import { getHeroContent } from "../src/actions/hero-content"
import { getDb } from "../src/db"
import { faqCategories, faqItems } from "../src/db/schema/faqs"
import { asc, eq } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  getQuizPhotosForQuiz,
  getQuizResultServices,
  getResultSettingsForQuiz,
  type LashStyle,
} from "../src/actions/quiz-photos"

function sanitizeFaqAnswer(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
    transformTags: {
      a: (_tagName, attributes) => {
        const target = attributes.target === "_blank" ? "_blank" : undefined
        return {
          tagName: "a",
          attribs: {
            ...(attributes.href ? { href: attributes.href } : {}),
            ...(target ? { target } : {}),
            rel: target ? "noopener noreferrer" : "nofollow",
          },
        }
      },
    },
  })
}

async function getPublicFaqFixture() {
  const db = getDb()
  const [categories, items] = await Promise.all([
    db.select().from(faqCategories).where(eq(faqCategories.isActive, true)).orderBy(asc(faqCategories.displayOrder)),
    db.select().from(faqItems).where(eq(faqItems.isActive, true)).orderBy(asc(faqItems.displayOrder)),
  ])
  const publicCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    displayName: category.displayName,
    description: category.description,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
  }))
  const cleanItems = items.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    question: item.question,
    answer: sanitizeFaqAnswer(item.answer),
    displayOrder: item.displayOrder,
    isActive: item.isActive,
    isFeatured: item.isFeatured,
  }))
  const itemsByCategory = Object.fromEntries(
    publicCategories.map((category) => [
      category.id,
      cleanItems.filter((item) => item.categoryId === category.id),
    ]),
  )
  const categoryOrder = new Map(publicCategories.map((category, index) => [category.id, index]))
  const featuredItems = cleanItems
    .filter((item) => item.isFeatured)
    .map((item) => {
      const category = publicCategories.find((candidate) => candidate.id === item.categoryId)
      return {
        ...item,
        categoryName: category?.name || "",
        categoryDisplayName: category?.displayName || "",
      }
    })
    .sort((a, b) =>
      (categoryOrder.get(a.categoryId) ?? Number.MAX_SAFE_INTEGER) -
        (categoryOrder.get(b.categoryId) ?? Number.MAX_SAFE_INTEGER) ||
      a.displayOrder - b.displayOrder,
    )

  return { categories: publicCategories, itemsByCategory, featuredItems }
}

async function main() {
  const styles: LashStyle[] = ["classic", "hybrid", "wetAngel", "volume"]

  const [
  services,
  teamMembers,
  reviews,
  reviewStats,
  instagramPosts,
  serviceCategories,
  heroConfig,
  seoSettings,
  studio,
  founderLetterContent,
  homepageServices,
  instagramSettings,
  heroContent,
  quizPhotos,
  quizResultSettings,
  quizServiceEntries,
  faqData,
  ] = await Promise.all([
  getAllServices(),
  getTeamMembersWithServices(),
  getHomepageReviews(15),
  getReviewStats(),
  getInstagramPosts(),
  getServiceCategories(),
  getSlideshowConfigs(),
  getSEOSettings(),
  getStudioSettings(),
  getFounderLetter(),
  getHomepageServices(),
  getInstagramSettings(),
  getHeroContent(),
  getQuizPhotosForQuiz(),
  getResultSettingsForQuiz(),
  Promise.all(styles.map(async (style) => [style, await getQuizResultServices(style)] as const)),
  getPublicFaqFixture(),
  ])

  // Keep only fields already rendered on the public site. The source rows also
  // contain sync payloads and internal identifiers that must never be checked
  // into a browser-test fixture.
  const publicServices = services.map((service) => ({
    id: service.id,
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
    vagaroWidgetUrl: service.vagaroWidgetUrl,
    vagaroServiceCode: service.vagaroServiceCode,
  }))

  const publicTeamMembers = teamMembers.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    type: member.type,
    businessName: member.businessName,
    imageUrl: member.imageUrl,
    vagaroPhotoUrl: member.vagaroPhotoUrl,
    // Browser snapshots do not exercise staff contact links. Keep personal
    // phone numbers out of the committed fixture.
    phone: "",
    bio: member.bio,
    vagaroBio: member.vagaroBio,
    quote: member.quote,
    availability: member.availability,
    instagram: member.instagram,
    instagramUrl: member.instagramUrl,
    bookingUrl: member.bookingUrl,
    usesLashpopBooking: member.usesLashpopBooking,
    favoriteServices: member.favoriteServices,
    funFact: member.funFact,
    serviceCategories: member.serviceCategories,
    quickFacts: member.quickFacts.map((fact) => ({
      id: fact.id,
      factType: fact.factType,
      customLabel: fact.customLabel,
      value: fact.value,
      customIcon: fact.customIcon,
      displayOrder: fact.displayOrder,
    })),
    cropSquareUrl: member.cropSquareUrl,
    cropCloseUpCircleUrl: member.cropCloseUpCircleUrl,
    cropMediumCircleUrl: member.cropMediumCircleUrl,
    cropFullVerticalUrl: member.cropFullVerticalUrl,
    credentials: [],
  }))

  const publicReviews = reviews.map((review) => ({
    id: review.id,
    reviewerName: review.reviewerName,
    subject: review.subject,
    reviewText: review.reviewText,
    rating: review.rating,
    reviewDate: review.reviewDate,
    source: review.source,
    stylistName: review.stylistName,
  }))

  const publicReviewStats = reviewStats.map((stat) => ({
    id: stat.id,
    source: stat.source,
    rating: stat.rating,
    reviewCount: stat.reviewCount,
    updatedAt: stat.updatedAt,
  }))

  const publicQuizPhotos = Object.fromEntries(
    Object.entries(quizPhotos).map(([style, photos]) => [
      style,
      photos.map((photo) => ({
        id: photo.id,
        assetId: photo.assetId,
        lashStyle: photo.lashStyle,
        cropData: photo.cropData,
        cropUrl: photo.cropUrl,
        isEnabled: photo.isEnabled,
        sortOrder: photo.sortOrder,
        filePath: photo.filePath,
        fileName: photo.fileName,
      })),
    ]),
  )

  const snapshot = {
    services: publicServices,
    teamMembers: publicTeamMembers,
    reviews: publicReviews,
    reviewStats: publicReviewStats,
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
    quizPhotos: publicQuizPhotos,
    quizResultSettings,
    quizResultServices: Object.fromEntries(quizServiceEntries),
  }

  const fixtureFiles = {
    "homepage-services.json": {
      services: snapshot.services.filter((service) => service.categorySlug === "lashes"),
      serviceCategories: snapshot.serviceCategories,
      homepageServices: snapshot.homepageServices,
    },
    "homepage-team.json": { teamMembers: snapshot.teamMembers },
    "homepage-content.json": {
      heroConfig: snapshot.heroConfig,
      seoSettings: snapshot.seoSettings,
      studio: snapshot.studio,
      founderLetterContent: snapshot.founderLetterContent,
      instagramSettings: snapshot.instagramSettings,
      heroContent: snapshot.heroContent,
    },
    "homepage-social.json": {
      reviews: snapshot.reviews,
      reviewStats: snapshot.reviewStats,
      instagramPosts: snapshot.instagramPosts,
      faqData: snapshot.faqData,
    },
    "homepage-quiz.json": {
      quizPhotos: snapshot.quizPhotos,
      quizResultSettings: snapshot.quizResultSettings,
      quizResultServices: snapshot.quizResultServices,
    },
  }

  if (process.argv.includes("--write")) {
    const target = resolve(process.cwd(), "src/test-fixtures")
    await mkdir(target, { recursive: true })
    await Promise.all(
      Object.entries(fixtureFiles).map(([name, data]) =>
        writeFile(resolve(target, name), `${JSON.stringify(data)}\n`, "utf8"),
      ),
    )
    console.log(`Updated ${Object.keys(fixtureFiles).length} public browser fixtures.`)
    return
  }

  process.stdout.write(JSON.stringify(snapshot, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
