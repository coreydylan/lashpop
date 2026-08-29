# LashPop Website — Final Go-Live Acceptance

This is the final client approval before the new website replaces the current public site. It is written in plain English so each person signing can understand what they are approving.

Every item marked **Required before launch** must be checked. If an item is not complete, record it in **Open items and accepted exceptions** and decide whether it blocks launch. A blank required item means **do not launch**.

This document records decisions and authorization. It does not waive anyone's legal rights, remove accessibility or privacy obligations, or replace advice from qualified legal counsel.

## Technical preflight record — direct Cloudflare Images candidate (unsigned)

This engineering record does not check or replace any client, legal, billing, launch-owner, observation-owner, rollback-owner, or GO LIVE approval below.

| Gate | Evidence as of 2026-08-29 | Status |
| --- | --- | --- |
| Candidate | Branch `codex/direct-cloudflare-images-2026-08-29`, based on merged main `05727d0`; exact commit and PR are recorded after the final launch test | In progress |
| Architecture | Public Next.js paths use `imagedelivery.net` directly. `lashpop-img` is transition/rollback infrastructure only; no app loader, rewrite, or public raster path depends on it | Verified in code and browser network evidence |
| Inventory | 525 conservative sources: 456 reachable first-party sources with ready Cloudflare Images objects, 68 reachable provider sources with ready transition objects, and one deleted historical R2 row that is not the effective public portrait | Verified |
| Targeted repair | The corrected CSS-mask scanner found `lp-logo.png`; exactly one deterministic Cloudflare Images object was uploaded and the committed site manifest now contains 49 entries | Verified; no repeated completed upload |
| Direct data plan | Plan-only result: 456 first-party registry rows; 71 Vagaro row updates (55 services, 16 staff); zero missing provider sources; `publicDnsChanged: false` | Verified; no database write performed |
| Refresh behavior | Allow-listed source fetch, conditional refresh, content-hash idempotency, adoption of transition images without re-upload, immutable changed-content IDs, retained prior ID, preserved last-ready image on refresh failure, and fail-closed first ingestion | Unit tests pass |
| Width/format delivery | 612/612 direct requests passed across 17 widths (64–3840) and AVIF/WebP/JPEG negotiation. A new 7,860-request full-source run was stopped at its ten-minute ceiling before a summary; the earlier hosted-source matrix remains 8,190/8,190 | Representative direct gate verified; new full matrix not claimed complete |
| Browser/network | Production-mode fixture gate passes unchanged hero/services/team/footer baselines and all accessibility/booking/quiz checks. Real production data passes direct-origin, no-broken-image, and no-overflow checks at 1440, 390, and 320 on home and Work With Us; `/services/classic` passes at 390 | Verified locally; exact Vercel candidate still required |
| Admin/privacy | Public action results replace source URLs with direct delivery URLs; source-only Vagaro fields are nulled at the public boundary. `/admin` redirects to login and unauthenticated DAM API returns 401. New raster storage writes fail closed unless Cloudflare Images ingestion succeeds; deletion covers source and delivery objects | Verified locally |
| Map | The Field local environment file contains a stale Mapbox token and returns 401; the current `lashpop.vercel.app` production surface loads Mapbox with no Mapbox error. Candidate Vercel check must re-prove this using its managed environment | Local-secret issue documented; not an app-code defect |
| Deployment and DNS | Direct app/database/Vagaro Worker candidate is not deployed or merged. Existing `lashpop-img` remains available for transition rollback. Public apex and `www` DNS were not changed | Preserved |

Human-only decisions still required: legal/privacy notice details and signatures; billing authorization; owner/client visual, content, booking, quiz, admin, and device acceptance; named launch, observation, and rollback owners; a real signed Vagaro delivery; and final written GO LIVE authorization.

## 1. Identify the exact version being approved

This prevents a different version from being launched after the review.

- Client/business name: LashPop Studios
- Production candidate URL: `https://lashpop.vercel.app`
- Deployment ID: ______________________________________________
- Git commit: __________________________________________________
- Date and time reviewed: ______________________________________
- Planned launch date and time: _________________________________
- Client approver's name and title: ______________________________
- Experial release owner: _______________________________________
- Rollback version or deployment: _______________________________

