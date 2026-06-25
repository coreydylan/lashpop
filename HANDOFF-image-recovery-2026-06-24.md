# Image Recovery — Session Handoff (2026-06-24)

Pick-up-cold handoff for the LashPop image recovery after the Cloudflare R2 account suspension.

---

## TL;DR — current state

- **Live site (lashpop.vercel.app) broken images: 75 → 37** this session.
- Recovered **129** assets (91 `IMG_####` + 38 Facetune), all from Emily's full photo send.
- **37 still broken**, split into: 6 `lash-N` (public source — recoverable), ~27 that **need Emily** (only on her device), 1 graphic, 1 truly gone, 2 rebuildable crops.
- CDN worker was upgraded (AVIF/HEIC/retina) and is live; one cosmetic loader tweak (`q80→82`) is committed but **not yet pushed to Vercel**.

---

## Infrastructure / how recovery works

- **Live bucket:** `lashpop-dam` on the `corey@experialstudio.com` Cloudflare account → public at `https://pub-b6624c485ec245d68de72be196a72d75.r2.dev`.
- **Dead bucket:** `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev` (old account, 403s everything).
- **Resizer worker:** `workers/lashpop-img` → `https://lashpop-img.experial.workers.dev/<key>?w=&q=`. Reads `lashpop-dam`, transforms via the Cloudflare Images binding. The Next.js loader (`src/lib/cf-image-loader.ts`) rewrites any `pub-*.r2.dev/<key>` → the worker.
- **Recovery procedure per asset:** upload the image to `lashpop-dam` at key `uploads/recovered/<asset-id>.jpg`, then set `assets.file_path = https://pub-b6624…r2.dev/uploads/recovered/<asset-id>.jpg`. HEIC → convert to JPEG first (`sips -s format jpeg`). Verify it renders 200 via the worker.
- **CRITICAL — how to find what's actually broken:** do NOT trust the DB host. Many broken rows point at the *good* bucket but the object was never uploaded (404). HEAD-check every `assets.file_path` against the bucket. (That's how we found the 51 good-bucket-missing this session.)
- **wrangler:** authed to experialstudio via `CLOUDFLARE_API_TOKEN`. Strip `CLAUDE_CODE_*` env vars before any wrangler call.
- **Rollback tables (in the lashpop Supabase, project `pklzmoajxjuqkgstqqzx`):** `_recovery_backup_20260622` (dead-bucket set), `_recovery_backup_facetune_20260624`. Restore with `UPDATE assets a SET file_path=b.old_file_path FROM <table> b WHERE a.id=b.id`.
- **The clean source of truth for recovery files:** `~/Desktop/lashpop313/` — Emily's full ~310-image send (EMILY-ONLY, so filename matching within it is collision-safe). Plus `s3-recovery/` staging on the Air.

> ⚠️ **Hard lesson:** matching `IMG_####` by filename against the *general* Photos library / iMessage history / old `s3-recovery` staging pulls Corey's PERSONAL photos (we briefly published a hospital photo, a bank card, passports — caught, reverted, deleted). Only match within an **Emily-only** set, and **visually verify** every batch before upload.

---

## The 37 still-broken, by set

### SET 1 — `lash-N` brand/candid (6) — PUBLIC SOURCE, recoverable
`lash-25, lash-42, lash-74, lash-115, lash-120, lash-132`
- **What they are:** uploaded **2026-02-02 20:01–20:04** in a single site-build batch, *alongside* the `photosbysalome-N` gallery and some `IMG_` files — but a **separate** folder. The numbering (25,40,42,74,102,115,120,132,136 = a sparse pick from `lash-1…136`) means someone had a pre-named folder of ~136 `lash-N.jpg` images and uploaded a curated 9. The names came from that folder, **not** the DAM or the photographer.
- **Content:** LashPop **brand/candid** shots — storefront exterior, hallway, reception-with-LP-door, studio candids. Tagged `ig_carousel,candids`.
- **Where they show:** gallery / IG strip (no specific stylist).
- **3 still WORKING for reference:** `lash-40` (reception desk), `lash-102` (storefront exterior), `lash-136` (hallway) — downloadable from the live bucket to use as visual/pHash reference.
- **VERIFIED NOT the source:** photosbysalome gallery (pHash, all 196 photos, best distance 98 = no match), `lashpop313`, `s3-recovery`, Wayback (only 36 old-Squarespace snapshots, no images), **downloaded** iMessage (all 5,448 on-disk attachments hashed, no match), byte-size fingerprint (re-encoded on upload, so DAM sizes ≠ source bytes — even the 3 working ones don't byte-match anything).
- **REMAINING LEADS (both public, no iCloud/iMessage wall):**
  1. **@lashpopstudios Instagram** — the `ig_carousel` tag + "carousel photos came from IG" (Corey) → the `lash-N` folder is almost certainly a bulk export of the IG. brightdata MCP was offline this session (transport error); retry or use another scraper.
  2. **www.lashpopstudios.com** — the OLD Squarespace site is *still live* (domain never cut over). The storefront/interior brand shots are likely on it. Public — scrape it, match the 3 working `lash-N`, pull the 6.
- Note: `image.jpeg` (SET 4) has the exact same byte size (926734) as `lash-132` — likely the same image under a generic name.

### SET 2 — `IMG_####` candids + service shots (21) — NEED EMILY
Not in Emily's 313 send (deleted from her roll, or re-saved under a new IMG#). Ask by **stylist + service**, not filename. Upload dates show which DAM session they came from (all traced to Emily's DAM account):
- **Adrianna Payne** (uploaded 2026-03-16/18): `IMG_8469` ×2 (hybrid), `IMG_8467` (lash lift), `IMG_6123` (lash lift), `IMG_8487` (lash lift)
- **Rachel Edwards** (2026-03-10): `IMG_3150_VSCO`, `IMG_3973`, `IMG_3988`
- **Bethany Peterson** (2026-03-10): `IMG_3043`, `IMG_4014`
- **Haley Walker** (2026-03-16): `IMG_1798` (brow lamination)
- **Kelly Richter**: `IMG_0094` (candid, 2025-11-11), `IMG_8491` (hybrid, 2026-03-18)
- **Kelly Katona** (2026-02-02): `IMG_6987` (classic)
- **Paige Gordon** (2026-03-18): `IMG_8508`
- **no stylist / candids** (uploaded 2025-11-11 & 2026-02-02): `IMG_0237`, `IMG_1090`, `IMG_1205`, `IMG_1236`, `IMG_6120`, `IMG_6396`

