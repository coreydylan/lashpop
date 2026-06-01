# Admin → Frontend Map: Reviews, Review-Settings, Instagram, Quiz

Scope: feed-driven and quiz admin sections. The reviews surface is the most
write-contested area in the whole admin app — admin edits, a Cloudflare
Durable Object editor pass, and a 6-hour cron fetcher all write the same
columns. The `admin_locked_fields` jsonb array on `reviews` is the load-bearing
contract that keeps admin overrides from being clobbered.

---

## `/admin/website/reviews`

**Files**
- Admin page: `src/app/admin/website/reviews/page.tsx:52-547`
- Drawer: `src/app/admin/website/reviews/ReviewEditDrawer.tsx:48-368`
- APIs (under `src/app/api/admin/website/reviews/`):
  - `route.ts` — `GET` (list + pinned selection), `PUT` (bulk reorder/add/remove pins)
  - `[id]/route.ts` — `PATCH` (per-review override + lock)
  - `[id]/rescore/route.ts` — `POST` (mesh-claude single re-score)
  - `[id]/suggest-stylist/route.ts` — `POST` (mesh-claude stylist suggestion, read-only)
- DB tables:
  - `reviews` (`id`, `source`, `source_url`, `reviewer_name`, `subject`, `team_member_id`, `review_text`, `rating`, `review_date`, `response_text`, `response_date`, `raw_payload`, `show_on_website`, `include_in_schema`, `homepage_dismissed`, `hidden_reason`, `quality_score`, `quality_scored_at`, `editor_notes`, `admin_locked_fields`, `created_at`, `updated_at`) — `src/db/schema/reviews.ts:5-51`
  - `homepage_reviews` (`id`, `review_id`, `display_order`, `is_pinned`, `created_at`) — `src/db/schema/website_settings.ts:25-40`
  - `team_member_highlights` (`team_member_id`, `review_id`, `rank`, `editor_notes`) — `src/db/schema/team_member_highlights.ts:11-25` (admin-pin marker: `editor_notes = '__ADMIN_PINNED__'`)
- Worker writers:
  - `workers/reviews/src/index.ts` — ReviewEditor DO entry point
  - `workers/reviews/src/editor-do.ts:105-242` — orchestrates fetch → upsert → stale filter → review_stats → editor pass → auto-promote, every 6h via DO alarm
  - `workers/reviews/src/post-sync.ts:99-138` — `applyStaleTeamMemberFilter` writes `show_on_website`, `hidden_reason`; respects `admin_locked_fields ? 'show_on_website'`
  - `workers/reviews/src/post-sync.ts:158-271` — `autoPromoteToHomepage` deletes all `homepage_reviews WHERE is_pinned=false` and re-inserts auto rows
  - `workers/reviews/src/editor.ts:70-124` — `scoreNewReviews` writes `quality_score`, `quality_scored_at`, `editor_notes`; respects `admin_locked_fields ? 'quality_score'`
  - `workers/reviews/src/editor.ts:128-182` — `recheckStaleStaff` writes `show_on_website`, `hidden_reason`; respects lock
  - `workers/reviews/src/editor.ts:185-283` — `rebuildHighlights` deletes non-`__ADMIN_PINNED__` rows in `team_member_highlights` and re-inserts LLM picks
  - `workers/reviews/src/fetchers/{google,vagaro,yelp}.ts` — `upsertReviews` writes review rows; `editor-do.ts:142` resolves `team_member_id` via `buildTeamMemberIndex` on insert
- Frontend consumers:
  - `src/components/landing-v2/sections/ReviewsSection.tsx:81` — reads `reviews[]` props; renders `reviewerName`, `reviewText`, `rating`, `reviewDate`, `source` (lines 332-345, 357, 318-326). Does NOT render `subject`, `qualityScore`, `editorNotes`, `hiddenReason`, or `teamMemberId`.
  - `src/actions/reviews.ts:29-65` — `getHomepageReviews()` reads `homepage_reviews` (ALL rows, not just pinned), then joins to `reviews` filtered by `show_on_website = true`, sorted by `homepage_reviews.display_order`. This is what flows into `<ReviewsSection reviews={reviews} />` from `src/app/page.tsx:32`.
  - `src/components/landing-v2/HeroSection.tsx:68` — reads `reviewStats[].reviewCount` to render the hero chip.
  - `src/components/seo/LocalBusinessSchema.tsx:211-215` — reads `reviewStats.{averageRating, count}` for JSON-LD `aggregateRating`.
  - `src/components/seo/ReviewSchema.tsx` — embedded on homepage via `src/app/page.tsx:119`; reads from `reviews` to emit per-review JSON-LD.
  - `src/lib/review-filters.ts` — parallel Next.js port of `autoPromoteToHomepage` + `applyStaleTeamMemberFilter`. Nothing in `src/` currently invokes either. Per the worker's `post-sync.ts:4-7` header, the two implementations "should stay in sync — when one changes, update the other." Currently the Worker is authoritative; the Next.js copy is dead but kept for parity.

