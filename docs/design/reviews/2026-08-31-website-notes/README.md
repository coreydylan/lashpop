# LashPop Website Notes visual evidence

Captured on 2026-08-31 from the local live-data preview at phone (390 × 844) and desktop (1440 × 1000) widths. These images are review evidence only; no production deployment was performed.

## Phone

- `mobile-microblading-booking.png` — the distinct Brows / Microblading (1st Appointment) Vagaro booking keeps its own loader and now carries the selected service photo in LashPop's header.
- `mobile-service-images-restored.png` — returning from booking restores all three Microblading cards as decoded, fully opaque images.
- `mobile-quiz-comparison.png` — comparison photos use their full source with `object-fit: contain`, avoiding the legacy double-cropped square masters.
- `mobile-quiz-result.png` — the result uses the selected winning photo, here the exact image chosen for Classic Lashes.
- `mobile-team-photo.png` — the supplied 12-person team photo is shown uncropped at phone width.
- `mobile-tiny-tattoos-faq.png` — Tiny Tattoos appears between Permanent Jewelry and Botox with an explicit content-pending state.
- `mobile-studio-map.png` — the map is centered on 429 S Coast Hwy near Washington Avenue rather than the stale Mission Avenue intersection.

## Desktop

- `desktop-hero.png` — the public hero is decoded from a direct 1440-pixel Cloudflare derivative at a 1440-pixel rendered width.
- `desktop-team-cards.png` — current team portraits render without broken images and Tiny Tattoos is customer-facing on the relevant stylist card.
- `desktop-team-photo.png` — the supplied group photo is visible without a crop.
- `desktop-tiny-tattoos-faq.png` — the new category and content-pending state are visible at desktop width.

The repository browser suite separately protects 57 states across 320-pixel, iPhone, and desktop projects, including service booking, FAQ, quiz, team overflow, map loading, and horizontal-overflow checks.
