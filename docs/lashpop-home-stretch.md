# LashPop Website — Home-Stretch Tracker

Updated July 28, 2026.

## Ready in this update

| Area | Update |
| --- | --- |
| Homepage hero | Restored adaptive high-quality image delivery on mobile and desktop instead of forcing quality 70–75. |
| Choose a Service / booking | Uses each service's current numeric Vagaro service ID to build an exact inline iframe. Fine Line Tattoos, Microblading, and every other active Vagaro service follow the same path; old widget codes can no longer redirect a moved service to Classic lashes or the full menu. |
| Fine Line Tattoos | Replaced the homepage description with the approved copy. |
| Botox | Opens the Naturtox booking site directly instead of entering the LashPop Vagaro flow. |
| Find Your Stylist | Added “Licensed Tattoo Practitioner” to Evie Ells and Kelly Richter. |
| Reviews | Google, Yelp, and Vagaro summary ratings display with one decimal place (for example, `5.0`). |
| Lash quiz | Questionnaire scoring is applied before comparisons begin; comparisons and image assets no longer repeat; final ties respect the customer’s choices; result imagery matches the bookable service. |
| LashPop Pro Training | Reframed the waitlist as a personalized training inquiry and changed the button to “Inquire About Training.” |

## Already working

- Top navigation
- Welcome to LashPop Studios
- Gallery
- FAQ

## Admin how-to

### Email subscribers

Sign in at [lashpop.vercel.app/admin](https://lashpop.vercel.app/admin), then open:

**Inbox → Newsletter subscribers**

Direct page: [lashpop.vercel.app/admin/inbox/newsletter](https://lashpop.vercel.app/admin/inbox/newsletter)

The directory supports search, status filters, and export.

### Staff profiles

Add each staff member in Vagaro and keep a disabled Vagaro profile containing their public photo and description so the website sync can pull those fields. Website-only credentials can be maintained in:

**Website → Team**

## Remaining verification

- Run the complete service-card click-through after deployment on both desktop and mobile.
- Run the Lash Quiz several times on the deployed build and confirm the visual classification of the remaining photos with the LashPop team.

## Vagaro booking contract

The numeric `services.vagaro_service_id` value synced from Vagaro is the
per-service source of truth. The website builds Vagaro's inline BusinessWidget
URL from that ID and explicitly clears the old widget-category snapshot with
`WidgetServiceId=0`.

Do not use `https://www.vagaro.com/lashpop32/book-now?ServiceId=...`; Vagaro
ignores that query parameter and opens the full menu. Do not copy a generated
widget code from a similarly named service; those widgets retain the category
that existed when Vagaro generated them.

Before a booking release, run:

```bash
npm run test:vagaro
npm run lint:vagaro
```

`lint:vagaro` reads the active production catalog and fails unless every row is
accounted for. Each LashPop Vagaro service must have a unique numeric service
ID. The only current exception is `Botox Treatment`, which intentionally routes
to Naturtox through the shared external-booking rule.

As of July 28, 2026, the production audit covers all 91 active services: 90
exact Vagaro service IDs and one intentional Naturtox route.
