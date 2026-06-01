# Admin → Frontend Mapping: Hero, Services, Team

Chunk 1 of 4. Covers `/admin/website/hero`, `/admin/website/services`, `/admin/website/team`.

---

## `/admin/website/hero`

**Files**
- Admin: `src/app/admin/website/hero/page.tsx:1-1357` (single client component with three sub-editors: `SingleImageEditor`, `SlideshowEditor`, `AssignmentsPanel`)
- APIs:
  - `src/app/api/admin/website/hero-archway/route.ts` — `GET`, `PUT`
  - `src/app/api/admin/website/hero-slideshow-presets/route.ts` — `GET`, `POST`, `PUT`, `DELETE`
  - `src/app/api/admin/website/hero-slideshow-assignments/route.ts` — `GET`, `PUT`
- Server action wrapper (for SSR read): `src/actions/hero-slideshow.ts` (`getSlideshowConfigs`, `getActiveSlideshowConfig`, `getAllSlideshowPresets`)
- DB tables: `website_settings` (`id`, `section` [unique key], `config` jsonb blob, `createdAt`, `updatedAt`) — three rows distinguished by `section`:
  - `'hero_archway'` → `{ desktop: HeroArchwayImage|null, mobile: HeroArchwayImage|null, updatedAt }`
  - `'hero_slideshow_presets'` → `{ presets: SlideshowPreset[] }`
  - `'hero_slideshow_assignments'` → `{ desktop: presetId|null, mobile: presetId|null, mobileSameAsDesktop: boolean }`
- DAM table referenced: `assets` (only by `assetId` stored inside the JSON blob; no FK)
- Frontend consumers:
  - `src/app/page.tsx:7,37` — server component calls `getSlideshowConfigs()` and passes `heroConfig={desktop,mobile}` to `LandingPageV2Client`
  - `src/app/LandingPageV2Client.tsx:303` → `<MobileHeroBackground heroConfig={heroConfig?.mobile} />`
  - `src/app/LandingPageV2Client.tsx:344` → `<HeroSection reviewStats={reviewStats} heroConfig={heroConfig?.desktop} />`
  - `src/components/landing-v2/HeroSection.tsx:49-251` — desktop renderer (image or slideshow)
  - `src/components/landing-v2/MobileHeroBackground.tsx:43-100+` — mobile fixed-background renderer
  - `src/components/landing-v2/slideshow/HeroArchSlideshow.tsx` — multi-image slideshow component (reads `preset.images`, `preset.transition`, `preset.timing`, `preset.navigation`)

**Fields**

| Admin field | Writes to | Frontend reader | Status | Notes |
|---|---|---|---|---|
| Single desktop image (assetId, url, fileName, position{x,y}, objectFit) | `website_settings.config.desktop` where `section='hero_archway'` (via `PUT /api/admin/website/hero-archway`) | `HeroSection.tsx:235-251` (via `heroConfig.fallbackImage`) | live | Resolved in `actions/hero-slideshow.ts:88-122` — only used when no slideshow preset is assigned to that device |
| Single mobile image (same shape) | `website_settings.config.mobile` where `section='hero_archway'` | `MobileHeroBackground.tsx:43+` | live | Same fallback gating |
| Slideshow preset (id, name, description, images[], transition, timing, navigation, globalKenBurns) | `website_settings.config.presets[]` where `section='hero_slideshow_presets'` (via `POST`/`PUT`/`DELETE /api/admin/website/hero-slideshow-presets`) | `HeroArchSlideshow` (when assigned) | live | Preset.images stored as `SlideshowImage[]` with assetId+url snapshotted |
| `preset.images[].position.x` / `.y`, `.objectFit` | inside preset JSON | `HeroArchSlideshow` | live |  |
| `preset.transition.type` / `.duration` | inside preset JSON | `HeroArchSlideshow` (driven by `useSlideshowController`) | live |  |
| `preset.transition.easing` | inside preset JSON | `useSlideshowController` | partial | Admin never lets you set easing — the API defaults to `'easeInOut'`; UI only exposes type + duration |
| `preset.timing.autoAdvance`, `.interval`, `.pauseOnHover` | inside preset JSON | slideshow controller | live |  |
| `preset.timing.pauseOnInteraction`, `.resumeDelay`, `.startDelay` | inside preset JSON | slideshow controller | partial | Defaults assigned by API; admin UI never exposes these |
| `preset.navigation.scrollEnabled`, `.swipeEnabled`, `.showIndicators`, `.looping` | inside preset JSON | slideshow controller / `SlideshowIndicators.tsx` | live |  |
| `preset.navigation.dragEnabled`, `.scrollSensitivity`, `.snapBehavior`, `.indicatorPosition`, `.indicatorStyle` | inside preset JSON | slideshow controller | partial | Default-only; admin UI never exposes |
| `preset.globalKenBurns` | inside preset JSON | `HeroArchSlideshow.tsx:96,153,159` (per-image `kenBurns` wins, then `globalKenBurns`, then a hardcoded default) | partial | Admin never exposes this — the API forwards whatever the client sends but the PresetEditor UI has no controls for it. Runtime is wired; admin authoring path is missing. |
| Desktop preset assignment | `website_settings.config.desktop` where `section='hero_slideshow_assignments'` (via `PUT /api/admin/website/hero-slideshow-assignments`) | `actions/hero-slideshow.ts:83-86` resolves to preset | live |  |
| Mobile preset assignment | `website_settings.config.mobile` | same | live |  |
| `mobileSameAsDesktop` checkbox | `website_settings.config.mobileSameAsDesktop` | same | live | PUT route forces `mobile = desktop` when checkbox is true (`hero-slideshow-assignments/route.ts:65`) |

