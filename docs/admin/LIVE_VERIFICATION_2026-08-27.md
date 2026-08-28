# LashPop Admin Live Verification — August 27, 2026

## Acceptance environment

This run uses Git branch `docs/admin-owner-kb` and the protected Vercel branch alias:

`https://lashpop-git-docs-admin-owner-kb-experial.vercel.app`

Every write is isolated from production:

- D1: `lashpop-admin-preview` (`41c05e0a-8094-4703-a6dd-b2efd003e91f`)
- R2: `lashpop-admin-preview`
- Database proxy: `lashpop-db-admin-preview`
- Image and storage proxy: `lashpop-img-admin-preview`
- Vagaro sync worker: `lashpop-vagaro-sync-admin-preview`, with no cron schedule
- Vercel database, R2, sync, and review-worker bindings are scoped to `docs/admin-owner-kb`
- Inherited R2 access credentials are overridden with disabled preview values; the branch can write media only through the preview storage proxy
- The preview database was cloned, then stripped of sessions, OTP limits, customer and booking records, form responses, transactions, analytics, and real inbox records. It contains one real owner identity for phone authentication and synthetic publisher, viewer, subscriber, and application fixtures.

The database and storage proxies both returned `401` without their dedicated preview tokens. An authenticated R2 sentinel completed put, get, and delete, and returned `404` after deletion. The temporary sentinel was removed.

## Live results

| Check | Result | Notes |
| --- | --- | --- |
| Admin route contract | Pass | All 28 canonical jobs reached their 26 unique routes. Twenty-five returned `200`; the legacy founder-letter route correctly returned `307` to the canonical editor. |
| Authenticated admin read APIs | Pass | 19 owner-facing APIs returned `200`, including settings, reviews, team, media, tags, users, and history. |
| Owner content publishers | Pass | Studio, founder letter, hero copy, homepage services, Instagram, SEO, Work With Us, and review automation accepted their current values as a no-op publish. |
| FAQ lifecycle | Pass | A hidden synthetic category and item were created, edited, and deleted. Only those temporary records were removed. |
| Media lifecycle | Pass after fix | A synthetic image uploaded, accepted alt text and caption, rendered through the preview image worker, and deleted from D1 and R2. The first run exposed a stale transform-cache response after deletion; the worker fix now returns `404`. |
| Team photography | Pass | A synthetic portrait uploaded, saved all five crop shapes, became primary, yielded primary status back to the original portrait, and deleted. Its image URL then returned `404`. |
| Newsletter consent | Pass | The synthetic active subscriber changed to suppressed and then returned to its original active status and fixture note. |
| Admin permissions | Pass | The synthetic viewer changed to publisher and returned to viewer. The real owner was not changed. |
| Reviews | Pass | The current homepage order saved, a reversible review override locked the intended fields, and the original unlocked state was restored. |
| Website history | Pass | A valid stored version restored as a new version, preserving immutable history. |
| Activity history | Pass | The preview audit feed recorded the acceptance writes and cleanup actions. |
| Phone sign-in | Pass | Chrome sent the real code to the authorized owner number. The SMS body was stored in Apple's serialized `attributedBody`; it was decoded read-only from `chat.db`, verified through Twilio, and opened the preview **Today** page. |
| Sign out | Pass | The logout route returned `200`; reusing the invalidated session redirected to sign-in. |
| Vagaro manual sync | Partial, safely contained | The preview worker ran and wrote only preview D1. Vagaro's public category and staff endpoints returned empty collections, so fail-closed guards refused destructive reconciliation. Stylist mapping and roster reconciliation completed; no production data changed. |

## Chrome visual record

Chrome opened every canonical owner route on the branch preview. The knowledge-base guide contains **27 privacy-reviewed screenshots** covering sign-in, Today, ownership, service readiness, each website editor, reviews, media, inbox, settings, sync, access, activity, and version history. The Admin access image is deliberately cropped before the owner row so no private phone number is stored in the repository.

The final `npm run test:launch` gate passed: design lock, dependency audit, lint, TypeScript, Vagaro contracts, quiz contracts, image and storage tests, fixture validation, staff-publication safety, build, 11 visual checks with 3 intentional project skips, and 6 accessibility/interaction checks.

## Current external-source warning

A read-only check of production's five latest Vagaro runs showed four successful core runs and one current partial run. The current production warning is a service readiness issue: **Tiny Tattoos lacks a verified Vagaro loader URL**. That is not an admin-shell failure, but the service must remain hidden until its exact booking mapping is verified.

## Cleanup

- Temporary FAQ category and item: removed
- Temporary general media asset and R2 object: removed
- Temporary team portrait and R2 object: removed
- Original team primary portrait: restored
- Synthetic newsletter status and note: restored
- Synthetic viewer role: restored
- Review locks used for the check: restored
- Temporary local image fixtures and pulled environment files: removed
- Temporary scripted and Chrome admin sessions: removed; preview session count verified as zero
- OTP request-rate rows: removed

The Vercel CLI reused a project automation bypass that already existed before this run; the run did not create a new bypass. The copied value was discarded without revoking shared project access.
