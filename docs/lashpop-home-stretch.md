# LashPop Website — Home-Stretch Tracker

Updated July 29, 2026.

## Ready in this update

| Area | Update |
| --- | --- |
| Homepage hero | Restored adaptive high-quality image delivery on mobile and desktop instead of forcing quality 70–75. |
| Choose a Service / booking | Restored Vagaro's generated script-loader integration and removed numeric-service/new-window shortcuts. Missing or invalid booking configuration now fails closed instead of silently opening Classic lashes. See `docs/VAGARO_BOOKING_CONTRACT.md`. |
| Fine Line Tattoos | Replaced the homepage description with the approved copy. Booking remains fail-closed until a fresh service-scoped widget is generated in Vagaro; the archived widget currently falls back to Lash Extensions and must not be restored. |
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

- In Vagaro Settings → Booking Widget, generate and save a new In Website
  widget containing Fine Line Tattoos (`35729654`), then store the complete
  generated `WidgetEmbeddedLoader` URL and version token.
- Verify the newer duplicate Microblading/Nanobrows service rows against the
  actual Vagaro widget contents; matching names or reused loader URLs do not
  prove the numeric service IDs are mapped.
- Run the complete service-card click-through after deployment on both desktop and mobile.
- Run the Lash Quiz several times on the deployed build and confirm the visual classification of the remaining photos with the LashPop team.

`Volume Fill` has a generated Vagaro loader URL, but Vagaro currently renders
the Lash Extensions category before its widget-service filter resolves. It
must be browser-verified end to end before calling the mapping complete. The
sync now keeps newly discovered services hidden and reports active services
unless they have a complete generated loader URL with its version token.
