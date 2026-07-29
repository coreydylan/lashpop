# Vagaro Booking Contract

## Source of truth

`services.vagaro_service_id` is the only per-service value the public booking
flow needs. The Vagaro sync maintains that numeric ID from Vagaro's current
service catalog.

The frontend passes the ID into LashPop's inline Vagaro BusinessWidget:

```text
.../Users/BusinessWidget.aspx?enc=<lashpop-widget>&WidgetServiceId=0&ServiceID=<vagaro_service_id>
```

`WidgetServiceId=0` prevents a stale generated widget from retaining an old
category. `ServiceID` selects the exact service.

## Intentional exception

The Injectables / Botox offering books on Naturtox. That routing rule lives in
`src/lib/booking-routes.ts` and is shared by the site and the production audit.
Do not add another missing-ID exception only inside a component.

## Guardrails

Run these before deploying booking changes:

```bash
npm run test:vagaro
npm run lint:vagaro
```

`test:vagaro` also runs automatically before every production build, so a
regression to popup routing, the ignored public `book-now` URL, or a malformed
inline iframe blocks deployment.

The production audit fails on:

- an active non-external service without a numeric Vagaro ID;
- duplicate Vagaro IDs;
- a generated iframe that does not preserve the exact ID;
- a stored BusinessWidget URL that targets a different service;
- an empty or partially unaccounted-for production catalog.

The Vagaro sync also treats a numeric service ID as valid booking configuration,
so newly synced services no longer require a hand-copied widget code. New
services remain inactive until an admin reviews and activates them.

## What not to use

- Do not use `/lashpop32/book-now?ServiceId=...`. Vagaro currently ignores that
  parameter and shows the full service menu.
- Do not reuse another service's `WidgetEmbeddedLoader` code. Generated widgets
  retain the category state that existed when they were created.
- Do not fall back to an all-services widget when a mapping is missing. Fail
  visibly and fix the service ID.
