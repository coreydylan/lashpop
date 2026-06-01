# Lashpop Migration Audit

Snapshot of the repo at `/Users/coreydylan/Developer/lashpop` on `main` (commit `5b11182`).
Goal: separate the load-bearing surface from the inherited / abandoned scaffolding so we can
scope a move off Supabase + Vercel (and possibly Next.js).

---

## 9. Bottom line (read this first)

What the app actually does for end users today:

1. **Marketing site at lashpop.com** — single-page `/` plus `/work-with-us`, `/services/[slug]`,
   `/privacy`, `/terms`. Server-rendered Next.js with admin-CMS-driven content (hero, team,
   services, reviews, FAQs, Instagram, founder letter, quiz).
2. **Vagaro booking handoff** — the site embeds the Vagaro widget; no native booking flow is
   live. All bookings happen on Vagaro. The Vagaro mirror tables exist but are read-only
   plumbing fed by webhook + cron.
3. **Internal Digital Asset Manager at `/dam`** — phone-OTP-protected (custom Twilio Verify,
   not BetterAuth), backed by R2. This is where the team uploads photos, tags them, assigns
   them to team members, and crops them. The marketing site reads from the same tables.
4. **A few admin tools under `/admin/website/*`** — CMS for hero / team / services / FAQ /
   reviews / SEO / Instagram / quiz / founder-letter / work-with-us carousel.
5. **Friend booking SMS flow at `/confirm/[token]`** — exists end-to-end but the entry-point
   API (`POST /api/bookings/friend`) has no UI caller in the codebase. Dormant.

Everything else — Clerk, Stripe, scrollytelling CMS, Theatre.js, BetterAuth user system,
profiles/appointments linking, supabase-js newsletter, punchlist, seoguide, staffphoto — is
either feature-flagged off, demo-only, or fully replaced by a "paused" stub page.

**Production scope to preserve in the migration:** the marketing homepage (and its admin CMS),
`/work-with-us`, `/services/[slug]`, `/dam` + `/dam/team`, three webhooks/crons (Vagaro
webhook, Vagaro sync, Instagram sync, review sync), R2 access, Twilio Verify phone-OTP for the
DAM. That's it.

---

## 1. Public page surface

Source: `src/app/**/page.tsx` (+ `confirm/[token]`).

| Route | Status | Notes |
|---|---|---|
| `/` | **live** | Server-rendered, `dynamic = 'force-dynamic'`. Pulls services / team / reviews / Instagram / FAQ / hero from DB via server actions. Renders `LandingPageV2Client`. |
| `/work-with-us` | **live** | Linked from nav, hero, team section, footer. Submits via `actions/work-with-us.ts` → MOX. |
| `/services/[slug]` | **live** | Linked from `/`, ServicesSection, Footer. Reads service + DAM assets. |
| `/privacy` | **live** | Linked from `/terms` + both footers. |
| `/terms` | **live** | Linked from both footers. |
| `/confirm/[token]` | **live but dormant** | Reachable only via SMS link from friend-booking flow. The API that *sends* that SMS (`POST /api/bookings/friend`) has no UI caller. So end-to-end the flow is currently dead even though the page works. |
| `/login` | **likely dead** | Renders `<PhoneLoginForm />`. Not linked from anywhere in src. Only entered if someone types the URL. |
| `/punchlist` | **internal-only** | Internal team task tracker. Not linked from public site. Standalone auth (`actions/punchlist.ts`). Active code path but private. |
| `/seoguide` | **internal/demo** | 883-line demo / "SEO admin guide" with phone-auth login wrapper. Only inbound link: itself → `/admin/website/seo`. Likely demo / one-off. |
| `/staffphoto` | **internal tool** | Direct hit to Cloudflare worker (`lashpop-staffphoto-optimize.workers.dev/optimize`). Used to resize photos before upload to Vagaro. Not linked from anywhere; deep-linked tool. |
| `/dam/login` | **live, admin-only** | Phone-OTP login for the DAM. |
| `/dam` (protected) | **live, admin-only** | The actual DAM. ~2400-line page. Force-dynamic. |
| `/dam/team` (protected) | **live, admin-only** | Team-photo manager with crop editor. |
| `/admin/dam-users` | **live, admin-only** | Manages DAM phone-auth allowlist. |
| `/admin/website` (+ /faq, /founder-letter, /hero, /instagram, /quiz, /reviews, /seo, /services, /team, /work-with-us) | **live, admin-only** | CMS panels for everything on the homepage. Each one is wired (each `fetch('/api/admin/website/...')` or `@/actions/...` call resolves). |
| `/admin/scrollytelling` | **disabled stub** | Static "Scrollytelling tools are paused" placeholder. |
| `/admin/theatre` | **disabled stub** | Static "Theatre.js workspace temporarily disabled" placeholder. |
| `/preview/scrollytelling/[id]` | **disabled stub** | Static "Preview offline" page. |
| `/preview/theatre` | **disabled stub** | Static "Theatre.js preview disabled" page. |

