# Simple CMS Sections — Admin → Frontend Mapping

Covers four `/admin/website/*` subpages: **faq**, **founder-letter**, **seo**, **work-with-us**.

---

## `/admin/website/faq`

**Files**
- Admin: `src/app/admin/website/faq/page.tsx:1-712` (client component, fetches from `/api/admin/website/faqs`)
- APIs / actions:
  - `src/app/api/admin/website/faqs/route.ts:1-177` — `GET` (list), `POST` (create category|item), `PUT` (update category|item), `DELETE` (`?type=category|item&id=…`)
  - `src/actions/faqs.ts:1-179` — `getFAQCategories`, `getFAQItems`, `getFAQsGroupedByCategory`, `getFeaturedFAQs` (read-only server actions consumed by the frontend)
- DB tables:
  - `faq_categories` (`id`, `name`, `display_name`, `description`, `display_order`, `is_active`, `created_at`, `updated_at`) — `src/db/schema/faqs.ts:7-22`
  - `faq_items` (`id`, `category_id`, `question`, `answer` *(HTML)*, `display_order`, `is_active`, `is_featured`, `created_at`, `updated_at`) — `src/db/schema/faqs.ts:28-48`
- Frontend consumers:
  - `src/app/page.tsx:6,36` — homepage loader calls `getFAQsGroupedByCategory()` and passes as `faqData` prop
  - `src/app/LandingPageV2Client.tsx:23,384-388` — dynamic-imports `FAQSection`, hands it `categories`, `itemsByCategory`, `featuredItems`
  - `src/components/landing-v2/sections/FAQSection.tsx:85-473` — renders the on-page accordion (Top FAQs / All FAQs / per-category chips); item answers go through `dangerouslySetInnerHTML`
  - `src/components/seo/FAQSchema.tsx:18-63` — JSON-LD `FAQPage` schema, rendered in `src/app/layout.tsx:129`. Reads `faqItems.question/answer` directly, **bypasses the `getFAQs*` actions**, and ignores `isFeatured`/`categoryId`
  - `src/app/llms.txt/route.ts:196-211` — top 30 active FAQs embedded in the llms.txt response
  - `src/components/landing-v2/sections/FooterV2.tsx:301-303` — `<Link href="/?openFaq=cancellation-policy#faq">` deeplinks into the section; matched in `FAQSection.tsx:102-156` by slugifying `question`

**Fields**

| Admin field | Writes to | Frontend reader | Status | Notes |
|---|---|---|---|---|
| Category › Name (textbox labelled "Name") | `faq_categories.display_name` via `POST /api/admin/website/faqs` | `FAQSection.tsx:227` (chip label), `FAQSection.tsx:420` (badge above question) | live | UI label says "Name", but it actually writes `displayName`. The DB column `name` is **never written by the admin** — see Anomalies. |
| Category › Description | `faq_categories.description` | none | dead-read | Stored but no component reads it. `getFAQCategories` returns it; nothing renders it. |
| Category › visibility toggle (eye icon) | `faq_categories.is_active` via `PUT` | `actions/faqs.ts:40,83,143` filters where `isActive=true` before passing to `FAQSection` | live | |
| Category › edit / delete | `faq_categories` row via `PUT`/`DELETE` | n/a (deletes cascade to `faq_items`) | live | |
| Item › Question | `faq_items.question` via `POST`/`PUT` | `FAQSection.tsx:423`, `FAQSchema.tsx:49`, `llms.txt/route.ts:208` | live | |
| Item › Answer (rich-text/HTML via `MiniRichEditor`) | `faq_items.answer` | `FAQSection.tsx:465` (`dangerouslySetInnerHTML`), `FAQSchema.tsx:52`, `llms.txt/route.ts:209` | live | Answers can contain HTML; FAQSection has a special `enhanceTabularLists` post-processor that detects `Label: Value` lists and renders them as menu-style rows. |
| Item › Featured toggle (⭐) | `faq_items.is_featured` | `getFAQsGroupedByCategory` builds `featuredItems` (`actions/faqs.ts:101-117`), shown as "Top FAQs" chip in `FAQSection.tsx:225` | live | Default-active tab. |
| Item › Active toggle (eye) | `faq_items.is_active` | filtered out by `actions/faqs.ts:59`, `FAQSchema.tsx:28`, `llms.txt/route.ts:202` | live | |
| Item › displayOrder (implicit, set on insert) | `faq_items.display_order` | sorted in `actions/faqs.ts:60,91,155` | partial | New items get `displayOrder = categoryItems.length` at creation. **No drag-to-reorder UI is wired** even though `Reorder` and `GripVertical` are imported (`page.tsx:4,19`). |
| Category displayOrder (implicit) | `faq_categories.display_order` | sorted in `actions/faqs.ts:41,84,143` | partial | Same as above — set once on create, no UI to change later. |