- [ ] **Required before launch — Same version:** I understand that my approval applies only to the URL, deployment, and commit written above. Any material change after this review requires new testing and, when it changes what I approved, new client approval.

## 2. Final visual and content review

These checks confirm that the site looks right and says the right things. Automated tests can catch many mistakes, but they cannot decide whether a photo, price, biography, or business statement is correct.

- [ ] **Required before launch — Overall appearance:** I reviewed the homepage and main pages on a phone and a desktop computer. The colors, fonts, spacing, photos, layout, and general appearance match the approved design.
- [ ] **Required before launch — Hero photo:** The main homepage photo looks sharp on phone and desktop, and its composition has not changed from the approved version.
- [ ] **Required before launch — Business facts:** The business name, address, phone number, email, hours, service names, prices, policies, and other factual information are correct.
- [ ] **Required before launch — Navigation and footer:** The menu, buttons, social links, legal links, and footer links go where I expect.
- [ ] **Required before launch — Services:** The public service categories and service cards are accurate. The removed pink lash-service subtitles do not appear.
- [ ] **Required before launch — Team:** The correct staff members, biographies, service assignments, photos, and links are public. Ava Z. and anyone else marked not visible on the website are not shown.
- [ ] **Required before launch — Client-requested copy:** Booth Rental includes “8 weeks of complimentary booth rent for maternity leave.”
- [ ] **Required before launch — No unfinished material:** I did not find draft copy, placeholder content, test records, internal notes, or images that should not be public.
- [ ] **Accepted unchanged for this launch:** No new FAQs or gallery photos are part of this release, and the current mobile reviews layout is approved without a redesign.

Client initials for visual and content approval: __________

## 3. Booking and Vagaro

The website sends visitors into Vagaro to complete booking. Vagaro is a separate service, so LashPop must approve both the website handoff and the experience that appears after Vagaro opens.

- [ ] **Required before launch — Classic Fill:** I completed the “Book a Classic Fill” handoff on phone and desktop and reached the correct Vagaro booking choice.
- [ ] **Required before launch — Representative bookings:** I tested at least one service in every public category and confirmed that each opens the intended Vagaro location, service, and staff choice.
- [ ] **Required before launch — Stylist bookings:** I tested representative booking buttons from stylist profiles and reached the correct Vagaro destination.
- [ ] **Required before launch — Exit and recovery:** I can go back, close, retry, or cancel without getting stuck.
- [ ] **Required decision — Microblading photos:** I understand that photos shown after the visitor enters Vagaro are controlled in Vagaro, not by the LashPop website. The website's brow images and booking links have been checked, but the missing microblading photos inside Vagaro must be fixed or accepted in Vagaro before launch.

Microblading/Vagaro decision — check one:

- [ ] The images are now correct in Vagaro.
- [ ] LashPop accepts launching while this remains open. Owner: __________________ Due date: ______________ Client initials: __________

## 4. Lash quiz

The quiz can run without a technical error and still recommend the wrong service if the business rules are wrong. The client must therefore approve real examples of the answers and results.

- [ ] **Required before launch — Result accuracy:** I tested representative answer paths for Classic, Wet/Angel, Hybrid, and Volume results, and the recommendation matched what LashPop would tell that client.
- [ ] **Required before launch — Stable result:** The final result does not switch between two photos, disappear, or show the wrong fallback image while the page is loading.
- [ ] **Required before launch — “Neither” choice:** “Neither of these” looks like a clear button, can be selected, and does not add a preference for either pictured style.
- [ ] **Required before launch — Recovery:** I can go back, change an answer, restart, and complete the quiz again without stale answers or images.

Client initials for quiz recommendation accuracy: __________

## 5. Photos, stylist profiles, map, and forms

These are high-visibility interactions that rely on images, data, or outside services.

