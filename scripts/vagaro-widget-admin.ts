/**
 * Audit or refresh LashPop's service-specific Vagaro widget mappings.
 *
 * Vagaro's WidgetEmbeddedLoader URLs are opaque snapshots created by the
 * authenticated Booking Widget builder. They cannot be derived from a numeric
 * ServiceID or from another widget URL.
 *
 * Requirements:
 *   1. Safari is open and logged into Vagaro.
 *   2. This page is loaded:
 *      https://us02.vagaro.com/merchants/settings/premiumfeature/integration/widget
 *
 * Safe, read-only audit:
 *   npx tsx scripts/vagaro-widget-admin.ts audit
 *
 * Explicitly refresh every active Vagaro-backed service:
 *   npx tsx scripts/vagaro-widget-admin.ts refresh --apply
 *
 * The refresh:
 *   - reads auth only inside the existing Safari page;
 *   - matches services by exact name AND parent category;
 *   - generates every loader before changing D1;
 *   - updates all mappings in one D1 statement;
 *   - writes the non-secret mapping manifest used by health checks; and
 *   - restores the widget builder configuration it found at startup.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dirname, '..')
const WRANGLER = resolve(
  REPO_ROOT,
  'workers/vagaro-sync/node_modules/.bin/wrangler',
)
const WRANGLER_CONFIG = resolve(
  REPO_ROOT,
  'workers/vagaro-sync/wrangler.jsonc',
)
const MANIFEST_PATH = resolve(
  REPO_ROOT,
  'workers/vagaro-sync/src/vagaro-widget-manifest.json',
)
const SAFARI_WIDGET_PATH = '/integration/widget'
const ASYNC_RESULT_KEY = '__lashpopVagaroWidgetAdmin'

interface CatalogRecord {
  serviceId: string
  parentServiceId: string
  serviceLevel: number
  serviceTitle: string
  eventType: number
}

interface WidgetDetails {
  widgetId: string
  widgetServiceId: string
  serviceProviderId: string
  serviceIds: string
  type: number
  buttonColor: string
  commonColor: string
  redirectAfterBooking: string
  widgetTitle: string
  customButtontext: string
  isServiceTabVisible: boolean
  isClassesTabVisible: boolean
  isReviewTabVisible: boolean
  isGCTabVisible: boolean
  isBookTabVisible: boolean
  isProductTabVisible: boolean
  isMembershipTabVisible: boolean
  isAppShow: boolean
  isMultiLocation: boolean
}

interface Discovery {
  catalog: CatalogRecord[]
  widget: WidgetDetails
}

interface DatabaseService {
  id: string
  name: string
  main_category: string
  vagaro_service_id: string
  vagaro_widget_url: string | null
}

interface MappingTarget {
  databaseServiceId: string
  vagaroServiceId: string
  name: string
  category: string
  encryptedServiceId: string
  encryptedParentServiceId: string
  currentWidgetUrl: string | null
}

interface GeneratedMapping extends MappingTarget {
  widgetUrl: string
}

interface MappingManifest {
  version: 1
  generatedAt: string
  source: string
  mappingCount: number
  mappings: Array<Omit<GeneratedMapping, 'currentWidgetUrl'>>
}

function appleScriptString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ')
}

function runSafariJavaScript(source: string): string {
  const script = `
tell application "Safari"
  repeat with browserWindow in windows
    repeat with browserTab in tabs of browserWindow
      if (URL of browserTab) contains "${SAFARI_WIDGET_PATH}" then
        return do JavaScript "${appleScriptString(source)}" in browserTab
      end if
    end repeat
  end repeat
  error "Open the Vagaro Booking Widget builder in Safari first."
end tell`

  return execFileSync('osascript', ['-e', script], {
    encoding: 'utf8',
    maxBuffer: 5 * 1024 * 1024,
  }).trim()
}

function startSafariTask(body: string): void {
  const source = `
    (function () {
      window.${ASYNC_RESULT_KEY} = { state: "running", completed: 0 };
      (async function () {
        ${body}
      })()
        .then(function (value) {
          window.${ASYNC_RESULT_KEY} = { state: "done", value: value };
        })
        .catch(function (error) {
          window.${ASYNC_RESULT_KEY} = {
            state: "error",
            error: error && error.stack ? error.stack : String(error)
          };
        });
      return "started";
    })()
  `
  const result = runSafariJavaScript(source)
  if (result !== 'started') throw new Error(`Safari task did not start: ${result}`)
}

async function waitForSafariTask<T>(
  timeoutMs: number,
  onProgress?: (result: Record<string, unknown>) => void,
): Promise<T> {
  const startedAt = Date.now()
  let lastCompleted = -1

  while (Date.now() - startedAt < timeoutMs) {
    const raw = runSafariJavaScript(
      `JSON.stringify(window.${ASYNC_RESULT_KEY} || null)`,
    )
    const result = JSON.parse(raw || 'null') as
      | {
          state: 'running'
          completed?: number
          total?: number
          current?: string
        }
      | { state: 'done'; value: T }
      | { state: 'error'; error: string }
      | null

    if (!result) throw new Error('Safari task state disappeared')
    if (result.state === 'done') return result.value
    if (result.state === 'error') throw new Error(result.error)

    if (
      onProgress &&
      typeof result.completed === 'number' &&
      result.completed !== lastCompleted
    ) {
      lastCompleted = result.completed
      onProgress(result as unknown as Record<string, unknown>)
    }

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  throw new Error(`Safari task timed out after ${Math.round(timeoutMs / 1000)}s`)
}

function browserApiHelpers(): string {
  return `
    function readCookie(name) {
      var item = document.cookie
        .split("; ")
        .find(function (part) { return part.indexOf(name + "=") === 0; });
      return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
    }
    function apiHeaders() {
      var reportData = JSON.parse(readCookie("rpt_data") || "{}");
      return {
        s_utkn: readCookie("s_utkn"),
        merchantId: reportData.MerchantId || "",
        userId: reportData.UserId || "",
        employeeid: reportData.UserId || "",
        grouptoken: reportData.grouptoken || "us02",
        device: "Website",
        module: "Settings",
        userAgent: navigator.userAgent,
        "Content-Type": "application/json"
      };
    }
    function apiBase() {
      var reportData = JSON.parse(readCookie("rpt_data") || "{}");
      return "https://api.vagaro.com/" +
        (reportData.grouptoken || "us02").toLowerCase() +
        "/api/v2/merchants/settings/book/";
    }
    async function apiJson(path, options) {
      var response = await fetch(
        apiBase() + path,
        Object.assign({}, options || {}, { headers: apiHeaders() })
      );
      var text = await response.text();
      var payload;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch (error) {
        throw new Error(path + " returned invalid JSON (" + response.status + ")");
      }
      if (!response.ok || !payload || payload.responseCode !== 1000) {
        throw new Error(
          path + " failed (" + response.status + "): " +
          (payload && payload.message ? payload.message : text.slice(0, 300))
        );
      }
      return payload.data;
    }
    function currentServiceProviderId() {
      var resource = performance
        .getEntriesByType("resource")
        .map(function (entry) { return entry.name; })
        .find(function (url) {
          return url.indexOf("/settings/book/widgetdetails?serviceProviderId=") >= 0;
        });
      if (!resource) {
        throw new Error(
          "Could not identify the active widget service provider. Reload the builder."
        );
      }
      return new URL(resource).searchParams.get("serviceProviderId");
    }
  `
}

async function discoverVagaro(): Promise<Discovery> {
  startSafariTask(`
    ${browserApiHelpers()}
    var serviceProviderId = currentServiceProviderId();
    var results = await Promise.all([
      apiJson("serviceandclasses?ServiceProviderId=0"),
      apiJson(
        "widgetdetails?serviceProviderId=" +
        encodeURIComponent(serviceProviderId)
      )
    ]);
    return { catalog: results[0], widget: results[1].widget };
  `)
  return waitForSafariTask<Discovery>(30_000)
}

function parseWranglerJson(raw: string): any[] {
  const jsonStart = raw.indexOf('[')
  if (jsonStart < 0) throw new Error(`Wrangler did not return JSON: ${raw}`)
  return JSON.parse(raw.slice(jsonStart))
}

function executeD1(command: string): any[] {
  const raw = execFileSync(
    WRANGLER,
    [
      'd1',
      'execute',
      'lashpop-production',
      '--remote',
      '--config',
      WRANGLER_CONFIG,
      '--command',
      command,
      '--json',
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  return parseWranglerJson(raw)
}

function loadDatabaseServices(): DatabaseService[] {
  const response = executeD1(`
    SELECT
      id,
      name,
      main_category,
      vagaro_service_id,
      vagaro_widget_url
    FROM services
    WHERE is_active = 1
      AND vagaro_service_id IS NOT NULL
    ORDER BY main_category, name;
  `)
  return response.flatMap(item => item.results || []) as DatabaseService[]
}

function mappingKey(category: string, name: string): string {
  return `${category.trim()}\u0000${name.trim()}`
}

function buildTargets(
  catalog: CatalogRecord[],
  databaseServices: DatabaseService[],
): {
  targets: MappingTarget[]
  catalogOnly: Array<{ name: string; category: string }>
} {
  const parents = new Map(
    catalog
      .filter(item => item.serviceLevel === 0)
      .map(item => [item.serviceId, item.serviceTitle]),
  )
  const catalogByKey = new Map<string, CatalogRecord>()

  for (const item of catalog.filter(record => record.serviceLevel === 1)) {
    const parentTitle = parents.get(item.parentServiceId)
    if (!parentTitle) {
      throw new Error(`Missing parent category for Vagaro service ${item.serviceTitle}`)
    }
    const key = mappingKey(parentTitle, item.serviceTitle)
    if (catalogByKey.has(key)) {
      throw new Error(`Duplicate Vagaro catalog key: ${parentTitle} / ${item.serviceTitle}`)
    }
    catalogByKey.set(key, item)
  }

  const databaseKeys = new Set<string>()
  const targets = databaseServices.map(row => {
    const key = mappingKey(row.main_category, row.name)
    if (databaseKeys.has(key)) {
      throw new Error(`Duplicate database service key: ${row.main_category} / ${row.name}`)
    }
    databaseKeys.add(key)

    const catalogService = catalogByKey.get(key)
    if (!catalogService) {
      throw new Error(
        `Active database service is absent from Vagaro's widget catalog: ` +
        `${row.main_category} / ${row.name} (#${row.vagaro_service_id})`,
      )
    }

    return {
      databaseServiceId: row.id,
      vagaroServiceId: row.vagaro_service_id,
      name: row.name,
      category: row.main_category,
      encryptedServiceId: catalogService.serviceId,
      encryptedParentServiceId: catalogService.parentServiceId,
      currentWidgetUrl: row.vagaro_widget_url,
    }
  })

  const catalogOnly = Array.from(catalogByKey.entries())
    .filter(([key]) => !databaseKeys.has(key))
    .map(([, item]) => ({
      name: item.serviceTitle,
      category: parents.get(item.parentServiceId) || 'Unknown',
    }))

  return { targets, catalogOnly }
}

function isGeneratedLoader(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'www.vagaro.com' || url.hostname === 'vagaro.com') &&
      url.pathname.includes('/resources/WidgetEmbeddedLoader/') &&
      Boolean(url.searchParams.get('v')?.trim())
    )
  } catch {
    return false
  }
}

function validateTargets(targets: MappingTarget[]): string[] {
  const errors: string[] = []
  const databaseIds = new Set<string>()
  const numericIds = new Set<string>()
  const encryptedIds = new Set<string>()

  for (const target of targets) {
    if (databaseIds.has(target.databaseServiceId)) {
      errors.push(`Duplicate database id: ${target.databaseServiceId}`)
    }
    if (numericIds.has(target.vagaroServiceId)) {
      errors.push(`Duplicate numeric Vagaro id: ${target.vagaroServiceId}`)
    }
    if (encryptedIds.has(target.encryptedServiceId)) {
      errors.push(`Duplicate encrypted Vagaro id: ${target.encryptedServiceId}`)
    }
    databaseIds.add(target.databaseServiceId)
    numericIds.add(target.vagaroServiceId)
    encryptedIds.add(target.encryptedServiceId)

    if (!isGeneratedLoader(target.currentWidgetUrl)) {
      errors.push(`${target.category} / ${target.name} lacks a generated loader URL`)
    }
  }

  return errors
}

function loadManifest(): MappingManifest | null {
  if (!existsSync(MANIFEST_PATH)) return null
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as MappingManifest
}

function compareManifest(
  targets: MappingTarget[],
  manifest: MappingManifest | null,
): string[] {
  if (!manifest) return ['The verified widget mapping manifest does not exist yet']

  const errors: string[] = []
  const byDatabaseId = new Map(
    manifest.mappings.map(mapping => [mapping.databaseServiceId, mapping]),
  )

  for (const target of targets) {
    const expected = byDatabaseId.get(target.databaseServiceId)
    if (!expected) {
      errors.push(`Manifest is missing ${target.category} / ${target.name}`)
      continue
    }
    if (expected.vagaroServiceId !== target.vagaroServiceId) {
      errors.push(`${target.name}: numeric Vagaro service id drifted`)
    }
    if (
      expected.name !== target.name ||
      expected.category !== target.category
    ) {
      errors.push(`${target.name}: name/category drifted from the manifest`)
    }
    if (expected.widgetUrl !== target.currentWidgetUrl) {
      errors.push(`${target.name}: database loader differs from the verified manifest`)
    }
  }

  if (manifest.mappings.length !== targets.length) {
    errors.push(
      `Manifest has ${manifest.mappings.length} mappings; database has ${targets.length}`,
    )
  }

  return errors
}

function createSavePayload(widget: WidgetDetails): Record<string, unknown> {
  return {
    encWidgetId: widget.widgetId,
    buttonColor: widget.buttonColor,
    isServiceTabVisible: widget.isServiceTabVisible,
    isClassesTabVisible: widget.isClassesTabVisible,
    isReviewTabVisible: widget.isReviewTabVisible,
    isGCTabVisible: widget.isGCTabVisible,
    isBookTabVisible: widget.isBookTabVisible,
    isProductTabVisible: widget.isProductTabVisible,
    isMembershipTabVisible: widget.isMembershipTabVisible,
    isAppShow: widget.isAppShow,
    whereToOpen: widget.type,
    isMultiLocation: widget.isMultiLocation,
    multiLocBusinessId: 0,
    customButtontext: widget.customButtontext,
    tabAtLaunch: '1',
    redirectAfterBooking: widget.redirectAfterBooking,
    widgetTitle: widget.widgetTitle,
    logo: '',
    encWidgetServiceId: widget.widgetServiceId,
    serviceIds: widget.serviceIds,
    classIds: '',
    iframeHeader: widget.widgetTitle,
    serviceProviderId: widget.serviceProviderId,
    multiLocationBusinessIds: null,
    type: widget.type,
    commonColor: widget.commonColor,
  }
}

async function generateMappings(
  widget: WidgetDetails,
  targets: MappingTarget[],
): Promise<GeneratedMapping[]> {
  const safeTargets = targets.map(
    ({
      databaseServiceId,
      vagaroServiceId,
      name,
      category,
      encryptedServiceId,
      encryptedParentServiceId,
      currentWidgetUrl,
    }) => ({
      databaseServiceId,
      vagaroServiceId,
      name,
      category,
      encryptedServiceId,
      encryptedParentServiceId,
      currentWidgetUrl,
    }),
  )
  const basePayload = createSavePayload(widget)

  startSafariTask(`
    ${browserApiHelpers()}
    var targets = ${JSON.stringify(safeTargets)};
    var basePayload = ${JSON.stringify(basePayload)};
    var originalServiceIds = basePayload.serviceIds;
    var generated = [];
    var primaryError = null;

    try {
      for (var index = 0; index < targets.length; index += 1) {
        var target = targets[index];
        window.${ASYNC_RESULT_KEY} = {
          state: "running",
          completed: index,
          total: targets.length,
          current: target.category + " / " + target.name
        };
        var payload = Object.assign({}, basePayload, {
          serviceIds:
            target.encryptedServiceId + "," +
            target.encryptedParentServiceId
        });
        var result = await apiJson("save-widgetdetails", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        var match = String(result.code || "").match(
          /src="([^"]*WidgetEmbeddedLoader[^"]*)/
        );
        if (!match || !match[1]) {
          throw new Error(
            "Vagaro did not return a loader URL for " +
            target.category + " / " + target.name
          );
        }
        generated.push(Object.assign({}, target, { widgetUrl: match[1] }));
        await new Promise(function (resolve) { setTimeout(resolve, 30); });
      }
    } catch (error) {
      primaryError = error;
    }

    try {
      await apiJson("save-widgetdetails", {
        method: "POST",
        body: JSON.stringify(
          Object.assign({}, basePayload, { serviceIds: originalServiceIds })
        )
      });
    } catch (restoreError) {
      if (!primaryError) primaryError = new Error(
        "Mappings generated, but the original builder state could not be restored: " +
        String(restoreError)
      );
    }

    if (primaryError) throw primaryError;
    return generated;
  `)

  return waitForSafariTask<GeneratedMapping[]>(
    10 * 60_000,
    progress => {
      const completed = Number(progress.completed || 0)
      const total = Number(progress.total || targets.length)
      const current = String(progress.current || '')
      console.log(`  ${completed}/${total} ${current}`)
    },
  )
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function updateDatabase(generated: GeneratedMapping[]): void {
  const cases = generated
    .map(
      mapping =>
        `WHEN ${sqlString(mapping.databaseServiceId)} ` +
        `THEN ${sqlString(mapping.widgetUrl)}`,
    )
    .join('\n')
  const ids = generated
    .map(mapping => sqlString(mapping.databaseServiceId))
    .join(', ')

  const response = executeD1(`
    UPDATE services
    SET
      vagaro_widget_url = CASE id
        ${cases}
        ELSE vagaro_widget_url
      END,
      vagaro_service_code = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id IN (${ids});
  `)
  const changes = Number(response[0]?.meta?.changes || 0)
  if (changes !== generated.length) {
    throw new Error(
      `D1 changed ${changes} rows; expected ${generated.length}. ` +
      'The manifest was not written.',
    )
  }
}

function writeManifest(generated: GeneratedMapping[]): void {
  const manifest: MappingManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source:
      'Vagaro Booking Widget builder service catalog + save-widgetdetails response',
    mappingCount: generated.length,
    mappings: generated
      .map(({ currentWidgetUrl: _currentWidgetUrl, ...mapping }) => mapping)
      .sort(
        (left, right) =>
          left.category.localeCompare(right.category) ||
          left.name.localeCompare(right.name),
      ),
  }
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
}

async function audit(): Promise<void> {
  console.log('Reading Vagaro widget catalog from the logged-in Safari page…')
  const [discovery, databaseServices] = await Promise.all([
    discoverVagaro(),
    Promise.resolve(loadDatabaseServices()),
  ])
  const { targets, catalogOnly } = buildTargets(
    discovery.catalog,
    databaseServices,
  )
  const errors = [
    ...validateTargets(targets),
    ...compareManifest(targets, loadManifest()),
  ]

  console.log(`Matched ${targets.length} active Vagaro-backed services exactly.`)
  if (catalogOnly.length > 0) {
    console.log(
      `Vagaro-only (not active on the site): ` +
      catalogOnly.map(item => `${item.category} / ${item.name}`).join(', '),
    )
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(`  ERROR: ${error}`)
    throw new Error(`Vagaro widget audit failed with ${errors.length} issue(s)`)
  }

  console.log('All database URLs match the verified mapping manifest.')
}

async function refresh(): Promise<void> {
  if (!process.argv.includes('--apply')) {
    throw new Error(
      'Refresh writes new Vagaro widget snapshots and updates production D1. ' +
      'Re-run with --apply after reviewing the command.',
    )
  }

  console.log('Discovering Vagaro services and the current builder state…')
  const discovery = await discoverVagaro()
  const databaseServices = loadDatabaseServices()
  const { targets, catalogOnly } = buildTargets(
    discovery.catalog,
    databaseServices,
  )

  if (targets.length < 50) {
    throw new Error(
      `Refusing to refresh only ${targets.length} mappings; expected the full catalog.`,
    )
  }

  console.log(`Generating ${targets.length} exact service widget snapshots…`)
  if (catalogOnly.length > 0) {
    console.log(
      `Leaving inactive/catalog-only services untouched: ` +
      catalogOnly.map(item => `${item.category} / ${item.name}`).join(', '),
    )
  }
  const generated = await generateMappings(discovery.widget, targets)

  const invalid = generated.filter(mapping => !isGeneratedLoader(mapping.widgetUrl))
  const uniqueUrls = new Set(generated.map(mapping => mapping.widgetUrl))
  if (invalid.length > 0 || uniqueUrls.size !== targets.length) {
    throw new Error(
      `Generated batch failed validation: ${invalid.length} invalid URL(s), ` +
      `${uniqueUrls.size}/${targets.length} unique URL(s). Production was not changed.`,
    )
  }

  console.log('All loaders validated. Updating production D1 in one statement…')
  updateDatabase(generated)
  writeManifest(generated)

  const refreshedRows = loadDatabaseServices()
  const { targets: refreshedTargets } = buildTargets(
    discovery.catalog,
    refreshedRows,
  )
  const errors = [
    ...validateTargets(refreshedTargets),
    ...compareManifest(refreshedTargets, loadManifest()),
  ]
  if (errors.length > 0) {
    throw new Error(`Post-update audit failed:\n${errors.join('\n')}`)
  }

  console.log(
    `Refreshed and verified ${generated.length} mappings. ` +
    `Manifest: ${MANIFEST_PATH}`,
  )
}

async function main(): Promise<void> {
  const command = process.argv[2] || 'audit'
  if (command === 'audit') return audit()
  if (command === 'refresh') return refresh()
  throw new Error(`Unknown command "${command}". Use audit or refresh --apply.`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
