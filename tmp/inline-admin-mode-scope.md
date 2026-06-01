# Inline Admin Mode — Scope & Architecture

**Status:** research / scoping
**Author:** scoping agent
**Date:** 2026‑05‑28
**Related prior work:** `tmp/admin-audit.md`, `src/components/dev/DesignMode.tsx`, `src/components/dev-mode/DevModeOverlay.tsx`

---

## 0. TL;DR

LashPop already has every primitive needed to ship an inline admin mode:

- An auth-gated `damAccess` session (`src/lib/admin/auth.ts`) that is **already valid on public routes** — the cookie is global, the gate is in the layout, nothing stops us from reading the session on `/`.
- A working "URL-param + `localStorage` persisted toggle" pattern on the public site already, in `src/components/dev/DesignModeGate.tsx`.
- A working floating overlay panel pattern in `src/components/dev-mode/DevModeOverlay.tsx`.
- A complete REST surface under `/api/admin/website/*` with PATCH endpoints that already accept single-field updates (`bio`, `funFact`, `credentials`, `imageUrl`, `manualServiceCategories`).
- A Cloudflare Worker (`workers/staffphoto-optimize`) that already accepts a `rotate?: number` transform option through the Images binding. **Rotation is essentially free.**

**The recommendation:** ship inline admin in three phases. Phase 1 is one new context provider, one `<Editable>` wrapper component, and inline string edits on Founder Letter + bios + fun facts + credentials. ~3–4 days of work. It reuses every existing PATCH endpoint and gives Corey >70% of the day‑to‑day "I just want to fix this on the site" workflow without ever leaving the public page.

Phase 2 (photos + portfolio CRUD + rotation) is another ~1 week and unlocks the EXIF/rotation use case that prompted this whole thread.

Phase 3 (services, Vagaro overrides, off-Vagaro stylist creation) is real surgery and should not gate Phase 1.

---

## 1. Inventory of existing admin surfaces

Source: `src/app/admin/**` and `src/app/api/admin/**`.

### Pages

| Page | File | Edits | DB section / table |
|---|---|---|---|
| Overview | `src/app/admin/overview/page.tsx` | dashboard, navigation hub | — |
| DAM Users | `src/app/admin/dam-users/page.tsx` | grant/revoke `damAccess` on user accounts | `auth_user.damAccess` |
| Team Manager | `src/app/admin/website/team/page.tsx` (991 LOC) | reorder, visibility, bio, fun fact, credentials, profile image, manual service categories, quick facts | `team_members`, `team_quick_facts` |
| Founder Letter | `src/app/admin/content/founder-letter/FounderLetterEditor.tsx` (267 LOC) | heading, greeting, paragraphs[], sign-off, signature | `website_settings.section='founder_letter'` |
| Studio Info | `src/app/admin/content/studio-info/StudioInfoEditor.tsx` | address, hours, phone, social, map | `website_settings.section='studio_settings'` |
| Hero / Slideshow | `src/app/admin/website/hero/page.tsx` | slideshow presets + per-viewport assignments + archway image | `website_settings.section IN ('hero_slideshow_presets', 'hero_slideshow_assignments', 'hero_archway')` |
| Services | `src/app/admin/website/services/page.tsx` (1831 LOC) | service hero images, demo-mode toggles, brand copy overrides | `services`, `service_categories` |
| FAQ Manager | `src/app/admin/website/faq/page.tsx` (712 LOC) | categories, items, reordering, featured flags | `faq_categories`, `faq_items` |
| Find Your Look Quiz | `src/app/admin/website/quiz/page.tsx` (1081 LOC) | lash style images, result-screen photos, crop editor | `website_settings.section='quiz'` + DAM |
| Reviews | `src/app/admin/website/reviews/page.tsx` | per-review quality score, stylist link, show/hide, rescore via mesh-claude, per-stylist highlight reels | `reviews`, `homepage_reviews`, `team_member_highlights` |
| Review Settings | `src/app/admin/website/review-settings/page.tsx` | capacity, decay curves, auto-promote thresholds, editor cadence | `website_settings.section='review_pipeline'` |
| Instagram | `src/app/admin/website/instagram/page.tsx` | carousel max-posts, autoscroll, captions | `website_settings.section='instagram_carousel'` |
| SEO | `src/app/admin/website/seo/page.tsx` (1197 LOC) | site title, description, OG, schema, robots | `website_settings.section='seo_metadata'` |
| Work With Us Carousel | `src/app/admin/website/work-with-us/page.tsx` | hiring photo carousel | `website_settings.section='work_with_us'` |
| Scrollytelling / Theatre | `src/app/admin/{scrollytelling,theatre}/page.tsx` | scroll-narrative dev tools | local-only / dev |

