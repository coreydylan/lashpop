# LashPop Photo Recovery — Status Inventory
Updated: 2026-06-10 (post R2-migration, post personal-photo purge)

## Topline

| Store | Working | Broken | Total |
|---|---|---|---|
| DAM assets (`assets` table) | 216 | **168** | 384 |
| Team photos (`team_members` + `team_member_photos`) | rest | **6 keys** (2 headshots) | — |
| Quiz photos (enabled) | 21 | **3** | 24 |
| Instagram | 74 | 0 | 74 |

Broken DAM breakdown: **117** rows still point at the dead old bucket (`pub-f98565…`) — mostly rows reverted during the personal-photo purge plus never-recovered uploads. **51** rows point at the new bucket but the object is missing (deleted in purge / never uploaded).

## FIXABLE NOW

### Team photos — 6 missing objects (LOW impact: live headshots come from Vagaro CDN, not R2)
Live team headshots render `vagaroPhotoUrl || imageUrl` — all active members have Vagaro photos, so nothing was broken on the public site. These R2 keys are DAM-internal/fallback only. 5 of 6 RESTORED 2026-06-10 (Kimberly full-res iMessage original, 4 from Chrome-cache captures). Remaining: nancy-greidanus.jpg (no copy found anywhere; unused fallback — fix only if ever needed). The filename-matched 'originals' for IMG_1060/IMG_1896 were a cat photo and a meme — collision rule vindicated:

- **Evie Ells (portfolio)** — `team/2f8a0d0e-9f89-4c48-bb74-22a7f8ccaa2d/1762983101044-scxpjo-IMG_1046.JPG`
  - candidate: `s3-recovery/chrome-cache/team/2f8a0d0e-9f89-4c48-bb74-22a7f8ccaa2d/1762983101044-scxpjo-IMG_1046.JPG`
  - candidate: `s3-recovery/imessage-targeted/IMG_1046.JPG`
- **Kelly Richter (portfolio)** — `team/50317859-e156-467c-9380-bfbc8b0babd2/1762910017977-qu6i7t-135a7550.JPG`
  - candidate: `s3-recovery/chrome-cache/team/50317859-e156-467c-9380-bfbc8b0babd2/1762910017977-qu6i7t-135a7550.JPG.webp`
- **Elena Castellanos (portfolio)** — `team/5ed2f968-cc51-493f-88a3-106780703633/1762906421142-scb758-IMG_0220.jpeg`
  - candidate: `s3-recovery/chrome-cache/team/5ed2f968-cc51-493f-88a3-106780703633/1762906421142-scb758-IMG_0220.jpeg.webp`
- **Renee Belton (portfolio)** — `team/777aa804-3cf5-4bf4-8d61-a8d854f799e9/1762906348805-ltx3e-135a7573.JPG`
  - candidate: `s3-recovery/chrome-cache/team/777aa804-3cf5-4bf4-8d61-a8d854f799e9/1762906348805-ltx3e-135a7573.JPG.webp`
- **Nancy Nicole (headshot+portfolio)** — `team/d140651f-f29d-414a-a517-1ba4bf40ee39/nancy-greidanus.jpg`
  - candidate: `s3-recovery/chrome-cache/team/d140651f-f29d-414a-a517-1ba4bf40ee39/1762983163767-kykamo-IMG_1060.JPG`
- **Kimberly Starnes (headshot, inactive)** — `team/ff5f9b78-e530-4b7f-808b-c20f90f6e5da/1762928405764-tsluy-IMG_1896.webp`
  - candidate: `s3-recovery/chrome-cache/team/ff5f9b78-e530-4b7f-808b-c20f90f6e5da/1762928405764-tsluy-IMG_1896.webp`
  - candidate: `s3-recovery/imessage-targeted/IMG_1896.jpg`

### lash-N carousel slots — 6 missing, recoverable via photosbysalome gallery remap (visual matching needed)
The full 196-photo shoot is in `s3-recovery/photosbysalome-gallery/` (+ B2). Open each and assign the right `photosbysalome-N` frame. NEVER auto-fill (per project rule).

