# Part 2 — Frontend Gap Inventory

Walk through every public page/component and flag content that is **hardcoded but should be admin-controlled**, plus **dead admin fields** (the admin lets you write the value but nothing reads it) and **dead frontend** (component never rendered).

Gathered by walking the render tree from `src/app/page.tsx`, `src/app/services/[slug]/page.tsx`, `src/app/work-with-us/page.tsx`.

---

## A. Critical cross-cutting gap: "Studio Info" lives in 10+ files

The studio's identity — name, address, phone, email, social URLs, booking URL — is hardcoded in **every component that needs it**, rather than coming from a single `website_settings.studio.*` block.

### Contact info hardcoded duplicates

| Value | Locations |
|---|---|
| `(760) 212-0448` / `+1 (760) 212-0448` / `760-212-0448` | `FooterV2.tsx:221,227`, `MapSection.tsx (landing-v2):261`, `MapSection.tsx (sections/, dead):70`, `Footer.tsx (dead):141`, `ContactSection.tsx (dead):66`, `privacy/page.tsx:154`, `teamComplete.ts:30,47,64,242,257,308,323` (legacy default phone per member) |
| `lashpopstudios@gmail.com` | `FooterV2.tsx:239,245`, `FAQSection.tsx:369`, `actions/work-with-us.ts:28` (form recipient), `Footer.tsx (dead):145`, `ContactSection.tsx (dead):78`, `MapSection.tsx (sections/, dead):71` |
| `429 S Coast Hwy, Oceanside, CA 92054` | `FooterV2.tsx:218`, `MapSection.tsx (landing-v2):261`, `Footer.tsx (dead):135`, `ContactSection.tsx (dead):49`, `seo/LocalBusinessSchema.tsx:291`, `llms.txt/route.ts:54` |
| Studio coordinates `[-117.3795, 33.1959]` | `MapSection.tsx (landing-v2):6` (constant `STUDIO_LOCATION`) |
| `Hours: 8a-7:30p every day, by appointment only` | `FooterV2.tsx:251-252` (only place — but also implicit in LocalBusinessSchema) |
| Newsletter recipient list | `actions/newsletter.ts` (need to verify how/where this writes) |

### Social URL hardcoded duplicates

| Platform | Hardcoded URL | Locations |
|---|---|---|
| Instagram | `https://instagram.com/lashpopstudios` | `FooterV2.tsx:99`, `InstagramCarousel.tsx:154` |
| Facebook | `https://www.facebook.com/lashpopCA` | `FooterV2.tsx:110` |
| TikTok | `https://tiktok.com/@lashpopstudios_` | `FooterV2.tsx:121` |
| Yelp | `https://www.yelp.com/biz/lashpop-studios-oceanside` | `FooterV2.tsx:132`, `ReviewsSection.tsx:76` |
| Google Maps | `https://maps.app.goo.gl/mozm5VjGqw8qCuzL8` | `FooterV2.tsx:143,209`, `ReviewsSection.tsx:77`, `MapSection.tsx (landing-v2):9` |
| Vagaro page | `https://www.vagaro.com/lashpop32` | `FooterV2.tsx:157`, `ReviewsSection.tsx:78`, `ServiceDetailClient.tsx:35`, `BookingView.tsx:119`, `BookingModal.tsx:180` (`/lashpop` not `/lashpop32` — likely bug), `teamComplete.ts (dead) x8`, `lib/vagaro-sync.ts:226` (default), `team_members.ts schema comment` |

### **The kicker: a partial admin already exists**

`src/app/admin/website/seo/page.tsx` has form fields with these as **placeholder text**:

```
504:   placeholder="lashpopstudios@gmail.com"
531:   placeholder="https://instagram.com/lashpopstudios"
556:   placeholder="https://tiktok.com/@lashpopstudios"
567:   placeholder="https://yelp.com/biz/lashpop-studios"
```

So the admin **already collects these values** (via the seo settings JSONB), but the consuming components (`FooterV2`, `ReviewsSection`, `InstagramCarousel`, `MapSection`) **ignore those settings and hardcode their own copy of each URL**.

