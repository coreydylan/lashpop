import { config } from "dotenv"
import {
  drizzle as drizzleSqlite,
  type AsyncBatchRemoteCallback,
  type AsyncRemoteCallback,
} from "drizzle-orm/sqlite-proxy"

// Auth schemas (BetterAuth)
import { user } from "./schema/auth_user"
import { session } from "./schema/auth_session"
import { verification } from "./schema/auth_verification"

// User profile schemas
import { profiles } from "./schema/profiles"
import { vagaroSyncMappings } from "./schema/vagaro_sync_mappings"
import { friendBookingRequests } from "./schema/friend_booking_requests"

// Local schemas
import { customers } from "./schema/customers"
import { teamMembers, teamMemberServices } from "./schema/team_members"
import { teamMemberServicesVagaro } from "./schema/team_member_services_vagaro"
import { serviceCategories } from "./schema/service_categories"
import { vagaroServiceCategories } from "./schema/vagaro_service_categories"
import { vagaroCategoryMappings } from "./schema/vagaro_category_mappings"
import { vagaroSyncRuns } from "./schema/vagaro_sync_runs"
import { services } from "./schema/services"
import { testimonials } from "./schema/testimonials"
import { reviews } from "./schema/reviews"
import { reviewStats } from "./schema/review_stats"
import { teamMemberHighlights } from "./schema/team_member_highlights"
import { teamMemberCategories } from "./schema/team_member_categories"
import { teamQuickFacts, QUICK_FACT_TYPES } from "./schema/team_quick_facts"
import { assets } from "./schema/assets"
import { assetServices } from "./schema/asset_services"
import { teamMemberPhotos } from "./schema/team_member_photos"
import { tagCategories } from "./schema/tag_categories"
import { tags } from "./schema/tags"
import { assetTags } from "./schema/asset_tags"
import { sets } from "./schema/sets"
import { setPhotos } from "./schema/set_photos"
import { damUserSettings } from "./schema/dam_user_settings"
import { damUserActions } from "./schema/dam_user_actions"
import { adminAuditLog } from "./schema/admin_audit_log"
import { websiteSettings, homepageReviews } from "./schema/website_settings"
import { faqCategories, faqItems } from "./schema/faqs"
import { quizPhotos, quizLashStyle, quizResultSettings } from "./schema/quiz_photos"
import { workWithUsCarouselPhotos } from "./schema/work_with_us_carousel"
import { newsletterSubscriptions } from "./schema/newsletter_subscriptions"
import { workWithUsSubmissions } from "./schema/work_with_us_submissions"

// Scrollytelling CMS schemas
import {
  compositions,
  layers,
  tracks,
  clips,
  cues,
  cueActions,
  triggers,
  blocks,
  drawerConfigs,
  headerConfigs,
  surfaceSlides,
  drawerStates,
  collisionRules,
  playbackEvents
} from "./schema/scrollytelling-cms"

// Vagaro mirror schemas
import { appointments } from "./schema/appointments"
import { vagaroCustomers } from "./schema/vagaro_customers"
import { businessLocations } from "./schema/business_locations"
import { formResponses } from "./schema/form_responses"
import { transactions } from "./schema/transactions"

// Load from .env.local first, fall back to .env
config({ path: ".env.local" })
config({ path: ".env" })

const databaseUrl = process.env.CLOUDFLARE_DB_URL
const databaseToken = process.env.CLOUDFLARE_DB_TOKEN

