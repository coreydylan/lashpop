# Admin mobile and visual consolidation — 2026-08-30

## Intent

The admin should read as LashPop's calm studio desk: a focused operator workspace,
not a generic dark dashboard or a second decorative marketing surface. The pass
keeps the public-site palette and editorial type, but removes the competing
"gushy" login treatment and high-contrast utility rail.

## System decisions

- **One quiet frame:** warm canvas, ivory rail, charcoal type, and terracotta only
  for attention and primary state. The desktop rail and mobile drawer now share
  the same system rather than presenting two unrelated products.
- **Mobile navigation is a contained workspace drawer:** it is safe-area aware,
  closes on route change/Escape/scrim, locks the underlying document while open,
  and keeps the active work area plus its tools visible without a horizontal page
  scroll.
- **Operator density changes by viewport:** 320/390px gets full-width controls,
  44px actions, readable stacked summary cards, and subscriber records as
  tappable cards. The established table remains on `sm` and up where comparison
  is actually useful.
- **Forms are phone-safe:** admin text inputs/selects have a 44px floor and 16px
  text on phone widths so iOS does not zoom on focus. Dialogs retain contained
  scrolling and the existing unsaved-change protections.
- **Login is deliberately spare:** one identity mark, one clear task, one input,
  and one primary action. No floating blurred decoration, glass card stack, or
  gradient CTA competes with secure access.

## Validation

- `npm run types`
- `npm run lint`
- `npm run check:design`
- `npm run check:admin-capabilities`
- `npm run check:owner-guide`
- Fixture production build with `PLAYWRIGHT_FIXTURES=1`
- Login visual sweep at 320px, 390px, and 1440px: exact body width at every
  viewport, no page overflow. The only local console messages were expected
  Vercel Analytics/Speed Insights 404s from `next start`; they do not occur on
  Vercel and are unrelated to the admin UI.

Authenticated, data-bearing routes preserve their existing server authorization
boundary. This isolated review did not use an admin cookie, credentials, or
client data; the route and component changes are intentionally independent of
that data boundary.