**Anomalies**
- **API crash on category create.** `POST /api/admin/website/faqs` (route.ts:49) reads `data.name.toLowerCase().replace(/\s+/g, '_')`, but the admin's `createCategory` (`page.tsx:78-108`) only sends `displayName` and `description`. Calling `.toLowerCase()` on `undefined` will throw. Either the API has never been exercised on a fresh category, or it's been silently failing. The `faq_categories.name` column is `notNull().unique()` — schema enforces it, admin never supplies it.
- **`faq_categories.description` is dead-read.** Admin form collects it (`page.tsx:55,378-385`), API stores it, no frontend renders it.
- **Two parallel read paths.** `actions/faqs.ts` is the canonical read used by `page.tsx`, but `FAQSchema.tsx` and `llms.txt/route.ts` query `faqItems` directly. If anyone adds soft-delete logic or category-active filtering to the action, the schema/LLM exports won't pick it up.
- **FAQ deeplink contract.** `FooterV2.tsx:301` links to `?openFaq=cancellation-policy`, which `FAQSection.tsx:109-128` resolves by slugifying `faq.question` (kebab-case). If admin renames the question to anything other than "Cancellation Policy" the footer link silently breaks — there's no admin warning. **No other deeplinks exist** (`grep openFaq` returns only this one).
- **Hardcoded contact info in FAQSection** (`FAQSection.tsx:351,360,369`): `tel:+17602120448`, `sms:+17602120448`, `mailto:lashpopstudios@gmail.com`. These duplicate the SEO admin's `site.phone` / `site.email` but are not wired to them.
- **Hardcoded section title "FAQ"** at `FAQSection.tsx:248` — no admin control.
- **Tip copy in admin** at `page.tsx:704-706` ("Mark FAQs as 'Featured' (⭐) …") is admin-only chrome — fine, not user-facing.

---

## `/admin/website/founder-letter`

**Files**
- Admin: `src/app/admin/website/founder-letter/page.tsx:1-156` (client-only stub; preview tab + "source" tab showing hardcoded pseudo-JSX)
- APIs / actions: **none.** No `POST`/`PUT`/`DELETE` handler exists. No server action references "founder" or "letter" anywhere outside the admin page (`grep founder src/actions src/app/api` returns no matches).
- DB tables: **none used.** No `website_settings` key for founder content. No row would ever be written because nothing calls a write path.
- Frontend consumers:
  - `src/app/LandingPageV2Client.tsx:16,173,264,351` — accepts an optional `founderLetterContent` prop and forwards to `<FounderLetterSection content={…} />`
  - `src/components/landing-v2/sections/FounderLetterSection.tsx:1-160` — the actual section. Uses `content || defaultContent` (fallback hardcoded at lines 18-27).

**Fields**