### Redirects

`next.config.js` (permanent):
`/home → /`, `/about-us-1 → /#team`, `/services → /#services`, `/book-contact-1 → /#find-us`,
`/about-us-1/* → /work-with-us`, `/cart → /`, `/search → /`.

`vercel.json` (host-based, permanent):
- Host `lashpop-dam.vercel.app` or `lashpop-dam-*.vercel.app`, path `/` → `/dam`.
  (Backs up the middleware `DAM_ONLY_DEPLOYMENT` switch with a separate Vercel project
  pointed at the same code.)

---

## 2. API surface (50 routes — `src/app/api/**/route.ts`)

Grouped, with caller evidence.

### 2a. Auth (4 routes)

| Route | Status | Callers |
|---|---|---|
| `POST /api/auth/[...all]` (BetterAuth catch-all) | live | BetterAuth client (`@/lib/auth-client` → `useSession`, `signIn`, `signOut`). Used via session reads in `api/bookings/friend/*`. Almost no other usage. |
| `POST /api/auth/phone/send-otp` | live | `dam/login/page.tsx`, `auth-client.ts` (`phoneNumberAuth.sendOtp`). |
| `POST /api/auth/phone/verify-otp` | live | `dam/login/page.tsx`, `auth-client.ts`. Creates BetterAuth session + calls `createProfile` / `matchAndLinkVagaroCustomer`. |

### 2b. Bookings (3 routes)

| Route | Status | Callers |
|---|---|---|
| `POST /api/bookings/friend` | **likely dead** | No `fetch('/api/bookings/friend')` in src. Send-from-Vagaro-widget integration was never built. |
| `POST /api/bookings/friend/[token]/accept` | live | `components/bookings/FriendBookingConfirmation.tsx` (used by `/confirm/[token]`). |
| `POST /api/bookings/friend/[token]/decline` | live | same |

### 2c. Cron (4 routes)

| Route | Status | Schedule | Callers |
|---|---|---|---|
| `POST /api/cron/sync-reviews` | live | `vercel.json: 0 0 * * *` | Vercel cron; uses BrightData. `runtime = 'nodejs'`. |
| `POST /api/cron/sync-review-stats` | live | `vercel.json: 0 6 * * *` | Vercel cron; uses BrightData scrapers. `runtime = 'nodejs'`. |
| `POST /api/cron/instagram-sync` | live (overlapping) | `vercel.json: 0 0 * * *` | Uses Instagram Graph API + `INSTAGRAM_ACCESS_TOKEN`. **Duplicates** `lashpop-instagram-sync` Cloudflare Worker (different mechanism — worker uses cookies). |
| `POST /api/cron/sync-vagaro-services` | **likely dead** | Not in `vercel.json` | Not scheduled in `vercel.json`. The `lashpop-vagaro-sync` worker (`workers/vagaro-sync`) handles this now on Cloudflare 3x/day. `runtime = 'nodejs'`. |

### 2d. Webhooks (2 routes)

| Route | Status | Callers |
|---|---|---|
| `POST /api/webhooks/vagaro` | live | External (Vagaro pushes Appointment/Customer/Employee/BusinessLocation/FormResponse/Transaction events here). Routes into `lib/vagaro-sync*`. |
| `POST /api/stripe/webhooks` | **dead** | Returns 404 unless `features.stripe && features.supabase`. `STRIPE_*` envs are not set in prod (.env.local has no STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET). |

### 2e. Admin / website CMS writes (10 routes)

| Route | Callers |
|---|---|
| `GET/POST/DELETE /api/admin/dam-users` | `app/admin/dam-users/page.tsx` |
| `GET/POST/PUT/DELETE /api/admin/website/faqs` | `app/admin/website/faq/page.tsx` |
| `GET/POST /api/admin/website/hero-archway` | `app/admin/website/hero/page.tsx` |
| `GET/POST /api/admin/website/hero-slideshow-presets` | `app/admin/website/hero/page.tsx` |
| `GET/POST /api/admin/website/hero-slideshow-assignments` | `app/admin/website/hero/page.tsx` |
| `GET/POST /api/admin/website/instagram` | `app/admin/website/instagram/page.tsx` |
| `GET/POST /api/admin/website/reviews` | `app/admin/website/reviews/page.tsx` |
| `GET/POST /api/admin/website/seo` | `app/admin/website/seo/page.tsx`, `seoguide/page.tsx` |
| `GET/POST/PUT/DELETE /api/admin/website/team` | `app/admin/website/team/page.tsx`, `components/team/CredentialsEditor.tsx` |
| `GET/POST/PUT/DELETE /api/admin/website/team/quick-facts` | `components/team/QuickFactsEditor.tsx` |

