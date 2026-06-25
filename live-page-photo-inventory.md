# Live-Page Photo Inventory — every slot on the two live pages
Checked: 2026-06-10 against production (lashpop.vercel.app) + R2 object listing

Legend: ✅ HAVE (loads in prod) | ❌ MISSING | 🟡 MISSING but local recovery candidate exists (needs visual confirm)

## Topline: 275 slots — 116 have / 159 missing (14 of the missing have local candidates)

Instagram gallery (main page): all 74 images ✅ (every DB key present in R2; verified serving via resizer).
Team headshots (main page): all 17 active members ✅ (Vagaro CDN, + Grace local file).

⚠️ ALL lightboxes (instagram, carousel, team portfolio full-size) currently route through the DEAD cdn.lashpopstudios.com transform — even photos that exist fail to enlarge. Code fix pending in 3 components.

## main page static — 8/10 have
- ✅ [hero] hero-facetune.jpg — OK
- ✅ [founder letter bg] founder-letter-bg.jpg — OK
- ✅ [founder letter bg mobile] founder-letter-bg-mobile.webp — OK
- ✅ [emily signature] emily-signature-2.webp — OK
- ✅ [logo] logo-terracotta.webp — OK
- ✅ [storefront (map)] storefront.jpeg — OK
- ✅ [team group photo] team-group-photo.jpg — OK
- ✅ [Grace Ramos headshot] grace-ramos.jpg — OK
- 🟡 [Yelp logo (reviews)] 168812.png — MISSING (HTTP 404)
    - candidate: `public/lashpop-images/168812.png`
- 🟡 [Vagaro logo (reviews)] Vagaro_Logo.png — MISSING (HTTP 404)
    - candidate: `public/lashpop-images/Vagaro_Logo.png`

## work-with-us static — 5/5 have
- ✅ [join-our-team] join-our-team.webp — OK
- ✅ [booth-rental] booth-rental.webp — OK
- ✅ [training] training.webp — OK
- ✅ [team-lounge] team-lounge.jpg — OK
- ✅ [team-front-desk] team-front-desk.jpeg — OK

## work-with-us carousel — 9/19 have
- ✅ [2] photosbysalome-23.jpg — OK
- ❌ [3] IMG_1095.JPG — MISSING (dead old bucket)
- 🟡 [4] IMG_1200.JPG — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_1200.JPG`
- 🟡 [5] IMG_1174.JPG — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_1174.JPG`
- ✅ [6] lash-136.jpg — OK
- ❌ [7] lash-74.jpg — MISSING (object gone)
- ✅ [8] lash-102.jpg — OK
- ❌ [10] lash-42.jpg — MISSING (object gone)
- ✅ [11] lash-40.jpg — OK
- ✅ [12] photosbysalome-128.jpg — OK
- ✅ [13] photosbysalome-188.jpg — OK
- ✅ [14] photosbysalome-116.jpg — OK
- 🟡 [15] image.jpeg — MISSING (dead old bucket)
    - candidate: `s3-recovery/recoverable/image.jpeg`
- 🟡 [16] IMG_1190.JPG — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_1190.JPG`
- ❌ [17] lash-120.jpg — MISSING (object gone)
- 🟡 [18] IMG_0237.JPG — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_0237.JPG`
- ✅ [19] photosbysalome-16.jpg — OK
- ✅ [20] photosbysalome-35.jpg — OK
- ❌ [21] lash-25.jpg — MISSING (object gone)