| Admin field | Writes to | Frontend reader | Status | Notes |
|---|---|---|---|---|
| (none — view-only) | — | — | dead-write | Admin page renders a static preview and a "Source" pseudo-code box. The "Save" / "Edit" affordances on every other admin section are absent. Admin's own footer note: *"The Founder Letter is currently static HTML. To make it editable, we can create a CMS entry or database table for this content. For now, edit the source component directly."* (`page.tsx:143-149`) |

**Anomalies**
- **Entire section is non-functional CMS.** Admin page is purely informational; users cannot edit anything from `/admin/website/founder-letter`. `LandingPageV2Client.tsx:173` declares the `founderLetterContent` prop slot, but `src/app/page.tsx` never passes it, so the component always falls back to the hardcoded copy in `FounderLetterSection.tsx:18-27`.
- **Admin preview does not match the live component.** Admin preview shows a centered card with a 👩 emoji avatar, a "Welcome to LashPop Studios — a space where beauty meets artistry" pull-quote and a paragraph about "founded LashPop in Oceanside" (`page.tsx:65-95`). The live `FounderLetterSection` renders a full-bleed `founder-letter-bg.jpg` background, the text "I'm so glad you're here.", three paragraphs about the 2016 launch, and an Emily signature image (`FounderLetterSection.tsx:33-156`). **The admin preview is misleading.**
- **All copy in `FounderLetterSection.tsx` is hardcoded and should be admin-controlled if this admin page is ever activated:**
  - Section h2 "Welcome to LashPop Studios" (`:60`, `:122-127`)
  - Greeting (`:19`)
  - Three body paragraphs (`:21-23`)
  - SignOff "Xo," + signature "Emily" (`:25-26`)
  - Background image paths `/lashpop-images/founder-letter-bg.jpg` (`:41`) and `/lashpop-images/founder-letter-bg-mobile.webp` (`:107`)
  - Signature image paths `/lashpop-images/emily-signature-2.webp/png` (`:73-75`, `:144-146`)
  - Alt text "Emily in studio archway" (`:43`), "Emily at LashPop Studios" (`:109`), "Xo, Emily" (`:77`, `:148`)
- The component already has a typed `FounderLetterContent` interface (`:6-11`) ready to be wired to a `website_settings` row keyed e.g. `founder_letter`. The hookup just doesn't exist.

---

## `/admin/website/seo`

**Files**
- Admin: `src/app/admin/website/seo/page.tsx:1-1198` (client component; 4 tabs: Site / Homepage / Services / Work With Us)
- APIs / actions:
  - `src/app/api/admin/website/seo/route.ts:1-103` — `GET` (read full `SEOSettings`), `PUT` (replace full settings; revalidates `/`, `/services`, `/work-with-us`)
  - `src/actions/seo.ts:1-53` — `getSEOSettings`, `getSiteSEO`, `getPageSEO('homepage'|'services'|'workWithUs')` (read-only, public site)
- DB tables:
  - `website_settings` with `section = 'seo_metadata'` (single row) — `src/db/schema/website_settings.ts:7-19`
  - `config` jsonb holds the entire `SEOSettings` blob (`src/types/seo.ts:116-125`): `site` (business info, social, credentials, default images, llmsTxtIntro) plus `pages.homepage | pages.services | pages.workWithUs`