### 2f. Public website reads (1 route)

| Route | Status | Callers |
|---|---|---|
| `GET /api/website/hero-archway` | **likely dead** | No callers in src. Public reads happen via server actions, not this endpoint. |

### 2g. DAM (24 routes)

| Route | Status | Callers |
|---|---|---|
| `POST /api/dam/actions` | live | `hooks/useDamActions.ts` |
| `POST /api/dam/assets/[assetId]/tags` | **likely dead** | No callers. DAM uses `bulk-tag`/`remove-tag` instead. |
| `POST /api/dam/assets/assign-team` | live | `dam/(protected)/page.tsx`, `dam/components/FileUploader.tsx` |
| `POST /api/dam/assets/bulk-tag` | live | `dam/(protected)/page.tsx`, `FileUploader`, `useDamData.ts` |
| `POST /api/dam/assets/remove-tag` | live | `dam/(protected)/page.tsx` |
| `POST /api/dam/assets/remove-team` | live | `dam/(protected)/page.tsx`, `admin/website/team/page.tsx` |
| `GET /api/dam/assets` | live | multiple admin pages + `useDamData.ts` |
| `POST /api/dam/auth/login` | live | (login flow goes via `/api/auth/phone/*`; route still exists as legacy) |
| `POST /api/dam/auth/logout` | live | `dam/(protected)/page.tsx`, `dam/(protected)/team/page.tsx` |
| `POST /api/dam/delete` | live | `dam/(protected)/page.tsx`, `useDamData.ts` |
| `GET /api/dam/grid-scroller` | **likely dead** | No callers in src. |
| `GET /api/dam/initial-data` | live | `admin/website/services`, `MiniDamExplorer`, `ServiceHeroImagePicker`, `useDamData.ts` |
| `POST /api/dam/presigned-url` | live | `dam/(protected)/team/page.tsx` |
| `GET /api/dam/service-assets` | live | `ServiceHeroImagePicker.tsx` |
| `GET/POST /api/dam/sets` | live | `dam/components/SetSelector.tsx` |
| `POST /api/dam/sets/add-photo` | **likely dead** | Only ref is a commented-out call in `dam/page.tsx.backup`. |
| `GET/POST /api/dam/settings` | live | `hooks/useDamSettings.ts` |
| `GET/POST /api/dam/tag` (singular) | **likely dead** | No callers in src. |
| `GET/POST /api/dam/tags` (plural) | live | `dam/(protected)/page.tsx`, `dam/components/TagSelector.tsx`, `useDamData.ts` |
| `GET /api/dam/team-members` | live | `dam/(protected)/page.tsx`, `dam/(protected)/team/page.tsx`, `TagSelector`, `useDamData.ts` |
| `POST /api/dam/team-members/photos` | live | `dam/(protected)/team/page.tsx` |
| `GET/POST /api/dam/team/[memberId]/photos` | live | `dam/(protected)/team/page.tsx`, `admin/website/team/page.tsx`, `EnhancedTeamSectionClient.tsx` |
| `POST /api/dam/team/photos/[photoId]/crops` | **likely dead** | No `fetch(...crops)` calls in src. Crop editor uses server actions in `actions/team-photos.ts`. |
| `DELETE /api/dam/team/photos/[photoId]` | live | `dam/(protected)/team/page.tsx`, `admin/website/team/page.tsx` |
| `POST /api/dam/team/photos/[photoId]/set-primary` | live | `dam/(protected)/team/page.tsx` |
| `POST /api/dam/team/upload` | **likely dead** | No callers in src. `runtime = 'nodejs'` set. Probably superseded by `/api/dam/presigned-url` + `/api/dam/team-members/photos`. |
| `POST /api/dam/upload` | live | `dam/components/FileUploader.tsx`, `MiniDamExplorer.tsx`, `useDamData.ts` |

### 2h. Scrollytelling (1 route)

| Route | Status | Callers |
|---|---|---|
| `GET/POST/PUT/DELETE /api/scrollytelling/compositions` | **dead** | No callers. The editor/preview pages that consumed this are now static "paused" stubs. |

### Routes with no callers (cleanup targets — confirm before delete)

