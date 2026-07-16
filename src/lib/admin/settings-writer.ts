import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { executeDatabaseBatch, getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { getAdminSession } from '@/lib/admin/auth'
import {
  getWebsiteSettingDefinition,
  isWebsiteSettingSection,
  type WebsiteSettingSection,
  type WebsiteSettingSource,
} from '@/lib/admin/settings-registry'

const MAX_CONFIG_BYTES = 512 * 1024
const MAX_AUDIT_CONTEXT_BYTES = 32 * 1024
const MAX_NOTES_LENGTH = 2_000
const ALLOWED_SOURCES: readonly WebsiteSettingSource[] = ['admin', 'history-restore', 'migration', 'system']

export interface WriteWebsiteSettingInput {
  section: WebsiteSettingSection
  config: unknown
  /** The version last read by the editor. Use zero only when creating a missing setting. */
  baseVersion: number
  /** Stable dotted audit action. Defaults to `website-settings.<section>.update`. */
  action?: string
  source?: WebsiteSettingSource
  notes?: string
  /** Structured audit context, such as the immutable version used by a restore. */
  auditContext?: Record<string, unknown>
}

export interface WrittenWebsiteSetting {
  id: string
  section: WebsiteSettingSection
  config: Record<string, unknown>
  sourceOwner: WebsiteSettingSource
  version: number
  updatedByUserId: string
  updatedAt: number
}

export interface WebsiteSettingWriteSuccess {
  ok: true
  status: 200
  setting: WrittenWebsiteSetting
}

export interface WebsiteSettingWriteFailure {
  ok: false
  status: 400 | 401 | 403 | 409 | 422
  code: 'invalid-request' | 'unauthenticated' | 'forbidden' | 'conflict' | 'validation-failed'
  error: string
  conflict?: true
  currentVersion?: number
  currentConfig?: Record<string, unknown> | null
  validationErrors?: string[]
}

export type WebsiteSettingWriteResult = WebsiteSettingWriteSuccess | WebsiteSettingWriteFailure

function failure(
  status: WebsiteSettingWriteFailure['status'],
  code: WebsiteSettingWriteFailure['code'],
  error: string,
  extra: Partial<Omit<WebsiteSettingWriteFailure, 'ok' | 'status' | 'code' | 'error'>> = {},
): WebsiteSettingWriteFailure {
  return { ok: false, status, code, error, ...extra }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeJsonObject(value: unknown): { value: Record<string, unknown>; serialized: string } | null {
  if (!isRecord(value)) return null

  try {
    const serialized = JSON.stringify(value)
    if (!serialized || new TextEncoder().encode(serialized).byteLength > MAX_CONFIG_BYTES) return null
    const normalized = JSON.parse(serialized) as unknown
    if (!isRecord(normalized)) return null
    return { value: normalized, serialized }
  } catch {
    return null
  }
}

function normalizeAuditContext(value: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!value) return null
  try {
    const serialized = JSON.stringify(value)
    if (new TextEncoder().encode(serialized).byteLength > MAX_AUDIT_CONTEXT_BYTES) return null
    const normalized = JSON.parse(serialized) as unknown
    return isRecord(normalized) ? normalized : null
  } catch {
    return null
  }
}

/**
 * The sole publisher for versioned website settings.
 *
 * The conditional setting write and audit insert share one atomic D1 batch.
 * The database trigger captures the previous configuration, so this function
 * deliberately does not write to `website_setting_versions` itself.
 */
export async function writeWebsiteSetting(input: WriteWebsiteSettingInput): Promise<WebsiteSettingWriteResult> {
  const auth = await getAdminSession()
  if (!auth) return failure(401, 'unauthenticated', 'Authentication is required')
  if (!auth.role || (auth.role !== 'owner' && auth.role !== 'publisher')) {
    return failure(403, 'forbidden', 'Only owners and publishers can publish website settings')
  }

  if (!isWebsiteSettingSection(input.section)) {
    return failure(400, 'invalid-request', 'section is not an active website setting')
  }
  if (!Number.isInteger(input.baseVersion) || input.baseVersion < 0) {
    return failure(400, 'invalid-request', 'baseVersion must be a non-negative integer')
  }

  const action = input.action ?? `website-settings.${input.section}.update`
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/.test(action) || action.length > 160) {
    return failure(400, 'invalid-request', 'action must be a stable dotted identifier')
  }
  if (input.notes !== undefined && (typeof input.notes !== 'string' || input.notes.length > MAX_NOTES_LENGTH)) {
    return failure(400, 'invalid-request', `notes must be at most ${MAX_NOTES_LENGTH} characters`)
  }

  const source = input.source ?? getWebsiteSettingDefinition(input.section).source
  if (!ALLOWED_SOURCES.includes(source)) {
    return failure(400, 'invalid-request', 'source is invalid')
  }

  const normalized = normalizeJsonObject(input.config)
  if (!normalized) {
    return failure(400, 'invalid-request', `config must be a JSON object no larger than ${MAX_CONFIG_BYTES} bytes`)
  }

  const definition = getWebsiteSettingDefinition(input.section)
  const validation = definition.validate(normalized.value)
  if (!validation.valid) {
    return failure(422, 'validation-failed', 'The setting configuration is invalid', {
      validationErrors: validation.errors,
    })
  }

  const auditContext = normalizeAuditContext(input.auditContext)
  if (input.auditContext && !auditContext) {
    return failure(400, 'invalid-request', `auditContext must be JSON serializable and no larger than ${MAX_AUDIT_CONTEXT_BYTES} bytes`)
  }

  const settingId = randomUUID()
  const auditId = randomUUID()
  const now = Date.now()
  const nextVersion = input.baseVersion === 0 ? 1 : input.baseVersion + 1
  const auditDiff = JSON.stringify({
    beforeVersion: input.baseVersion === 0 ? null : input.baseVersion,
    afterVersion: nextVersion,
    schemaVersion: definition.schemaVersion,
    source,
    owner: definition.owner,
    ...(auditContext ? { context: auditContext } : {}),
  })

  const results = await executeDatabaseBatch([
    {
      sql: `INSERT INTO website_settings
              (id, section, config, source_owner, version, updated_by_user_id, created_at, updated_at)
            SELECT ?, ?, ?, ?, ?, ?, ?, ?
            WHERE ? = 0 OR EXISTS (
              SELECT 1 FROM website_settings WHERE section = ?
            )
            ON CONFLICT(section) DO UPDATE SET
              config = excluded.config,
              source_owner = excluded.source_owner,
              version = website_settings.version + 1,
              updated_by_user_id = excluded.updated_by_user_id,
              updated_at = excluded.updated_at
            WHERE website_settings.version = ?`,
      params: [
        settingId,
        input.section,
        normalized.serialized,
        source,
        nextVersion,
        auth.userId,
        now,
        now,
        input.baseVersion,
        input.section,
        input.baseVersion,
      ],
      method: 'run',
    },
    {
      sql: `INSERT INTO admin_audit_log
              (id, actor_user_id, surface, action, target_type, target_id, diff, notes, created_at)
            SELECT ?, ?, 'admin', ?, 'website_settings', ?, ?, ?, ?
            WHERE changes() = 1`,
      params: [auditId, auth.userId, action, input.section, auditDiff, input.notes ?? null, now],
      method: 'run',
    },
    {
      sql: `SELECT id, version, source_owner, updated_by_user_id, updated_at, changes()
            FROM website_settings
            WHERE section = ?`,
      params: [input.section],
      method: 'get',
    },
  ])

  const row = results[2]?.rows
  const writeApplied = row?.[5] === 1
  if (!writeApplied) {
    const db = getDb()
    const [current] = await db
      .select({ version: websiteSettings.version, config: websiteSettings.config })
      .from(websiteSettings)
      .where(eq(websiteSettings.section, input.section))
      .limit(1)

    return failure(409, 'conflict', 'This setting changed after it was loaded. Refresh before publishing.', {
      conflict: true,
      currentVersion: current?.version,
      currentConfig: current?.config ?? null,
    })
  }

  for (const target of definition.revalidate) {
    try {
      if (target.type) revalidatePath(target.path, target.type)
      else revalidatePath(target.path)
    } catch (error) {
      // Persistence and audit are already committed. A later request will
      // repopulate the cache even if an invalidation service is unavailable.
      console.error(`[website-settings] failed to revalidate ${target.path}`, error)
    }
  }

  return {
    ok: true,
    status: 200,
    setting: {
      id: typeof row[0] === 'string' ? row[0] : settingId,
      section: input.section,
      config: normalized.value,
      sourceOwner: source,
      version: typeof row[1] === 'number' ? row[1] : nextVersion,
      updatedByUserId: typeof row[3] === 'string' ? row[3] : auth.userId,
      updatedAt: typeof row[4] === 'number' ? row[4] : now,
    },
  }
}
