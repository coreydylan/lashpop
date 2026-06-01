# Photo Audit
_Generated 2026-05-29 04:14 UTC_

## Methodology
- Probed every photo URL referenced from `team_members.image_url`, `team_members.vagaro_photo_url`, `assets.file_path`, `team_member_photos.file_path`, `services.image_url`, `services.vagaro_image_url`, `quiz_photos -> assets`, `work_with_us_carousel_photos -> assets`, and `website_settings.hero_archway`.
- Site-relative paths (`/lashpop-images/...`) were resolved against `https://lashpop.vercel.app` (the production Next.js app — note: `lashpopstudios.com` is still the old Squarespace site and returns 404 for these paths; the audit verified the right origin).
- For each URL we performed: HEAD (with ranged-GET fallback for R2/Vagaro which 405 on HEAD), then a partial GET of the first 64 KB to read the EXIF/`eXIf` Orientation tag for JPEG and PNG. HEIC files can't be parsed for orientation by the inline parser, but spot-checks with `exiftool` confirm the HEIC assets in scope are Orientation=1.
- R2-hosted URLs were also probed through their `cdn.lashpopstudios.com/cdn-cgi/image/...` transformed variant (Cloudflare Images honors EXIF on transform, so a 200 there means the image renders right-side-up when served through `next/image` + `cfImageLoader`).
- Concurrency: 8.
- Excluded: `/lashpop-images/services/thin/*.svg` (static category icons), `/placeholder-team.svg`, and `/placeholder.svg`.

## Summary
- Total photos probed: 474
- Broken (status != 200 or error): 33
- Sideways (EXIF orientation in 3/5/6/7/8 — would render rotated without correction): 0
- Suspicious (<5 KB or non-image content-type): 0
- Healthy: 441

## Broken photos
### /placeholder.jpg
- Status: **404** · HTTPError 404
- Referenced by (1):
  - team_members.image_url · row ca0464a6-010f-486f-8584-895415939d09 · Kimberly Starnes
