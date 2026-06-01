import postgres from 'postgres'

export type Sql = postgres.Sql

export function openDb(databaseUrl: string): Sql {
  return postgres(databaseUrl.trim(), {
    prepare: false,
    max: 1,
    idle_timeout: 5,
    max_lifetime: 60,
    connect_timeout: 30,
    connection: { application_name: 'lashpop_instagram_sync_worker' },
  })
}

export async function closeDb(sql: Sql): Promise<void> {
  await sql.end({ timeout: 5 })
}
