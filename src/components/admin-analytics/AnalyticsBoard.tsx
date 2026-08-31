'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Compass,
  FileText,
  Gauge,
  Laptop,
  Minus,
  MousePointerClick,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Users,
} from 'lucide-react'
import { ANALYTICS_EVENTS, type AnalyticsEventName } from '@/lib/analytics-events'
import type {
  AdminAnalyticsDto,
  AdminAnalyticsMetric,
  AdminAnalyticsRange,
  AdminAnalyticsRatio,
} from '@/lib/admin-analytics'

type BoardView = 'overview' | 'acquisition' | 'conversion' | 'content'
type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: AdminAnalyticsDto }
  | { status: 'error'; message: string; code?: string }

const VIEWS: Array<{ value: BoardView; label: string; shortLabel: string; icon: typeof Gauge }> = [
  { value: 'overview', label: 'Overview', shortLabel: 'Overview', icon: Gauge },
  { value: 'acquisition', label: 'Sources', shortLabel: 'Sources', icon: Compass },
  { value: 'conversion', label: 'Recorded actions', shortLabel: 'Actions', icon: MousePointerClick },
  { value: 'content', label: 'Pages', shortLabel: 'Pages', icon: FileText },
]

const RANGE_OPTIONS: Array<{ value: AdminAnalyticsRange; days: number }> = [
  { value: '7d', days: 7 },
  { value: '30d', days: 30 },
  { value: '90d', days: 90 },
]

const EVENT_EXPLANATIONS: Record<AnalyticsEventName, string> = {
  [ANALYTICS_EVENTS.bookingStarted]: 'Counts each tracked service selection, Find Your Look booking selection and Naturtox link.',
  [ANALYTICS_EVENTS.bookingCompleted]: 'Counts each request or confirmation reported by the embedded Vagaro form.',
  [ANALYTICS_EVENTS.quizStarted]: 'Counts each opening of Find Your Look from the lash service prompt.',
  [ANALYTICS_EVENTS.quizCompleted]: 'Counts each result shown in Find Your Look.',
  [ANALYTICS_EVENTS.workWithUsSubmitted]: 'Counts each Work With Us application saved in Inbox.',
  [ANALYTICS_EVENTS.newsletterSignupCompleted]: 'Counts each new or reactivated newsletter subscription saved in Inbox.',
}

