# Automated Review Syncing

LashPop's review sync lives in a **Cloudflare Worker** at `workers/reviews/`,
not in the Next.js app. It runs daily, fetches reviews from Vagaro,
Google, and Yelp, deduplicates them, runs post-sync filters, and rotates the
homepage selection.

## Source-by-source

| Source | Path | Cloak Mesh? | Cost | Status |
|---|---|---|---|---|
| Vagaro | OAuth Merchant API (`/api/v2/merchants/{businessId}/reviews`) | No | metered; max 25 calls/run | live |
| Google | `/maps/preview/place` web RPC | No | $0 | live (cookies refreshed via local script) |
| Yelp | `/gql/batch` persisted queries via Cloak Mesh | Yes | $0 | needs CLOAK_TOKEN |

## Worker schedule

Configured via `workers/reviews/wrangler.jsonc`:

```jsonc
"triggers": { "crons": ["15 12 * * *"] }
```

Daily at 12:15 UTC, the Worker runs `scheduled()` which:
1. Fans out to all three fetchers in parallel
2. Looks up team_member_id for each review (matching subject ↔ team_members.name)
3. Upserts new reviews + testimonials, deduping on `(source, lower(reviewer_name), lower(review_text))`
4. Runs `applyStaleTeamMemberFilter` — hides reviews about ex-staff using the FK
5. Runs `autoPromoteToHomepage` — rebuilds the auto-rotating homepage slots

Manual trigger:
```bash
curl -H "Authorization: Bearer $MANUAL_TRIGGER_SECRET" \
  https://lashpop-reviews.<...>.workers.dev/run
```

## Secrets (managed via `wrangler secret put`)

| Name | Used by | How to refresh |
|---|---|---|
| `VAGARO_CLIENT_ID` / `VAGARO_CLIENT_SECRET` / `VAGARO_BUSINESS_ID` | vagaro | mirrors `.env.local` |
| `GOOGLE_PLACE_FID` | google | LashPop's Maps FID — `0x80dc73710da0172f:0x49e879bec593fc5e` |
| `GOOGLE_PREVIEW_URL` / `GOOGLE_COOKIES` | google | `python3 workers/reviews/scripts/mint-google-session.py` |
| `YELP_BUSINESS_URL` / `CLOAK_TOKEN` | yelp | mint via cloak.experialstudio.com once the daemon is healthy |
| `MANUAL_TRIGGER_SECRET` | manual `/run` | random hex |

## When Google reviews stop flowing

The Worker logs `preview/place stripped to <N>B (expected >=50KB) — cookies
likely expired.` Re-mint:

```bash
cd workers/reviews
python3 scripts/mint-google-session.py
```

That opens Chromium, navigates LashPop's Maps page, captures the rich
`/maps/preview/place` URL + cookies, and uploads them as Worker secrets.

## Homepage promotion

`homepage_reviews` has two row types via `is_pinned`:
- **Pinned** (`is_pinned=true`) — admin curation. Immortal. Managed by `/admin/website/reviews`.
- **Auto** (`is_pinned=false`) — rebuilt every cron run with the newest eligible 5★ reviews up to cap (`DEFAULT_HOMEPAGE_CAP = 9`).

Eligibility for auto-promotion:
- `rating = 5`
- `show_on_website = true`
- `homepage_dismissed = false`
- Not already pinned
- `team_member_id` is null OR not pointing at an inactive staff member

## Migrating away from the old setup

Pre-2026 sync used:
- Vercel cron (`/api/cron/sync-reviews`, `/api/cron/sync-review-stats`) → **deleted**
- BrightData snapshots for Yelp + Google → **deleted**
- Jina.ai for Vagaro → **deleted**
- Various CLI scripts in `scripts/scrape-*.ts` → **deleted**

If you find any lingering references to those, they're dead code.

## Vagaro cost guardrails

- The Worker cron is the only review scheduler. Durable Object alarms are
  disabled and any legacy alarm is drained without fetching.
- Vagaro review runs record `meteredUsage` in the Durable Object's `lastResult`.
- A run stops before attempting more than 25 Vagaro calls. At the current
  review count, a normal run is 9 calls: one authentication plus eight pages.
