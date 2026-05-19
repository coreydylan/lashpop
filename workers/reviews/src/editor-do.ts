/**
 * ReviewEditor Durable Object — single instance per business that owns the
 * whole review pipeline: fetch (every 6h), filter, auto-promote, and the
 * weekly LLM "editor" pass (scoring, ex-staff hide, highlight reels).
 *
 * Why a DO and not just a Worker cron?
 *   - Single instance → guarantees no two cron ticks step on each other while
 *     a long-running mesh-claude call is in flight.
 *   - Persistent storage → tracks lastFetchAt / lastEditorAt so we can run
 *     fetches every 6h but the editor pass only weekly without state in DB.
 *   - Alarms → built-in scheduling, survives Worker restarts, fires even when
 *     no traffic arrives.
 */
import { buildTeamMemberIndex, closeDb, openDb, upsertReviews, type Sql, type UpsertStats } from './db'
import { runEditor, type EditorStats } from './editor'
import { fetchGoogleReviews } from './fetchers/google'
import { fetchVagaroReviews } from './fetchers/vagaro'
import { fetchYelpReviews } from './fetchers/yelp'
import { applyStaleTeamMemberFilter, autoPromoteToHomepage, type AutoPromoteStats, type StaleStats } from './post-sync'
import { loadReviewSettings, DEFAULT_SETTINGS } from './settings'
import type { Env, FetcherResult } from './types'

const FETCH_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6h

interface RunRecord {
  startedAt: string
  finishedAt: string
  sources: Record<string, { fetched: number; totalAvailable?: number; errors: string[]; upsert?: UpsertStats }>
  stale?: StaleStats
  autoPromote?: AutoPromoteStats
  editor?: EditorStats & { ran: boolean; reason: string }
  postSyncErrors?: string[]
}

