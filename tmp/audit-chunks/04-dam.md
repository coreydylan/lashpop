# 04 — DAM + Phone Allowlist Audit

Scope: `/admin/dam-users` (phone allowlist), `/dam` (digital asset manager), `/dam/team` (per-member photo + crop manager), and what the marketing site reads from the DAM tables.

---

## A. Capability map

### Section 1: `/admin/dam-users`

#### `/admin/dam-users`
**Files**
- Page: `src/app/admin/dam-users/page.tsx` (186 lines, client-only)
- API: `src/app/api/admin/dam-users/route.ts` (GET, POST)
- DB tables: `user` (`auth_user.ts`), `session` (`auth_session.ts`), `verification` (`auth_verification.ts`)

**Behavior**
- Lists all `user` rows with `phoneNumber`, `email`, `name`, `damAccess`, `createdAt`, ordered by `createdAt DESC`.
- Single action per row: toggle `user.damAccess` (boolean). Updates also bump `user.updatedAt`.
- Auth gate: both GET and POST require the caller's own session (`session.token` cookie `auth_token`) to belong to a user with `damAccess = true`. Self-bootstrap is impossible — the first admin has to be flipped in DB by hand.

**Fields written**
| table | columns | row format |
|---|---|---|
| `user` | `damAccess`, `updatedAt` | `{ userId: text, damAccess: boolean }` |