That's the canonical "admin field exists, frontend doesn't read it" case. Fix should be: thread the SEO settings (or a new dedicated `studio_info` settings block) into the LandingPageV2Client server fetch on `src/app/page.tsx:38`, then pass to each section. This single change would eliminate ~30 hardcoded constants.

### Recommended admin section: `/admin/website/studio-info`

New admin section to consolidate studio identity. Probably lives under `website_settings` with a single `studio` key whose value is a JSONB object:

```jsonc
{
  "name": "LashPop Studios",
  "tagline": "Effortless beauty for the modern woman.",
  "address": { "street": "429 S Coast Hwy", "city": "Oceanside", "state": "CA", "zip": "92054" },
  "coordinates": { "lat": 33.1959, "lng": -117.3795 },
  "phone": "(760) 212-0448",
  "email": "lashpopstudios@gmail.com",
  "hours": "8a-7:30p every day, by appointment only",
  "social": {
    "instagram": "https://instagram.com/lashpopstudios",
    "facebook": "https://www.facebook.com/lashpopCA",
    "tiktok": "https://tiktok.com/@lashpopstudios_",
    "yelp": "https://www.yelp.com/biz/lashpop-studios-oceanside",
    "google": "https://maps.app.goo.gl/mozm5VjGqw8qCuzL8",
    "vagaro": "https://www.vagaro.com/lashpop32"
  },
  "newsletterRecipient": "lashpopstudios@gmail.com"
}
```

Then refactor `FooterV2`, `ReviewsSection`, `InstagramCarousel`, `MapSection`, `ServiceDetailClient`, `BookingView`, `BookingModal`, `LocalBusinessSchema`, `llms.txt/route.ts`, and `privacy/page.tsx` to read from props/server-fetched settings.

---

## B. Section-by-section gaps (homepage `/`)

### Navigation (`src/components/sections/Navigation.tsx`)

**Hardcoded:**
- `navItems` array (line 10-17): `Services`, `Team`, `Reviews`, `Gallery`, `FAQ`, `Find Us`. Note: `#gallery` anchor is in the list but the gallery section may not exist on the current render — check `MapSection.tsx`/IG to confirm `#gallery` is bound somewhere.
- "Book Now" + "Work With Us" CTA labels
- Logo paths (`/lashpop-images/branding/logo-terracotta.webp|png`)

**Admin gap:** nav item list could be admin-editable (re-orderable, label-editable, anchor-editable). Low priority — nav rarely changes — but useful if you ever rename a section.

### Mobile welcome cards (`src/components/landing-v2/MobileSwipeableWelcomeCards.tsx`)

**Hardcoded:** Lines 26–96. **Five rich-text cards** of brand voice with custom typographic JSX (`Emphasis`, `Highlight`, `Soft`, `Standout` styled spans). Includes the lines:
- "we're a collective of women-owned beauty businesses…"
- "Everything we do is built on trust."
- Service list: "lashes · brows · permanent makeup · facials · waxing · injectables · permanent jewelry" (line 57) — drifts from real services
- "we made it easy. Everything you need is right in the service bar below"
- "Welcome to your new favorite part of the week."

**Admin gap:** No admin path to edit any of this brand-voice copy. Hard because the formatting is structural (rich-text spans with semantic meaning), not just paragraphs. Two options:
1. A simple "welcome cards" CMS with markdown + a fixed set of styled spans (`{{em:...}}`, `{{strong:...}}`).
2. A rich-text editor (TipTap, Lexical) with constrained marks.

Same problem exists for the desktop welcome (`MobileSwipeableWelcomeCards` is mobile-only — desktop welcome is elsewhere; need to find — possibly inline in `HeroSection.tsx`).

### Hero (`src/components/landing-v2/HeroSection.tsx`)

**Hardcoded:**
- Headline "lashes + beauty" (line 109–110)
- Subhead pill (line 112+; need to read further to capture)
- Default fallback image `/lashpop-images/studio/studio-photos-by-salome.jpg` (line 44) — used when `heroConfig.fallbackImage` is null. **This is duplicated in 4 other files** (`actions/hero-archway.ts:23`, `actions/hero-slideshow.ts:117,135,149,166`, `api/admin/website/hero-archway/route.ts:30,37`, `api/website/hero-archway/route.ts:14`, `MobileHeroBackground.tsx:24`). The fallback is the same file in 7+ places.