**Fields**

| Admin field | Writes to | Other writer | Frontend reader | Status | Notes |
|---|---|---|---|---|---|
| "Selected / homepage" toggle | `homepage_reviews.{review_id, display_order, is_pinned=true}` (via `PUT /api/admin/website/reviews`) + `reviews.homepage_dismissed` true/false | Worker `autoPromoteToHomepage` writes `homepage_reviews WHERE is_pinned=false` only; never touches pinned rows | `getHomepageReviews()` → `ReviewsSection` carousel | live | Admin un-pin sets `homepage_dismissed=true` so cron auto-promote skips it permanently — this is the only "block re-add" signal |
| "Save Changes" reorder (Reorder.Group) | `homepage_reviews.display_order` (only `is_pinned=true` rows) | Worker assigns `display_order = maxPinnedOrder + i + 1` for auto picks (post-sync.ts:258) | `ReviewsSection` orders by display_order via the action's `orderMap` | live | Admin pins always render before auto picks because the Worker stacks auto picks after `maxPinnedOrder` |
| Drawer "Quality score (1-10)" | `reviews.quality_score`, `reviews.quality_scored_at`; adds `quality_score` to `admin_locked_fields` | Worker `scoreNewReviews` writes `quality_score` for any unlocked row; `rescore` endpoint also writes it | Not rendered in `ReviewsSection`; used by Worker `autoPromoteToHomepage` for sort + filter (`auto_promote_min_quality_score`) and recency-decay sort | live, contested | Admin lock is the only thing keeping Worker from overwriting on the next weekly pass. Drawer auto-locks on save (`PATCH` route line 56) |
| Drawer "Re-score with Claude" button | `reviews.quality_score`, `reviews.quality_scored_at`, `reviews.editor_notes` (via `POST /[id]/rescore`) | Same as above | Same as above | live | Returns 409 if `quality_score` is already admin-locked; admin must unlock first |
| Drawer "Tagged stylist" select | `reviews.team_member_id`; locks `team_member_id` | Worker `buildTeamMemberIndex.resolve(subject)` writes `team_member_id` only at insert time (editor-do.ts:141-143); Vagaro fetcher pre-populates from `serviceProviderName` | Not directly rendered in `ReviewsSection`. Used by Worker for `autoPromoteToHomepage` diversity cap and `team_member_highlights` rebuild | live, contested | Re-tagging an existing review is admin-only — Worker only resolves at first insert; the lock prevents future fetches from rewriting on `ON CONFLICT` (need to verify upsert behavior in db.ts) |
| Drawer "Suggest from text" button | nothing (read-only) | — | — | live | Returns suggestion JSON via `POST /[id]/suggest-stylist`; admin clicks "Apply" to set the select value, then "Save & lock" writes it |
| Drawer "Visibility" checkbox (`showOnWebsite`) | `reviews.show_on_website`; clears `hidden_reason` if set true; locks `show_on_website` | Worker `applyStaleTeamMemberFilter` writes false+`hidden_reason='stale_team_member'` for inactive-staff reviews; restores true+null when staff reactivates; LLM `recheckStaleStaff` does same; both respect lock | `getHomepageReviews()` filters `WHERE show_on_website = true`; `ReviewsSection` never sees hidden rows | live, contested | Lock is critical — without it, admin showing a "stale" review would be re-hidden every weekly editor pass |
| Drawer "Editor notes" textarea | `reviews.editor_notes`; locks `editor_notes` | Worker `scoreNewReviews` writes editor_notes (along with quality_score) | Not rendered on public site; admin-only field | live | Lock prevents the next LLM scoring pass from overwriting admin's note |
| Drawer "Unlock from editor" checkboxes | Removes column names from `reviews.admin_locked_fields` (no other field write) | — | — | live | Once unlocked, the next Worker tick can mutate that column freely |
| (Implicit) `reviewer_name`, `review_text`, `rating`, `review_date`, `subject` | Not editable in admin | Worker fetcher `upsertReviews` writes on every 6h tick from upstream payload | `ReviewsSection` renders `reviewerName`, `reviewText`, `rating`, `reviewDate` directly | dead-write (from admin perspective — admin can't edit them) | If a reviewer's display name comes through as "Verified" or has a typo, there is no admin override path. The Worker's auto-promote filter excludes anonymized names (`post-sync.ts:210-213`) but the row stays in DB |
| (Implicit) `response_text`, `response_date` | Not editable in admin | Worker fetcher may write (depends on fetcher) | Not read anywhere in `src/components` | dead-read | Schema has it; nothing emits it. Vagaro Merchant API exposes replies (per MEMORY); not surfaced |
| (Implicit) `include_in_schema` | Not editable in admin | Worker never writes it (defaults to true) | `ReviewSchema.tsx` should filter on it — needs verification | partial | Admin has no way to opt a single review out of JSON-LD while keeping it visible (or vice-versa) |
| (Implicit) `raw_payload` | — | Worker stores upstream JSON for debugging | Nothing reads it | dead-read | Diagnostic-only column |
| (Implicit) `quality_scored_at` | Auto-set when `quality_score` written | Worker sets on every score | Nothing reads it | dead-read | Could power "stale score" UI but nothing does |
| Manual "Trigger editor pass now" (button is on `/review-settings`, not `/reviews`) | Fires `POST /api/admin/website/review-settings` → forwards to `${REVIEWS_WORKER_URL}/run?editor=1` | — | Effect: scored + hide-rechecked + highlights rebuilt | live | Fire-and-forget; UI doesn't poll Worker state |

**Anomalies**

- **Admin/worker contention is the entire design.** The `admin_locked_fields` jsonb array is the only thing standing between an admin edit and a 6-hourly overwrite. Any column the admin can edit in the drawer also gets a lock entry (`/api/admin/website/reviews/[id]/route.ts:56-74`). The Worker SQL is paranoid — every UPDATE has `AND NOT (admin_locked_fields ? 'col')` clauses (`workers/reviews/src/editor.ts:117, 175`; `post-sync.ts:116, 130`). If a new column ever becomes admin-editable, both sides need updating.
- **Two parallel implementations of the same auto-promote logic.** `src/lib/review-filters.ts:74-293` is a Next.js port of the Worker's `post-sync.ts`. Nothing in the app calls it. The Worker is authoritative. Drift between the two is silently possible; the worker comment (`workers/reviews/src/post-sync.ts:4-7`) says "should stay in sync — when one changes, update the other," but `src/lib/review-filters.ts:autoPromoteToHomepage` is missing the diversity caps, recency window, recency-decay sort, anonymous-name exclusion, and admin lock checks that exist in the Worker version. Effectively dead code today.
- **Frontend filters by `homepage_reviews` rows, not by `is_pinned`.** `getHomepageReviews()` (`src/actions/reviews.ts:29-65`) reads `homepage_reviews` with no `is_pinned` filter and orders by `display_order`. That's the right behavior (both pinned + auto rows render), but it's *not* the same query the admin GET uses, which filters `WHERE is_pinned = true`. So the admin's "selected" list is always a subset of what actually shows on the homepage. There's no admin UI to see what the Worker auto-promoted this cycle.
- **The 9 default `homepage_capacity` is duplicated in three places.** Default lives in `workers/reviews/src/settings.ts:31`, `src/app/api/admin/website/review-settings/route.ts:25`, and `src/lib/review-filters.ts:186`. All three currently agree, but there's no shared constant.
- **`subject` field is admin-invisible but worker-load-bearing.** Vagaro's `serviceProviderName` lands in `reviews.subject`, and the team-member resolution at insert time uses it (`workers/reviews/src/db.ts` → `buildTeamMemberIndex`). The drawer shows it in the "suggest stylist" prompt but never lets the admin edit it.
- **`response_text` / `response_date` are completely unused on the read side.** Schema columns exist, fetchers may populate them, but no component renders them.

---

## `/admin/website/review-settings`

**Files**
- Admin: `src/app/admin/website/review-settings/page.tsx:122-297`
- API: `src/app/api/admin/website/review-settings/route.ts` (`GET`, `PUT`, `POST`)
  - `POST` proxies to `${process.env.REVIEWS_WORKER_URL}/run?editor=1` with `Authorization: Bearer ${REVIEWS_WORKER_TRIGGER_SECRET}` — fire-and-forget
- DB tables:
  - `website_settings` (`section='review_pipeline'`, `config` jsonb)
  - Config shape: `{ homepage_capacity, editor_pass_interval_days, auto_promote_min_quality_score, auto_promote_min_text_length, auto_promote_recency_months, diversity_cap_per_source, diversity_cap_per_stylist, highlights_per_stylist, editor_pass_enabled, recency_decay_days_per_point }`
- Worker readers:
  - `workers/reviews/src/settings.ts:43-62` — `loadReviewSettings()` reads `website_settings WHERE section='review_pipeline'`, merges with `DEFAULT_SETTINGS`
  - `workers/reviews/src/editor-do.ts:137` — calls `loadReviewSettings` once per pipeline run; falls back to `DEFAULT_SETTINGS` on error
  - `editor-do.ts:181-186` — uses `editor_pass_interval_days`, `editor_pass_enabled`
  - `editor-do.ts:189-191` — passes `highlights_per_stylist` into `runEditor`
  - `editor-do.ts:220` — passes the entire settings into `autoPromoteToHomepage`
  - `editor.ts:295-297` — uses `highlightsPerMember` to set `HIGHLIGHTS_PER_MEMBER`
  - `post-sync.ts:162` (`homepage_capacity`), `:189` (`auto_promote_min_text_length`), `:190` (`auto_promote_recency_months`), `:191` (`auto_promote_min_quality_score`), `:195` (`recency_decay_days_per_point`), `:236` (`diversity_cap_per_source`), `:238` (`diversity_cap_per_stylist`)
- Frontend consumers:
  - None directly. These settings only affect what the Worker writes into `homepage_reviews` and `reviews.{quality_score, show_on_website, hidden_reason, editor_notes}`. The user-facing carousel reads whatever the Worker left behind.

**Fields**

| Admin field | Writes to | Other writer | Frontend reader | Status | Notes |
|---|---|---|---|---|---|
| Homepage carousel size (`homepage_capacity`) | `website_settings.config.homepage_capacity` | — | Indirect: Worker uses it to cap `autoPromoteToHomepage` (`post-sync.ts:162-181`) | live | Default 9. Worker's `getHomepageReviews()` in `src/actions/reviews.ts` does NOT cap to this number — passes everything in `homepage_reviews` through. Cap is enforced at write time only |
| Min quality score (`auto_promote_min_quality_score`) | same | — | Indirect: filter in `post-sync.ts:209` `(quality_score IS NULL OR quality_score >= ${minScore})` | live | NULL-permissive so unscored reviews can still land |
| Min review text length (`auto_promote_min_text_length`) | same | — | Indirect: `post-sync.ts:207` | live | |
| Recency window months (`auto_promote_recency_months`) | same | — | Indirect: `post-sync.ts:208` | live | |
| Recency decay (`recency_decay_days_per_point`) | same | — | Indirect: `post-sync.ts:224-228` sort term `COALESCE(quality_score, 5) - days_old / decay` | live | Wired in recent commit `8ad09bb feat(reviews): bias auto-promote toward newer reviews via recency decay` |
| Max picks per source (`diversity_cap_per_source`) | same | — | Indirect: `post-sync.ts:236` | live | |
| Max picks per stylist (`diversity_cap_per_stylist`) | same | — | Indirect: `post-sync.ts:238` | live | |
| Highlights per stylist (`highlights_per_stylist`) | same | — | Indirect: `editor.ts:295-297` sets local `HIGHLIGHTS_PER_MEMBER`; affects `team_member_highlights` row count per member | live | Read by team profile pages via `team_member_highlights` (separate audit scope) |
| Editor pass interval days (`editor_pass_interval_days`) | same | — | Indirect: `editor-do.ts:181-184` gates editor run; default 7 | live | |
| Editor pass enabled (`editor_pass_enabled`) | same | — | Indirect: `editor-do.ts:185-186, 205-207` — if false, scoring + hide-recheck + highlight rebuild skip; auto-promote still runs | live | |
| "Trigger editor pass now" button | none (HTTP-only) | Proxies to Worker `/run?editor=1` | Indirect: Worker writes `quality_score`, `editor_notes`, `show_on_website`, `hidden_reason`, `team_member_highlights` | live | Returns immediately; no progress polling |

**Anomalies**

- **Settings affect Worker writes only.** The homepage carousel itself reads from `homepage_reviews` joined to `reviews` with `show_on_website = true` and orders by `display_order`. None of the `review_pipeline` settings are read at request time — they only shape what the cron writes.
- **`homepage_capacity` is a write-time cap, not a read-time cap.** If an admin reduces it from 9 to 6, the homepage keeps showing 9 until the next Worker tick re-runs `autoPromoteToHomepage` (which then DELETEs all `is_pinned=false` rows and refills to the new cap). Admin pins are immortal — if admin has pinned 12 reviews and capacity is 9, all 12 still render (per `post-sync.ts:173-181`).
- **Defaults duplicated in 3 places** (same as reviews section anomaly).
- **No "last editor run at" surface in this admin.** The Worker tracks `lastEditorAt` in DO storage (`editor-do.ts:182`) and exposes it via `/state`, but the admin doesn't poll it. So after clicking "Trigger editor pass now," there's no way for the admin to know when it finished short of refreshing the `/reviews` list and looking for changed `quality_score` chips.
- **`REVIEWS_WORKER_URL` and `REVIEWS_WORKER_TRIGGER_SECRET` are unchecked.** If either is missing in prod, the trigger silently 500s with a JSON error.

---

## `/admin/website/instagram`

**Files**
- Admin: `src/app/admin/website/instagram/page.tsx:18-318`
- API: `src/app/api/admin/website/instagram/route.ts` (`GET`, `PUT`)
- Worker writer: `workers/instagram-sync/src/index.ts:21-165` + `workers/instagram-sync/src/ig.ts` (untracked per git status)
  - Runs as a Cloudflare Worker `scheduled` handler; pulls `lashpopstudios` feed via IG web API using session cookie secrets, downloads to R2, inserts rows into `assets` with `source='instagram'`, tags with `ig_carousel` and `instagram` (collection) tags
- Legacy fetcher: `src/app/api/cron/instagram-sync/route.ts` — older Next.js cron route that does the same work. Both routes exist; the Worker is the canonical source going forward
- DB tables:
  - `assets` (full schema in `src/db/schema/assets.ts`): worker writes `file_name`, `file_path` (R2 URL), `file_type`, `mime_type`, `file_size`, `external_id` (`{shortcode}_{index}`), `source`, `source_metadata` (jsonb `{permalink, post_type, date_utc, image_index, imported_at}`), `caption`, `alt_text`, `width`, `height`. `ON CONFLICT (external_id) DO NOTHING`
  - `asset_tags` — worker writes `(asset_id, tag_id)` for the `ig_carousel` tag and `instagram` (collection) tag
  - `tags` / `tag_categories` — looked up but not written by the Instagram worker
  - `website_settings` (`section='instagram_carousel'`, `config` jsonb): `{ maxPosts, autoScroll, scrollSpeed, showCaptions, updatedAt }`
- Frontend consumers:
  - `src/actions/instagram.ts:43-91` — `getInstagramPosts()` reads `assets` joined to `asset_tags` filtered by `tags.name = 'ig_carousel'`, ordered by `assets.uploaded_at DESC`. Calls `getInstagramSettings()` (line 9-41) and uses `settings.maxPosts` if no explicit `limit` arg
  - `src/app/page.tsx:34` — calls `getInstagramPosts(20)` (hardcoded 20, which overrides the admin's `maxPosts`)
  - `src/components/landing-v2/sections/InstagramCarousel.tsx:39-236` — renders the carousel with embla + auto-scroll. Maps `posts[].mediaUrl`, `permalink` (from `sourceMetadata.permalink`), and... that's it

**Fields**

| Admin field | Writes to | Other writer | Frontend reader | Status | Notes |
|---|---|---|---|---|---|
| Display Settings → "Number of Posts" (`maxPosts`, 4-24) | `website_settings.config.maxPosts` (via `PUT /api/admin/website/instagram`) | — | `getInstagramSettings()` reads it (`src/actions/instagram.ts:30-33`), but `src/app/page.tsx:34` passes hardcoded `getInstagramPosts(20)`, which overrides via the `effectiveLimit = limit ?? settings.maxPosts` ternary | dead-read | The admin slider does nothing on the public homepage. To make it work, `page.tsx` would need to call `getInstagramPosts()` with no arg |
| Display Settings → "Scroll Speed" (`scrollSpeed`, 10-40s) | `website_settings.config.scrollSpeed` | — | Nothing. `InstagramCarousel.tsx:64-71` hardcodes `AutoScroll({ speed: 1.5, ... })` | dead-read | Setting exists in admin form + DB + API validator; zero consumers |
| Display Settings → "Auto-scroll" toggle | `website_settings.config.autoScroll` | — | Nothing. `InstagramCarousel.tsx:64` hardcodes `playOnInit: true` | dead-read | Same as above |
| Display Settings → "Show captions" toggle | `website_settings.config.showCaptions` | — | Nothing. `InstagramCarousel.tsx` never renders `post.caption` | dead-read | Captions ARE fetched from the worker and stored in `assets.caption`; just never rendered |
| "Sync Posts" button | Calls `fetchInstagramPosts()` which hits `GET /api/dam/assets?tag=source:instagram` | — | — | broken | The `?tag=` param is NOT processed by `src/app/api/dam/assets/route.ts` (only `teamMemberId` is). Admin actually pulls ALL DAM assets, not just IG ones. There is no admin trigger that actually re-syncs Instagram — the Worker runs on `scheduled` only |
| (Implicit) admin grid display | Reads (broken — see above) `/api/dam/assets`'s `asset.filePath`, `asset.caption`, `asset.sourceMetadata.{likeCount, commentCount, timestamp}` | Worker writes `assets.{file_path, caption, source_metadata}` (likeCount/commentCount fields are NOT in the worker's payload — see anomaly) | n/a (admin preview only) | partial | The admin preview grid renders `likes` and `comments` overlays, but the IG worker never stores those keys in `source_metadata` |

**Anomalies**

- **Three of four admin "settings" are dead writes.** Only `maxPosts` has a reader, and that reader is short-circuited by the `page.tsx` hardcoded `getInstagramPosts(20)`. `autoScroll`, `scrollSpeed`, and `showCaptions` go straight to a database row that nothing else reads.
- **The "Sync Posts" admin button is broken.** It calls `/api/dam/assets?tag=source:instagram`, but the DAM route ignores the `tag` query param. Admin sees all DAM assets, not just IG. There is also no admin endpoint that re-triggers the IG sync Worker — it only runs on its Cloudflare `scheduled` handler.
- **Two parallel IG sync implementations exist.** `src/app/api/cron/instagram-sync/route.ts` (Next.js cron, older) and `workers/instagram-sync/src/index.ts` (Cloudflare Worker, new + untracked per git status). Both write to the same `assets` table with `source='instagram'` and tag with `ig_carousel`. Need to confirm only one is actively scheduled.
- **`source_metadata` shape mismatch.** Worker writes `{permalink, post_type, date_utc, image_index, imported_at}`. Admin preview expects `source_metadata.likeCount` and `source_metadata.commentCount`. These keys aren't being produced anywhere I can see, so the admin's hover overlay always shows 0 for both. The older Next.js cron route may have written them — needs verification.
- **No curation column.** Admin claims to manage "which posts show up," but actually has no per-post visibility toggle. Every asset with the `ig_carousel` tag is shown, ordered by `uploaded_at DESC`. To hide a specific IG post you'd have to remove the tag in DAM (admin doesn't surface this).
- **Hardcoded fallback in `InstagramCarousel`.** Lines 12-26: if `posts.length === 0`, the component falls back to 13 local gallery image paths under `/lashpop-images/gallery/`. So even if the IG sync breaks completely, the section keeps rendering — which masks the failure.
- **Hardcoded handle in `InstagramCarousel`.** "Follow @lashpopstudios" link at line 154 points at `https://instagram.com/lashpopstudios` literally. No DB knob.
- **No filter by `assets.source`.** The `getInstagramPosts` query filters by the `ig_carousel` tag — not by `source = 'instagram'`. If somehow a non-IG asset got tagged `ig_carousel`, it would render.

