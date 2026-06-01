# Lashpop → Pure Cloudflare: Refactor Scope (v2)

Synthesizes `tmp/migration-audit.md` and `tmp/cloudflare-2026-research.md`, revised against
the user-confirmed scope:

- **Public surface to recreate exactly:** `/`, `/work-with-us`, `/services/[slug]`,
  `/privacy`, `/terms`. Nothing else is audience-facing.
- **Admin surface to port and improve:** `/admin/website/*`, `/admin/dam-users`,
  `/dam`, `/dam/team`. Audit every admin field against actual frontend usage; cut dead
  fields, scope improvements.
- **Vagaro must be byte-perfect.** Detailed Playwright E2E parity tests on desktop **and**
  mobile.
- **Reviews + Instagram** keep refreshing daily via CF Worker cron.
- **Friend-booking is already gone from prod** — drop from repo (`/login`, `/confirm/[token]`,
  `friend_booking_requests`, BetterAuth catch-all, `profiles`, `vagaro_sync_mappings`,
  `auth_user`/`auth_session`/`auth_verification`, `lib/auth.ts`, `lib/auth-client.ts`).

---

## TL;DR

**Recommendation:** Astro 6 on Workers Static Assets + D1 + R2 + a single hand-rolled
phone-OTP auth path (Twilio Verify + signed cookie) that gates both `/admin/*` and `/dam/*`.
Drop Supabase, Vercel, Next.js, BetterAuth, Clerk, Stripe, the scrollytelling CMS, the
newsletter form, and the duplicate Instagram sync.

This works because:
1. **Cloudflare bought Astro on Jan 16, 2026.** Astro 6's dev server runs on `workerd` —
   D1/KV/R2 bindings work locally. First-party CF.
2. **Your production surface is small.** Once dead code is cut, you're porting ~5 public
   pages + ~10 admin pages + ~22 schemas + 3 CF workers. Not 50 API routes and 37 schemas.
3. **D1 fits comfortably.** The 14-table scrollytelling CMS (most of the Postgres-specific
   surface) is dead. Remaining schema is 11 enums + 11 jsonb cols — all port cleanly to
   `text + CHECK` and `text(mode: 'json')`.
4. **The admin can be improved during the port**, not after. Every admin form has to be
   reconciled with what the frontend actually reads; this is the natural moment to fix
   drift.

**Reversibility:** Phases 0–4 are reversible (Supabase + Vercel keep running). Phase 5
(cutover) is the only one-way door.

---

## Scope at a glance

### Public pages (recreate exactly — Playwright parity-tested)

| Route | Source today | Frontend contract to preserve |
|---|---|---|
| `/` | force-dynamic; DB-driven hero/team/services/reviews/IG/FAQ/founder-letter/quiz | Pixel + interaction parity desktop + mobile, including Vagaro widget + GSAP/Mapbox/quiz |
| `/work-with-us` | DB-driven carousel + MOX form submit | Form submission to `mox-api.experialstudio.com`; carousel |
| `/services/[slug]` | DB-read service + assets | Service detail + hero image + Vagaro booking CTA |
| `/privacy` | static | static |
| `/terms` | static | static |

### Admin (port + audit + improve)

`/admin/website/{hero, team, services, faq, reviews, seo, instagram, quiz, founder-letter, work-with-us}`
+ `/admin/dam-users` + `/dam` + `/dam/team`. Auth: phone-OTP allowlist (`auth_user` allowlist
via `admin/dam-users`).

### Background

- `lashpop-vagaro-sync` (cron 3×/day)
- `lashpop-instagram-sync` (cron 1×/day)
- `lashpop-staffphoto-optimize` (request-driven, used by `/staffphoto` internal tool)
- Review crons (BrightData, 2×/day) — port from Vercel cron to CF Worker cron
- `POST /webhooks/vagaro` — webhook endpoint, written-to from Vagaro

### Dropped entirely

Friend-booking, BetterAuth, Clerk, Stripe, scrollytelling CMS, Theatre.js, `/seoguide`,
`/punchlist` (unless explicitly kept — see Open Question), supabase-js newsletter,
the 11 zero-caller API routes, `/login`, `/confirm/[token]`.

