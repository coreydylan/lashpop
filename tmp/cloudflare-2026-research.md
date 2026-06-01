# Cloudflare 2026 Platform — Architecture Recommendation for lashpop

**Research date:** 2026-05-13
**Target app:** Next.js 15 / React 19 luxury lash studio site — marketing homepage, small admin (DAM + FAQ/team/SEO/website settings), booking flow (mostly redirects to Vagaro), phone-OTP auth via Twilio + BetterAuth, feature-flagged Stripe webhooks, Instagram + Vagaro sync workers already on Cloudflare, R2 for DAM, Drizzle ORM on Supabase Postgres (43 tables, 19 enums, 30 jsonb cols, 30+ migrations).

**TL;DR — primary recommendation:** Migrate to **Astro 6 on Workers Static Assets**, drop Supabase entirely, move structured data to **D1**, keep R2 for blobs, **roll your own phone-OTP** on top of Twilio Verify with sessions in a Durable Object (or KV). This is now a first-party Cloudflare stack — Cloudflare bought the Astro team in Jan 2026 ([blog](https://blog.cloudflare.com/astro-joins-cloudflare/)) and Astro 6's dev server runs on `workerd`, giving you the same runtime locally and in prod.

The "boring backup" is OpenNext on Workers + Hyperdrive→Supabase. That keeps Next.js and Postgres, drops Vercel, and is reversible. See §6 alternative.

---

## 1. Current CF building blocks (mid-2026)

### Workers (Standard + Free)
- **What:** V8 isolates running JS/WASM at 300+ edge POPs. Standard usage model billing (CPU only) is the default.
- **Use when:** Anything HTTP-shaped. Default compute primitive.
- **Don't use when:** You need >5 min of CPU per request, or large native deps (`sharp`, headless Chrome, Python ML).
- **Free:** 100K req/day, 10ms CPU/invocation, no D1/KV write floor problems for hobby use.
- **Paid ($5/mo min):** 10M req/mo + $0.30/M, 30M CPU-ms + $0.02/M. Bundle limit **3 MiB free / 10 MiB paid** (gzipped). ([pricing](https://developers.cloudflare.com/workers/platform/pricing/))

### Workers Static Assets
- **What:** Static files + a Worker function shipped as one deploy. Free static asset requests, unlimited.
- **Use when:** Any "static site + small functions" app. **This is the recommended pattern over Pages in 2026.**
- **Don't use when:** You need legacy Pages-only features (you don't — Workers has parity as of March 2026).
- **Cost:** Static asset requests are **free, unlimited**, both plans. ([docs](https://developers.cloudflare.com/workers/static-assets/))

### Pages — status check
- **Not deprecated, but in maintenance mode.** New investment is going to Workers. Workers has Durable Objects, Cron Triggers, Workflows, Containers, Secrets Store — all Workers-only. Migration guides exist. ([migration guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/))
- **Action:** Don't start anything new on Pages. Plan an existing-Pages migration when convenient.

### D1 (SQLite at the edge)
- **GA since April 2024.** Production-ready. ([release notes](https://developers.cloudflare.com/d1/platform/release-notes/))
- **Limits (2026):** 10 GB per DB hard cap. Up to 50,000 DBs per paid account. 1 TB total storage. Single-leader writes; read replicas in public beta (Sessions API for sequentially consistent reads). 2 MB max row/string. 6 concurrent connections per Worker invocation. 30s query duration. ([limits](https://developers.cloudflare.com/d1/platform/limits/))
- **Throughput:** Each DB is single-threaded — ~1K QPS at 1ms queries, ~10 QPS at 100ms queries.
- **Free:** 5M rows read/day, 100K rows written/day, 5 GB storage.
- **Paid:** 25B rows read/mo, 50M rows written/mo, 5 GB included + $0.75/GB-mo.
- **CMS-style fit:** Excellent. Small content tables + image metadata + sessions easily fits under 1 GB.
- **Sept 2025:** Automatic read-only query retries. **Nov 2025:** Jurisdiction support for data localization.

### KV (Workers KV)
- **What:** Eventually consistent (~60s global propagation), high-read, low-write key-value.
- **Use when:** Site-wide config, feature flags, cached session tokens, anything read >>> written.
- **Don't use when:** Anything needing strong consistency, or write rate >1/sec per key.
- **Gotcha:** Minimum TTL is 60s. ([KV limits](https://developers.cloudflare.com/kv/platform/limits/)) Don't put rate-limit counters in KV — BetterAuth has a known bug where it passes 10s TTLs and writes silently fail.
- **Free:** 100K reads/day, 1K writes/day, 1 GB. **Paid:** 10M reads/mo + $0.50/M, 1M writes/mo + $5/M.

### R2 (object storage)
- **What:** S3-compatible blob storage, no egress fees.
- **Use when:** Images, video, any blob >100KB. You already use it for DAM — keep it.
- **Cost:** $0.015/GB-mo storage, $0.36/M Class A ops, $0.036/M Class B ops. Free: 10 GB, 1M Class A, 10M Class B per month. ([pricing](https://developers.cloudflare.com/r2/pricing/))

### Durable Objects (incl. SQLite-backed)
- **What:** Single-instance compute + transactional storage, globally addressable by name. SQLite-backed DOs **GA in 2026, storage billing began Jan 7, 2026**. ([blog](https://blog.cloudflare.com/sqlite-in-durable-objects/))
- **Use when:** Per-entity coordination (a chat room, a user session, a booking room), or per-tenant SQLite when you want to shard.
- **Don't use D1 → use DO+SQLite when:** You want compute colocated with the data (no network hop), per-tenant isolation, or strong consistency on writes for one object.
- **For lashpop:** Probably not the primary store. Could be useful for **session objects** (one DO per session = built-in serialization) or **rate-limit buckets**.

### Hyperdrive
- **What:** Connection pool + query cache in front of any Postgres/MySQL.
- **Use when:** You can't or don't want to migrate off Postgres but want to run on Workers.
- **Cost:** Free, both plans. You pay for the Worker request and the upstream DB. ([Hyperdrive pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/))
- **Gotchas (real, recent):**
  - **Feb 2026 change:** STABLE Postgres functions (`NOW()`, `CURRENT_TIMESTAMP`, `CURRENT_DATE`) no longer cached. If your auth/session queries use `WHERE expires_at > NOW()`, compute the timestamp in the Worker. ([changelog](https://developers.cloudflare.com/changelog/post/2026-02-23-hyperdrive-stable-functions-uncacheable/))
  - Text-based cache-detection: even `NOW()` inside a SQL **comment** marks the query uncacheable.
  - BetterAuth + Hyperdrive: open issues around session-row staleness when caching is on. If you go this route, disable caching for auth tables or use `pgbouncer`-style transaction mode.
- **For lashpop:** Only if you decide to keep Supabase. Otherwise, irrelevant.

### Queues
- **What:** Message queue with at-least-once delivery, batching, retries, DLQ.
- **GA. ([changelog](https://developers.cloudflare.com/queues/platform/changelog/))** 5K msg/sec per queue, 250 concurrent consumers.
- **Use when:** Decoupling Instagram/Vagaro sync, retries for Stripe webhooks, fan-out.
- **Cost:** $0.40/M operations (1 msg = ~3 ops: write + read + ack). 64 KB max message — larger = billed as multiple.
- **For lashpop:** Wrap the existing Instagram/Vagaro sync workers in a queue for retry safety.

### Workflows
- **What:** Durable, multi-step, long-running orchestration (steps survive worker death). Cron-triggerable.
- **Use when:** Multi-step background jobs that need retries, sleeps, observability. Replaces ad-hoc cron + retry logic.
- **For lashpop:** Promote the Instagram and Vagaro sync workers to Workflows if/when they grow past simple cron. Not urgent.

### Workers AI + Vectorize
- **Workers AI:** $0.011 per 1K Neurons; 10K free per day. Per-model pricing also available. Llama 3.2 11B Vision: $0.049/M input tokens, $0.676/M output tokens. ([pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/))
- **Vectorize:** GA. Paid plan only. Pricing per dimension × stored/queried vectors.
- **For lashpop:** Useful if you auto-tag DAM images later (e.g., "lash-set photo with lower lashes visible"). Not Day 1.

### Workers Builds
- **What:** Native git → deploy CI. GA. Connect a GitHub/GitLab repo; push → preview deploy, push to main → prod.
- **For lashpop:** Replaces Vercel/Pages CI completely. Use this for the main site Worker. ([builds](https://developers.cloudflare.com/workers/ci-cd/builds/))

### Workers for Platforms
- **What:** Multi-tenant Worker dispatch (you host customers' Workers).
- **For lashpop:** Skip. Not relevant.

### Browser Rendering
- **What:** Managed Puppeteer/Playwright in a Worker. Playwright GA at v1.55.
- **Cost:** 10 browsers/mo included; $2/browser after. Free plan capped at 10 min/day. ([pricing](https://developers.cloudflare.com/browser-run/pricing/))
- **For lashpop:** Useful for OG-image generation, PDF receipts, scraping Vagaro pages that don't have an API. Not core.

### Workers Images binding
- **What:** Programmatic image transforms inside a Worker, no URL roundtrip.
- **Free:** 5,000 unique URL-based transforms/mo. Pricing: $0.50/1K transforms, $5/100K storage, $1/100K delivery.
- **Big gotcha:** **Every Images-binding call counts as a transformation — no dedupe.** URL-based transforms dedupe; bindings don't. ([blog](https://blog.cloudflare.com/improve-your-media-pipelines-with-the-images-binding-for-cloudflare-workers/))
- **For lashpop:** Use **URL-based** transforms (`/cdn-cgi/image/...` in front of R2) for the public site. Use the binding only inside admin upload flows where you intentionally re-encode once.

---

## 2. Framework on Workers — current state

### Astro on Cloudflare — first-class as of 2026
- **`@astrojs/cloudflare`** adapter sets `output: 'server'`, deploys via `wrangler deploy` (auto-detected).
- **Cloudflare acquired the Astro team Jan 16, 2026.** ([press release](https://www.cloudflare.com/press/press-releases/2026/cloudflare-acquires-astro-to-accelerate-the-future-of-high-performance-web-development/)) Astro stays open source.
- **Astro 6 (beta as of Feb 2026):** dev server runs on **workerd** — same runtime as production. D1/KV/R2/DO/AI bindings work in local dev via Cloudflare Vite plugin. Live Content Collections stable. CSP support. ([Astro blog](https://astro.build/blog/joining-cloudflare/))
- **Features:** SSR, on-demand rendering per route, **Server Islands** (per-component server rendering for things like "current booking slots"), prerendering via `export const prerender = true`, Sessions API auto-backed by KV.
- **Bindings:** All Cloudflare bindings available via `Astro.locals`.
- **Verdict:** First-class. The dev/prod parity story is now better than Next.js-on-Workers.

### Next.js on Cloudflare via `@opennextjs/cloudflare`
- Official path. Supports App Router, Pages Router, dynamic routes, SSG, SSR, ISR, PPR, server actions, `after()`, `'use cache'`, Turbopack, middleware, Image optimization.
- **Caveats:** Node Middleware (Next 15.2+) not yet supported. Currently at `1.0.0-beta`. Next 14 support drops Q1 2026. ([docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/), [opennext docs](https://opennext.js.org/cloudflare))
- **Bundle limit:** 3 MiB free / **10 MiB paid (gzipped)**. Next.js apps with heavy deps can hit this — you have a non-trivial app.
- **Requires:** `nodejs_compat` flag, compatibility date ≥ `2024-09-23`.
- **Verdict:** Works, but second-class compared to Astro now. Bundle size is the real risk for an app with Drizzle + BetterAuth + your admin libs.

### Honest comparison for lashpop
Your app is:
- **Content-heavy marketing site** — exactly what Astro is built for (per-component hydration, ship near-zero JS).
- **Small admin** — Astro can SSR forms + use small React/Solid islands. No problem.
- **Booking flow that mostly redirects to Vagaro** — Astro server endpoints handle this fine.
- **Scrollytelling** — Astro islands for the interactive bits, static HTML for everything else. Lighter JS than Next.

**Pick Astro.** Reasons:
1. Cloudflare owns the framework now — alignment risk is gone, not added.
2. Workerd dev server = the exact production runtime locally. Next.js-on-Workers still has the OpenNext shim.
3. Your scrollytelling page benefits massively from Astro's "minimal JS by default" model — Next ships way more bytes for the same render.
4. No 10 MiB bundle wall to dance around.
5. The admin is small enough that you're not giving up a meaningful Next.js feature.

### Third options
- **TanStack Start on Workers:** RC v1.154, feature-complete, API-stable. Strong type safety. **Don't pick.** Less mature than Astro for content-driven sites, no managed CMS-style ecosystem.
- **Plain Hono + JSX:** Too low-level — you'd rebuild routing, layouts, MDX, image pipeline. Skip.
- **Remix on Workers:** Now React Router v7 in framework mode. Fine, but neither better for content nor better-supported on CF than Astro.

---

## 3. Getting off Postgres — yes, realistic

### D1 limits vs your workload
- 10 GB hard cap per DB — your entire content+admin+image-metadata footprint is unlikely to exceed 1 GB ever.
- ~1K QPS at 1ms queries — marketing site + small admin will not approach this.
- Single-leader writes, read replicas (beta) — fine for a CMS where reads dominate writes 1000:1.
- Time Travel (built-in PITR) — replaces Supabase backups.

**D1 fits. Easily.**

### Porting the Drizzle schema (43 tables, 19 enums, 30 jsonb, 30+ migrations)
- **Drizzle supports D1** as a first-class SQLite target via the `drizzle-orm/d1` driver.
- **Enums → text + CHECK:** Standard SQLite pattern. Drizzle's `text('col', { enum: [...] })` gives TS-level type inference; add a runtime CHECK constraint via raw SQL in the migration. **Gotcha:** Drizzle Kit doesn't auto-generate migrations when you add an enum value to a SQLite CHECK constraint — you'll write that migration by hand. ([discussion](https://github.com/drizzle-team/drizzle-orm/discussions/4131))
- **jsonb → `text('col', { mode: 'json' })`:** SQLite has full JSON functions (`json_extract`, `json_each`, `json_set`). You lose Postgres's native indexable JSONB GIN indexes, but you can create expression indexes on `json_extract(col, '$.path')` — works fine for the few fields you actually filter by.
- **30+ migrations:** Don't port them. **Generate one fresh `0000_init.sql`** from the current Drizzle schema for D1, then snapshot+export the production data, transform, import. Carrying Postgres migration history into SQLite is wasted work.

**Porting cost estimate:** 2–4 days for the schema port + data migration script + smoke tests. The 30 jsonb columns are the biggest unknown — you'll need to grep usage to confirm none rely on Postgres-only operators (`@>`, `?`, `jsonb_path_query`).

### Alternative: keep Postgres on Hyperdrive
Right call when:
- You can't afford a data migration window.
- You rely on Postgres features that don't port (PostGIS, advisory locks, complex JSONB ops, RLS at the DB level).
- **You don't.** None of those apply to a lash-studio CMS.

If you keep Postgres, **move to Neon** (designed for serverless) rather than Supabase-as-Postgres — Supabase's transaction pooler has known issues with Workers, and your project memory specifically flags this. Neon's branching also pairs better with Workers preview deploys.

### Storage split for lashpop
| Layer | Holds | Why |
|---|---|---|
| **D1** | All structured content: pages, FAQs, team members, SEO settings, image metadata, bookings (if you ever stop redirecting to Vagaro), session table | Your primary store. |
| **KV** | Site config (hours, holiday banner), feature flags, public-facing things read on every page, BetterAuth secondary cache if you want it | Read-heavy, eventually-consistent stuff that benefits from edge caching. |
| **R2** | All DAM blobs (you're already here) | Cheap, no egress. |
| **DO (SQLite)** | Maybe: per-user session state, rate-limit buckets, OTP challenges (one DO per phone number while a verify is in flight) | Optional. Could also live in D1 — DOs only if you want serialized writes per user. |

---

## 4. Auth — phone OTP without Supabase

### Realistic options for phone-OTP + sessions in 2026

| Option | Verdict |
|---|---|
| **BetterAuth on Workers + D1** | Works, but has live bugs in the cookie-cache + secondaryStorage path (#4203, reopened Jan 2026), and the rate-limiter passes 10s TTLs that fail silently against KV (60s min). Phone-OTP via Twilio Verify is third-party-SMS-friendly only as of recent issues. |
| **Lucia** | Library is in maintenance mode — author recommended migrating off. Skip. |
| **Auth.js / NextAuth** | Designed around Next.js + sessions in cookies. Possible but awkward on Astro. Phone-OTP isn't first-class. Skip. |
| **WorkOS / Clerk** | You want out. Both work fine on Workers. Skip. |
| **Roll your own with Workers + D1 + Twilio Verify** | Honestly the cleanest fit for phone-only. ~150 lines of code. You already have Twilio. |

### Recommendation: roll your own
For phone-only auth, you literally need:
1. `POST /auth/send-code` → call Twilio Verify "start", return `{ok}`. (No state on your side — Twilio holds the challenge.)
2. `POST /auth/verify-code` → call Twilio Verify "check", on success create a session row in D1, set a signed cookie (use `@oslojs/crypto` for HMAC).
3. Middleware that reads cookie, looks up session in D1 (or in a session DO).

This is ~1 day of work, no third-party auth lib lock-in, no upgrade risk, no caching/staleness bugs. BetterAuth is overkill for "verify a phone number." If you later need OAuth, multi-factor, passkeys — revisit BetterAuth then with full eyes-open on its current bugs.

**Session storage:** D1 `sessions` table. Use a Durable Object only if you start seeing concurrent-login race conditions (you won't, with phone-OTP on a single device).

---

## 5. Email / SMS / payments

### SMS — Twilio stays
No CF SMS product. Twilio Verify is the right Twilio product (don't manage OTP codes yourself).

### Payments — Stripe stays
Webhooks to a Worker endpoint work perfectly. Verify signature with `stripe.webhooks.constructEventAsync` (the async variant works in Workers).

### Email — replace MailChannels
MailChannels' free Workers integration **ended August 31, 2024**. Their new paid API has a 100/day free tier but you should treat email as a paid line item now. ([EOL notice](https://support.mailchannels.com/hc/en-us/articles/26814255454093-End-of-Life-Notice-Cloudflare-Workers))

**Pick Resend.** Reasons:
- Native Cloudflare Worker SDK.
- React-based email templates (`react-email`) work cleanly even from Astro since you have React.
- $0/mo for 3K emails, $20/mo for 50K. Lashpop will live in the free tier for years.
- Postmark is the equally-defensible pick if you want a more deliverability-focused vendor. Either is fine.

---

## 6. Concrete target architecture for lashpop

### Primary recommendation

```
┌──────────────────────────────────────────────────────────────────┐
│                  lashpop.com (Workers Static Assets)             │
│                                                                  │
│   Astro 6 SSR  ──┬──> Static assets (free, unlimited)            │
│                  ├──> /api/* server endpoints                    │
│                  └──> Server Islands for live bits               │
└──────────┬──────────┬──────────┬──────────┬──────────────────────┘
           │          │          │          │
           v          v          v          v
        ┌─────┐   ┌─────┐    ┌─────┐    ┌─────┐
        │ D1  │   │ KV  │    │ R2  │    │ DO  │ (optional)
        └─────┘   └─────┘    └─────┘    └─────┘
        content   config      DAM       rate-limit
        sessions  feature    blobs      buckets
        bookings   flags
        metadata
        FAQ/team

  External:  Twilio Verify (OTP) ─┐
             Vagaro (booking)  ───┤── Worker fetch / redirect
             Stripe (webhooks) ───┤
             Resend (email)    ───┘

  Background:
    Workers Builds (CI on git push)
    Cron Triggers → existing Instagram/Vagaro sync Workers
    Queues (wrap syncs for retry safety) — optional Phase 2
    Workflows — only if syncs grow past simple cron
```

- **Framework + hosting:** Astro 6 on Workers (`@astrojs/cloudflare`, `output: 'server'`).
- **DB:** D1, single database. Drizzle ORM (already used). Schema regenerated from current TS definitions.
- **Storage:** R2 (already there). Keep current bucket. URL-based `/cdn-cgi/image/...` transforms in front for `next/image`-like behavior.
- **Auth:** Hand-rolled, Twilio Verify + D1 sessions table + signed cookie (`@oslojs/crypto`).
- **Sessions:** D1 row, cookie HMAC. KV optional as a read-through cache later.
- **Cron / background:** Existing Workers stay. Add Queues in front when sync reliability matters.
- **Admin:** Astro routes under `/admin`, gated by session middleware. Forms posted to server endpoints. React islands only for the DAM uploader and rich-text bits.
- **Image pipeline:** Upload → Worker → R2. Public delivery via Cloudflare Images URL transforms. Auto-tagging (Workers AI vision) is Phase 2.
- **Analytics:** Cloudflare Web Analytics (free, privacy-respecting, no JS overhead). Workers Analytics Engine for custom funnel events.
- **Email:** Resend.
- **CI/CD:** Workers Builds (git push → preview/prod).

### Alternative architecture (the "second best")

**OpenNext (Next.js 15) on Workers + Hyperdrive → Neon Postgres.**

```
   Next.js 15 (OpenNext)  ──>  Hyperdrive  ──>  Neon Postgres
        │                                       (or Supabase pure-PG)
        ├── R2 (DAM, unchanged)
        ├── KV (config)
        ├── BetterAuth (keep)
        └── Resend / Twilio / Stripe (same)
```

**Pick this if:**
- Migrating Next → Astro feels like too much surface area for one quarter.
- You want to be reversible: this stack runs on Workers but the app is still Next, so you can flee back to Vercel in a weekend.
- You're not actually committing to "pure Cloudflare" — you're committing to "off Vercel."

**Tradeoff:** Doesn't actually deliver "pure CF" — you still depend on Neon/Supabase for the DB. You inherit OpenNext's bundle-size dance (10 MiB paid limit, gzipped). You inherit BetterAuth's current cookie-cache bugs. The dev/prod parity story is worse than Astro 6 on workerd.

---

## 7. Migration gotchas & reversibility

### Non-obvious gotchas

- **Hyperdrive STABLE-function cache change (Feb 2026):** `WHERE expires_at > NOW()` is no longer cached. Compute timestamps in the Worker and pass as params. Comments with `NOW()` in them also break caching. ([changelog](https://developers.cloudflare.com/changelog/post/2026-02-23-hyperdrive-stable-functions-uncacheable/))
- **BetterAuth + KV minimum TTL:** Rate-limit writes fail silently because BetterAuth passes 10s TTLs and KV minimum is 60s. If you keep BetterAuth, use D1 (not KV) for `secondaryStorage`. Or just don't use BetterAuth.
- **D1 query result cap:** 2 MB per row/string. If a `jsonb` field is huge, it can hit this. Audit your largest content rows.
- **D1 concurrency cap:** Only 6 connections per Worker invocation. Don't fan out 20 parallel queries — batch them.
- **D1 single-threaded writes:** A heavy write doesn't slow other DBs but blocks reads to the same DB during the write. For a CMS this is fine; just don't run a long ANALYZE during peak.
- **Workers Images binding:** Every call bills as a unique transform — no dedupe. Use URL-based transforms in the public path. Binding only inside one-shot admin upload flows.
- **Worker bundle limit (10 MiB gzipped paid):** Next.js + Drizzle + BetterAuth + your admin libs may cross this. Astro typically lands well under.
- **KV is eventually consistent (~60s).** Never put "did this OTP get used yet?" in KV — put it in D1 (or Twilio Verify holds it for you).
- **`@astrojs/cloudflare` requires `nodejs_compat`** in `wrangler.jsonc` and compatibility date ≥ `2024-09-23`.
- **Drizzle Kit + SQLite enums via CHECK:** Schema diff doesn't pick up enum-value additions automatically. Plan to write those migrations by hand.

### Reversible vs one-way

| Migration | Reversibility |
|---|---|
| Vercel → Workers (keeping Next + Supabase via Hyperdrive) | **Fully reversible.** Change deploy target. |
| Next.js → Astro | **Hard to reverse.** Different component model, file conventions, hydration story. Treat as a one-way port. |
| Supabase Postgres → D1 | **Reversible while you keep both running.** Once you delete Supabase and start writing only to D1 for >1 day, the prod data divergence makes rollback ugly. Plan a clean cutover window. |
| Supabase Auth (if you used any) → roll-your-own OTP | **Reversible.** Auth state is small. |
| BetterAuth → roll-your-own OTP | **Reversible.** Sessions table schema is similar. |
| MailChannels → Resend | **Trivially reversible.** Same API shape. |
| Pages → Workers Static Assets | **Easy.** Cloudflare provides migration script. |
| R2 anywhere → R2 anywhere | **Already done.** No change. |

### Sensible migration order (the *order*, not the plan)
1. Stand up Astro 6 skeleton on Workers Static Assets — empty homepage, deploy.
2. Port marketing pages (low-risk, mostly static MDX/markdown).
3. Build the roll-your-own auth in parallel against D1.
4. Port admin one screen at a time, gated behind feature flag.
5. Run dual-write to Supabase + D1 for a week, then cutover reads.
6. Decommission Supabase.
7. Promote sync Workers to Queues/Workflows if reliability needs it.

Steps 1–4 are all reversible without data loss. Step 5 is the one-way gate.

---

## Sources

- [Workers Static Assets docs](https://developers.cloudflare.com/workers/static-assets/)
- [Migrate from Pages to Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)
- [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) · [D1 Release Notes](https://developers.cloudflare.com/d1/platform/release-notes/) · [D1 FAQ](https://developers.cloudflare.com/d1/reference/faq/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Storage options](https://developers.cloudflare.com/workers/platform/storage-options/)
- [SQLite in Durable Objects (blog)](https://blog.cloudflare.com/sqlite-in-durable-objects/)
- [KV Limits](https://developers.cloudflare.com/kv/platform/limits/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Hyperdrive pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/) · [Hyperdrive STABLE-function changelog (Feb 2026)](https://developers.cloudflare.com/changelog/post/2026-02-23-hyperdrive-stable-functions-uncacheable/)
- [Queues changelog](https://developers.cloudflare.com/queues/platform/changelog/)
- [Browser Run pricing](https://developers.cloudflare.com/browser-run/pricing/)
- [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Workers Images binding (blog)](https://blog.cloudflare.com/improve-your-media-pipelines-with-the-images-binding-for-cloudflare-workers/)
- [Astro on Workers docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)
- [Astro joins Cloudflare (Cloudflare blog)](https://blog.cloudflare.com/astro-joins-cloudflare/)
- [Astro joins Cloudflare (Astro blog)](https://astro.build/blog/joining-cloudflare/)
- [Cloudflare acquires Astro (press release)](https://www.cloudflare.com/press/press-releases/2026/cloudflare-acquires-astro-to-accelerate-the-future-of-high-performance-web-development/)
- [OpenNext Cloudflare adapter docs](https://opennext.js.org/cloudflare)
- [Next.js on Workers docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [TanStack Start on Workers docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)
- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [MailChannels EOL notice](https://support.mailchannels.com/hc/en-us/articles/26814255454093-End-of-Life-Notice-Cloudflare-Workers)
- [Drizzle ORM SQLite docs](https://orm.drizzle.team/docs/column-types/sqlite)
- [better-auth-cloudflare (zpg6)](https://github.com/zpg6/better-auth-cloudflare)
- [Better Auth 1.5 release notes](https://better-auth.com/blog/1-5)
- `cf agent-context workers | d1 | durable-objects` (local CLI, 2026-05-13)
