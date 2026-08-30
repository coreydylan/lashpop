import 'server-only'

import {
  ANALYTICS_EVENTS,
  type AnalyticsEventName,
} from '@/lib/analytics-events'

const VERCEL_ANALYTICS_API = 'https://api.vercel.com/v1/query/web-analytics'
const CACHE_REVALIDATE_SECONDS = 300
const UPSTREAM_TIMEOUT_MS = 8_000
const MAX_AGGREGATE_ROWS = 100

export const ADMIN_ANALYTICS_RANGES = ['7d', '30d', '90d'] as const
export type AdminAnalyticsRange = (typeof ADMIN_ANALYTICS_RANGES)[number]
export type AdminAnalyticsSource = 'vercel' | 'fixture'

export interface AdminAnalyticsMetric {
  current: number
  previous: number
  change: number
  changePercent: number | null
}

export interface AdminAnalyticsRatio {
  currentPercent: number | null
  previousPercent: number | null
  changePercentagePoints: number | null
}

export interface AdminAnalyticsDto {
  source: AdminAnalyticsSource
  range: {
    value: AdminAnalyticsRange
    days: number
    current: AdminAnalyticsDateWindow
    previous: AdminAnalyticsDateWindow
  }
  overview: {
    visitors: AdminAnalyticsMetric
    pageviews: AdminAnalyticsMetric
    bookingStarts: AdminAnalyticsMetric
    bookingCompletions: AdminAnalyticsMetric
  }
  dailyTraffic: Array<{
    date: string
    visitors: number
    pageviews: number
  }>
  acquisition: {
    sources: Array<{
      source: string
      visitors: number
      pageviews: number
      sharePercent: number
    }>
    devices: Array<{
      device: AdminAnalyticsDevice
      visitors: number
      pageviews: number
      sharePercent: number
    }>
  }
  conversion: {
    events: Array<{
      name: AnalyticsEventName
      label: string
      current: number
      previous: number
      change: number
      changePercent: number | null
      daily: Array<{
        date: string
        count: number
      }>
    }>
    bookingCompletionRate: AdminAnalyticsRatio
    quizCompletionRate: AdminAnalyticsRatio
  }
  content: {
    pages: Array<{
      path: string
      visitors: number
      pageviews: number
      sharePercent: number
    }>
  }
  generatedAt: string
}

export interface AdminAnalyticsConfig {
  token: string | undefined
  projectId: string | undefined
  teamId?: string | undefined
  slug?: string | undefined
}

export interface GetAdminAnalyticsOptions {
  range: AdminAnalyticsRange
  config: AdminAnalyticsConfig
  fetch?: typeof globalThis.fetch
  now?: () => Date
}

export type AdminAnalyticsErrorCode =
  | 'INVALID_RANGE'
  | 'INVALID_CONFIG'
  | 'UPSTREAM_REQUEST_FAILED'
  | 'UPSTREAM_RESPONSE_INVALID'

export class AdminAnalyticsError extends Error {
  readonly code: AdminAnalyticsErrorCode

  constructor(code: AdminAnalyticsErrorCode, message: string) {
    super(message)
    this.name = 'AdminAnalyticsError'
    this.code = code
  }
}

interface AdminAnalyticsDateWindow {
  since: string
  until: string
}

type AdminAnalyticsDevice = 'Desktop' | 'Mobile' | 'Tablet' | 'Other'

type ProviderRow = Record<string, unknown>

interface TrafficPoint {
  date: string
  visitors: number
  pageviews: number
}

interface EventPoint {
  date: string
  eventName: AnalyticsEventName
  count: number
}

interface AggregateRequest {
  dataset: 'visits' | 'events'
  window: AdminAnalyticsDateWindow
  by: readonly string[]
  filter: string
  limit?: number
}

interface VisitTotals {
  visitors: number
  pageviews: number
}

interface ValidConfig {
  token: string
  projectId: string
  teamId?: string
  slug?: string
}

