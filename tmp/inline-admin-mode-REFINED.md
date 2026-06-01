# Inline Admin Mode — Refined Design

**Status:** design, ready for build decision
**Supersedes:** `tmp/inline-admin-mode-scope.md` (good bones; two foundational claims were wrong)
**Date:** 2026‑05‑28
**Verified against code, not assumed.**

---

## 0. What changed vs the original scope doc

I re-checked every load-bearing claim against the actual source. Three corrections drive the whole refinement:

1. **The endpoints are NOT already authed.** The original doc says *"All existing `/api/admin/**` PATCH/PUT endpoints already auth via `requireAdminApi()`."* False. **13 of 17** admin write routes have **no application-layer guard at all** — including the exact `PATCH /api/admin/website/team` route the whole plan is built on. They lean entirely on middleware, which only checks that *some* `auth_token` cookie is **present** (not valid, not `damAccess`). So today, `document.cookie = "auth_token=x"` from any origin clears the edge gate and reaches those writes. This is a real authz hole **independent of inline admin** — and inline admin would invoke these writes from the public origin, amplifying it. **Hardening is now a hard Phase 0 prerequisite.**

2. **The Vagaro "race" is not data loss — it's display precedence, and it touches exactly two fields.** The sync (`workers/vagaro-sync/src/sync.ts:322‑345`) only ever writes the `vagaro_*` columns; it **never touches local `bio` or `image_url`.** So inline edits are never *clobbered* in the DB. The actual problem is `src/app/page.tsx:77,81`: `vagaroPhotoUrl || imageUrl` and `vagaroBio || bio` — a local edit is simply **invisible** whenever Vagaro has a non-empty value. `funFact`, `credentials`, `quickFacts`, `manualServiceCategories` have **no Vagaro source** → **zero race**. So the entire override problem collapses to **two fields: bio and photo**, and gets a clean, contained fix that ships *in* Phase 1.

3. **Auth/gate/toggle primitives are exactly as described and reusable.** `getAdminSession()` (`src/lib/admin/auth.ts:68`) reads the global `auth_token` cookie from any server context and sets `isAdmin = damAccess === true`. `DesignModeGate.tsx` is a perfect template (URL param + `localStorage`, `dynamic(ssr:false)`). The `staffphoto-optimize` worker's `rotate?: number` transform option is confirmed. These parts of the plan stand.

---

## 1. Verified facts (the foundation)

| Claim | Verdict | Evidence |
|---|---|---|
| `auth_token` cookie is global, readable on `/` | ✅ | `auth.ts:22‑25` reads cookie with no path scope |
| `isAdmin === damAccess` | ✅ | `auth.ts:59` |
| Homepage is `force-dynamic` | ✅ | `page.tsx:15` — so `router.refresh()` always re-pulls fresh data |
| Frontend precedence `vagaroBio \|\| bio`, `vagaroPhotoUrl \|\| imageUrl` | ✅ | `page.tsx:77,81` |
| Sync never writes local `bio`/`imageUrl` | ✅ | `sync.ts:322‑345` writes only `vagaro_*`, `displayOrder`, `isActive`, contact |
| Sync deactivates unmatched rows (≥3 fetched) | ✅ | `sync.ts:383‑399` — confirms off-Vagaro stylists need an opt-out flag |
| `PATCH /api/admin/website/team` accepts per-field `{bio,funFact,credentials,imageUrl,manualServiceCategories}` | ✅ | `team/route.ts:132‑183` |
| Team route is guarded by `requireAdminApi`/`isAdmin` | ❌ **WRONG** | `team/route.ts` imports no auth; no guard in handler |
| Middleware validates admin sessions | ❌ **presence only** | `middleware.ts:30‑37` checks `hasAuthCookie` truthiness, not validity/damAccess |
| `rotate` transform exists in worker | ✅ | `staffphoto-optimize/src/index.ts` `TransformOptions.rotate` |
| `DesignModeGate` pattern | ✅ | URL param + localStorage + `dynamic(ssr:false)` |

**Unguarded admin write routes today (must fix):** `dam-users`, `website/team`, `website/team/quick-facts`, `website/faqs`, `website/seo`, `website/instagram`, `website/reviews(+[id], rescore, suggest-stylist)`, `website/review-settings`, `website/hero-slideshow-presets`, `website/hero-slideshow-assignments`, `website/hero-archway`, `team/[id]/highlights`.
**Already guarded:** `website/studio`, `website/founder-letter`.

---