- Recommended action: NULL `team_members.image_url` so resolver falls back to `vagaro_photo_url`

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910187808-8m6o2k-IMG_5272_VSCO.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row c2c6303c-1a16-4827-8555-2811f0252c8a · IMG_5272_VSCO.jpeg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910527391-6b85ur-Facetune_10-11-2025-18-05-46.HEIC
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 0b90b3e5-2236-4e98-ba20-e35274087dbc · Facetune_10-11-2025-18-05-46.HEIC
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910181087-839qgb-IMG_3979.jpeg
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row a22bd96d-dd49-404e-b957-0021d35cb6ff · IMG_3979.jpeg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910189334-zq73qr-IMG_8900_VSCO.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row c7a8d8c0-b927-4df9-bd1c-32477cabfa44 · IMG_8900_VSCO.jpeg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910223572-k5sbinx-IMG_4036.jpeg
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row fdbfd92c-b46f-4522-aef3-a16ea48aec3e · IMG_4036.jpeg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910500183-hf4u8g-IMG_2092.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 70559fc5-dbb4-49b6-a64b-1c7d89716c70 · IMG_2092.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910342754-5j5ooo-IMG_8494_VSCO.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 293ff256-78ce-49e8-b234-27425142d055 · IMG_8494_VSCO.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910496688-u8bc8a-IMG_2086.JPG
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 0159cd87-1f3b-4ddc-8bd4-aa8daf8aed38 · IMG_2086.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910501422-1q2hl-IMG_2094_2.JPG
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row cb641793-5f91-4800-a89b-da42d1820ee1 · IMG_2094 2.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910502221-dc8n5e-IMG_2094.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row ad2dfe31-e6f9-459b-a3a7-65e560d3f5c6 · IMG_2094.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913753938-mq9u8g-IMG_0548.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row ae72f7e5-477e-4d50-8745-41072248de0d · IMG_0548.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913755903-fhy0ng-IMG_3039.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row af6c26c7-6aa5-4346-8fc9-03c815b0bd28 · IMG_3039.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910530446-2nvnbv-FullSizeRender_VSCO.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row c101ab96-bee0-48d6-bb06-a2a8214c41fe · FullSizeRender_VSCO.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910183036-8wzd85-IMG_0586_VSCO.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 71584331-aec9-4e36-baad-e7232ed75005 · IMG_0586_VSCO.jpeg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910184172-p23igi-IMG_2479_VSCO.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 089a71b6-dda6-45e1-9973-c79953a528ff · IMG_2479_VSCO.jpeg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910186102-r2qfnw-IMG_3861.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 0cb634e0-121a-4fee-8864-5d573b621dfa · IMG_3861.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910391927-c8n04j-DipticExportSaveLocation_2.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 4c1a4e3e-f4a8-41e8-baf5-76a38b9a3bd5 · DipticExportSaveLocation 2.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913745881-sgxgzp-135a7570.jpg
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 2dd8b575-a90d-47a6-84bb-3c694048c566 · 135a7570.jpg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910497870-xoe3cq-IMG_2088.JPG
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row a07d08b0-b5d7-4f90-a12d-f61988bd578b · IMG_2088.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913738434-9nzunj-135a7550.jpg
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 5869c104-6dc7-4afc-947c-66d669f30908 · 135a7550.jpg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910398390-mmng6r-IMG_8494_VSCO.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row dac93ee0-4d7d-4b17-944c-884296118ae0 · IMG_8494_VSCO.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910499381-61elh-IMG_2092_2.JPG
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 4d2ad052-8a0e-4b8a-8e14-2e35cc23ce71 · IMG_2092 2.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913747235-oryp3-135a8220.jpg
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 1e963aa2-a03c-41a3-b53f-187e8b9ceaf3 · 135a8220.jpg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913747738-4ta9i-135a7576.jpg
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 60d49b9b-b455-4b5a-84ec-1165a5a04010 · 135a7576.jpg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913748155-qevtu9-135a8221.jpg
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row d633856f-02cf-470b-bea9-63e2b8177a97 · 135a8221.jpg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913748854-pzyus3-135a8233.jpg
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 164dd162-ba84-475d-b736-73ac24c877db · 135a8233.jpg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913750254-gjkk1r-IMG_3967.JPG
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 99957a0e-397c-420b-8f89-0302ff2fe20b · IMG_3967.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913750952-4s0oo-IMG_3969.JPG
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 69278fff-954d-416c-bca1-e78815586d34 · IMG_3969.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913751886-dfvf5-FC51308E-8F29-456F-9645-674C088C34D6.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row b38e1008-f271-4b0c-97fe-5451cf49e42c · FC51308E-8F29-456F-9645-674C088C34D6.jpg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913752913-fuvwr-IMG_3725.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row 0d12ad9d-8369-418b-b237-1f830d438fe6 · IMG_3725.JPG
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913749542-lcpsc9-1B1E9A79-2C57-4D1F-BF9A-85C241E2BDC8.webp
- Status: **404** · HTTPError 404
- Referenced by (1):
  - assets.file_path · row d39a234e-6c1c-485b-be8a-8be4ef696626 · 1B1E9A79-2C57-4D1F-BF9A-85C241E2BDC8.jpeg
- Recommended action: Inspect — re-upload to R2 or delete the asset row (cascade-check first)

### https://eabdc1907c2f84bfe65a-cfc7a6bba052cea084198d4ff3e0b991.ssl.cf2.rackcdn.com/Service/340x340/119598069_69973$2023_03_28_00_53_24_8241.jpg
- Status: **404** · HTTPError 404
- Referenced by (1):
  - services.image_url · row 66279f12-6ad8-402a-b6b0-e060c10c2020 · Faux Freckles (1st Appointment)
- Recommended action: Re-upload via admin, or NULL to fall back to the other field


## Sideways photos
_None._

## Suspicious (small / wrong type)
_None._

