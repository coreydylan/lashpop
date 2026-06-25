# LashPop — Images still missing on the live site (2026-06-24)

After the R2 account suspension, a full integrity check (every asset HEAD-checked against the bucket, **not** just the DB host) found **75 images broken on the live frontend**. We've now recovered **38** (all from Emily's `lashpop313` send). **37 remain broken** — listed below with exactly where each shows and what we'd need to restore it.

Broken images render in each artist's **portfolio takeover** (homepage → Team → click the artist).

## A. Need from Emily — 30 files (not in her 313 send)
Uploaded months ago but not in Emily's current camera roll under the same name (deleted, or re-saved under a new IMG number). Ask her by **stylist + service**, not filename.

### Adrianna Payne (4) — lash lift / hybrid
- `IMG_6123.jpeg` — lash lift
- `IMG_8467.jpeg` — lash lift
- `IMG_8487.jpeg` — lash lift
- `IMG_8469.jpeg` — hybrid *(2 portfolio slots use this)*

### Rachel Edwards (3)
- `IMG_3150_VSCO.jpeg`, `IMG_3973.jpeg`, `IMG_3988.jpeg`

### Bethany Peterson (2)
- `IMG_3043.jpeg`, `IMG_4014.jpeg`

### Haley Walker (3)
- `IMG_1798.jpeg` — brow lamination
- `Facetune_01-12-2025-19-04-16.jpeg`
- `Facetune_10-11-2025-18-31-04.jpeg` — hybrid

### Paige Gordon (5)
- `IMG_8508.jpeg`
- `Facetune_16-03-2026-20-02-59.jpeg`
- `Facetune_16-03-2026-20-03-57.jpeg`
- `Facetune_16-03-2026-20-14-06.jpeg` — hybrid
- `Facetune_16-03-2026-20-15-34.jpeg` — hybrid

### Kelly Richter (2)
- `IMG_0094.JPG` — candid
- `IMG_8491.jpeg` — hybrid

### Kelly Katona (1)
- `IMG_6987.jpeg` — classic set

### Candids / IG strip — no specific artist (8)
- `IMG_0237.JPG`, `IMG_1090.JPG`, `IMG_1205.JPG`, `IMG_1236.JPG`, `IMG_6120.jpeg`, `IMG_6396.jpeg` — candids
- `image.jpeg` — IG-carousel graphic (likely a designed composite, not a photo)
- `1762913801621-qruz2e-IMG_1243 copy.jpg` + `…copy22.jpg` — web crops of `IMG_1243` (we HAVE `IMG_1243` live; rebuildable from it)

## B. The 6 `lash-N` — photographer gallery is NOT the source (corrected 2026-06-24)
- `lash-25.jpg`, `lash-42.jpg`, `lash-74.jpg`, `lash-115.jpg`, `lash-120.jpg`, `lash-132.jpg`
- **Earlier assumption was wrong.** Verified via perceptual hashing: the 3 *working* `lash-N` (lash-40/102/136) are LashPop **brand/candid** shots — storefront exterior, hallway, reception-with-LP-door — that do **not** appear anywhere in the 196-photo photosbysalome gallery (best pHash distance 98 = no match; hashing validated at 0 for identical files; also eyeballed the full "THE SHOP" set). The `lash-N` are tagged `ig_carousel,candids`, i.e. brand/social shots, not the professional photosbysalome set.
- **Realistic remaining sources:** LashPop's Instagram (@lashpopstudios — carousel posts) and/or the Wayback Machine / Google cache of the old site. Both still hit the unmapped-matching problem (which post = `lash-25`), since the originals are gone.

## C. Truly gone — 1
- `CB4DC2F2-AE20-4761-A8D2-18FF59A25DB4.jpeg` (Ashley Petersen) — a purged iMessage attachment; no surviving copy anywhere.

---
**Recovery infra:** files go to the `lashpop-dam` bucket under `uploads/recovered/<asset-id>.jpg`, then `assets.file_path` is repointed. Rollback snapshots: `_recovery_backup_20260622` (dead-bucket set) + `_recovery_backup_facetune_20260624`. Source of truth for "what's actually broken" = HEAD-check every asset URL, **not** the DB host (the DB pointed broken Facetune at the *good* bucket, hiding them).