**Admin gap:**
- Hero headline + subhead pill are not admin-editable (the hero admin only manages the slideshow images per the existing audit).
- Fallback image is in multiple files — should be a single setting.

### Founder letter (`src/components/landing-v2/sections/FounderLetterSection.tsx`)

**Already accepts `content` prop** (lines 5–14) so the admin CAN drive it via `/admin/website/founder-letter`. But:

**Still hardcoded:**
- Section heading "Welcome to LashPop Studios" (line 59) — not part of `letterContent`
- Section sub-heading on mobile (need to read further)
- Background image `/lashpop-images/founder-letter-bg.jpg` (line 41) and `/lashpop-images/founder-letter-bg-mobile.webp` (line 107)
- Signature image `/lashpop-images/emily-signature-2.{png,webp}` (lines 73–75, 144–146)
- The default copy in `defaultContent` (lines 18–27) is **the actual production copy** including "When I launched LashPop back in 2016…" and Emily's name — this is the production fallback if admin returns nothing. It will silently revert to outdated content if the admin row is deleted.

**Admin gap:** The section heading, background image, and signature image should be admin-controllable. Currently the founder-letter admin probably only edits the body text.

### Services section (`src/components/landing-v2/sections/ServicesSection.tsx`)

**Hardcoded `defaultServiceCategories` array (lines 22–87)** — 8 service categories with titles, taglines, descriptions, and icon paths. Comment says "fallback if database fetch fails" but the rest of the file needs to be read to confirm the prop wiring.

**Hardcoded category-slug-to-icon map duplicated** in `src/components/service-browser/components/ServiceCard.tsx:10–20` (separate copy, different naming for `facials` vs `skincare`, etc).

**Hardcoded "Tap to Book" copy** (line 298).

**Allowed category slugs hardcoded:** `src/app/page.tsx:103` — `['lashes', 'brows', 'facials', 'waxing', 'permanent-makeup', 'specialty', 'injectables']` — this controls which DB categories surface on the homepage. Same comment problem as MobileSwipeableWelcomeCards: drifts from the actual set.

**Footer service list** in `FooterV2.tsx:18–27` — separate hardcoded list of services for the footer with a comment "Footer service links … mirror the special-case logic in ServicesSection.tsx so the footer and the services menu stay in sync." **The comment itself is a smell** — proves the developer knew the duplication is fragile.

**Admin gap:**
- The hardcoded fallback (`defaultServiceCategories`) shadows the DB read. If a developer edits the fallback but not the DB row, prod will silently use the wrong content. Either trust the DB completely (remove the fallback) or make the fallback explicitly an emergency-only path.
- Footer/services/welcome-card category lists should all source from a single admin-curated "homepage categories" config.
- Category icons live on the filesystem; should be DAM-managed (with a fallback to filesystem if asset not set).

### Reviews section (`src/components/landing-v2/sections/ReviewsSection.tsx`)

**Hardcoded `reviewPlatformUrls` map** (lines 75–79) for the three review platforms (yelp, google, vagaro). Same URLs duplicated in `FooterV2`.

**Admin gap:** Should read from the `studio.social` settings block proposed above.

### Instagram carousel (`src/components/landing-v2/sections/InstagramCarousel.tsx`)

**Hardcoded:**
- `galleryImages` fallback array (lines 12–26) — 13 image paths used when no posts. **None of these are tagged as Instagram in the DAM** — they're static gallery photos serving as filler when the IG sync hasn't run.
- IG profile link `https://instagram.com/lashpopstudios` (line 154).

**Admin gap:**
- Fallback images should come from a DAM-curated "fallback gallery set."
- IG profile URL should read from settings.

### Map section (`src/components/landing-v2/sections/MapSection.tsx`)

**Hardcoded:**
- Studio coordinates (`STUDIO_LOCATION` line 6)
- Google Maps directions URL (line 9)
- Studio name and city in marker popup (lines 144–145)
- Storefront image `/lashpop-images/storefront.jpeg` (line 188)
- Mapbox style + custom color palette (`#e8f4f8`, `#fbf9f5`, `#ac4d3c`, etc) for water/land/labels (lines 84–112)
- Address (line 218 — but only in `Footer`-old; the new MapSection uses Footer for address display, not the MapSection itself)