- [ ] **Required before launch — Stylist photos:** Opening a stylist and moving between work photos feels stable. I do not see the previous stylist, an empty frame, an unintended blur effect, or broken images.
- [ ] **Required before launch — Gallery:** Gallery images open, move forward and backward, close, and remain clear on phone and desktop.
- [ ] **Required before launch — Map:** The map loads in the correct style, shows the correct LashPop location, and provides a useful directions path.
- [ ] **Required before launch — Contact and newsletter:** Each public form shows a clear success or error message, and a real test submission reaches the intended destination.
- [ ] **Required before launch — Subscriber access:** An authorized admin can sign in, open `/admin/inbox/newsletter`, view the active subscriber list, and copy or export it.

## 6. Accessibility and the approved color exception

Accessibility means people with disabilities can perceive, understand, and operate the site. This includes color contrast, keyboard use, visible focus, labels, page structure, motion, zoom, and error messages.

WCAG 2.2 Level AA generally calls for a contrast ratio of at least **4.5:1 for normal text**, **3:1 for large text**, and **3:1 for visual information needed to identify controls and meaningful graphics**. Lower contrast can make text and controls difficult or impossible to see for some people with low vision, color-vision differences, age-related vision changes, or difficult lighting conditions.

### Color-contrast exception — explicit approval required

- [ ] **I understand the issue:** Some of LashPop's approved text/background and interface color combinations do not meet WCAG 2.2 Level AA minimum contrast requirements.
- [ ] **I understand the impact:** Some visitors may have difficulty reading content or recognizing controls because of the approved colors.
- [ ] **I am choosing to keep the colors:** LashPop has directed Experial not to change the approved colors for this release, even where changing them could correct a contrast failure.
- [ ] **I understand what this approval does not mean:** This decision does not make the site fully WCAG conformant, does not guarantee compliance with accessibility law, and does not remove LashPop's accessibility obligations or risk.
- [ ] **I understand the scope:** This exception covers only the approved color contrast. It does not approve broken keyboard access, missing labels, missing alternative text, keyboard traps, invisible focus, unusable zoom, or other accessibility defects.

Client initials accepting the color-contrast exception: __________

### Fonts and all other accessibility checks

- [ ] **Required before launch — Approved fonts:** The site uses Inter for body/interface text and Playfair Display for display headings. I approve those fonts as shown. “Swank” and “Moo Moo” are not loaded or used by the public site.
- [ ] **Required before launch — Readability:** Important text is not cut off or unreadable, and the site remains usable at 200% browser zoom and in mobile landscape orientation.
- [ ] **Required before launch — Keyboard:** I can reach and operate navigation, buttons, forms, dialogs, the quiz, and other important controls without a mouse. Focus is visible and I do not get trapped.
- [ ] **Required before launch — Meaning and labels:** Important images have appropriate text alternatives; form controls and buttons have understandable names; headings and page structure make sense.
- [ ] **Required before launch — Motion:** The site respects reduced-motion preferences, and movement does not prevent a visitor from using the site.
- [ ] **Required before launch — Automated check:** The launch accessibility test passes for serious and critical issues, with only the documented color-contrast rule excluded. I understand that automated testing cannot find every accessibility problem.

## 7. Privacy, analytics, and legal content

The site includes tools that may collect visitor or marketing data. The business owner must decide which tools are authorized and how consent and disclosures should work.

- [ ] **Required before launch — Privacy and legal review:** The Privacy Policy, Terms, cookie behavior, form notices, and required business disclosures have been reviewed and approved by LashPop and, when appropriate, qualified counsel.
- [ ] **Required before launch — Tracking decision:** LashPop has confirmed whether Google Tag Manager `GTM-KDJ34BG`, Meta Pixel `314609749250536`, Vercel Analytics, and Speed Insights are authorized for launch.
- [ ] **Required before launch — Consent behavior:** The approved consent, opt-out, and browser-based privacy signals such as Global Privacy Control (GPC) have been tested. Tracking does not collect information that LashPop has prohibited.
- [ ] **Required before launch — Measurement:** Approved page views and important conversion events appear once in the intended real-time or debug reports.

Client initials for privacy, legal content, and tracking approval: __________

## 8. Admin, photo manager, and ongoing content

This confirms that the people responsible for the site can manage it after launch without making a public mistake.

