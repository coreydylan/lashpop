# Visual Regression Protection

The launch appearance is protected by three independent controls:

1. **Canonical contract:** `docs/design/brand-contract.json` owns the approved fonts, palette, spacing, and radii. `src/styles/brand-contract.css` is the runtime token surface.
2. **Static and runtime enforcement:** `npm run check:design` rejects changed token values, missing font wiring, broken Tailwind mappings, and new color literals in public-site surfaces. The browser suite also verifies that those values and fonts resolve in the rendered page.
3. **Rendered enforcement:** Playwright screenshots compare desktop and mobile output to reviewed baselines. Accessibility checks fail serious/critical regressions other than the explicitly accepted `color-contrast` rule.

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

- Require pull requests and at least one approval.
- Require Code Owner review.
- Require the `quality` and `browser-regression` status checks.
- Dismiss stale approvals when new commits are pushed.
- Block force pushes and branch deletion.
- Restrict direct pushes to `main`, including administrator bypass.