### API routes

All under `src/app/api/admin/**`. Auth guard pattern is consistent — `requireAdminApi()` from `src/lib/admin/auth.ts` returns either an `AdminSession` or a `NextResponse` (401/403) the route returns directly. The team route uses a different bespoke `isAdmin()` helper — minor cleanup opportunity.

Notable shapes:

- `PATCH /api/admin/website/team` — accepts `{ memberId, bio?, funFact?, credentials?, imageUrl?, manualServiceCategories? }`. Already supports per-field optional updates. **This is the model for inline edits.**
- `PUT /api/admin/website/founder-letter` — accepts the whole `FounderLetterContent` object and returns the normalized result. Good for inline edits if we serialize the whole letter on each save (small, so fine).
- `POST/DELETE /api/dam/team/[memberId]/photos` and `[photoId]/...` — full CRUD on portfolio photos including `set-primary` and `crops`.
- `POST /api/admin/website/reviews/[id]/rescore` — triggers a mesh-claude rescore on demand.

### DAM helpers we can reuse

- `MiniDamExplorer` (`src/components/admin/MiniDamExplorer.tsx`) — already a modal asset-picker. Drop it into an inline drawer for "swap photo".
- `staffphoto-optimize` worker — accepts a `rotate?: number` param on its transform call (line 94 of `workers/staffphoto-optimize/src/index.ts`). This is the EXIF rotation primitive.

---

## 2. Where each capability lives inline

Map of admin surface → public site location → recommended affordance.

### High-value, low-risk (Phase 1)

| Admin surface | Public location | Affordance |
|---|---|---|
| Founder letter heading/greeting/paragraphs | `src/components/landing-v2/sections/FounderLetterSection.tsx` lines 39–54 | Inline contentEditable on each `<p>` and the `<h2>`. Save button appears in the floating panel when any block is dirty. PUT the whole `FounderLetterContent`. |
| Stylist bio | Inside `MemberTakeover.tsx` bio paragraph (rendered when a card is opened) | Pencil icon top-right of the bio block → opens an inline `<textarea>` overlay. On save: `PATCH /api/admin/website/team` with `{ memberId, bio }`. |
| Stylist fun fact | `MemberTakeover.tsx` quick-facts area | Same pattern as bio. PATCH `funFact`. |
| Stylist credentials | `MemberTakeover.tsx` credentials list | Per-credential pencil + delete; bottom "+ Add credential" pill. Reuses `CredentialsEditor.tsx` data shape, just rendered in a slide-down panel instead of a separate page. PATCH `credentials`. |
| Quick facts | `MemberTakeover.tsx` `<QuickFactsGrid>` | Per-fact pencil + "+ Add fact"; opens existing `QuickFactsEditor` logic inline. POST/PATCH `/api/admin/website/team/quick-facts`. |
| Manual service categories | `MemberTakeover.tsx` chip row | Click chip to remove, "+ Tag" to add. PATCH `manualServiceCategories`. |
| Member visibility | Team grid card hover | Eye/EyeOff icon on hover; toggles `isActive`. Uses `PUT /api/admin/website/team` with single-entry `updates` array. |
| Stylist display order | Team grid | Reorder handle on hover — reuse `framer-motion/Reorder` like the admin page does (lines 4, 291–294). PUT new `displayOrder`. |
| Studio settings (hours, address, phone) | `src/components/landing-v2/sections/MapSection.tsx` and `FooterV2.tsx` | Inline text edit on each visible field. PUT the whole `StudioSettings`. |
| SEO meta (page title/description) | Top of `<head>` is invisible — needs an admin-only drawer | "SEO" button in floating panel → opens drawer with current page's seo settings. This is the one Phase-1 thing that isn't truly inline. |