- [ ] **Required before launch — Admin login:** An authorized LashPop user has signed in successfully after the most recent session reset.
- [ ] **Required before launch — Permissions:** Owner, publisher, and viewer accounts can do only what each role is supposed to do.
- [ ] **Required before launch — Photo manager:** An authorized user opened `https://lashpop.vercel.app/dam`, uploaded or selected a test image, and confirmed the expected public result.
- [ ] **Required before launch — Content editing:** An authorized user made and verified a safe test edit, then confirmed that logout works.
- [ ] **Ongoing workflow understood:** New staff must first be added in Vagaro. If the website needs a public photo and biography while booking should remain unavailable, LashPop will use the documented disabled-profile workflow and verify the public result before publishing.

## 9. Security and prior backup exposure

This item records a required privacy decision. It is separate from the normal visual and functional website review.

During the launch audit, historical database backup files containing client/contact, appointment, form-response, transaction, and session data were found reachable without authentication. The files were moved to private storage, the public copies were removed, affected sessions were revoked, and the exposed paths now return a private `404`. The technical exposure is contained. Available evidence has not established whether anyone outside the team downloaded the files before containment.

- [ ] **Required before launch — Decision recorded:** LashPop received the incident record at `docs/ops/security-incident-2026-07-17-public-backup.md` and obtained appropriate privacy/legal advice about investigation, evidence retention, and any notice to affected people or regulators.
- [ ] **Required before launch — Named decision owner:** The person responsible for the incident decision, any notice, and the archive retention/deletion date is named below.

Decision owner: _________________________________________________

Decision/date or counsel reference: ______________________________

Client initials acknowledging receipt and the recorded decision: __________

## 10. Third-party services and remaining integrations

Vagaro, Mapbox, Google, Meta, Vercel, and other outside services can change, expire a login, or have an outage. The site can be tested against them, but LashPop and Experial cannot guarantee that an outside service will always be available.

- [ ] **Required before launch — Vagaro verification:** The production webhook verification secret is configured, and a real Vagaro delivery has been tested successfully.
- [ ] **Third-party limitation understood:** I understand that a later outage or change inside an outside service may require separate troubleshooting and is not, by itself, a defect in the signed website release.

## 11. Browser and device acceptance

The goal is not to make every browser look pixel-for-pixel identical. The goal is for the approved design and all important actions to remain clear and usable.

- [ ] **Required before launch — Desktop:** I reviewed the site in current Chrome and Safari, and the agreed Firefox compatibility check also passed.
- [ ] **Required before launch — iPhone:** Reviewed in Safari at narrow and standard phone widths.
- [ ] **Required before launch — Android:** Reviewed in Chrome at narrow and standard phone widths.
- [ ] **Required before launch — Less-than-perfect connections:** Hero media, staff photos, the booking handoff, quiz images, and map recover acceptably after a slow load or refresh.

Devices/browsers personally reviewed by client: _____________________________

Client initials for browser and device approval: __________

## 12. Technical release checks

The technical approver completes this section. These checks provide evidence that the exact release builds correctly and still matches the signed design and behavior.

- [ ] **Required before launch — Full launch test:** `npm run test:launch` passes on the exact signed commit.
- [ ] **Required before launch — Visual protection:** The approved visual screenshots pass. No one updated a baseline simply to hide an unexplained visual change.
- [ ] **Required before launch — Design contract:** The color, typography, spacing, and protected-file checks pass against the approved design contract.
- [ ] **Required before launch — Repository protection:** The main code branch requires a reviewed change request and passing quality/visual checks. Direct and forced changes that could bypass review are blocked.
- [ ] **Future-change process understood:** A material color, font, spacing, layout, or other visual-system change requires written approval, before-and-after phone and desktop screenshots, an intentional design-contract update, and passing launch checks.
- [ ] **Required before launch — Security and dependencies:** The production dependency audit has no unresolved vulnerability that the release owner has classified as a launch blocker.
- [ ] **Required before launch — Search migration:** Search-engine signals—including each page's preferred address, title and description, social preview, site map, crawler instructions, business data, and old-page redirects—pass against the candidate site.
- [ ] **Required before launch — Monitoring:** Error monitoring, uptime monitoring, and the person responsible for the first post-launch observation window are recorded.
- [ ] **Required before launch — Rollback:** The last known-good site/version and exact rollback method are recorded and available.