---

## Target Architecture

```
                       ┌─────────────────────────────┐
                       │   lashpop.com               │
                       │   Workers Static Assets     │
                       │   Astro 6 (workerd dev)     │
                       │                             │
                       │   Public pages (SSR + ISR)  │
                       │   /admin/* (OTP gated)      │
                       │   /dam/*   (OTP gated)      │
                       │   /api/*   server endpoints │
                       └──┬───┬───┬───┬───┬──────────┘
                          │   │   │   │   │
              ┌───────────┘   │   │   │   └────────────┐
              v               v   v   v                v
           ┌─────┐       ┌─────┐ │ ┌─────┐         ┌─────┐
           │ D1  │       │ KV  │ │ │ R2  │         │ DO  │ (optional)
           └─────┘       └─────┘ │ └─────┘         └─────┘
        structured       site    │  DAM blobs       rate-limit
        content          config  │  (unchanged)     (optional)
        sessions         flags   │
        DAM metadata             │
                                 │
                          ┌──────┴────────┐
                          │ Existing CF   │
                          │ Workers       │  (instagram-sync,
                          │  + cron       │   vagaro-sync,
                          └──┬────────────┘   staffphoto-optimize)
                             │
                  External:  ├── Twilio Verify (phone OTP for admin/DAM)
                             ├── Vagaro (booking widget + public APIs + webhook in)
                             ├── BrightData (review scraping)
                             ├── MOX (email gateway, ours)
                             └── Resend (transactional email, if needed)

  CI:  Workers Builds (git push → preview/prod)
  Tests: Playwright (E2E parity, desktop + mobile, GitHub Actions)
```

### Choices