### Medium (Phase 2 — photos)

| Admin surface | Public location | Affordance |
|---|---|---|
| Stylist primary photo | `EnhancedTeamSectionClient.tsx` team-card portrait (`<Image>` at line 627 / 667 / 694) **and** `MemberTakeover.tsx` portrait (line 258) | Hover overlay → "Swap photo" opens `MiniDamExplorer` modal. POST `imageUrl` PATCH. |
| Portfolio photos — add | `MemberTakeover.tsx` portfolio gallery (uses `portfolioImages` from `/api/dam/team/${uuid}/photos`) | "+" tile at the end of the gallery → opens DAM picker, POST `assetIds` to `/api/dam/team/[memberId]/photos`. |
| Portfolio photos — remove | Each gallery tile gets a hover-revealed trash icon | DELETE `/api/dam/team/photos/[photoId]`. |
| Portfolio photo — rotate | Each gallery tile gets a hover-revealed rotate icon | See §8 for full UX. Calls `/api/dam/team/photos/[photoId]/rotate` (new endpoint) which queues a re-encode through staffphoto-optimize. |
| Portfolio photo — set primary | Star icon on each tile | POST `/api/dam/team/photos/[photoId]/set-primary`. |
| Hero archway image | `HeroSection.tsx` | "Change image" pill bottom-right of hero. Reuses `/admin/website/hero` archway flow inline. |
| Quiz lash-style photos | The Find Your Look quiz drawer | "Change image" pill on each style card in admin mode. Stretches the inline metaphor — see §6. |
| Instagram carousel | `InstagramCarousel.tsx` | Carousel settings drawer (max posts / autoscroll / captions). Mostly numeric → small form, OK to surface as a settings drawer rather than truly inline. |
| Work With Us carousel | `/work-with-us` page | DAM picker overlay; add/remove tiles. |

### Hard / deferred (Phase 3)

| Admin surface | Inline plausibility | Notes |
|---|---|---|
| Services CRUD (`/admin/website/services`, 1831 LOC) | Partial | Brand copy/description is inline-friendly; price/duration come from Vagaro; service hero images = DAM picker. The hierarchy management (categories/subcategories) is **not** inline-friendly. |
| FAQ category management | Defer | Reorder + create item inline is fine. Creating new categories needs full admin page. |
| Review curation & rescore | Defer | Per-review actions could live on the review card on the public page (admin-only chrome), but the bulk view and rescore queue belong on the admin page. |
| Hero slideshow preset CRUD | Defer | Preset assignment (which preset for desktop vs mobile) is inline-friendly. Building presets is not. |
| Off-Vagaro stylist creation | See §7 | New "+" tile on the team grid. |
| DAM Users (grant access) | Defer | Security-sensitive, keep gated. |
| SEO bulk per-page editing | Partial | Single-page SEO inline = fine; structured-data editor stays admin. |
| Review pipeline thresholds | Defer | Pure numeric config; admin page. |

---

## 3. Architecture

### 3.1 Mode toggle

**Recommendation: URL param + `localStorage` persistence, mirroring `DesignModeGate`.**

- Activate with `?admin=1` on any public route. Persist `lashpop-admin-mode` in `localStorage`. Deactivate with `?admin=0` or a panel button.
- Render nothing for non-admins regardless of param (server-side session check still gates whether any edit chrome lazy-loads).
- **Not** a subdomain. Two reasons: (a) you want to QA the actual public render with admin overlays on top of it, not a parallel copy; (b) subdomain means a separate cookie + CDN cache scope, and we already lost a week to caching bugs on this codebase.
- **Not** cookie-only. The URL param is what makes it shareable in Slack ("look at https://lashpopstudios.com/?admin=1#team and the second card") and is the existing pattern.

The hook (`useAdminMode()`) returns `{ enabled, user, exit }`. Components consume that.

### 3.2 Auth gate