- Frontend consumers:
  - `src/app/layout.tsx:7,52-107,109-131` — root `generateMetadata` consumes `site` + `pages.homepage` (title, metaDescription, ogImage, twitterImage, canonical, robots index/follow). Renders `<WebSiteSchema>`, `<LocalBusinessSchema>`, `<FAQSchema>`, `<ServicesSchema>` in `<head>` using `settings.site`
  - `src/app/page.tsx:8,38,119` — homepage fetches `getSEOSettings()` and passes `seoSettings.site` to `<ReviewSchema>`
  - `src/app/robots.ts:2,13-82` — uses `settings.site.siteUrl` for sitemap reference
  - `src/app/sitemap.ts:2,18-102` — uses `settings.site.siteUrl` as URL base; sitemap entries are otherwise generated from `services` / `service_categories`
  - `src/app/llms.txt/route.ts:2,20-237` — extensive consumer of `site.*` (businessName, businessDescription, llmsTxtIntro, phone, email, siteUrl, socialProfiles)
  - `src/components/seo/WebSiteSchema.tsx:8-37` — `siteName`, `siteUrl`, `businessDescription`
  - `src/components/seo/LocalBusinessSchema.tsx:16-368` — `businessName`, `businessDescription`, `businessType`, `phone`, `email`, `siteUrl`, `siteName`, `logo`, `socialProfiles` (joined into `sameAs`), `credentials`. Also joins to `business_locations`, `reviews` aggregate, and `team_members.credentials` for E-E-A-T.
  - `src/components/seo/ServicesSchema.tsx:22-114` — `businessName`, `siteUrl`
  - `src/components/seo/ReviewSchema.tsx` — `siteSettings.site` (used in `page.tsx:119`)

**Fields — Site tab (`site` subtree)**

| Admin field | Writes to | Frontend reader | Status | Notes |
|---|---|---|---|---|
| Business Name | `website_settings['seo_metadata'].site.businessName` | `LocalBusinessSchema.tsx:182`, `ServicesSchema.tsx:73`, `llms.txt/route.ts:27`, fallback for `<title>` in `layout.tsx:76` | live | |
| Business Type (schema.org dropdown) | `…site.businessType` | `LocalBusinessSchema.tsx:180,281` (`@type`) | live | Options at `types/seo.ts:184-191`. |
| Business Description | `…site.businessDescription` | `layout.tsx:77,94,103`, `WebSiteSchema.tsx:23`, `LocalBusinessSchema.tsx:183,283`, `llms.txt/route.ts:33` | live | |
| Site URL | `…site.siteUrl` | `layout.tsx:79,81,96`, `robots.ts:15`, `sitemap.ts:20`, all schema components, `llms.txt/route.ts:53` | live | |
| Site Name | `…site.siteName` | `layout.tsx:90,98`, `WebSiteSchema.tsx:21`, `LocalBusinessSchema.tsx:90` (in interface) | live | |
| Phone | `…site.phone` | `LocalBusinessSchema.tsx:185,286`, `llms.txt/route.ts:48,218` | live | **Hardcoded duplicate in `FAQSection.tsx:351,360`** (`+17602120448`) and `FounderLetterSection`-adjacent footer — see Anomalies. |
| Email | `…site.email` | `LocalBusinessSchema.tsx:186,287`, `llms.txt/route.ts:51` | live | **Hardcoded duplicate in `FAQSection.tsx:369`** (`lashpopstudios@gmail.com`). |
| Social Profiles: instagram | `…site.socialProfiles.instagram` | `LocalBusinessSchema.tsx:143,223,318` (joined into `sameAs`), `llms.txt/route.ts:67-72` | live | |
| Social Profiles: facebook / tiktok / twitter / yelp / pinterest | same path under `socialProfiles` | same readers | live | |
| Business Credentials (array of `{type,name,issuer,licenseNumber,dateIssued,url}`) | `…site.credentials[]` | `LocalBusinessSchema.tsx:240-250,333-344` → JSON-LD `hasCredential` | live | Not publicly rendered, schema-only. |
| Logo | `…site.logo` (`SEOImage` with `assetId`, `url`, `alt`, `position`) | `layout.tsx` does NOT use logo; `LocalBusinessSchema.tsx:190-196,299-305` uses it as `logo.url` + `image` | partial | `position.x/y` is stored but no reader honors crop positions. `alt` is set to `asset.fileName` on pick (`page.tsx:181`) and never editable. |
| Default OG Image | `…site.defaultOgImage` | `layout.tsx:62` (fallback when homepage OG image absent) | live | Same caveat re: `position` unused. |
| Default Twitter Image | `…site.defaultTwitterImage` | `layout.tsx:69` (fallback when homepage Twitter image absent) | live | |
| llms.txt Introduction | `…site.llmsTxtIntro` | `llms.txt/route.ts:30-34` | live | When blank, fallback wraps `businessDescription` in `> …`. |

