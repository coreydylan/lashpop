# Visual Regression Protection

The launch appearance is protected by three independent controls:

1. **Canonical contract:** `docs/design/brand-contract.json` owns the approved fonts, palette, spacing, and radii. `src/styles/brand-contract.css` is the runtime token surface.
2. **Static and runtime enforcement:** `npm run check:design` rejects changed token values, missing font wiring, broken Tailwind mappings, and new color literals in public-site surfaces. The browser suite also verifies that those values and fonts resolve in the rendered page.
3. **Rendered enforcement:** Playwright screenshots compare 320px, 390px, and 1440px output to reviewed baselines. Accessibility checks fail serious/critical regressions other than the explicitly accepted `color-contrast` rule.

## Required visual coverage matrix

`tests/browser/visual-coverage.ts` is the single source of truth for the release-blocking matrix. It currently declares 19 named surfaces across three viewports, producing 57 rendered states. Every rendered state must pass three independent checks: approved screenshot, horizontal containment, and critical geometry/image integrity. That makes 171 required checks on every browser-regression run.

The matrix covers:

- Every major homepage section: hero, founder, services, team, reviews, gallery, FAQ, map/find-us, and footer.
- Public routes: services index, Classic service detail, Work With Us, Privacy, and Terms.
- Stateful flows: scrolled navigation, expanded FAQ, service browser, Classic Fill booking handoff, and quiz welcome.

`npm run check:visual-coverage` fails if an exact 320px, 390px, or 1440px project is removed; if a required surface or state disappears; if either the macOS or Linux baseline is missing; or if total coverage falls below 50 rendered states and 150 checks. `npm run test:visual`, `npm run test:launch`, and the required `browser-regression` workflow all enforce this guard.

When a new public route, major page section, fixed/sticky shell, or meaningful interaction is added, add it to this manifest and its Playwright suite in the same pull request. Coverage may grow without changing the minimums; shrinking it is a launch-affecting change and requires explicit owner review.

## Change procedure

A material visual change requires all of the following:

- Written owner approval describing the intended change.
- A pull request with before/after desktop and mobile screenshots.
- An intentional contract version bump when a contract token or approved literal changes.
- Reviewed Playwright snapshot updates.
- Passing launch checks and approval from the code owner.

Do not regenerate screenshots simply because a test failed. First establish whether the change is intended. An unexplained screenshot difference is a release blocker.

## Enforced repository settings

The `main` branch is protected with these release controls. Treat weakening or removing them as a launch-affecting change:

- Require a pull request for every change to `main`.
- Record written owner approval and reviewed before/after evidence in the pull request for every material visual change; `CODEOWNERS` identifies the responsible owner.
- Require the `quality` and `browser-regression` status checks.
- Require all review conversations to be resolved before merge.
- Block force pushes and branch deletion.
- Restrict direct pushes to `main`, including administrator bypass.
