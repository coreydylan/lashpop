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

// Environment setup
const nodeEnv = process.env.NODE_ENV ?? "development"
const isProduction = nodeEnv === "production"
const isServerless = !!(process.env.VERCEL || process.env.NEXT_RUNTIME === 'edge')

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

// Retry configuration
const RETRYABLE_ERROR_CODES = new Set([
  "53300", // too_many_connections
  "57P03", // cannot_connect_now
  "08006", // connection_failure
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08000", // connection_exception
  "08003"  // connection_does_not_exist
])

const MAX_RETRY_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 200
const MAX_RETRY_DELAY_MS = 2000

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false

  const err = error as { code?: string; errno?: string }

  // Handle CONNECT_TIMEOUT from postgres.js
  if (err.errno === "CONNECT_TIMEOUT" || err.code === "CONNECT_TIMEOUT") {
    return true
  }

  return typeof err.code === "string" && RETRYABLE_ERROR_CODES.has(err.code)
}

async function executeWithRetry<T>(operation: () => Promise<T> | T, attempt = 1): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const shouldRetry = attempt < MAX_RETRY_ATTEMPTS && isRetryableError(error)

    if (!shouldRetry) {
      if (isRetryableError(error)) {
        console.error(`[DB] Retryable error failed after ${attempt} attempts:`, error)
      }
      throw error
    }

    const backoff = Math.min(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS)
    console.warn(`[DB] Retrying operation (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS}) after ${backoff}ms:`,
      error instanceof Error ? error.message : error)
    await delay(backoff)
    return executeWithRetry(operation, attempt + 1)
  }
}

function createSqlClient(url: string): SqlClient {
  // Add pgbouncer parameter for Supabase pooler if not present
  let connectionUrl = url
  if (url.includes('pooler.supabase.com') && !url.includes('pgbouncer=true')) {
    connectionUrl = url + (url.includes('?') ? '&' : '?') + 'pgbouncer=true'
  }

  // Connection settings based on environment
  const connectTimeout = isServerless ? 30 : 10
  const idleTimeout = isServerless ? 10 : 20
  const maxConnections = isServerless ? 1 : 5
  const statementTimeout = 30000 // 30 seconds

  const client = postgres(connectionUrl, {
    // Required for Supabase Transaction Pooler (pgbouncer)
    prepare: false,
    // Connection pool settings
    max: maxConnections,
    connect_timeout: connectTimeout,
    idle_timeout: idleTimeout,
    max_lifetime: 60 * 30, // 30 minutes
    // SSL required for Supabase
    ssl: "require",
    // Skip fetching custom types - faster startup
    fetch_types: false,
    // Suppress notice messages
    onnotice: () => {},
    // Connection metadata
    connection: {
      application_name: APPLICATION_NAME,
      statement_timeout: statementTimeout
    },
    // Debug in development
    debug: !isProduction && !isServerless
  })

  return client
}

// Wrap SQL client with retry logic for transient errors
function wrapSqlClientWithRetry(rawClient: SqlClient): SqlClient {
  const rawCallable = rawClient as unknown as (...args: unknown[]) => Promise<unknown>

  const handler: ProxyHandler<SqlClient> = {
    apply(_target, _thisArg, argArray) {
      const parameters = Array.from(argArray ?? [])
      return executeWithRetry(() => Reflect.apply(rawCallable, rawClient, parameters))
    },
    get(_target, property, receiver) {
      const originalValue = Reflect.get(rawClient, property, receiver)

      if (typeof originalValue !== "function") {
        return originalValue
      }

      // Don't wrap cleanup methods
      if (property === "end") {
        return (...args: unknown[]) => Reflect.apply(originalValue, rawClient, args)
      }

      // Wrap all other methods with retry
      return (...args: unknown[]) => executeWithRetry(() => Reflect.apply(originalValue, rawClient, args))
    }
  }

  return new Proxy(rawClient, handler)
}

function createHandles(): DatabaseHandles {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set")
  }

  const rawSqlClient = createSqlClient(databaseUrl)
  const sql = wrapSqlClientWithRetry(rawSqlClient)
  const db = drizzlePostgres(sql, { schema: dbSchema })

  const isPooledConnection = databaseUrl.includes("pooler")
  const connectionMode = isPooledConnection ? "Pooler" : "Direct"
  const maxConnections = isServerless ? 1 : 5

  console.log(
    "[DB] Connection initialized:",
    connectionMode,
    `env=${nodeEnv}`,
    `serverless=${isServerless}`,
    `pool_max=${maxConnections}`,
    `connect_timeout=${isServerless ? 30 : 10}s`
  )

  return { sql, db }
}

// Global singleton initialization
const globalScope = globalThis as typeof globalThis & { __lashpopDatabaseHandles__?: DatabaseHandles }

function getHandles(): DatabaseHandles {
  if (!globalScope.__lashpopDatabaseHandles__) {
    globalScope.__lashpopDatabaseHandles__ = createHandles()
  }
  return globalScope.__lashpopDatabaseHandles__
}

// Main export - lazy initialization
export function getDb(): DrizzleDatabase {
  return getHandles().db
}

// SQL client export for raw queries
export function getSql(): SqlClient {
  return getHandles().sql
}

// Run operation with retry logic
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
