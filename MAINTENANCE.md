# LashPop Website Maintenance & Operating Guide

This is the day-to-day operating manual for the LashPop website after launch. It explains where content lives, which system owns each field, how routine changes should be made, and which checks are mandatory before a change reaches production.

## Core rules

1. The approved launch appearance is frozen. `docs/design/brand-contract.json` is the source of truth for colors, fonts, spacing, and radii.
2. Inter is the only approved body font. Playfair Display is the only approved display font.
3. Do not introduce or change a color, font, spacing token, radius, or material layout behavior without written owner approval and an intentional visual-baseline update.
4. Never update visual snapshots merely to make a failing test pass. First determine whether the visual change was intentional.
5. Vagaro owns booking availability, service facts, provider photos, and provider bios for Vagaro-connected staff. The LashPop admin owns website publication and locally managed presentation fields.
6. Never hardcode credentials. Production credentials remain in their approved environment/secret stores.
7. Preserve historical records. Hide or archive departed staff, completed agreements, old submissions, and unsubscribed contacts instead of deleting them unless a documented retention policy requires deletion.

Repository-specific agent rules are in `AGENTS.md`. Launch acceptance is recorded in `docs/launch/website-acceptance-signoff.md`. Regression controls are explained in `docs/launch/regression-protection.md`.

## System ownership

| Information | Source of truth | Website behavior |
| --- | --- | --- |
| Service names, prices, duration, availability | Vagaro | Synced into the website |
| Exact service booking destination | Verified Vagaro widget mapping | Website fails closed if a mapping is not verified |
| Photos shown inside hosted Vagaro booking | Vagaro | Must be corrected in Vagaro |
| Vagaro-connected staff photo and bio | Vagaro public provider profile | Synced into the website |
| Staff present/active in Vagaro | `team_members.is_active` | Sync-owned; never use as the editorial website toggle |
| Staff published on website | `team_members.show_on_website` | Admin-owned; sync must never overwrite it |
| External/non-Vagaro staff content | LashPop admin/database | Never overwritten by Vagaro sync |
| Website photos and tagged galleries | DAM/photo manager | Managed at `/dam` |
| Quiz comparison and result photos | Quiz admin | Managed at `/admin/website/quiz` |
| Newsletter subscribers | Website subscriber directory | Managed/exported at `/admin/inbox/newsletter` |
| Brand colors and fonts | Frozen brand contract | Read-only unless owner approves a contract change |

## Admin shortcuts

- Photo manager: <https://lashpop.vercel.app/dam>
- Team publication and order: <https://lashpop.vercel.app/admin/website/team>
- Service presentation: <https://lashpop.vercel.app/admin/website/services>
- Hero media: <https://lashpop.vercel.app/admin/website/hero>
- Quiz photos and results: <https://lashpop.vercel.app/admin/website/quiz>
- Reviews: <https://lashpop.vercel.app/admin/website/reviews>
- Newsletter subscribers: <https://lashpop.vercel.app/admin/inbox/newsletter>
- Sync health: <https://lashpop.vercel.app/admin/system/syncs>
- Website history: <https://lashpop.vercel.app/admin/system/website-history>

Admin routes require an authorized admin account. `/dam` is a short alias for the authenticated asset manager.

## Routine content-change workflow

Use this workflow for copy, service subtitles, FAQ text, team order, benefits, and other non-structural updates.

1. Record the exact requested copy and affected page/component.
2. Identify the source of truth using the table above.
3. Confirm that the request does not alter a locked visual token.
4. Make the smallest targeted change. Avoid name-based or page-wide exceptions when an explicit content field is available.
5. Review mobile and desktop behavior.
6. Run the required checks in `AGENTS.md`.
7. Include the change in the next acceptance pass or obtain explicit approval if it changes a reviewed screenshot.

## Photo workflow

### Website/DAM photos

1. Open `/dam` and upload the highest-quality original available.
2. Add descriptive alt text.
3. Tag the asset to the correct service, team member, quiz style, or gallery collection.
4. Confirm orientation and crop in every surface where the image appears.
5. Do not overwrite an unrelated file at the same URL. Use a new asset/version so caches remain correct.
6. Verify the optimized image URL returns successfully before publishing.

### Hero photos