**Admin gap:**
- Coordinates + map directions URL should be derived from the `studio` settings block.
- Storefront image should be a single setting (or DAM-managed).
- Map color theming is design-system territory — not necessarily admin-editable, but the color palette should be centralized in tokens.

### Footer (`src/components/landing-v2/sections/FooterV2.tsx`)

Covered comprehensively above. **Every contact/social value is hardcoded.** Plus:

**Hardcoded:**
- Brand name "LashPop Studios" (lines 93, 145, 291)
- Tagline "Effortless beauty for the modern woman." (line 95)
- Newsletter sub-copy "Subscribe for exclusive offers and beauty tips" (line 261)
- Copyright line (line 291)
- Bottom links: Privacy, Terms, Cancellation Policy (lines 295–303)
- `FOOTER_SERVICES` array (lines 18–27) — drifts from `ServicesSection`'s `defaultServiceCategories`

**Admin gap:**
- Tagline + brand name belong in `studio` settings.
- Newsletter copy belongs in a small "footer" or "newsletter" settings block.
- Bottom-link list could be a tiny admin (3 links — low ROI, skip unless we want a generic "footer link list" CMS).

---

## C. Other public pages

### `/work-with-us` (`src/app/work-with-us/page.tsx`)

**The page is ~1200 lines of mostly hardcoded copy.** The admin (`/admin/website/work-with-us`) only edits the **carousel images** on this page. Everything else is hardcoded:

- `employeeBenefits` array (lines 96–113) — **13 perks** with icon + title + description: "Flexible Scheduling," "Competitive Pay," "Complimentary Lashes" (one free lash service per month), "Employee Discount" (30% off), "Unlimited Vacation," etc.
- `boothBenefits` array (lines 116–138) — **22 booth-rental perks** including "1 Month Free Rent" "1 Week Free for Vacation" etc.
- `getBoothPricing` function (lines 141–146) — booth-rental day rate table hardcoded:
  - 5+ days: $55 station / $65 private
  - 4 days: $65 / $75
  - 3 days: $70 / $80
  - 1-2 days: $75 / $85
- `specialties` form list (lines 149–152) — `['Lash Extensions', 'Lash Lifts', 'Brows', 'Permanent Makeup', 'Skincare', 'Waxing', 'Other']` — drifts from the actual services list
- `formConfig` for the three career paths (employee / booth / training) with hardcoded title/subtitle/button/placeholder copy (lines 227–254)
- Confirmation messages "You're on the list!" / "Application Received!" (lines 213–214)
- Form labels and placeholders throughout
- Section bodies (e.g. training section ~line 1000+, culture sections ~line 1100+)
- Hardcoded culture images: `/lashpop-images/culture/training.webp`, `/team-front-desk.jpeg`, `/team-lounge.jpg`, `/join-our-team.webp`, `/booth-rental.webp` (lines 493, 500, 507, 830, 1012, 1171)

**Admin gap:**
- This page is one of the most content-heavy on the site and has the thinnest admin surface. Adding a comprehensive `/admin/website/work-with-us` CMS (or splitting into `careers-employee`, `careers-booth`, `careers-training`) would have huge ROI.
- The **booth pricing table** is something that changes — should be admin-editable.
- The **perk lists** are marketing collateral — should be admin-editable so non-engineers can iterate copy.

**Form submission:** form submits via `actions/work-with-us.ts` to `mox-api.experialstudio.com` (per migration audit). Admin has no visibility into submissions — they only land in email. **Missing capability:** form-response inbox in admin.

### `/services/[slug]` (`src/app/services/[slug]/ServiceDetailClient.tsx`)

**Hardcoded:**
- `VAGARO_BASE_BOOKING_URL` (line 35) — duplicate
- Vagaro service-ID URL pattern (lines 47–52) — comment hints at incomplete feature
- Price formatting/style is fine

**Database-driven:** category badge, service name, subtitle, hero image, gallery (from DAM via `asset_services`), duration, price, description.