**Fields — Homepage / Services / Work With Us tabs (`pages.<key>` subtree)**

| Admin field | Writes to | Frontend reader | Status | Notes |
|---|---|---|---|---|
| Page Title | `…pages.homepage.title` | `layout.tsx:76,93,102` | live | |
| Page Title | `…pages.services.title` | **none** | dead-write | `src/app/services/[slug]/page.tsx:11-25` is the only `generateMetadata` on that branch and it builds `${service.name} | Lash Pop` from `services.name`. There is no `/services` index `page.tsx` (`find src/app/services -type f` shows only `[slug]/page.tsx` and `[slug]/ServiceDetailClient.tsx`). |
| Page Title | `…pages.workWithUs.title` | **none** | dead-write | `src/app/work-with-us/page.tsx` has no `generateMetadata` export (`grep metadata` returns nothing). Page will inherit root `<title>` from `layout.tsx`. |
| Meta Description | `…pages.homepage.metaDescription` | `layout.tsx:77,94,103` | live | |
| Meta Description (services/workWithUs) | `…pages.*.metaDescription` | none | dead-write | Same reason as above. |
| Canonical URL | `…pages.homepage.canonicalUrl` | `layout.tsx:81` | live | |
| Canonical URL (services/workWithUs) | `…pages.*.canonicalUrl` | none | dead-write | |
| No Index / No Follow | `…pages.homepage.noIndex` / `noFollow` | `layout.tsx:84,85` (root robots meta) | partial | Applied site-wide via root layout; `services` and `workWithUs` toggles don't affect their pages because they have no `generateMetadata`. |
| OG Title / Description / Type | `…pages.homepage.og*` | `layout.tsx:93,94,97` | live | |
| OG Title / Description / Type (services/workWithUs) | `…pages.*.og*` | none | dead-write | |
| OG Image | `…pages.homepage.ogImage` | `layout.tsx:59-63` | live | |
| OG Image (services/workWithUs) | `…pages.*.ogImage` | none | dead-write | |
| Twitter Title / Description / Card | `…pages.homepage.twitter*` | `layout.tsx:101-104` | live | |
| Twitter Title / Description / Card (services/workWithUs) | `…pages.*.twitter*` | none | dead-write | |
| Twitter Image | `…pages.homepage.twitterImage` | `layout.tsx:67-72` | live | |
| Twitter Image (services/workWithUs) | `…pages.*.twitterImage` | none | dead-write | |

**Anomalies**
- **Three of the four admin tabs are dead-write.** Only the Site and Homepage tabs are wired. The Services and Work With Us tabs let users author titles, descriptions, OG/Twitter images, robots flags, canonical URLs — **none of which are ever read.**
  - Fix would require: (a) adding `generateMetadata` to `src/app/work-with-us/page.tsx` consuming `getPageSEO('workWithUs')`; (b) creating `src/app/services/page.tsx` (or wiring the existing `[slug]/page.tsx`) to consume `getPageSEO('services')` and/or per-slug metadata.
  - The existing `getPageSEO` action (`actions/seo.ts:46`) is itself unused — `grep getPageSEO` returns only its definition.