- `POST /api/bookings/friend`
- `POST /api/cron/sync-vagaro-services`
- `POST /api/stripe/webhooks`
- `GET /api/website/hero-archway`
- `POST /api/dam/assets/[assetId]/tags`
- `GET /api/dam/grid-scroller`
- `POST /api/dam/sets/add-photo`
- `GET/POST /api/dam/tag` (singular)
- `POST /api/dam/team/photos/[photoId]/crops`
- `POST /api/dam/team/upload`
- `GET/POST/PUT/DELETE /api/scrollytelling/compositions`

---

## 3. Database — schema audit (37 files)

`getDb()` returns drizzle-postgres over a Supabase Postgres pooler URL. All schemas live in
`src/db/schema/*.ts`, all re-exported from `src/db/index.ts`.

### Live / load-bearing

| Schema | cols | jsonb | pgEnum | FK | refs | Purpose |
|---|---|---|---|---|---|---|
| `assets` | 15 | 1 | 5 | 1 | 14 | R2 asset metadata. Core DAM table. |
| `asset_tags` | 4 | 0 | 0 | 2 | 9 | Asset↔tag join. |
| `asset_services` | 4 | 0 | 0 | 2 | 6 | Asset↔service join (service hero images). |
| `tags` | 11 | 0 | 0 | 3 | 10 | DAM tags. |
| `tag_categories` | 15 | 2 | 0 | 0 | 9 | DAM tag groups. |
| `sets` | 5 | 0 | 0 | 1 | 2 | DAM sets (live but small surface). |
| `set_photos` | 5 | 0 | 0 | 2 | 3 | Set↔asset join. |
| `dam_user_settings` | 11 | 1 | 0 | 1 | 3 | Per-user DAM UI state. |
| `dam_user_actions` | 5 | 1 | 0 | 1 | 3 | DAM audit log. |
| `team_members` | 40 | 5 | 2 | 1 | 18 | Mirror of Vagaro staff + local additions. Most-referenced schema. |
| `team_member_photos` | 17 | 5 | 0 | 1 | 11 | DAM-managed team photos + crops. |
| `team_member_categories` | 3 | 0 | 0 | 2 | 1 | (uses) |
| `team_quick_facts` | 9 | 0 | 0 | 1 | 3 | Per-member quick facts admin UI. |
| `services` | 27 | 1 | 0 | 3 | 11 | Service catalog (Vagaro-synced + local overrides). |
| `service_categories` | 11 | 0 | 0 | 0 | 6 | Service grouping. |
| `service_subcategories` | 11 | 0 | 0 | 2 | 2 | |
| `reviews` | 17 | 0 | 0 | 0 | 7 | Scraped reviews (BrightData). |
| `review_stats` | 4 | 0 | 0 | 0 | 3 | Cron-rolled stats. |
| `faqs` | 17 | 0 | 0 | 1 | 5 | Admin-managed FAQ. |
| `quiz_photos` | 19 | 3 | 2 | 2 | 2 | "Find Your Look" quiz photos + crops + result settings. |
| `website_settings` | 9 | 1 | 0 | 0 | 11 | Generic key/value store for hero, instagram pinning, slideshow presets, etc. (Plus `homepageReviews` table in same file.) |
| `work_with_us_carousel` | 6 | 0 | 0 | 0 | 2 | Carousel photos for `/work-with-us`. |
| `auth_user`, `auth_session`, `auth_verification` | 10/7/5 | — | — | — | 11/7/1 | BetterAuth-required tables. The only BetterAuth login flow is friend-booking accept/decline (and the latent `/login` page). Phone OTP separately writes to `user` + `session` in `verify-otp` route. |
| `friend_booking_requests` | 18 | 0 | 0 | 5 | 5 | Friend-booking SMS flow (entry-point dormant, accept/decline live). |
| `vagaro_sync_mappings` | 12 | 0 | 0 | 2 | 2 | Maps BetterAuth `user.id` ↔ `vagaro_customers.id`. Used by phone OTP verify. |
| `punchlist` | 36 | 0 | 0 | 8 | 11 | Internal punchlist (only consumed by `/punchlist`). Standalone. |

### Vagaro mirror tables (filled by webhook + cron)

| Schema | cols | refs | Notes |
|---|---|---|---|
| `appointments` | 29 | 5 | Webhook + Vagaro sync writes. Read by `actions/profiles.ts` for history linking. **No UI surface in components.** |
| `vagaro_customers` | 23 | 4 | Webhook fills. Linked via `vagaro_sync_mappings`. |
| `business_locations` | 38 | 4 | Webhook fills. Only consumer: webhook + sync code. |
| `transactions` | 38 | 2 | Webhook fills. **No consumer in `src/app` or `src/components`.** Likely dormant. |
| `form_responses` | 15 | 2 | Webhook fills. **No consumer in `src/app` or `src/components`.** Likely dormant. |