const dbSchema = {
  // Auth tables
  user,
  session,
  verification,

  // Profile tables
  profiles,
  vagaroSyncMappings,
  friendBookingRequests,

  // Local tables
  customers,
  teamMembers,
  teamMemberServices,
  teamMemberServicesVagaro,
  teamQuickFacts,
  serviceCategories,
  vagaroServiceCategories,
  vagaroCategoryMappings,
  vagaroSyncRuns,
  services,
  testimonials,
  reviews,
  reviewStats,
  teamMemberHighlights,
  teamMemberCategories,
  assets,
  assetServices,
  teamMemberPhotos,
  tagCategories,
  tags,
  assetTags,
  sets,
  setPhotos,
  damUserSettings,
  damUserActions,
  adminAuditLog,
  websiteSettings,
  homepageReviews,
  faqCategories,
  faqItems,
  quizPhotos,
  quizLashStyle,
  quizResultSettings,
  workWithUsCarouselPhotos,
  newsletterSubscriptions,
  workWithUsSubmissions,

  // Scrollytelling CMS tables
  compositions,
  layers,
  tracks,
  clips,
  cues,
  cueActions,
  triggers,
  blocks,
  drawerConfigs,
  headerConfigs,
  surfaceSlides,
  drawerStates,
  collisionRules,
  playbackEvents,

  // Vagaro mirror tables
  appointments,
  vagaroCustomers,
  businessLocations,
  formResponses,
  transactions
}

interface WorkerQueryResponse {
  rows: unknown[]
}

interface WorkerBatchResponse {
  results: WorkerQueryResponse[]
}

async function postToDatabase<T>(path: string, body: unknown): Promise<T> {
  if (!databaseUrl) {
    throw new Error("CLOUDFLARE_DB_URL is not set")
  }
  if (!databaseToken) {
    throw new Error("CLOUDFLARE_DB_TOKEN is not set")
  }

  const response = await fetch(`${databaseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${databaseToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Cloudflare database request failed (${response.status}): ${detail}`)
  }

  return response.json() as Promise<T>
}

const remoteQuery: AsyncRemoteCallback = async (sql, params, method) => {
  return postToDatabase<WorkerQueryResponse>("/query", { sql, params, method })
}

const remoteBatch: AsyncBatchRemoteCallback = async (batch) => {
  const response = await postToDatabase<WorkerBatchResponse>("/batch", { batch })
  return response.results
}

function createDatabase() {
  return drizzleSqlite(remoteQuery, remoteBatch, { schema: dbSchema })
}

let dbInstance: ReturnType<typeof createDatabase> | null = null

export function getDb() {
  if (!databaseUrl) {
    throw new Error("CLOUDFLARE_DB_URL is not set")
  }
  if (!databaseToken) {
    throw new Error("CLOUDFLARE_DB_TOKEN is not set")
  }
  if (!dbInstance) {
    dbInstance = createDatabase()
  }
  return dbInstance
}

// Export cleanup function for graceful shutdown
export async function closeDb() {
  dbInstance = null
}

// NOTE: Do not export an eagerly-initialized `db` instance here.
// Use getDb() for lazy initialization to avoid build errors when the Worker
// endpoint is not configured.

// Re-export schema tables for convenience
export {
  // Auth
  user,
  session,
  verification,
  // Profiles
  profiles,
  vagaroSyncMappings,
  friendBookingRequests,
  // Local tables
  customers,
  teamMembers,
  teamMemberServices,
  teamMemberServicesVagaro,
  teamQuickFacts,
  QUICK_FACT_TYPES,
  serviceCategories,
  vagaroServiceCategories,
  vagaroCategoryMappings,
  vagaroSyncRuns,
  services,
  testimonials,
  reviews,
  reviewStats,
  teamMemberHighlights,
  teamMemberCategories,
  assets,
  assetServices,
  teamMemberPhotos,
  tagCategories,
  tags,
  assetTags,
  sets,
  setPhotos,
  damUserSettings,
  damUserActions,
  adminAuditLog,
  websiteSettings,
  homepageReviews,
  faqCategories,
  faqItems,
  quizPhotos,
  quizLashStyle,
  quizResultSettings,
  workWithUsCarouselPhotos,
  newsletterSubscriptions,
  workWithUsSubmissions,
  // Scrollytelling CMS
  compositions,
  layers,
  tracks,
  clips,
  cues,
  cueActions,
  triggers,
  blocks,
  drawerConfigs,
  headerConfigs,
  surfaceSlides,
  drawerStates,
  collisionRules,
  playbackEvents,
  // Vagaro mirror
  appointments,
  vagaroCustomers,
  businessLocations,
  formResponses,
  transactions
}