1. Keep separate desktop and mobile crops when the same source composition is used in differently shaped containers.
2. Mobile hero delivery must request enough full-frame source resolution for the tallest arch state. Do not bake a fixed server crop into the derivative: the `85dvh` arch changes shape as mobile browser chrome expands and collapses, so CSS `object-position` must remain the single crop source of truth.
3. Preserve the approved focal point configured in the hero admin and verify that the optimized derivative matches the approved composition pixel-for-pixel.
4. Test at standard and narrow iPhone widths, Android Chrome, desktop Safari, and a retina desktop viewport.
5. Test a cold reload with network throttling. A placeholder may appear while loading, but the final image must settle once and remain sharp.

### Staff and portfolio photos

1. Vagaro-connected headshots must be uploaded to the real Vagaro provider profile at original/high resolution.
2. Portfolio photos belong in the DAM and must be tagged to the correct team member.
3. Verify the profile preserves the prior image until the next image has decoded; never show a blank frame during navigation.
4. Test opening a profile, rapidly moving between staff, and swiping through work photos on a slower mobile connection.

## Staff onboarding workflow

Do not create a fabricated identity. Create the staff member's real provider profile in Vagaro and make it non-bookable when the profile exists only to supply website data.

1. Create the provider in Vagaro.
2. Add the approved display name, high-resolution headshot, and website-ready Business Summary/bio.
3. Configure their actual services. If the person should not be bookable, disable online booking/service availability while keeping the provider available to the public staff data source.
4. Run **Sync from Vagaro** in the website team admin.
5. Review the imported photo, bio, service tags, role, and booking behavior.
6. Publish the person using the website visibility control (`show_on_website`). Newly discovered providers should remain unpublished until this review is complete.
7. Confirm a non-bookable provider never appears as an available booking choice.

## Staff offboarding workflow

1. Confirm the effective removal date and whether existing appointments should remain bookable through that date.
2. Turn off **Visible on website** in the LashPop team admin. Do not delete the record.
3. Disable future booking in Vagaro at the appropriate time.
4. Run the Vagaro sync and verify the website visibility choice remains off.
5. Preserve historical reviews, submissions, photos, and audit records.
6. Verify the person is absent from the homepage team section, service stylist choices, metadata, and structured data.

## Service and Vagaro booking workflow

1. Change core service facts in Vagaro.
2. Run the Vagaro sync.
3. Check `/admin/system/syncs` for active service and verified booking-mapping health.
4. Test at least one service in every public category plus every service changed in the request.
5. Confirm the website heading and final Vagaro destination refer to the same service.
6. If photos are missing only after the Vagaro handoff, update the relevant service/provider media in Vagaro. Website DAM images cannot be injected into the hosted Vagaro interface.
7. Never construct or guess a widget URL. The complete verified Vagaro loader URL is canonical; see `docs/VAGARO_BOOKING_CONTRACT.md`.

## Quiz maintenance workflow

1. Maintain an approved answer/result matrix for Classic, Wet/Angel, Hybrid, and Volume.
2. Every questionnaire combination and representative photo-vote sequence must have a deterministic automated test.
3. “Neither of these” means no vote for that matchup; it must not penalize either style.
4. Result copy and the canonical result photo are managed in the quiz admin.
5. A result screen must choose one canonical photo and keep it stable. Service data may load afterward, but it must not replace an already displayed result image.
6. Maintain a fallback chain: result image, first enabled image for the winning style, the matching booking image, then the neutral approved loading surface.
7. Test rapid taps, repeated “Neither” selections, a delayed service response, a failed result image, back navigation, and reopening the quiz.
8. Before changing scoring weights, obtain client approval for examples of inputs and their expected results.

## Newsletter subscriber workflow

1. Open `/admin/inbox/newsletter`.
2. Review active, unsubscribed, and suppressed records. Do not erase consent history.
3. Use **Copy active** or **Export active CSV** for the approved email platform.
4. Never export unsubscribed or suppressed addresses into a send list.
5. Keep the public footer focused on signup; subscriber management remains authenticated.

## Visual-system change workflow

A visual-system change includes colors, font families, type tokens, spacing tokens, radii, shadows, or a material component-style change.

