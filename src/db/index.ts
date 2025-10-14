import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { customers } from "./schema/customers"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL

const dbSchema = {
  // tables
  customers
  // relations
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