The existing `auth_token` cookie is set domain-wide. `src/lib/admin/auth.ts::getAdminSession()` already works from any server context — there is no `/admin/*`-specific scoping. So:

- New endpoint `GET /api/admin/me` returns `{ isAdmin: boolean, name, email }` if the cookie/session is valid, else 401.
- On the public page, the `<AdminModeProvider>` mounts a `useEffect` that calls `/api/admin/me` only if `?admin=1` (or `localStorage` flag) is set. No call for normal visitors → zero overhead.
- If 401, fall back to redirecting to `/dam/login?next=/?admin=1`.
- All existing `/api/admin/**` PATCH/PUT endpoints already auth via `requireAdminApi()`. Reuse them as-is. Server-side authorization stays the source of truth — the client toggle is purely cosmetic chrome.

### 3.3 Overlay component pattern

**Recommendation: single `<AdminModeProvider>` + `<Editable>` wrapper + a floating chrome panel.**

```
<AdminModeProvider>
  ...existing page tree, untouched...

  {/* Floating chrome, only renders when enabled */}
  <AdminChrome />
</AdminModeProvider>
```

Three primitives:

1. **`<AdminModeProvider>`** — global context. Holds `{ enabled, user, dirtyBlocks, registerBlock, save, discard, exit }`.
2. **`<Editable kind="text|html|image|list" target={...}>`** — wraps a piece of public content. When admin mode is off it renders `children` verbatim (zero overhead, zero hydration mismatch). When on it adds:
   - a thin dashed outline on hover (admin chrome class, not a DOM change),
   - a floating pencil/trash/swap icon at the corner via portal,
   - on click, swaps in an editor (textarea / `MiniRichEditor` / `MiniDamExplorer` / drawer) and tracks dirtiness in the provider.
3. **`<AdminChrome />`** — bottom-right floating panel showing dirty count, "Save all" / "Discard", a section nav for jumping to dirty blocks, plus access to the few non-inline drawers (SEO, page settings). Modeled exactly on `DevModeOverlay.tsx`.

**Why a wrapper, not per-component bespoke chrome:**

- One place to enforce auth chrome → easier to grep for "is this thing editable?"
- Lets us flip whole sections to admin-mode without per-component refactors.
- Composes with existing styles (chrome lives on top via portal; the editable child renders unchanged).

**Why not contentEditable on everything:** hydration mismatch risk, brittle on the Framer-Motion-heavy sections, and we want optimistic UI with explicit save, not "blur to save."

### 3.4 Persistence

**Reuse existing `/api/admin/*` endpoints. Do not build a new RESTful editor API.**

The PATCH endpoints already support per-field optional updates. The only new endpoint Phase 1 needs:

- `GET /api/admin/me` (already discussed)

Phase 2 needs:

- `POST /api/admin/website/team/photos/[photoId]/rotate` — queues a worker job to rotate the original + invalidate crops.

Phase 3 might need:

- `POST /api/admin/website/team/off-vagaro` — create an off-Vagaro stylist row.

The save model: **per-block save, no batching.** Each `<Editable>` block has its own save button; clicking it fires its endpoint, shows an inline checkmark, and clears local dirty state. The floating panel's "Save all" iterates over registered dirty blocks and fires them in series.

Reasoning: most of these PATCH endpoints already exist and are already per-field. A batch endpoint would add risk without removing latency (these are single-row writes on Supabase). And the optimistic UX matches what `/admin/website/team` already does.

### 3.5 Optimistic UI + reconciliation

- On save, immediately update the local state shown in the `<Editable>` block. Show a small in-flight spinner.
- On 2xx, show a checkmark for 2s, clear dirty.
- On 4xx/5xx, revert to the previous saved value, show the error in the floating panel.
- **No revalidation of the whole page on every save.** The homepage uses `dynamic = 'force-dynamic'`, so the next full load already gets fresh data. Inline saves just need to update the local component state.
- However: for fields that downstream-impact other components (e.g. saving a new credential should show up in the SEO JSON-LD), we need a mechanism. Recommendation: after a save that affects a shared resource, the floating panel shows a small "reload to verify SEO" hint. Don't try to be too smart — the surface area is small.