1. Obtain written owner approval describing the exact intended change.
2. Update `docs/design/brand-contract.json` and increment its version.
3. Update `src/styles/brand-contract.css` and any locked mappings.
4. Capture reviewed before/after screenshots for desktop and mobile.
5. Update Playwright baselines only after the difference is approved.
6. Run every required check and record the approval in the release notes.

The public `/#reviews` URL is a page anchor, not a color editor. Do not expose mutable brand controls to clients. If a client-facing reference is needed, provide a read-only rendering of the canonical contract.

## Release workflow

Run these from the repository root:

```bash
npm run check:design
npm run audit
npm run lint
npm run types
npm run test:vagaro
npm run test:quiz
npm run test:visual
npm run test:a11y
npm run build
```

Then:

1. Review the exact diff and confirm unrelated user work was not modified.
2. Verify any required database migration is applied before code that depends on it.
3. Deploy a production candidate.
4. Repeat critical booking, quiz, hero, team, map, form, and subscriber checks against the candidate.
5. Complete `docs/launch/website-acceptance-signoff.md` against the exact commit and URL.
6. Retain the prior known-good deployment as the rollback target.

When hero delivery changes, verify the live mobile request receives an oversampled full-frame derivative without fixed `h`, `fit`, `gx`, or `gy` crop parameters, then confirm the approved mobile baseline still passes. Deploy `workers/lashpop-img` first only when its transformation behavior changes. When staff sync ownership changes, deploy `workers/vagaro-sync` before testing publication behavior.

## DNS cutover workflow

The production-domain cutover moves the entire authoritative zone, not only the website records. Treat email and verification records as launch-critical infrastructure.

1. Push the exact release commit and confirm its CI checks pass. Deploy that commit to `lashpop.vercel.app` and run `npm run test:launch` plus `npm run validate:seo-migration -- https://lashpop.vercel.app`.
2. Export or inventory both the active and replacement Cloudflare zones. Confirm exact parity for MX, SPF, DKIM, DMARC, MTA-STS, TLS reporting, autoconfig, mail host, SRV, payment, domain-connect, and verification records.
3. Confirm the replacement zone points the apex and `www` to the project-specific values shown by `vercel domains inspect lashpopstudios.com`. Keep Vercel records DNS-only unless Vercel explicitly documents a different setup.
4. Confirm Vercel has both custom hostnames attached to the exact production deployment and retain the prior Squarespace deployment and nameservers as the rollback target.
5. At the registrar, replace only the authoritative nameservers. The prepared replacement zone uses `fatima.ns.cloudflare.com` and `nicolas.ns.cloudflare.com`; the rollback nameservers are `coleman.ns.cloudflare.com` and `katelyn.ns.cloudflare.com`.
6. Monitor authoritative DNS from multiple resolvers. As soon as the new zone answers publicly, verify Vercel domain status and TLS issuance for the apex and `www`.
7. Smoke-test homepage, legacy redirects, booking, quiz, forms, admin login, email delivery, mail autoconfig, and Worker health. Re-run the SEO migration validator against `https://lashpopstudios.com`.
8. Submit the production sitemap in Search Console/Bing and monitor errors, redirects, indexing, and conversions during the observation window.
9. If a critical web, TLS, or mail issue cannot be corrected promptly, restore the prior nameservers as a unit. Never attempt rollback by changing mail records independently.

## Regression or incident workflow

If an AI or developer unintentionally changes the site's appearance or behavior:

1. Stop the release. Do not regenerate screenshots.
2. Run `npm run check:design` and the relevant Playwright project to identify the violated contract.
3. Compare the change against the last signed commit and approved screenshots.
4. Revert only the unintended change; preserve unrelated work in the working tree.
5. Add a focused automated check for the failure mode before declaring it fixed.
6. If production is affected, use the recorded known-good deployment for rollback and then ship the tested correction.
7. Document what failed, why existing checks missed it, and the new prevention added.

## Launch accessibility exception

The approved palette includes foreground/background combinations that do not meet WCAG 2.2 AA contrast requirements. LashPop has instructed that those colors remain unchanged for this launch. The signed acceptance must retain the explicit contrast acknowledgment in `docs/launch/website-acceptance-signoff.md`.

This exception applies only to color contrast. Keyboard behavior, focus, labels, semantics, reduced motion, error handling, zoom, and other accessibility requirements remain defects when broken.