---

## `/admin/website/quiz`

**Files**
- Admin page: `src/app/admin/website/quiz/page.tsx:77-1081` (single page, two tabs: "Comparison Photos" and "Result Pages")
- Server actions: `src/actions/quiz-photos.ts`
  - `getAllQuizPhotos()` (line 40-62) — admin photo list
  - `addQuizPhoto({assetId, lashStyle})` (102-131) — admin insert
  - `toggleQuizPhotoEnabled(photoId)` (208-232) — admin enable/disable
  - `deleteQuizPhoto(photoId)` (235-241) — admin delete
  - `updateQuizPhotoCrop(photoId, cropData)` (134-205) — admin crop + R2 upload via `sharp`
  - `updateQuizPhotoSortOrders(updates)` (244-260) — admin reorder (NOT wired in current UI — no reorder UX shown)
  - `getAllResultSettings()` (405-457) — admin result list; auto-seeds via `autoSeedMissingResultImages` (462-512) using `quiz_result` + lash-type tags
  - `updateResultSettingsText(lashStyle, data)` (515-536) — admin text edits
  - `setResultImage(lashStyle, assetId)` (539-553) — admin pick result image
  - `updateResultImageCrop(lashStyle, cropData)` (556-617) — admin result crop + R2 upload
  - `removeResultImage(lashStyle)` (670-684) — admin clear
  - `getQuizPhotosForQuiz()` (65-100) — public read (enabled-only, grouped by style)
  - `getResultSettingsForQuiz()` (633-655) — public read for result screen
