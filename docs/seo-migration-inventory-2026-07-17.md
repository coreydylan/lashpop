# LashPop SEO migration and URL preservation inventory

Audit date: 2026-07-17 (America/Los_Angeles)

Sources checked:

- Rendered Chromium crawl of the still-authoritative Squarespace site at `https://www.lashpopstudios.com`
- Squarespace `robots.txt`, `sitemap.xml`, page JSON, rendered metadata, canonicals, links, and JSON-LD
- Search-engine discovery (`site:lashpopstudios.com`)
- Staging crawl at `https://lashpop.vercel.app`
- Next.js App Router route tree and redirect configuration

## Executive result

The Squarespace XML sitemap exposes only four URLs, but its folder/composite-page model contains 16 self-canonical public 200 URLs. Two more non-canonical utility URLs (`/cart` and `/search`) also work today. All known legacy paths now have an explicit one-hop preservation strategy.

The staging sitemap failure was confirmed exactly: 106 URLs consisted of 3 direct 200 responses, 1 redirect, and 102 404 responses. The cause was a mismatch between generated category-nested URLs (`/services/{category}/{service}`) and the only implemented detail route (`/services/{service}`). The repaired sitemap uses the actual canonical route and the high-value legacy `/services` URL is retained as a real service directory.

## Legacy URL inventory and destination map

All statuses in the `Legacy status` column were observed on Squarespace before DNS cutover.

| Legacy path | Legacy status / canonical state | Legacy title or purpose | Launch destination | Treatment |
|---|---:|---|---|---|
| `/` | 200, canonical | LashPop Eyelash Extensions, Brow Services, Waxing, Hydrafacials | `/` | Retain as canonical 200 |
| `/home` | 200, canonical points to `/` | Homepage alias | `/` | Permanent redirect |
| `/services` | 200, self-canonical | LashPop Services | `/services` | Retain as canonical 200 service directory |
| `/about-us-1` | 200, self-canonical | About Our Team / Our Vision / FAQ | `/#team` | Permanent redirect |
| `/about-us-lashpop-studios` | 200, self-canonical | About LashPop Studios | `/#team` | Permanent redirect |
| `/about-us-home` | 200, self-canonical | Homepage About section | `/#team` | Permanent redirect |
| `/our-story` | 200, self-canonical | Our Story | `/#team` | Permanent redirect |
| `/meet-the-team` | 200, self-canonical | Meet the Team | `/#team` | Permanent redirect |
| `/join-us` | 200, self-canonical | Join Us | `/work-with-us` | Permanent redirect |
| `/book-contact-1` | 200, self-canonical | Book + Contact | `/#find-us` | Permanent redirect |
| `/faq` | 200, self-canonical and search-discovered | FAQ | `/#faq` | Permanent redirect |
| `/home-hero-image` | 200, self-canonical | Composite homepage hero section | `/` | Permanent redirect |
| `/services-offered` | 200, self-canonical | Composite homepage services section | `/services` | Permanent redirect |
| `/location-homepage` | 200, self-canonical | Composite homepage location section | `/#find-us` | Permanent redirect |
| `/refer-a-friend` | 200, self-canonical | Referral content | `/` | Permanent redirect; referral FAQ remains on homepage |
| `/referrals` | 200, self-canonical | Referral/review content | `/` | Permanent redirect |
| `/email-list` | 200, self-canonical | Email signup section | `/` | Permanent redirect; signup remains on homepage |
| `/cart` | 200, no canonical | Empty Squarespace commerce utility | `/` | Permanent redirect |
| `/search` | 200, no canonical and blocked by legacy robots | Squarespace search utility | `/` | Permanent redirect |

Additional compatibility rules:

- `/about-us-1/join-us` redirects directly to `/work-with-us`.
- Unknown `/about-us-1/*` descendants redirect directly to `/#team`.
- Accidentally published staging URLs matching `/services/{category}/{service}` redirect directly to `/services/{service}` so already-crawled bad sitemap URLs do not become permanent 404s.
- The accidentally published inactive category URLs `/services/nails` and `/services/lashpop-pro-training` redirect to `/services` and `/work-with-us`, respectively.
- Hash fragments are not sent to servers and are not separate indexable URLs. The primary legacy section paths are preserved at the HTTP layer; historical composite-page fragment names should be included in browser QA during cutover.

