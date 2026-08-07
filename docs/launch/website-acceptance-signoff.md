# LashPop Website Launch Acceptance & Sign-Off

This document records final acceptance of the public LashPop website release. Complete it against the exact production candidate commit and URL that will be launched.

## Release identification

- Production candidate URL: ______________________________
- Git commit SHA: ________________________________________
- Planned launch date/time: _______________________________
- Business approver: _____________________________________
- Technical approver: ____________________________________
- Date signed: ___________________________________________

## Approved scope and intentional exclusions

The approver confirms that:

- The site's current colors, typography, and overall visual appearance are approved as shown in the production candidate.
- The Classic Fill booking path and representative booking paths have been tested through the Vagaro handoff.
- Mobile stylist service chips remain horizontally usable and do not escape their cards.
- The studio map loads with its matching local Mapbox stylesheet before map initialization.
- No new FAQs or gallery images are part of this release.
- The existing mobile reviews presentation is accepted without redesign in this release.

## Explicit accessibility color-contrast acknowledgment

The approver understands and accepts all of the following:

1. Some approved foreground/background color combinations do **not** meet WCAG 2.2 AA minimum color-contrast requirements.
2. LashPop has instructed the implementation team to preserve the approved colors exactly and not remediate those contrast failures in this release.
3. Reduced contrast can make content harder to perceive for people with low vision, color-vision differences, age-related vision changes, or use in difficult lighting conditions.
4. This acknowledgment does not make the website WCAG-conformant, does not remove statutory or contractual accessibility obligations, and is not legal advice. LashPop should consult qualified accessibility and legal counsel about its obligations and risk.
5. All non-color accessibility defects remain in scope for normal regression prevention and remediation.

Business approver initials for contrast exception: __________

## Final acceptance checklist

### Client update verification

- [ ] The homepage hero photo is sharp after a cold load on retina desktop and standard/narrow iPhone widths.
- [ ] Classic, Wet/Angel, Hybrid, and Volume Full Set cards do not show the removed pink subtitles.
- [ ] Ava Z. and every other profile marked **not visible on website** are absent from public team surfaces, while their historical records remain intact.
- [ ] Opening a stylist and rapidly changing profile/work photos does not show the prior stylist, a blank frame, or an intentional blur animation.
- [ ] The lash quiz returns approved results for client-provided example answer paths; “Neither of these” is visually obvious and does not change either style score.
- [ ] Quiz result imagery loads once, remains stable while service data arrives, and has a working same-style fallback.
- [ ] Booth Rental benefits include “8 weeks of complimentary booth rent for maternity leave.”
- [ ] Newsletter subscribers are accessible to an authorized admin at `/admin/inbox/newsletter`, including active-only copy/export.
- [ ] Microblading images are visible inside the hosted Vagaro booking experience. This item must be completed in Vagaro; the website’s six service images and exact widget mappings have been verified.

### Content and business

- [ ] Business name, address, phone, email, hours, service names, pricing, policies, and team information are current.
- [ ] Header, navigation, calls to action, social links, legal links, and footer links go to the intended destinations.
- [ ] Contact/newsletter forms show a success state and submissions arrive at the intended destination.
- [ ] No draft, placeholder, test, or internal-only content is visible.
- [ ] Privacy policy, terms, cookie behavior, and required business disclosures have owner/counsel approval.

### Booking

- [ ] Classic Fill completes the expected Vagaro handoff on desktop and mobile.
- [ ] At least one service from each public service category opens the correct booking destination.
- [ ] Stylist-specific booking buttons open the correct stylist/service destination.
- [ ] Back, close, retry, and cancellation behavior work without trapping the visitor.

### Browser and device acceptance

- [ ] Current Chrome desktop.
- [ ] Current Safari desktop.
- [ ] Current Firefox desktop.
- [ ] iPhone Safari at narrow and standard widths.
- [ ] Android Chrome at narrow and standard widths.
- [ ] Keyboard-only navigation and visible focus indicators.
- [ ] 200% browser zoom and landscape mobile orientation.
- [ ] Slow/reloaded network behavior for hero media, team photos, booking embed, and map.

### Technical and discovery

- [ ] `npm run test:launch` passes on the signed commit.
- [ ] `npm run test:visual` passes against approved baselines.
- [ ] `npm run test:a11y` passes with only the documented color-contrast exception disabled.
- [ ] `npm run build` passes on the signed commit.
- [ ] Canonicals, metadata, Open Graph image, sitemap, robots.txt, redirects, and structured data match the production domain.
- [ ] Production HTTPS, DNS, www/apex redirects, caching, compression, and security headers are correct.
- [ ] Analytics and conversion events are visible in their real-time/debug views without collecting prohibited data.
- [ ] Error monitoring, uptime monitoring, and a post-launch owner are assigned.
- [ ] A rollback target and the exact rollback procedure have been recorded and tested.

## Acceptance

By signing below, the business approver accepts the identified production candidate for launch, including the intentional exclusions and explicit color-contrast exception above.

- Business approver signature: ____________________________  Date: __________
- Technical approver signature: ___________________________  Date: __________