- `uploads/1770091263626-ksv3ki-lash-25.jpg` (asset 17522a7d-4ba5-4135-99d6-721e057ec81c)
- `uploads/1770091392520-wsh6x-lash-132.jpg` (asset 952430d5-6cd4-406e-9197-2333fda95546)
- `uploads/1770091401106-jc8brg-lash-120.jpg` (asset cbadcedb-b8f8-444d-ac81-499d11c1335f)
- `uploads/1770091428509-33fx5e-lash-42.jpg` (asset a500fca1-161d-45b1-92c5-25978377962b)
- `uploads/1770091435651-61f464-lash-115.jpg` (asset 96bdd0ba-1bb7-4403-8fbf-505070693087)
- `uploads/1770091444390-rnprqg-lash-74.jpg` (asset 071da7d1-2538-42f5-9128-e5d07a320905)

### Dead-bucket rows with filename-matched local candidates — 15 (UNSAFE without visual confirm: IMG_#### numbers collide with personal photos)

- **1762913801621-qruz2e-IMG_1243copy22.jpg** (asset 47234558-6010-4aa1-a1c5-2834fce95ec7)
  - candidate: `s3-recovery/messages-verify/IMG_1243.JPG`
  - candidate: `s3-recovery/recoverable/IMG_1243.JPG`
- **image.jpeg** (asset db257303-e3aa-46d2-863a-f095e695a2fa)
  - candidate: `s3-recovery/recoverable/image.jpeg`
- **IMG_0237.JPG** (asset fe8f79fb-0109-486a-9d37-22625f0b6374)
  - candidate: `s3-recovery/messages-verify/IMG_0237.JPG`
- **IMG_1174.JPG** (asset 87c37b09-cdf7-4011-9d18-94923832b653)
  - candidate: `s3-recovery/messages-verify/IMG_1174.JPG`
- **IMG_1190.JPG** (asset 913c50f5-7efd-4f66-8b3e-e3478f1204e5)
  - candidate: `s3-recovery/messages-verify/IMG_1190.JPG`
- **IMG_1200.JPG** (asset a628827d-9afa-46db-b95f-dca17fdbfe04)
  - candidate: `s3-recovery/messages-verify/IMG_1200.JPG`
- **IMG_1243.JPG** (asset ee5bb5ca-787a-4d4c-8053-b7e88acb9e66)
  - candidate: `s3-recovery/messages-verify/IMG_1243.JPG`
  - candidate: `s3-recovery/recoverable/IMG_1243.JPG`
- **IMG_1268.JPG** (asset bdfd6b02-40de-405b-9dc7-490c353867e8)
  - candidate: `s3-recovery/messages-verify/IMG_1268.JPG`
  - candidate: `s3-recovery/recoverable/IMG_1268.JPG`
- **IMG_2084.jpeg** (asset 4043bf83-1275-41b1-8978-3104a94938da)
  - candidate: `s3-recovery/messages-verify/IMG_2084.JPG`
- **IMG_2085.jpeg** (asset 05d7e0a7-dc46-4168-9cdf-5090cf5722cf)
  - candidate: `s3-recovery/messages-verify/IMG_2085.JPG`
- **IMG_2087.jpeg** (asset 2596d0eb-08fe-466f-aaf9-fb071cfcdbf4)
  - candidate: `s3-recovery/messages-verify/IMG_2087.JPG`
- **IMG_2089.jpeg** (asset 87dc00c2-12d3-484f-bccc-4f3227f3e948)
  - candidate: `s3-recovery/messages-verify/IMG_2089.JPG`
- **IMG_2090.jpeg** (asset 0dd3bee2-ac91-4574-9f6f-4575d923ded4)
  - candidate: `s3-recovery/messages-verify/IMG_2090.JPG`
- **IMG_2093.jpeg** (asset a3b70889-282e-4ea2-8805-5eaee095c1d8)
  - candidate: `s3-recovery/messages-verify/IMG_2093.JPG`
