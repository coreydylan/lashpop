# Lashpop Admin Panel Audit

**Audit date:** 2026-05-26
**Scope:** All admin-shaped surfaces — `/admin/website/*` (10 sections), `/admin/dam-users`, `/dam`, `/dam/team` — plus a frontend pass cataloguing admin-controllable content that is currently hardcoded.
**Goal:** Inform a redesigned admin panel (with the DAM folded in) by establishing (Part 1) what the admin actually controls today, (Part 2) what it should control, and (Part 3+) cross-cutting patterns and recommendations.
**Source chunks:** `tmp/audit-chunks/01-hero-services-team.md`, `02-simple-cms.md`, `03-reviews-instagram-quiz.md`, `04-dam.md`, `05-frontend-gaps.md` — read those for the per-field detail tables.

---

## TL;DR

**The admin panel today is roughly 60% working, 25% partially wired, and 15% dead.** The dead and partial pieces are not random — they fall into a few clear patterns:

1. **"Admin field exists, frontend ignores it" is the dominant pattern.** Many fields the admin lets users save are never read by any public component. The clearest cases:
   - `/admin/website/founder-letter` is **100% dead** — the page tells the user *"edit the source component directly"* and has no API, no DB write, no action.
   - `/admin/website/seo` Services + Work-With-Us tabs are **entirely dead-write** — those pages have no `generateMetadata` consumer.
   - `/admin/website/services` Category Content editor (tagline/description/icon) **never reaches the homepage cards** — `ServicesSection` is rendered without the `categories` prop (`LandingPageV2Client.tsx:361`), so it uses a hardcoded `defaultServiceCategories` array.
   - 3 of 4 `/admin/website/instagram` settings (`autoScroll`, `scrollSpeed`, `showCaptions`) write to DB and are read by nothing. The 4th (`maxPosts`) is overridden by a hardcoded `getInstagramPosts(20)` in `page.tsx:34`.
   - SEO admin collects `phone`, `email`, social URLs — but `FooterV2`, `ReviewsSection`, `MapSection`, `InstagramCarousel`, `FAQSection` each hardcode their own copy of those values.

2. **Vagaro silently wins over admin edits** for team and services. On the team admin, `displayOrder`, `isActive`, `imageUrl`, `bio` are all "partial-live" — admin can save them, but the next Vagaro sync (3×/day) overwrites them. There's no warning UI.

3. **The admin has no auth.** Only `/admin/dam-users` is gated. `/admin/website/*` is hidden-by-obscurity — anyone who knows the URL gets in. DAM API write routes (`/api/dam/upload`, `/bulk-tag`, `/delete`) **don't re-check auth either** and rely on the layout gate.

4. **There's no audit log for any website admin action.** `dam_user_actions` exists for the DAM, but every other change (hero swap, team reorder, review pin, FAQ edit) is unrecorded.

5. **The site's identity is hardcoded in 10+ files.** Studio name, address, phone, email, hours, social URLs, Vagaro booking URL — duplicated across `FooterV2.tsx`, `MapSection.tsx`, `ReviewsSection.tsx`, `InstagramCarousel.tsx`, `FAQSection.tsx`, `ServiceDetailClient.tsx`, `BookingView.tsx`, `BookingModal.tsx`, `LocalBusinessSchema.tsx`, `llms.txt/route.ts`, `privacy/page.tsx`, plus the dead legacy components. Changing the phone number requires editing ~15 files.

