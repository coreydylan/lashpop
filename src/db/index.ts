import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// Local schemas
import { customers } from "./schema/customers"
import { teamMembers } from "./schema/team_members"
import { serviceCategories } from "./schema/service_categories"
import { services } from "./schema/services"
import { testimonials } from "./schema/testimonials"
import { teamMemberCategories } from "./schema/team_member_categories"
import { assets } from "./schema/assets"
import { assetServices } from "./schema/asset_services"
import { teamMemberPhotos } from "./schema/team_member_photos"
import { tagCategories } from "./schema/tag_categories"
import { tags } from "./schema/tags"
import { assetTags } from "./schema/asset_tags"
import { sets } from "./schema/sets"
import { setPhotos } from "./schema/set_photos"

// Vagaro mirror schemas
import { appointments } from "./schema/appointments"
import { vagaroCustomers } from "./schema/vagaro_customers"
import { businessLocations } from "./schema/business_locations"
import { formResponses } from "./schema/form_responses"
import { transactions } from "./schema/transactions"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL

const dbSchema = {
  // Local tables
  customers,
  teamMembers,
  serviceCategories,
  services,
  testimonials,
  teamMemberCategories,
  assets,
  assetServices,
  teamMemberPhotos,
  tagCategories,
  tags,
  assetTags,
  sets,
  setPhotos,

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
      max: 3, // Maximum number of connections in the pool (very conservative for Supabase)
      idle_timeout: 10, // Close idle connections after 10 seconds
      max_lifetime: 60 * 2, // Close connections after 2 minutes (very aggressive for pooler)
      connect_timeout: 10, // Connection timeout in seconds
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
