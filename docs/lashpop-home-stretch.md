# LashPop Website — Home-Stretch Tracker

Updated July 29, 2026.

## Ready in this update

| Area | Update |
| --- | --- |
| Homepage hero | Restored adaptive high-quality image delivery on mobile and desktop instead of forcing quality 70–75. |
| Choose a Service / booking | Restored Vagaro's generated script-loader integration and removed numeric-service/new-window shortcuts. Regenerated all 90 active Vagaro-backed mappings from the current authenticated widget API using exact service + parent-category matching. Missing, swapped, or invalid booking configuration now fails closed. See `docs/VAGARO_BOOKING_CONTRACT.md`. |
| Fine Line Tattoos | Replaced the homepage description with the approved copy and generated a current Fine Line-only inline loader from Vagaro. |
| Volume Fill | Replaced the stale loader with a current Volume Fill-only inline loader generated from the authenticated widget service/category selection. |
| Duplicate service names | Gave Brows vs. Permanent Makeup Microblading/Nanobrows rows and Brows vs. Waxing Brow Shaping rows distinct verified loaders instead of the name-only duplicates created by the old CSV import. |
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

- Run a customer-level spot check of the regenerated service screens on both
  desktop and mobile after deployment. The automated audit now proves the
  selected Vagaro service/category used to generate every loader, while this
  visual check covers Vagaro's rendered booking UI.
- Run the Lash Quiz several times on the deployed build and confirm the visual
  classification of the remaining photos with the LashPop team.

The sync keeps newly discovered services hidden until the widget refresh tool
adds them to the verified manifest. A syntactically valid loader copied onto
the wrong numeric service now fails the sync health check instead of being
accepted.
