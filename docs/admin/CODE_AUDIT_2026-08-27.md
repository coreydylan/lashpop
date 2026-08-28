# LashPop Admin Code Audit — August 27, 2026

## Result

The canonical contract contains **28 owner jobs across all 26 current admin navigation routes**, plus sign-in and sign-out. The contract and isolated live run found four genuine gaps:

1. The authenticated admin shell had no sign-out control.
2. Instagram's `showCaptions` value was stored but had no admin control and no public reader.
3. Media assets had `alt_text` and `caption` database fields but no owner editor or update route.
4. Deleting a media object removed it from D1 and R2, but a transformed image that had already been requested could continue serving from the image worker's year-long edge cache.

All four gaps are fixed on `docs/admin-owner-kb`. The image worker now confirms an R2-backed source still exists before serving a cached transform, evicts that stale variant, and returns `404` after an owner deletion. The structural release check now passes. This proves that the expected routes, source files, and key controls exist; it does not by itself prove that the branch is deployed or that production data and third-party integrations behave correctly.

## Canonical scope decisions

- Vagaro remains authoritative for service prices, durations, availability, booking destinations, and synced stylist facts.
- LashPop owns website copy, media, visibility, order, curation, and local/external stylist presentation.
- The frozen public visual system, navigation structure, and legal-page structure remain reviewed code changes.
- Work With Us benefits, pricing logic, forms, and policy rules remain system-owned. The admin owns the page introduction, three path summaries, and photography.
- The admin must preserve history: hide, suppress, unsubscribe, or restore as a new version instead of silently erasing records.

## Code coverage matrix

| Area | Contract jobs | Code result | Live verification mode |
| --- | ---: | --- | --- |
| Access | Sign in; sign out | Present after fix | Real phone login and logout |
| Today | Operations overview | Present | Read-only walkthrough |
| Website overview | Publishing ownership map | Present | Read-only walkthrough |
| Service launch | Seven-part readiness checklist | Present | Read-only with public link checks |
| Studio information | Contact, location, hours, booking, social | Present | No-op publish or edit-and-restore |
| Homepage hero | Copy, images, presets, desktop/mobile assignment | Present | Inspect; publish only with reversible values |
| Services & booking | Synced taxonomy, imagery, groups, readiness | Present | Inspect; Vagaro-owned actions separately controlled |
| Homepage service cards | Add, edit, order, show/hide | Present | No-op publish or edit-and-restore |
| Team & stylists | Sync, publication, order, external profiles, portfolio, facts, credentials | Present | Inspect; avoid publishing a real roster change without need |
| Founder letter | Editable letter | Present | No-op save or edit-and-restore |
| Instagram | Count, speed, auto-scroll, captions, DAM refresh | Present after fix | No-op publish; verify captions on preview build |
| FAQ | Category and item CRUD, visibility, featured status | Present | Temporary record, then delete only that record |
| Find Your Look | Comparison photos, crops, result image and copy | Present | Inspect; quiz photo changes are high impact |
| Work With Us | Introduction, path summaries, carousel media | Present | No-op publish; inspect media controls |
| Search & sharing | Site and page metadata | Present | No-op publish or edit-and-restore |
| Reviews | Homepage curation and locked corrections | Present | Inspect; real review changes are high impact |
| Review automation | Scoring and rotation settings | Present | Read and no-op publish only |
| Media library | Upload, search, tags, collections, assignments, alt text, captions | Present after fix | Temporary asset; delete only the temporary asset |
| Team photography | Upload, album, crop, primary portrait | Present | Inspect; test only with temporary media |
| Inbox overview | Subscriber and application summaries | Present | Read-only walkthrough |
| Newsletter | Consent ledger, filters, active-only copy/export, status | Present | Inspect sensitive records; do not alter real consent for testing |
| Applications | Read application details | Present | Inspect sensitive records; do not contact applicants |
| Settings overview | Current role and sync state | Present | Read-only walkthrough |
| Admin access | Owner, publisher, viewer, none | Present | Inspect only unless a real access change is requested |
| Vagaro sync | Health and manual run | Present | Inspect; run only when an actual refresh is wanted |
| Activity history | Who changed what and when | Present | Read-only walkthrough |
| Website versions | Immutable history and restore-as-new | Present | Open confirmation and cancel; do not restore for a smoke test |

## Automated proof completed

- `npm run check:admin-capabilities` — 28 jobs cover 26 navigation routes and all 27 owner-guide screenshots exist.
- `npm run test:admin-live` — 28 authenticated preview routes and 19 authenticated read APIs passed.
- `npm run check:design` — frozen token and protected-file contract passes.
- `npm run lint` — passes with zero warnings.
- `npm run types` — passes.
- `npm run build` — passes; all admin pages and the new asset metadata route are present in the route manifest.
- `npm run test:visual` with CI's public fixtures — 11 passed, 3 expected skips.
- `npm run test:a11y` with CI's public fixtures — 6 passed.
- `npm run test:launch` — complete release gate passes. The command now builds and runs browser suites with the canonical fixture and Mapbox test environment, so the gate no longer attempts a live database connection or bakes an empty map token into its test build.

## Remaining proof

The authenticated Chrome walkthrough and screenshots remain separate from this code audit. The write-path checks run only against the isolated future-branch database and media bucket; production is read-only until the branch is merged. Results belong in `docs/admin/LIVE_VERIFICATION_2026-08-27.md` and the screenshot folder so future agents can distinguish code presence, preview behavior, and production behavior.