### 3.6 Async media work (rotation, re-encode)

The pipeline already exists. The flow for rotation:

1. Client clicks rotate. UI immediately applies a CSS `transform: rotate(90deg)` for instant preview.
2. Client POSTs `/api/admin/website/team/photos/[photoId]/rotate` with `{ degrees: 90 }`.
3. Server reads the original from R2, streams it to the `staffphoto-optimize` worker with `rotate: 90` on the transform, writes the result back to a new R2 key, updates `team_member_photos.filePath` (and clears stale crop URLs — see §8).
4. Server returns the new URL.
5. Client swaps the CSS-rotated preview for the real new URL.

This is ~50 LOC of new server code; the worker side is already done.

For crops that depend on the now-rotated original (cropSquare/cropCloseUpCircle/cropMediumCircle/cropFullVertical/cropFullHorizontal): null them out on rotation and either lazy-regenerate or surface a "regenerate crops" CTA on the photo card. Recommendation: null them, lazy-regenerate via the existing crop editor flow only when the photo is opened in the takeover.

---

## 4. Phase plan

### Phase 0 — toggle + auth (½ day)

- `useAdminMode()` hook + `<AdminModeProvider>` + `<AdminChrome />` (empty save panel).
- `GET /api/admin/me` endpoint.
- `AdminModeGate` (mirror `DesignModeGate`) to lazy-load the provider only when activated.
- Mounted in `LandingPageV2Client.tsx` next to `DevModeProvider` at line 334.

**Ship gate:** Corey loads `/?admin=1`, sees the floating panel, sees his name in it, can dismiss. No edits yet.

### Phase 1 — text edits (3 days)

- `<Editable kind="text">` wrapper + inline textarea/contenteditable editor.
- Apply to: founder letter (every paragraph + heading + greeting + sign-off + signature), stylist bio + fun fact (in `MemberTakeover.tsx`), studio settings text fields in `FooterV2.tsx` and `MapSection.tsx`.
- Per-block save → existing PATCH/PUT endpoints.
- Optimistic UI + revert on error.

**Ship gate:** Corey can fix a typo in Emily's bio without leaving the homepage.

### Phase 2 — media (1 week)

- `<Editable kind="image">` wrapper that opens `MiniDamExplorer` for swap.
- Apply to: stylist portraits (team grid + takeover), hero archway, founder-letter background.
- Portfolio CRUD on the takeover: add tile, remove tile, set-primary star.
- New `POST .../rotate` endpoint + worker integration. Rotate button on portfolio tiles.

**Ship gate:** Corey rotates a sideways portfolio photo from his phone on the actual stylist takeover.

### Phase 3 — structured / sensitive (2 weeks, opinionated cut)

- Credentials editor inline (reuse `CredentialsEditor.tsx` markup inside the takeover).
- Quick facts inline (reuse `QuickFactsEditor.tsx` markup inside the takeover).
- Manual service-category chips inline.
- Stylist visibility + reorder inline on team grid.
- Off-Vagaro stylist creation (see §7).
- Service brand copy inline on `ServicesSection.tsx` and the service browser.
- Hero slideshow preset assignment inline (preset *creation* stays on the admin page).

**Defer indefinitely:** FAQ category management, review pipeline thresholds, full SEO structured-data editor, DAM user management, scrollytelling/theatre. These stay at `/admin/*` and that's fine.

---

## 5. Risks & open questions

### Hydration

- Public users get **zero** admin chrome. The provider only mounts its body when `useAdminMode().enabled` and the `/api/admin/me` call has resolved. `<Editable>` renders children verbatim in non-admin mode. This is verified by mirroring how `DesignModeGate` already handles this.
- The `<Editable>` outline/pencil are appended via portal after first paint → no SSR diff.

### SSR vs CSR

- All edit affordances are client-only. The provider is a `'use client'` component lazy-loaded behind a gate. No edit code ships to the public bundle for unauthenticated users (the gate component itself is ~1 KB).

### Vagaro sync race