- DB tables:
  - `quiz_photos` (`src/db/schema/quiz_photos.ts:14-40`): `id`, `asset_id` FK → `assets`, `lash_style` (enum: `classic | hybrid | wetAngel | volume`), `crop_data` (jsonb `{x, y, scale}`), `crop_url`, `is_enabled`, `sort_order`, timestamps
  - `quiz_result_settings` (`:46-80`): `id`, `lash_style` (unique), `result_image_asset_id` FK, `result_image_crop_data` (jsonb), `result_image_crop_url`, `display_name`, `description`, `best_for` (jsonb string[]), `recommended_service`, `booking_label`, timestamps
  - `quiz_lash_style` pgEnum (`:5`)
  - `assets` — referenced via `asset_id` and `result_image_asset_id`
- Worker writers: none. Quiz tables are 100% admin-owned. The auto-seed in `getAllResultSettings()` is a one-time read-time mutation: if a result image is null and there's a DAM asset tagged with both `quiz_result` and the lash-type tag (`classic`, `hybrid`, `wet`, `volume`), it links that asset's id into `quiz_result_settings.result_image_asset_id`.
- Frontend consumers:
  - `src/components/find-your-look/FindYourLookModal.tsx:128-131` — fetches both `getQuizPhotosForQuiz()` and `getResultSettingsForQuiz()` in parallel on mount
  - `src/components/find-your-look/PhotoComparisonRound.tsx:53` — picks `photo.cropUrl || photo.filePath` for the comparison images
  - `src/components/find-your-look/FindYourLookModal.tsx:38-55` (`buildResultDisplay`) — merges DB result settings with hardcoded `LASH_STYLE_DETAILS` and `RESULT_IMAGES` fallbacks from `types.ts:70-135`
  - `ResultScreen` (`FindYourLookModal.tsx:850-933`) — renders `resultImage`, `displayName`, `description`, `bestFor[]`, `recommendedService`, `bookingLabel`

