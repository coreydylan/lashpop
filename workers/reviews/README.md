# lashpop-reviews Worker

Replaces the Vercel-cron + BrightData review sync. One Cloudflare cron runs
daily at 12:15 UTC, fans out to three sources, and writes directly to D1.

| Source | Path | Cloak Mesh? | Cost | Status |
|---|---|---|---|---|
| Vagaro | OAuth Merchant API | No | metered; max 25 calls/run | **live** |
| Google | Places API (Place Details) | No | needs billing-enabled GCP project | not wired |
| Yelp | GQL persisted queries via Cloak Mesh | Yes | $0 | not wired |

## Why this exists

The previous setup used BrightData snapshots for Yelp + Google and Jina.ai for
Vagaro. BrightData's API token rotated and was never re-added to Vercel, so
Google + Yelp had been silently failing since 2025-11-14 / 2026-02-01. The
Vagaro Jina scraper kept running but was parsing UI text ("Cancel Ok") as
reviewer names. Vagaro turned out to have a real OAuth review endpoint that
returns clean structured data — see `src/fetchers/vagaro.ts`.

## Layout

```
src/
├── index.ts        scheduled() + fetch() handlers, manual /run endpoint
├── types.ts        NormalizedReview, FetcherResult, Env
├── db.ts           D1 adapter + upsert
└── fetchers/
    ├── google.ts   Place Details, newest 5
    ├── vagaro.ts   /api/v2/merchants/{businessId}/reviews — 50/page, ~400/run
    └── yelp.ts     /gql/batch via cloak.experialstudio.com — paginated
```

## Deploy

```bash
cd workers/reviews
npm install
npx wrangler deploy
```

Secrets (set via `wrangler secret put <NAME>`):

| Name | Required for | Source |
|---|---|---|
| `VAGARO_CLIENT_ID` | vagaro | lashpop `.env.local` |
| `VAGARO_CLIENT_SECRET` | vagaro | lashpop `.env.local` |
| `VAGARO_BUSINESS_ID` | vagaro | lashpop `.env.local` |
| `GOOGLE_PLACES_KEY` | google | GCP project with Places API + billing enabled |
| `GOOGLE_PLACE_ID` | google (optional) | pin once resolved to skip text search |
| `GOOGLE_PLACE_QUERY` | google (fallback) | defaults to `"LashPop Studios Oceanside"` |
| `YELP_BUSINESS_URL` | yelp | defaults to `https://www.yelp.com/biz/lashpop-studios-oceanside` |
| `CLOAK_TOKEN` | yelp | mint via `POST cloak.experialstudio.com/admin/tokens {service:"yelp", name:"lashpop-reviews"}` |
| `CLOAK_BASE` | yelp (optional) | defaults to `https://cloak.experialstudio.com` |
| `MANUAL_TRIGGER_SECRET` | manual `/run` | random hex, optional |

## Manual trigger

```bash
curl -H "Authorization: Bearer $MANUAL_TRIGGER_SECRET" \
  https://lashpop-reviews.<...>.workers.dev/run
```

Returns a JSON summary: per-source
`{fetched, totalAvailable, meteredUsage, errors, upsert}`. Vagaro usage includes
auth calls, API calls, endpoint counts, and the 25-call cycle ceiling.

## Yelp service (Cloak Mesh)

The Yelp fetcher routes through Cloak Mesh so Yelp sees a real Chrome on
residential IP with DataDome cookies. To enable:

1. Copy `~/Developer/cloak-mesh/daemon/services/yelp.py` to officemac if not
   already synced.
2. Restart the daemon (`launchctl kickstart -k gui/$(id -u)/com.coreydylan.cloak-mesh-daemon`)
   so it discovers the new service module.
3. Wait ~30s for CloakBrowser to solve DataDome and stabilize.
4. Verify: `curl https://cloak.experialstudio.com/_health` should show
   `daemon.services.yelp: true`.
5. Mint a token:
   ```bash
   curl -X POST https://cloak.experialstudio.com/admin/tokens \
     -H "Authorization: Bearer $CLOAK_ADMIN_TOKEN" \
     -d '{"service":"yelp","name":"lashpop-reviews"}'
   ```
6. Set `CLOAK_TOKEN` secret on the Worker.

## Dedup behavior

`upsertReviews()` in `db.ts` dedupes by `(source, lower(reviewer_name), lower(review_text))`
to match the legacy dedup logic in `src/lib/reviews-sync.ts`. Each new review
also gets a matching `testimonials` row (auto-approved) deduped by
`(lower(client_name), lower(review_text))`.

When the Vagaro API returns a stable `reviewIds` we currently ignore it — the
reviews table has no `external_id` column. If we ever add one, switch to that
for cheaper dedup.

## Migration / cleanup notes

After the first run on 2026-05-18:
- Imported 174 clean Vagaro reviews previously missed by the Jina scraper.
- Deleted 81 "Cancel Ok" junk review rows + 82 matching testimonials.
- Latest Vagaro review date moved from stale 2026-02-16 to fresh 2026-03-31.

**Still to clean up** (separate one-time pass): 60+ reviews with names like
"Verified", "Beauty", "Fitness", "Wellness", "Venue" — all Vagaro UI labels
the old Jina scraper mistook for reviewer names. None on the homepage.

The old Vercel review crons and routes have been removed. The Worker cron is the
only scheduler; legacy Durable Object alarms are cleared without fetching.
