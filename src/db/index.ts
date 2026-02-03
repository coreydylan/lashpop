import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres, { type Sql } from "postgres"

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
import { quizPhotos, quizLashStyle, quizResultSettings } from "./schema/quiz_photos"
import { workWithUsCarouselPhotos } from "./schema/work_with_us_carousel"

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

// Environment setup - match whh-portal pattern exactly
const nodeEnv = process.env.NODE_ENV ?? "development"
const isProduction = nodeEnv === "production"

if (!isProduction) {
  config({ path: ".env.local" })
  config({ path: ".env" })
}

const APPLICATION_NAME = "lashpop_app"

// Schema definition
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
  quizPhotos,
  quizLashStyle,
  quizResultSettings,
  workWithUsCarouselPhotos,
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

// Types
type DrizzleDatabase = PostgresJsDatabase<typeof dbSchema>
type SqlClient = Sql

interface DatabaseHandles {
  sql: SqlClient
  db: DrizzleDatabase
}

// Global singleton declaration (survives hot reload in development)
declare global {
  // eslint-disable-next-line no-var
  var __lashpopDatabaseHandles__: DatabaseHandles | undefined
}

// Get database URL
const databaseUrl = process.env.DATABASE_URL

// Detect pooled connection
const isPooledConnection = databaseUrl?.includes("pooler") ?? false

// Pool size configuration - keep low for serverless + Supabase Session pooler
function defaultPoolSize(): number {
  if (isPooledConnection) {
    // Session mode pooler has limited connections - keep client pool small
    return isProduction ? 2 : 2
  }
  return isProduction ? 5 : 3
}

const connectionPoolSize = defaultPoolSize()

// Retry configuration
const retryableErrorCodes = new Set([
  "53300", // too_many_connections
  "57P03", // cannot_connect_now
  "08006", // connection_failure
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08000", // connection_exception
  "08003"  // connection_does_not_exist
])

const maxRetryAttempts = 3
const baseRetryDelayMs = 200
const maxRetryDelayMs = 2000

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryableError(error: unknown): error is { code?: string; errno?: string } {
  if (typeof error !== "object" || error === null) {
    return false
  }

  const code = (error as { code?: string }).code
  const errno = (error as { errno?: string }).errno

  // Handle CONNECT_TIMEOUT from postgres.js client
  if (errno === "CONNECT_TIMEOUT" || code === "CONNECT_TIMEOUT") {
    return true
  }

  if (code === "53300") {
    return true
  }

  return typeof code === "string" && retryableErrorCodes.has(code)
}

async function executeWithRetry<T>(operation: () => Promise<T> | T, attempt = 1): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const isRetryable = isRetryableError(error)
    const shouldRetry = attempt < maxRetryAttempts && isRetryable

    if (!shouldRetry) {
      if (isRetryable) {
        console.error(`[DB] Retryable error failed after ${attempt} attempts:`, error)
      }
      throw error
    }

    const backoff = Math.min(baseRetryDelayMs * 2 ** (attempt - 1), maxRetryDelayMs)
    console.warn(`[DB] Retrying operation (attempt ${attempt + 1}/${maxRetryAttempts}) after ${backoff}ms:`,
      error instanceof Error ? error.message : error)
    await delay(backoff)
    return executeWithRetry(operation, attempt + 1)
  }
}

function createSqlClient(url: string): SqlClient {
  // Connection settings - match whh-portal exactly
  const connectTimeout = isProduction ? 30 : 10
  const idleTimeout = isProduction ? 60 : 20
  const maxLifetime = 60 * 30 // 30 minutes
  const statementTimeout = 30000 // 30 seconds

  const client = postgres(url, {
    prepare: false,
    connect_timeout: connectTimeout,
    idle_timeout: idleTimeout,
    max_lifetime: maxLifetime,
    max: connectionPoolSize,
    ssl: "require",
    connection: {
      application_name: APPLICATION_NAME,
      statement_timeout: statementTimeout
    },
    fetch_types: false,
    onnotice: () => {}
  })

  return client
}

function createHandles(): DatabaseHandles {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set")
  }

  const sql = createSqlClient(databaseUrl)
  const db = drizzlePostgres(sql, { schema: dbSchema })

  const connectionMode = isPooledConnection ? "Pooler" : "Direct"
  console.log(
    "[DB] Connection initialized:",
    connectionMode,
    `env=${nodeEnv}`,
    `pool_max=${connectionPoolSize}`,
    `connect_timeout=${isProduction ? 30 : 10}s`,
    `statement_timeout=30s`
  )

  return { sql, db }
}

// Eager initialization at module load - match whh-portal pattern
const globalScope = globalThis as typeof globalThis & { __lashpopDatabaseHandles__?: DatabaseHandles }

// Only initialize if DATABASE_URL is available (skip during build)
if (databaseUrl) {
  globalScope.__lashpopDatabaseHandles__ ??= createHandles()
}

// Get handles (creates if needed)
function getHandles(): DatabaseHandles {
  if (!globalScope.__lashpopDatabaseHandles__) {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not set")
    }
    globalScope.__lashpopDatabaseHandles__ = createHandles()
  }
  return globalScope.__lashpopDatabaseHandles__
}

// Main exports - match whh-portal pattern
export function getDb(): DrizzleDatabase {
  return getHandles().db
}

export function getSql(): SqlClient {
  return getHandles().sql
}

export async function runWithDbRetry<T>(operation: (database: DrizzleDatabase) => Promise<T> | T): Promise<T> {
  return executeWithRetry(() => operation(getHandles().db))
}

// Export cleanup function for graceful shutdown
export async function closeDb(): Promise<void> {
  if (globalScope.__lashpopDatabaseHandles__) {
    await globalScope.__lashpopDatabaseHandles__.sql.end()
    globalScope.__lashpopDatabaseHandles__ = undefined
  }
}

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
  quizPhotos,
  quizLashStyle,
  quizResultSettings,
  workWithUsCarouselPhotos,
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

// Export types
export type { DrizzleDatabase as Database, SqlClient as DatabaseSqlClient }