| Layer | Choice | Why |
|---|---|---|
| Hosting | **Workers Static Assets** | Free unlimited static assets; Pages is in maintenance mode. |
| Framework | **Astro 6** | First-party CF since Jan 2026. `workerd` dev = prod parity. Per-component hydration fits a marketing site. No 10 MiB OpenNext bundle ceiling. |
| DB | **D1** | 10 GB cap; your data is <1 GB. Drizzle has first-class D1 driver. Fresh `0000_init.sql` from current schema (don't carry 30 PG migrations). |
| Blobs | **R2** | Already there. Keep bucket `lashpop-dam`, custom hostname `dam.lashpopstudios.com`. |
| Image pipeline | **`/cdn-cgi/image/...` URL transforms** + Workers Images binding only in admin upload re-encode | URL transforms dedupe. Binding bills per call. |
| Auth (admin + DAM) | **Hand-rolled** Twilio Verify + signed cookie (`@oslojs/crypto`) + sessions in D1, allowlist in `auth_user` | ~150 LoC. BetterAuth is overkill and has live bugs (#4203, KV TTL clash). DAM already hand-rolls a version of this; unify it. |
| Sessions | D1 `sessions` table; signed cookie HMAC | Read-on-every-admin-request; D1 single-leader is fine at admin-only scale. |
| Cron / background | Existing 3 CF workers + the 2 review crons ported into a new `reviews-sync` worker | All on CF cron triggers; no Vercel crons survive. |
| Email | **Resend** (transactional) + **MOX** (work-with-us form, kept) | MailChannels free tier ended; Resend has Workers SDK and 3K/mo free. |
| Payments | n/a (Stripe dropped) | Re-add later if needed; webhook on a Worker. |
| Analytics | **Cloudflare Web Analytics** | Free, privacy-respecting, zero JS overhead. Replaces Vercel Analytics/Speed Insights. |
| CI/CD | **Workers Builds** (git push → preview/prod) + Playwright on GitHub Actions for parity tests | Replaces Vercel CI. |
| Tests | **Playwright** (desktop Chromium + WebKit, mobile Chrome + Safari emulation) | Vagaro widget parity is the contract; this is how we prove it. |

---

## Phase 0 — Repo cleanup (1–2 days)

Cut everything below from the source repo **before** porting. The migration source = prod
surface. This phase ships to current prod on Vercel + Supabase, no architectural change yet —
purely surface reduction.

### Schema deletes (37 → ~22 tables)

- `scrollytelling-cms.ts` — 14 tables, 8 enums, 10 jsonb, 440 lines. All dead.
- `customers.ts` — Stripe pivot
- `testimonials.ts` — component uses hardcoded array
- `profiles.ts`, `vagaro_sync_mappings.ts`, `friend_booking_requests.ts` — friend-booking
- `auth_user.ts`, `auth_session.ts`, `auth_verification.ts` — BetterAuth (the admin/DAM
  phone-OTP path re-uses these table *names* for its allowlist + sessions; preserve the
  table shapes during cleanup, but free them from BetterAuth wiring)
- `transactions.ts`, `form_responses.ts` — write-only mirror, no UI reads

### Route deletes

- `api/scrollytelling/compositions`
- `api/stripe/webhooks`
- `api/bookings/friend/*` (all 3)
- `api/auth/[...all]` (BetterAuth catch-all)
- `api/cron/sync-vagaro-services` (CF worker took over)
- `api/cron/instagram-sync` (CF worker took over)
- `api/dam/assets/[assetId]/tags`
- `api/dam/grid-scroller`
- `api/dam/sets/add-photo`
- `api/dam/tag` (singular)
- `api/dam/team/photos/[photoId]/crops`
- `api/dam/team/upload`
- `api/website/hero-archway`

### Page deletes

- `app/admin/scrollytelling`, `app/admin/theatre` (stubs)
- `app/preview/scrollytelling/[id]`, `app/preview/theatre` (stubs)
- `app/seoguide` (883-line internal guide, unlinked)
- `app/login`, `app/confirm/[token]` (friend-booking)
- `app/punchlist` (unless explicitly kept — see Open Question)
- `app/dam/page.tsx.backup`

### Dep/file deletes

- `@clerk/nextjs`, `@clerk/backend`
- `@supabase/supabase-js`, `src/lib/supabase.ts`, `src/app/actions/newsletter.ts`
- `stripe`, `src/lib/stripe.ts`, `src/actions/stripe.ts`, `src/actions/customers.ts`
- `better-auth`, `src/lib/auth.ts`, `src/lib/auth-client.ts`
- `plaiceholder`
- `puppeteer` → devDependencies only (used in `scripts/scrape-reviews.ts`)
- `src/lib/fal-client.ts`
- `src/components/auth/ProtectedRoute.tsx`, `PhoneSaveNudge.tsx`, `PhoneLoginForm.tsx`
- `src/components/landing-v2/Footer.tsx` (live is `FooterV2`)
- env vars removed: `OPENAI_API_KEY`, `REPLICATE_API_KEY`, `FAL_KEY`,
  `INSTAGRAM_ACCESS_TOKEN`, `STRIPE_*`, `CLERK_*`, `NEXT_PUBLIC_SUPABASE_*`

### `public/` cleanup (96 MB → ~5 MB)

- Delete: `lashpop-images.zip` (7.5M), `IMG_1248.JPG` (3.8M), `IMG_2783.HEIC` (860K),
  `icon-tests/`
- Move `lashpop-images/` (83M) → R2; reference via `dam.lashpopstudios.com`

### Instagram-sync de-duplication

Pick the CF worker (`lashpop-instagram-sync`). Delete `/api/cron/instagram-sync`,
`vercel.json` cron entry, and `INSTAGRAM_ACCESS_TOKEN`. Repo + prod env both clean.

---

## Phase 0.5 — Admin parity audit (2–3 days)

For each admin page, produce a matrix: **field on admin form → DB column → frontend
component that renders it → live or dead.** Output: a single markdown file
(`tmp/admin-parity-audit.md`).

This audit is the rationale for the admin rewrite — we're not just porting forms, we're
porting the ones that drive real frontend state.

### Admin pages to audit

| Admin page | Frontend it controls | Expected DB tables |
|---|---|---|
| `/admin/website/hero` | Homepage hero arch / slideshow | `website_settings`, `assets` |
| `/admin/website/team` | Homepage team section + service-detail provider blocks | `team_members`, `team_member_photos`, `team_quick_facts`, `team_member_categories` |
| `/admin/website/services` | Services section + `/services/[slug]` | `services`, `service_categories`, `service_subcategories`, `asset_services` |
| `/admin/website/faq` | FAQ accordion on `/` | `faqs` (categories + items) |
| `/admin/website/reviews` | Homepage reviews carousel + stats | `reviews`, `homepageReviews`, `review_stats` |
| `/admin/website/instagram` | Homepage IG grid | `assets` (where source='instagram'), `website_settings` |
| `/admin/website/seo` | `<head>` meta on each page | `website_settings` (likely seo keys) |
| `/admin/website/quiz` | "Find Your Look" quiz + result page | `quiz_photos`, `quiz_lash_style`, `quiz_result_settings` |
| `/admin/website/founder-letter` | Founder letter section on `/` | `website_settings` |
| `/admin/website/work-with-us` | `/work-with-us` carousel | `work_with_us_carousel` |
| `/admin/dam-users` | Phone allowlist for `/admin/*` + `/dam/*` | `auth_user` (allowlist) |
| `/dam` | Whole DAM — assets/tags/sets/team-members | All DAM tables |
| `/dam/team` | Team photos + crops | `team_member_photos` |

For each: list the form fields, where each one writes, and where on the frontend that
value is consumed. Flag:

- **Dead admin fields** — form writes a column nothing reads.
- **Dead frontend reads** — frontend pulls a column nothing writes.
- **Hardcoded frontend that should be admin-driven** (e.g., `testimonials.ts` component uses
  a hardcoded array even though a schema exists — invert it).
- **Missing admin** — frontend dynamic content with no admin path (e.g., founder-letter copy
  may be partly hardcoded).

### Admin improvements scoped during the port

The audit will turn up specific improvements. Reserved scope:

- Unify field-shape across the 10 admin pages (current admin uses 3+ different form
  patterns).
- Add audit-log writes per admin action (`dam_user_actions` exists; extend to website
  admin).
- Single image picker component (today's `MiniDamExplorer` / `ServiceHeroImagePicker` are
  three near-duplicates).
- Optimistic UI (today admin forms wait for full round-trips).
- Allowlist management UX (today `/admin/dam-users` is bare).

These are scoped as Phase 4 work — done during the port, not after.

---

## Phase 1 — Astro skeleton on Workers (1–2 days)

- Scaffold `apps/web` with `@astrojs/cloudflare`, `output: 'server'`,
  `compatibility_flags: ['nodejs_compat']`, `compatibility_date >= 2024-09-23`.
- Workers Static Assets configured; Workers Builds wired to GitHub.
- D1 database `lashpop` created in CF dashboard, empty.
- R2 binding to existing `lashpop-dam` bucket.
- Cloudflare Web Analytics token added.
- Preview deploy at `lashpop-web.workers.dev` shows a hello page.
- Local dev: `astro dev` runs on workerd; verify D1/R2 bindings work in dev.

---

## Phase 2 — D1 schema + data import (2–3 days)

- Port the 22 live schemas from `pg-core` to `sqlite-core`:
  - Enums → `text({ enum: [...] })` + raw SQL `CHECK` constraint in migration.
  - jsonb → `text({ mode: 'json' })`. Expression indexes on
    `json_extract(col, '$.field')` for any column you filter on (audit before porting).
  - UUID defaults → drop; generate in app via `crypto.randomUUID()`.
  - Foreign keys: keep.
- Generate **one fresh `0000_init.sql`**; don't carry the 30 PG migrations.
- Data migration script (one-shot, run by hand):
  - For each table: `pg_dump --data-only --column-inserts -t <table>` → transform → batched
    `wrangler d1 execute` inserts.
  - Validate row counts table-by-table.
  - For webhook-fed tables (`appointments`, `vagaro_customers`, `business_locations`,
    `reviews`), re-snapshot just before Phase 5 cutover.

---

## Phase 3 — Port public pages (3–5 days, parallel with Phase 4 test scaffolding)

In this order:

1. `/privacy`, `/terms` — static, lowest risk, validates Workers Static Assets path.
2. `/work-with-us` — MOX form post + carousel reading from `work_with_us_carousel`.
3. `/services/[slug]` — DB read + image transforms via `/cdn-cgi/image/...`.
4. `/` — the homepage. The hardest one:
   - Hero arch / slideshow as Astro islands
   - Team section (GSAP scroll-driven) as island
   - Services section
   - Reviews carousel
   - Instagram grid (read from `assets` table)
   - FAQ (Astro `<details>` or accordion island)
   - Founder letter
   - **Vagaro booking widget** (embedded — `<script>` + iframe)
   - Quiz ("Find Your Look")
   - Map (Mapbox GL as island)

Replace `next/image` → `<img>` + `/cdn-cgi/image/...` URL transforms. Use `@unpic/img` for
responsive variants if needed.

---

## Phase 4 — Port admin + DAM + unified auth (5–7 days)

### Auth (1 day)

Single phone-OTP flow gating `/admin/*` and `/dam/*`:

- `POST /api/auth/send-code` → Twilio Verify start. Check allowlist (`auth_user` table) by
  phone number first; if not allowlisted, return 403.
- `POST /api/auth/verify-code` → Twilio Verify check; on success, insert into D1
  `sessions` table, set signed cookie (HMAC with `SESSION_SECRET`).
- Middleware (Astro `middleware.ts`) reads cookie → looks up session → injects user.
- `/admin/dam-users` adds/removes phones from `auth_user` allowlist.

~150 LoC. No BetterAuth.

### Admin port (4 days)

One screen at a time, behind feature flag (`?new=1` query param routes to new admin while
Vercel keeps serving old). Order chosen by audit risk (least → most coupled):

1. `/admin/dam-users` (just CRUD on a small table)
2. `/admin/website/founder-letter`, `/admin/website/seo` (simple key/value)
3. `/admin/website/faq`, `/admin/website/work-with-us`
4. `/admin/website/reviews`, `/admin/website/instagram`
5. `/admin/website/hero`, `/admin/website/services`
6. `/admin/website/team` — most-referenced schema, Vagaro-synced; do last
7. `/admin/website/quiz` — quiz_photos schema has 3 jsonb crop fields, port carefully

### DAM port (2 days)

`/dam` is a 2400-line page. Port as-is to an Astro page with a React island for the
gallery/table UI. R2 upload flow via `presigned-url` route stays. Crop editor stays
client-side React.

`/dam/team` is the team-photo crop manager. Port with the same shape; crops are stored in
`team_member_photos.crops` (jsonb today → `text(mode: 'json')`).

---

## Phase 4.5 — Background workers + cron (1–2 days)

- `lashpop-vagaro-sync` worker: update `DATABASE_URL` → swap to D1 driver. Already on
  CF cron. Outputs are checked by Phase 4 sync.
- `lashpop-instagram-sync` worker: same swap to D1.
- `lashpop-staffphoto-optimize` worker: no DB; carries over unchanged.
- New `lashpop-reviews-sync` worker: ports `/api/cron/sync-reviews` + `/api/cron/sync-review-stats`
  into a single CF worker on cron. BrightData calls + D1 writes.
- Replace `vercel.json` crons entirely.
- Webhook endpoint `/api/webhooks/vagaro` — port to an Astro server endpoint, signature
  verification preserved. **Update Vagaro webhook URL at cutover** (Phase 5).

---

## Phase 4.7 — Playwright parity tests (parallel with Phase 3+4, ~3 days dedicated)

The contract: **the new site behaves identically to the current one**, with Vagaro deep
integration verified end-to-end on desktop + mobile.

### Test infrastructure

- Playwright config: 4 projects → `chromium-desktop`, `webkit-desktop`,
  `chromium-mobile` (Pixel 7 emulation), `webkit-mobile` (iPhone 14 emulation).
- Two base URLs: `BASELINE_URL=https://lashpop.com` (current), `CANDIDATE_URL=https://staging.lashpop.workers.dev`.
- Tests run against both; failures only fire when **CANDIDATE diverges from BASELINE** on
  fields explicitly under test. Visual diff via `expect(page).toHaveScreenshot()` with
  tolerance.
- Run in GitHub Actions on every push to migration branch; also nightly against staging.

### Test suites

**1. Public-page parity (per breakpoint)**
- `/` — every section renders, scroll-driven animations fire, lazy images load, no console
  errors.
- `/work-with-us` — form fields, MOX submit happy path with a test email, success state.
- `/services/[slug]` — sample 3 service slugs; service detail renders with hero, provider
  list, Vagaro CTA.
- `/privacy`, `/terms` — markup matches.

**2. Vagaro booking widget — desktop**
- Click "Book Now" on `/` → widget loads → service category visible → pick a service →
  pick a staff member → time-slot picker appears → close widget → state returns to homepage.
- Click "Book Now" on `/services/[slug]` → widget loads pre-filtered to that service.
- Click a team member from team section → widget loads pre-filtered to that staff.
- All inline scripts referenced by the widget load (no 4xx/5xx on Network tab during the
  flow).
- Page does not scroll-jump when widget opens.

**3. Vagaro booking widget — mobile (iPhone 14 + Pixel 7 emulation)**
- Same flows as desktop. Specifically:
  - Drawer/sheet positioning correct (you have history with mobile carousel scroll bugs —
    commit `5b11182`).
  - Widget doesn't trap horizontal swipe gestures over team-section albums (current
    behavior must be preserved per `9093e32`-era fix).
  - Touch targets ≥ 44pt.
  - Pinch-zoom not disabled.
  - Safe-area insets respected.
- Confirm widget loads on a low-bandwidth profile (Network throttling → "Slow 3G") within
  acceptable bounds.

**4. Vagaro data flow**
- After Vagaro sync runs, sample 3 services from the live Vagaro account vs. what `/` and
  `/services/[slug]` show — exact match on name, price, description, duration.
- Same for staff: sample 3 team members; assert photo URL, name, bio surface intact.
- Webhook end-to-end: trigger an appointment update in Vagaro sandbox → confirm webhook
  reaches the new endpoint → confirm D1 row updated.

**5. Admin smoke tests** (gate-keep deploys, not parity)
- OTP login → admin landing → edit a FAQ → save → reload → value persisted.
- Upload an image to DAM → R2 URL resolves → image shows in admin gallery.
- Add a phone to `/admin/dam-users` → that phone can log in.

**6. Cron output validation**
- After each scheduled run completes, a tiny status endpoint reports last-run timestamp +
  rows touched + errors. Playwright nightly suite asserts each worker ran in the last 26h.

### Visual diff strategy

- Baseline screenshots captured against current prod, one set per breakpoint, locked to
  `main` of the new repo.
- Per PR: candidate screenshots; CI surfaces a diff gallery.
- Pixel-perfect tolerance only on header/footer + fold; below-the-fold allows 0.1% drift.

### Parity acceptance bar before Phase 5 cutover

- All 4 Playwright projects green on `CANDIDATE_URL`.
- Vagaro booking flow: 0 broken steps, on each of 4 device profiles.
- Visual diff: < 0.1% pixel drift on `/` above-the-fold for each breakpoint.
- 24 hours of nightly Playwright runs against staging with zero regressions.

---

## Phase 5 — Cutover (1 day + 48h monitoring)

The only one-way door.

1. Freeze admin writes on the Vercel/Supabase side (announce a 1–2h window — no real
   revenue running through it).
2. Re-snapshot webhook-driven tables → D1 (`appointments`, `vagaro_customers`,
   `business_locations`, `reviews`).
3. Flip `lashpop.com` DNS → Workers deployment (TTL pre-lowered the day before).
4. **Update Vagaro webhook URL** in the Vagaro dashboard to point at the new endpoint.
5. Confirm Playwright nightly green against `lashpop.com` (now pointing at new infra).
6. Stop Vercel project (don't delete yet); keep Supabase running read-only for 30 days as
   rollback insurance.
7. Disable old Vercel crons.

48h monitor:
- CF Workers analytics for error rates.
- Vagaro webhook delivery dashboard (look for failures).
- Playwright nightly runs.
- DAM uploads land in R2.

Rollback plan: lower DNS TTL revert → Vercel project re-enable → Vagaro webhook URL revert.
Supabase still has all data (just stale by the cutover window).

---

## Phase 6 — Cleanup + polish (ongoing)

- Delete Vercel project + Supabase project after 30 days clean.
- Cancel Vercel + Supabase subscriptions.
- Wrap sync workers in **Queues** if reliability becomes an issue (not Day 1).
- **Workers AI auto-tagging** on new DAM uploads — Phase 2 value-add.
- Move `lashpop-images/` from `public/` (already done in Phase 0) to active R2 use.

---

## Effort estimate

| Phase | Duration | Reversible? |
|---|---|---|
| 0 — Repo cleanup | 1–2 days | yes |
| 0.5 — Admin parity audit | 2–3 days | yes (audit only) |
| 1 — Astro skeleton | 1–2 days | yes |
| 2 — D1 schema + import | 2–3 days | yes (parallel DB) |
| 3 — Public pages | 3–5 days | yes |
| 4 — Admin + DAM + auth | 5–7 days | yes |
| 4.5 — Workers + webhooks | 1–2 days | yes |
| 4.7 — Playwright parity | 3 days dedicated, parallel | yes |
| 5 — Cutover | 1 day + 48h watch | **one-way** |
| 6 — Polish | ongoing | n/a |

**Total: ~3.5 focused weeks** for a single dev. The Playwright work runs alongside Phases
3–4 rather than serially.

---

## Open questions before Phase 0 starts

1. **Keep `/punchlist`?** Internal task tracker, standalone. Two options:
   - Drop with the cleanup (recommended; it's a separate tool).
   - Port to its own tiny Worker on the same CF account (Phase 6 work).
2. **Keep `/staffphoto`?** Internal photo-prep tool that hits `lashpop-staffphoto-optimize`
   worker. Page is unlinked. Recommended: keep the worker (it's tiny + standalone), drop
   the in-app page.
3. **`appointments` / `transactions` / `form_responses` / `business_locations`** mirror
   tables: webhook fills them, no UI reads. Keep writing for future use, or stop?
   Recommended: keep webhook writes, port the tables to D1 — the cost is negligible and
   you may want to read them later.
4. **`testimonials` schema vs hardcoded array** — surface this in the admin (recommended)
   or delete the schema and accept hardcoded forever?
5. **Founder-letter copy** — fully admin-driven or partly hardcoded? Audit determines.
6. **Quiz crops + result settings** — confirm the result-settings flow used in commit
   `9093e32` is fully reflected in the admin; port the wiring as-is.

---

## What this gets you

- **Vendors dropped:** Supabase, Vercel, Clerk, Stripe, supabase-js, Plaiceholder,
  MailChannels (already dead), BetterAuth.
- **Vendors kept:** Twilio, Vagaro, BrightData, MOX (yours), R2, Cloudflare.
- **Vendors added:** Resend (transactional only, if needed).
- **Monthly bill (rough):**
  - Today: Vercel Pro ($20) + Supabase Pro ($25) + Twilio + R2 + Cloudflare ≈ $50/mo +
    usage.
  - After: Workers Paid ($5) + R2 + D1 free tier (until > 5 GB) + Twilio + Resend free +
    Cloudflare ≈ **$5–10/mo + usage**.
- **Repo surface:** drops ~30–40% (scrollytelling + Stripe + Clerk + BetterAuth +
  newsletter + dead routes + dead schemas + dead components).
- **Dev/prod parity:** exact — Astro 6 runs on workerd locally.
- **Test coverage:** real Playwright E2E suite against Vagaro flows, replayed on every
  push and nightly.
- **Lock-in:** Cloudflare-native, but everything except D1 is portable (R2 is S3, Astro
  runs anywhere, Twilio/Vagaro/Resend are vendor-agnostic). D1 → Postgres if ever needed
  is mechanical via Drizzle.