### Schemas with no live consumer (dead)

| Schema | cols | jsonb | refs | Notes |
|---|---|---|---|---|
| `scrollytelling-cms` | 129 cols across **14 tables** | 10 | 1 (only `db/index.ts`) | All 14 tables (compositions, layers, tracks, clips, cues, cueActions, triggers, blocks, drawerConfigs, headerConfigs, surfaceSlides, drawerStates, collisionRules, playbackEvents). 8 pgEnums, 10 jsonb cols, 25 FKs. Only consumer is `api/scrollytelling/compositions/route.ts` which has no callers; admin/preview pages are static stubs. **440 lines of dead schema.** |
| `customers` | 6 | 0 | 3 | Stripe/Clerk pivot table. Only touched from `actions/customers.ts` + `actions/stripe.ts`, both gated behind `features.stripe`. Stripe is off in prod. |
| `profiles` | 20 | 0 | 2 | Defined; only consumer is `actions/profiles.ts` (called by phone OTP verify-otp). Profile data is created but never *read* from any UI. Latent. |
| `testimonials` | 11 | 0 | 2 | Schema exists; `TestimonialsSection.tsx` uses a hardcoded array (not the table). |

### Notes

- 11 schemas use `pgEnum`. Anything migrating off Postgres has to flatten these (or stay on PG).
- 11 schemas use `jsonb` columns — biggest offender is `scrollytelling-cms` (10 jsonb cols).
- `team_members` is the single most-referenced schema (18 src refs); it is the ground truth
  for the homepage team section and the booking widget.

---

## 4. Third-party integrations