This is **the** real risk and we already feel it. `workers/vagaro-sync/src/sync.ts` lines 247–268 overwrite `vagaroBio` and `vagaroPhotoUrl` on every sync. The frontend uses `vagaroBio || bio` (`src/app/page.tsx` lines 81–82) and `vagaroPhotoUrl || imageUrl` (line 77) — so a local edit to `bio` only shows up when Vagaro's value is null/empty.

Implications for inline edit:
- Editing `bio` inline writes to `team_members.bio`. If Vagaro then publishes a non-empty BusinessSummary, the inline edit silently becomes invisible. **The current admin page has this same bug.** We should not treat it as new.
- Recommendation: the `<Editable>` for stylist bio shows the *effective* (rendered) value but, on click, opens an editor showing **both** sources — "Vagaro says: X" / "Override: Y" — with a checkbox "Prefer override over Vagaro". This requires a new column like `team_members.bio_override_active` to be honest about the override. Out of scope for Phase 1 unless Corey says otherwise; document the gotcha in the inline editor with a tooltip.
- Same story for `vagaroPhotoUrl` — there's already infrastructure for `imageUrl` to be the local override. The bug is just the fallback order.

### Cancel / draft persistence

- Per-block save with explicit "Save" button → no auto-save → cancel is trivial (just revert local state).
- Drafts across page reloads: don't bother. If Corey navigates away with unsaved changes, the floating panel shows a `beforeunload` confirm. (Mirror what the admin team page does today via `hasChanges` state.)
- Diff view: out of scope. The textarea shows current vs original by visually highlighting changed lines? No — keep it simple: textarea with the current value, "Discard" button restores the saved value.

### Mobile

This is where the design has to be careful:
- Hover-only affordances die on touch. Replace hover outlines with a persistent "edit mode is on" subtle accent (e.g. a 1px dashed border on every `<Editable>` while admin mode is enabled).
- Pencil icons are 24px hit targets minimum; rotate/trash buttons are 44px (we have a project rule about this — `reference_44px_tap_floor.md`).
- The floating panel needs a mobile layout: collapse to a bottom bar with dirty-count badge, expandable on tap. The dev-mode overlay already does most of this.
- The `MiniDamExplorer` modal is desktop-tuned; needs a mobile pass.

### Performance

- Active admins get the editor bundle (textarea + DAM picker + rotate flow). Public visitors get nothing. Lazy-load via dynamic import inside the gate.
- No regression for SSR; the `<Editable>` wrapper is a thin pass-through in non-admin mode.

### Race within a session

- Two admin tabs editing the same stylist: last write wins. We don't have collaborative editing infra and don't want it. The PATCH endpoints could grow a `?ifMatch=updatedAt` guard later; skip for now.

---

## 6. What can't (and shouldn't) live inline

- **FAQ category CRUD** — the data model has structure that requires a multi-step UI. Items themselves *can* live on the FAQ section inline (per-item edit + reorder). Categories stay at `/admin/website/faq`.
- **Review pipeline configuration** — numeric thresholds with no on-page representation.
- **Bulk operations** — selecting 30 reviews and rescoring them all. Belongs on a list view.
- **DAM user management** — security-sensitive, separate gate.
- **Hero slideshow preset *creation*** — multi-step builder. Preset *assignment* (which preset shows on desktop vs mobile) can be inline.
- **Scrollytelling / Theatre** — dev tools, not content.
- **SEO structured data editor** — JSON-LD construction needs a structured form. Per-page meta title/description is inline-able.

---

## 7. Off-Vagaro stylist creation, inline

Corey originally wanted this as a standalone admin feature. In the inline model it becomes:

**Affordance:** at the end of the team grid in `EnhancedTeamSectionClient.tsx`, render an admin-only "+" tile styled like the existing stylist cards.

**Flow:**

