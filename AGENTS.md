# LashPop repository instructions

The public website's launch appearance is frozen. The canonical contract is `docs/design/brand-contract.json`; its runtime CSS surface is `src/styles/brand-contract.css`.

## Non-negotiable visual rules

- Do not change colors, font families, typography tokens, spacing tokens, radii, or other material visual-system behavior unless the owner explicitly approves that visual change in writing.
- Do not introduce new color literals. Reuse the canonical CSS variables and Tailwind tokens.
- Do not update visual-regression snapshots as a convenience. Snapshot changes require an intentional before/after review and explicit owner approval.
- Preserve the Inter body font and Playfair Display heading font. They are the only approved production fonts.
- Treat `COLOR_GUIDE.md` and `lashpop-brand-style-guide.md` as historical only; the JSON contract is authoritative.

## Required checks

Before declaring website work complete, run:

1. `npm run check:design`
2. `npm run lint`
3. `npm run types`
4. `npm run test:vagaro`
5. `npm run test:quiz`
6. `npm run test:visual` for public UI changes
7. `npm run test:a11y` for public UI or interaction changes
8. `npm run build`

Color-contrast failures are an explicitly documented launch exception; do not change colors to resolve them. All other accessibility regressions remain defects.

## Vagaro booking diagnosis

Before declaring a booking link broken or regenerating a mapping, read
`docs/VAGARO_BOOKING_CONTRACT.md` and reproduce the customer's exact path on the
actual deployed website. Start at `https://lashpopstudios.com/`, use **Choose a
Service** to open a category, choose the exact service, and inspect the provider's service-selection
screen inside the existing modal on desktop and mobile. An outer `Book <service>`
heading does not prove the embedded provider selected that service.
The header's **Book Now** scrolls to services; it does not itself open the modal.
On mobile, use the current service card or its carousel controls, then the modal's
category tabs. Record the actual clicks rather than assuming the desktop grid exists.

Record the website URL/build identity (or explicitly unknown), worker deployment
version, manifest revision/hash, database service ID/name/category, complete loader
request (including its version token), browser/session, viewport, provider errors,
and screenshots before a broken-link conclusion or configuration write. Strip only
the URL fragment when comparing network requests; the fragment is not sent over HTTP.

Separate these findings: standalone/harness behavior; missing/stale verification
metadata; provider/network/runtime blockage; and a reproduced customer-visible
wrong-service screen. A missing manifest entry or failed standalone test alone
does not prove a customer-visible failure. A generic menu behind a provider error
is inconclusive. Treat contrary user evidence as a reason to stop changes and
reconcile environment/context. Preserve working mappings and legitimate warnings.
Do not regenerate loaders, refresh the full catalog, or request admin sign-in just
to clear a warning without establishing its cause. See the runbook's diagnostic
checklist and `npm run test:vagaro-launcher` / `npm run test:vagaro-live`.

## Change and merge rules

- Do not push directly to `main`. Work on a branch and use a pull request.
- The `quality` and `browser-regression` checks must pass before merge.
- A material visual change must include the owner's written approval and reviewed before/after phone and desktop evidence in the pull request.
- An AI agent must not approve or merge its own material visual change, change the canonical contract, or replace a screenshot baseline without that written approval.
- Run `npm run test:launch` before handing off a launch candidate. It is the complete release gate and includes the design, dependency, lint, type, integration, fixture/privacy, build, screenshot, and accessibility checks.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