## Metadata and schema baseline

### Squarespace baseline

| Page | Title | Meta description | Canonical | Rendered schema |
|---|---|---|---|---|
| `/` | LashPop Eyelash Extensions, Brow Services, Waxing, Hydrafacials | Book an appointment at LashPop today for a premium beauty experience with our talented stylists in a beautiful, relaxing studio environment. | `https://www.lashpopstudios.com` | WebSite, Organization, LocalBusiness |
| `/about-us-1` | About LashPop- Eyelash Extensions Carlsbad — LashPop Eyelash Extensions & Brow Services | Since 2016, our mission has been to offer an unparalleled eyelash extension service offerings, client experience and studio environment. | Self | WebSite, Organization, LocalBusiness |
| `/services` | LashPop Services — LashPop Eyelash Extensions & Brow Services | Classic, hybrid, and volume eyelash extensions in North County San Diego. Now offering- Eyebrow Waxing! | Self | WebSite, Organization, LocalBusiness |
| `/book-contact-1` | Book + Contact — LashPop Eyelash Extensions & Brow Services | Missing | Self | WebSite, Organization, LocalBusiness |
| `/faq` | FAQ — LashPop Eyelash Extensions & Brow Services | Missing | Self | WebSite, Organization, LocalBusiness |

Squarespace's rendered Organization and LocalBusiness JSON-LD still identifies `5055 Avenida Encinas, Carlsbad, CA 92008`, has no phone, and emits empty opening hours. Visible legacy content instead shows `429 South Coast Highway, Oceanside, CA 92054` and `(760) 212-0448`. The migration should improve this stale schema rather than reproduce it.

### Staging findings and resolved NAP decision

- Staging correctly publishes the Oceanside address (`429 S Coast Hwy, Oceanside, CA 92054`).
- The authoritative primary number was confirmed as `(760) 212-0448` from the official Vagaro listing plus legacy/visible/social agreement. On 2026-07-17, the D1 `business_locations` row was corrected from `(760) 453-2866` to `(760) 212-0448` and verified with the Oceanside address. Revalidate rendered JSON-LD after deployment and keep external citations consistent.
- Before this work, `/privacy`, `/terms`, and every service detail inherited the homepage canonical and `og:url`. They now receive self-referencing canonical/Open Graph URLs.
- Category pages and the service hub now provide crawlable internal links to service detail pages, eliminating sitemap-only orphan service pages.

## Important external-link baseline

These are the business-critical destinations observed in the rendered Squarespace crawl. They should be smoke-tested on the final deployment and compared with the current studio data source:

- Booking: `https://www.vagaro.com/lashpop32` and `https://www.vagaro.com/lashpop32/book-now`
- Instagram: `https://instagram.com/lashpopstudios`
- Facebook: `https://www.facebook.com/lashpopCA`
- TikTok: `https://www.tiktok.com/@lashpopstudios_`
- Yelp business: `https://www.yelp.com/biz/lashpop-studios-oceanside`
- YouTube: `https://www.youtube.com/@lashpopstudios`
- Google Maps/directions: legacy short link `https://goo.gl/maps/SdH4Uk4P2SDSoxaX8`
- Google review: `https://g.page/r/CV78k8W-eehJEBM/review`
- Yelp review and Vagaro review links
- Individual artists' Instagram and booking destinations on the team section

Query strings used only for old social attribution were intentionally omitted above; the underlying destination/account is what must remain continuous.

## Analytics continuity

The Squarespace source includes:

- Google Tag Manager container `GTM-KDJ34BG`
- Meta Pixel `314609749250536`

The new site currently includes Vercel Analytics and Speed Insights. Before launch, the owner must decide whether GTM and the Meta Pixel are still authorized/required, then verify consent behavior, page-view duplication, conversion events, referral exclusions, and booking-domain cross-domain measurement. Do not silently install or remove client marketing tags during an SEO-only change.

