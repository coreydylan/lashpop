import postgres from 'postgres'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'

export type Db = PostgresJsDatabase<Record<string, never>>

// Open a fresh connection per invocation. Cron runs 3x/day so connection
// reuse across invocations isn't a concern, and a short-lived connection
// is exactly what we want to avoid hogging the Supabase session pool.
export function openDb(databaseUrl: string): { db: Db; client: postgres.Sql } {
  const client = postgres(databaseUrl.trim(), {
    prepare: false,        // pgBouncer-safe
    max: 1,                // one connection per invocation
    idle_timeout: 5,
    max_lifetime: 60,
    connect_timeout: 30,
    connection: { application_name: 'lashpop_vagaro_sync_worker' },
  })
  return { db: drizzle(client), client }
}

export async function closeDb(client: postgres.Sql): Promise<void> {
  await client.end({ timeout: 5 })
}