export class ReviewEditor {
  private state: DurableObjectState
  private env: Env

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)

    if (url.pathname === '/run' || url.pathname === '/alarm') {
      const forceEditor = url.searchParams.get('editor') === '1'
      const result = await this.runCycle({ forceEditor })
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'content-type': 'application/json' },
      })
    }

    if (url.pathname === '/state') {
      const lastFetchAt = await this.state.storage.get<string>('lastFetchAt')
      const lastEditorAt = await this.state.storage.get<string>('lastEditorAt')
      const lastResult = await this.state.storage.get<RunRecord>('lastResult')
      const nextAlarm = await this.state.storage.getAlarm()
      return new Response(
        JSON.stringify(
          {
            lastFetchAt: lastFetchAt ?? null,
            lastEditorAt: lastEditorAt ?? null,
            nextAlarm: nextAlarm ? new Date(nextAlarm).toISOString() : null,
            lastResult: lastResult ?? null,
          },
          null,
          2,
        ),
        { headers: { 'content-type': 'application/json' } },
      )
    }

    if (url.pathname === '/schedule') {
      await this.state.storage.setAlarm(Date.now() + FETCH_INTERVAL_MS)
      return new Response('alarm scheduled', { status: 200 })
    }

    return new Response('lashpop-reviews DO — GET /run | /run?editor=1 | /state | /schedule', {
      headers: { 'content-type': 'text/plain' },
    })
  }

  async alarm(): Promise<void> {
    try {
      await this.runCycle({})
    } catch (err) {
      console.error('[review-editor] alarm cycle threw:', err)
    } finally {
      // Reset the alarm regardless — never want the DO to go silent.
      await this.state.storage.setAlarm(Date.now() + FETCH_INTERVAL_MS)
    }
  }

  /**
   * One pipeline pass:
   *   1. Fan out all fetchers, upsert results.
   *   2. Run stale-team-member filter (FK-based).
   *   3. Run auto-promote (rebuilds homepage non-pinned rows).
   *   4. If 7+ days since last editor run OR forceEditor: run editor pass
   *      (LLM scoring + semantic ex-staff hide + highlight reels).
   */
  private async runCycle(opts: { forceEditor?: boolean }): Promise<RunRecord> {
    const startedAt = new Date().toISOString()
    const sources: RunRecord['sources'] = {}
    const postSyncErrors: string[] = []
    let stale: StaleStats | undefined
    let autoPromote: AutoPromoteStats | undefined
    let editor: RunRecord['editor']

    // 1. Fetchers in parallel
    const fetchers: Array<{ name: 'google' | 'vagaro' | 'yelp'; run: () => Promise<FetcherResult> }> = [
      { name: 'google', run: () => fetchGoogleReviews(this.env) },
      { name: 'vagaro', run: () => fetchVagaroReviews(this.env) },
      { name: 'yelp', run: () => fetchYelpReviews(this.env) },
    ]
    const results = await Promise.all(
      fetchers.map(async ({ name, run }) => {
        try {
          return { name, result: await run() }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error(`[${name}] fetcher threw: ${msg}`)
          return { name, result: { source: name, reviews: [], errors: [msg] } as FetcherResult }
        }
      }),
    )

    const sql = openDb(this.env.DATABASE_URL)
    await sql.unsafe('SET statement_timeout = 0')

    try {
      const teamIndex = await buildTeamMemberIndex(sql)
      const settings = await loadReviewSettings(sql).catch(() => DEFAULT_SETTINGS)

      for (const { name, result } of results) {
        const linked = result.reviews.map(r => ({
          ...r,
          teamMemberId: r.teamMemberId ?? teamIndex.resolve(r.subject),
        }))
        const upsert = await upsertReviews(sql, linked)
        sources[name] = {
          fetched: result.reviews.length,
          totalAvailable: result.totalAvailable,
          errors: result.errors,
          upsert,
        }
        console.log(
          `[${name}] fetched=${result.reviews.length} ` +
            `inserted=${upsert.inserted} errors=${result.errors.length}`,
        )
      }

      // 2. Stale-team-member filter
      try {
        stale = await applyStaleTeamMemberFilter(sql)
      } catch (err) {
        postSyncErrors.push(`stale: ${err instanceof Error ? err.message : String(err)}`)
      }

      // 3. Editor pass — gated by lastEditorAt unless forced, or disabled via settings
      const editorIntervalMs = settings.editor_pass_interval_days * 24 * 60 * 60 * 1000
      const lastEditorAtRaw = await this.state.storage.get<string>('lastEditorAt')
      const lastEditorAt = lastEditorAtRaw ? new Date(lastEditorAtRaw).getTime() : 0
      const dueByTime = Date.now() - lastEditorAt >= editorIntervalMs
      const shouldRunEditor = settings.editor_pass_enabled && (opts.forceEditor || dueByTime)
      if (shouldRunEditor) {
        try {
          const e = await runEditor(sql, this.env, {
            highlightsPerMember: settings.highlights_per_stylist,
          })
          editor = {
            ...e,
            ran: true,
            reason: opts.forceEditor ? 'forced' : `${Math.round((Date.now() - lastEditorAt) / 86_400_000)}d since last`,
          }
          await this.state.storage.put('lastEditorAt', new Date().toISOString())
          console.log(
            `[editor] scored=${e.scored} hiddenByLLM=${e.hiddenByLLM} ` +
              `highlights=${e.highlightsBuilt} errors=${e.errors.length}`,
          )
        } catch (err) {
          postSyncErrors.push(`editor: ${err instanceof Error ? err.message : String(err)}`)
        }
      } else {
        const reason = !settings.editor_pass_enabled
          ? 'disabled via settings.editor_pass_enabled'
          : `last run ${Math.round((Date.now() - lastEditorAt) / 86_400_000)}d ago (need ≥${settings.editor_pass_interval_days})`
        editor = {
          scored: 0,
          hiddenByLLM: 0,
          highlightsBuilt: 0,
          errors: [],
          ran: false,
          reason,
        }
      }

      // 4. Auto-promote — settings drive capacity, diversity caps, recency window
      try {
        autoPromote = await autoPromoteToHomepage(sql, settings)
      } catch (err) {
        postSyncErrors.push(`autoPromote: ${err instanceof Error ? err.message : String(err)}`)
      }
    } finally {
      await closeDb(sql)
    }

    await this.state.storage.put('lastFetchAt', new Date().toISOString())

    const record: RunRecord = {
      startedAt,
      finishedAt: new Date().toISOString(),
      sources,
      stale,
      autoPromote,
      editor,
      postSyncErrors: postSyncErrors.length ? postSyncErrors : undefined,
    }
    await this.state.storage.put('lastResult', record)
    return record
  }
}