## DNS state (do not change from this workstream)

- Cloudflare account zone `022c05b555708146355c1cb68ad698b4` is pending and contains the intended Vercel A records plus `fatima` / `nicolas` nameserver context.
- Public/authoritative `coleman` / `katelyn` nameservers still serve Squarespace.
- Until the registrar nameservers change and the Cloudflare zone becomes active, requests to the production domain continue to hit Squarespace. This explains why production-domain URLs embedded in the staging sitemap cannot be endpoint-tested against Vercel without rebasing their paths to the staging host.

## Cutover checklist

### Before DNS change

- [ ] Confirm the canonical production hostname policy (`https://lashpopstudios.com`, non-www) and that Vercel redirects HTTP and `www` to it in one hop.
- [x] Confirm the primary phone number and correct the site data source to `(760) 212-0448`; revalidate rendered JSON-LD after deployment and continue citation reconciliation.
- [ ] Run `npm run validate:seo-migration -- https://<final-preview-host>` against the release candidate.
- [ ] Verify every XML sitemap URL returns 200 and exactly matches its page canonical.
- [ ] Verify all legacy redirects return 301/308 in one hop with no redirect loops or chains.
- [ ] Export current Google Search Console performance, indexed pages, top landing pages/queries, links, and sitemap coverage as a migration baseline.
- [ ] Ensure Google Search Console and Bing Webmaster Tools access is retained; prepare the canonical sitemap URL for submission.
- [ ] Decide and implement GTM/Meta Pixel continuity with consent and duplicate-event checks.
- [ ] Smoke-test booking, phone, SMS, email, newsletter, map/directions, social, review, and artist-specific external links.
- [ ] Confirm `robots.txt` allows public pages and render assets while blocking operational/admin/preview routes.
- [ ] Validate LocalBusiness, FAQ, service, and review markup with rendered-page tools/Rich Results Test.
- [ ] Capture a crawl of the final preview as the launch baseline.

### DNS cutover window

- [ ] Lower TTL in advance if the authoritative provider permits it.
- [ ] Change only the planned nameserver/DNS records; preserve mail, verification, and non-web records exactly.
- [ ] Confirm Cloudflare zone activation and Vercel domain verification/certificate issuance.
- [ ] Test from multiple resolvers and both IPv4/IPv6 where applicable.
- [ ] Re-run the SEO migration validator against `https://lashpopstudios.com` after public DNS converges.
- [ ] Submit/resubmit `https://lashpopstudios.com/sitemap.xml` in Search Console and Bing.

### After cutover

- [ ] Monitor 404/410/5xx responses, redirect chains, crawl anomalies, sitemap fetches, canonical selection, and indexing daily for the first two weeks.
- [ ] Monitor organic landing pages and conversions against the baseline weekly for at least 8–12 weeks.
- [ ] Inspect unexpected 404s and add a relevant direct redirect only when a legitimate historical URL/backlink is verified; do not mass-redirect unrelated content to the homepage.
- [ ] Keep migration redirects for at least 12 months and preferably indefinitely while external links exist.
- [ ] Do not remove Squarespace until a final content/image/legal export and rollback plan are retained.

## Remaining limitations and risks

- Google Search Console, Bing Webmaster Tools, analytics property history, and backlink-tool exports were not available in this workstream. A crawl cannot prove that no unlinked historical URL has an external backlink; GSC and backlink exports are the final authority.
- The production domain still resolves to Squarespace, so the implemented Vercel behavior must be revalidated after deployment and again after DNS convergence.
- Redirects to homepage fragments preserve the closest consolidated content but do not retain a separate indexable document for every former composite page. `/services` was deliberately kept as a standalone 200 because it is the strongest distinct service-intent URL.
- The old site has stale/contradictory location schema. The staging phone mismatch was corrected in D1, but rendered production JSON-LD and major external citations still need post-deployment verification.
- Legacy GTM and Meta Pixel continuity remains an explicit owner/analytics decision.