**Fields — Tab 1: Comparison Photos**

| Admin field | Writes to | Other writer | Frontend reader | Status | Notes |
|---|---|---|---|---|---|
| "Add Photo from DAM" picker (per lash style) | `quiz_photos.{asset_id, lash_style, sort_order=max+1}` (via `addQuizPhoto`) | — | `getQuizPhotosForQuiz()` → `PhotoComparisonRound.photo.filePath` | live | `sort_order` initialized but never user-editable in current UI |
| Crop button (per photo) | `quiz_photos.{crop_data, crop_url}` (via `updateQuizPhotoCrop`); also uploads `quiz-crops/${photoId}/...-square-${ts}.jpg` to R2 | — | `PhotoComparisonRound.tsx:53` uses `cropUrl || filePath` | live | Crop shape `{x: 0-100, y: 0-100, scale: number}` matches between `QuizPhotoCropEditor` and the modal's `PhotoComparisonRound` (only `cropUrl` is rendered — `cropData` is the fallback for client-side overlay) |
| Enable/disable eye toggle | `quiz_photos.is_enabled` | — | `getQuizPhotosForQuiz()` filters `WHERE is_enabled = true` | live | |
| Delete trash icon | DELETE row | — | — | live | Asset stays in DAM (only the quiz_photos link is removed) |
| (Implicit) `sort_order` | Only set on insert; `updateQuizPhotoSortOrders` action exists but no UI calls it | — | `getQuizPhotosForQuiz()` orders by `sort_order ASC` | dead-write | Server action wired but no admin reorder UI |

