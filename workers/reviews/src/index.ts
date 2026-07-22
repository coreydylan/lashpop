import type { Env } from './types'

export { ReviewEditor } from './editor-do'

/**
 * Thin Worker entry — routes to the ReviewEditor Durable Object. The DO owns
 * all state (last-fetch timestamps, last-editor timestamps) so this
 * Worker is essentially a router.
 *
 * Routes:
 *   GET /run               → trigger one cycle (fetch + filter + promote;
 *                            editor pass runs iff ≥7d since last run)
 *   GET /run?editor=1      → trigger one cycle and force the editor pass
 *   GET /state             → introspection (last run, next alarm, last result)
 *   GET /schedule          → clears legacy alarms (410; cron owns scheduling)
 *
 * All routes auth'd via MANUAL_TRIGGER_SECRET when set.
 */

function getStub(env: Env): DurableObjectStub {
  const id = env.REVIEW_EDITOR.idFromName('lashpop')
  return env.REVIEW_EDITOR.get(id)
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    // Cron is the single scheduler. The DO clears any legacy alarm on /run.
    ctx.waitUntil(
      (async () => {
        try {
          const stub = getStub(env)
          const res = await stub.fetch('https://do/run')
          console.log('cron tick result:', (await res.text()).slice(0, 500))
        } catch (err) {
          console.error('cron tick failed:', err)
        }
      })(),
    )
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)

    if (url.pathname === '/' || url.pathname === '') {
      return new Response('lashpop-reviews — GET /run | /run?editor=1 | /state | /schedule | /yelp-confidence-test', {
        headers: { 'content-type': 'text/plain' },
      })
    }

    // Bearer auth on every triggering endpoint
    if (env.MANUAL_TRIGGER_SECRET) {
      const auth = req.headers.get('authorization') ?? ''
      if (auth !== `Bearer ${env.MANUAL_TRIGGER_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    // One-shot diagnostic: call Yelp's GraphQL with each confidence level so we
    // can identify which value returns the totalCount that matches Yelp's public
    // page. Used to be hardcoded to HIGH_CONFIDENCE, which appears to under-
    // report compared to "recommended reviews" shown on the business page.
    if (url.pathname === '/yelp-confidence-test') {
      const { runYelpConfidenceTest } = await import('./fetchers/yelp')
      const result = await runYelpConfidenceTest(env)
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'content-type': 'application/json' },
      })
    }

    const stub = getStub(env)
    return stub.fetch(`https://do${url.pathname}${url.search}`, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    })
  },
} satisfies ExportedHandler<Env>
