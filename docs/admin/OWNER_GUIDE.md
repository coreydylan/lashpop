# LashPop Admin Owner Guide

This is the canonical, plain-English guide to the LashPop admin panel. Its task list is also the release contract: every task here must keep a working admin route and the expected controls before a release can pass `npm run test:launch`.

Admin: <https://lashpop.vercel.app/admin>

## Before you change anything

- Use **LashPop** fields for website wording, photos, visibility, and presentation.
- Use **Vagaro** for appointment availability, service prices and duration, booking destinations, and synced stylist facts. Return to the admin and run a sync after a Vagaro change.
- A button that says **Publish** or **Save** changes the live website. If you are only looking, do not press it.
- Hidden or inactive records should usually stay in the system for history. Hide, unsubscribe, or suppress them instead of deleting them.
- Colors, fonts, spacing, navigation structure, and legal-page structure are intentionally not owner-editable.
- On Work With Us, benefits, pricing logic, forms, and policy rules remain system-owned. Owners can change the page introduction, the three path summaries, and the photography.

## What this guide replaced

The repository contained several useful but overlapping sources:

- `MAINTENANCE.md` is the current operating manual and ownership map.
- The May 26 admin audit, recovered from Git history at `tmp/admin-audit.md`, is the detailed historical gap analysis that led to the rebuild.
- `ADMIN_PANEL_README.md`, also recovered from Git history, describes an older `/admin/landing-v2` implementation and is not a current route guide.
- `docs/launch-readiness-2026-07-17.md` requires authenticated admin acceptance before launch.
- `src/components/admin-shell/sections.ts` is the current navigation map.

This guide and `docs/admin/capabilities.json` are now the final owner-facing contract.

## Access and orientation

<!-- capability:access-sign-in -->
### How do I sign in with my phone number?

1. Open the admin link.
2. Enter the phone number that has admin access.
3. Choose **Send code**.
4. Enter the verification code from the text message.
5. After verification, the admin opens to **Today**.

To sign out, open the account control in the admin shell and choose **Sign out**. Sign out when using a shared computer.

<!-- capability:today-overview -->
### Where do I see what needs attention today?

Open **Today → Operations overview**. Use the cards to check subscriber count, applications, recent activity, and the latest Vagaro sync. A warning here is a reason to investigate before publishing.

<!-- capability:website-overview -->
### Where do I see which system owns each part of the website?

Open **Website → Website overview**. Every section is labeled with an owner:

- **LashPop** means an owner can publish it here.
- **Vagaro** means change it in Vagaro and sync.
- **Automation** means a scheduled system maintains it.
- **Mixed** means Vagaro supplies facts while LashPop controls presentation.
- **System** means it is informational or protected.

## Website

<!-- capability:service-launch -->
### How do I check that a new or updated service is ready to publish?

1. Open **Website → Launch a service**.
2. Choose the service category and select **Check service**.
3. Work through every incomplete row: Vagaro mapping, booking visibility and order, customer-facing copy, homepage card, individual service details, booking mapping, and eligible stylists.
4. Open both public links at the bottom and verify the service and stylist experience.

This page is a readiness checklist. Make core booking changes in Vagaro and presentation changes in the linked admin pages.

<!-- capability:studio-info -->
### How do I update the studio address, phone number, email, hours, booking link, map location, or social links?

1. Open **Website → Studio information**.
2. Edit only the fields that changed.
3. Double-check phone links, map coordinates, and complete `https://` social or booking URLs.
4. Choose **Save**.
5. Verify the footer, map, contact links, booking links, search data, and legal-page contact information.

<!-- capability:homepage-hero -->
### How do I change the homepage headline or button labels?

Open **Website → Homepage hero**, edit the headline, subheading, or button labels in **Hero content**, then publish.

### How do I choose the homepage hero photos and control the desktop and phone slideshow?

1. In **Homepage hero**, choose the single fallback image or edit a slideshow preset.
2. Add approved images from the media library and set their focal positions.
3. Choose the desktop and mobile assignments. Use the same preset only when the crop works on both screen shapes.
4. Save the preset and assignments.
5. Verify a desktop and phone cold load before considering the change complete.

<!-- capability:services-booking -->
### How do I review synced services, choose service images, organize service groups, and confirm booking readiness?

1. Change price, duration, availability, names, and booking setup in Vagaro.
2. Open **Settings → Vagaro sync** and run a sync.
3. Open **Website → Services & booking**.
4. Review categories, subcategories, images, descriptions, service order, and booking-ready labels.
5. Use a DAM image only for local website presentation. It cannot change media inside Vagaro's hosted booking screens.
6. Never guess or construct a Vagaro booking URL; an unverified new service must remain hidden.