**Mostly good.** The biggest gap is the inability to **set a per-service Vagaro deep link** via admin (the code constructs `?sId=…` from `vagaroServiceId` if set, but there's likely no admin UI to set that — verify).

### `/privacy` and `/terms`

**Fully hardcoded** static legal copy. `/privacy/page.tsx:154` includes the studio phone — would benefit from reading from `studio` settings.

**Admin gap:** legal pages typically aren't CMS-managed and that's fine. But interpolated contact info (phone, email, address) on legal pages should resolve from settings.

### `/confirm/[token]` — friend booking

Per migration audit: page is live but the API that triggers it (`POST /api/bookings/friend`) has **no UI caller**. Effectively dead end-to-end. **Not in admin scope** — recommend removing.

### `/login`, `/seoguide`, `/punchlist`, `/staffphoto`, `/preview/**`, `/admin/scrollytelling`, `/admin/theatre`

Per migration audit, these are dead, demo, or internal-only standalone tools. Not in admin scope.

---

## D. SEO meta + structured data

`src/app/page.tsx` and `src/app/services/[slug]/page.tsx` use `generateMetadata`:
- The slug page falls back to `${service.name} | Lash Pop` (line 22) — title format hardcoded with the brand name.
- The homepage probably has its own metadata via `src/app/layout.tsx` or the SEO admin — to verify in the agent's mapping.

`src/components/seo/LocalBusinessSchema.tsx:291` has the address hardcoded. The whole `LocalBusinessSchema` likely hardcodes name/phone/hours/address/social URLs that should derive from `studio` settings.

`src/app/llms.txt/route.ts:54` hardcodes the studio address.

**Admin gap:** The SEO admin (`/admin/website/seo`) covers per-page meta and social URLs, but `LocalBusinessSchema` and `llms.txt` don't read from it — same orphan-admin pattern as the social URLs.

---

## E. Dead components & legacy data files (cleanup)

These are noise in the repo — they have hardcoded content but **nothing renders them**. Confirmed not imported into the current render tree:

| Path | Status | Note |
|---|---|---|
| `src/components/landing-v2/Footer.tsx` | dead | superseded by `landing-v2/sections/FooterV2.tsx` |
| `src/components/landing-v2/ContactSection.tsx` | dead | not imported |
| `src/components/landing-v2/AboutSection.tsx` | dead | only self-definition |
| `src/components/landing-v2/TestimonialsSection.tsx` | dead | only self-definition |
| `src/components/landing-v2/sections/WelcomeSection.tsx` | dead | not imported |
| `src/components/landing-v2/TeamSection.tsx` | dead | hardcoded `team` array, superseded by `EnhancedTeamSectionClient` |
| `src/components/sections/MapSection.tsx` | dead | older version, superseded by `landing-v2/sections/MapSection.tsx` |
| `src/data/team.ts`, `src/data/teamComplete.ts` | dead | legacy hardcoded team rosters (replaced by DB + Vagaro sync) |
| `src/data/services.ts` | dead | legacy hardcoded service list (replaced by DB) |
| `src/data/gallery.ts` | dead (or marginal) | hardcoded gallery image list — superseded by DAM `assets` table |

**Recommendation:** delete these in a single cleanup PR. They mislead future searches and risk drift if anyone accidentally edits them thinking they're live.

---

## F. Forms & submissions — missing admin visibility

The site collects user input in three places. The admin has **no inbox for any of them**:

| Form | Where it sends | Admin visibility today |
|---|---|---|
| Newsletter (`FooterV2`) | `actions/newsletter.ts` (verify destination — supabase or mox?) | None |
| Work-with-us application | `actions/work-with-us.ts` → `mox-api.experialstudio.com` + email | None — Emily's email only |
| Find Your Look quiz result | Need to verify — does it submit anywhere or is it client-only? | None |
| Friend booking | `/api/bookings/friend` — dormant per audit | N/A |

**Admin gap:** an "Inbox" section showing form submissions (with status: new / read / archived) would replace ad-hoc email triage. The `form_responses` schema may already exist (`src/db/schema/form_responses.ts`) — check whether it's written to.

---

## G. Cross-feature missing capabilities (admin should be able to do)

These don't map to a single existing admin page — they're capabilities the admin lacks entirely:

1. **Studio info / contact / hours / social URLs** — top priority (Section A above). Single config block, 10+ files unified.

2. **Homepage category curation** — which service categories show up on `/` and in which order, currently hardcoded in `src/app/page.tsx:103`.

3. **Welcome cards CMS** — the mobile welcome cards (5 rich-text cards) are 100% hardcoded brand voice. Most-trafficked above-fold mobile content with zero admin path.

4. **Hero headline + subhead** — the hero admin manages images, not copy. The headline "lashes + beauty" is hardcoded.

5. **Form-response inbox** — admin has no visibility into newsletter / work-with-us / quiz submissions.

6. **Audit log / activity feed** — `dam_user_actions` exists for DAM, but website admin actions are not logged. After Emily changes the founder letter or hides a review, there's no history.

7. **Preview / publishing workflow** — every admin save is instantly live (`dynamic = 'force-dynamic'` in `src/app/page.tsx:13`). No "draft → preview → publish" path. For copy that ships to thousands of viewers, a preview pass would be a nice-to-have.

8. **Per-service Vagaro deep link UI** — `ServiceDetailClient.tsx:47–52` constructs a deep link if `service.vagaroServiceId` is set, but verify admin lets staff set this field.

9. **Booth rental pricing table** — `getBoothPricing` (work-with-us:141–146) is a pricing rule that should be admin-editable.

10. **Career perks lists** — the 13 employee perks and 22 booth perks on `/work-with-us` are hardcoded marketing copy.

11. **Footer link list** — bottom links (Privacy, Terms, Cancellation Policy) hardcoded.

12. **Legal page contact interpolation** — `/privacy` and `/terms` should pull contact info from settings, not hardcode.

13. **DAM tagging policies / required tags** — no admin path to enforce "every team-member photo must have a `crop` field" or similar. The DAM is a free-for-all today.

14. **Vagaro mapping management** — `vagaro_sync_mappings` table exists; admin probably has no UI to manually resolve a stuck Vagaro→DB mapping.

15. **Review platform allowlist / source weights** — review-settings probably has scoring config; verify admin can adjust source weighting (Google vs Vagaro vs Yelp).

---

## H. Recommended admin reorganization (preliminary — flesh out in Part 3)

Today the admin is `/admin/website/{section}` + `/admin/dam-users` + `/dam` + `/dam/team` — 13 separate URLs with no shared shell.

Suggested re-grouping for a master admin panel:

```
/admin
├─ overview                       # dashboard: recent activity, pending reviews, form inbox count
├─ content/
│   ├─ studio-info                # NEW — consolidates name/contact/social/hours
│   ├─ hero                       # existing — slideshow
│   ├─ welcome-cards              # NEW — mobile swipeable + desktop welcome copy
│   ├─ services                   # existing
│   ├─ team                       # existing — keep Vagaro sync indicators visible
│   ├─ founder-letter             # existing — extend to cover heading + images
│   ├─ reviews                    # existing — moderation queue
│   ├─ review-settings            # existing — scoring/display knobs
│   ├─ instagram                  # existing
│   ├─ faq                        # existing
│   ├─ quiz                       # existing
│   ├─ work-with-us               # MAJOR EXPANSION — full page content, not just carousel
│   ├─ seo                        # existing — extend with og-images per page
│   └─ footer                     # NEW — small (newsletter copy, bottom links)
├─ assets/                        # FOLD IN /dam HERE
│   ├─ library                    # current /dam
│   ├─ team-photos                # current /dam/team
│   ├─ tags                       # tag management
│   └─ sets                       # collection/set management
├─ inbox/                         # NEW
│   ├─ newsletter                 # subscribers
│   ├─ work-with-us               # applications
│   └─ quiz                       # results / leads (if persisted)
└─ system/
    ├─ users                      # current /admin/dam-users (phone allowlist)
    ├─ audit-log                  # NEW — all admin actions
    └─ syncs                      # NEW — Vagaro / Instagram / Reviews worker status + manual triggers
```

This is preliminary — needs to be reconciled with the reverse-map data from the other agents.