### SET 3 — Facetune Emily didn't include (6) — NEED EMILY
Uploaded 2026-03-16/18. Not in `lashpop313`.
- **Haley Walker:** `Facetune_01-12-2025-19-04-16`, `Facetune_10-11-2025-18-31-04` (hybrid)
- **Paige Gordon:** `Facetune_16-03-2026-20-02-59`, `-20-03-57`, `-20-14-06` (hybrid), `-20-15-34` (hybrid)

### SET 4 — graphic / gone / rebuildable (4)
- `image.jpeg` — IG-carousel **graphic** (uploaded 2026-02-02, same batch as lash-N; likely a designed composite). Possibly == `lash-132` (same byte size).
- `CB4DC2F2-AE20-4761-A8D2-18FF59A25DB4.jpeg` (Ashley Petersen, uploaded 2026-03-10) — purged iMessage attachment, **no surviving copy anywhere**. Treat as permanently lost.
- `1762913801621-qruz2e-IMG_1243 copy.jpg` + `…copy22.jpg` (uploaded 2026-01-06) — web-edited **crops of `IMG_1243`**, which is already live. **Rebuildable** from it (or just repoint both rows to the live `IMG_1243`).

---

## What was recovered THIS session (for context)
- **91 `IMG_####`** — 72 from the date-constrained 6/16 Apple Photos import + 19 from `~/Desktop/lashpop313` (full-res). Repointed, all render 200.
- **38 Facetune** — from `~/Desktop/lashpop313` (Facetune names are unique timestamps → collision-safe). Visually verified all 38 = lash/brow close-ups. **Fully restored Evie Ells (15/15) and Emily Rogers (9/9) portfolios.**
- Recovery manifests/scratch: `recovery-repoint-plan.json`, `missing-images-live-2026-06-24.md`, `recovery-rollback.sql`.

## CDN upgrade THIS session
- `workers/lashpop-img` reworked: per-request AVIF/WebP/JPEG negotiation (Accept header), HEIC→web transcode, retina `dpr`, mild sharpen, format-aware cache + `Vary: Accept`. **Deployed & verified live.** Committed `f791ddd`.
- `src/lib/cf-image-loader.ts` default quality 80→82 — committed, **NOT pushed to Vercel** (worker AVIF win is already live independent of the Vercel deploy).

---

## NEXT STEPS (in priority order)
1. **`lash-N` (6):** scrape **www.lashpopstudios.com** (old Squarespace, public) and/or **@lashpopstudios** IG; pHash-match the 3 working `lash-N` to confirm source, pull the 6 missing. (Tooling note: brightdata MCP was erroring this session.)
2. **Rebuild the 2 `IMG_1243` crops** from the live `IMG_1243` (quick; takes 37→35).
3. **Send Emily the list** (in `missing-images-live-2026-06-24.md`) for SET 2 + SET 3 (~27 shots) — organized by stylist+service so she can find them. Drop returns in a folder; same pipeline finishes them.
4. **Push to main** to ship the `q80→82` loader tweak to Vercel (optional/cosmetic).
5. Accept `CB4DC2F2` and possibly `image.jpeg` as gone.

**Field thread:** `Lashpop image recovery — permanently lost / unmapped images` (id `3a82e780-2112-4674-8277-f1cc8384b932`) has the running log.