## quiz — 13/24 have
- ❌ [classic #2] IMG_6439.jpeg — MISSING (dead old bucket)
- ✅ [classic #3] FullSizeRender_VSCO (3).jpeg — OK
- ✅ [classic #4] IMG_4037.jpeg — OK
- ❌ [classic #5] IMG_4005.jpeg — MISSING (dead old bucket)
- ❌ [classic #6] Facetune_03-03-2026-19-20-11_VSCO.jpeg — MISSING (object gone)
- ✅ [classic #7] IMG_2131_VSCO.jpeg — OK
- ❌ [hybrid #2] IMG_2479_VSCO.jpeg — MISSING (dead old bucket)
- ✅ [hybrid #3] FullSizeRender_VSCO (2).jpeg — OK
- ❌ [hybrid #4] Facetune_03-03-2026-20-49-14.jpeg — MISSING (object gone)
- ❌ [hybrid #5] Facetune_03-03-2026-19-27-04_VSCO.jpeg — MISSING (object gone)
- ✅ [hybrid #6] IMG_6993_VSCO.jpeg — OK
- ✅ [hybrid #7] IMG_7227_VSCO.jpeg — OK
- ✅ [wetAngel #2] IMG_1845.jpeg — OK
- ✅ [wetAngel #3] FullSizeRender_VSCO (1).jpeg — OK
- ❌ [wetAngel #4] Facetune_03-02-2026-20-00-12_VSCO.jpeg — MISSING (object gone)
- ❌ [wetAngel #5] Facetune_03-03-2026-20-05-48.jpeg — MISSING (object gone)
- ❌ [wetAngel #6] Facetune_03-03-2026-19-16-43_VSCO.jpeg — MISSING (object gone)
- ✅ [wetAngel #7] IMG_5272_VSCO.jpeg — OK
- ✅ [volume #1] IMG_7220_VSCO_VSCO_VSCO.jpeg — OK
- ✅ [volume #2] FullSizeRender_VSCO.jpeg — OK
- ✅ [volume #3] FullSizeRender_VSCO (5).jpeg — OK
- ❌ [volume #5] Facetune_03-03-2026-20-51-22.jpeg — MISSING (object gone)
- ❌ [volume #6] Facetune_03-03-2026-19-19-28_VSCO.jpeg — MISSING (object gone)
- ✅ [volume #7] FullSizeRender_VSCO (4).jpeg — OK

## team portfolio — 81/217 have

### Adrianna Payne — 2/18
- ❌ IMG_8472.jpeg — MISSING (dead old bucket)
- ❌ IMG_8487.jpeg — MISSING (dead old bucket)
- ❌ IMG_8471.jpeg — MISSING (dead old bucket)
- ❌ IMG_8470.jpeg — MISSING (dead old bucket)
- ❌ IMG_8469.jpeg — MISSING (dead old bucket)
- ❌ Facetune_16-03-2026-13-49-13_VSCO.jpeg — MISSING (object gone)
- ❌ IMG_6123.jpeg — MISSING (dead old bucket)
- ✅ IMG_6119.jpeg — OK
- ❌ IMG_8467.jpeg — MISSING (dead old bucket)
- ❌ IMG_8472.jpeg — MISSING (dead old bucket)
- ❌ Facetune_16-03-2026-13-49-13_VSCO.jpeg — MISSING (object gone)
- ❌ IMG_8470.jpeg — MISSING (dead old bucket)
- ❌ IMG_8469.jpeg — MISSING (dead old bucket)
- ❌ Facetune_16-03-2026-13-49-13_VSCO.jpeg — MISSING (object gone)
- ❌ Facetune_10-03-2026-16-35-59.jpeg — MISSING (object gone)
- ❌ Facetune_10-03-2026-16-33-33.jpeg — MISSING (object gone)
- ❌ Facetune_10-03-2026-16-35-04.jpeg — MISSING (object gone)
- ✅ FullSizeRender_VSCO.jpeg — OK

### Ashley Petersen — 0/6
- ❌ IMG_8764.jpeg — MISSING (dead old bucket)
- ❌ IMG_8553_VSCO.jpeg — MISSING (dead old bucket)
- ❌ IMG_8567_VSCO.jpeg — MISSING (dead old bucket)
- ❌ IMG_6289.jpeg — MISSING (dead old bucket)
- ❌ IMG_1990.jpeg — MISSING (dead old bucket)
- ❌ CB4DC2F2-AE20-4761-A8D2-18FF59A25DB4.jpeg — MISSING (object gone)

### Ava Zeutenhorst — 1/9
- ❌ IMG_1905.jpeg — MISSING (dead old bucket)
- ❌ IMG_1903.jpeg — MISSING (dead old bucket)
- ❌ IMG_1902.jpeg — MISSING (dead old bucket)
- ✅ FullSizeRender_VSCO.jpeg — OK
- ❌ IMG_1901.jpeg — MISSING (dead old bucket)
- ❌ IMG_1900.jpeg — MISSING (dead old bucket)
- ❌ IMG_5974.jpeg — MISSING (dead old bucket)
- ❌ IMG_1904.jpeg — MISSING (dead old bucket)
- ❌ IMG_5973.jpeg — MISSING (dead old bucket)

### Bethany Peterson — 2/9
- ❌ IMG_4084.jpeg — MISSING (dead old bucket)
- ❌ IMG_4014.jpeg — MISSING (dead old bucket)
- ❌ IMG_4012.jpeg — MISSING (dead old bucket)
- ❌ IMG_3043.jpeg — MISSING (dead old bucket)
- ❌ IMG_1075.jpeg — MISSING (dead old bucket)
- ❌ Facetune_10-11-2025-20-36-01.jpeg — MISSING (object gone)
- ✅ FullSizeRender_VSCO (5).jpeg — OK
- ❌ Facetune_10-11-2025-20-25-31_VSCO.jpeg — MISSING (object gone)
- ✅ IMG_2241.png — OK

### Elena Castellanos — 1/4
- ❌ IMG_4016.jpeg — MISSING (dead old bucket)
- ❌ IMG_0731.jpeg — MISSING (dead old bucket)
- ✅ IMG_0729.jpeg — OK
- ❌ IMG_0929.jpeg — MISSING (dead old bucket)

### Emily Rogers — 10/25
- ❌ IMG_8174.jpeg — MISSING (dead old bucket)
- ❌ IMG_8162.jpeg — MISSING (dead old bucket)
- ❌ IMG_6439.jpeg — MISSING (dead old bucket)
- ✅ IMG_5272_VSCO.jpeg — OK
- ❌ IMG_4891_VSCO.jpeg — MISSING (dead old bucket)
- ❌ IMG_4005.jpeg — MISSING (dead old bucket)
- ❌ IMG_2479_VSCO.jpeg — MISSING (dead old bucket)
- ✅ FullSizeRender_VSCO (4).jpeg — OK
- ✅ FullSizeRender_VSCO (2).jpeg — OK
- ❌ Facetune_21-11-2024-13-43-10.jpeg — MISSING (object gone)
- ✅ Facetune_20-09-2025-16-55-05.jpeg — OK
- ❌ Facetune_03-03-2026-20-52-41.jpeg — MISSING (object gone)
- ❌ Facetune_03-03-2026-20-51-22.jpeg — MISSING (object gone)
- ❌ Facetune_03-03-2026-20-49-14.jpeg — MISSING (object gone)
- ❌ Facetune_03-03-2026-20-05-48.jpeg — MISSING (object gone)
- ❌ Facetune_03-03-2026-19-19-28_VSCO.jpeg — MISSING (object gone)
- ❌ Facetune_03-03-2026-19-21-01_VSCO.jpeg — MISSING (object gone)
- ❌ Facetune_03-03-2026-19-23-23_VSCO.jpeg — MISSING (object gone)
- ❌ Facetune_03-03-2026-19-27-04_VSCO.jpeg — MISSING (object gone)
- ✅ IMG_0070.png — OK
- ✅ IMG_6443.JPG — OK
- ✅ IMG_6441.JPG — OK
- ✅ IMG_6447.JPG — OK
- ✅ IMG_4929.JPG — OK
- ✅ 626B0FEA-E665-4D54-B420-97E97583BCE6.JPG — OK

### Evie Ells — 0/20
- ❌ IMG_2330.jpeg — MISSING (dead old bucket)
- ❌ Facetune_03-02-2026-20-00-12.jpeg — MISSING (object gone)
- ❌ Facetune_10-11-2025-16-13-04.jpeg — MISSING (object gone)
- ❌ Facetune_10-11-2025-16-10-04.jpeg — MISSING (object gone)
- ❌ Facetune_10-11-2025-16-15-17.jpeg — MISSING (object gone)
- ❌ Facetune_10-11-2025-16-26-18.jpeg — MISSING (object gone)
- ❌ Facetune_30-01-2026-20-27-18.jpeg — MISSING (object gone)
- ❌ Facetune_03-02-2026-20-00-12.jpeg — MISSING (object gone)
- ❌ Facetune_21-01-2026-14-11-58.jpeg — MISSING (object gone)
- ❌ Facetune_25-11-2025-15-15-29.jpeg — MISSING (object gone)
- ❌ IMG_2855.jpeg — MISSING (dead old bucket)
- ❌ IMG_2555.jpeg — MISSING (dead old bucket)
- ❌ Facetune_20-11-2025-12-51-14.jpeg — MISSING (object gone)
- ❌ Facetune_20-11-2025-12-48-26.jpeg — MISSING (object gone)
- ❌ Facetune_12-11-2025-15-55-20.jpeg — MISSING (object gone)
- ❌ Facetune_11-11-2025-16-15-02.jpeg — MISSING (object gone)
- ❌ Facetune_11-11-2025-13-57-50.jpeg — MISSING (object gone)
- ❌ Facetune_10-11-2025-16-15-17.jpeg — MISSING (object gone)
- ❌ Facetune_03-03-2026-19-16-43_VSCO.jpeg — MISSING (object gone)
- ❌ Facetune_03-02-2026-20-00-12_VSCO.jpeg — MISSING (object gone)

### Grace Ramos — 0/4
- ❌ IMG_4030.jpeg — MISSING (dead old bucket)
- ❌ IMG_4029.jpeg — MISSING (dead old bucket)
- ❌ IMG_4028.jpeg — MISSING (dead old bucket)
- ❌ IMG_4027.jpeg — MISSING (dead old bucket)

### Haley Walker — 0/8
- ❌ IMG_1051.jpeg — MISSING (dead old bucket)
- ❌ IMG_4001.jpeg — MISSING (dead old bucket)
- ❌ IMG_2843_VSCO.jpeg — MISSING (dead old bucket)
- ❌ IMG_1798.jpeg — MISSING (dead old bucket)
- ❌ IMG_0801.jpeg — MISSING (dead old bucket)
- ❌ Facetune_10-11-2025-18-31-04.jpeg — MISSING (object gone)
- ❌ Facetune_01-12-2025-19-01-35.jpeg — MISSING (object gone)
- ❌ Facetune_01-12-2025-19-04-16.jpeg — MISSING (object gone)

### Kelly Katona — 19/20
- ✅ IMG_8218_VSCO.jpeg — OK
- ✅ IMG_6993_VSCO.jpeg — OK
- ✅ IMG_7220_VSCO_VSCO.jpeg — OK
- ✅ IMG_2131_VSCO.jpeg — OK
- ✅ IMG_1840.jpeg — OK
- ✅ IMG_2186_VSCO.jpeg — OK
- ✅ IMG_7220_VSCO_VSCO_VSCO.jpeg — OK
- ✅ IMG_6993_VSCO.jpeg — OK
- ✅ IMG_4037.jpeg — OK
- ✅ IMG_2131_VSCO.jpeg — OK
- ✅ FullSizeRender_VSCO (3).jpeg — OK
- ❌ IMG_6987.jpeg — MISSING (dead old bucket)
- ✅ IMG_8218_VSCO.JPG — OK
- ✅ IMG_7220_VSCO_VSCO.JPG — OK
- ✅ IMG_6993_VSCO.JPG — OK
- ✅ IMG_4035.jpeg — OK
- ✅ IMG_4034.jpg — OK
- ✅ IMG_4032.jpeg — OK
- ✅ IMG_2186_VSCO.JPG — OK
- ✅ IMG_2131_VSCO.JPG — OK

### Kelly Richter — 26/43
- ❌ IMG_8496.jpeg — MISSING (dead old bucket)
- ❌ IMG_8497.jpeg — MISSING (dead old bucket)
- ❌ IMG_8495.jpeg — MISSING (dead old bucket)
- ✅ IMG_8494 (1).jpeg — OK
- ❌ IMG_8492.jpeg — MISSING (dead old bucket)
- ❌ IMG_8493.jpeg — MISSING (dead old bucket)
- ❌ IMG_8491.jpeg — MISSING (dead old bucket)
- ✅ IMG_8286.jpeg — OK
- ❌ IMG_8489.jpeg — MISSING (dead old bucket)
- ❌ IMG_8490.jpeg — MISSING (dead old bucket)
- ✅ FullSizeRender_VSCO (1).jpeg — OK
- ❌ Facetune_08-11-2025-16-07-40.jpeg — MISSING (object gone)
- ✅ IMG_7189.jpeg — OK
- ❌ IMG_0056.jpeg — MISSING (dead old bucket)
- ✅ IMG_8286.jpeg — OK
- ❌ IMG_8119.jpeg — MISSING (dead old bucket)
- ❌ IMG_8107.jpeg — MISSING (dead old bucket)
- ❌ IMG_8047.jpeg — MISSING (dead old bucket)
- ✅ IMG_8048.jpeg — OK
- ❌ IMG_8046.jpeg — MISSING (dead old bucket)
- ✅ IMG_8045.jpeg — OK
- ✅ IMG_7189.jpeg — OK
- ❌ IMG_7722.jpeg — MISSING (dead old bucket)
- ✅ IMG_7721.jpeg — OK
- ✅ DipticExportSaveLocation.jpeg — OK
- ✅ DipticExportSaveLocation (1).jpeg — OK
- ✅ AF8BA1DB-21E1-4543-9798-1DA2D4EEE63E.jpeg — OK
- ✅ IMG_8286.jpeg — OK
- ✅ IMG_8048.jpeg — OK
- ❌ IMG_8047.jpeg — MISSING (dead old bucket)
- ✅ IMG_7721.jpeg — OK
- ✅ DipticExportSaveLocation (2).jpeg — OK
- ✅ DipticExportSaveLocation (1).jpeg — OK
- ✅ FullSizeRender_VSCO (1).jpeg — OK
- ✅ IMG_0975.png — OK
- ✅ IMG_3301.png — OK
- ❌ IMG_0094.JPG — MISSING (dead old bucket)
- ✅ IMG_8286.heic — OK
- ✅ IMG_8048.jpeg — OK
- ✅ IMG_8042.JPG — OK
- ✅ DipticExportSaveLocation.JPG — OK
- ✅ AF8BA1DB-21E1-4543-9798-1DA2D4EEE63E.JPG — OK
- ✅ IMG_7721.heic — OK

### Nancy Nicole — 0/6
- ❌ IMG_3797.jpeg — MISSING (dead old bucket)
- ❌ IMG_3795.jpeg — MISSING (dead old bucket)
- ❌ IMG_3792.jpeg — MISSING (dead old bucket)
- ❌ IMG_3794.jpeg — MISSING (dead old bucket)
- ❌ IMG_3791.jpeg — MISSING (dead old bucket)
- ❌ IMG_3793.jpeg — MISSING (dead old bucket)

### Paige Gordon — 0/5
- ❌ Facetune_16-03-2026-20-03-57.jpeg — MISSING (object gone)
- ❌ IMG_8508.jpeg — MISSING (dead old bucket)
- ❌ Facetune_16-03-2026-20-15-34.jpeg — MISSING (object gone)
- ❌ Facetune_16-03-2026-20-02-59.jpeg — MISSING (object gone)
- ❌ Facetune_16-03-2026-20-14-06.jpeg — MISSING (object gone)

### Rachel Edwards — 16/20
- ✅ IMG_3990.jpeg — OK
- ✅ IMG_3989.jpeg — OK
- ❌ IMG_3988.jpeg — MISSING (dead old bucket)
- ✅ IMG_3987.jpeg — OK
- ✅ IMG_3986.jpeg — OK
- ✅ IMG_3976.jpeg — OK
- ✅ IMG_3974.jpeg — OK
- ❌ IMG_3150_VSCO.jpeg — MISSING (dead old bucket)
- ❌ IMG_3973.jpeg — MISSING (dead old bucket)
- ✅ FullSizeRender_VSCO.jpeg — OK
- ✅ IMG_7227_VSCO.jpeg — OK
- ❌ Facetune_03-03-2026-19-20-11_VSCO.jpeg — MISSING (object gone)
- ✅ IMG_7254_VSCO.jpeg — OK
- ✅ IMG_7227_VSCO.JPG — OK
- ✅ IMG_3990.jpeg — OK
- ✅ IMG_3989.jpeg — OK
- ✅ IMG_3986.jpg — OK
- ✅ IMG_3976.jpg — OK
- ✅ IMG_3974.jpg — OK
- ✅ IMG_3151_VSCO.JPG — OK

### Renee Belton — 3/14
- ❌ IMG_8498.jpeg — MISSING (dead old bucket)
- ❌ IMG_9499.jpeg — MISSING (dead old bucket)
- ✅ IMG_9331.jpeg — OK
- ❌ IMG_9292.jpeg — MISSING (dead old bucket)
- 🟡 IMG_2095.jpeg — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_2095.JPG`
- ✅ IMG_2094.jpeg — OK
- 🟡 IMG_2093.jpeg — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_2093.JPG`
- 🟡 IMG_2090.jpeg — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_2090.JPG`
- ❌ IMG_2088.jpeg — MISSING (dead old bucket)
- 🟡 IMG_2089.jpeg — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_2089.JPG`
- 🟡 IMG_2087.jpeg — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_2087.JPG`
- 🟡 IMG_2085.jpeg — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_2085.JPG`
- 🟡 IMG_2084.jpeg — MISSING (dead old bucket)
    - candidate: `s3-recovery/messages-verify/IMG_2084.JPG`
- ✅ IMG_2086.jpeg — OK

### Savannah Scherer — 1/6
- ❌ IMG_4073.jpeg — MISSING (dead old bucket)
- ✅ FullSizeRender_VSCO.jpeg — OK
- ❌ IMG_2156.jpeg — MISSING (dead old bucket)
- ❌ IMG_2155.jpeg — MISSING (dead old bucket)
- ❌ IMG_2148.jpeg — MISSING (dead old bucket)
- ❌ IMG_2154.jpeg — MISSING (dead old bucket)
---

## Addendum — Emily/Jake thread cross-reference (2026-06-10, later)

Scanned all 273 image attachments across the three Emily/Jake-only threads (group chat + both 1:1s; 132 on disk, 141 offloaded to iCloud) against all 160 missing photo stems.

**Restored now (visually verified):**
- ✅ IMG_2479_VSCO — lash close-up from Emily's thread → quiz "hybrid #2" + Emily Rogers portfolio FIXED (uploaded + DB repointed, serving)
- ✅ 135a7550 — full-res original replaced the low-res cache copy on Evie's team key

**Recoverable by downloading in Messages (offloaded to iCloud; scroll Emily's thread around Nov 10–11 2025, harvest script will capture):**
- IMG_0056 (Kelly Richter portfolio)
- IMG_1896 (Kelly Richter DAM fallback — cache copy already in place)
- IMG_2084, 2085, 2087, 2088, 2089, 2090, 2093 (7× Renee Belton portfolio)

**Corrections:**
- ❌ The s3-recovery/messages-verify "candidates" for Renee's IMG_2084/2090/2093 are FALSE matches (verified: car, jacket, concert — personal photos from other threads). Disregard those candidate paths.
- 148 of the 160 missing stems have no match in the Emily/Jake threads — they came from other sources (stylists' own uploads, photographer, Facetune-on-iPhone).

### Round 2 (after Corey downloaded more in Messages)
- ✅ IMG_0056 — verified studio-interior shot → Kelly Richter portfolio slot RESTORED (uploaded + repointed, serving)
- All 186 on-disk thread images archived to `s3-recovery/emily-jake-thread/` (54 newly downloaded; most others were already-recovered duplicates — good redundancy)
- ⏳ STILL NEEDED from the thread: Renee's IMG_2084 / 2085 / 2087 / 2088 / 2089 / 2090 / 2093 — sent **Nov 10, 2025 6:22 PM** in Emily's thread, still offloaded. Scroll to that exact spot so they download.
