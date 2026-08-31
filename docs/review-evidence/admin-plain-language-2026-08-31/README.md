# LashPop Admin plain-language review — August 31, 2026

This evidence records the local release candidate on `codex/lashpop-admin-mobile-operator-ui`. The branch combines the mobile workspace redesign with a complete operator-language pass, copy regression checks and a stricter responsive acceptance gate. It does not deploy, change customer data or use live customer records in screenshots.

## Guidance used

- [GOV.UK: Writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)
- [GOV.UK: Clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/)
- [GOV.UK: Services for government users](https://www.gov.uk/service-manual/design/services-for-government-users)

The working rules and regression terms are in [the Admin plain-language rules](../../admin/PLAIN_LANGUAGE.md). The [styled copy-review board](./copy-review.html) keeps representative before-and-after wording available for human review.

## Protected route coverage

The capability contract contains 28 protected routes. Each route is rendered at 320 × 800, 390 × 844 and 1440 × 1000 by `npm run test:admin-responsive` against a local, read-only fixture database and test analytics. The dynamic service editor is also rendered at all three sizes, for 87 route checks in total. The gate refuses production unless a separate override is supplied.

The populated Review library receives four additional mobile interaction checks: its action menu and Edit review details drawer at both phone widths. Those checks verify visible controls, drawer containment, clipped text and horizontal overflow without selecting Save or changing a review.

| Area | Routes |
| --- | --- |
| Today | `/admin/overview`, `/admin/analytics` |
| Media | `/admin/assets`, `/admin/assets/team` |
| Website content | `/admin/content/founder-letter`, `/admin/content/studio-info`, `/admin/website`, `/admin/website/faq`, `/admin/website/hero`, `/admin/website/homepage-services`, `/admin/website/instagram`, `/admin/website/quiz`, `/admin/website/seo`, `/admin/website/services`, `/admin/website/services/[id]`, `/admin/website/team`, `/admin/website/work-with-us` |
| Reviews | `/admin/website/review-settings`, `/admin/website/reviews` |
| Inbox | `/admin/inbox`, `/admin/inbox/newsletter`, `/admin/inbox/work-with-us` |
| Operations | `/admin/dam-users`, `/admin/settings`, `/admin/system/audit-log`, `/admin/system/syncs`, `/admin/system/website-history`, `/admin/workflows/service-launch` |
| Help | `/admin/owner-guide` |

## Analytics wording trace

Analytics labels were traced to their server queries and event emitters before they were renamed.

- Visitors and page views come from production-only Vercel Web Analytics visit aggregates. Dates are complete UTC days ending yesterday, compared with the immediately preceding period of the same length.
- Visitor counts reset anonymously each day, so the same person can count again on a later day. Page views include repeats.
- Tracked booking starts count recorded embedded Vagaro openings and tracked external booking-link openings. Some external links are not instrumented. Vagaro booking submissions count the embedded completion message, which can mean either a confirmed booking or a request waiting for approval.
- Quiz starts and results are separate event totals. Booking and quiz ratios do not join the same person or session from start to finish.
- Applications are counted only after they are saved. Newsletter subscriptions count new or reactivated subscriptions.
- The page list exposes only approved public page patterns. Event properties, names, contact details, application text and quiz answers are not projected into the browser.

## Representative before and after

| Before | After | Reason |
| --- | --- | --- |
| Website performance | Website analytics | Reports visits and actions, not speed. |
| How attention moved | Visitors and page views by day | Names the chart and both measures. |
| Booking signal rate | Vagaro submissions ÷ tracked booking starts | Names the calculation and avoids implying a confirmed appointment or customer funnel. |
| Pages earning attention | Most-viewed public pages | Names the ranking. |
| DAM | Media library | Uses the operator-facing product name. |
| Booking taxonomy | Booking category mapping | Names the task in everyday language. |
| Re-score with Claude | Update score | Removes the provider implementation from the task. |
| Worker tick | Daily review update | Says what runs and when. |
| Needs attention | The specific warning, count or task | Gives the operator a next step. |

## Automated evidence

- `npm run test:launch` passes in full: capability and Owner guide contracts, design and visual coverage contracts, zero dependency vulnerabilities, lint, TypeScript, analytics, sync, Vagaro, quiz, image, storage, fixture and staff tests, production build, 68 public visual checks, 15 public accessibility checks and 2 interaction-analytics checks.
- `npm run check:admin-copy` inspects 3,195 user-facing strings across 112 files.
- `npm run test:admin-copy` passes 15 copy, source-extraction, activity-label and target-label checks.
- `npm run test:admin-layout-unit` passes 10 clipping, loading, fixture-state and interaction-surface checks.
- `npm run test:admin-responsive` passes 87 route checks plus 4 populated Review interaction checks. Reviews, Services and Service Launch are populated with synthetic records; the dynamic service editor uses `fixture-service`.
- A representative authenticated Axe probe covers Overview, Website analytics, Review library, Services and Service Launch at 390 × 844 and 1440 × 1000. It reports zero non-color violations. The repository's documented color-contrast exception remains unchanged.

The production browser gate runs serially because parallel fixture-backed React Server Component streams produced false hydration and screenshot failures on this host. Accessibility allows one retry for a cold remote quiz-result image; assertions and approved screenshot baselines are unchanged.

## Fixture boundaries

- Populated synthetic states: Website analytics, three Review library rows, one homepage review, one Fine Line service, Services, Service Launch and the dynamic service editor.
- Partial synthetic states: Overview counts and Vagaro sync summary.
- Empty states: Media files, team profiles, FAQ entries, Find Your Look photos, applications, activity history and website versions. Their Owner guide captions identify the empty state instead of claiming unavailable record controls.
- The fixture uses names such as `Sample guest` and `Demo visitor`; it contains no copied customer names, contact details or review text.

## Visual evidence

- 14 production-mode evidence images: six representative routes at 1280 × 900 and 390 × 844, plus the populated mobile review action menu and edit drawer.
- 29 unique production-mode Owner guide screenshots at 842 × 1248, referenced by 30 guide articles.
- Development launchers, design controls and stale account badges are absent. The Media tutorial prompt is dismissed before capture.
- No live analytics credential, Vercel account screen, raw customer record or production write appears in the evidence.