6. **Three near-clone DAM pickers** (`MiniDamExplorer`, `ServiceHeroImagePicker`, plus the DAM's own `AssetGrid`) hit the same APIs. Two crop editors (`PhotoCropEditor` for team, `QuizPhotoCropEditor` for quiz) do similar things differently. Folding the DAM in is the moment to extract one shared `<DamAssetPicker>` and one `<DamCropEditor>`.

7. **Significant content surfaces have no admin path at all:**
   - Mobile welcome cards (5 rich-text cards of brand voice — 100% hardcoded JSX)
   - Hero headline + subhead pill ("lashes + beauty")
   - `/work-with-us` everything except the carousel — 13 employee perks, 22 booth perks, 4-tier booth pricing, 4-step "How to Join", 9 core values, all hardcoded
   - Navigation item list

8. **Folding the DAM is feasible but layout-coupled.** The DAM is a 2,451-line full-bleed page; the website admin has a 288px sidebar shell. Either special-case the DAM section to override the layout, or keep `/dam` as its own route and unify via shared nav. The second is lower-effort.

The rest of this doc walks each finding and suggests a target shape.

---

## Methodology

Four parallel agents reverse-mapped admin → frontend for grouped sections. A fifth pass walked the public render tree (`src/app/page.tsx`, `src/app/services/[slug]/page.tsx`, `src/app/work-with-us/page.tsx`) looking for admin-controllable content that is currently hardcoded, plus admin orphans (writes nothing reads).

**Status badges used in field tables (Part 1):**

| Badge | Meaning |
|---|---|
| `live` | Admin write reaches frontend reader |
| `partial` | Wired but limited (e.g. defaulted on save with no UI, or fallback-only) |
| `vagaro-overwritten` | Admin can save but next Vagaro sync clobbers it |
| `dead-write` | Admin saves; nothing ever reads it |
| `dead-read` | Frontend reads; admin can't write it (or DB never gets it) |
| `dead column` | Schema column with no writer and no reader |

---

## Part 1 — Reverse Map: What the admin controls today

Full per-field tables in the chunk files. Below is a section summary with key wiring and known issues. Files cited via `path:line`.

### `/admin/website/hero` — Hero arch / slideshow

**Files:** admin at `src/app/admin/website/hero/page.tsx`; APIs at `src/app/api/admin/website/{hero-archway,hero-slideshow-presets,hero-slideshow-assignments}/route.ts`; reader action at `src/actions/hero-slideshow.ts`; consumers `HeroSection.tsx`, `MobileHeroBackground.tsx`, `slideshow/HeroArchSlideshow.tsx`.

**Storage:** Three `website_settings` rows distinguished by `section`: `hero_archway`, `hero_slideshow_presets`, `hero_slideshow_assignments`. All JSON-blob shape.

**Working:** single-image picks (desktop + mobile), preset CRUD (images, transitions, timing, navigation), per-device assignment, "mobile same as desktop" toggle.

**Gaps:**
- **Authoring gap on Ken Burns:** `globalKenBurns` (and per-image `kenBurns`) flow through the API into the runtime slideshow, but there's no admin UI control. Editor would need to hand-edit JSON via API.
- **Several navigation/timing knobs are write-only-via-API:** `dragEnabled`, `scrollSensitivity`, `snapBehavior`, `indicatorPosition`, `indicatorStyle`, `pauseOnInteraction`, `resumeDelay`, `startDelay`. Defaults assigned on save; admin can't override.
- **Default-fallback drift risk:** defaults live in both `@/types/hero-slideshow` and inlined in `actions/hero-slideshow.ts:15-40`. If one changes, the other won't.
- **No FK from preset image to `assets`:** asset URL is snapshotted into the JSON blob. Asset rename/delete will produce a silent 404.
- **No preset-ID validation** in `hero-slideshow-assignments PUT`: a deleted preset id silently degrades to fallback.
- **Same hardcoded ultimate fallback** (`/lashpop-images/studio/studio-photos-by-salome.jpg`) appears in 7+ files.

### `/admin/website/services` — Services catalog

**Files:** admin at `src/app/admin/website/services/page.tsx` (1832 lines); **no REST routes** — all writes via server actions in `src/actions/services.ts`. Consumers: `ServicesSection.tsx` (homepage cards), `service-browser/ServiceBrowserContext.tsx` (drawer), `services/[slug]/page.tsx` + `ServiceDetailClient.tsx` (detail).

**Tables:** `services`, `service_categories`, `service_subcategories`, `asset_services`.

**Working:** Vagaro sync writes service name/description/price/duration (Vagaro is the source of truth). DAM-backed key image at the service and subcategory level (with priority chain). Subcategory drag-reorder. Asset → service tagging via `asset_services`. Per-service "Reset to Vagaro" button.

**Critical anomaly:**
> **The homepage `ServicesSection` doesn't receive DB-backed categories.** `LandingPageV2Client.tsx:361` renders `<ServicesSection isMobile={isMobile} />` with no `categories` prop, so the component falls back to the hardcoded `defaultServiceCategories` array (lines 22–87 of `ServicesSection.tsx`). **Every homepage category card (title, tagline, description, icon path) is hardcoded source code.** The admin Category Content editor only affects the drawer (description) and the subcategory image-fallback chain.

**Image priority is inverted:** admin badge says "DAM Override" but `actions/services.ts:118-122` puts `vagaroImageUrl` *first* in COALESCE. So a "DAM Override" is only honored when Vagaro has no photo. Likely surfaced as a bug by the recent `4213fc1` commit that started syncing service photos.

**Dead writes:** `services.useDemoPhotos` (Vagaro-routed all the way through to the type interface but never branched on), `service_categories.tagline` (saved by admin, not selected by `actions/categories.ts:7`).

**Dead columns:** `services.subCategory`, `services.displayTitle`, `services.vagaroWidgetUrl` (deprecated). `services.color` is declared in interface, never rendered.

**Missing admin paths:** no way to edit `services.name`, `description`, `subtitle`, `priceStarting`, `durationMinutes`, `displayOrder`, `isActive`, or `vagaroServiceCode` (admin only shows it as a badge). The hardcoded `allowedCategorySlugs` whitelist in `page.tsx:103` filters categories before the client sees them — adding a new category in the DB won't surface.

### `/admin/website/team` — Team members

**Files:** admin at `src/app/admin/website/team/page.tsx` (2200+ lines); APIs at `team/route.ts`, `team/quick-facts/route.ts`, `team/[id]/highlights/route.ts`; readers `actions/team.ts`. Consumers: `EnhancedTeamSectionClient.tsx`, `TeamPortfolioView.tsx`, `EnhancedTeamSectionServer.tsx`.

**Tables:** `team_members`, `team_member_photos`, `team_member_categories` (junction), `team_quick_facts`, `team_member_highlights`, `team_member_services` (junction).

**Working:** quick-facts CRUD (live), credentials editor (jsonb on `team_members.credentials`, rendered in modal + JSON-LD), manual service-category chips (`manualServiceCategories` merged with Vagaro-derived tags, dedup'd, sliced to 4), portfolio album add/remove (bifurcated storage — see below).

**Vagaro-overwritten (admin edit is best-case temporary):**
- `displayOrder` — drag-to-reorder is overwritten on next public-staff sync (`workers/vagaro-sync/src/sync.ts:259`)
- `isActive` — sync re-activates anyone present in Vagaro's response
- `imageUrl` — `page.tsx:71` falls back via `vagaroPhotoUrl || imageUrl`, so DAM picks only render when Vagaro has no photo
- `bio` — same `vagaroBio || bio` chain
- `name`, `phone`, `email` — written by sync, no admin edit

**Dead writes:**
- `team_members.funFact` — PATCH route accepts it, no UI ever sends it (the QuickFactsEditor uses a separate endpoint). Frontend reads it as a fallback when no quick facts exist — only triggers from older data.
- `team_member_highlights` — **whole pipeline runs in the closet.** Admin API exists (`PUT /api/admin/team/[id]/highlights`), the editor worker rebuilds rows weekly, admin can pin via `__ADMIN_PINNED__` marker. **No public page reads `team_member_highlights`.** And the admin UI page doesn't exist either — only the API endpoint.

**No admin editor for** `role`, `businessName`, `quote`, `instagram`, `instagramUrl`, `bookingUrl`, `type`, `specialties` (all visibly rendered).

**Dead columns:**
- `team_members.showOnWebsite` (schema comment says "Legacy column - preserved for data")
- `team_members.usesLashpopBooking`
- `team_member_categories` and `team_member_services` — zombie tables with zero writers/readers
- `favoriteServices`, `availability` — declared on TS interfaces, never rendered in v2 layout

**Storage bifurcation:** team portfolio photos can live in `team_member_photos` (direct DB row) OR as DAM `assets` tagged with `teamMemberId`. The GET endpoint merges both with a `source` discriminator — risk of orphans if the discriminator is wrong, and the user has no signal which storage path their upload took.

### `/admin/website/faq` — FAQ accordion

**Files:** admin at `faq/page.tsx`; API `faqs/route.ts`; reader `actions/faqs.ts`. Consumers: `FAQSection.tsx`, `FAQSchema.tsx`, `llms.txt/route.ts`, footer deeplink.

**Working:** category + item CRUD, featured ("Top FAQs") toggle, active toggle, rich-text answers via `MiniRichEditor` rendered via `dangerouslySetInnerHTML`.

**Likely bug:** `POST /api/admin/website/faqs:49` reads `data.name.toLowerCase()` but the admin's `createCategory` only sends `displayName` and `description`. `.toLowerCase()` on `undefined` will throw. Either the route has never been exercised since a refactor or it's been silently failing. The `faq_categories.name` column is `notNull().unique()` — schema enforces what the admin doesn't send.

**Dead-read:** `faq_categories.description` — admin collects it, API stores it, no frontend renders it.

**Dead UI:** `Reorder` and `GripVertical` are imported in `faq/page.tsx:4,19` but the drag-to-reorder UI is never rendered. `displayOrder` is set only at creation. Same pattern for `/admin/website/work-with-us` (carousel).

**Footer deeplink contract is fragile:** `FooterV2.tsx:301` `?openFaq=cancellation-policy` is resolved by slugifying `faq.question`. Renaming the question silently breaks the link — no admin warning.

**Hardcoded contact info in `FAQSection.tsx:351,360,369`:** `tel:`, `sms:`, `mailto:` links duplicate values the SEO admin already stores.

**Two parallel read paths:** `actions/faqs.ts` for `page.tsx`, but `FAQSchema.tsx` and `llms.txt/route.ts` query `faq_items` directly. Soft-delete or active-filter changes won't propagate.

### `/admin/website/founder-letter` — **Dead admin (no API)**

**Files:** admin at `founder-letter/page.tsx` (156-line client stub); **no API, no server action, no DB row.**

**The admin page is purely informational** — preview tab + "source" pseudo-code tab. Footer note literally reads: *"The Founder Letter is currently static HTML. To make it editable, we can create a CMS entry or database table for this content. For now, edit the source component directly."*

**Compounding problem:** the admin preview shows a centered 👩-emoji card with one paragraph about "founded LashPop in Oceanside." The live `FounderLetterSection.tsx` renders a full-bleed background, three paragraphs about the 2016 launch, an Emily signature image. **The admin preview misleads the editor about what's actually on the site.**

`LandingPageV2Client.tsx:173` declares a `founderLetterContent` prop slot but `src/app/page.tsx` never passes it — so `FounderLetterSection` always uses its hardcoded `defaultContent` (lines 18-27).

**All copy in `FounderLetterSection.tsx` is hardcoded and should be admin-controlled:** section H2 "Welcome to LashPop Studios", greeting "I'm so glad you're here.", three body paragraphs, sign-off "Xo,", signature "Emily", background image `/lashpop-images/founder-letter-bg.jpg` (and mobile variant), Emily signature image.

### `/admin/website/seo` — SEO metadata

**Files:** admin at `seo/page.tsx` (1198 lines, 4 tabs: Site / Homepage / Services / Work With Us); API `seo/route.ts`; reader `actions/seo.ts`. Consumers: `app/layout.tsx` (root `generateMetadata`), `WebSiteSchema`, `LocalBusinessSchema`, `ServicesSchema`, `ReviewSchema`, `FAQSchema`, `robots.ts`, `sitemap.ts`, `llms.txt/route.ts`.

**Storage:** single `website_settings` row with `section='seo_metadata'`, full `SEOSettings` JSON blob.

**Working:** Site tab (business name/type/description, site URL, name, phone, email, social profiles, credentials, default OG/Twitter images, llmsTxtIntro) all flow through `layout.tsx` and SEO schemas. Homepage tab (title, meta description, OG image, Twitter image, canonical, robots) flows through root `generateMetadata`.

**Three of four admin tabs are dead-write:**
- **Services tab** — `src/app/services/[slug]/page.tsx:11-25` is the only `generateMetadata` on that branch and it builds its own title from `services.name`. There's no `/services` index page.
- **Work With Us tab** — `src/app/work-with-us/page.tsx` has no `generateMetadata` export.
- The unused `getPageSEO('services'|'workWithUs')` action proves the wiring was *intended* but never finished.

**Logo upload is half-wired:** admin uploads a logo via DAM picker, but `layout.tsx`'s `generateMetadata` never emits a favicon, apple-touch-icon, or any `<link rel="icon">` from it. Only `LocalBusinessSchema` references it.

**`SEOImage.position.x/y` and `alt` are silently dropped:** admin's DAM picker sets `alt = asset.fileName` and `position = {x:50, y:50}` defaults. No consumer reads them. Admin doesn't let the editor change them either.

**`PageSEO.keywords?: string[]` typed but no UI;** `layout.tsx:78` hardcodes the keyword string.

**Sitemap is mostly hardcoded** and doesn't honor admin's `noIndex` flags.

### `/admin/website/work-with-us` — Carousel only

**Files:** admin at `work-with-us/page.tsx` (375 lines, **manages carousel photos only**); reader actions: `work-with-us-carousel.ts`. Form submission action `work-with-us.ts` is separate — POSTs to `https://mox-api.experialstudio.com` and emails `lashpopstudios@gmail.com`.

**Working:** carousel photo add (DAM picker), enable/disable toggle, delete.

**Dead UI:** `reorderCarouselPhotos` action exists, `GripVertical` imported, but **no drag-reorder UI is rendered**. Photos display in insertion order indefinitely.

**Everything else on `/work-with-us` is hardcoded source (~1200 lines):**
- Hero subhead "Find Your Place at LashPop"
- Three path cards (employee / booth / training) with title, description, image path
- `employeeBenefits` array — 13 perks (Flexible Scheduling, Competitive Pay, 30% Employee Discount, Complimentary Lashes, Unlimited Vacation, etc.)
- `boothBenefits` array — 22 perks (1 Month Free Rent, 1 Week Free Vacation, etc.)
- `getBoothPricing(days)` — pricing tiers: 5+d $55/$65, 4d $65/$75, 3d $70/$80, 1-2d $75/$85
- `specialties` form list (drifts from real services)
- 4-step "How to Join" flow
- Training "What You'll Learn" / "What You'll Get" lists
- "The LashPop Way" hero quote
- 9 Core Values cards
- "Client Experience" tagline

**Form submissions go to email, not DB.** Admin has no inbox. `form_responses` schema exists but is for Vagaro intake forms, **not** work-with-us submissions. Anyone hunting for past applications via that table will find nothing.

### `/admin/website/reviews` — Review moderation

**Files:** admin at `reviews/page.tsx` + drawer `ReviewEditDrawer.tsx`; APIs `reviews/route.ts`, `reviews/[id]/route.ts`, `reviews/[id]/rescore/route.ts`, `reviews/[id]/suggest-stylist/route.ts`. Consumers: `ReviewsSection.tsx` (homepage carousel), `LocalBusinessSchema.tsx` (JSON-LD aggregate), `ReviewSchema.tsx` (per-review JSON-LD).

**Multi-writer architecture:** admin (per-review override + lock), 6-hour fetcher worker (`workers/reviews/`), weekly LLM editor pass — all writing the same columns. The `admin_locked_fields` jsonb array on `reviews` is the **load-bearing contract** preventing write contention. Every Worker UPDATE has `AND NOT (admin_locked_fields ? 'col')` guards.

**Working:** pin/unpin to homepage (writes `homepage_reviews` rows + `reviews.homepage_dismissed`), drag-to-reorder pinned set, per-review quality score override (auto-locks on save), tagged-stylist override, visibility checkbox, editor notes, "Re-score with Claude" + "Suggest from text" mesh-claude calls, unlock-from-editor checkboxes.

**Admin/worker contention** is correctly managed via `LOCKABLE_COLUMNS = ['quality_score', 'team_member_id', 'show_on_website', 'editor_notes']`. **Risk:** if a new column becomes admin-editable, both `LOCKABLE_COLUMNS` in `[id]/route.ts:30` AND every Worker UPDATE must be updated, or admin edits will be silently overwritten on the next tick.

**Dead-write from admin perspective:** admin can't edit `reviewer_name`, `review_text`, `rating`, `review_date`, `subject` — those come from the fetcher. The Worker's auto-promote filter excludes anonymized names (`post-sync.ts:210-213`) but the rows stay in DB. No way for admin to override a typo'd reviewer name.

**Dead-read schema columns:** `reviews.response_text`, `reviews.response_date` (schema exists, no component renders); `reviews.raw_payload` (diagnostic-only); `reviews.quality_scored_at` (could power "stale score" UI, nothing reads); `reviews.include_in_schema` (admin can't toggle, worker never writes).

**Parallel dead implementation:** `src/lib/review-filters.ts` is a 293-line Next.js port of the Worker's `autoPromoteToHomepage` + `applyStaleTeamMemberFilter`. **No callers in `src/`.** Missing the diversity caps, recency window, recency-decay sort, anonymous-name exclusion, and admin-lock checks that the Worker has. If anyone ever wires it up, it'll silently produce a weaker filter result than the Worker.

**Frontend filter mismatch:** `getHomepageReviews()` reads `homepage_reviews` with no `is_pinned` filter and orders by `display_order`. The admin GET filters `WHERE is_pinned = true`. So the admin's "selected" list is a subset of what actually renders — there's no admin surface to see what the Worker auto-promoted.

### `/admin/website/review-settings` — Worker pipeline knobs

**Files:** admin at `review-settings/page.tsx`; API `review-settings/route.ts` (which proxies POST to `${REVIEWS_WORKER_URL}/run?editor=1`).

**Storage:** `website_settings` with `section='review_pipeline'`, jsonb config.

**Working:** all settings (`homepage_capacity`, `editor_pass_interval_days`, `auto_promote_min_quality_score`, `auto_promote_min_text_length`, `auto_promote_recency_months`, `diversity_cap_per_source`, `diversity_cap_per_stylist`, `highlights_per_stylist`, `editor_pass_enabled`, `recency_decay_days_per_point`) are read by the Worker via `loadReviewSettings()`. Manual "Trigger editor pass now" button proxies to the Worker.

**Important:** settings affect Worker writes only, never request-time reads. Reducing `homepage_capacity` from 9 to 6 doesn't take effect until the next Worker tick. Admin pins are immortal — they render even past capacity.

**Defaults duplicated in three places:** `workers/reviews/src/settings.ts:31`, `src/app/api/admin/website/review-settings/route.ts:25`, `src/lib/review-filters.ts:186` (the dead one). All currently agree; no shared constant.

**No "last editor run at" surface in admin.** Worker tracks `lastEditorAt` via DO storage and exposes it via `/state`, but the admin doesn't poll it. After triggering an editor pass, admin has no completion signal.

### `/admin/website/instagram` — **Mostly broken façade**

**Files:** admin at `instagram/page.tsx`; API `instagram/route.ts`. Two parallel syncers exist: `src/app/api/cron/instagram-sync/route.ts` (older Next.js cron) and `workers/instagram-sync/` (new Cloudflare Worker — untracked per git status).

**Storage:** `website_settings` with `section='instagram_carousel'`, jsonb `{maxPosts, autoScroll, scrollSpeed, showCaptions}`. IG posts land in `assets` (with `source='instagram'`, `external_id={shortcode}_{index}`) and are tagged `ig_carousel` + `instagram`.

**Frontend contract is the tag name:** `actions/instagram.ts:getInstagramPosts` filters `assets` JOIN `asset_tags` WHERE `tags.name = 'ig_carousel'`. Not filtered by `source` — anything tagged `ig_carousel` will render even if not from Instagram.

**Three of four admin settings are dead-writes:**
| Setting | Status | Why |
|---|---|---|
| `maxPosts` | dead-read | `page.tsx:34` hardcodes `getInstagramPosts(20)`, which overrides via `effectiveLimit = limit ?? settings.maxPosts` |
| `autoScroll` | dead-write | `InstagramCarousel.tsx:64` hardcodes `playOnInit: true` |
| `scrollSpeed` | dead-write | hardcodes `speed: 1.5` |
| `showCaptions` | dead-write | `InstagramCarousel.tsx` never renders `post.caption` |

**"Sync Posts" button is broken.** It calls `GET /api/dam/assets?tag=source:instagram`, but the DAM route ignores the `?tag=` parameter. The admin actually pulls **all DAM assets**, not just IG ones. There's no admin endpoint that re-triggers the IG sync — it only runs on the Worker's scheduled handler.

**Admin preview overlay expects `source_metadata.likeCount` and `commentCount`** but the Worker never writes those keys. Hover always shows 0.

**Silent fallback hides sync failures:** `InstagramCarousel.tsx:12-26` falls back to 13 hardcoded `/lashpop-images/gallery/*` paths if posts are empty. If IG sync breaks completely, the section keeps rendering — the failure mode is silent.

**No curation column.** Admin claims to manage "which posts show up" but has no per-post visibility toggle. Every `ig_carousel`-tagged asset renders. To hide a post, you'd have to remove the tag in the DAM (admin doesn't surface this).

### `/admin/website/quiz` — Find Your Look

**Files:** admin at `quiz/page.tsx` (two tabs: Comparison Photos, Result Pages); server actions in `actions/quiz-photos.ts`. Consumer: `find-your-look/FindYourLookModal.tsx` (+ `PhotoComparisonRound`, `ResultScreen`).

**Storage:** `quiz_photos` (id, asset_id, lash_style enum, crop_data jsonb `{x,y,scale}`, crop_url, is_enabled, sort_order); `quiz_result_settings` (lash_style unique, result_image_asset_id, crop_data, crop_url, display_name, description, best_for jsonb string[], recommended_service, booking_label).

**Working:** add/enable/disable/delete comparison photos per lash style; crop comparison photos (Sharp re-render to R2); pick + crop result images; edit display name, description, "Best For" bullets, recommended service, booking label. Frontend `buildResultDisplay` merges DB settings with hardcoded `LASH_STYLE_DETAILS` fallback.

**Anomalies:**
- **Auto-seed mutation runs on every admin GET.** `getAllResultSettings()` always calls `autoSeedMissingResultImages`, which writes DB rows at read time. Side effect: an admin "remove result image" can be silently undone on the very next admin page open.
- **`LASH_STYLE_TO_TAG_NAME` maps `wetAngel → wet`** for DAM tag lookup. If the DAM has a `wetAngel` tag instead of `wet`, auto-seed silently fails for that style.
- **Hardcoded R2 fallback URLs probably 404.** `types.ts:130-135` builds `${R2_BASE}/uploads/quiz/result-${style}.jpg` — commit `9093e32` notes 3/4 of these have been 404 since the R2 migration. DB image wins now, but the fallback is broken if DB image unset AND auto-seed finds no DAM asset.
- **Frontend hardcoded defaults mask DB problems.** Empty `displayName` or empty `bestFor[]` silently renders the hardcoded default — admin has no signal that the save "didn't take."
- **No quiz-photo sort_order UI.** Server action exists, unwired. Photos appear in insert order.
- **No quiz-answer analytics.** The quiz doesn't persist anything — admin has no funnel data.

### `/admin/dam-users` — Phone allowlist (mis-named)

**Files:** admin at `dam-users/page.tsx` (186 lines); API `admin/dam-users/route.ts` (GET, POST).

**Working:** lists `user` rows with `phoneNumber`, `email`, `name`, `damAccess`, `createdAt`; one toggle per row that flips `user.damAccess`.

**Anomalies:**
- **The flag is mis-named.** It gates `/dam`, `/dam/team`, AND `/api/admin/dam-users` itself — it's the studio admin allowlist, not a DAM-only flag.
- **No invite/create UI.** Users have to register themselves by attempting to log in to the DAM (triggers `/api/auth/phone/send-otp`).
- **No revoke-session side-effect.** Revoking `damAccess` doesn't delete the user's `session` row. A still-valid `auth_token` cookie keeps working for any non-DAM endpoint until expiry.
- **Self-bootstrap impossible** — the first admin must be flipped in DB by hand (you need `damAccess=true` to call this admin).
- **No audit trail** — whoever flipped a user isn't recorded.

### `/dam` — Digital Asset Manager (2,451 lines)

**Files:** `src/app/dam/(protected)/page.tsx` (one giant client component); 28 API routes under `src/app/api/dam/`; 26 components under `src/app/dam/components/`. R2 via `aws4fetch` (5KB, not the AWS SDK). Sharp server-side for image optimization + team crops.

**Capabilities:** upload (multipart + presigned), tag CRUD with hierarchical categories, "Collections" (categories flagged `isCollection`), single-select team-member assignment per asset, asset → service tagging via `asset_services`, bulk operations (tag, untag, delete, assign team), filter (multi-tag with selectionMode), group-by (up to 2 stacked), grid view modes, lightbox (full-screen, swipeable), Omni command palette (Cmd-K), per-user UI state via `dam_user_settings`, audit log via `dam_user_actions`, onboarding tutorial.

**Security gap:** **DAM API write routes (`/api/dam/upload`, `/bulk-tag`, `/delete`, `/tags`, `/tag`, `/assign-team`, `/remove-team`, etc.) don't re-check auth.** They rely on the layout gate at `dam/(protected)/layout.tsx`. Anyone with a valid phone-OTP session — even without `damAccess` — can call them directly via curl.

**Dead branches:**
- **`sets` / `set_photos` schema + `SetSelector` component** are commented out in `page.tsx.backup`; the live page doesn't mount `SetSelector`. The schema and CRUD endpoints exist for before/during/after groupings that were never built.
- **`/api/dam/auth/login` password route** (against `DAM_PASSWORD` env var) is legacy from the pre-OTP era — login UI uses BetterAuth phone OTP. Should be deleted.
- **`team/upload/route.ts`** (multipart, no Sharp) is dead — the live UI uses presigned upload.

**Magic tag names** (the contract with the marketing site):
| Tag/category | Consumer | Purpose |
|---|---|---|
| `ig_carousel` | `actions/instagram.ts` | Homepage IG carousel |
| `website` + `grid-scroller` | `api/dam/grid-scroller` | Hero grid scroller |
| `key-image` | `api/dam/grid-scroller` | Marks the hero image inside the grid scroller |
| `quiz_result` | `actions/quiz-photos.ts` | Pool for "Find Your Look" quiz |
| `classic`, `volume`, `wet-angel`, etc. | `actions/dam.ts`, `quiz-photos.ts` | Per-result-style imagery |

Renaming any of these in the DAM silently breaks the homepage. There's no "system tag" flag preventing rename.

**Heavy:** 30 useState, 60+ useCallback, 92 hooks in the top-level page. No external state manager. TanStack React Query for hydration; local mirror state for selection/filter. No virtualization in the grid (`@tanstack/react-virtual` is in `package.json` but unused) — will get slow with large libraries.

### `/dam/team` — Per-member photo + crop manager

**Files:** page at `src/app/dam/(protected)/team/page.tsx`; component `PhotoCropEditor.tsx`; server action `actions/team-photos.ts` (Sharp pipeline). APIs: `team-members/route.ts`, `team-members/photos/route.ts`, `team/[memberId]/photos/route.ts`, `team/photos/[photoId]/{route.ts, set-primary, crops}`.

**Crop set:** five named crops over one source image — `fullVertical` (3:4), `fullHorizontal` (16:9), `square` (1:1), `mediumCircle` (1:1), `closeUpCircle` (1:1). Each stores `{x: 0-100, y: 0-100, scale: 0.7-2.4}` jsonb plus a pre-rendered jpg URL written to R2 at `team-crops/{memberId}/...`.

**Cross-surface side-effect:** setting "primary" on a photo silently rewrites `team_members.imageUrl` to that photo's `filePath`. **Three writers to that column** (DAM team page, website team admin, Vagaro sync) with no audit log between them.

**Storage bifurcation** (mirrors the team admin's portfolio issue): `team_member_photos` rows AND DAM `assets` with `teamMemberId` can both hold "photos of this member." `team/[memberId]/photos` GET merges and de-dupes by `filePath`. Album version (with crops) and DAM version (without crops) can both exist for the same image — never reconciled.

**Two crop-write paths:** server action `saveTeamPhotoCrops` (Sharp re-render path used by live UI) vs `POST /api/dam/team/photos/[photoId]/crops` (jsonb-only, no Sharp regen). The route is effectively dead.

---

## Part 2 — Frontend Gap Inventory: What admin should control

### The single largest gap: "Studio Info" lives in 10+ files

Studio identity (name, address, phone, email, social URLs, Vagaro booking URL, hours, coordinates) is hardcoded in every component that needs it. Changing the studio phone number requires editing **at least 15 files**.

**Contact info duplicates:**
| Value | Locations |
|---|---|
| Phone `(760) 212-0448` | `FooterV2.tsx:221,227`, `MapSection.tsx:261`, `MapSection.tsx (dead)`, `Footer.tsx (dead)`, `ContactSection.tsx (dead)`, `privacy/page.tsx:154`, `teamComplete.ts (dead) ×8` |
| Email `lashpopstudios@gmail.com` | `FooterV2.tsx:239,245`, `FAQSection.tsx:369`, `actions/work-with-us.ts:28`, `Footer.tsx (dead)`, `ContactSection.tsx (dead)`, `MapSection.tsx (dead)` |
| Address `429 S Coast Hwy` | `FooterV2.tsx:218`, `MapSection.tsx:261`, `Footer.tsx (dead)`, `ContactSection.tsx (dead)`, `LocalBusinessSchema.tsx:291`, `llms.txt/route.ts:54` |
| Coordinates `[-117.3795, 33.1959]` | `MapSection.tsx:6` |
| Hours `8a-7:30p every day` | `FooterV2.tsx:251-252` |

**Social URL duplicates:**
| Platform | Locations |
|---|---|
| Instagram | `FooterV2.tsx:99`, `InstagramCarousel.tsx:154` |
| Facebook | `FooterV2.tsx:110` |
| TikTok | `FooterV2.tsx:121` |
| Yelp | `FooterV2.tsx:132`, `ReviewsSection.tsx:76` |
| Google Maps | `FooterV2.tsx:143,209`, `ReviewsSection.tsx:77`, `MapSection.tsx:9` |
| Vagaro | `FooterV2.tsx:157`, `ReviewsSection.tsx:78`, `ServiceDetailClient.tsx:35`, `BookingView.tsx:119`, `BookingModal.tsx:180` (bug: `/lashpop` not `/lashpop32`), `teamComplete.ts (dead) ×8`, `lib/vagaro-sync.ts:226` |

**The orphan admin already exists:** `/admin/website/seo` has the placeholders below as form fields:
```
504:  placeholder="lashpopstudios@gmail.com"
531:  placeholder="https://instagram.com/lashpopstudios"
556:  placeholder="https://tiktok.com/@lashpopstudios"
567:  placeholder="https://yelp.com/biz/lashpop-studios"
```

The admin **already collects these values** (stored in the seo JSON blob, surfaced via `LocalBusinessSchema`, `llms.txt`, etc.). The public-facing components **ignore those settings and hardcode their own copies.** This is the canonical "admin field exists, frontend doesn't read it" case at the system level.

**Recommended:** add a single `studio` settings block (in `website_settings` or as a top-level `site` table) holding name, address, phone, email, hours, coordinates, social URLs, Vagaro booking URL, newsletter recipient. Thread it through `src/app/page.tsx`'s server fetch into each consuming section. One refactor PR eliminates ~30 hardcoded constants and one cross-section drift category.

### Section-by-section frontend gaps

| Section | What the admin can edit | What should also be editable |
|---|---|---|
| **Navigation** | nothing | nav item list (label, anchor, order). Low priority (rarely changes) but the existing `#gallery` anchor doesn't even map to a section. |
| **Mobile welcome cards** | nothing | All 5 rich-text cards (brand voice, ~half the above-fold mobile content). Hard because the formatting is structural JSX, not just paragraphs — needs a constrained rich-text editor OR a markdown + named-spans convention. |
| **Hero** | slideshow images, single fallback image | headline ("lashes + beauty"), subhead pill copy, default ultimate-fallback image |
| **Founder letter** | nothing | All copy (greeting, 3 paragraphs, sign-off, signature), section H2, background images (desktop + mobile), signature image. Wire the typed `FounderLetterContent` interface to a `website_settings` row. |
| **Services** | per-service Vagaro override (DAM picker), subcategory reorder, category content (tagline/description/icon — dead-read for tagline) | **Wire `<ServicesSection categories={...}/>` through `LandingPageV2Client`** so the admin Category Content editor actually reaches the homepage cards (currently it doesn't). Also: which categories appear on the homepage (currently `allowedCategorySlugs` hardcoded in `page.tsx:103`); per-service Vagaro deep-link UI (the code already constructs `?sId=…` if `vagaroServiceId` is set, but verify admin lets staff set it); category icons should be DAM-managed instead of `/lashpop-images/services/thin/*.svg`. |
| **Reviews** | pin/unpin, reorder, per-review override (quality_score, stylist, visibility, editor notes) | An "admin override the reviewer name" path (typo fixes); a "preview what the next editor pass will do" UI; "last editor run at" timestamp surface. |
| **Instagram** | 4 settings (3 of 4 dead), broken "Sync Posts" button | Actual per-post visibility toggle (curation); manual sync trigger that works; expose the existing settings to real consumers (or remove them from the admin form). |
| **Map** | nothing | Coordinates, marker copy, storefront image (should be DAM-managed). Color theming probably stays in design tokens. |
| **Footer** | nothing | Tagline, brand name, social URLs (read from `studio` settings), newsletter copy, bottom-link list. |
| **`/work-with-us`** | carousel images only | Everything else on the page (~1200 lines hardcoded): hero copy, the 3 path cards, `employeeBenefits` (13 perks), `boothBenefits` (22 perks), `getBoothPricing` table, specialties list, How to Join steps, Training curriculum, Core Values cards, Client Experience copy. |
| **`/services/[slug]`** | service hero image, gallery (via `asset_services`), category, displayOrder | A way to set `vagaroServiceId` for per-service deep links (verify); content overrides for any non-Vagaro fields if the studio wants. |
| **`/privacy`, `/terms`** | nothing | Legal pages should interpolate contact info from `studio` settings rather than hardcoding. |
| **SEO schemas + llms.txt** | site-level metadata via SEO admin | Already wired for site-level; **`LocalBusinessSchema.tsx:291` and `llms.txt/route.ts:54` hardcode the address** instead of using the SEO admin's value — orphan-admin pattern. |

### Forms — missing inbox

| Form | Where it sends | Admin visibility |
|---|---|---|
| Newsletter (FooterV2) | `actions/newsletter.ts` (destination TBD) | None |
| Work-with-us application | `actions/work-with-us.ts` → `mox-api.experialstudio.com` + email | None — Emily's inbox only |
| Find Your Look quiz | Doesn't persist anywhere | None |
| Friend booking (`/confirm/[token]`) | `/api/bookings/friend` — dormant; no UI caller | N/A |

Add an "Inbox" section: form submissions with status (new / read / archived). The `form_responses` schema exists but is currently used only for Vagaro intake forms — needs a separate table or a discriminator column.

### Capabilities entirely missing from admin

1. **Studio info** — single config block, would eliminate 30+ hardcoded constants across 15+ files (highest ROI).
2. **Homepage category curation** — which DB categories surface on `/` and in what order.
3. **Welcome cards CMS** — most-trafficked above-fold mobile content with zero admin path.
4. **Hero headline + subhead** — admin manages images only; copy is hardcoded.
5. **Form-response inbox** — newsletter, work-with-us, quiz.
6. **Audit log** — DAM has one; nothing else does.
7. **Preview/publishing workflow** — every save is instantly live (`dynamic = 'force-dynamic'`). For high-stakes copy, a draft → preview → publish flow.
8. **Per-service Vagaro deep link** — code supports it, admin verification needed.
9. **Booth rental pricing table** — currently a function literal.
10. **Career perks lists** — 13 + 22 = 35 hardcoded perk cards.
11. **Legal page contact interpolation** — privacy/terms should pull from settings.
12. **DAM tagging policies** — "every team-member photo must have a `crop` field," "renames blocked on system tags," etc.
13. **Vagaro mapping override UI** — `vagaro_sync_mappings` exists; no admin path to resolve stuck mappings.
14. **Team highlights consumer** — the `team_member_highlights` pipeline runs but no public page renders it (whole backend feature ships to no one).

---

## Part 3 — Cross-cutting Findings

### Pattern A: "Admin field exists, frontend ignores it"

The most pervasive failure mode. Concrete instances:

| Section | Field(s) | Frontend reader |
|---|---|---|
| seo | Services tab (all fields) | `services/[slug]/page.tsx` builds its own metadata |
| seo | Work-With-Us tab (all fields) | `work-with-us/page.tsx` has no `generateMetadata` at all |
| seo | logo upload | not used as favicon/apple-icon |
| seo | `SEOImage.position`, `alt` | never read |
| seo | `site.phone`, `site.email`, `site.socialProfiles.*` | duplicated as hardcoded constants in 8+ public components |
| services | category tagline | not selected by `actions/categories.ts:7` |
| services | category content (description, icon) | only reaches the drawer; homepage cards hardcoded |
| services | `useDemoPhotos` toggle | propagates through types, no component branches on it |
| services | category key image | written, never read |
| instagram | `autoScroll`, `scrollSpeed`, `showCaptions` | nothing reads |
| instagram | `maxPosts` | overridden by hardcoded `getInstagramPosts(20)` |
| team | `funFact` PATCH | no UI sends it |
| team | `team_member_highlights` | end-to-end pipeline; zero public consumers |
| faq | `faq_categories.description` | written, never rendered |
| review-settings | most settings affect Worker writes only, not request-time reads | (working as designed but admin has no read-time vs write-time signal) |
| work-with-us | reorder action | no UI calls it |
| faq | reorder UI | imports `Reorder`/`GripVertical`, never renders them |
| founder-letter | (the entire admin page) | no API exists |

A unified admin should make this class of bug **impossible to ship**. Two complementary defenses:
1. Every admin form field declares its consumer(s) at definition time. CI lints "if no consumer is declared, the form field can't render."
2. End-to-end smoke tests: change a field in admin, scrape the rendered public page, assert the value appears.

### Pattern B: Vagaro overwrite contention

Vagaro is the authoritative source for many `team_members.*` and `services.*` columns. The admin's edits are visible until the next sync, then silently overwritten. The current code uses `vagaroX || adminX` fallback chains — Vagaro wins.

| Column | Sync cadence | Admin can write | Outcome |
|---|---|---|---|
| `team_members.name`, `phone`, `email`, `vagaroPhotoUrl`, `vagaroBio` | every sync (3×/day) | partial | Vagaro fields always win |
| `team_members.displayOrder`, `isActive` | every public-staff sync | yes (admin reorder + visibility) | overwritten next run |
| `team_members.imageUrl`, `bio` | not directly overwritten | yes | Vagaro fallback chain hides admin's values |
| `services.name`, `description`, `durationMinutes`, `priceStarting` | every sync | no | always Vagaro |
| `services.vagaroImageUrl` | every sync | no | Vagaro priority #1 (so admin DAM pick can be invisible) |

**Recommendations:**
- Explicit "Vagaro overrides this" badge on admin fields, with link to the Vagaro dashboard if applicable.
- Either remove the admin edit paths for Vagaro-owned fields, OR add an "admin override wins" toggle that flips the fallback chain (mirrors the `reviews.admin_locked_fields` pattern from the most architecturally-honest section of the codebase).

### Pattern C: Hardcoded fallbacks mask sync failures

When data is missing, public components silently render hardcoded fallback content rather than show an empty state or signal a problem.

- **`InstagramCarousel`** falls back to 13 local `/lashpop-images/gallery/*` paths if no IG posts. IG sync could break for weeks and nothing surfaces.
- **`ServicesSection`** falls back to hardcoded `defaultServiceCategories` if no `categories` prop — currently always.
- **`FounderLetterSection`** falls back to hardcoded `defaultContent` (greeting + 3 paragraphs + sign-off). If admin ever wires this up and deletes the row, prod silently reverts to the source-code copy.
- **`FindYourLookModal` `buildResultDisplay`** falls back to `LASH_STYLE_DETAILS` for any missing `quiz_result_settings.*` field. Empty admin save = silent default render.
- **Hero** falls back to `/lashpop-images/studio/studio-photos-by-salome.jpg` in 7+ places.

**Recommendation:** keep fallbacks for resilience, but instrument them — log a warning, surface a "data missing" badge in admin, or count fallback-renders so it shows up in any observability.

### Pattern D: Audit log only exists for the DAM

`dam_user_actions` records upload, tag add/remove, delete, filter change, search, view change. Every other admin write (hero swap, team reorder, review pin, FAQ edit, founder-letter copy edit if wired, IG settings, service hero swap) is silent.

**Recommendation:** promote the DAM's audit writer to a shared `recordAdminAction({actor, action, target, before, after})` helper. The schema (`actionType text + actionData jsonb`) is already generic. All `/api/admin/website/*` writes should call it. This becomes the activity feed for the master admin dashboard.

### Pattern E: No auth on website admin

`middleware.ts` doesn't gate `/admin`. The `features.clerk` flag is off (Clerk only protects `/dashboard(.*)`). The website admin pages are reachable by anyone who knows the URL. Only `/admin/dam-users` is enforced (via its API, server-side).

Layered with the DAM auth gap (DAM API write routes don't re-check `damAccess`), the system today has two latent holes: (1) URL-guessing into `/admin/website/*`, (2) calling DAM write APIs with any valid phone session.

**Recommendation:** require `damAccess=true` for all `/admin/*` routes via shared middleware AND re-check at every API route boundary, not just the layout.

### Pattern F: Magic tag names as a fragile contract

The marketing site's contract with the DAM is a small set of hardcoded tag names: `ig_carousel`, `website`+`grid-scroller`, `key-image`, `quiz_result`, `classic`, `volume`, `wet-angel`, etc. Renaming any of these in the DAM silently breaks the homepage.

**Recommendations:**
- Add an `isSystem: true` flag on `tags` / `tag_categories`; the DAM UI either blocks rename or warns loudly.
- Or migrate consumers to reference tags by id, not name.
- Or move "what shows up where" decisions out of tag names and into explicit settings rows (less elegant but unambiguous).

### Pattern G: Parallel dead implementations

Code paths that exist twice, with one path dead:

| Live path | Dead twin |
|---|---|
| `workers/reviews/src/post-sync.ts` (`autoPromoteToHomepage`, `applyStaleTeamMemberFilter`) | `src/lib/review-filters.ts` (293 lines, missing diversity caps, recency window, anonymous-name exclusion, admin-lock checks). The Worker comment says "should stay in sync — when one changes, update the other." They don't. |
| `workers/instagram-sync/src/index.ts` (CF Worker, scheduled) | `src/app/api/cron/instagram-sync/route.ts` (Next.js cron, older). Both write to `assets` with `source='instagram'`. Need to confirm only one is scheduled in prod. |
| `actions/team-photos.ts` `saveTeamPhotoCrops` (Sharp pipeline) | `POST /api/dam/team/photos/[photoId]/crops` (jsonb-only) |
| `team/upload/route.ts` (multipart, no Sharp) | live UI uses presigned uploads |
| `api/dam/auth/login` password against env var | live UI uses phone OTP |
| `TeamCarouselServer.tsx` (server wrapper) | live page uses client `TeamCarousel.tsx` |
| `MiniDamExplorer`, `ServiceHeroImagePicker`, DAM's `AssetGrid` | three near-clones of the same picker |
| `PhotoCropEditor` (team, 5 crops), `QuizPhotoCropEditor` (quiz, 1 crop) | two crop editors that could share a base |

### Pattern H: Dead components and data files

Components and data files in the repo that are not in any render path. Cleanup candidates:

| Path | Status |
|---|---|
| `src/components/landing-v2/Footer.tsx` | dead — superseded by `landing-v2/sections/FooterV2.tsx` |
| `src/components/landing-v2/ContactSection.tsx` | dead — not imported |
| `src/components/landing-v2/AboutSection.tsx` | dead — only self-definition |
| `src/components/landing-v2/TestimonialsSection.tsx` | dead — only self-definition |
| `src/components/landing-v2/sections/WelcomeSection.tsx` | dead — not imported |
| `src/components/landing-v2/TeamSection.tsx` | dead — hardcoded `team` array, superseded by `EnhancedTeamSectionClient` |
| `src/components/sections/MapSection.tsx` | dead — older version |
| `src/data/team.ts`, `src/data/teamComplete.ts` | dead — legacy hardcoded rosters |
| `src/data/services.ts` | dead — legacy hardcoded service list |
| `src/data/gallery.ts` | dead (or marginal) — superseded by DAM `assets` |
| `src/lib/review-filters.ts` | dead — diverges from Worker (Pattern G) |
| `src/components/work-with-us/TeamCarouselServer.tsx` | dead — never imported |
| `src/app/admin/scrollytelling/page.tsx`, `theatre/page.tsx` | placeholder stubs |
| `src/app/preview/scrollytelling/[id]`, `preview/theatre` | placeholder stubs |
| `src/app/api/dam/auth/login/route.ts` | legacy password route |
| `src/app/dam/components/SetSelector.tsx` + `sets`/`set_photos` schema + sets routes | dead branch — never built |
| `src/app/api/dam/team/photos/[photoId]/crops/route.ts` | dead — server action used instead |
| `src/app/api/dam/team/upload/route.ts` | dead — presigned path used instead |
| `services.subCategory`, `services.displayTitle`, `services.vagaroWidgetUrl`, `services.color` (if confirmed unused) | dead schema columns |
| `team_members.usesLashpopBooking`, `team_members.showOnWebsite` | dead schema columns ("Legacy" per schema comment) |
| `team_member_categories`, `team_member_services` | zombie tables (no writers, no readers) |
| `reviews.response_text`, `response_date`, `raw_payload`, `quality_scored_at`, `include_in_schema` (admin-uneditable) | dead-read columns |
| `quiz_photos.sort_order` | writable but no admin UI |

Suggest a single cleanup PR per logical group (dead-components, dead-data, dead-routes, dead-schema). They mislead future searches and create drift risk.

### Pattern I: Storage bifurcation in team photos

"Photos of a team member" can live in `team_member_photos` (direct DB rows with crops) OR `assets` table with `teamMemberId` (DAM-tagged, no crops). The GET endpoint merges and de-dupes by `filePath`. The album version and the DAM-tagged version can both exist for the same image — never reconciled. The user has no signal which storage path their upload took.

**Recommendation:** pick one canonical storage (probably `team_member_photos` with a FK to `assets` if applicable), migrate the other, and remove the bifurcation.

---

## Part 4 — Folding the DAM into the Master Admin

### What "fold-in" actually means

The user's intent (per the conversation that triggered this audit): **stop having `/dam` as a separate destination**. Today users mentally context-switch between "the admin" (small CMS for the website) and "the DAM" (the big asset manager). They share a user base, an auth model (loosely), and a domain (the studio's content). Fold-in means one shell, one nav, one mental model — even if route trees stay slightly separate.

### Auth model (must unify first)

Today:
- **DAM**: layout-gated by `auth_token` cookie + `user.damAccess`. Latent hole: write APIs don't re-check.
- **Website admin**: **no gate**. URL-hidden only.
- **`/admin/dam-users`**: API-gated server-side (works), UI loads regardless of auth (cosmetic issue).

Plan:
1. Move the layout-gate code from `src/app/dam/(protected)/layout.tsx` into shared `src/lib/auth/admin-gate.ts`.
2. Wrap `/admin/website/*` in the same gate (either via a new `(protected)` route group or via middleware).
3. Re-check the gate in every `/api/admin/*` AND `/api/dam/*` write route (`checkAdminSession()` helper that returns the user or throws 401/403).
4. Rename `damAccess` → `adminAccess` in DB and code (or add a richer `roles: string[]` column). Today's single bit doesn't model "DAM artist vs. studio admin vs. owner."

### Layout coupling

| Surface | Layout shape |
|---|---|
| `/admin/website/*` | 288px (`lg:w-72`) left sidebar with section links; main content in `lg:pl-72`, `px-4..lg:px-8 py-6..lg:py-10` |
| `/dam` | No shell — page draws its own full-bleed header + sticky omnibar + grid |

The DAM is full-bleed by design (omnibar sticks to viewport top, grid uses `max-w-7xl`, lightbox portals to body). Embedding it inside the website-admin's `lg:pl-72` shell would break the sticky omnibar and starve the grid.

Two viable shapes:

**Option A: Full-bleed override for the DAM section**
- Route DAM under `/admin/library` (or `/admin/assets`) but layout-override to remove the sidebar.
- All routes feel like "one panel" even though one of them is full-bleed.
- Requires `app/admin/layout.tsx` to conditionally render shell or pass-through.

**Option B: Keep `/dam` as its own route + unified nav**
- Lower effort. The website admin's sidebar already has a "Back to DAM" link (per `src/app/admin/website/layout.tsx`) — extend that into a real top-level "Assets" link that points to `/dam`.
- DAM users perceive one panel because navigation is unified, even though the URL changes.
- Keeps the DAM's omnibar contract intact.

**Recommend Option B for the first pass**, then evaluate Option A if the cross-surface feel is still jarring. Option B is reversible; Option A is invasive.

### Component reuse

Three near-clone pickers and two crop editors today (Pattern G). Extract during fold-in:

| Shared component | Replaces |
|---|---|
| `<DamAssetPicker filter={...} mode="single|multi" onPick={...}/>` | `MiniDamExplorer`, `ServiceHeroImagePicker`, parts of `OmniCommandPalette`'s picker mode |
| `<DamCropEditor crops={CROP_SET_NAMED} aspect={...}/>` | `PhotoCropEditor` (team), `QuizPhotoCropEditor` (quiz) |
| `<DamGrid />` (read-only with filters) | Smaller embeddings of the asset grid in service hero pickers, etc. |

Live in `src/components/dam-shared/`. The DAM's main page consumes them too.

### Audit log integration

Promote `useDamActions.ts` → `recordAdminAction()` helper in `src/lib/admin/audit.ts`. Every `/api/admin/website/*` write calls it. New admin section: `/admin/system/audit-log` showing the unified feed.

### Recommended URL structure post-fold

```
/admin
├─ overview                       # NEW dashboard: recent activity, pending reviews, form inbox count
├─ content/
│   ├─ studio-info                # NEW (Section A in Part 2) — consolidates name/contact/social/hours
│   ├─ hero                       # existing — slideshow
│   ├─ welcome-cards              # NEW — mobile swipeable + desktop welcome copy
│   ├─ services                   # existing (fix the categories-prop wiring)
│   ├─ team                       # existing (keep Vagaro sync indicators visible)
│   ├─ founder-letter             # build it (currently 100% dead)
│   ├─ reviews                    # existing — moderation queue
│   ├─ review-settings            # existing — scoring/display knobs (rename: "Reviews Pipeline"?)
│   ├─ instagram                  # existing (fix the 3 dead settings + sync button)
│   ├─ faq                        # existing (fix the create-bug + wire reorder)
│   ├─ quiz                       # existing
│   ├─ work-with-us               # MAJOR EXPANSION (currently carousel-only)
│   ├─ seo                        # existing (wire Services + WWU tabs)
│   └─ footer                     # NEW (small — newsletter copy, bottom links)
├─ assets/                        # /dam folds in here (Option B = keep route at /dam, just rename nav)
│   ├─ library                    # current /dam
│   ├─ team-photos                # current /dam/team
│   ├─ tags                       # tag/category management surfaced from DAM's TagEditor
│   └─ collections                # already exists via CollectionManager
├─ inbox/                         # NEW
│   ├─ newsletter                 # subscribers
│   ├─ work-with-us               # applications
│   └─ quiz                       # if quiz starts persisting answers
└─ system/
    ├─ users                      # current /admin/dam-users (rename + invite UI + role tiers)
    ├─ audit-log                  # NEW — all admin actions
    └─ syncs                      # NEW — Vagaro / Instagram / Reviews worker status + manual triggers
```

---

## Part 5 — Prioritized Recommendations

Sized by ROI (visible-frontend-impact ÷ effort).

### Top quick wins (low effort, high value)

1. **Wire `<ServicesSection categories={...}/>`** — change `LandingPageV2Client.tsx:361` to pass the prop. Activates the entire dead Category Content editor. ~1 hour. Also requires fixing the missing `tagline` select in `actions/categories.ts:7`.
2. **Fix the FAQ create-category bug** at `route.ts:49` — route reads `data.name`, admin sends `data.displayName`. Either patch the route or fix the form. ~15 minutes.
3. **Make the Instagram admin honest** — either wire the dead settings, or remove them from the form. The "Sync Posts" button should either work or be removed. ~2 hours.
4. **Add `generateMetadata` to `work-with-us/page.tsx` and `services/[slug]/page.tsx`** that reads `getPageSEO()`. Activates two dead SEO admin tabs. ~1 hour each.
5. **Delete the dead components and routes** from Pattern H. ~half day. Reduces noise + drift risk substantially.
6. **Pin `react-virtual` into the DAM grid** — it's already in `package.json` but unused. With 1000+ assets the grid will hang. ~half day.

### High-ROI medium efforts

7. **`studio-info` settings block** + refactor 8+ consumers to read from it. Eliminates ~30 hardcoded constants, fixes the cross-section drift problem. Includes wiring `LocalBusinessSchema` and `llms.txt` to the SEO admin's existing values. ~1-2 days.
8. **Wire `/admin/website/founder-letter` to a `website_settings` row** + add greeting/paragraphs/signOff/signature/h2/images to the schema. ~1 day.
9. **Add `damAccess` check to all `/admin/*` routes** via middleware + `/api/dam/*` write routes via inline `checkAdminSession()`. Closes the auth holes. ~1 day.
10. **Promote `dam_user_actions` to a shared audit log** for all admin writes. ~1-2 days.
11. **Extract `<DamAssetPicker>` and `<DamCropEditor>`** shared components. Replaces three pickers + two croppers. ~2-3 days.
12. **Inbox section** for newsletter + work-with-us submissions (start with work-with-us — already POSTs to email; replace with DB write + inbox UI). ~2 days.
13. **`team_member_highlights` consumer** on the team modal — the whole backend pipeline is built; needs a UI consumer. Or rip it out. ~1-2 days either way.

### Bigger projects

14. **Master admin shell** with new URL structure (Part 4), unified nav, overview dashboard. Sets up everything below. ~1 week.
15. **`/work-with-us` full CMS** — 13 perks + 22 perks + 4-tier pricing + 4-step flow + 9 values + hero copy. Big surface; high editorial ROI for non-engineers. ~1 week.
16. **Welcome cards CMS** — mobile + desktop, with constrained rich-text editor. Hardest to design (semantic spans). ~1 week (mostly design).
17. **Vagaro-vs-admin override model** — borrow the `reviews.admin_locked_fields` pattern for team and services. Admin can opt to "lock" `bio`, `imageUrl`, `displayOrder`, `isActive` against Vagaro overwrites. ~3-5 days per surface.
18. **Storage bifurcation cleanup** for team photos — pick canonical store, migrate, remove the other path. ~3-5 days.
19. **DAM fold-in execution** — Option B (unified nav) first, then evaluate Option A (full-bleed override). ~1 week.
20. **Tag rename safety** — `isSystem` flag + DAM UI block. Or migrate consumers to tag IDs. ~3 days for the flag approach; ~1-2 weeks for the ID migration.

### Things to consider before starting

- **Preview/publish workflow** would be useful for high-stakes copy (founder letter, work-with-us perks, pricing) but is a substantial architecture decision. Consider whether `dynamic = 'force-dynamic'` should change to ISR + manual revalidate for content pages, with the admin operating on a "draft" version.
- **Per-user UI state** (DAM has it via `dam_user_settings`). Decide whether other admin sections should grow this.
- **Role tiers** (artist vs. admin vs. owner). Today `damAccess` is one bit. As capabilities grow, the bit will overload. Earlier rebase to a `roles: string[]` column is cheaper than later.