## 2. Architecture (kept from original, with refinements)

The shape is right: one provider, one `<Editable>` wrapper, one floating chrome panel, gated like DesignMode. Refinements below.

### 2.1 Mode toggle — unchanged
`?admin=1` on any public route, persisted in `localStorage` as `lashpop-admin-mode`, cleared by `?admin=0`. Mirror `DesignModeGate` exactly: `dynamic(ssr:false)`, mount nothing until enabled. **Not** a subdomain (cache scope + we want to QA the real render), **not** cookie-only (URL param is Slack-shareable).

### 2.2 Auth gate — `GET /api/admin/me` + server is still the source of truth
- New `GET /api/admin/me` → `{ isAdmin, name, email }` via `getAdminSession()`, else 401. Only called when the gate is active → **zero overhead for public visitors.**
- The client toggle is cosmetic chrome only. **Server-side `requireAdminApi()` on every write is the real authorization** — which is exactly why §3 (hardening) is non-negotiable.

### 2.3 Three primitives — unchanged from original
1. `<AdminModeProvider>` — context: `{ enabled, user, dirtyBlocks, registerBlock, save, discard, exit, refresh }`.
2. `<Editable kind="text|html|image|list" target={...}>` — pass-through in non-admin mode (zero hydration risk); in admin mode adds a portal-mounted hover outline + pencil/swap/rotate affordances and swaps in an editor on click.
3. `<AdminChrome />` — bottom-right panel (mobile: collapsed bottom bar w/ dirty badge), modeled on `DevModeOverlay.tsx`. Houses dirty count, Save-all, jump-to-dirty, and the few non-inline drawers (per-page SEO).

### 2.4 Persistence + reconciliation — **refined**
- **Reuse existing endpoints**, but only *after* they're guarded (§3). The only new read endpoint Phase 1 needs is `/api/admin/me`.
- **Per-block save** for independent fields (bio, funFact). **But the founder letter is a whole-object `PUT`** (`founder-letter/route.ts`), so the provider must hold the **canonical letter object**, merge each block's edit into it, and PUT the merged whole. Don't fire one PUT per dirty paragraph from stale copies — last write would drop sibling edits.
- **Reconciliation via `router.refresh()`, not a "reload hint."** Because the homepage is `force-dynamic` and built from App Router **server** components, on a successful save we: (a) keep optimistic local value, (b) call `router.refresh()` to re-pull server data so cross-component dependents (e.g. SEO JSON-LD that reads `credentials`) update, (c) clear local override once the refreshed prop matches. `router.refresh()` preserves client state — the open `MemberTakeover` stays open, scroll is kept. This is strictly better than the original's manual "reload to verify SEO" hint.

---

## 3. Phase 0 — Security hardening (NEW, mandatory, ~1 day)

**This is the single biggest delta from the original plan and it ships first.**

1. Add `requireAdminApi()` (the existing helper, `auth.ts:92`) to **every** unguarded `/api/admin/**` write handler listed in §1. Pattern is already established in `studio/route.ts` and `founder-letter/route.ts`:
   ```ts
   const gate = await requireAdminApi()
   if (gate instanceof NextResponse) return gate
   // ...gate.userId / gate.isAdmin available
   ```
2. Normalize the team route off any bespoke logic onto `requireAdminApi()` (it currently has none).
3. (Optional, recommended) tighten middleware comment/behavior: keep the cheap edge presence check, but the comment claiming "the layout still validates" is misleading for `/api/admin/*` (API routes have no layout). The real fix is the per-route guard above; leave middleware as the cheap first pass.

**Ship gate:** every admin write returns 401/403 without a valid `damAccess` session, verified by curling each route with (a) no cookie, (b) a junk cookie, (c) a valid non-admin session, (d) a valid admin session.

> Rationale: inline admin makes these endpoints reachable and obvious from the public origin. We are not bolting an edit UI onto an unauthenticated write surface. This work is worth doing on its own merits regardless of whether inline admin ships.

Same half-day also lands the **toggle + auth scaffold**: `useAdminMode()`, `<AdminModeProvider>`, empty `<AdminChrome />`, `AdminModeGate`, `GET /api/admin/me`, mounted in `LandingPageV2Client.tsx:337` next to `DevModeProvider`.

**Phase 0 ship gate:** `lashpopstudios.com/?admin=1` shows the floating panel with Corey's name; all admin writes are properly guarded.

---

## 4. The Vagaro precedence fix (lands in Phase 1, not deferred)