interface NextFetchInit extends RequestInit {
  next: {
    revalidate: number
  }
}

const RANGE_DAYS: Record<AdminAnalyticsRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

const EVENT_NAMES = Object.values(ANALYTICS_EVENTS) as AnalyticsEventName[]
const EVENT_NAME_SET = new Set<string>(EVENT_NAMES)

const EVENT_LABELS: Record<AnalyticsEventName, string> = {
  [ANALYTICS_EVENTS.bookingStarted]: 'Booking started',
  [ANALYTICS_EVENTS.bookingCompleted]: 'Booking completed',
  [ANALYTICS_EVENTS.quizStarted]: 'Quiz started',
  [ANALYTICS_EVENTS.quizCompleted]: 'Quiz completed',
  [ANALYTICS_EVENTS.workWithUsSubmitted]: 'Work With Us submitted',
  [ANALYTICS_EVENTS.newsletterSignupCompleted]: 'Newsletter signup completed',
}

const INTERNAL_PATH_PREFIXES = [
  '/admin',
  '/api',
  '/_next',
  '/preview',
  '/punchlist',
  '/confirm',
  '/login',
  '/seoguide',
  '/staffphoto',
  '/dam',
] as const

// Group content by framework route rather than raw request path. This is a
// deliberate privacy boundary: dynamic URL segments never enter the DTO.
const PUBLIC_CONTENT_ROUTES = new Set([
  '/',
  '/services',
  '/services/[slug]',
  '/work-with-us',
  '/privacy',
  '/terms',
])

const VISIT_FILTER = [
  "environment eq 'production'",
  ...INTERNAL_PATH_PREFIXES.map(
    (prefix) => `not startswith(requestPath, '${prefix}')`
  ),
].join(' and ')

const EVENT_FILTER = [
  "environment eq 'production'",
  `eventName in (${EVENT_NAMES.map((name) => `'${name}'`).join(',')})`,
].join(' and ')

export function parseAdminAnalyticsRange(value: unknown): AdminAnalyticsRange {
  if (
    typeof value === 'string' &&
    ADMIN_ANALYTICS_RANGES.includes(value as AdminAnalyticsRange)
  ) {
    return value as AdminAnalyticsRange
  }

  throw new AdminAnalyticsError('INVALID_RANGE', 'Unsupported analytics date range.')
}

export async function getAdminAnalytics(
  options: GetAdminAnalyticsOptions
): Promise<AdminAnalyticsDto> {
  const range = parseAdminAnalyticsRange(options.range)
  const config = validateConfig(options.config)
  const fetchImpl = options.fetch ?? globalThis.fetch
  const now = readNow(options.now)
  const rangeMetadata = buildRangeMetadata(range, now)

  if (typeof fetchImpl !== 'function') {
    throw new AdminAnalyticsError(
      'INVALID_CONFIG',
      'Analytics transport is not configured.'
    )
  }

  const [
    currentTrafficTotals,
    previousTrafficTotals,
    currentTrafficRows,
    sourceRows,
    deviceRows,
    pageRows,
    currentEventRows,
    previousEventRows,
  ] = await Promise.all([
    fetchVisitCount(config, fetchImpl, rangeMetadata.current),
    fetchVisitCount(config, fetchImpl, rangeMetadata.previous),
    fetchAggregate(config, fetchImpl, {
      dataset: 'visits',
      window: rangeMetadata.current,
      by: ['day'],
      filter: VISIT_FILTER,
    }),
    fetchAggregate(config, fetchImpl, {
      dataset: 'visits',
      window: rangeMetadata.current,
      by: ['referrerHostname'],
      filter: VISIT_FILTER,
      limit: 12,
    }),
    fetchAggregate(config, fetchImpl, {
      dataset: 'visits',
      window: rangeMetadata.current,
      by: ['deviceType'],
      filter: VISIT_FILTER,
      limit: 10,
    }),
    fetchAggregate(config, fetchImpl, {
      dataset: 'visits',
      window: rangeMetadata.current,
      by: ['route'],
      filter: VISIT_FILTER,
      limit: 25,
    }),
    fetchAggregate(config, fetchImpl, {
      dataset: 'events',
      window: rangeMetadata.current,
      by: ['day', 'eventName'],
      filter: EVENT_FILTER,
      limit: EVENT_NAMES.length,
    }),
    fetchAggregate(config, fetchImpl, {
      dataset: 'events',
      window: rangeMetadata.previous,
      by: ['day', 'eventName'],
      filter: EVENT_FILTER,
      limit: EVENT_NAMES.length,
    }),
  ])

  return buildDto({
    source: 'vercel',
    range: rangeMetadata,
    currentTrafficTotals,
    previousTrafficTotals,
    currentTrafficRows,
    sourceRows,
    deviceRows,
    pageRows,
    currentEventRows,
    previousEventRows,
    generatedAt: now.toISOString(),
  })
}