## Cross-reference (problematic URLs → all referencing rows)
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910223572-k5sbinx-IMG_4036.jpeg`
  - assets.file_path · row fdbfd92c-b46f-4522-aef3-a16ea48aec3e · IMG_4036.jpeg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910342754-5j5ooo-IMG_8494_VSCO.webp`
  - assets.file_path · row 293ff256-78ce-49e8-b234-27425142d055 · IMG_8494_VSCO.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913747738-4ta9i-135a7576.jpg`
  - assets.file_path · row 60d49b9b-b455-4b5a-84ec-1165a5a04010 · 135a7576.jpg
- `https://eabdc1907c2f84bfe65a-cfc7a6bba052cea084198d4ff3e0b991.ssl.cf2.rackcdn.com/Service/340x340/119598069_69973$2023_03_28_00_53_24_8241.jpg`
  - services.image_url · row 66279f12-6ad8-402a-b6b0-e060c10c2020 · Faux Freckles (1st Appointment)
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910391927-c8n04j-DipticExportSaveLocation_2.webp`
  - assets.file_path · row 4c1a4e3e-f4a8-41e8-baf5-76a38b9a3bd5 · DipticExportSaveLocation 2.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913750254-gjkk1r-IMG_3967.JPG`
  - assets.file_path · row 99957a0e-397c-420b-8f89-0302ff2fe20b · IMG_3967.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910497870-xoe3cq-IMG_2088.JPG`
  - assets.file_path · row a07d08b0-b5d7-4f90-a12d-f61988bd578b · IMG_2088.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913753938-mq9u8g-IMG_0548.webp`
  - assets.file_path · row ae72f7e5-477e-4d50-8745-41072248de0d · IMG_0548.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913748854-pzyus3-135a8233.jpg`
  - assets.file_path · row 164dd162-ba84-475d-b736-73ac24c877db · 135a8233.jpg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910189334-zq73qr-IMG_8900_VSCO.webp`
  - assets.file_path · row c7a8d8c0-b927-4df9-bd1c-32477cabfa44 · IMG_8900_VSCO.jpeg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913749542-lcpsc9-1B1E9A79-2C57-4D1F-BF9A-85C241E2BDC8.webp`
  - assets.file_path · row d39a234e-6c1c-485b-be8a-8be4ef696626 · 1B1E9A79-2C57-4D1F-BF9A-85C241E2BDC8.jpeg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910499381-61elh-IMG_2092_2.JPG`
  - assets.file_path · row 4d2ad052-8a0e-4b8a-8e14-2e35cc23ce71 · IMG_2092 2.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910184172-p23igi-IMG_2479_VSCO.webp`
  - assets.file_path · row 089a71b6-dda6-45e1-9973-c79953a528ff · IMG_2479_VSCO.jpeg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910500183-hf4u8g-IMG_2092.webp`
  - assets.file_path · row 70559fc5-dbb4-49b6-a64b-1c7d89716c70 · IMG_2092.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910181087-839qgb-IMG_3979.jpeg`
  - assets.file_path · row a22bd96d-dd49-404e-b957-0021d35cb6ff · IMG_3979.jpeg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910183036-8wzd85-IMG_0586_VSCO.webp`
  - assets.file_path · row 71584331-aec9-4e36-baad-e7232ed75005 · IMG_0586_VSCO.jpeg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913745881-sgxgzp-135a7570.jpg`
  - assets.file_path · row 2dd8b575-a90d-47a6-84bb-3c694048c566 · 135a7570.jpg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910527391-6b85ur-Facetune_10-11-2025-18-05-46.HEIC`
  - assets.file_path · row 0b90b3e5-2236-4e98-ba20-e35274087dbc · Facetune_10-11-2025-18-05-46.HEIC
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910502221-dc8n5e-IMG_2094.webp`
  - assets.file_path · row ad2dfe31-e6f9-459b-a3a7-65e560d3f5c6 · IMG_2094.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913748155-qevtu9-135a8221.jpg`
  - assets.file_path · row d633856f-02cf-470b-bea9-63e2b8177a97 · 135a8221.jpg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910530446-2nvnbv-FullSizeRender_VSCO.webp`
  - assets.file_path · row c101ab96-bee0-48d6-bb06-a2a8214c41fe · FullSizeRender_VSCO.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913751886-dfvf5-FC51308E-8F29-456F-9645-674C088C34D6.webp`
  - assets.file_path · row b38e1008-f271-4b0c-97fe-5451cf49e42c · FC51308E-8F29-456F-9645-674C088C34D6.jpg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910501422-1q2hl-IMG_2094_2.JPG`
  - assets.file_path · row cb641793-5f91-4800-a89b-da42d1820ee1 · IMG_2094 2.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913752913-fuvwr-IMG_3725.webp`
  - assets.file_path · row 0d12ad9d-8369-418b-b237-1f830d438fe6 · IMG_3725.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910187808-8m6o2k-IMG_5272_VSCO.webp`
  - assets.file_path · row c2c6303c-1a16-4827-8555-2811f0252c8a · IMG_5272_VSCO.jpeg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913738434-9nzunj-135a7550.jpg`
  - assets.file_path · row 5869c104-6dc7-4afc-947c-66d669f30908 · 135a7550.jpg
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913755903-fhy0ng-IMG_3039.webp`
  - assets.file_path · row af6c26c7-6aa5-4346-8fc9-03c815b0bd28 · IMG_3039.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913750952-4s0oo-IMG_3969.JPG`
  - assets.file_path · row 69278fff-954d-416c-bca1-e78815586d34 · IMG_3969.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762913747235-oryp3-135a8220.jpg`
  - assets.file_path · row 1e963aa2-a03c-41a3-b53f-187e8b9ceaf3 · 135a8220.jpg
- `/placeholder.jpg`
  - team_members.image_url · row ca0464a6-010f-486f-8584-895415939d09 · Kimberly Starnes
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910496688-u8bc8a-IMG_2086.JPG`
  - assets.file_path · row 0159cd87-1f3b-4ddc-8bd4-aa8daf8aed38 · IMG_2086.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910398390-mmng6r-IMG_8494_VSCO.webp`
  - assets.file_path · row dac93ee0-4d7d-4b17-944c-884296118ae0 · IMG_8494_VSCO.JPG
- `https://pub-f98565faaf544aa98c908360653eb5db.r2.dev/uploads/1762910186102-r2qfnw-IMG_3861.webp`
  - assets.file_path · row 0cb634e0-121a-4fee-8864-5d573b621dfa · IMG_3861.JPG

