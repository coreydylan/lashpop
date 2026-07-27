# LashPop Website — Home-Stretch Tracker

Updated July 27, 2026.

## Ready in this update

| Area | Update |
| --- | --- |
| Homepage hero | Restored adaptive high-quality image delivery on mobile and desktop instead of forcing quality 70–75. |
| Choose a Service / booking | Uses each service's exact Vagaro widget URL and token. Legacy duplicate Microblading and Nanobrows records now carry explicit verified booking mappings. A missing booking configuration can no longer silently open Classic lashes. |
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

`Volume Fill` was reconnected to its verified Vagaro widget configuration on July 27, 2026. The Vagaro sync now keeps newly discovered services hidden until booking metadata is configured and reports any active service that lacks a widget URL or service code.