- **IMG_2095.jpeg** (asset 056cd678-50b9-4127-b37b-bd6d1c619c6b)
  - candidate: `s3-recovery/messages-verify/IMG_2095.JPG`

## TRULY LOST (iPhone-only — only hope is Corey's iPhone Photos / Recently Deleted)

### Facetune edits — 44 new-bucket-missing objects (≈38 unique files; dates in filename DD-MM-YYYY)

- `Facetune_01-12-2025-19-04-16.jpeg`
- `Facetune_03-02-2026-20-00-12_VSCO.jpeg`
- `Facetune_10-11-2025-16-15-17.webp`
- `Facetune_20-11-2025-12-51-14.webp`
- `Facetune_01-12-2025-19-01-35.jpeg`
- `Facetune_03-03-2026-20-05-48.jpeg`
- `Facetune_30-01-2026-20-27-18.webp`
- `Facetune_10-11-2025-16-10-04.webp`
- `Facetune_21-11-2024-13-43-10.jpeg`
- `Facetune_10-03-2026-16-33-33.jpeg`
- `Facetune_10-03-2026-16-35-04.jpeg`
- `Facetune_03-03-2026-19-27-04_VSCO.jpeg`
- `Facetune_10-03-2026-16-35-59.jpeg`
- `Facetune_03-03-2026-19-23-23_VSCO.jpeg`
- `Facetune_16-03-2026-20-14-06.jpeg`
- `Facetune_16-03-2026-20-15-34.jpeg`
- `Facetune_16-03-2026-20-03-57.jpeg`
- `Facetune_16-03-2026-13-49-13_VSCO.jpeg`
- `Facetune_10-11-2025-20-36-01.jpeg`
- `Facetune_03-03-2026-19-21-01_VSCO.jpeg`
- `Facetune_11-11-2025-13-57-50.webp`
- `Facetune_03-03-2026-19-19-28_VSCO.jpeg`
- `Facetune_03-03-2026-19-20-11_VSCO.jpeg`
- `Facetune_03-03-2026-19-16-43_VSCO.jpeg`
- `Facetune_11-11-2025-16-15-02.webp`
- `Facetune_12-11-2025-15-55-20.webp`
- `Facetune_20-11-2025-12-48-26.webp`
- `Facetune_25-11-2025-15-15-29.webp`
- `Facetune_21-01-2026-14-11-58.webp`
- `Facetune_03-02-2026-20-00-12.webp`
- `Facetune_10-11-2025-18-31-04.jpeg`
- `Facetune_10-11-2025-16-26-18.webp`
- `Facetune_10-11-2025-16-15-17.webp`
- `Facetune_10-11-2025-16-13-04.webp`
- `Facetune_03-02-2026-20-00-12.webp`
- `Facetune_03-03-2026-20-49-14.jpeg`
- `Facetune_03-03-2026-20-51-22.jpeg`
- `Facetune_03-03-2026-20-52-41.jpeg`
- `Facetune_10-11-2025-20-25-31_VSCO.jpeg`
- `Facetune_08-11-2025-16-07-40.jpeg`
- `Facetune_16-03-2026-13-49-13_VSCO.webp`
- `Facetune_16-03-2026-13-49-13_VSCO.webp`
- `Facetune_16-03-2026-20-02-59.webp`
- `Facetune_08-11-2025-16-07-40.jpeg`

### Other missing objects (purged iMessage attachment etc.)

- `CB4DC2F2-AE20-4761-A8D2-18FF59A25DB4.jpeg` (asset 07dbd5d9-2667-4ea2-a2f2-566edce5c58d, file_name CB4DC2F2-AE20-4761-A8D2-18FF59A25DB4.jpeg)

## Dead-bucket rows with NO local candidate — 102 rows
Mix of (a) personal-photo purge reverts — these rows referenced Corey's personal photos that were wrongly uploaded, so the "original" never belonged to LashPop; and (b) genuinely lost DAM uploads. Each needs an intentional decision: re-source from Jake/Emily chats, replace via admin, or delete the DAM row.