## Recommended bulk fix queries
```sql
-- Null local image_url so resolver falls back to vagaro_photo_url / placeholder
UPDATE team_members SET image_url = NULL WHERE id IN ('ca0464a6-010f-486f-8584-895415939d09');

-- Null local services.image_url so resolver falls back to vagaro_image_url
UPDATE services SET image_url = NULL WHERE id IN ('66279f12-6ad8-402a-b6b0-e060c10c2020');

-- Cross-checked: none of these broken assets are referenced by quiz_photos OR
-- work_with_us_carousel_photos as of the audit run. They are orphan DAM rows whose
-- backing R2 object 404s. Safest action is to delete them so the DAM stops listing dead files.
-- Re-verify cascade refs before running.
SELECT id, file_name, file_path FROM assets WHERE id IN ('0159cd87-1f3b-4ddc-8bd4-aa8daf8aed38', '089a71b6-dda6-45e1-9973-c79953a528ff', '0b90b3e5-2236-4e98-ba20-e35274087dbc', '0cb634e0-121a-4fee-8864-5d573b621dfa', '0d12ad9d-8369-418b-b237-1f830d438fe6', '164dd162-ba84-475d-b736-73ac24c877db', '1e963aa2-a03c-41a3-b53f-187e8b9ceaf3', '293ff256-78ce-49e8-b234-27425142d055', '2dd8b575-a90d-47a6-84bb-3c694048c566', '4c1a4e3e-f4a8-41e8-baf5-76a38b9a3bd5', '4d2ad052-8a0e-4b8a-8e14-2e35cc23ce71', '5869c104-6dc7-4afc-947c-66d669f30908', '60d49b9b-b455-4b5a-84ec-1165a5a04010', '69278fff-954d-416c-bca1-e78815586d34', '70559fc5-dbb4-49b6-a64b-1c7d89716c70', '71584331-aec9-4e36-baad-e7232ed75005', '99957a0e-397c-420b-8f89-0302ff2fe20b', 'a07d08b0-b5d7-4f90-a12d-f61988bd578b', 'a22bd96d-dd49-404e-b957-0021d35cb6ff', 'ad2dfe31-e6f9-459b-a3a7-65e560d3f5c6', 'ae72f7e5-477e-4d50-8745-41072248de0d', 'af6c26c7-6aa5-4346-8fc9-03c815b0bd28', 'b38e1008-f271-4b0c-97fe-5451cf49e42c', 'c101ab96-bee0-48d6-bb06-a2a8214c41fe', 'c2c6303c-1a16-4827-8555-2811f0252c8a', 'c7a8d8c0-b927-4df9-bd1c-32477cabfa44', 'cb641793-5f91-4800-a89b-da42d1820ee1', 'd39a234e-6c1c-485b-be8a-8be4ef696626', 'd633856f-02cf-470b-bea9-63e2b8177a97', 'dac93ee0-4d7d-4b17-944c-884296118ae0', 'fdbfd92c-b46f-4522-aef3-a16ea48aec3e');
DELETE FROM assets WHERE id IN ('0159cd87-1f3b-4ddc-8bd4-aa8daf8aed38', '089a71b6-dda6-45e1-9973-c79953a528ff', '0b90b3e5-2236-4e98-ba20-e35274087dbc', '0cb634e0-121a-4fee-8864-5d573b621dfa', '0d12ad9d-8369-418b-b237-1f830d438fe6', '164dd162-ba84-475d-b736-73ac24c877db', '1e963aa2-a03c-41a3-b53f-187e8b9ceaf3', '293ff256-78ce-49e8-b234-27425142d055', '2dd8b575-a90d-47a6-84bb-3c694048c566', '4c1a4e3e-f4a8-41e8-baf5-76a38b9a3bd5', '4d2ad052-8a0e-4b8a-8e14-2e35cc23ce71', '5869c104-6dc7-4afc-947c-66d669f30908', '60d49b9b-b455-4b5a-84ec-1165a5a04010', '69278fff-954d-416c-bca1-e78815586d34', '70559fc5-dbb4-49b6-a64b-1c7d89716c70', '71584331-aec9-4e36-baad-e7232ed75005', '99957a0e-397c-420b-8f89-0302ff2fe20b', 'a07d08b0-b5d7-4f90-a12d-f61988bd578b', 'a22bd96d-dd49-404e-b957-0021d35cb6ff', 'ad2dfe31-e6f9-459b-a3a7-65e560d3f5c6', 'ae72f7e5-477e-4d50-8745-41072248de0d', 'af6c26c7-6aa5-4346-8fc9-03c815b0bd28', 'b38e1008-f271-4b0c-97fe-5451cf49e42c', 'c101ab96-bee0-48d6-bb06-a2a8214c41fe', 'c2c6303c-1a16-4827-8555-2811f0252c8a', 'c7a8d8c0-b927-4df9-bd1c-32477cabfa44', 'cb641793-5f91-4800-a89b-da42d1820ee1', 'd39a234e-6c1c-485b-be8a-8be4ef696626', 'd633856f-02cf-470b-bea9-63e2b8177a97', 'dac93ee0-4d7d-4b17-944c-884296118ae0', 'fdbfd92c-b46f-4522-aef3-a16ea48aec3e');

```

## Appendix · Source distribution among broken / sideways
- assets.file_path: 31 references
- team_members.image_url: 1 references
- services.image_url: 1 references