The original doc deferred this and told the editor to apologize via a tooltip. That ships an editor that **silently no-ops** on the two most-edited fields — the exact failure mode the doc itself warns against elsewhere. Fix it properly, and it's small because it's only two fields.

**Migration (tiny, additive):**
```sql
ALTER TABLE team_members
  ADD COLUMN bio_override   boolean NOT NULL DEFAULT false,
  ADD COLUMN image_override boolean NOT NULL DEFAULT false;
```

**Frontend precedence change** (`page.tsx`):
```ts
bio:   (member.bioOverride   ? member.bio      : (member.vagaroBio   || member.bio))      || undefined,
image:  member.imageOverride ? member.imageUrl : (member.vagaroPhotoUrl || member.imageUrl),
```

**Sync stays 100% untouched.** It keeps writing `vagaro_bio` / `vagaro_photo_url` on every run, so we always retain "what Vagaro currently says" — which powers the editor's diff view and a one-click **"revert to Vagaro"** (just flip the flag back to `false`).

**Editor behavior for bio/photo:** the `<Editable>` opens showing the *effective* value plus, when a Vagaro value exists, a small disclosure: *"Vagaro currently provides this. Saving sets an override."* Saving sends `{ bio, bioOverride: true }`; the route accepts the new boolean. No surprises, no silent loss, fully reversible.

This is the honest version of the original's open-decision #1 — and it's cheap enough that punting it is the wrong call.

---

## 5. Phase 1 — text edits (~3 days)

Builds on the guarded endpoints + the precedence fix.

| Target | Public location | Endpoint | Race? |
|---|---|---|---|
| Founder letter (heading/greeting/paragraphs/sign-off/signature) | `FounderLetterSection.tsx:39‑54` | `PUT founder-letter` (whole object, merged in provider) | none (already guarded) |
| Stylist **bio** (w/ override UI) | `MemberTakeover.tsx:304‑310` | `PATCH team` `{memberId,bio,bioOverride}` | handled §4 |
| Stylist **funFact** | `MemberTakeover.tsx:364‑370` | `PATCH team` `{memberId,funFact}` | **none (local-only)** |
| Studio hours/address/phone | `MapSection.tsx`, `FooterV2.tsx` | `PUT studio` (whole object) | none (already guarded) |
| Per-page SEO title/description | invisible → drawer in `<AdminChrome>` | `PUT seo` | none |

`<Editable kind="text">` = textarea + Save/Cancel + optimistic UI + revert-on-error + `router.refresh()` on success.

**Ship gate:** Corey fixes a typo in a stylist's bio from the live homepage, and it shows even when Vagaro has a bio.

---

## 6. Phase 2 — media (~1 week)

- `<Editable kind="image">` → opens existing `MiniDamExplorer` for swap. Targets: stylist portrait (grid `EnhancedTeamSectionClient.tsx` + takeover `:258`), hero archway, founder-letter bg. Photo swap writes `imageUrl` **+ `imageOverride: true`** (§4 precedence).
- Portfolio CRUD on the takeover: add tile (`POST /api/dam/team/[memberId]/photos`), remove (`DELETE .../photos/[photoId]`), set-primary star.
- **Rotation** — new `POST /api/admin/website/team/photos/[photoId]/rotate` `{degrees}` (guarded). Reads original from R2 → `staffphoto-optimize` with `rotate` → writes new R2 key → updates `filePath` → **nulls the 5 crop columns** (pre-rotation coords) → deletes old object. Client does instant CSS `rotate()` preview, then swaps to `<Image key={newUrl}>` (new R2 key = CDN cache miss, no stale image; respects the `cdn.lashpopstudios.com` loader). Same endpoint serves `-90`/`180`. ~50 LOC server; worker already done.

**Ship gate:** Corey rotates a sideways portfolio photo from his phone on the real takeover.

---

## 7. Phase 3 — structured / sensitive (~2 weeks, opinionated cut)