- 1762913801621-qruz2e-IMG_1243 copy.jpg  (asset fb93ff3d-5559-4c84-bc08-2c29cb648411)
- IMG_0056.jpeg  (asset c0a513df-4a60-4d81-8c87-9625a0593c3e)
- IMG_0094.JPG  (asset 7cd09b0d-db04-4152-8aae-bdb4bdd0dc0e)
- IMG_0191.JPG  (asset b3f05fac-8d80-42a5-aac0-cb292a943358)
- IMG_0731.jpeg  (asset 5c582f85-a1d1-4ac5-a49a-91145e613c7d)
- IMG_0801.jpeg  (asset e0ffda59-bc37-4555-b15f-d592d195f214)
- IMG_0929.jpeg  (asset 44186612-c5a9-4ea4-bfa8-a358e2e57880)
- IMG_1017.JPG  (asset 8456ecbf-d42b-457d-8b23-22460d79a554)
- IMG_1051.jpeg  (asset 0c10a434-5e59-4d82-98d8-04f83606a48b)
- IMG_1075.jpeg  (asset 70a75a48-c008-41b1-987d-7250fc829c6a)
- IMG_1090.JPG  (asset 64a47d6e-5c7d-4bb7-9c4f-23c35f64b9c1)
- IMG_1095.JPG  (asset 923f2b95-8687-400a-9782-d397e087025e)
- IMG_1205.JPG  (asset cbcbbccc-90be-4a7a-8bf9-2f4143551572)
- IMG_1220.JPG  (asset 909f48f5-f3f0-4db0-baf8-32199596bfcf)
- IMG_1225.JPG  (asset 4a689c34-0575-4eb9-b964-121661da1bc8)
- IMG_1236.JPG  (asset 3ff4592b-cfe0-4c78-afe3-8f899353aa17)
- IMG_1245.JPG  (asset ad3bbd9e-8d16-4e93-80ad-e0d1a58d1578)
- IMG_1798.jpeg  (asset 2ebadc8f-522f-4a77-8167-ef60ffad04a9)
- IMG_1900.jpeg  (asset 921e6a5e-9a83-40cc-b7f9-d470506d340d)
- IMG_1901.jpeg  (asset 72155a16-1961-4548-8d51-3858450489f6)
- IMG_1902.jpeg  (asset 2919c39e-7df5-4077-82f3-119486952f0e)
- IMG_1903.jpeg  (asset 5328c517-5fed-4b66-9c2a-b733b8b11b7d)
- IMG_1904.jpeg  (asset e97a6dfe-903c-4565-a07f-fbe9e21b0eca)
- IMG_1905.jpeg  (asset bcab7c41-8f1e-469e-ac35-8def99b9bb18)
- IMG_1990.jpeg  (asset a3705f2f-14b0-44cc-acbe-833d4aa02c81)
- IMG_2088.jpeg  (asset 09f193bb-9e47-47eb-bd00-43d859e99a1c)
- IMG_2148.jpeg  (asset 606fb97c-dd06-4b91-a9a3-d980a61f1193)
- IMG_2154.jpeg  (asset 6f1ddfcc-5c93-44ff-986f-e78a82e99260)
- IMG_2155.jpeg  (asset bbd24dc2-46e8-46e1-8136-cd4aa148a5de)
- IMG_2156.jpeg  (asset 64b0f3fb-ebbf-4063-8cc5-55f0c701868a)
- IMG_2330.jpeg  (asset 8420b204-ec5b-40f5-bf67-88f87839657f)
- IMG_2479_VSCO.jpeg  (asset 2608b54b-fda7-412c-bc09-4c64bf5339bd)
- IMG_2555.jpeg  (asset 790a636c-ae0d-49e9-b95c-9b22d08b4fc5)
- IMG_2843_VSCO.jpeg  (asset c1125188-8386-4f75-babb-68b4e4b06c3e)
- IMG_2855.jpeg  (asset 9f5ae4df-e24a-4a5d-84ec-c2c5138deb9d)
- IMG_3043.jpeg  (asset 9aced6b4-4287-4747-9268-d2b5fae1bcfa)
- IMG_3150_VSCO.jpeg  (asset cd7827de-b70d-4ad8-9254-afdce519b6dc)
- IMG_3791.jpeg  (asset a4b28d2a-9f55-413b-95ae-a5e8ffe821cc)
- IMG_3792.jpeg  (asset 0c91a58b-cbc1-4d95-9b0a-890d2adc968d)
- IMG_3793.jpeg  (asset 31caf6e8-01b5-4414-a84e-096f292a4f89)
- IMG_3794.jpeg  (asset f1aa4fd1-a2de-4c32-8f8a-1b20ca2597da)
- IMG_3795.jpeg  (asset 748f2354-42ab-44bd-b202-2ef740e395bf)
- IMG_3797.jpeg  (asset 476fc12f-13b7-4fc5-ab94-7e1cf69340ae)
- IMG_3973.jpeg  (asset e5ce0c09-0d2e-4d76-b3cd-2c779115fd13)
- IMG_3988.jpeg  (asset bd3f4635-a8d0-490e-8728-0bda16a45aa6)
- IMG_4001.jpeg  (asset e8c929ac-ba40-45d4-a881-b0f7ec7afd41)
- IMG_4005.jpeg  (asset 3799264b-4db4-4730-80e2-eaea4203d10e)
- IMG_4012.jpeg  (asset c7766d89-d43e-4909-8ddf-f3ac6c0fe764)
- IMG_4014.jpeg  (asset f2d27efe-2e96-40cc-9ad7-4ecf4659367e)
- IMG_4016.jpeg  (asset 0579863e-2c66-4d85-8916-46b382eb815d)
- IMG_4027.jpeg  (asset 6880836d-268c-4544-a761-eee9e310ca16)
- IMG_4028.jpeg  (asset a4927a9a-a6f4-42be-af47-3942fc9480ac)
- IMG_4029.jpeg  (asset 916563e5-b0c3-45f5-817e-9d86cb3d1b78)
- IMG_4030.jpeg  (asset 9ee54906-5138-462f-a523-bd1bdd8e4ff2)
- IMG_4073.jpeg  (asset 5381aecc-8e2a-4a8f-8093-da5f16f4afde)
- IMG_4084.jpeg  (asset 5445bf3a-f1a5-4874-9818-e22ba9a62d78)
- IMG_4891_VSCO.jpeg  (asset 0541add0-d06f-4761-ad7d-c80903aa5ac9)
- IMG_5973.jpeg  (asset fb7dac47-4474-405a-a8aa-8c37ca16e303)
- IMG_5974.jpeg  (asset f4072d93-b26b-4559-9f3e-ca1f7c1a4c18)
- IMG_5974.jpeg  (asset b6a36d05-2721-4267-877c-0bd91eb780c5)
- IMG_6120.jpeg  (asset 95706cf9-98e3-4a05-a7c5-ef6aacd21d27)
- IMG_6123.jpeg  (asset d957c32d-5217-4d6b-8bb9-8c1fa6ede785)
- IMG_6289.jpeg  (asset d5953106-5c6c-4ac9-bf19-dda0dbabf264)
- IMG_6396.jpeg  (asset aa15e0e6-3798-41cf-a5f2-b214a6d1bdaf)
- IMG_6439.jpeg  (asset 1ae77303-c561-4f90-a709-1e2f04e5e31a)
- IMG_6987.jpeg  (asset 4162e6e8-2cfb-459d-8721-58d2d968d2b9)
- IMG_7722.jpeg  (asset 1f91bb24-8065-48aa-bb3c-82d691b69fd2)
- IMG_7722.jpeg  (asset e27c992a-ab20-4045-92a4-8f652d04a617)
- IMG_8046.jpeg  (asset 2d76c782-b87a-40ea-9e06-850d6d5ec8d0)
- IMG_8046.jpeg  (asset 5b811efe-5f2e-430e-8e23-4bf0bf271707)
- IMG_8047.jpeg  (asset e266b878-0143-4484-b259-2f6a569351d5)
- IMG_8047.jpeg  (asset f0ec77bf-399e-478a-b7ef-7bf438f4891b)
- IMG_8107.jpeg  (asset cb66a6d3-5f28-426e-a57f-f7185f96b428)
- IMG_8107.jpeg  (asset ebec031c-161e-4593-9eec-dd76525eaa33)
- IMG_8119.jpeg  (asset d5201277-e7dd-41ea-a081-d14d83f050c2)
- IMG_8119.jpeg  (asset 26376e6c-01fd-48da-8bfb-3c44af28d071)
- IMG_8162.jpeg  (asset aa1986ce-b042-491b-8f55-d98952704fef)
- IMG_8174.jpeg  (asset 3f66fb92-7e7d-40b9-a897-b12ff799bcc1)
- IMG_8467.jpeg  (asset 7a52e3bb-6535-41fb-bd5b-679ce99d912e)
- IMG_8469.jpeg  (asset 34009ebd-880a-487b-b25e-e93545312542)
- IMG_8469.jpeg  (asset 59b29802-c8c6-478b-8b24-75290b162381)
- IMG_8470.jpeg  (asset ed643315-86c4-40f3-80a3-f7283403244c)
- IMG_8470.jpeg  (asset bf05245e-0dbe-4512-b23e-c28e9330ef78)
- IMG_8471.jpeg  (asset 8406bd00-5293-48a3-b8f4-22f6bad14ff4)
- IMG_8472.jpeg  (asset 3797df5d-c796-4d6d-8655-ff201ed68bc0)
- IMG_8472.jpeg  (asset 87d13840-3a8f-40a5-bd1b-a00b1f1d95df)
- IMG_8487.jpeg  (asset ab2e5d37-1b5b-42f3-9fc5-23a1442e4467)
- IMG_8489.jpeg  (asset a124f39f-ef60-4895-977d-6dda92175600)
- IMG_8490.jpeg  (asset fe456715-0c50-494f-9af9-b027db6b4698)
- IMG_8491.jpeg  (asset 19a24ff0-2862-4a4e-a662-52eb10358521)
- IMG_8492.jpeg  (asset f2df0b5a-d7e0-44b8-a293-b6fda34f57b4)
- IMG_8493.jpeg  (asset 74eab8e1-2684-415d-bd6a-ebd9eb72116e)
- IMG_8495.jpeg  (asset 30c5b115-30e3-4ccd-b7e0-a15ebdf4fde8)
- IMG_8496.jpeg  (asset 1d2485d6-f601-44c2-8d2e-3da2333ad63c)
- IMG_8497.jpeg  (asset 4c749c99-ce93-4aa2-ae16-6346ee3d7938)
- IMG_8498.jpeg  (asset d95343a4-9b5f-4b79-9530-d1587ba6f6dd)
- IMG_8508.jpeg  (asset a3ab1fa3-04aa-4b54-b8e5-3280748ebb0c)
- IMG_8553_VSCO.jpeg  (asset de24b4d9-a0b8-408c-ac5a-e2fdb54432f5)
- IMG_8567_VSCO.jpeg  (asset 77db0aca-5444-4002-b8ae-0bfe423e1cfd)
- IMG_8764.jpeg  (asset 21a361f1-1797-4d67-beb8-9690d875f8f9)
- IMG_9292.jpeg  (asset 67fdfdc5-7065-4ea1-bf79-8346b457272d)
- IMG_9499.jpeg  (asset b7369929-58fc-4a96-b4dd-8dbc28af7252)

## Known public-page impact
- Carousel slots broken: lash-25 / 42 / 74 / 120 (+115/132 in DAM), ~9 IMG_* (personal-collision, removed), ~8 Facetune_* (iPhone-only)
- Quiz: IMG_2479_VSCO.jpeg (hybrid), IMG_6439.jpeg (classic), IMG_4005.jpeg (classic)
- Team section: NONE (Vagaro CDN serves all active headshots; R2 team keys are fallback/DAM only)
- 8 offloaded Jake/Emily lash images re-sourceable if downloaded in Messages first