1. Click "+" tile → drawer slides in with a form:
   - Name (required)
   - Role (default: "Lash Artist")
   - Type: employee | independent (default: independent)
   - Business name (if independent)
   - Phone
   - Instagram handle
   - Booking URL (default: lashpop's Vagaro URL — flag that it should be overridden for independents)
   - Profile photo (opens `MiniDamExplorer` or upload-through-staffphoto-optimize)
   - Bio (rich text via `MiniRichEditor`)
2. On submit, POST `/api/admin/website/team/off-vagaro` (new endpoint) which:
   - Inserts a `team_members` row with `vagaroEmployeeId = null`, `vagaroPhotoUrl = null`, `vagaroBio = null`, `isActive = true`, a generated `displayOrder` (max + 1), and the submitted fields.
   - Optionally sets a new boolean `isOffVagaro = true` (recommended — see below).
3. The new card appears immediately at the end of the grid; Corey can drag it into position.

**The Vagaro reconciliation problem:** the sync worker (`syncPublicStaff` in `workers/vagaro-sync/src/sync.ts`) matches Vagaro providers to `team_members` rows by name. If Corey adds "Jane Doe" inline and Jane later joins as a Vagaro stylist with the same name, the sync will *match the existing row* (line 245+ `if (matchByName)`) and start overwriting fields. This is **the existing behavior** and probably acceptable — name-collision means they really are the same person.

The risk we should design against: the sync also de-activates rows it doesn't see in Vagaro. Read the deactivation block in `sync.ts` to confirm — if it does, an `isOffVagaro: true` flag on the row would let the sync skip deactivation. Recommended.

Minimum schema diff:

```sql
ALTER TABLE team_members ADD COLUMN is_off_vagaro boolean NOT NULL DEFAULT false;
```

And in the sync's deactivate-missing loop, skip rows where `is_off_vagaro = true`.

---

## 8. EXIF / photo rotation — full UX

Use case: Corey opens a stylist takeover on his phone, sees a portfolio photo lying on its side because the original was shot vertically and EXIF orientation was lost during upload.

### Inline UX

1. With admin mode on, every portfolio tile in `MemberTakeover.tsx` has a 44×44 hover/tap overlay icon (rotate-right). On mobile, the overlay is always visible (subtle, top-right corner).
2. Tap rotate-right → photo instantly rotates 90° clockwise via CSS `transform: rotate(90deg) scale(1.0)` and the parent container's aspect ratio swaps. A small "Rotating…" pill appears.
3. Behind the scenes, POST `/api/admin/website/team/photos/[photoId]/rotate` `{ degrees: 90 }`.
4. The server endpoint:
   - Reads `team_member_photos` row → fetches original from R2.
   - POSTs the original to the staffphoto-optimize worker with `{ preset: 'portfolio', rotate: 90 }`. The worker already supports this transform (see `workers/staffphoto-optimize/src/index.ts` line 94).
   - Writes the result back to a new R2 key (`...-rotated-90.jpg` or `...-v2.jpg`).
   - Updates `teamMemberPhotos.filePath` to the new URL.
   - **Nulls out** `cropSquare`, `cropCloseUpCircle`, `cropMediumCircle`, `cropFullVertical`, `cropFullHorizontal` — they reference pre-rotation pixel coordinates and are now wrong. The crop editor can regenerate on demand.
   - Deletes the old R2 object (the old `filePath`) after successful write to avoid orphans.
   - Returns `{ url, width, height }`.
5. Client replaces the CSS-rotated preview with the new URL — `<Image src={newUrl} key={newUrl} />` to bypass Next's URL caching. CSS rotation is removed in the same frame.
6. If the user rotates again before the response lands, queue locally; the server enforces serial application via the row's `updatedAt`.

### What about doing it client-side?

You could re-encode in-browser with `canvas` and PUT a new asset directly. **Don't.** Phone photos are large, browser memory is fragile, and we have a battle-tested worker already. The 1–3s round-trip is fine — Corey gets instant CSS preview and the truth catches up.

### "Three rotations are the same as one in the other direction" — yes

Successive rotations should compound on the *previous* result, not the original. Easy because step 4 writes a new R2 key and updates `filePath` each time. Don't try to short-circuit "user rotated three times so just rotate -90 from original" — too brittle.

### Free side benefit

The same endpoint can take `degrees: -90` (CCW) and `degrees: 180` (flip). One endpoint, three buttons in the UI.

---

## 9. If we ship Phase 1 only — what Corey gets, what it costs

**Cost:** 3–4 days of focused work.

**What Corey gets:**
- Toggle admin on the live site at `lashpopstudios.com/?admin=1`.
- Edit Emily's founder letter heading, greeting, paragraphs, sign-off inline. Save per-block.
- Edit every stylist's bio inline from their takeover.
- Edit every stylist's fun fact inline.
- Edit studio hours, address, phone in the footer/map inline.
- See his name in the floating admin chrome with a "Sign out" / "Exit admin mode" button.
- The floating panel shows count of unsaved edits across the page and a "save all" shortcut.
- All edits go through the existing PATCH endpoints with the existing `damAccess` auth. Zero new auth surface. Zero new DB columns.

**What Corey doesn't get yet:**
- Photo swap / rotate / portfolio CRUD (Phase 2).
- Credentials / quick-facts inline (Phase 3).
- Stylist reorder / visibility (Phase 3).
- Off-Vagaro stylist creation (Phase 3).
- Service-level editing (Phase 3, partial).

**What this *fixes* immediately:** Corey's most common "I just need to fix this typo without finding the admin page" workflow — bios, fun facts, the founder letter, hours.

**What this *doesn't* fix immediately:** the sideways portfolio photo, which was his motivating example. That's Phase 2. If we want to ship Phase 1 + photo-rotation-only as a fast-follow, it's an extra ~2 days because rotation reuses no Phase 1 wrapper logic — just the same provider + a different button component.

---

## 10. Concrete file/touchpoint plan for Phase 1

New files:

- `src/contexts/AdminModeContext.tsx` — provider + `useAdminMode()` hook
- `src/components/admin-mode/AdminModeGate.tsx` — mirror of `DesignModeGate.tsx`
- `src/components/admin-mode/AdminChrome.tsx` — floating panel, mirror of `DevModeOverlay.tsx`
- `src/components/admin-mode/Editable.tsx` — wrapper primitive
- `src/components/admin-mode/EditableText.tsx` — text editor with save/cancel
- `src/app/api/admin/me/route.ts` — `GET` returning admin session info

Modified files:

- `src/app/LandingPageV2Client.tsx` — wrap tree with `<AdminModeProvider>`, mount `<AdminChrome />` next to `<DevModeOverlay />` (line 473).
- `src/components/landing-v2/sections/FounderLetterSection.tsx` — wrap each paragraph / heading in `<Editable kind="text" target={{ section: 'founder_letter', field: 'paragraphs', index: i }}>`.
- `src/components/team/MemberTakeover.tsx` — wrap bio, fun fact, role/name in `<Editable>`.
- `src/components/landing-v2/sections/FooterV2.tsx` — wrap address/phone/hours.
- `src/components/landing-v2/sections/MapSection.tsx` — same as Footer.

Unmodified but reused:

- `src/lib/admin/auth.ts` (existing `getAdminSession` reused on the new `/api/admin/me` route)
- All `/api/admin/website/**` PATCH/PUT endpoints
- `src/components/dev/DesignModeGate.tsx` (pattern reference)
- `src/components/dev-mode/DevModeOverlay.tsx` (pattern reference for chrome)

Total Phase-1 surface area: ~6 new files, ~5 modified files, ~600–900 LOC. Three to four days for someone fluent in this codebase.

---

## 11. Open decisions for Corey

These are the calls the design doc can't make for him:

1. **Vagaro override semantics** — accept the existing silent-overwrite behavior for Phase 1 (and document the gotcha in tooltips), or add `*_override_active` boolean columns now?
2. **`isOffVagaro` flag** — add the column in Phase 3, or wait until off-Vagaro stylist creation actually ships?
3. **Mobile-first floating chrome** — does Corey want the chrome to default to *expanded* on his phone (since he uses it on mobile), or stay collapsed-by-default like the dev mode?
4. **Inline rich text** — should bio/founder-letter use a real rich-text editor (`MiniRichEditor` exists), or stay plain textarea? Recommendation: textarea for Phase 1, swap to MiniRichEditor in Phase 2 if needed.
5. **"Edit mode" while signed-out** — should the URL param show a "log in to edit" prompt to non-admins, or stay completely silent? Recommendation: silent. The URL param is an admin tool, not a marketing surface.