- **Logo not consumed by `<head>`.** Admin uploads a logo via DAM picker, but `layout.tsx`'s `generateMetadata` never emits a favicon, apple-touch-icon, or any `<link rel="icon">` from it. Only `LocalBusinessSchema` references it. There's no `src/app/icon.png`/`src/app/apple-icon.png` either.
- **`SEOImage.position.x/y` and `alt` are silently dropped.** Admin's DAM picker sets `alt = asset.fileName` (`page.tsx:181`) and `position = {x:50, y:50}` (`:182`), but no consumer renders position-based cropping or uses the alt for anything beyond schema. The admin UI doesn't even let the user edit alt.
- **Sitemap is mostly hardcoded.** Despite the admin allowing per-page metadata, `sitemap.ts:24-50` hardcodes `/`, `/services`, `/work-with-us`, `/llms.txt`. It doesn't honor `noIndex` flags.
- **`pages` index signature.** `SEOSettings.pages` is typed `[key: string]: PageSEO` (`types/seo.ts:122`), so technically arbitrary page slugs could be stored — but no admin UI exposes that and no consumer iterates dynamic page keys.
- **Section key `seo_metadata` is unique** — no collision with hero (`hero_archway`), instagram (`instagram_carousel`), reviews (own `review-settings` key), hero-slideshow (`hero_slideshow_assignments`, `hero_slideshow_presets`).
- **No `keywords` UI** despite `PageSEO.keywords?: string[]` being defined (`types/seo.ts:30`); `layout.tsx:78` instead hardcodes the keyword string `'lash extensions, eyelash extensions, …'`.

---

## `/admin/website/work-with-us`

**Files**
- Admin: `src/app/admin/website/work-with-us/page.tsx:1-375` (client component; manages **carousel photos only**)
- APIs / actions:
  - `src/actions/work-with-us-carousel.ts:1-136` — server actions: `getAllCarouselPhotos`, `getEnabledCarouselPhotos`, `addCarouselPhoto`, `toggleCarouselPhotoEnabled`, `deleteCarouselPhoto`, `reorderCarouselPhotos`
  - `src/actions/work-with-us.ts:1-199` — **completely separate** server action `submitWorkWithUsForm` that POSTs to `https://mox-api.experialstudio.com/api/v1/emails/send` (env: `MOX_API_URL`, `MOX_API_KEY`). Sends formatted HTML/text to `lashpopstudios@gmail.com` (BCC `me@coreydylan.net`). **No DB write, no admin surface for the form submissions themselves.**
- DB tables:
  - `work_with_us_carousel_photos` (`id`, `asset_id`, `sort_order`, `is_enabled`, `created_at`, `updated_at`) — `src/db/schema/work_with_us_carousel.ts:7-22`
  - Joins to `assets` table to fetch `filePath`, `fileName` (`actions/work-with-us-carousel.ts:28-34`)
  - `form_responses` table exists (`src/db/schema/form_responses.ts`) but is **unrelated to this admin section** — it's populated by Vagaro sync (`src/lib/vagaro-sync-all.ts:11,221-232`), not by work-with-us form submissions.
- Frontend consumers:
  - `src/app/work-with-us/page.tsx:1-1222` — the live page. Hardcoded content (benefits, pricing, copy, values) + form submission via `submitWorkWithUsForm`.
  - `src/components/work-with-us/TeamCarousel.tsx:1-143` — client carousel rendering the photos. Imports `getEnabledCarouselPhotos` and fetches on mount if `photos` prop missing (`:22-29`). Embla autoscroll. Used at `work-with-us/page.tsx:1042` as `<TeamCarousel />` with no props.
  - `src/components/work-with-us/TeamCarouselServer.tsx:1-12` — server wrapper that preloads photos via the action. **Defined but never imported anywhere** (`grep TeamCarouselServer src/` returns only its own file).

**Fields**