**Anomalies**
- **Authoring gap on `globalKenBurns`**: forwarded by the POST handler at `hero-slideshow-presets/route.ts:68` and consumed at `HeroArchSlideshow.tsx:96,153,159`, but the admin UI has no editor for it. Anyone wanting a Ken Burns slideshow has to hand-edit JSON via the API.
- **Per-image `kenBurns`** on `SlideshowImage` is similarly readable but unauthorable in admin.
- **Navigation/timing knobs are mostly invisible**: `dragEnabled`, `scrollSensitivity`, `snapBehavior`, `indicatorPosition`, `indicatorStyle`, `pauseOnInteraction`, `resumeDelay`, `startDelay` all get defaulted on save and consumed at runtime, but the admin has no way to override them.
- **Defaults vs. saved**: when `editingPreset` is created in admin, defaults are pulled from `@/types/hero-slideshow` constants. The server action `actions/hero-slideshow.ts:15-40` has a separate inlined copy of those defaults. Drift risk — if one set changes, the other won't.
- **Hardcoded ultimate fallback**: `/lashpop-images/studio/studio-photos-by-salome.jpg` appears five times across `actions/hero-slideshow.ts`, the API GET handler, `HeroSection.tsx:44`, and `MobileHeroBackground.tsx:24`. Admin cannot change this final fallback.
- **Assignment validation gap**: `hero-slideshow-assignments PUT` accepts any string as `desktop` or `mobile`; doesn't verify the preset id exists. A deleted preset id will silently degrade to fallback.
- **Asset URLs are snapshotted**: when an image is picked from DAM, the URL is copied into the JSON blob. If the asset's `filePath` changes (re-upload, rename, deletion), the hero will 404 and there's no FK to detect orphans.
- **`/api/dam/assets?tag=website:hero`** populates a "quick picks" grid in the single-image editor (`hero/page.tsx:126,675+`). This is a soft taxonomy — nothing enforces that the tag exists.

---

## `/admin/website/services`

**Files**
- Admin: `src/app/admin/website/services/page.tsx:1-1832` (single client component; uses `MiniDamExplorer` for category/subcategory images and `ServiceHeroImagePicker` for per-service images)
- APIs / actions: **No REST routes** — entirely server actions in `src/actions/services.ts`:
  - `getAllServicesAdmin()` (line 152) — read, includes resolved `imageSource`/`resolvedImageUrl`
  - `getServiceCategoriesWithSubcategories()` (line 242) — read
  - `getAllSubcategories()` (line 554) — read for assignment dropdown
  - `updateServiceImage(serviceId, { keyImageAssetId, useDemoPhotos, imageUrl })` (line 220)
  - `updateServiceCategoryImage(categoryId, assetId|null)` (line 284)
  - `updateServiceSubcategoryImage(subcategoryId, assetId|null)` (line 302)
  - `tagAssetWithService(assetId, serviceId)` (line 322) — inserts into `asset_services`
  - `updateServiceCategoryContent(categoryId, { description, tagline, icon })` (line 440)
  - `resetServiceToVagaroImage(serviceId)` (line 505) — clears `keyImageAssetId` + `imageUrl`
  - `updateSubcategoryDisplayOrders(updates[])` (line 391)
  - `updateServiceSubcategory(serviceId, subcategoryId|null)` (line 521) — also realigns `categoryId`
- Vagaro sync writer: `workers/vagaro-sync/src/sync.ts:25-91` (`syncService`)
- DB tables:
  - `services` (`id`, `vagaroServiceId` unique, `vagaroParentServiceId`, `vagaroWidgetUrl` [deprecated], `vagaroServiceCode`, `vagaroData` jsonb, `vagaroImageUrl`, `categoryId` FK, `subcategoryId` FK, `name`, `slug` unique, `subtitle`, `description`, `durationMinutes`, `priceStarting` cents, `imageUrl`, `color`, `displayOrder`, `isActive`, `mainCategory` notNull, `subCategory`, `displayTitle`, `keyImageAssetId` FK→`assets`, `useDemoPhotos`, `createdAt`, `updatedAt`, `lastSyncedAt`)
  - `service_categories` (`id`, `name` unique, `slug` unique, `description`, `tagline`, `icon`, `displayOrder`, `isActive`, `keyImageAssetId`)
  - `service_subcategories` (`id`, `categoryId` FK, `name`, `slug` unique, `description`, `icon`, `displayOrder`, `isActive`, `keyImageAssetId` FK→`assets`)
  - `asset_services` (`id`, `assetId` FK, `serviceId` FK, `createdAt`) — many-to-many tagging
