# LashPop Admin analytics review evidence

This folder proves the private analytics board renders and behaves correctly against deterministic, non-customer fixture data. It is local acceptance evidence only. It does not prove deployment, production authentication, or production Vercel configuration.

## Surface under review

- Protected page: `/admin/analytics`
- Protected aggregate endpoint: `GET /api/admin/analytics?range=7d|30d|90d`
- Views: Overview, Acquisition, Conversion, Content & pages
- Data boundary: aggregate Vercel traffic, allowlisted public route patterns and fixed custom-event counts only

## Screenshots

| Evidence | File |
| --- | --- |
| Desktop overview, 1440 × 1000 | `desktop-overview.png` |
| Desktop acquisition | `desktop-acquisition.png` |
| Desktop conversion | `desktop-conversion.png` |
| Desktop content/pages | `desktop-pages.png` |
| Phone overview, 390 × 844 | `phone-390-overview.png` |
| Phone acquisition, 390 × 844 | `phone-390-acquisition.png` |
| Phone conversion, 390 × 844 | `phone-390-conversion.png` |
| Phone content/pages, 390 × 844 | `phone-390-pages.png` |
| Narrow phone overview, 320 × 800 | `phone-320-overview.png` |
| Phone loading state | `phone-390-loading.png` |
| Phone empty state | `phone-390-empty.png` |
| Phone provider/configuration error state | `phone-390-error.png` |

The owner-guide copy uses the independently generated `public/admin-guide/screenshots/02a-website-performance.png` image from the same production-mode fixture run.

## Local proof

- The production Next.js build served on `0.0.0.0` with a local read-only authentication stub, `VERCEL_ENV=development` and `LASHPOP_ANALYTICS_FIXTURE=1`. Fixture data is rejected unless the environment is positively identified as development or preview.
- No real LashPop customer, appointment, application, subscriber, or analytics credential was used by the browser run.
- An unauthenticated endpoint request returned `401`.
- An authenticated fixture request returned `200` and the aggregate DTO only.
- An unsupported `365d` request returned `400` with the range allowlist message.
- With fixture mode off and no dedicated `VERCEL_ANALYTICS_ACCESS_TOKEN`, an authenticated request returned `503 configuration_required` even though the machine had a general Vercel CLI owner token. The route does not fall back to that broader credential.
- Successful and validation responses included `Cache-Control: private, no-store, max-age=0` and `X-Content-Type-Options: nosniff`.
- Automated browser checks visited every view at desktop, the overview at 390px and 320px, plus loading, empty and provider-error states.
- `documentElement.scrollWidth` and `body.scrollWidth` stayed within the viewport at all three widths.
- Axe found no serious or critical issues after applying the repository's documented color-contrast exception.

## Provider proof and limitation

A separate read-only Vercel CLI probe confirmed the authenticated local account can read the public Web Analytics visits and events endpoints for the `lashpop` project. At approximately `2026-08-30T03:32Z`, the API returned 671 lifetime visitors, 2,307 pageviews, and 25 custom events. Those values are a drifting provider snapshot and are not baked into the UI or fixtures.

The implemented adapter was then exercised directly against those same read-only endpoints. For the seven completed UTC days ending August 29, it safely projected 46 visitors, 110 pageviews, one booking-start signal, zero booking-completion signals, two source rows, three device rows and two public page rows. The projected output contained all six fixed event names even when an event had zero rows. No token, provider response, visitor identifier or custom event property was printed or persisted.

Production currently has no `VERCEL_ANALYTICS_*` server variables. The existing local owner token has broader account authority than this dashboard needs and was not copied into the project or deployment. Production remains intentionally unconfigured until a dedicated team-scoped token is created and a separate release is authorized.