**Fields — Tab 2: Result Pages**

| Admin field | Writes to | Other writer | Frontend reader | Status | Notes |
|---|---|---|---|---|---|
| Result Image picker | `quiz_result_settings.{result_image_asset_id, result_image_crop_data=null, result_image_crop_url=null}` (via `setResultImage`) | Auto-seed `autoSeedMissingResultImages` (`quiz-photos.ts:462-512`) writes `result_image_asset_id` from a DAM asset tagged with `quiz_result` + lash-type tag, if currently null | `ResultScreen` via `buildResultDisplay` (`FindYourLookModal.tsx:38-55`); reads `cropUrl || filePath` (`getResultSettingsForQuiz` line 650) | live | Setting a new image clears the crop, forcing admin to re-crop |
| Result Image crop | `quiz_result_settings.{result_image_crop_data, result_image_crop_url}` (via `updateResultImageCrop`); uploads `quiz-results/${lashStyle}/...-result-${ts}.jpg` to R2 | — | Same as above | live | |
| Result Image remove (X) | nulls all three image columns (via `removeResultImage`) | Auto-seed may re-populate on next admin page open if a matching DAM asset exists | Same as above | live, with edge case | Removing then reopening admin can immediately re-link a different image — confusing UX |
| Display Name | `quiz_result_settings.display_name` | — | `ResultScreen.result.displayName` (line 865) | live | Fallback: `LASH_STYLE_DETAILS[style].displayName` from `types.ts` |
| Description | `quiz_result_settings.description` | — | `ResultScreen.result.description` (line 885) | live | Fallback: `LASH_STYLE_DETAILS[style].description` |
| "Best For" bullets | `quiz_result_settings.best_for` (jsonb string[]) | — | `ResultScreen.result.bestFor[]` (line 892) | live | Empty array = fallback to `LASH_STYLE_DETAILS[style].bestFor` per `buildResultDisplay:49` |
| Recommended Service | `quiz_result_settings.recommended_service` | — | `ResultScreen.result.recommendedService` (line 867) | live | |
| Booking Button Label | `quiz_result_settings.booking_label` | — | `ResultScreen.result.bookingLabel` (line 922) | live | |