- Frontend consumers:
  - **Homepage service cards** — `src/components/landing-v2/sections/ServicesSection.tsx:22-87` defines a hardcoded `defaultServiceCategories` array (lashes, lash-lifts, brows, facials, waxing, permanent-makeup, specialty, injectables) with `title`, `tagline`, `description`, `icon`. **The component is rendered as `<ServicesSection isMobile={isMobile} />` in `LandingPageV2Client.tsx:361` with NO `categories` prop**, so the hardcoded values are always used.
  - **Service browser modal** — `src/components/service-browser/ServiceBrowserContext.tsx:24-31` `ServiceCategory` shape: `{id, name, slug, description, icon, displayOrder}` (no `tagline`). Fed via `LandingPageV2Client:288` from `page.tsx:36,113` (`getServiceCategories()` from `actions/categories.ts`).
  - **Service browser cards** — `src/components/service-browser/components/ServiceCard.tsx:36-37` reads `service.categorySlug` for icon mapping; consumes `name`, `subtitle`, `description`, `durationMinutes`, `priceStarting`, `imageUrl`, `vagaroServiceCode`.
  - **Per-service detail page** — `src/app/services/[slug]/page.tsx:1-38` (reads via `getServiceBySlug`) + `src/app/services/[slug]/ServiceDetailClient.tsx` (renders).
  - **Gallery for service detail page** — pulls assets via `getAssetsByServiceSlug(slug)` which joins `asset_services` → `assets`.

**Fields**