**Anomalies**
- No UI for inviting/creating users. Note in the page ("users register by attempting to login to the DAM") is the only onboarding path — they must trigger `/api/auth/phone/send-otp` first, which creates a `user` row.
- No revoke-session side-effect: revoking `damAccess` does not delete the user's `session` row. The next request to a DAM route will fail the `damAccess` check in the layout, but a still-valid `auth_token` cookie keeps working for any non-DAM endpoint.
- No audit trail. Whoever flipped a user is not recorded.
- No pagination — fine while the team is small (< ~50 rows).
- The page calls itself "DAM User Management" but actually owns the global `auth_user.damAccess` flag, which gates `/dam`, `/dam/team`, AND `/api/admin/dam-users` itself (i.e. it's the studio admin allowlist, not a DAM-only flag).

---

### Section 2: `/dam` — main asset manager

**Files**
- Page: `src/app/dam/(protected)/page.tsx` (2,451 lines, client component, `dynamic = 'force-dynamic'`)
- Layout: `src/app/dam/(protected)/layout.tsx` (server, gates on cookie + `damAccess`)
- Login: `src/app/dam/login/page.tsx` (phone + OTP via BetterAuth's phone provider)
- Logout: `src/app/api/dam/auth/logout/route.ts` (deletes `session` row + clears `auth_token`)
- Legacy login: `src/app/api/dam/auth/login/route.ts` (password against `DAM_PASSWORD` env var — orphan, login UI does not call it)
- APIs: 28 route files under `src/app/api/dam/` (full list at end of this section)
- Components: 26 files in `src/app/dam/components/`
- Providers: `DAMProviders.tsx` → wraps in `QueryProvider` (TanStack React Query) + `DamTutorialProvider` (`src/contexts/DamTutorialContext.tsx`)
- Hooks: `useDamData.ts`, `useDamSettings.ts`, `useDamActions.ts` (in `src/hooks/`)
- R2 client: `src/lib/dam/r2-client.ts` (uses `aws4fetch.AwsClient`, not the AWS SDK — keeps cold-start cheap)
- Image optimizer: `src/lib/dam/image-optimizer.ts` (Sharp-backed WebP recompress at upload time)

**DB tables touched** (writes unless marked R)
- `assets`, `asset_tags`, `asset_services`, `tags`, `tag_categories`, `set_photos`, `sets` (R — `/api/dam/sets` POST exists but UI does not call it in the live page)
- `team_members` (R for dropdown), `team_member_photos` (R for crop URLs)
- `dam_user_actions` (audit), `dam_user_settings` (per-user UI state), `user` + `session` (auth check on every protected route)

**Capabilities (functional inventory)**

| Capability | API | DB tables | Owning component |
|---|---|---|---|
| Initial page hydration (assets + tags + team) | `GET /api/dam/initial-data` | `assets`, `asset_tags`, `tags`, `tag_categories`, `team_members`, `team_member_photos` | `page.tsx` via `useDamInitialData()` |
| Upload via multipart form (small/medium files, server-side Sharp WebP recompress) | `POST /api/dam/upload` | `assets` (insert) | `FileUploader.tsx` |
| Upload via presigned R2 PUT (used on the team page; not on the main DAM page itself in current build) | `POST /api/dam/presigned-url` then PUT to R2, then `POST /api/dam/assets` | `assets` (insert) | `team/page.tsx`, `FileUploader.tsx` |
| Delete asset(s) | `POST /api/dam/delete` `{assetIds[]}` | `assets`, `asset_services` (cascade), R2 (best-effort) | `page.tsx` `handleDelete` |
| Browse / paginate via React Query cache (no server pagination — all assets loaded then client-filtered) | `GET /api/dam/assets` (refresh) | `assets`, `asset_tags`, `tags`, `tag_categories` | `AssetGrid.tsx`, `page.tsx` |
| Filter by category/tag (multi-filter, OR within category, AND across categories) | client-side over hydrated list | n/a | `FilterSelector.tsx` (+ `OmniCommandPalette`) |
| Group by category (up to 2 stacked groupings; e.g. team × lash_type) | client-side | n/a | `GroupBySelector.tsx`, `GroupedChipList.tsx` |
| Toggle grid view mode (square / aspect / masonry) | client-side, persisted via `/api/dam/settings` | `dam_user_settings.settings.gridViewMode` | `AssetGrid.tsx` |
| Select assets (single, range, lasso) | client-side | n/a | `AssetGrid.tsx` |
| Apply tags to selected assets, with category selectionMode enforcement (`single` / `multi` / `limited`) | `POST /api/dam/assets/bulk-tag` `{assetIds[], tagIds[], additive}` | `asset_tags`, `tags`, `tag_categories` | `TaggingSheet.tsx`, `OmniCommandPalette.tsx`, `page.tsx` |
| Apply tags to one asset (replace all) | `POST /api/dam/assets/[assetId]/tags` `{tagIds[]}` | `asset_tags` | `PhotoLightbox.tsx` (used implicitly via bulk-tag) |
| Remove a single tag from selected/lightbox asset | `POST /api/dam/assets/remove-tag` | `asset_tags` | `OmniChip.tsx` X-button, lightbox |
| Assign team member to assets (single-select on the asset) | `POST /api/dam/assets/assign-team` `{assetIds[], teamMemberId}` | `assets.teamMemberId` | `TeamMemberDropdown.tsx`, `TeamMemberSelector.tsx`, `TaggingSheet.tsx` |
| Remove team member from assets | `POST /api/dam/assets/remove-team` | `assets.teamMemberId = null` | same |
| Assign asset(s) to one or more services | `POST /api/dam/tag` (also accepts color/length/curl enum metadata) `{assetIds[], tags:{serviceIds[]}}` | `asset_services` (full replace), `assets` (color/length/curl) | `TagEditor.tsx`, plus consumed by `MiniDamExplorer` on the admin side |
| Tag-category and tag CRUD (rename, add, delete, reorder, set color, set selectionMode/Limit, mark as Collection / Rating) | `GET / POST /api/dam/tags` | `tag_categories`, `tags` | `TagEditor.tsx` (lazy) |
| "Collection" filter (a category flagged `isCollection=true` whose tags act like saved views) | client-side; selection persisted via `/api/dam/settings` | `dam_user_settings.settings.activeCollectionId`; reads `tag_categories.isCollection` | `CollectionSelector.tsx`, `CollectionManager.tsx` |
| Sets / before-during-after photo groupings | `GET /api/dam/sets`, `POST /api/dam/sets`, `POST /api/dam/sets/add-photo` | `sets`, `set_photos` | `SetSelector.tsx` — **but not wired into the live page** (commented out in `page.tsx.backup`; main page does not import `SetSelector`) |
| Asset lightbox (swipeable, keyboard nav, inline tag chips, edit caption) | reads from hydrated cache; writes via bulk-tag/assign-team | same as above | `PhotoLightbox.tsx` |
| Omni command palette (Cmd-K) — searches assets by filename, tags, team; jumps to filter, applies tags, opens editors | client only | n/a | `OmniBar.tsx` + `OmniCommandPalette.tsx` (lazy) |
| Grid scroller hero feed (frontend website consumer) | `GET /api/dam/grid-scroller` (DAM exposes, frontend reads) | `assets`, `asset_tags`, `tags` filtered to category=`website` + tag=`grid-scroller`, with `key-image` boost | none in DAM UI — endpoint is for the marketing site |
| "For this service" picker (admin website services page reads from DAM) | `GET /api/dam/service-assets?serviceId=` | `asset_services` | `ServiceHeroImagePicker.tsx` (in `src/components/admin/`) |
| Per-user settings (grid view, active filters, group-by, visible card tags, active collection, tutorial state) — autoload + autosave | `GET / POST /api/dam/settings` | `dam_user_settings.settings` (jsonb) | `useDamSettings.ts` hook |
| Audit log for upload / tag add+remove / delete / filter change / view change / group change | `POST /api/dam/actions` `{actionType, actionData}` | `dam_user_actions` | `useDamActions.ts` hook (called inline from page.tsx) |
| Onboarding tutorial walkthrough (separate desktop/mobile completion tracking) | `/api/dam/settings` (`tutorial` block of settings jsonb) | `dam_user_settings.settings.tutorial` | `TutorialWalkthrough.tsx` + `DamTutorialContext.tsx` |
| Mobile-only chip insertion bar / thumb panel | client-only | n/a | `InlineChipBar.tsx`, `ThumbPanel.tsx` |
| Logout | `POST /api/dam/auth/logout` | deletes `session` row | header button |

**Full API surface** (28 routes under `/api/dam/`)

| Route | Method | Notes |
|---|---|---|
| `auth/login/route.ts` | POST | Password vs `DAM_PASSWORD` env. **Orphan** — login UI uses `/api/auth/phone/verify-otp` instead. Should be deleted. |
| `auth/logout/route.ts` | POST | Deletes session, clears `auth_token` |
| `initial-data/route.ts` | GET | Combined hydrate (assets+tags+team) — `s-maxage=5` |
| `assets/route.ts` | GET, POST | List with `?teamMemberId=` filter, or manual insert metadata after presigned upload |
| `assets/assign-team/route.ts` | POST | Bulk assign `teamMemberId` |
| `assets/remove-team/route.ts` | POST | Bulk null out |
| `assets/bulk-tag/route.ts` | POST | Add/replace tags with `selectionMode` enforcement |
| `assets/remove-tag/route.ts` | POST | Strip a single tag from many |
| `assets/[assetId]/tags/route.ts` | POST | Full-replace tags for one asset |
| `upload/route.ts` | POST | Multipart upload + Sharp WebP recompress + insert |
| `presigned-url/route.ts` | POST | Mint R2 presigned PUT URL |
| `delete/route.ts` | POST | Delete assets + cascade `asset_services` + R2 delete |
| `tags/route.ts` | GET, POST | Read flat+hierarchical category tree; write full category/tag set |
| `tag/route.ts` | POST | Apply `color`, `length`, `curl`, `serviceIds`, `teamMemberId` to many assets in one shot |
| `sets/route.ts` | GET, POST | Sets list / create. **Not used by live UI.** |
| `sets/add-photo/route.ts` | POST | **Not used by live UI.** |
| `team-members/route.ts` | GET | Active team with primary photo's crop data |
| `team-members/photos/route.ts` | POST | Insert team-member photo metadata after presigned upload |
| `team/[memberId]/photos/route.ts` | GET, POST | Per-member portfolio (merges `team_member_photos` album + DAM-tagged `assets`); POST tags DAM assets to a member |
| `team/photos/[photoId]/route.ts` | DELETE | Delete photo + R2 + all crop variants |
| `team/photos/[photoId]/set-primary/route.ts` | POST | Flip `isPrimary`, plus syncs `team_members.imageUrl` to the new primary's `filePath` |
| `team/photos/[photoId]/crops/route.ts` | POST | Save 5 crop jsonb blobs to one photo |
| `team/upload/route.ts` | POST | Multipart upload variant scoped to team (Sharp re-render NOT done here — raw upload) |
| `service-assets/route.ts` | GET | Asset IDs tagged for a given `serviceId` (consumed by `ServiceHeroImagePicker`) |
| `grid-scroller/route.ts` | GET | Assets tagged `website/grid-scroller`, with `key-image` flag (consumed by frontend) |
| `settings/route.ts` | GET, POST | Per-user UI state |
| `actions/route.ts` | POST | Audit log writer |

**Component inventory** (`src/app/dam/components/`)

| File | Lines | Role |
|---|---|---|
| `AssetGrid.tsx` | 1276 | Heart of the page. Renders the responsive grid (square / aspect / masonry), drives selection (single/shift-click/lasso), grouping, viewport-based image loading, overlay chips. Does **not** use TanStack virtual — manual rendering. |
| `AssetGridSkeleton.tsx` | 51 | Shimmer placeholder while initial load is in flight. |
| `FileUploader.tsx` | 787 | Drag-drop uploader, also handles per-batch tag pre-tagging (assign team + apply tags during upload). Uses framer-motion. |
| `OmniBar.tsx` | 523 | Sticky top control bar — search input, group-by/filter chips, mode toggles. Portals on mobile. |
| `OmniChip.tsx` | 550 | A single tag/team/filter chip rendered in the bar — handles X-to-remove, popovers, drag reorder. |
| `OmniCommandPalette.tsx` | 940 | Cmd-K palette. Searches across tags/teams/assets, runs actions (apply tag, jump-to-filter, open editor). Lazy. |
| `PhotoLightbox.tsx` | 527 | Full-screen lightbox with keyboard + swipe nav, inline tag editor surface. Portals. |
| `TagEditor.tsx` | 765 | Full CRUD for `tag_categories` and `tags`. Drag-reorder, color picker, selectionMode picker, isCollection toggle. Lazy. |
| `TaggingSheet.tsx` | 238 | Bottom sheet on mobile for applying tags to selected assets. |
| `TagSelector.tsx` | 430 | Compact tag picker (used inside lightbox). |
| `FilterSelector.tsx` | 359 | Category → tag dropdown chooser added to the omnibar. |
| `GroupBySelector.tsx` | 196 | "Group by Team → Lash Type" picker, max 2. |
| `GroupedChipList.tsx` | 341 | Chips list rendered inside a group header (so each group can be tagged independently). |
| `CollectionManager.tsx` | 364 | CRUD for "collection" tags (a `tag_categories` row with `isCollection=true`). Lazy. |
| `CollectionSelector.tsx` | 77 | Switcher between collections (saved views). |
| `SetSelector.tsx` | 136 | Picker for `sets` (before/during/after). **Not mounted in live page.** |
| `TeamMemberDropdown.tsx` | 226 | Avatar-rich team picker for asset assignment. |
| `TeamMemberSelector.tsx` | 91 | Simpler variant used inside the tagging sheet. |
| `ThumbPanel.tsx` | 879 | Mobile-only side rail of selected assets' thumbnails. |
| `InlineChipBar.tsx` | 104 | Mobile chip bar shown inline above the grid (group-by row equivalent). |
| `ViewportSensor.tsx` | 108 | IntersectionObserver wrapper; reports which asset IDs are on-screen so the chip bar knows the "current" group. |
| `ImageSkeleton.tsx` | 34 | Per-tile shimmer. |
| `CoachingTooltip.tsx` | 177 | Tooltip used by the tutorial / coaching layer. |
| `TutorialWalkthrough.tsx` | 378 | The multi-step onboarding walkthrough (split desktop vs mobile flows). |
| `TutorialIntegration.tsx` | 115 | Glue between the global tutorial context and DAM-specific spotlights. |
| `DAMProviders.tsx` | 15 | Wraps with `QueryProvider` + `DamTutorialProvider`. |

---

### Section 3: `/dam/team` — team-member photo + crop manager

#### `/dam/team`
**Files**
- Page: `src/app/dam/(protected)/team/page.tsx` (459 lines)
- Component: `src/app/dam/(protected)/team/components/PhotoCropEditor.tsx` (543 lines)
- Server action: `src/actions/team-photos.ts` (Sharp pipeline — generates the 5 statically-cropped jpgs and uploads them to R2)
- APIs: `team-members/route.ts`, `team-members/photos/route.ts`, `team/[memberId]/photos/route.ts`, `team/photos/[photoId]/route.ts`, `team/photos/[photoId]/set-primary/route.ts`, `team/photos/[photoId]/crops/route.ts`, `team/upload/route.ts`
- DB: `team_members`, `team_member_photos` (especially the 5 `crop*` jsonb columns + their `crop*Url` static-image counterparts)

**Behavior**
- Two-pane flow: pick member → upload + manage that member's photo album → click a photo to enter the crop editor.
- Upload uses presigned R2 PUT (`POST /api/dam/presigned-url` → R2 PUT → `POST /api/dam/team-members/photos`). The `team/upload` multipart endpoint exists but the live page does not call it.
- Crop editor (`PhotoCropEditor.tsx`) lets the user position 5 named crops over one source image: `fullVertical` (3:4), `fullHorizontal` (16:9), `square` (1:1), `mediumCircle` (1:1), `closeUpCircle` (1:1). Each crop stores `{ x: 0-100, y: 0-100, scale: 0.7-2.4 }`.
- Save flow goes through the `saveTeamPhotoCrops` server action, NOT through the `crops` API route directly — the action fetches the source image, calls `sharp().resize().composite().jpeg()` for each of the 5 crops, uploads each to `team-crops/{memberId}/...` in R2 with `Cache-Control: max-age=31536000`, then writes both the jsonb crop + the resulting `cropXxxUrl` to the row.
- Setting "primary" rewrites `team_members.imageUrl` to that photo's `filePath` (single side-effect that bridges the album into the team record).
- Delete is blocked for the primary photo (must reassign first).

**Fields written**
| table | columns | row format |
|---|---|---|
| `team_member_photos` | insert: `teamMemberId`, `fileName`, `filePath`, `isPrimary=false` | from `/api/dam/team-members/photos` POST |
| `team_member_photos` | `cropFullVertical`, `cropFullHorizontal`, `cropMediumCircle`, `cropCloseUpCircle`, `cropSquare` (jsonb) + matching `*Url` text columns + `updatedAt` | from `saveTeamPhotoCrops` server action |
| `team_member_photos` | `isPrimary` toggle | from `set-primary` route |
| `team_members` | `imageUrl`, `updatedAt` | side-effect of `set-primary` (syncs to the new primary's `filePath`) |
| `team_member_photos` | row delete | from DELETE — also deletes R2 originals + all crop variants |

**Anomalies**
- Two parallel data sources for "photos of a team member": the `team_member_photos` album AND DAM `assets` rows with `teamMemberId` set. The `team/[memberId]/photos` GET merges them and de-dupes by `filePath`, but they are **never reconciled** — the album version (with crops) and the DAM-tagged version (without crops) can both exist for the same image.
- The `set-primary` route is the only place that mutates `team_members.imageUrl` from this UI. The team admin (`/admin/website/team`) and Vagaro sync also write to that field — three writers, no audit.
- Crop edits are persisted via a server action (`team-photos.ts`) but there's also a `/api/dam/team/photos/[photoId]/crops` POST route that only updates the jsonb (no Sharp regen). They are not the same path. The route is effectively dead for the live UI — only the server action is invoked.
- `team/upload/route.ts` (Sharp-less multipart) is dead in the live UI — kept around as a fallback.

---

## B. DAM column → frontend consumer reverse map

Only columns that the marketing site actually reads. Internal-only columns (`fileSize`, `mimeType`, `dam_user_actions.*`, `dam_user_settings.*`, audit timestamps) omitted.

| Column / concept | Written by (DAM API) | Read by (frontend / admin) | Notes |
|---|---|---|---|
| `assets.filePath` (R2 URL of the source/optimized image) | `POST /api/dam/upload`, `POST /api/dam/assets` | `actions/instagram.ts` (IG carousel), `actions/services.ts:getAllServices` (key-image lookup), `actions/dam.ts` (quiz, team portfolio), `actions/work-with-us-carousel.ts`, `actions/quiz-photos.ts`, `api/dam/grid-scroller`, `api/dam/team/[memberId]/photos` | The single URL all consumers use; no separate "public" / "thumbnail" derivative is generated by upload (Sharp only does one WebP recompress). |
| `assets.fileName` | upload | `work-with-us-carousel.ts`, `quiz-photos.ts`, `dam.ts` (used for alt text and identification) | |
| `assets.fileType` (image vs video) | upload | `actions/dam.ts:getRandomLashAssets` filters to `image` | Video is uploadable but no consumer currently filters for video. |
| `assets.caption` | not editable in current live UI (db only) | `actions/instagram.ts` carousel uses it as the post caption; `api/dam/team/[memberId]/photos` returns it | Editing in the DAM is wired in lightbox code but unclear if exposed. |
| `assets.externalId`, `assets.source`, `assets.sourceMetadata` | Instagram cron (`api/cron/instagram-sync/route.ts`) and the new `workers/instagram-sync/` Cloudflare worker — NOT the DAM UI | `actions/instagram.ts:getInstagramPosts` reads `sourceMetadata.permalink` and `externalId` as the IG post id | These columns exist for IG passthrough only. |
| `assets.teamMemberId` | `POST /api/dam/assets/assign-team`, also set on upload | `actions/dam.ts:getAssetsByTeamMemberId`, `api/dam/team/[memberId]/photos` (merge w/ album) | Drives the "additional portfolio" gallery rendered on team profile modals. |
| `assets.color`, `length`, `curl` (enum lash attributes) | `POST /api/dam/tag` | No frontend consumer found — appears to be legacy / unused. | The richer `tags` table has replaced these. Safe to deprecate. |
| `asset_tags.tagId → tags → tag_categories` | `POST /api/dam/assets/bulk-tag`, `assets/[assetId]/tags`, `assets/remove-tag` | `actions/instagram.ts` filters on `tags.name = 'ig_carousel'`; `api/dam/grid-scroller` filters on category=`website`, tag=`grid-scroller`, and tag=`key-image`; `actions/dam.ts:getAssetsByTagNames` (quiz "Find Your Look"); `actions/quiz-photos.ts` reads `quiz_result` + per-style tags to seed the result-photo pool | **The frontend's contract with the DAM is the tag name.** Several hardcoded tag names (`ig_carousel`, `website`/`grid-scroller`/`key-image`, `quiz_result`) act as "magic strings" the DAM team has to know about. |
| `asset_services.assetId × serviceId` | `POST /api/dam/tag` (`tags.serviceIds[]`) | `actions/dam.ts:getAssetsByServiceSlug` (rendered on service detail pages), `api/dam/service-assets` (admin picker), `actions/services.ts:getAllServices` (LEFT JOIN to surface a fallback hero) | Many-to-many; full-replace semantics on write. |
| `services.keyImageAssetId → assets.filePath` | `actions/services.ts:updateServiceImage` (admin website services page, not the DAM UI) | `actions/services.ts:getAllServices` and `getAllServicesAdmin` resolve service hero with priority `vagaroImageUrl > services.keyImageAssetId → assets.filePath > subcategory keyImage`. Consumed by `landing-v2/sections/ServicesSection.tsx` and the services admin. | This is the path the **services hero image** flows through. The DAM provides the asset; the admin/website picks one and stamps `services.keyImageAssetId`. |
| `service_subcategories.keyImageAssetId → assets.filePath` | admin website (not DAM) | same resolver as above (fallback layer) | Subcategory-level fallback image. |
| `tags`, `tag_categories` schema | `POST /api/dam/tags` | (only the DAM and admin DAM-pickers — frontend reads tag NAMES via the actions, not the schema directly) | A category renamed in the DAM does not auto-migrate consumers (which key on `.name`). |
| `team_member_photos.cropSquareUrl`, `cropCloseUpCircleUrl`, `cropMediumCircleUrl`, `cropFullVerticalUrl`, `cropFullHorizontalUrl` | `saveTeamPhotoCrops` server action (Sharp re-render) | `actions/team.ts:getTeamMembersWithServices` joins primary photo and surfaces `cropSquareUrl`, `cropCloseUpCircleUrl`, `cropMediumCircleUrl`, `cropFullVerticalUrl`; consumed by `components/sections/EnhancedTeamSectionServer.tsx` → `EnhancedTeamSectionClient.tsx` and `landing-v2/TeamSection.tsx` | This is the entire visual surface area of the public team section. The DAM team page is the only place these URLs are generated. |
| `team_member_photos.cropSquare`, `cropCloseUpCircle`, `cropMediumCircle`, `cropFullVertical`, `cropFullHorizontal` (jsonb) | same | also exposed in `EnhancedTeamSectionClient` as fallback styling (`objectPosition` + `transform`) when no `*Url` exists yet | Both forms (Url and jsonb) are read — Url is preferred, jsonb is the fallback. |
| `team_member_photos.isPrimary` | `team/photos/[photoId]/set-primary` | implicitly: only the primary photo's crops are joined into the frontend team payload | If a member has no `isPrimary=true` row, they get no crop URLs and the legacy `team_members.imageUrl` is used raw. |
| `team_member_photos.filePath` | upload | side-effect: `set-primary` copies this into `team_members.imageUrl` | The team record's `imageUrl` is downstream of the DAM, not its own truth. |
| `sets`, `set_photos` | `POST /api/dam/sets`, `/api/dam/sets/add-photo` | **No frontend or admin consumer found.** Dead schema in current build. | Earmarked for before/during/after gallery; UI not built. |
| `assets.altText` | not editable in any UI today (db only) | not read | Dead column. |
| `assets.uploadedAt`, `width`, `height` | upload | consumed by gallery layout (grid scroller computes aspect; team portfolio uses `width`/`height` for `next/image`) | |

**Magic tag names the frontend depends on** (hardcoded strings the DAM team must know not to rename):

| Tag/category name | Consumer | Purpose |
|---|---|---|
| `ig_carousel` (tag) | `actions/instagram.ts` | Inclusion in the homepage IG carousel |
| `website` (category) + `grid-scroller` (tag) | `api/dam/grid-scroller` | Inclusion in the hero grid scroller |
| `key-image` (tag, in any context) | `api/dam/grid-scroller` | Boosts/marks the hero image inside the grid scroller |
| `quiz_result` (tag) | `actions/quiz-photos.ts` | Pool of imagery the "Find Your Look" quiz can show |
| per-style tags (e.g. `classic`, `volume`, `wet-angel`) | `actions/dam.ts:getAssetsByTagNames`, `quiz-photos.ts` | Per-result-style imagery for the quiz |

---

## C. Fold-into-master-admin observations

### Auth model

**DAM auth** (`src/app/dam/(protected)/layout.tsx`):
- Reads the `auth_token` cookie set by the BetterAuth phone OTP flow (`src/app/api/auth/phone/verify-otp/route.ts` → `cookies.set('auth_token', sessionToken, ...)`).
- Validates the session against the `session` table and joins `user.damAccess`.
- If no token → redirect to `/dam/login`. If session expired → redirect. If `damAccess === false` → render the `<AccessDenied />` client component (no redirect — stays on the route).
- Each DAM API route re-does the same session check inline (settings + actions routes); the bulk-tag/upload/tag/delete routes **do not** check auth and rely on the layout to gate the page. **This is a latent hole** — anyone with a valid phone session can call `POST /api/dam/upload` etc. directly without `damAccess`. Worth tightening when folding in.

**Website admin auth** (`src/app/admin/website/...`):
- **Nothing.** There is no gate on `/admin` routes in `middleware.ts`. The `features.clerk` flag is off (Clerk only protects `/dashboard(.*)`).
- The `/admin/website/*` pages and `/admin/dam-users` page are reachable by anyone who knows the URL. The only thing protecting `/admin/dam-users` is that its API enforces `damAccess` server-side — but the UI loads regardless.

**Implication for folding in:** The website admin needs to grow the same `damAccess`-checking layout (or a shared middleware) before it absorbs the DAM. The DAM's gate is the de-facto admin gate today; the website admin is hidden-by-obscurity.

### Layout coupling

`src/app/admin/website/layout.tsx`:
- Fixed 288px (`lg:w-72`) left sidebar with section links (Hero, Services, Founder Letter, Team, Instagram, Reviews, FAQ).
- Mobile header + collapsible menu.
- Main content area sits in `lg:pl-72` with `px-4 sm:px-6 lg:px-8 py-6 lg:py-10`.
- Already has a "Back to DAM" link in the sidebar footer that points to `/dam` — there is **already an expectation that DAM and website-admin coexist**.

`src/app/dam/(protected)/layout.tsx`:
- Just a thin server gate around `<DAMProviders>` — no shell, no sidebar. The DAM page draws its own full-bleed shell (header + sticky omnibar + grid).

**Compatibility verdict:** The DAM page is **full-bleed and assumes the entire viewport**. The omnibar sticks to the viewport top, the grid uses `max-w-7xl` of its own, the lightbox portals to the body. Embedding it inside the website-admin's `lg:pl-72` shell would:
- Break the sticky omnibar (it would stick to the wrong scroll container).
- Break the lightbox (already portals, so OK).
- Break the grid layout (`max-w-7xl` will look starved with a 288px sidebar stealing space).

Two viable shapes for the fold:
1. **Promote `/dam` to be a section of `/admin/website`** but give that section a full-bleed layout override (the website admin's layout would need to special-case the DAM section, or the DAM section would route-group out of it).
2. **Keep the DAM as its own route**, just add it as a sidebar entry on the website admin so users perceive one panel even if the route tree has two roots. Lower-effort, preserves the omnibar contract.

### Component reuse / duplication

Already-built DAM-adjacent components in `src/components/admin/`:

| File | Role | Notes |
|---|---|---|
| `MiniDamExplorer.tsx` | Mini asset picker for the admin (used by team admin, quiz admin, hero admin) | Near-clone of the DAM's `AssetGrid` + filter UI. Uses `Asset` and `TagCategory` types that duplicate the DAM types verbatim. |
| `ServiceHeroImagePicker.tsx` | Service hero image picker with two-tier filtering | Reads `/api/dam/service-assets` and the DAM's main `/api/dam/assets`. Near-clone of `MiniDamExplorer` plus a "For this service" tab. |
| `QuizPhotoCropEditor.tsx` | Single-square crop editor for quiz photos | Near-clone of `PhotoCropEditor.tsx` but for a single 1:1 crop instead of 5. |
| `MiniRichEditor.tsx` | Unrelated (rich text) | — |

**Duplication today:**
- Three slightly different asset pickers (`MiniDamExplorer`, `ServiceHeroImagePicker`, the DAM's own `OmniCommandPalette` / `AssetGrid`) — all hit the same `/api/dam/*` endpoints.
- Two crop editors (`PhotoCropEditor` for team's 5 crops, `QuizPhotoCropEditor` for quiz's 1 crop) — different shape but same gesture/zoom mechanics.

**Fold-in opportunity:** Extract one shared `<DamAssetPicker>` and one shared `<DamCropEditor>` (parameterized by crop set). Then `/admin/website/services`, `/admin/website/team`, `/admin/website/quiz`, and the DAM itself all consume the same components.

### Heaviest dependencies (why `/dam/page.tsx` is 2,451 lines)

- **One giant client component**, not broken into route segments. 30 `useState`s, 60+ `useCallback`s, 92 hook invocations in the top-level page alone.
- **No external state manager.** No Zustand / Jotai / Redux — everything is `useState` + refs + manual sync between `settings` (TanStack Query cache via `useDamSettings`), `allAssets` (local state synced from React Query), and `selectedAssets`.
- **TanStack React Query 5.90** is the only client cache. The page hydrates via `useDamInitialData()` and then keeps a local `allAssets` mirror, calling `refetchInitialData({ cancelRefetch: true })` after writes.
- **Framer Motion** is used in `FileUploader`, `TeamMemberDropdown`, `SetSelector`, `TaggingSheet`, `TeamMemberSelector` (animation-heavy).
- **No virtualization.** `@tanstack/react-virtual` is in `package.json` but is **not** used inside the DAM grid (a `grep` for `useVirtualizer` returns nothing in DAM components). For very large asset libraries the grid will get slow.
- **R2 SDK** is `aws4fetch` (~5KB), not `@aws-sdk` — good, this stays out of the bundle.
- **Sharp** is server-side only (in `actions/team-photos.ts` and `lib/dam/image-optimizer.ts`).
- **Eruda** mobile debugger is loaded in dev mode only (gated on `NODE_ENV`).
- **Lazy-loaded** at the top of the page: `FileUploader`, `OmniCommandPalette`, `TagEditor`, `CollectionManager` — these are gated behind user interaction.

**Cost of folding:** Bringing the whole page into the website admin's bundle would add ~12,000 lines of DAM components to the admin route. The lazy-loading already in place mitigates this somewhat, but the page-level state is monolithic and would resist being split without a refactor. Better to keep `/dam` as its own bundle and just present it inside a unified nav.

### Audit log integration

- `dam_user_actions` is written for: upload, tag add, tag remove, delete, filter change, search, collection create/add, view change, group change (see `useDamActions.ts`).
- The website admin has **no audit logging** for any of its writes (hero presets, team visibility, service hero swap, FAQ edits, founder letter copy, IG settings, review selection — all silent).
- When folded, the audit-log writer is a clean candidate to be promoted to a shared `recordAdminAction()` helper that all admin surfaces call. The schema (`actionType` text + `actionData` jsonb) is already generic enough.

### Other observations

- The `damAccess` boolean on `user` is a single-bit ACL. There is no concept of roles (artist vs. admin vs. owner). If the master admin grows real permission tiers (e.g. founder-letter editing vs. reviews vs. DAM uploads), this needs to become a role/scope set or a permissions jsonb.
- `auth_token` is the BetterAuth session cookie, NOT scoped to the DAM. The DAM login page is just a styled variant of the phone-OTP flow — the cookie it sets works site-wide. So once a user is signed in for the DAM, they're signed in for everything that checks that cookie (which today is only the DAM and `dam-users` admin, but it's worth noting before adding more gated surfaces).
- The dead `src/app/api/dam/auth/login/route.ts` (password-against-env-var) is legacy from the pre-OTP era. Should be deleted as part of fold-in cleanup.
- Tag-category renaming silently breaks consumers (see "Magic tag names" table). When folding in, this should either be guarded by a "system tag" flag in the DB or the consumers should switch to category/tag IDs.
- The DAM has rich per-user UI persistence (filters, group-by, view mode, tutorial state) via `dam_user_settings`. The website admin has none. If folding, decide whether each user gets per-user state across the whole panel or not — and if yes, reuse the `dam_user_settings` jsonb shape or normalize it.
- `set-primary` on a team photo silently overwrites `team_members.imageUrl`. The website team admin has no way to know its `imageUrl` was changed by a DAM user; there is no event/log/notification between the two surfaces. This is the kind of cross-surface side-effect a unified admin should make visible.
