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

  // Vagaro mirror tables
  appointments,
  vagaroCustomers,
  businessLocations,
  formResponses,
  transactions
}

function initializeDb(url: string) {
  const client = postgres(url, { prepare: false })
  return drizzlePostgres(client, { schema: dbSchema })
}

let dbInstance: ReturnType<typeof initializeDb> | null = null

export function getDb() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set")
  }
  if (!dbInstance) {
    dbInstance = initializeDb(databaseUrl)
  }
  return dbInstance
}