| Admin field | Writes to | Frontend reader | Status | Notes |
|---|---|---|---|---|
| Per-service hero image pick (DAM) | `services.keyImageAssetId` + `services.imageUrl` (via `updateServiceImage`) | `actions/services.ts:118-122` resolves with priority `vagaroImageUrl → keyImageAssetId → subcategoryKeyImageAssetId`; consumed in `ServiceCard.tsx` and `ServiceDetailClient.tsx:63` | partial | Image priority code prefers `vagaroImageUrl` **first**, so when a Vagaro photo exists the admin's DAM pick is hidden until the user clicks "Reset" (which only clears `keyImageAssetId`, doesn't change priority). Admin badge logic at `services/page.tsx:200-209` inverts the priority — calls it `'dam'` when DAM exists OR `'vagaro'` when Vagaro exists. UI says "DAM Override" but runtime says "Vagaro wins". |
| Per-service "Reset to Vagaro" button | clears `keyImageAssetId` + `imageUrl` | n/a | live | `resetServiceToVagaroImage` at `services.ts:505` |
| Per-service Demo Mode toggle | `services.useDemoPhotos` (via `updateServiceImage`) | `actions/services.ts:135` returns the field; `LandingPageV2Client.tsx:50` propagates it through `Service` interface | dead-read | The flag travels from DB through `getAllServices()` into `formattedServices` (`page.tsx:42-60`), but **no component file in `src/` actually reads `useDemoPhotos`** outside of `services/page.tsx` (admin) and the `actions/services.ts` selector. Drawer/cards never branch on it. |
| Per-service subcategory reassignment | `services.subcategoryId` + `services.categoryId` (via `updateServiceSubcategory`) | All service queries leftJoin on these; surfaces as `categoryName`/`subcategoryName` in cards | live |  |
| `services.name` (no admin write) | `services.name` (overwritten every Vagaro sync from `serviceTitle`, see `workers/vagaro-sync/src/sync.ts:62`) | `ServiceCard`, `ServiceDetailClient.tsx:106`, drawer, llms.txt | vagaro-overwritten |  |
| `services.description` (no admin write) | overwritten every Vagaro sync (`sync.ts:63`) | `ServiceDetailClient.tsx:127-131` | vagaro-overwritten |  |
| `services.durationMinutes` (no admin write) | overwritten every Vagaro sync (`sync.ts:64`) | `ServiceDetailClient.tsx:118`, `ServiceCard.tsx` | vagaro-overwritten |  |
| `services.priceStarting` (no admin write) | overwritten every Vagaro sync (`sync.ts:65`) | `ServiceDetailClient.tsx:40`, `ServiceCard.tsx` | vagaro-overwritten |  |
| `services.subtitle` (no admin write) | written only on initial insert in Vagaro sync (`sync.ts:81`) from `parentServiceTitle` | `ServiceDetailClient.tsx:108-110`, drawer | vagaro-overwritten (one-shot) | Vagaro update path doesn't refresh `subtitle`. So it's frozen at first-insert state. |
| `services.vagaroImageUrl` (no admin write) | written every Vagaro sync from public composite endpoint (`sync.ts:68`, `public-services.ts`) — preserved if fetch fails | `actions/services.ts:118-122` (priority #1) | vagaro-overwritten |  |
| `services.vagaroServiceCode` (no admin write) | (never written by sync.ts in this repo — pre-existing data or seeded elsewhere) | `ServiceCard.tsx` consumes it for booking widget | partial | Admin only shows it as a badge (`services/page.tsx:813`); no edit |
| `services.vagaroWidgetUrl` (no admin write) | marked DEPRECATED in `services.ts:12` | `ServiceDetailClient.tsx:27` declared in interface | dead-read | DEPRECATED column still selected and surfaced |
| `services.color` (no admin write) | not written anywhere | `ServiceDetailClient.tsx:20` declared but I didn't find a render that uses it | dead-read |  |
| `services.displayOrder` (no admin write) | initialized to 0 on Vagaro insert; not updated | order-by clauses everywhere (`getAllServices`, `getServices`) | partial | Field is alive in queries but no admin UI to reorder individual services |
| `services.mainCategory` notNull (no admin write) | Written on Vagaro insert from `parentTitle` | used heavily in `getTeamMembersWithServices()` and `team/route.ts:39` to derive team service tags | live |  |
| `services.subCategory` (no admin write) | not written by sync; no admin UI | not read anywhere in `src/` | dead column |  |
| `services.displayTitle` (no admin write) | not written by sync; no admin UI | aliased in `getServices()` to `services.name` (line 20) | dead-read | Column exists, never populated, never read |
| Category content: tagline | `service_categories.tagline` (via `updateServiceCategoryContent`) | **Not read on landing page** — `ServicesSection.tsx` uses hardcoded `defaultServiceCategories[].tagline`; `actions/categories.ts:7` (`getServiceCategories`) doesn't even SELECT `tagline` | dead-read | Saved successfully but never reaches a render path. `getServiceCategoriesForLanding()` in `services.ts:484` DOES select tagline but is never imported (orphan). |
| Category content: description | `service_categories.description` | `actions/categories.ts:19` returns it; consumed by `ServiceBrowserProvider`'s `ServiceCategory` type at `ServiceBrowserContext.tsx:28` and rendered inside the drawer header | live (drawer only) | Not on landing-page cards (those use hardcoded copy) |
| Category content: icon path | `service_categories.icon` | `actions/categories.ts:20` returns it; `ServiceCard.tsx:36-37` has a hardcoded `categoryIconMap` instead, which suggests the icon string from DB may not be the actual source | partial | Landing page uses hardcoded `/lashpop-images/services/thin/<slug>-icon.svg`; drawer card uses a different hardcoded map. DB value is selected but not visibly consumed. |
| Category key image (DAM) | `service_categories.keyImageAssetId` (via `updateServiceCategoryImage`) | not read anywhere I could find — neither `getServiceCategories` nor `getServiceCategoriesWithSubcategories` join to assets for category image; nothing in `src/components` resolves it | dead-read | The field is set but never resolved to an image URL on the frontend |
| Subcategory key image (DAM) | `service_subcategories.keyImageAssetId` (via `updateServiceSubcategoryImage`) | `actions/services.ts:121` falls back to this for service image (3rd priority) — reaches `ServiceCard`/`ServiceDetailClient` only when service has no Vagaro image AND no service-level DAM image | live (fallback) | Service-card subcategory tabs in the drawer (`SubcategoryTabs.tsx`) don't render this image — it's only inherited downward into services |
| Subcategory reorder (drag/drop in modal) | `service_subcategories.displayOrder` (via `updateSubcategoryDisplayOrders`) | used in `getAllServices()` order-by (`services.ts:131`) and drawer subcategory tab order | live |  |
| Asset → service tagging (auto when picking from "all images") | `asset_services` insert (via `tagAssetWithService`) | `getAssetsByServiceSlug(slug)` joins this for the per-service gallery on detail page | live |  |
| Category `displayOrder` (no admin UI) | not writable from admin | order-by | partial | Admin can't reorder categories |
| Category `isActive` (no admin UI) | not writable from admin | `WHERE isActive=true` filters everywhere | partial | Read-only filter |
| Subcategory `description`, `icon` (no admin UI) | not writable | not surfaced in obvious render path | partial |  |

**Anomalies**
- **The biggest one**: `ServicesSection.tsx` on the homepage NEVER receives DB-backed categories. `LandingPageV2Client.tsx:361` calls `<ServicesSection isMobile={isMobile} />` without passing `categories={...}`, so the component defaults to its built-in `defaultServiceCategories` array. Every category card on the homepage (title, tagline, description, icon path) is hardcoded source — the admin category content editor is effectively a no-op for the homepage. It only affects the drawer header (description) and the subcategory image-fallback chain (which surfaces in services drawer / per-service page).
- **Image priority inversion**: admin badge calls Vagaro images "Vagaro" and DAM-uploaded images "DAM Override" (`services/page.tsx:200-209`), but `actions/services.ts:118-122` puts Vagaro **first** in the COALESCE, so a "DAM Override" never overrides anything if Vagaro has the photo. The "Reset to Vagaro" button is a no-op in that state. This is a likely bug surfaced by the recent commit `4213fc1` (which started syncing service photos from Vagaro).
- **Hardcoded category whitelist**: `page.tsx:103` `allowedCategorySlugs = ['lashes','brows','facials','waxing','permanent-makeup','specialty','injectables']` filters categories before sending to client — note this whitelist diverges from the hardcoded landing-page list (which adds `'lash-lifts'`). Adding a category in the DB won't surface anywhere.
- **`subCategory` column** is notNull-adjacent (it's nullable but `mainCategory` is notNull) — `mainCategory` is required on insert, `subCategory` is dead in this codebase.
- **`displayTitle` and `subCategory` and `vagaroWidgetUrl`** are all selected by `getAllServices()` or `getServices()` (or via `services.name` alias for `displayTitle`) but nothing meaningful reads them.
- **No admin write path for** `services.name`, `services.description`, `services.subtitle`, `services.priceStarting`, `services.durationMinutes`, `services.displayOrder`, `services.color`, `services.isActive`, `services.vagaroServiceCode`. They're either Vagaro-sourced or set only at insert.
- **Category content editor write side-effects**: admin can edit `tagline`/`description`/`icon`. Description and icon work for the drawer; tagline is fully dead-read. Nothing warns the user.
- **DAM Explorer drives image picks** but stores `assetId` + a snapshot of `filePath` in `services.imageUrl`. If the asset is renamed/moved, the snapshot still wins until the admin clears it (because the resolve query joins on `keyImageAssetId` and pulls `filePath` from the asset, not from `services.imageUrl`).

---

## `/admin/website/team`

**Files**
- Admin page: `src/app/admin/website/team/page.tsx:1-2200+` (single client component; uses `Reorder.Group` for drag/drop, embeds `QuickFactsEditor`, `CredentialsEditor`, `MiniDamExplorer`)
- APIs:
  - `src/app/api/admin/website/team/route.ts` — `GET` (lists with Vagaro-derived categories), `PUT` (bulk isActive + displayOrder), `PATCH` (per-member: `manualServiceCategories`, `bio`, `funFact`, `credentials`, `imageUrl`)
  - `src/app/api/admin/website/team/quick-facts/route.ts` — `GET`, `POST`, `PUT`, `DELETE`, `PATCH` (reorder)
  - `src/app/api/admin/team/[id]/highlights/route.ts` — `GET`, `PUT`, `DELETE` (per-stylist review highlights, admin override of the editor worker)
  - `src/app/api/dam/team/[id]/photos` — POST/GET (referenced from admin page lines 204, 218 — adds album photos)
  - `src/app/api/dam/team/photos/[id]` — DELETE (line 248)
  - `src/app/api/dam/assets/remove-team` — POST (line 243, for DAM-tagged photos)
- Server actions also exist: `src/actions/team.ts` (`getTeamMembers`, `getTeamMembersWithServices`, `getTeamMembersByServiceId`, `getServicesForTeamMember`, `getQuickFactsForMember`)
- Vagaro sync writers:
  - `workers/vagaro-sync/src/sync.ts:93-121` (`syncTeamMember` via v2 employee API — overwrites `name`, `phone`, `email`, `vagaroData`)
  - `workers/vagaro-sync/src/sync.ts:183-324` (`syncPublicStaff` via public composite endpoint — overwrites `vagaroPhotoUrl`, `vagaroBio`, `displayOrder`, `isActive`, conditionally `phone`/`email`; can also INSERT new rows)
- DB tables:
  - `team_members` (`id`, `vagaroEmployeeId` unique, `vagaroData` jsonb, `vagaroPublicProviderId` unique, `vagaroPhotoUrl`, `vagaroBio`, `name`, `phone`, `email`, `role`, `type` enum, `businessName`, `bio`, `quote`, `instagram`, `instagramUrl`, `bookingUrl` notNull, `usesLashpopBooking`, `imageUrl` notNull, `specialties` jsonb, `favoriteServices` jsonb, `manualServiceCategories` jsonb, `funFact`, `availability`, `displayOrder` text, `isActive`, `showOnWebsite` [legacy], `credentials` jsonb, `createdAt`, `updatedAt`, `lastSyncedAt`)
  - `team_member_photos` (`id`, `teamMemberId` FK, `fileName`, `filePath`, `isPrimary`, 5 jsonb crop coordinates, 5 text crop URLs, `uploadedAt`, `updatedAt`)
  - `team_member_categories` (`teamMemberId`, `categoryId`) — junction
  - `team_quick_facts` (`id`, `teamMemberId` FK, `factType`, `customLabel`, `value`, `customIcon`, `displayOrder`, timestamps)
  - `team_member_highlights` (`id`, `teamMemberId` FK, `reviewId` FK, `rank` smallint, `editorNotes`, `createdAt`; unique on (member,review) and (member,rank))
  - `team_member_services` (`id`, `teamMemberId` FK, `serviceId`, `price`, `priceWithTax`, `durationMinutes`, `pointsGiven`, `pointsRedeem`, timestamps) — declared in schema
- Frontend consumers:
  - `src/app/page.tsx:31,63-99` — `getTeamMembersWithServices()` then mapped into `formattedTeamMembers` with Vagaro/local fallbacks, passed to `LandingPageV2Client`
  - `src/app/LandingPageV2Client.tsx:366` → `<EnhancedTeamSectionClient teamMembers={teamMembers} serviceCategories={serviceCategories} />`
  - `src/components/sections/EnhancedTeamSectionClient.tsx` — the big interactive team grid + modal (desktop and mobile drawer)
  - `src/components/portfolio/TeamPortfolioView.tsx` — a separate "portfolio" view triggered by orchestrator state (consumes `name`, `imageUrl`, `bio`, `specialties`, `funFacts`)
  - `src/components/sections/EnhancedTeamSectionServer.tsx` — server wrapper that also formats fields (`bio`, `quote`, `availability`, `instagram`, `bookingUrl`, `favoriteServices`, `funFact`)
  - `src/components/seo/LocalBusinessSchema.tsx:115` reads `teamMembers.role`
  - `src/app/llms.txt/route.ts:133-135` reads `teamMembers.role` and `teamMembers.bio`

**Fields**

| Admin field | Writes to | Frontend reader | Status | Notes |
|---|---|---|---|---|
| Drag-to-reorder | `team_members.displayOrder` (text) (via `PUT /api/admin/website/team`, batched) | order-by in `actions/team.ts:102` (cast to INTEGER), `page.tsx` ordering | partial | **Will be overwritten by Vagaro public-staff sync** (`workers/vagaro-sync/src/sync.ts:259`) which sets `displayOrder = EmployeeSortOrder` on every run. Admin reorder is effectively temporary. |
| Show/Hide on website (eye icon) | `team_members.isActive` (via `PUT /api/admin/website/team`) | `WHERE isActive=true` in `actions/team.ts:100`, `getTeamMembers`, all server-side filters | partial | Public-staff sync re-activates anyone present in the Vagaro response (`sync.ts:261`) and deactivates anyone missing. Admin "Hide" is only sticky if Vagaro stops returning that person. |
| Profile Image (DAM picker) | `team_members.imageUrl` (via `PATCH /api/admin/website/team` body `imageUrl`) | `page.tsx:71` — uses `member.vagaroPhotoUrl || member.imageUrl`; consumed in `EnhancedTeamSectionClient.tsx:770,1020,1798` etc. as `member.image` | partial | **Vagaro photo always wins** if present. Admin's DAM pick only renders for members where Vagaro hasn't supplied a photo. |
| Portfolio Album (add photos) | Multi-write: stores in `team_member_photos` (with `isPrimary=false`) AND/OR tags DAM assets with team relation | not directly read by `EnhancedTeamSectionClient`; portfolio view loads photos via different endpoint (orchestrator state in `TeamPortfolioView.tsx:35`) | partial | Two writes via two endpoints (`/api/dam/team/[id]/photos` POST and DAM tagging). Removal also splits by source. |
| Portfolio Album (remove photo) | Either `team_member_photos` DELETE or DAM untagging (`/api/dam/assets/remove-team`) | n/a | live |  |
| Service Tags - Vagaro (read-only display) | n/a (computed from `services.vagaroData.servicePerformedBy`) | `getTeamMembersWithServices()` builds `serviceCategories` array via `vagaroParentToTags()` mapping; consumed in `EnhancedTeamSectionClient.tsx:758-760,975,1287,1291,1711,1716` | live | Admin shows them locked; runtime maps Vagaro `parentServiceTitle` to chip labels |
| Service Tags - Manual (Add/Remove) | `team_members.manualServiceCategories` jsonb (via `PATCH /api/admin/website/team` body `manualServiceCategories`) | merged with Vagaro tags in `actions/team.ts:223-228`, dedup'd, sliced to 4; surfaced as `serviceCategories` | live |  |
| Quick Facts (add/edit/delete/reorder) | `team_quick_facts` rows (CRUD via `/api/admin/website/team/quick-facts`) | `actions/team.ts:127-159` fetches and groups; passed through `LandingPageV2Client` → `EnhancedTeamSectionClient.tsx:1308-1311,1734-1750` | live |  |
| Credentials editor (cert/license/training/award/education entries) | `team_members.credentials` jsonb (via `PATCH /api/admin/website/team` body `credentials`) | `EnhancedTeamSectionClient.tsx:24-50` `MemberCredentialsList` renders them inside member modal (lines 1284, 1708, 1852); JSON-LD via `LocalBusinessSchema.tsx` consumes for SEO | live |  |
| Bio (textarea editor) | `team_members.bio` (via `PATCH /api/admin/website/team` body `bio`) | `page.tsx:76` uses `member.vagaroBio || member.bio`; consumed in `EnhancedTeamSectionClient.tsx:1276-1279,1700-1703` and `TeamPortfolioView.tsx:369-381,576-579,739` | partial | **Vagaro `BusinessSummary` (synced into `vagaroBio`) always wins**. Admin bio is fallback only. |
| Highlight reels (per-stylist review pins) | `team_member_highlights` rows (via `PUT /api/admin/team/[id]/highlights` — replaces all with `editorNotes='__ADMIN_PINNED__'`) | Editor worker at `workers/reviews/src/editor.ts:241-271` respects `__ADMIN_PINNED__` and skips during rebuild | partial | **No frontend page reads `team_member_highlights` for display**. The admin UI for this isn't in `/admin/website/team` — there's no admin page at all under `src/app/admin` that calls this endpoint. The API exists; consumer doesn't. |
| `team_members.funFact` | written by `PATCH /api/admin/website/team` (the PATCH handler accepts `funFact`) | **The admin page itself never sends `funFact`** — only the QuickFactsEditor component fires PATCH and it uses the quick-facts route. So `funFact` is wired in the API but unreachable from the UI. Frontend reads it as a fallback when no quick facts exist (`EnhancedTeamSectionClient.tsx:1313-1320`, `1766-1773`, `1887`) | dead-write | API accepts the param but no admin code sends it. The field is consumed by frontend only when set from old data / direct DB edits. |
| `team_members.specialties` (jsonb array) | not written from admin UI | consumed heavily — `EnhancedTeamSectionClient.tsx:670+` derives category chips from specialties when Vagaro/manual chips are empty; `TeamPortfolioView.tsx:340,381-389,594` lists them | partial | Read by frontend, no admin editor exists. Set only at insert or via direct DB. |
| `team_members.role` | not written from admin UI | rendered in card subtitle (`EnhancedTeamSectionClient.tsx:533`); read in `llms.txt/route.ts` and `LocalBusinessSchema.tsx` | partial | No admin editor |
| `team_members.businessName` | not written from admin UI | shown as Independent label fallback (`EnhancedTeamSectionClient.tsx:534,907,1041,1255`) | partial | No admin editor |
| `team_members.quote` | not written from admin UI | rendered in `EnhancedTeamSectionClient.tsx:1855-1858` (older modal layout) | partial | No admin editor |
| `team_members.instagram` | not written from admin UI | rendered as IG link / handle (`EnhancedTeamSectionClient.tsx:913,1049,1254,1479,1642,1902` via `parseInstagramHandles`) | partial | No admin editor |
| `team_members.instagramUrl` (override) | not written from admin UI | passed to `parseInstagramHandles` alongside `instagram` | partial | No admin editor |
| `team_members.bookingUrl` (notNull) | not written from admin UI | passed through to orchestrator/booking flow; vagaro-sync uses `'https://www.vagaro.com/lashpop32'` as default at insert (`sync.ts:287`) | partial | No admin editor |
| `team_members.phone` (notNull) | not written from admin | overwritten conditionally by both Vagaro syncs | vagaro-overwritten | Shown in admin row but not editable |
| `team_members.email` | not written from admin | overwritten conditionally by both Vagaro syncs | vagaro-overwritten | Shown in admin row but not editable |
| `team_members.name` (notNull) | not written from admin | overwritten every Vagaro sync (employee API and public-staff) | vagaro-overwritten |  |
| `team_members.type` enum (employee/independent) | not written from admin UI | branches rendering between "employee" and "independent" labels | partial | No admin editor; locked to insert-time value |
| `team_members.vagaroPhotoUrl` | not writable (Vagaro public-staff sync only) | priority #1 in `page.tsx:71` | live | Vagaro source of truth |
| `team_members.vagaroBio` | not writable (Vagaro public-staff sync only) | priority #1 in `page.tsx:76` | live | Vagaro source of truth |
| `team_members.vagaroEmployeeId` / `.vagaroData` / `.vagaroPublicProviderId` | not writable from admin | used by `actions/team.ts` to derive Vagaro service categories and by syncs to match rows | live | Identity tracking |
| `team_members.favoriteServices` jsonb | not written from admin | declared in TS interface (`LandingPageV2Client.tsx:79`, `EnhancedTeamSectionClient.tsx:257`) but never rendered | dead-read | Type-tracked, never displayed |
| `team_members.availability` | not written from admin | declared in interface (`EnhancedTeamSectionClient.tsx:253`) but never rendered there; `TeamSection.tsx:80` (older deprecated component) does render it | dead-read | Effectively dead in the v2 layout |
| `team_members.usesLashpopBooking` (notNull, default true) | not written from admin | not consumed anywhere outside the schema | dead column |  |
| `team_members.showOnWebsite` (default true, "legacy" per comment) | not written from admin | not consumed — `showOnWebsite` references in code all target the `reviews` table | dead column | Schema comment confirms legacy |
| Quick facts: `factType`, `value`, `customLabel`, `customIcon`, `displayOrder` | `team_quick_facts.*` (via `POST`/`PUT`/`DELETE`/`PATCH`) | `EnhancedTeamSectionClient.tsx:1308-1320,1734-1773` via `QuickFactsGrid` component | live |  |
| Team photo crops (cropSquareUrl, cropCloseUpCircleUrl, cropMediumCircleUrl, cropFullVerticalUrl) | `team_member_photos.crop*Url` columns — written via image-cropping tool that isn't in `/admin/website/team` (e.g. `/admin/scrollytelling` or `/staffphoto`) | `actions/team.ts:127-150` fetches primary photo crops; passed through `page.tsx:95-98`; consumed in `EnhancedTeamSectionClient.tsx:770` (`member.cropSquareUrl` as fallback when `member.image` is empty) | partial | Admin page surfaces "Portfolio Album" but not crop editing. The crops are read but `member.image` (Vagaro) almost always wins, so `cropSquareUrl` is a tertiary fallback. |
| `team_member_photos` rows (album add/remove) | `team_member_photos` direct rows OR DAM tagging (depending on source) | loaded into `albumPhotos` state in admin only; **portfolio view fetches them separately via orchestrator** — not confirmed they share the same backing source | partial | Two storage paths (DB rows vs DAM tags) make data location ambiguous |
| `team_member_categories` junction (`teamMemberId`, `categoryId`) | not written anywhere in src/ or workers | not read anywhere except schema/index re-exports | dead table | Schema defined; zero consumers |
| `team_member_services` junction (price/duration overrides per provider) | not written anywhere in src/ or workers | not read | dead table | Schema defined; zero consumers |
| `team_member_highlights` rows (rank, reviewId, editorNotes) | admin endpoint exists (`PUT /api/admin/team/[id]/highlights`); editor worker writes via raw SQL (`workers/reviews/src/editor.ts:271`) | **No frontend consumer** — searched `src/app`, `src/components`, `src/actions` for `team_member_highlights` / `teamMemberHighlights` outside of admin/schema. The pinning system exists end-to-end on the backend but no public page renders it. | dead-read (frontend) | Big finding: this entire pipeline (admin API + editor pass + DB table) produces output nothing reads. The admin UI for it also doesn't exist as a page. |

**Anomalies**
- **Two competing identity stores for Vagaro**: `vagaroEmployeeId` (from v2 API, employee endpoint) and `vagaroPublicProviderId` (from public composite-staff endpoint). The two syncs operate independently and can both write to the same row (each updates a different subset of fields). The PATCH admin endpoint never reads either.
- **Admin reorder is non-durable**: Vagaro public-staff sync re-writes `displayOrder` from `EmployeeSortOrder` on every run (`workers/vagaro-sync/src/sync.ts:259`). The admin Save → reorder → Save loop will work only between syncs. No UI surface warns the user.
- **Profile image admin write is shadowed**: `imageUrl` is the legacy/local field. Frontend always prefers `vagaroPhotoUrl`. Setting `imageUrl` in admin only matters for the ~zero providers without a Vagaro photo.
- **Bio admin write is shadowed**: same pattern — `vagaroBio || bio`.
- **`funFact` PATCH is unreachable**: the API accepts it but no UI control posts it. Dead write path. Frontend still uses it as a quick-facts fallback when set from older data.
- **No admin editor for** `role`, `businessName`, `quote`, `instagram`, `instagramUrl`, `bookingUrl`, `type`, `specialties`, `favoriteServices`, `availability`, `email`, `phone`. These are either set at row creation (Vagaro insert path uses defaults) or via direct DB writes.
- **`favoriteServices` and `availability` are dead-read in v2** — they're declared on the TS interface chain (`page.tsx:82`, `LandingPageV2Client.tsx:76,79`, `EnhancedTeamSectionClient.tsx:253,257`) but never rendered. The older `TeamSection.tsx` did consume `availability`; the new `EnhancedTeamSectionClient` doesn't.
- **`showOnWebsite` and `usesLashpopBooking` are dead columns** on team_members. Schema confirms `showOnWebsite` is "Legacy column - preserved for data."
- **`team_member_categories` and `team_member_services` are zombie tables** — defined in schema, exported from `db/index.ts`, but no writer or reader in this repo.
- **`team_member_highlights` pipeline runs in a closet**: editor worker computes them weekly, admin API can override, but no public page renders them. Building this took meaningful effort (see commit `8ad09bb` for related recency-decay work) — needs verification that there's not an intended consumer pending wiring.
- **Quick-facts editor merges into `quickFacts` array** but `funFact` (singular column) is rendered as fallback. These two systems coexist with no migration path in the admin.
- **Album storage is bifurcated**: photos can live in `team_member_photos` (direct DB row, via `/api/dam/team/[id]/photos`) OR as DAM assets tagged with team-member relation. Removal branches on `photo.source` (`page.tsx:239`) but the GET endpoint returns both with a `source` discriminator. Risk: orphaned rows if the discriminator is wrong, and admin upload-time choice of storage path isn't surfaced to the user.
- **DAM Explorer trust boundary**: `MiniDamExplorer` for the profile image stores the asset's `filePath` directly into `team_members.imageUrl`. If the asset is later renamed/deleted, the cached path stays. No FK enforces integrity.
- **Vagaro sync can INSERT new team_members** without admin involvement (`workers/vagaro-sync/src/sync.ts:278-294`) — these arrive with `role='Lash Artist'`, `type='employee'`, the global `bookingUrl`, and `imageUrl='/placeholder-team.svg'` until edited.

---

## Cross-section observations

- All three sections use `MiniDamExplorer` and (for services) `ServiceHeroImagePicker` to write **`assetId` + snapshotted `filePath`** into target rows. There is no FK from these snapshots back to `assets`, so DAM hygiene operations (rename/delete) can silently break frontend rendering.
- Hero uses jsonb-in-`website_settings`; team/services use first-class tables. The hero pattern is harder to query/index but simpler to evolve schema-wise.
- Vagaro is the overwriting source for `team_members.{name, phone, email, vagaroPhotoUrl, vagaroBio, displayOrder, isActive}` and for `services.{name, description, durationMinutes, priceStarting, vagaroImageUrl}` (plus one-shot `subtitle` on insert). Any admin edit on those columns is best-case temporary.
- "Reset" semantics differ: for services there's an explicit "Reset to Vagaro" button; for team there's no analog (Vagaro just always wins via `||` fallback chain in `page.tsx`).