| Vendor | Status in prod | Evidence | Migration weight |
|---|---|---|---|
| **Supabase Postgres** (via `postgres-js`/drizzle) | **live, critical** | `DATABASE_URL` set; every server action and API route uses `getDb()`. | Largest. Postgres-flavored (pgEnum, jsonb). Recommend keeping Postgres (Neon / Supabase / Cloudflare Hyperdrive). |
| **Supabase JS SDK** (`@supabase/supabase-js`) | **demo only** | Used only in `src/app/actions/newsletter.ts` and `src/lib/supabase.ts`. Newsletter target table is `newsletter_subscriptions`, separate from drizzle schemas. Called from `FooterV2.tsx`. `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are **not set in `.env.local`** — so the newsletter form is silently broken in prod. | Tiny. Replace with anything (Resend audience, plain insert into `newsletter_subscriptions` via drizzle, or kill). |
| **Clerk** (`@clerk/nextjs`, `@clerk/backend`) | **dead in prod** | No `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local`. Used only in `actions/stripe.ts`, `actions/customers.ts`, and `middleware.ts` — all behind `features.clerk` (false). | Zero. Delete on cutover. |
| **BetterAuth** | **live but very narrow** | Server: `lib/auth.ts`, `api/auth/[...all]/route.ts`. Client: `lib/auth-client.ts` (`useSession`, `signIn`, `signOut`). Sessions consumed by `api/bookings/friend/*` (3 routes). The PhoneLoginForm at `/login` exists but `/login` is not linked from anywhere. **Phone OTP for the DAM does NOT go through BetterAuth's catch-all** — it has its own send-otp / verify-otp routes that talk to Twilio Verify and hand-roll session + user inserts. | Light. Two viable paths: (a) keep BetterAuth as the session store; (b) replace the whole thing with a custom cookie+session over Cloudflare KV / Hyperdrive. |
| **Twilio Verify** | **live, critical for DAM** | `lib/sms-provider.ts` → Verify API (`VA31df...`) + classic SMS for friend-booking invites. Phone-OTP path is the only way into the DAM. | Carry over as-is — works anywhere. |
| **Stripe** | **dead in prod** | `features.stripe` false (no `STRIPE_SECRET_KEY`). `api/stripe/webhooks` returns 404. `actions/stripe.ts` short-circuits. No checkout flow built — only the webhook. | Zero. Delete. |
| **Vagaro** | **live, critical** | Client + webhook + Cloudflare sync worker. `lib/vagaro-client.ts`, `lib/vagaro-sync.ts`, `lib/vagaro-sync-all.ts`, `api/webhooks/vagaro/route.ts`, `workers/vagaro-sync`. Embeds via `components/VagaroBookingWidget.tsx`. Six DB mirror tables (only services + team_members are *read* from the UI; appointments/transactions/form_responses/business_locations are write-only mirror). | Medium. Webhook + worker + widget all need to live somewhere on the new stack. Cloudflare worker is already Cloudflare-native. |
| **Mapbox GL** | **live, single page** | Used only in `components/landing-v2/sections/MapSection.tsx`. | Trivial. |
| **Three.js** | **demo only** | One file: `components/three/ParallaxImage.tsx`. Imported but check usage on homepage. | Trivial. |
| **GSAP** | **live** | Used in `EnhancedTeamSectionClient`, `HeroArchSlideshow`, `ParallaxImage`, `useMobileGSAPScroll.ts`, `lib/gsap.ts`. Scroll/parallax animations on the homepage — not scrollytelling-CMS. | Carry over. |
| **Puppeteer** | **scripts only** | Only used in `scripts/scrape-reviews.ts` (an offline scraper). Not imported anywhere in `src/`. The runtime review scraping is done by BrightData. Heavy dep that doesn't need to ship. | Move puppeteer to devDependencies (or split scripts repo). |
| **BrightData** | **live** | `src/lib/review-scrapers/brightdata.ts`, used by `api/cron/sync-reviews` and `api/cron/sync-review-stats`. Env: `BRIGHTDATA_*`. | Carry over. |
| **MOX** (`MOX_API_*`) | **live** | Used in `actions/work-with-us.ts` and `actions/design-mode.ts` to call `https://mox-api.experialstudio.com/api/v1/emails/send`. This is our own email gateway (Experial Studio). | Keep as-is. |
| **Cloudflare R2** | **live, critical** | `lib/dam/r2-client.ts` uses `aws4fetch`; workers use R2 binding. Bucket `lashpop-dam` is bound in `workers/instagram-sync` and referenced from the public URL `pub-f9856...r2.dev` (per `.env.local`). | Already CF-native. |
| **@vercel/analytics** + **@vercel/speed-insights** | **live** | Mounted in `src/app/layout.tsx`. | Trivial replace on non-Vercel host. |
| **plaiceholder** | **dead** | In package.json, no imports in `src/`. | Remove. |
| **sharp** | **live** | `actions/team-photos.ts`, `actions/quiz-photos.ts`, `lib/dam/image-optimizer.ts`. Used to crop/resize team photos and quiz photos. | Needs Node-compatible runtime (Workers Node compat works, but staffphoto-optimize already moves heavy resize work to a Worker with the `images` binding — same direction). |
| **Instagram Graph API** (Vercel cron) | **active** | `INSTAGRAM_ACCESS_TOKEN`. Hits `graph.instagram.com`. **Overlaps with** `lashpop-instagram-sync` worker which scrapes via `sessionid` cookies. The two write to the same `assets` table — pick one. |
| **OpenAI** (`OPENAI_API_KEY`, `gpt-5.1`), **fal**, **Replicate** | **env set, no caller** | Keys exist in `.env.local` but no imports/fetches in `src/`. `src/lib/fal-client.ts` exists but is not imported. Likely leftover. |

---

## 5. Background work

### Vercel crons (`vercel.json`)

| Path | Schedule (UTC) | Status |
|---|---|---|
| `/api/cron/sync-reviews` | `0 0 * * *` | live |
| `/api/cron/sync-review-stats` | `0 6 * * *` | live |
| `/api/cron/instagram-sync` | `0 0 * * *` | live but **overlaps the CF worker** |

`/api/cron/sync-vagaro-services` is *defined* but **not scheduled** anywhere — the Cloudflare
`lashpop-vagaro-sync` worker took over (header comment in its wrangler.jsonc says
"same schedule as the (now-removed) Vercel cron"). Delete the route.

### Cloudflare Workers (`workers/*/wrangler.jsonc`)

| Worker | Cron | Purpose |
|---|---|---|
| `lashpop-instagram-sync` | `30 13 * * *` | Pulls IG posts via the cookie-authed private GraphQL endpoint, uploads media to R2, writes to `assets`. |
| `lashpop-vagaro-sync` | `0 6,14,22 * * *` | Pulls services + team members + public staff from Vagaro, writes mirror tables. |
| `lashpop-staffphoto-optimize` | no cron (request-driven) | Image-resize endpoint hit by `/staffphoto` page. Uses Cloudflare Images binding. |

### Overlap to resolve

`/api/cron/instagram-sync` (Vercel, Graph API token) vs `lashpop-instagram-sync`
(Cloudflare, IG cookies + R2 binding) — **same downstream table, different sync mechanism,
different schedules**. Pick the Cloudflare worker (already R2-native; doesn't depend on
Meta Graph review/permissions) and delete the Vercel cron + route.

---

## 6. Storage and assets

### R2

- Bucket: `lashpop-dam` (account `8276973f31803dc6a1597c1396d64c4c`).
- Public URL: `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev`.
- Custom hostname: `dam.lashpopstudios.com` (whitelisted in `next.config.js` remotePatterns).
- Access from Next: `src/lib/dam/r2-client.ts` (aws4fetch with `R2_ACCESS_KEY_ID` /
  `R2_SECRET_ACCESS_KEY`).
- Access from workers: direct `BUCKET` binding (instagram-sync only).
- All Vagaro staff photos point at `*.ssl.cf2.rackcdn.com` (Vagaro's own CDN — read-only,
  not hosted by us).

### `public/` (96 MB)

| Item | Size | Notes |
|---|---|---|
| `lashpop-images/` | 83M | Folder of build-time images. Big. Should move to R2 if not needed for SSG. |
| `lashpop-images.zip` | 7.5M | Zip of the above. **Should not be in public/.** |
| `IMG_1248.JPG` | 3.8M | Stray dev photo. **Delete.** |
| `IMG_2783.HEIC` | 860K | Stray. **Delete.** |
| `founder letter mobile copy.jpg` | 472K | Filename has a space — fragile. |
| `founder-letter.svg` / `founder-letter-original.svg` | 156K each | Used. |
| `desk.jpg` | 252K | Hero/section asset. |
| `icon-tests/` | 184K | Test artifacts. |
| `fonts/` | 60K | Used. |
| `placeholder-team.svg` | 4K | Used. |

### Image optimization

- `next/image` is used **35 times** across `src/`. Vercel's image optimization service backs
  it today. On Cloudflare/Astro, replace with `@unpic/img`, `cf-images`, or Cloudflare Images
  binding.

---

## 7. Hosting + runtime dependencies

- **Framework**: Next 15.5 App Router, React 19, TypeScript 5.9.
- **Middleware** (`middleware.ts`): two responsibilities. (1) DAM-only deployment switch —
  hostname-based or `DAM_ONLY_DEPLOYMENT=true` redirects non-DAM routes to `/dam`. (2) Lazy
  `clerkMiddleware` import gated by `features.clerk` — never runs in prod (no Clerk env).
- **Runtime exports**:
  - `export const runtime = 'nodejs'` (4 routes):
    `api/dam/team/upload`, `api/cron/sync-review-stats`, `api/cron/sync-reviews`,
    `api/cron/sync-vagaro-services`.
  - `export const runtime = 'edge'`: **0 routes**.
  - `export const dynamic = 'force-dynamic'`: `src/app/page.tsx`, `dam/(protected)/page.tsx`.
- **Vercel-specific surface**:
  - `@vercel/analytics`, `@vercel/speed-insights` (one file each, in `src/app/layout.tsx`).
  - `vercel.json` crons + host-based redirects (above).
  - `outputFileTracingRoot: __dirname` (only relevant on Vercel).
  - No `next/og`, no `revalidate` ISR usage worth noting (we force-dynamic the homepage).
  - Vercel image optimization (`next/image`) — needs replacement.

---

## 8. Clean-sweep candidates

Concrete delete-on-migration list. Order matters — start at the bottom and work up.

### Definitely dead (no callers, no env, no schedule)

| Path | Why |
|---|---|
| `src/app/api/scrollytelling/compositions/route.ts` | No callers; admin + preview pages are static stubs. |
| `src/db/schema/scrollytelling-cms.ts` (440 lines, 14 tables) | Only consumer is the route above. |
| `src/app/admin/scrollytelling/page.tsx` | Static "paused" stub. |
| `src/app/admin/theatre/page.tsx` | Static "paused" stub. |
| `src/app/preview/scrollytelling/[id]/page.tsx` | Static "paused" stub. |
| `src/app/preview/theatre/page.tsx` | Static "paused" stub. |
| `src/app/api/stripe/webhooks/route.ts` | Returns 404 in prod. |
| `src/actions/stripe.ts` | Whole file gated behind `features.stripe`. |
| `src/actions/customers.ts` | Stripe-only; gated. |
| `src/lib/stripe.ts` | Stripe-only. |
| `src/db/schema/customers.ts` | Stripe pivot table. |
| `src/app/api/dam/assets/[assetId]/tags/route.ts` | No callers. |
| `src/app/api/dam/grid-scroller/route.ts` | No callers. |
| `src/app/api/dam/sets/add-photo/route.ts` | No callers (the call site is in `page.tsx.backup`). |
| `src/app/api/dam/tag/route.ts` (singular) | No callers. |
| `src/app/api/dam/team/photos/[photoId]/crops/route.ts` | No callers. |
| `src/app/api/dam/team/upload/route.ts` | No callers. |
| `src/app/api/website/hero-archway/route.ts` | No callers (admin variant is used instead). |
| `src/app/api/cron/sync-vagaro-services/route.ts` | Not in `vercel.json`; CF worker took over. |
| `src/app/dam/page.tsx.backup` | Backup file. |
| `src/app/actions/newsletter.ts` | Supabase JS, broken in prod (envs unset). |
| `src/lib/supabase.ts` | Only consumer is `newsletter.ts`. |
| `src/components/auth/ProtectedRoute.tsx` | Defined but never imported. |
| `src/components/auth/PhoneSaveNudge.tsx` | Defined but never imported. |
| `src/lib/fal-client.ts` | Not imported anywhere. |

### Likely dead (verify first)

| Path | Why |
|---|---|
| `src/app/api/bookings/friend/route.ts` (POST create) | No UI caller. accept/decline still used. If friend-booking is shelved, delete all 3 + the `/confirm/[token]` page + `friend_booking_requests` table + `lib/sms-provider.ts:sendFriendBookingInvite`. |
| `src/app/login/page.tsx` + `components/auth/PhoneLoginForm.tsx` | Not linked from anywhere (FriendBookingConfirmation also embeds it, but that page itself is dormant). If we kill friend-booking, the whole BetterAuth surface goes with it. |
| `src/app/seoguide/page.tsx` | 883-line in-app guide; not linked, links *out* to `/admin/website/seo`. Likely demo. |
| `src/components/landing-v2/Footer.tsx` | Not imported anywhere (`FooterV2` is the live one). |
| `src/db/schema/profiles.ts` + `vagaro_sync_mappings.ts` | Filled by `verify-otp` route, never read from any UI. Tied to the dormant friend-booking flow. |
| `src/db/schema/transactions.ts`, `form_responses.ts` | Webhook fills them; no UI reads. |
| `src/db/schema/testimonials.ts` | Schema unused (component uses hardcoded array). |
| `src/app/api/cron/instagram-sync/route.ts` | If we keep the CF worker, delete this + `INSTAGRAM_ACCESS_TOKEN` env. |
| `src/app/admin/dam-users/page.tsx` + `src/app/api/admin/dam-users/route.ts` | Verify the OTP allowlist is enforced somewhere; if so, keep. Otherwise it's an unused admin UI. |
| `OPENAI_API_KEY`, `REPLICATE_API_KEY`, `FAL_KEY` envs | No `src/` imports. Delete from env or wire up. |

### Clerk leftovers to scrub

The Clerk dep is in `package.json` but is never active in prod. Files importing
`@clerk/nextjs/server`: `middleware.ts` (dynamic import gated by `features.clerk`),
`src/actions/stripe.ts`, `src/actions/customers.ts`. If we delete the Stripe slice (above),
the only remaining Clerk reference is the gated middleware block — also safe to delete.

### `public/` cleanup

- `public/lashpop-images.zip` (7.5M)
- `public/IMG_1248.JPG` (3.8M)
- `public/IMG_2783.HEIC` (860K)
- `public/icon-tests/` (move to /tmp or delete)
- `public/lashpop-images/` (83M) — audit which are *actually* referenced by the build; move
  the rest to R2 or delete.

### Top-level repo cruft (not src/, but bloats the migration scope)

22 stray `*.md` design/spec docs at the repo root (`COMPLETE_LANDING_PAGE_DESIGN.md`,
`LASHPOP-COMPLETE-SPECIFICATION.md` (84 KB), `PHONE_AUTH_SYSTEM_PROPOSAL.md`, etc.).
Move to `docs/` or delete.

---

## TL;DR for the migration

**Keep**: marketing pages (`/`, `/work-with-us`, `/services/[slug]`, `/privacy`, `/terms`),
the DAM (`/dam`, `/dam/team`, `/admin/website/*`, `/admin/dam-users`), Vagaro webhook,
the three Cloudflare workers, BrightData review crons, Twilio Verify phone-OTP, R2,
postgres-js + drizzle, the 22 live schemas.

**Cut**: scrollytelling CMS (route + 14 tables + 4 stub pages), Stripe, Clerk, supabase-js
newsletter, 10 unreferenced API routes, BetterAuth if we drop friend-booking, puppeteer
from runtime deps, plaiceholder, OpenAI/fal/Replicate env vars.

**Resolve before cutover**: Instagram sync duplication (Vercel cron vs CF worker — pick
worker). Decide whether friend-booking is a live product (if no → delete BetterAuth +
profile/vagaro mapping + friend_booking_requests + /login + /confirm).