- Credentials inline (reuse `CredentialsEditor.tsx` markup in a takeover slide-down) — `PATCH team {credentials}`. **Local-only, no race.** After save, `router.refresh()` so SEO JSON-LD picks it up.
- Quick facts inline (reuse `QuickFactsEditor`) — `team/quick-facts`.
- Manual service-category chips — `PATCH team {manualServiceCategories}`. Local-only.
- Stylist visibility + reorder on the grid — `PUT team` (`isActive`, `displayOrder`), `framer-motion/Reorder`.
- **Off-Vagaro stylist creation** — `POST /api/admin/website/team/off-vagaro`. **Requires** `ALTER TABLE team_members ADD COLUMN is_off_vagaro boolean NOT NULL DEFAULT false;` **and** a guard in the sync deactivate loop (`sync.ts:383`): `if (row.isOffVagaro) continue;` — otherwise the next sync deactivates the hand-created stylist (verified the loop does exactly this).
- Service brand-copy inline on the service browser (price/duration stay Vagaro-owned, hierarchy stays on the admin page).
- Hero preset **assignment** inline (preset **creation** stays admin).

**Defer indefinitely:** FAQ category CRUD, review pipeline thresholds, full SEO structured-data editor, DAM user management, scrollytelling/theatre.

---

## 8. Risk register (refined)

| Risk | Original treatment | Refined treatment |
|---|---|---|
| **Unauthed admin writes** | missed (claimed already authed) | **Phase 0 hardening — mandatory, ships first** |
| **Vagaro bio/photo precedence** | deferred, tooltip apology | **2 boolean flags + precedence flip, ships in Phase 1, sync untouched, reversible** |
| Cross-component staleness (SEO) | "reload to verify" hint | **`router.refresh()`** on save (force-dynamic + RSC) |
| Founder-letter multi-block save | "per-block independent" | **provider holds canonical object, merges, single PUT** |
| Off-Vagaro stylist deactivated by sync | flagged, deferred | confirmed against `sync.ts:383`; `is_off_vagaro` + loop guard in Phase 3 |
| Hydration / public bundle bloat | gate + pass-through | unchanged — verified `DesignModeGate` does exactly this |
| Rotation crop staleness | null crops, lazy regen | unchanged — correct |
| Concurrent tabs | last-write-wins | unchanged — acceptable for single operator |
| Mobile touch affordances / 44px | persistent dashed border + 44px targets | unchanged — honors `reference_44px_tap_floor` |

---

## 9. Phase summary & cost

| Phase | Scope | New cost | Cumulative |
|---|---|---|---|
| **0** | Harden 13 routes + toggle/auth scaffold + `/api/admin/me` + precedence migration | ~1.5 days | 1.5d |
| **1** | Inline text: founder letter, bio (w/ override), funFact, studio info, per-page SEO | ~3 days | ~1 wk |
| **2** | Media: photo swap, portfolio CRUD, rotation | ~1 week | ~2 wk |
| **3** | Credentials, quick facts, categories, reorder/visibility, off-Vagaro, service copy | ~2 weeks | ~4 wk |

**Phase 0+1 is the real unlock** (~1 week) and it's the first time the admin write surface is actually secured.

---

## 10. Phase 0+1 touchpoints

**New files**
- `src/contexts/AdminModeContext.tsx` — provider + `useAdminMode()`
- `src/components/admin-mode/AdminModeGate.tsx` — mirror of `DesignModeGate`
- `src/components/admin-mode/AdminChrome.tsx` — floating panel (mirror `DevModeOverlay`)
- `src/components/admin-mode/Editable.tsx` + `EditableText.tsx`
- `src/app/api/admin/me/route.ts`
- `drizzle/XXXX_team_member_override_flags.sql` (the §4 migration)

**Modified**
- **13 route files** — add `requireAdminApi()` guard (Phase 0)
- `src/app/api/admin/website/team/route.ts` — also accept `bioOverride` / `imageOverride`
- `src/app/page.tsx:77,81` — precedence flip honoring the flags
- `src/app/LandingPageV2Client.tsx:337` — wrap with `<AdminModeProvider>`, mount `<AdminChrome/>`
- `FounderLetterSection.tsx`, `MemberTakeover.tsx`, `FooterV2.tsx`, `MapSection.tsx` — wrap targets in `<Editable>`

**Reused unchanged:** `auth.ts` (`getAdminSession`/`requireAdminApi`), `DesignModeGate`/`DevModeOverlay` (patterns), `MiniDamExplorer`, `staffphoto-optimize` worker.

---

## 11. The one decision left for Corey

Everything the original doc punted (override semantics, reconciliation, save model) is now **decided** above. The only genuinely open call:

**Do we ship Phase 0 hardening as its own immediately-mergeable PR first** (secure the write surface regardless of inline admin), then build inline mode on top — or bundle hardening into the Phase 1 inline PR? Recommendation: **separate, ship-now PR for Phase 0 hardening.** It's a standalone security win, it's easy to review, and it de-risks everything after it.