**Anomalies**

- **Auto-seed mutation runs on every admin GET.** `getAllResultSettings()` (which is what powers the admin page load) always calls `autoSeedMissingResultImages`, which writes to DB at read time. Side-effect-in-a-getter; risk is low (idempotent + best-effort) but it means an admin "remove image" can be undone on the very next admin page refresh.
- **Hardcoded R2 fallback image paths almost certainly 404.** `src/components/find-your-look/types.ts:130-135` builds `${R2_BASE}/uploads/quiz/result-${style}.jpg` URLs. Per commit `9093e32`: "3/4 of the hardcoded R2 URLs were 404 since the R2 migration." The DB-backed image now wins, but the fallback path is still broken if the DB image is unset AND auto-seed finds no DAM asset.
- **`LASH_STYLE_DETAILS` in `types.ts` is duplicated copy.** The hardcoded fallback in `types.ts:70-126` has slightly different wording from `DEFAULT_RESULT_SETTINGS` in `quiz-photos.ts:332-383`. The action's defaults are what get seeded; the types.ts copy is the per-field fallback in `buildResultDisplay`. Two sources of "truth" for default lash style copy.
- **Crop shape is consistent.** `{x: 0-100, y: 0-100, scale: number}` matches between `QuizPhotoCropEditor` (admin), the schema (`QuizPhotoCropData` interface), `generateSquareCrop` (server), and the modal's consumer. The audit brief mentioned "3 jsonb crop fields" — actually there are only 2 jsonb crops in the quiz schema: `quiz_photos.crop_data` and `quiz_result_settings.result_image_crop_data` (the third jsonb is `best_for`, which is a string array, not a crop).
- **No quiz-photo `sort_order` UI.** Admin can't reorder photos within a style. Server action exists but is unwired. Photos appear in `quiz_photos.sort_order ASC` order — currently always insert order.
- **No "lash quiz answers" or analytics surfacing.** The quiz collects Q1/Q2 + N comparison rounds in memory (`useQuizAlgorithm`) but doesn't write results anywhere. Admin has no funnel data.
- **Tag name mismatch for `wetAngel`.** Schema enum value is `wetAngel`; the auto-seed lookup translates it to DAM tag name `wet` (`LASH_STYLE_TO_TAG_NAME` in `quiz-photos.ts:13-18`). If the DAM has a `wetAngel` tag instead of `wet`, auto-seed silently fails for that style.
- **Frontend hardcoded fallbacks mask DB problems.** Per `buildResultDisplay`, any missing DB field falls back to `LASH_STYLE_DETAILS` + `RESULT_IMAGES` from `types.ts`. So if an admin saves an empty `displayName` or empty `bestFor[]`, the public modal silently renders the hardcoded default and the admin has no signal that their save "didn't take."