<!-- capability:homepage-service-cards -->
### How do I add, edit, reorder, show, or hide a service card on the homepage?

1. Open **Website → Homepage service cards**.
2. Edit the title, short tagline, description, icon path, or destination slug.
3. Use the arrows to change order and the eye control to show or hide a card.
4. Use **Add card** only when its destination already exists and has been tested.
5. Choose **Save Changes**, then click every changed card on the public homepage.

<!-- capability:team-stylists -->
### How do I update a staff member?

First identify the banner on the person's expanded card:

- For a **Vagaro-synced stylist**, edit their synced photo, bio, services, and booking facts in Vagaro, then choose **Sync from Vagaro** here.
- For an **external-booking stylist**, edit their photo, bio, and service tags in this admin.

### How do I sync a stylist from Vagaro?

Open **Website → Team & stylists** and choose **Sync from Vagaro**. Review every newly discovered person before making them visible.

### How do I show, hide, or reorder staff on the website?

1. Use the eye control on a staff card to change website visibility.
2. Drag cards into the desired website order.
3. Enter a short reason when a publication choice needs context.
4. Choose **Save Changes**.
5. Confirm hidden people are absent from the team section, service choices, and search data.

### How do I update an external stylist's photo, bio, service tags, portfolio, quick facts, or credentials?

Expand the person's card. Use **Select from DAM** for the profile photo, **Add Photos** for the portfolio, the tag controls for services, and the Quick Facts, Credentials, and Bio editors below. Synced fields show a lock and must be changed in Vagaro.

<!-- capability:founder-letter -->
### How do I update the founder letter?

1. Open **Website → Founder letter**.
2. Edit the heading, greeting, body paragraphs, sign-off, or signature.
3. Use the preview to read the full letter in order.
4. Choose **Save** and verify the homepage on desktop and phone.

<!-- capability:founder-letter-redirect -->
### Where does the old founder-letter admin link take me?

The old `/admin/website/founder-letter` link redirects to **Website → Founder letter**. There is only one current editor.

<!-- capability:instagram -->
### How do I control how many Instagram posts appear, whether captions show, and how the carousel moves?

Open **Website → Instagram**, set the number of posts, caption visibility, auto-scroll, and scroll speed, then choose **Save Settings**.

### How do I refresh the Instagram posts already available in the media library?

Choose **Sync Posts** to reload posts tagged `source:instagram` from the media library. This button does not repair or reauthorize the outside Instagram import; integration health remains a system task.

<!-- capability:faq -->
### How do I add or change an FAQ?

1. Open **Website → FAQ**.
2. Expand the correct category.
3. Choose **Add FAQ**, or choose the pencil on an existing question.
4. Enter the customer-facing question and answer. Use the formatting toolbar sparingly.
5. Save and verify the public FAQ plus any footer link that points to the renamed question.

### How do I organize FAQs into categories and choose which ones are visible or featured?

Use **Add category** or edit an existing category. The eye controls show or hide categories and questions. The star controls whether a question appears in **Top FAQs**. Deleting a category also deletes its questions, so hiding is normally safer.

<!-- capability:quiz -->
### How do I add, crop, enable, or remove quiz comparison photos?

Open **Website → Find Your Look**. Add an approved media-library image, assign the correct lash style and comparison use, adjust its crop, and enable it. Verify multiple quiz runs before removing an older approved image.

### How do I choose the photo and wording shown for each quiz result?

Edit each result style in the same page. The admin-selected result image and generated crop are authoritative; same-style comparison and booking images are fallbacks. Keep one approved canonical result photo per style and test Classic, Wet/Angel, Hybrid, and Volume.

<!-- capability:work-with-us -->
### How do I update the Work With Us introduction and its employee, booth, and training summaries?

Open **Website → Work With Us**, edit **Careers page content**, and choose **Publish content**. Benefits, pricing logic, forms, and policy rules are system-owned and require a reviewed code change.

### How do I add, show, hide, or remove Work With Us photos?

Use the carousel manager lower on the page. Add from the media library, toggle visibility, or remove an unused carousel item. Confirm the public page after changing photo order or composition.

<!-- capability:search-sharing -->
### How do I update the words and images people see in Google results and social shares?

1. Open **Website → Search & sharing**.
2. Choose Site, Homepage, Services, or Work With Us.
3. Edit the page title, description, preferred address, search visibility, and share images.
4. Choose **Save**.
5. Verify the page source or a preview tool; search engines and social networks may cache older information.