export function AnalyticsBoard() {
  const [range, setRange] = useState<AdminAnalyticsRange>('30d')
  const [view, setView] = useState<BoardView>('overview')
  const [retryKey, setRetryKey] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    setLoadState({ status: 'loading' })

    void fetch(`/api/admin/analytics?range=${range}`, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json() as {
          data?: AdminAnalyticsDto
          error?: { code?: string; message?: string }
        }
        if (!response.ok || !payload.data) {
          throw new AnalyticsLoadError(
            payload.error?.message || 'Website analytics could not be loaded.',
            payload.error?.code
          )
        }
        return payload.data
      })
      .then((data) => setLoadState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof AnalyticsLoadError) {
          setLoadState({ status: 'error', message: error.message, code: error.code })
          return
        }
        setLoadState({ status: 'error', message: 'Website analytics could not be loaded.' })
      })

    return () => controller.abort()
  }, [range, retryKey])

  return (
    <section aria-label="Website analytics" className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 border-y border-black/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-lg sm:border sm:p-4">
        <div className="grid grid-cols-3 gap-px bg-sage/20 p-px sm:rounded-md" role="group" aria-label="Reporting period">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              aria-pressed={range === option.value}
              className={`min-h-11 rounded-none px-3 text-xs font-semibold transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta sm:rounded-sm ${
                range === option.value
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-black/50 hover:text-charcoal'
              }`}
            >
              {option.days} days
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-1 text-xs text-black/45">
          <CalendarDays className="size-4 text-rust" aria-hidden="true" />
          <span>Changes compare with the previous {RANGE_OPTIONS.find((option) => option.value === range)?.days} days</span>
        </div>
      </div>

      <div className="border-y border-black/10 bg-white p-1 sm:rounded-lg sm:border" role="tablist" aria-label="Analytics sections">
        <div className="grid grid-cols-2 gap-1 sm:flex">
          {VIEWS.map((item) => {
            const Icon = item.icon
            const active = view === item.value
            return (
              <button
                key={item.value}
                id={`analytics-tab-${item.value}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`analytics-panel-${item.value}`}
                onClick={() => setView(item.value)}
                className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta sm:w-auto sm:px-4 ${
                  active ? 'bg-charcoal text-white' : 'text-black/50 hover:bg-cream/40 hover:text-charcoal'
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      {loadState.status === 'loading' ? <AnalyticsLoading /> : null}
      {loadState.status === 'error' ? (
        <AnalyticsError
          message={loadState.message}
          code={loadState.code}
          onRetry={() => setRetryKey((key) => key + 1)}
        />
      ) : null}
      {loadState.status === 'ready' ? (
        <AnalyticsReady data={loadState.data} view={view} />
      ) : null}
    </section>
  )
}

function AnalyticsReady({ data, view }: { data: AdminAnalyticsDto; view: BoardView }) {
  const empty = data.overview.pageviews.current === 0
    && data.conversion.events.every((event) => event.current === 0)

  if (empty) return <AnalyticsEmpty data={data} />

  return (
    <div
      id={`analytics-panel-${view}`}
      role="tabpanel"
      aria-labelledby={`analytics-tab-${view}`}
      className="space-y-6"
    >
      <StatusLine data={data} />
      {view === 'overview' ? <OverviewView data={data} /> : null}
      {view === 'acquisition' ? <AcquisitionView data={data} /> : null}
      {view === 'conversion' ? <ConversionView data={data} /> : null}
      {view === 'content' ? <ContentView data={data} /> : null}
    </div>
  )
}

function StatusLine({ data }: { data: AdminAnalyticsDto }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-black/45">
      <span className="inline-flex items-center gap-2">
        <span className="size-2 rounded-full bg-terracotta" aria-hidden="true" />
        {data.source === 'fixture' ? 'Test data' : 'Live website data'}
      </span>
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>Reporting period: {formatRangeDate(data.range.current.since)} to {formatRangeDate(data.range.current.until)}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={data.generatedAt}>Checked {formatTimestamp(data.generatedAt)}</time>
      </span>
    </div>
  )
}

function OverviewView({ data }: { data: AdminAnalyticsDto }) {
  const topSource = data.acquisition.sources[0]
  const topPage = data.content.pages[0]

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-px border-y border-black/10 bg-black/10 sm:gap-3 sm:border-0 sm:bg-transparent xl:grid-cols-4" aria-label="Analytics summary">
        <MetricCard label="Visitors" metric={data.overview.visitors} explanation="Counts each anonymous visitor once per reporting day. Each day has its own visitor count." icon={Users} />
        <MetricCard label="Page views" metric={data.overview.pageviews} explanation="Counts every view of an approved public page, including repeat views." icon={FileText} />
        <MetricCard label="Tracked booking starts" metric={data.overview.bookingStarts} explanation="Counts tracked service selections, Find Your Look booking selections and Naturtox links." icon={MousePointerClick} />
        <MetricCard label="Vagaro booking submissions" metric={data.overview.bookingCompletions} explanation="Counts requests and confirmations reported by embedded Vagaro. Open Vagaro to see each status." icon={CheckCircle2} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">Website traffic</p>
              <h2 className="mt-1 font-serif text-2xl text-charcoal">Visitors and page views by day</h2>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-black/45">
              <LegendSwatch className="bg-terracotta" label="Page views" />
              <LegendSwatch className="bg-dune" label="Visitors" />
            </div>
          </div>
          <TrafficChart rows={data.dailyTraffic} />
        </div>

        <aside className="rounded-2xl border border-black/10 bg-charcoal p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cream/65">Summary</p>
          <h2 className="mt-2 font-serif text-2xl">This period at a glance</h2>
          <div className="mt-6 space-y-5">
            <OperatorNote label="Source with most visitors" value={topSource?.source || 'No source data'} detail={topSource ? `${formatNumber(topSource.visitors)} visitors` : 'No source data for the selected period.'} />
            <OperatorNote label="Page with most views" value={topPage ? publicPageLabel(topPage.path) : 'No page-view data'} detail={topPage ? `${formatNumber(topPage.pageviews)} page views` : 'No page-view data for the selected period.'} />
            <OperatorNote
              label="Vagaro submissions per 100 tracked starts"
              value={formatRatioValue(data.conversion.bookingCompletionRate, 'Available after the first tracked start')}
              detail="Calculated as Vagaro submissions divided by tracked booking starts for this period, multiplied by 100. Open Vagaro to see each submission’s status."
            />
          </div>
        </aside>
      </section>

      <PrivacyNote />
    </div>
  )
}

function AcquisitionView({ data }: { data: AdminAnalyticsDto }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <section className="rounded-2xl border border-black/10 bg-white p-4 sm:p-6">
        <SectionHeading eyebrow="Sources" title="Referring websites" detail="Groups visitors by the website address shared by their browser, such as google.com. Percentages show each source’s share of the listed visitors." />
        <RankedBars
          items={data.acquisition.sources.map((item) => ({
            label: item.source,
            value: item.visitors,
            secondary: `${formatNumber(item.pageviews)} page views`,
            share: item.sharePercent,
          }))}
          empty="No source data for the selected period."
        />
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-4 sm:p-6">
        <SectionHeading eyebrow="Devices" title="Visitors by device" detail="Shows the share of visitors using each screen type. Test the most-used screen sizes first." />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {data.acquisition.devices.length === 0 ? (
            <EmptyList copy="No device data for the selected period." />
          ) : data.acquisition.devices.map((item) => {
            const Icon = deviceIcon(item.device)
            return (
              <div key={item.device} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-black/10 bg-ivory/50 p-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white text-rust shadow-sm"><Icon className="size-4" aria-hidden="true" /></span>
                <div><p className="text-sm font-semibold text-charcoal">{item.device}</p><p className="mt-0.5 text-xs text-black/45">{formatNumber(item.visitors)} visitors</p></div>
                <p className="font-serif text-xl text-charcoal">{formatPercent(item.sharePercent)}</p>
              </div>
            )
          })}
        </div>
      </section>

      <div className="xl:col-span-2">
        <InsightNote title="What “Direct or unknown” includes">
          Typed addresses, bookmarks and visits with an unavailable referring website.
        </InsightNote>
      </div>
    </div>
  )
}

function ConversionView({ data }: { data: AdminAnalyticsDto }) {
  const eventByName = new Map(data.conversion.events.map((event) => [event.name, event]))
  const bookingStarted = eventByName.get(ANALYTICS_EVENTS.bookingStarted)
  const bookingCompleted = eventByName.get(ANALYTICS_EVENTS.bookingCompleted)
  const quizStarted = eventByName.get(ANALYTICS_EVENTS.quizStarted)
  const quizCompleted = eventByName.get(ANALYTICS_EVENTS.quizCompleted)

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <SignalPair
          title="Booking starts and submissions"
          startedLabel="Tracked booking starts"
          completedLabel="Vagaro booking submissions"
          started={bookingStarted?.current ?? 0}
          completed={bookingCompleted?.current ?? 0}
          ratio={data.conversion.bookingCompletionRate}
          ratioLabel="Vagaro submissions per 100 tracked starts"
          emptyRatioLabel="Available after the first tracked start"
        />
        <SignalPair
          title="Find Your Look"
          startedLabel="Find Your Look opens"
          completedLabel="Results shown"
          started={quizStarted?.current ?? 0}
          completed={quizCompleted?.current ?? 0}
          ratio={data.conversion.quizCompletionRate}
          ratioLabel="Find Your Look results per 100 opens"
          emptyRatioLabel="Available after the first open"
        />
      </section>

      <section>
        <SectionHeading eyebrow="Recorded actions" title="Actions recorded on the website" detail="Every recorded occurrence adds one to its total, including repeats." />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.conversion.events.map((event) => (
            <article key={event.name} className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-semibold text-charcoal">{event.label}</p><p className="mt-1 text-xs leading-5 text-black/45">{EVENT_EXPLANATIONS[event.name]}</p></div>
                <Sparkles className="size-4 shrink-0 text-rust" aria-hidden="true" />
              </div>
              <div className="mt-6 flex items-end justify-between gap-3">
                <p className="font-serif text-4xl text-charcoal">{formatNumber(event.current)}</p>
                <TrendPill current={event.current} previous={event.previous} changePercent={event.changePercent} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <InsightNote title="How recorded actions add up">
        Every recorded action adds one to its total, including repeats. The booking comparison uses all tracked starts and Vagaro submissions in the selected period. The Find Your Look comparison uses all opens and results. Action reporting began on August 29, 2026. Open Vagaro to see appointment status for submissions.
      </InsightNote>
    </div>
  )
}

function ContentView({ data }: { data: AdminAnalyticsDto }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 sm:p-6">
      <SectionHeading eyebrow="Pages" title="Most-viewed public pages" detail="Shows views for the Homepage, Services, individual service pages, Work with us, Privacy and Terms. Individual service pages are grouped together." />
      {data.content.pages.length === 0 ? (
        <div className="mt-6"><EmptyList copy="No public page views for the selected period." /></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-black/10">
          <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem_5rem] gap-3 border-b border-black/10 bg-cream/35 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40 md:grid">
            <span>Page</span><span className="text-right">Visitors</span><span className="text-right">Page views</span><span className="text-right">Share of page views</span>
          </div>
          <ol className="divide-y divide-black/10">
            {data.content.pages.map((page, index) => (
              <li key={page.path} className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_7rem_7rem_5rem] md:items-center md:gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 shrink-0 font-mono text-xs font-semibold tabular-nums text-rust">{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 truncate text-sm font-semibold text-charcoal" title={publicPageLabel(page.path)}>{publicPageLabel(page.path)}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-right md:contents">
                  <SmallStat label="Visitors" value={formatNumber(page.visitors)} />
                  <SmallStat label="Page views" value={formatNumber(page.pageviews)} />
                  <SmallStat label="Share of page views" value={formatPercent(page.sharePercent)} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function MetricCard({ label, metric, explanation, icon: Icon }: { label: string; metric: AdminAnalyticsMetric; explanation: string; icon: typeof Users }) {
  return (
    <article className="bg-white p-4 sm:rounded-lg sm:border sm:border-black/10 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-8 items-center justify-center rounded-md bg-cream/55 text-rust sm:size-10"><Icon className="size-4" aria-hidden="true" /></span>
        <TrendPill current={metric.current} previous={metric.previous} changePercent={metric.changePercent} />
      </div>
      <p className="mt-3 font-serif text-3xl tabular-nums text-charcoal sm:mt-5 sm:text-4xl">{formatNumber(metric.current)}</p>
      <p className="mt-1 text-sm font-semibold text-charcoal">{label}</p>
      <p className="mt-1.5 text-[11px] leading-4 text-black/50 sm:mt-2 sm:text-xs sm:leading-5">{explanation}</p>
    </article>
  )
}

function TrendPill({ current, previous, changePercent }: { current: number; previous: number; changePercent: number | null }) {
  const details = trendDetails(current, previous, changePercent)
  const Icon = details.direction === 'up' ? ArrowUpRight : details.direction === 'down' ? ArrowDownRight : Minus
  return (
    <span className="inline-flex min-h-7 items-center gap-1 rounded-full border border-black/10 bg-ivory px-2.5 text-[10px] font-semibold text-black/55" title="Compared with the previous period">
      <Icon className="size-3" aria-hidden="true" /> {details.label}
    </span>
  )
}

function TrafficChart({ rows }: { rows: AdminAnalyticsDto['dailyTraffic'] }) {
  const chart = useMemo(() => buildChart(rows), [rows])
  if (!rows.length) return <div className="mt-8"><EmptyList copy="No visitor or page-view data for the selected period." /></div>

  return (
    <div className="mt-6">
      <svg viewBox="0 0 720 230" className="h-auto w-full" role="img" aria-labelledby="traffic-chart-title traffic-chart-description">
        <title id="traffic-chart-title">Visitors and page views by day</title>
        <desc id="traffic-chart-description">Daily visitor and page-view totals for the selected period.</desc>
        {[35, 85, 135, 185].map((y) => <line key={y} x1="20" x2="700" y1={y} y2={y} className="stroke-black/10" strokeDasharray="3 6" />)}
        <path d={chart.areaPath} fill="rgb(var(--cream))" opacity="0.7" />
        <path d={chart.pageviewsPath} fill="none" stroke="rgb(var(--terracotta))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={chart.visitorsPath} fill="none" stroke="rgb(var(--dune))" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {chart.labels.map((label) => <text key={label.x} x={label.x} y="220" textAnchor={label.anchor} className="fill-black/40 text-[10px]">{label.value}</text>)}
      </svg>
      <table className="sr-only">
        <caption>Daily traffic values</caption>
        <thead><tr><th>Date</th><th>Visitors</th><th>Page views</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.date}><th>{row.date}</th><td>{row.visitors}</td><td>{row.pageviews}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

function SignalPair({
  title,
  startedLabel,
  completedLabel,
  started,
  completed,
  ratio,
  ratioLabel,
  emptyRatioLabel,
}: {
  title: string
  startedLabel: string
  completedLabel: string
  started: number
  completed: number
  ratio: AdminAnalyticsRatio
  ratioLabel: string
  emptyRatioLabel: string
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-black/10 bg-white">
      <div className="border-b border-black/10 bg-cream/35 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-rust">{title}</p></div>
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <SignalValue label={startedLabel} value={started} />
        <ArrowRight className="hidden size-5 text-dune/60 sm:block" aria-hidden="true" />
        <SignalValue label={completedLabel} value={completed} />
      </div>
      <div className="flex flex-col items-start gap-1 border-t border-black/10 px-5 py-3 text-xs text-black/45 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span>{ratioLabel}</span>
        <span className="font-semibold text-charcoal">{formatRatioValue(ratio, emptyRatioLabel)}</span>
      </div>
    </article>
  )
}

function SignalValue({ label, value }: { label: string; value: number }) {
  return <div><p className="font-serif text-4xl text-charcoal">{formatNumber(value)}</p><p className="mt-1 text-xs leading-5 text-black/45">{label}</p></div>
}

function RankedBars({ items, empty }: { items: Array<{ label: string; value: number; secondary: string; share: number }>; empty: string }) {
  if (!items.length) return <div className="mt-6"><EmptyList copy={empty} /></div>
  return (
    <ol className="mt-6 space-y-5">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <div className="flex items-end justify-between gap-3 text-xs">
            <div className="min-w-0"><p className="truncate font-semibold text-charcoal" title={item.label}>{item.label}</p><p className="mt-0.5 text-black/40">{item.secondary}</p></div>
            <p className="shrink-0 font-semibold text-charcoal">{formatNumber(item.value)} <span className="font-normal text-black/40">· {formatPercent(item.share)}</span></p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream/55"><div className="h-full rounded-full bg-terracotta" style={{ width: `${Math.max(2, Math.min(100, item.share))}%` }} /></div>
        </li>
      ))}
    </ol>
  )
}

function AnalyticsLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading website analytics</span>
      <div className="grid grid-cols-2 gap-px border-y border-black/10 bg-black/10 sm:gap-3 sm:border-0 sm:bg-transparent xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse bg-white p-4 motion-reduce:animate-none sm:h-48 sm:rounded-lg sm:border sm:border-black/10 sm:p-5"><div className="size-9 rounded-md bg-cream/65 sm:size-10" /><div className="mt-6 h-9 w-20 rounded bg-cream/65 sm:mt-8" /><div className="mt-3 h-3 w-24 rounded bg-cream/65" /></div>)}
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-black/10 bg-white p-6 motion-reduce:animate-none"><div className="h-4 w-32 rounded bg-cream/65" /><div className="mt-6 h-56 rounded-xl bg-ivory" /></div>
    </div>
  )
}

function AnalyticsError({ message, code, onRetry }: { message: string; code?: string; onRetry: () => void }) {
  const configuration = code === 'configuration_required'
  return (
    <div className="rounded-lg border border-rust/25 bg-white p-6 sm:p-8" role="alert">
      <div className="flex size-11 items-center justify-center rounded-xl bg-cream text-rust"><CircleAlert className="size-5" aria-hidden="true" /></div>
      <h2 className="mt-5 font-serif text-2xl text-charcoal">{configuration ? 'Connect website analytics' : 'Website analytics is unavailable'}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-black/55">{message}</p>
      <p className="mt-2 max-w-xl text-xs leading-5 text-black/40">This report displays website analytics totals.</p>
      <button type="button" onClick={onRetry} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-charcoal px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2">
        <RefreshCw className="size-4" aria-hidden="true" /> Try again
      </button>
    </div>
  )
}

function AnalyticsEmpty({ data }: { data: AdminAnalyticsDto }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-7 text-center sm:p-10" role="status">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-cream text-rust"><Gauge className="size-5" aria-hidden="true" /></span>
      <h2 className="mt-5 font-serif text-2xl text-charcoal">0 page views and 0 recorded actions in this period</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-black/50">Choose a longer period to view activity recorded before these {data.range.days} days.</p>
    </div>
  )
}

function PrivacyNote() {
  return (
    <InsightNote title="Where customer records live" icon={ShieldCheck}>
      This report shows anonymous totals for public website activity. Booking records stay in Vagaro. Applications and newsletter subscriptions stay in Inbox.
    </InsightNote>
  )
}

function InsightNote({ title, children, icon: Icon = CircleAlert }: { title: string; children: React.ReactNode; icon?: typeof CircleAlert }) {
  return (
    <aside className="flex gap-3 rounded-2xl border border-sage/25 bg-cream/30 p-4 sm:p-5">
      <Icon className="mt-0.5 size-4 shrink-0 text-rust" aria-hidden="true" />
      <div><p className="text-sm font-semibold text-charcoal">{title}</p><p className="mt-1 text-xs leading-5 text-black/50">{children}</p></div>
    </aside>
  )
}

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">{eyebrow}</p><h2 className="mt-1 font-serif text-2xl text-charcoal">{title}</h2><p className="mt-2 text-xs leading-5 text-black/45">{detail}</p></div>
}

function OperatorNote({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="border-b border-white/10 pb-5 last:border-0 last:pb-0"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-cream/55">{label}</p><p className="mt-1 break-words font-serif text-lg">{value}</p><p className="mt-1 text-xs leading-5 text-white/45">{detail}</p></div>
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`size-2 rounded-full ${className}`} aria-hidden="true" />{label}</span>
}

function EmptyList({ copy }: { copy: string }) {
  return <div className="rounded-xl border border-dashed border-sage/35 bg-ivory/50 p-6 text-center text-xs leading-5 text-black/45">{copy}</div>
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[9px] font-semibold uppercase tracking-wide text-black/35 md:sr-only">{label}</p><p className="mt-0.5 text-xs font-semibold text-charcoal md:mt-0">{value}</p></div>
}

function deviceIcon(device: string) {
  if (device === 'Mobile') return Smartphone
  if (device === 'Tablet') return Tablet
  return Laptop
}

function trendDetails(current: number, previous: number, changePercent: number | null) {
  if (previous === 0 && current > 0) return { direction: 'up' as const, label: 'Up from 0' }
  if (changePercent === null || changePercent === 0) return { direction: 'flat' as const, label: 'Same as previous period' }
  return {
    direction: changePercent > 0 ? 'up' as const : 'down' as const,
    label: `${changePercent > 0 ? 'Up' : 'Down'} ${Math.abs(changePercent).toFixed(0)}%`,
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`
}

function formatRatioValue(ratio: AdminAnalyticsRatio, emptyLabel: string) {
  if (ratio.currentPercent === null) return emptyLabel
  return ratio.currentPercent.toFixed(ratio.currentPercent >= 10 ? 0 : 1)
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function formatRangeDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00.000Z`))
}

function publicPageLabel(path: string) {
  const labels: Record<string, string> = {
    '/': 'Homepage',
    '/services': 'Services',
    '/services/[slug]': 'Individual service pages',
    '/work-with-us': 'Work with us',
    '/privacy': 'Privacy',
    '/terms': 'Terms',
  }
  return labels[path] ?? path
}

function buildChart(rows: AdminAnalyticsDto['dailyTraffic']) {
  const width = 680
  const top = 20
  const bottom = 190
  const max = Math.max(1, ...rows.flatMap((row) => [row.pageviews, row.visitors]))
  const x = (index: number) => 20 + (rows.length <= 1 ? width / 2 : (index / (rows.length - 1)) * width)
  const y = (value: number) => bottom - (value / max) * (bottom - top)
  const pathFor = (key: 'pageviews' | 'visitors') => rows.map((row, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(row[key]).toFixed(2)}`).join(' ')
  const pageviewsPath = pathFor('pageviews')
  const areaPath = rows.length ? `${pageviewsPath} L ${x(rows.length - 1).toFixed(2)} ${bottom} L ${x(0).toFixed(2)} ${bottom} Z` : ''
  const labelIndexes = Array.from(new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1])).filter((index) => index >= 0)
  return {
    pageviewsPath,
    visitorsPath: pathFor('visitors'),
    areaPath,
    labels: labelIndexes.map((index, labelIndex) => {
      const anchor: 'start' | 'end' | 'middle' = labelIndex === 0
        ? 'start'
        : labelIndex === labelIndexes.length - 1
          ? 'end'
          : 'middle'
      return {
        x: x(index),
        value: formatChartDate(rows[index]?.date),
        anchor,
      }
    }),
  }
}

function formatChartDate(value: string | undefined) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00.000Z`))
}

class AnalyticsLoadError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message)
    this.name = 'AnalyticsLoadError'
  }
}