---

## Cross-section summary

- **Reviews + Review-Settings:** the most architecturally interesting and most fragile area. Multi-writer contention (admin / 6h Worker fetch / weekly LLM editor pass) is managed by the `admin_locked_fields` jsonb sentinel. All four lockable columns (`quality_score`, `team_member_id`, `show_on_website`, `editor_notes`) round-trip correctly between admin PATCH, drawer lock UI, and Worker SQL clauses. Risk: any new admin-editable column must be added to `LOCKABLE_COLUMNS` in `[id]/route.ts` AND to every Worker UPDATE clause, or admin edits will be silently overwritten on the next tick.
- **Instagram:** mostly a façade. The admin UI exposes four settings; three are dead writes, one is broken by a hardcoded value at the consumer. The "Sync Posts" button is fully broken. The Worker runs autonomously on schedule and the carousel just renders whatever's tagged `ig_carousel`.
- **Quiz:** clean owner model (admin-only writes, public-only reads), with the lone exception of `autoSeedMissingResultImages` doing a read-time DB mutation. End-to-end wiring of result settings (commit `9093e32`) is live and tested. Photo crops are correctly persisted both as `{x, y, scale}` jsonb (for re-edit) and as pre-cropped R2 JPGs (for fast load).
- **Schema dead-reads to flag:** `reviews.response_text`, `reviews.response_date`, `reviews.raw_payload`, `reviews.quality_scored_at`, `reviews.include_in_schema` (admin-uneditable), `website_settings.config.{autoScroll, scrollSpeed, showCaptions}` for `instagram_carousel`, `quiz_photos.sort_order` (writable but no admin UI).
- **Highest-risk hidden coupling:** the parallel `src/lib/review-filters.ts` implementation. If anyone runs it (it has no callers today but the function names match those in the Worker), it would use a weaker filter set than the Worker — no quality-score threshold, no diversity caps, no recency window, no anonymous-name exclusion, no admin-lock checks on the stale filter. Either delete it or wire it back to a shared module.
