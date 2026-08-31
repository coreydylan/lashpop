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
- The visitor total counts anonymous visitors within each day and starts again the next day. Every public page view adds to the page-view total, including repeat views.
- A tracked booking start is added for a tracked service selection, Find Your Look booking selection or Naturtox link. A Vagaro submission is added when the embedded form reports a request or confirmation. Vagaro holds the appointment status for each submission.
- `Vagaro submissions per 100 tracked starts` divides the two recorded totals for the selected period and scales the result to 100 starts.
- Find Your Look opens and results each add to their own event total. `Find Your Look results per 100 opens` divides those totals for the selected period and scales the result to 100 opens.
- An application is added after it is saved. A newsletter signup is added for a new or reactivated subscription. Inbox holds the saved application and signup records.
- Referring websites group visitors by the referrer attached to each visit. `Direct or unknown` groups typed addresses, bookmarks and visits with an unavailable referring website.
- The page ranking covers the homepage, Services, Work with us, Privacy and Terms. Individual service pages appear as one group.
- The browser receives anonymous totals grouped by day, page, referring website, device type and recorded action. Customer records stay in Vagaro and Inbox.

## Representative before and after

| Before | After | Reason |
| --- | --- | --- |
| Website performance | Website analytics | Reports visits and recorded actions. |
| How attention moved | Visitors and page views by day | Names the chart and both measures. |
| Booking signal rate | Vagaro submissions per 100 tracked starts | Names the calculation and points operators to Vagaro for appointment status. |
| Quiz conversion | Find Your Look results per 100 opens | Names the recorded events and the scale shown. |
| Privacy disclaimer under the page title | Anonymous website totals | Describes the data shown and keeps customer-record guidance separate. |
| Direct or not provided | Direct or unknown | Uses one clear label for typed addresses, bookmarks and unavailable referrers. |
| Pages earning attention | Most-viewed public pages | Names the ranking. |
| DAM | Media library | Uses the operator-facing product name. |
| Booking taxonomy | Booking category mapping | Names the task in everyday language. |
| Re-score with Claude | Update score | Removes the provider implementation from the task. |
| Worker tick | Daily review update | Says what runs and when. |
| Needs attention | The specific warning, count or task | Gives the operator a next step. |

## Analytics correctness and privacy boundaries

- The Admin page and `/api/admin/analytics` remain behind the existing operator session check. API responses are private, non-cacheable and projected into aggregate-only fields.
- Overall traffic, daily traffic, sources, devices and recorded actions use a positive allowlist for `/`, Services, individual service pages, Work with us, Privacy and Terms. New private routes stay outside every total and breakdown by default.
- The six page groups use Vercel count queries filtered by `requestPath`. This works with historical path data and returns an exact visitor and page-view total for each approved group without sending raw paths to the browser.
- Count endpoints receive the verified date-only window. Aggregate endpoints receive explicit UTC start-of-day and end-of-day instants so the final reporting day is complete in both the 7-, 30- and 90-day views.
- Recorded-action totals group only by the six approved event names. This avoids Vercel's 100-row aggregate limit and keeps 90-day totals complete.
- The public site uses Vercel's Next.js analytics and Speed Insights adapters. Client-side `beforeSend` boundaries drop Admin, login, confirmation, preview and other private routes before collection.
- PostHog replay blocks every form, input, textarea, select and editable field. Built-in autocapture ignores the same elements, and client settings keep request bodies and headers disabled even if remote project settings change.
- PostHog rejects every event after a browser moves from a public page to an Admin or other private route. The dormant GTM and Meta loaders also stay off private routes. Enabling those advertising trackers later requires a separate consent and public-layout review because third-party browser globals can persist after they load.
- Provider and privacy regression tests use synthetic counts and sentinel private values. They do not read customer records or expose analytics credentials.

## Automated evidence

- `npm run test:launch` passes in full: capability and Owner guide contracts, design and visual coverage contracts, zero dependency vulnerabilities, lint, TypeScript, analytics, sync, Vagaro, quiz, image, storage, fixture and staff tests, production build, 68 public visual checks, 15 public accessibility checks and 4 interaction-analytics checks.
- `npm run check:admin-copy` inspects 3,196 user-facing strings across 112 files.
- `npm run test:admin-copy` passes 16 copy, source-extraction, activity-label and target-label checks.
- `npm run test:analytics` passes 27 provider-query, authorization, projection, event, public-route and interaction-privacy checks.
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

- 24 production-mode evidence images: six representative routes at 1280 × 900 and 390 × 844, the populated mobile review action menu and edit drawer, plus all four Website analytics views at 320 × 800, 390 × 844 and 1280 × 900.
- 29 unique production-mode Owner guide screenshots at 842 × 1248, referenced by 30 guide articles.
- Development launchers, design controls and stale account badges are absent. The Media tutorial prompt is dismissed before capture.
- No live analytics credential, Vercel account screen, raw customer record or production write appears in the evidence.
