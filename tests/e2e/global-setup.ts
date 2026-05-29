import type { FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import postgres from 'postgres'

/**
 * Mint an admin storageState without a UI login: read a live damAccess session
 * token from the DB and write it as the `auth_token` cookie. The `admin` project
 * loads this state. Non-destructive — it only reads an existing valid session.
 */
export default async function globalSetup(_config: FullConfig) {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is required for E2E admin auth setup')

  const sql = postgres(url, { prepare: false, max: 1 })
  try {
    const rows = await sql<{ token: string }[]>`
      select s.token
      from session s
      join "user" u on u.id = s.user_id
      where u.dam_access = true and s.expires_at > now()
      order by s.expires_at desc
      limit 1`
    if (rows.length === 0) {
      throw new Error(
        'No valid admin (dam_access) session found. Log in once at /dam/login as an admin, then re-run.'
      )
    }
    const token = rows[0].token

    const baseURL =
      process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${process.env.PLAYWRIGHT_PORT || '3004'}`
    const { hostname } = new URL(baseURL)

    const storageState = {
      cookies: [
        {
          name: 'auth_token',
          value: token,
          domain: hostname,
          path: '/',
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax' as const,
        },
      ],
      origins: [],
    }

    const dir = path.join(process.cwd(), 'tests/e2e/.auth')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'admin.json'), JSON.stringify(storageState, null, 2))
  } finally {
    await sql.end({ timeout: 5 })
  }
}
