import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { getDb } from '@/db'
import { user as userSchema } from '@/db/schema/auth_user'
import { websiteSettingVersions } from '@/db/schema/website_setting_versions'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import {
  ACTIVE_WEBSITE_SETTING_SECTIONS,
  getWebsiteSettingDefinition,
  isWebsiteSettingSection,
  type WebsiteSettingSection,
} from '@/lib/admin/settings-registry'
import { writeWebsiteSetting } from '@/lib/admin/settings-writer'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100
const RESTORE_INTENT = 'restore-website-setting-version'

function restoreConfirmationToken(section: WebsiteSettingSection, version: number, versionId: string): string {
  return `restore:${section}:${version}:${versionId}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readLimit(request: NextRequest): number | null {
  const raw = request.nextUrl.searchParams.get('limit')
  if (raw === null) return DEFAULT_LIMIT
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) return null
  return Math.min(parsed, MAX_LIMIT)
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const requestedSection = request.nextUrl.searchParams.get('section')
  if (requestedSection !== null && !isWebsiteSettingSection(requestedSection)) {
    return NextResponse.json({ error: 'section is not an active website setting' }, { status: 400 })
  }

  const limit = readLimit(request)
  if (limit === null) {
    return NextResponse.json({ error: `limit must be an integer between 1 and ${MAX_LIMIT}` }, { status: 400 })
  }

  try {
    const db = getDb()
    const [rows, currentRows] = await Promise.all([
      db.select({
        id: websiteSettingVersions.id,
        settingId: websiteSettingVersions.settingId,
        section: websiteSettingVersions.section,
        config: websiteSettingVersions.config,
        sourceOwner: websiteSettingVersions.sourceOwner,
        version: websiteSettingVersions.version,
        updatedByUserId: websiteSettingVersions.updatedByUserId,
        createdAt: websiteSettingVersions.createdAt,
        publisherName: userSchema.name,
        publisherEmail: userSchema.email,
      })
      .from(websiteSettingVersions)
      .leftJoin(userSchema, eq(websiteSettingVersions.updatedByUserId, userSchema.id))
      .where(
        requestedSection
          ? eq(websiteSettingVersions.section, requestedSection)
          : inArray(websiteSettingVersions.section, [...ACTIVE_WEBSITE_SETTING_SECTIONS]),
      )
      .orderBy(desc(websiteSettingVersions.createdAt))
      .limit(Math.min(Math.max(limit * 5, 100), 500)),
      db
        .select({ section: websiteSettings.section, version: websiteSettings.version })
        .from(websiteSettings)
        .where(inArray(websiteSettings.section, [...ACTIVE_WEBSITE_SETTING_SECTIONS])),
    ])

    // The rollout migration seeded current values, while the update trigger
    // also captures the previous value. Collapse only exact duplicate
    // snapshots; preserve distinct configs even if a legacy writer reused a
    // version number.
    const seen = new Set<string>()
    const history = rows.flatMap((row) => {
      if (!isWebsiteSettingSection(row.section)) return []
      const key = `${row.section}:${row.version}:${JSON.stringify(row.config)}`
      if (seen.has(key)) return []
      seen.add(key)

      const definition = getWebsiteSettingDefinition(row.section)
      const validation = definition.validate(row.config)
      return [{
        id: row.id,
        settingId: row.settingId,
        section: row.section,
        label: definition.label,
        owner: definition.owner,
        schemaVersion: definition.schemaVersion,
        sourceOwner: row.sourceOwner,
        version: row.version,
        config: row.config,
        publisher: row.updatedByUserId
          ? { id: row.updatedByUserId, name: row.publisherName, email: row.publisherEmail }
          : null,
        createdAt: row.createdAt,
        valid: validation.valid,
        validationErrors: validation.errors,
        restoreToken: restoreConfirmationToken(row.section, row.version, row.id),
      }]
    }).slice(0, limit)

    const currentVersions = Object.fromEntries(
      currentRows
        .filter((row) => isWebsiteSettingSection(row.section))
        .map((row) => [row.section, row.version]),
    )

    return NextResponse.json({ history, currentVersions, role: auth.role, limit, section: requestedSection })
  } catch (error) {
    console.error('[admin-history] failed to read website setting history', error)
    return NextResponse.json({ error: 'Failed to load website setting history' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'A valid JSON body is required' }, { status: 400 })
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 })
  }
  if (body.intent !== RESTORE_INTENT) {
    return NextResponse.json({ error: `intent must be "${RESTORE_INTENT}"` }, { status: 400 })
  }
  if (!isWebsiteSettingSection(body.section)) {
    return NextResponse.json({ error: 'section is not an active website setting' }, { status: 400 })
  }
  if (typeof body.versionId !== 'string' || body.versionId.trim().length === 0) {
    return NextResponse.json({ error: 'versionId is required' }, { status: 400 })
  }
  if (typeof body.confirmationToken !== 'string' || body.confirmationToken.length === 0) {
    return NextResponse.json({ error: 'confirmationToken is required' }, { status: 400 })
  }
  if (!Number.isInteger(body.baseVersion) || (body.baseVersion as number) < 0) {
    return NextResponse.json({ error: 'baseVersion must be a non-negative integer' }, { status: 400 })
  }

  try {
    const db = getDb()
    const [storedVersion] = await db
      .select({
        id: websiteSettingVersions.id,
        section: websiteSettingVersions.section,
        config: websiteSettingVersions.config,
        sourceOwner: websiteSettingVersions.sourceOwner,
        version: websiteSettingVersions.version,
      })
      .from(websiteSettingVersions)
      .where(
        and(
          eq(websiteSettingVersions.id, body.versionId),
          eq(websiteSettingVersions.section, body.section),
        ),
      )
      .limit(1)

    if (!storedVersion) {
      return NextResponse.json({ error: 'Immutable setting version not found' }, { status: 404 })
    }

    const expectedToken = restoreConfirmationToken(body.section, storedVersion.version, storedVersion.id)
    if (body.confirmationToken !== expectedToken) {
      return NextResponse.json({ error: 'Restore confirmation does not match this version' }, { status: 400 })
    }

    const definition = getWebsiteSettingDefinition(body.section)
    const validation = definition.validate(storedVersion.config)
    if (!validation.valid || storedVersion.config === null) {
      return NextResponse.json({
        error: 'This stored version does not match the current setting schema and cannot be restored',
        validationErrors: validation.errors,
      }, { status: 422 })
    }

    const result = await writeWebsiteSetting({
      section: body.section,
      config: storedVersion.config,
      baseVersion: body.baseVersion as number,
      source: 'history-restore',
      action: 'website-settings.restore',
      notes: `Restored ${body.section} from version ${storedVersion.version}`,
      auditContext: {
        restoredFromVersionId: storedVersion.id,
        restoredFromVersion: storedVersion.version,
        restoredSourceOwner: storedVersion.sourceOwner,
      },
    })

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      restoredFrom: {
        id: storedVersion.id,
        version: storedVersion.version,
        sourceOwner: storedVersion.sourceOwner,
      },
      setting: result.setting,
    })
  } catch (error) {
    console.error('[admin-history] failed to restore website setting', error)
    return NextResponse.json({ error: 'Failed to restore website setting' }, { status: 500 })
  }
}