export function buildAdminAnalyticsFixture(
  range: AdminAnalyticsRange = '30d',
  now: Date = new Date()
): AdminAnalyticsDto {
  const parsedRange = parseAdminAnalyticsRange(range)
  const safeNow = validateDate(now)
  const rangeMetadata = buildRangeMetadata(parsedRange, safeNow)
  const currentDates = listDays(rangeMetadata.current)
  const previousDates = listDays(rangeMetadata.previous)

  const currentTrafficRows: ProviderRow[] = currentDates.map((date, index) => ({
    timestamp: `${date}T00:00:00.000Z`,
    visitors: 31 + ((index * 7 + 5) % 19),
    pageviews: 49 + ((index * 11 + 7) % 31),
  }))
  const previousTrafficRows: ProviderRow[] = previousDates.map((date, index) => ({
    timestamp: `${date}T00:00:00.000Z`,
    visitors: 27 + ((index * 5 + 3) % 17),
    pageviews: 43 + ((index * 9 + 2) % 27),
  }))

  const summedCurrentVisitors = currentTrafficRows.reduce(
    (total, row) => total + readCount(row.visitors),
    0
  )
  const summedCurrentPageviews = currentTrafficRows.reduce(
    (total, row) => total + readCount(row.pageviews),
    0
  )
  const currentTrafficTotals = {
    visitors: Math.round(summedCurrentVisitors * 0.74),
    pageviews: summedCurrentPageviews,
  }
  const previousTrafficTotals = {
    visitors: Math.round(
      previousTrafficRows.reduce((total, row) => total + readCount(row.visitors), 0) * 0.75
    ),
    pageviews: previousTrafficRows.reduce(
      (total, row) => total + readCount(row.pageviews),
      0
    ),
  }

  const sourceRows: ProviderRow[] = [
    { referrerHostname: 'google.com', visitors: Math.round(currentTrafficTotals.visitors * 0.39), pageviews: Math.round(currentTrafficTotals.pageviews * 0.38) },
    { referrerHostname: 'instagram.com', visitors: Math.round(currentTrafficTotals.visitors * 0.24), pageviews: Math.round(currentTrafficTotals.pageviews * 0.25) },
    { referrerHostname: '', visitors: Math.round(currentTrafficTotals.visitors * 0.21), pageviews: Math.round(currentTrafficTotals.pageviews * 0.2) },
    { referrerHostname: 'yelp.com', visitors: Math.round(currentTrafficTotals.visitors * 0.1), pageviews: Math.round(currentTrafficTotals.pageviews * 0.11) },
    { referrerHostname: 'Others', visitors: Math.round(currentTrafficTotals.visitors * 0.06), pageviews: Math.round(currentTrafficTotals.pageviews * 0.06) },
  ]

  const deviceRows: ProviderRow[] = [
    { deviceType: 'mobile', visitors: Math.round(currentTrafficTotals.visitors * 0.68), pageviews: Math.round(currentTrafficTotals.pageviews * 0.65) },
    { deviceType: 'desktop', visitors: Math.round(currentTrafficTotals.visitors * 0.27), pageviews: Math.round(currentTrafficTotals.pageviews * 0.3) },
    { deviceType: 'tablet', visitors: Math.round(currentTrafficTotals.visitors * 0.05), pageviews: Math.round(currentTrafficTotals.pageviews * 0.05) },
  ]

  const pageRows: ProviderRow[] = [
    { route: '/', visitors: Math.round(currentTrafficTotals.visitors * 0.47), pageviews: Math.round(currentTrafficTotals.pageviews * 0.43) },
    { route: '/services', visitors: Math.round(currentTrafficTotals.visitors * 0.12), pageviews: Math.round(currentTrafficTotals.pageviews * 0.13) },
    { route: '/services/[slug]', visitors: Math.round(currentTrafficTotals.visitors * 0.1), pageviews: Math.round(currentTrafficTotals.pageviews * 0.11) },
    { route: '/work-with-us', visitors: Math.round(currentTrafficTotals.visitors * 0.13), pageviews: Math.round(currentTrafficTotals.pageviews * 0.14) },
    { route: '/privacy', visitors: Math.round(currentTrafficTotals.visitors * 0.1), pageviews: Math.round(currentTrafficTotals.pageviews * 0.11) },
    { route: '/terms', visitors: Math.round(currentTrafficTotals.visitors * 0.08), pageviews: Math.round(currentTrafficTotals.pageviews * 0.08) },
  ]

  const currentEventRows = buildFixtureEventRows(currentDates, 1)
  const previousEventRows = buildFixtureEventRows(previousDates, 0)

  return buildDto({
    source: 'fixture',
    range: rangeMetadata,
    currentTrafficTotals,
    previousTrafficTotals,
    currentTrafficRows,
    sourceRows,
    deviceRows,
    pageRows,
    currentEventRows,
    previousEventRows,
    generatedAt: safeNow.toISOString(),
  })
}