| Admin field | Writes to | Frontend reader | Status | Notes |
|---|---|---|---|---|
| Add photo (DAM picker → asset) | `work_with_us_carousel_photos.asset_id` (+ `sort_order = max+1`, `is_enabled = true`) | `TeamCarousel.tsx:78-85` renders `<Image src={item.filePath}>` (filePath comes from joined `assets` row) | live | |
| Toggle enabled (eye icon) | `work_with_us_carousel_photos.is_enabled` | `getEnabledCarouselPhotos` filters where `isEnabled=true` (`actions/work-with-us-carousel.ts:49`) | live | |
| Delete photo | row deletion | n/a | live | |
| Reorder | `work_with_us_carousel_photos.sort_order` | `getEnabledCarouselPhotos` orders by `sortOrder` asc (`:50`) | dead-write | `reorderCarouselPhotos` action exists and is imported in the admin (`page.tsx:23`), but **no UI calls it**. `GripVertical` icon is imported (`:13`) but never rendered in JSX. Photos display in insertion order indefinitely. |

**Anomalies**
- **Admin only controls one carousel.** Everything else on `/work-with-us` is **hardcoded in the page component** (`src/app/work-with-us/page.tsx`):
  - Hero subhead "Find Your Place at LashPop" + "Three paths to be part of something special…" (`:535-540`)
  - The three path cards `employee` / `booth` / `training` (`:480-509`), each with hardcoded `title`, `description`, and `image: '/lashpop-images/culture/…'`
  - `employeeBenefits` array of 16 benefits (`:96-113`) — title, description, icon
  - `boothBenefits` array of 21 benefits (`:116-138`)
  - Booth pricing function `getBoothPricing(days)` with hardcoded $55/$65/$70/$75 station tiers and $65/$75/$80/$85 private tiers (`:141-146`)
  - Specialties list (`:149-152`)
  - 4-step "How to Join" flow ("Apply", "Coffee Date", "Skills Check", "Welcome") (`:639-647`, `:816-822`, `:838-843`)
  - Training "What You'll Learn" / "What You'll Get" lists (`:732-737`, `:743-749`, `:988-993`, `:999-1004`)
  - "The LashPop Way" hero quote (`:1058-1063`)
  - All nine "Core Values" cards (`:1086-1132`)
  - "Client Experience" tagline quote and word chips (`:1184-1199`)
- **Form submissions are external.** `submitWorkWithUsForm` (`actions/work-with-us.ts:160-198`) calls Mox API directly. Admin has no inbox, no log, no history of who applied. Email recipient `lashpopstudios@gmail.com` and BCC `me@coreydylan.net` are hardcoded (`:28-29`).
- **`form_responses` table is misleading.** It exists for Vagaro intake forms (`vagaro-sync-all.ts`), not work-with-us submissions. Anyone hunting for past applications via that table will find nothing.
- **`TeamCarouselServer` is dead code.** Defined and never imported; the live page uses the client variant that re-fetches on mount.
- **Hardcoded photo paths** under `/public/lashpop-images/culture/` (`join-our-team.webp`, `booth-rental.webp`, `training.webp`, `team-front-desk.jpeg`, `team-lounge.jpg`) are not editable from any admin section.
- **No `generateMetadata`** on `work-with-us/page.tsx`, so the SEO admin's "Work With Us" tab values are dropped (see SEO section anomalies).

---

## Cross-section observations

- **`website_settings` keys touched in this audit:** only `seo_metadata`. No key collision with sibling admin pages (`hero_archway`, `hero_slideshow_assignments`, `hero_slideshow_presets`, `instagram_carousel`, and `review-settings`'s own key).
- **Duplicate contact info** lives in three places: SEO admin `site.phone`/`site.email` (live), `FAQSection.tsx` hardcoded `tel:`/`sms:`/`mailto:` links, and `FooterV2.tsx`. Changing the phone number from the SEO admin only updates schema/llms.txt — the visible CTA buttons in FAQ won't change.
- **Two of the four admin pages have substantial dead-write surface area:** founder-letter is 100% dead-write (no API exists), and seo's Services + Work With Us tabs are dead-write (no `generateMetadata` consumers).
- **FAQ create-category endpoint has a likely runtime bug** (`route.ts:49` reads `data.name` which admin never sends) — worth verifying against production logs.