Technical approver initials: __________

## 13. DNS, email, and the go-live change

Going live changes only the guarded web records inside the existing authoritative Cloudflare zone. Incorrect DNS can still interrupt the website, so the plan must prove that every mail and non-web record remains untouched.

- [ ] **Required before launch — Domain access:** The authorized person has access to the active Cloudflare zone and approves the guarded web-record change.
- [ ] **Required before launch — DNS parity:** The plan-only guard proves that every required email-delivery and email-authentication record (including MX, SPF, DKIM, and DMARC), plus mail setup, payment, domain connection, and ownership-verification records, remains unchanged.
- [ ] **Required before launch — Website records:** The apex domain and `www` point to the approved Vercel project, and both custom hostnames are attached to the signed deployment.
- [ ] **Required before launch — Search baseline:** Existing Google Search Console and Bing access/history have been preserved where available. The new sitemap is ready for submission after cutover.
- [ ] **Required before launch — Observation team:** A person is assigned to watch DNS, HTTPS, website behavior, booking, forms, admin access, error logs, and incoming/outgoing email during propagation.
- [ ] **Required before launch — Rollback authority:** The launch owner is authorized to restore the previous Squarespace web records if a critical website or certificate problem cannot be corrected promptly.

Launch owner: __________________________ Observation window: _______________

Rollback DNS plan or reference: __________________________________________

## 14. Open items and accepted exceptions

List every incomplete, disputed, or deferred item. Mark **Blocks launch** as “Yes” or “No.” A “No” means LashPop knowingly accepts launching with that item open; it does not mean the issue is fixed.

| Open item or exception | Plain-English impact | Blocks launch? | Owner | Due date | Client initials |
| --- | --- | --- | --- | --- | --- |
| Approved color contrast exception | Some text or controls may be hard for some visitors to see; the site is not represented as fully WCAG conformant. | No — explicitly accepted above | LashPop | Revisit date: ______ | ______ |
| Microblading photos inside Vagaro | Visitors may not see the expected example photos after entering Vagaro. | ______ | ______ | ______ | ______ |
| Client quiz result examples | Without client-approved examples, technical tests cannot prove that recommendations match LashPop's consultation rules. | ______ | ______ | ______ | ______ |
| Other: __________________________ | __________________________ | ______ | ______ | ______ | ______ |

## 15. Final authorization

Check one decision only.

- [ ] **GO LIVE:** I am authorized to approve this release for LashPop. I reviewed the exact production candidate identified in Section 1, completed every required item or recorded an explicit accepted exception, and authorize Experial to perform the DNS cutover and make this version public. I understand that DNS and certificate changes can take time to propagate and that the documented rollback may be used if a critical problem occurs.
- [ ] **DO NOT LAUNCH:** One or more required items remain unresolved. Do not change public DNS until a new written approval is completed.

### Client approval

- Printed name: __________________________________________________
- Title/authority: _______________________________________________
- Signature: ____________________________________________________
- Date and time: _________________________________________________

### Experial release approval

- Printed name: __________________________________________________
- Signature: ____________________________________________________
- Date and time: _________________________________________________

### Launch record — complete after the change

- Web records changed at: ________________________________________
- New site first verified at apex and `www`: ______________________
- HTTPS verified: ________________________________________________
- Booking and forms verified: ____________________________________
- Incoming and outgoing email verified: __________________________
- Search sitemap submitted: ______________________________________
- Observation owner released the launch at: ______________________
- Rollback used? If yes, when and why: ____________________________

## Reference

- WCAG 2.2, Contrast (Minimum) and Non-text Contrast: <https://www.w3.org/TR/WCAG22/#contrast-minimum> and <https://www.w3.org/TR/WCAG22/#non-text-contrast>
- [Technical launch workflow](../../MAINTENANCE.md)
- [Regression safeguards](./regression-protection.md)
- [Incident record](../ops/security-incident-2026-07-17-public-backup.md)