## Reviews and reputation

<!-- capability:reviews -->
### How do I choose and reorder the reviews shown on the homepage?

Open **Reviews & reputation → Review library**. Add or remove reviews from the homepage set, drag the selected reviews into order, and save.

### How do I correct a review's website visibility, stylist, score, or editor notes without automation overwriting it?

Open the review drawer, make the correction, and choose **Save & lock**. Locked fields preserve the owner's decision against the next automated editor run. Reviewer text and rating remain source-owned.

<!-- capability:review-automation -->
### How do I change the rules that score and rotate reviews?

Open **Reviews & reputation → Automation**. Read the existing thresholds before changing them, save the settings, and monitor the next automated run. This is a high-impact control; small changes can affect many reviews.

## Media

<!-- capability:media-library -->
### How do I upload photos or videos?

1. Open **Media → Asset library**.
2. Choose **Upload files** and select the highest-quality approved originals.
3. Wait for every file to finish before leaving the page.
4. Add useful alt text and tags so the asset can be found and reused.

### How do I search, filter, tag, describe, group, or assign media for reuse around the website?

Use search and filters to find assets. Select an item to edit its descriptive text, tags, collections, service assignment, or team assignment. Upload once and reuse the same approved asset rather than creating duplicates.

<!-- capability:team-photography -->
### How do I upload, crop, choose the primary photo, or manage the photo album for a team member?

Open **Media → Team photography**, choose the person, then upload or open a photo. Set the primary portrait only after checking its crop. Use the crop editor for the required shapes and keep approved portfolio images in the person's album.

## Inbox

<!-- capability:inbox-overview -->
### Where do I see new newsletter signups and Work With Us applications?

Open **Inbox → Inbox overview**. Newsletter consent records and applications are deliberately kept separate.

<!-- capability:newsletter -->
### How do I find a newsletter subscriber and understand their consent status?

Open **Inbox → Newsletter subscribers**. Search by email or notes, then filter by status or signup source. **Active** may be exported; **Unsubscribed** and **Suppressed** must not be included in a send list.

### How do I copy or export only active subscribers?

Choose **Copy active** or **Export active CSV**. These actions intentionally include active subscribers only.

### How do I mark a subscriber active, unsubscribed, or suppressed without erasing history?

Open the subscriber's details, choose the correct status, add a useful note when needed, and save. Never reactivate someone who opted out without fresh consent.

<!-- capability:applications -->
### How do I read the details and contact information from a Work With Us application?

Open **Inbox → Applications**. Each card shows the applicant's path, date, contact information, experience, specialties, desired start details, and message. Contacting the applicant happens outside this admin.

## Settings, access, and recovery

<!-- capability:settings-overview -->
### Where do I check my access level and the latest Vagaro sync?

Open **Settings → Settings overview**. Confirm your role and the latest sync state before troubleshooting an editor that appears read-only or stale.

<!-- capability:admin-access -->
### How do I give someone owner, publisher, viewer, or no admin access?

1. The person must sign in once before appearing in **Settings → Admin access**.
2. Choose the smallest role they need: Viewer, Publisher, Owner, or No admin access.
3. Owners control roles and infrastructure; publishers edit content; viewers verify without publishing.
4. Never demote the only owner account.

<!-- capability:vagaro-sync -->
### How do I see whether Vagaro data and booking mappings are healthy?

Open **Settings → Vagaro sync**. Review booking categories, services, verified booking mappings, team members, and stylist mappings. A new service with no verified booking mapping must remain hidden.

### How do I run a Vagaro sync now?

Choose **Sync from Vagaro now**, wait for completion, and review the new run. Then verify the affected services and staff on the public website.

<!-- capability:activity-history -->
### How do I see who changed something in the admin panel?

Open **Settings → Activity history**. Filter or scan the feed for the section, action, person, and time. Use this before assuming an automated system overwrote a change.

<!-- capability:website-history -->
### How do I find an older saved website version and restore it without erasing history?

1. Open **Settings → Website versions**.
2. Filter to the affected section and compare version number, publisher, and time.
3. Choose **Restore** on the correct valid version.
4. Read the confirmation, then confirm only when you intend to publish it.
5. A restore creates a new current version; it does not erase the versions between.

## Release acceptance

The machine-readable contract lives in `docs/admin/capabilities.json`. Run:

```bash
npm run check:admin-capabilities
```

The check proves that every current admin navigation route is represented here and that the expected source files and key controls still exist. The live walkthrough record adds the browser evidence that code inspection alone cannot provide.
