import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"

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
import { serviceCategories } from "./schema/service_categories"
import { services } from "./schema/services"
import { testimonials } from "./schema/testimonials"
import { reviews } from "./schema/reviews"
import { reviewStats } from "./schema/review_stats"
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
import { websiteSettings, homepageReviews } from "./schema/website_settings"
import { faqCategories, faqItems } from "./schema/faqs"

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

const databaseUrl = process.env.DATABASE_URL

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
  teamQuickFacts,
  serviceCategories,
  services,
  testimonials,
  reviews,
  reviewStats,
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
  websiteSettings,
  homepageReviews,
  faqCategories,
  faqItems,

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

let dbInstance: ReturnType<typeof drizzlePostgres> | null = null
let clientInstance: ReturnType<typeof postgres> | null = null

export function getDb() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set")
  }
  if (!dbInstance || !clientInstance) {
    // Add pgbouncer parameter for Supabase pooler if not present
    let connectionUrl = databaseUrl
    if (databaseUrl.includes('pooler.supabase.com') && !databaseUrl.includes('pgbouncer=true')) {
      connectionUrl = databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'pgbouncer=true'
    }

    // Configure postgres-js with connection pooling optimized for Supabase
    clientInstance = postgres(connectionUrl, {
      prepare: false,
      // Limit connections for Supabase pooler
      // Vercel Edge/Serverless functions should use 1 connection max to avoid exhausting the pool
      max: 1,
      idle_timeout: 15, // Close idle connections after 15 seconds
      max_lifetime: 60 * 5, // Close connections after 5 minutes
      connect_timeout: 60, // Increased to 60s for high latency cold starts
      keep_alive: 30, // Send keep-alive every 30s to prevent drops
      connection: {
        application_name: 'lashpop_app',
      },

      // Supabase pooler works best with minimal connections
      ...(process.env.VERCEL || process.env.NEXT_RUNTIME === 'edge'
        ? { max: 1 }
        : {}
      )
    })
    dbInstance = drizzlePostgres(clientInstance, { schema: dbSchema })
  }
  return dbInstance
}

// Export cleanup function for graceful shutdown
export async function closeDb() {
  if (clientInstance) {
    await clientInstance.end()
    clientInstance = null
    dbInstance = null
  }
}

// NOTE: Do not export an eagerly-initialized `db` instance here.
// Use getDb() for lazy initialization to avoid build errors when DATABASE_URL isn't set.

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
  teamQuickFacts,
  QUICK_FACT_TYPES,
  serviceCategories,
  services,
  testimonials,
  reviews,
  reviewStats,
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
  websiteSettings,
  homepageReviews,
  faqCategories,
  faqItems,
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