function validateConfig(config: AdminAnalyticsConfig): ValidConfig {
  const token = readRequiredConfigValue(config.token)
  const projectId = readRequiredConfigValue(config.projectId)
  const teamId = readOptionalConfigValue(config.teamId)
  const slug = readOptionalConfigValue(config.slug)

  if (!token || !projectId || (teamId && slug)) {
    throw new AdminAnalyticsError(
      'INVALID_CONFIG',
      'Analytics provider configuration is incomplete.'
    )
  }

  return {
    token,
    projectId,
    ...(teamId ? { teamId } : {}),
    ...(slug ? { slug } : {}),
  }
}

function readRequiredConfigValue(value: string | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readOptionalConfigValue(value: string | undefined): string | undefined {
  return readRequiredConfigValue(value) ?? undefined
}

function readNow(now: (() => Date) | undefined): Date {
  return validateDate(now ? now() : new Date())
}

function validateDate(value: Date): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new AdminAnalyticsError(
      'INVALID_CONFIG',
      'Analytics clock is not configured.'
    )
  }
  return new Date(value.getTime())
}

function buildRangeMetadata(range: AdminAnalyticsRange, now: Date): AdminAnalyticsDto['range'] {
  const days = RANGE_DAYS[range]
  const currentUntil = addUtcDays(startOfUtcDay(now), -1)
  const currentSince = addUtcDays(currentUntil, -(days - 1))
  const previousUntil = addUtcDays(currentSince, -1)
  const previousSince = addUtcDays(previousUntil, -(days - 1))

  return {
    value: range,
    days,
    current: {
      since: formatDay(currentSince),
      until: formatDay(currentUntil),
    },
    previous: {
      since: formatDay(previousSince),
      until: formatDay(previousUntil),
    },
  }
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function addUtcDays(value: Date, days: number): Date {
  const result = new Date(value.getTime())
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function formatDay(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function listDays(window: AdminAnalyticsDateWindow): string[] {
  const dates: string[] = []
  const cursor = new Date(`${window.since}T00:00:00.000Z`)
  const until = new Date(`${window.until}T00:00:00.000Z`)

  while (cursor.getTime() <= until.getTime()) {
    dates.push(formatDay(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
}

async function fetchVisitCount(
  config: ValidConfig,
  fetchImpl: typeof globalThis.fetch,
  window: AdminAnalyticsDateWindow
): Promise<VisitTotals> {
  const url = new URL(`${VERCEL_ANALYTICS_API}/visits/count`)
  url.searchParams.set('projectId', config.projectId)
  if (config.teamId) url.searchParams.set('teamId', config.teamId)
  if (config.slug) url.searchParams.set('slug', config.slug)
  url.searchParams.set('since', window.since)
  url.searchParams.set('until', window.until)
  url.searchParams.set('filter', VISIT_FILTER)

  const payload = await fetchProviderJson(config, fetchImpl, url)
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw invalidProviderResponse()
  }

  const visitors = readRequiredCount(payload.data.visitors)
  const pageviews = readRequiredCount(payload.data.pageviews)
  if (visitors == null || pageviews == null) {
    throw invalidProviderResponse()
  }

  return {
    visitors,
    pageviews,
  }
}

async function fetchAggregate(
  config: ValidConfig,
  fetchImpl: typeof globalThis.fetch,
  request: AggregateRequest
): Promise<ProviderRow[]> {
  const url = new URL(`${VERCEL_ANALYTICS_API}/${request.dataset}/aggregate`)
  url.searchParams.set('projectId', config.projectId)
  if (config.teamId) url.searchParams.set('teamId', config.teamId)
  if (config.slug) url.searchParams.set('slug', config.slug)
  url.searchParams.set('since', request.window.since)
  url.searchParams.set('until', request.window.until)
  for (const dimension of request.by) {
    url.searchParams.append('by', dimension)
  }
  url.searchParams.set('limit', String(request.limit ?? MAX_AGGREGATE_ROWS))
  url.searchParams.set('filter', request.filter)

  const payload = await fetchProviderJson(config, fetchImpl, url)
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw invalidProviderResponse()
  }

  return payload.data.filter(isRecord)
}

async function fetchProviderJson(
  config: ValidConfig,
  fetchImpl: typeof globalThis.fetch,
  url: URL
): Promise<unknown> {
  const init: NextFetchInit = {
    method: 'GET',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    next: {
      revalidate: CACHE_REVALIDATE_SECONDS,
    },
  }

  let response: Response
  try {
    response = await fetchImpl(url.toString(), init)
  } catch {
    throw new AdminAnalyticsError(
      'UPSTREAM_REQUEST_FAILED',
      'Analytics data is temporarily unavailable.'
    )
  }

  if (!response.ok) {
    throw new AdminAnalyticsError(
      'UPSTREAM_REQUEST_FAILED',
      'Analytics data is temporarily unavailable.'
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw invalidProviderResponse()
  }
  return payload
}

function invalidProviderResponse(): AdminAnalyticsError {
  return new AdminAnalyticsError(
    'UPSTREAM_RESPONSE_INVALID',
    'Analytics provider returned an invalid response.'
  )
}

function buildDto(input: {
  source: AdminAnalyticsSource
  range: AdminAnalyticsDto['range']
  currentTrafficTotals: VisitTotals
  previousTrafficTotals: VisitTotals
  currentTrafficRows: ProviderRow[]
  sourceRows: ProviderRow[]
  deviceRows: ProviderRow[]
  pageRows: ProviderRow[]
  currentEventRows: ProviderRow[]
  previousEventRows: ProviderRow[]
  generatedAt: string
}): AdminAnalyticsDto {
  const currentTraffic = mapTrafficRows(input.currentTrafficRows, input.range.current)
  const currentTrafficTotals = input.currentTrafficTotals
  const previousTrafficTotals = input.previousTrafficTotals
  const currentEvents = mapEventRows(input.currentEventRows, input.range.current)
  const previousEvents = mapEventRows(input.previousEventRows, input.range.previous)

  const eventMetrics = new Map<AnalyticsEventName, AdminAnalyticsMetric>()
  const currentEventTotals = sumEvents(currentEvents)
  const previousEventTotals = sumEvents(previousEvents)

  for (const eventName of EVENT_NAMES) {
    eventMetrics.set(
      eventName,
      compareMetric(
        currentEventTotals.get(eventName) ?? 0,
        previousEventTotals.get(eventName) ?? 0
      )
    )
  }

  const bookingStarts = requireEventMetric(eventMetrics, ANALYTICS_EVENTS.bookingStarted)
  const bookingCompletions = requireEventMetric(eventMetrics, ANALYTICS_EVENTS.bookingCompleted)
  const quizStarts = requireEventMetric(eventMetrics, ANALYTICS_EVENTS.quizStarted)
  const quizCompletions = requireEventMetric(eventMetrics, ANALYTICS_EVENTS.quizCompleted)

  return {
    source: input.source,
    range: input.range,
    overview: {
      visitors: compareMetric(currentTrafficTotals.visitors, previousTrafficTotals.visitors),
      pageviews: compareMetric(currentTrafficTotals.pageviews, previousTrafficTotals.pageviews),
      bookingStarts,
      bookingCompletions,
    },
    dailyTraffic: currentTraffic,
    acquisition: {
      sources: mapSources(input.sourceRows),
      devices: mapDevices(input.deviceRows),
    },
    conversion: {
      events: EVENT_NAMES.map((eventName) => {
        const metric = requireEventMetric(eventMetrics, eventName)
        return {
          name: eventName,
          label: EVENT_LABELS[eventName],
          ...metric,
          daily: input.range.current
            ? listDays(input.range.current).map((date) => ({
                date,
                count:
                  currentEvents.find(
                    (point) => point.date === date && point.eventName === eventName
                  )?.count ?? 0,
              }))
            : [],
        }
      }),
      bookingCompletionRate: compareRatio(
        bookingCompletions.current,
        bookingStarts.current,
        bookingCompletions.previous,
        bookingStarts.previous
      ),
      quizCompletionRate: compareRatio(
        quizCompletions.current,
        quizStarts.current,
        quizCompletions.previous,
        quizStarts.previous
      ),
    },
    content: {
      pages: mapPages(input.pageRows, currentTrafficTotals.pageviews),
    },
    generatedAt: input.generatedAt,
  }
}

function mapTrafficRows(rows: ProviderRow[], window: AdminAnalyticsDateWindow): TrafficPoint[] {
  const byDate = new Map<string, { visitors: number; pageviews: number }>()

  for (const row of rows) {
    const date = readDay(row.timestamp ?? row.day)
    if (!date || !isDateInWindow(date, window)) continue
    const existing = byDate.get(date) ?? { visitors: 0, pageviews: 0 }
    existing.visitors += readCount(row.visitors)
    existing.pageviews += readCount(row.pageviews)
    byDate.set(date, existing)
  }

  return listDays(window).map((date) => ({
    date,
    visitors: byDate.get(date)?.visitors ?? 0,
    pageviews: byDate.get(date)?.pageviews ?? 0,
  }))
}

function mapEventRows(rows: ProviderRow[], window: AdminAnalyticsDateWindow): EventPoint[] {
  const byDateAndName = new Map<string, EventPoint>()

  for (const row of rows) {
    const date = readDay(row.timestamp ?? row.day)
    const eventName = readEventName(row.eventName)
    if (!date || !eventName || !isDateInWindow(date, window)) continue

    const key = `${date}:${eventName}`
    const existing = byDateAndName.get(key)
    byDateAndName.set(key, {
      date,
      eventName,
      count: (existing?.count ?? 0) + readCount(row.count),
    })
  }

  return Array.from(byDateAndName.values()).sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date)
    return dateComparison !== 0
      ? dateComparison
      : EVENT_NAMES.indexOf(a.eventName) - EVENT_NAMES.indexOf(b.eventName)
  })
}

function mapSources(rows: ProviderRow[]): AdminAnalyticsDto['acquisition']['sources'] {
  const grouped = new Map<string, { visitors: number; pageviews: number }>()

  for (const row of rows) {
    const source = normalizeSource(row.referrerHostname)
    const existing = grouped.get(source) ?? { visitors: 0, pageviews: 0 }
    existing.visitors += readCount(row.visitors)
    existing.pageviews += readCount(row.pageviews)
    grouped.set(source, existing)
  }

  const totalVisitors = Array.from(grouped.values()).reduce(
    (total, row) => total + row.visitors,
    0
  )

  return Array.from(grouped.entries())
    .map(([source, totals]) => ({
      source,
      ...totals,
      sharePercent: percentage(totals.visitors, totalVisitors) ?? 0,
    }))
    .filter((row) => row.visitors > 0 || row.pageviews > 0)
    .sort((a, b) => b.visitors - a.visitors || a.source.localeCompare(b.source))
}

function mapDevices(rows: ProviderRow[]): AdminAnalyticsDto['acquisition']['devices'] {
  const grouped = new Map<AdminAnalyticsDevice, { visitors: number; pageviews: number }>()

  for (const row of rows) {
    const device = normalizeDevice(row.deviceType)
    const existing = grouped.get(device) ?? { visitors: 0, pageviews: 0 }
    existing.visitors += readCount(row.visitors)
    existing.pageviews += readCount(row.pageviews)
    grouped.set(device, existing)
  }

  const totalVisitors = Array.from(grouped.values()).reduce(
    (total, row) => total + row.visitors,
    0
  )

  return Array.from(grouped.entries())
    .map(([device, totals]) => ({
      device,
      ...totals,
      sharePercent: percentage(totals.visitors, totalVisitors) ?? 0,
    }))
    .filter((row) => row.visitors > 0 || row.pageviews > 0)
    .sort((a, b) => b.visitors - a.visitors || a.device.localeCompare(b.device))
}

function mapPages(
  rows: ProviderRow[],
  totalPageviews: number
): AdminAnalyticsDto['content']['pages'] {
  const grouped = new Map<string, { visitors: number; pageviews: number }>()

  for (const row of rows) {
    const path = normalizePublicRoute(row.route)
    if (!path) continue
    const existing = grouped.get(path) ?? { visitors: 0, pageviews: 0 }
    existing.visitors += readCount(row.visitors)
    existing.pageviews += readCount(row.pageviews)
    grouped.set(path, existing)
  }

  return Array.from(grouped.entries())
    .map(([path, totals]) => ({
      path,
      ...totals,
      sharePercent: percentage(totals.pageviews, totalPageviews) ?? 0,
    }))
    .filter((row) => row.visitors > 0 || row.pageviews > 0)
    .sort((a, b) => b.pageviews - a.pageviews || a.path.localeCompare(b.path))
}

function sumEvents(points: EventPoint[]): Map<AnalyticsEventName, number> {
  const totals = new Map<AnalyticsEventName, number>()
  for (const point of points) {
    totals.set(point.eventName, (totals.get(point.eventName) ?? 0) + point.count)
  }
  return totals
}

function requireEventMetric(
  metrics: Map<AnalyticsEventName, AdminAnalyticsMetric>,
  eventName: AnalyticsEventName
): AdminAnalyticsMetric {
  return metrics.get(eventName) ?? compareMetric(0, 0)
}

function compareMetric(current: number, previous: number): AdminAnalyticsMetric {
  return {
    current,
    previous,
    change: current - previous,
    changePercent:
      previous === 0
        ? current === 0
          ? 0
          : null
        : roundOne(((current - previous) / previous) * 100),
  }
}

function compareRatio(
  currentNumerator: number,
  currentDenominator: number,
  previousNumerator: number,
  previousDenominator: number
): AdminAnalyticsRatio {
  const currentPercent = percentage(currentNumerator, currentDenominator)
  const previousPercent = percentage(previousNumerator, previousDenominator)

  return {
    currentPercent,
    previousPercent,
    changePercentagePoints:
      currentPercent == null || previousPercent == null
        ? null
        : roundOne(currentPercent - previousPercent),
  }
}

function percentage(numerator: number, denominator: number): number | null {
  return denominator > 0 ? roundOne((numerator / denominator) * 100) : null
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10
}

function readCount(value: unknown): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

function readRequiredCount(value: unknown): number | null {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN

  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null
}

function readDay(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = /^(\d{4}-\d{2}-\d{2})(?:T.*)?$/.exec(value.trim())
  if (!match) return null
  const parsed = new Date(`${match[1]}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && formatDay(parsed) === match[1]
    ? match[1]
    : null
}

function isDateInWindow(date: string, window: AdminAnalyticsDateWindow): boolean {
  return date >= window.since && date <= window.until
}

function readEventName(value: unknown): AnalyticsEventName | null {
  return typeof value === 'string' && EVENT_NAME_SET.has(value)
    ? (value as AnalyticsEventName)
    : null
}

function normalizeSource(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return 'Direct or unavailable'
  const trimmed = value.trim()
  const lower = trimmed.toLowerCase()
  if (['(direct)', 'direct', 'none', 'null', 'unknown'].includes(lower)) {
    return 'Direct or unavailable'
  }
  if (lower === 'others' || lower === 'other') return 'Other'

  let hostname = lower
  if (hostname.includes('://')) {
    try {
      hostname = new URL(hostname).hostname.toLowerCase()
    } catch {
      return 'Other'
    }
  }
  hostname = hostname.replace(/^www\./, '').replace(/\.$/, '')

  if (
    hostname.length === 0 ||
    hostname.length > 253 ||
    !/^[a-z0-9.-]+$/.test(hostname) ||
    hostname.includes('..')
  ) {
    return 'Other'
  }

  return hostname
}

function normalizeDevice(value: unknown): AdminAnalyticsDevice {
  if (typeof value !== 'string') return 'Other'
  switch (value.trim().toLowerCase()) {
    case 'desktop':
      return 'Desktop'
    case 'mobile':
      return 'Mobile'
    case 'tablet':
      return 'Tablet'
    default:
      return 'Other'
  }
}

function normalizePublicRoute(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const route = value.trim()
  return PUBLIC_CONTENT_ROUTES.has(route) ? route : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function buildFixtureEventRows(dates: string[], uplift: number): ProviderRow[] {
  const baseCounts: Record<AnalyticsEventName, number> = {
    [ANALYTICS_EVENTS.bookingStarted]: 4 + uplift,
    [ANALYTICS_EVENTS.bookingCompleted]: 2 + uplift,
    [ANALYTICS_EVENTS.quizStarted]: 3 + uplift,
    [ANALYTICS_EVENTS.quizCompleted]: 2 + uplift,
    [ANALYTICS_EVENTS.workWithUsSubmitted]: 1,
    [ANALYTICS_EVENTS.newsletterSignupCompleted]: 1 + uplift,
  }

  return dates.flatMap((date, dateIndex) =>
    EVENT_NAMES.map((eventName, eventIndex) => ({
      timestamp: `${date}T00:00:00.000Z`,
      eventName,
      count: baseCounts[eventName] + ((dateIndex + eventIndex * 2) % 3),
      visitors: Math.max(1, baseCounts[eventName] - 1),
    }))
  )
}
