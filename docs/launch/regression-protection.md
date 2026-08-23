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

## Working on the baselines

Two traps, both cost real time on 2026-08-23:

- `--update-snapshots` only rewrites a baseline when the diff exceeds
  `maxDiffPixelRatio` (0.003 here). A change you can plainly see - a floating
  header band across a tall section, for instance - can score under it, so the
  run passes, the PNG is never rewritten, and you keep inspecting a stale
  image. If you expect a baseline to change and the bytes do not move, delete
  the file and re-run: a missing snapshot is always written.
- Fixed and sticky elements land wherever the scroll happened to be when the
  shot fired. The team screenshot hides `[data-site-header]` for that reason.
  If a new overlay shows up in a section baseline, it is a flake source, not a
  cosmetic detail.

The team section is a special case: the roster inside the cards is masked, and
who is published is asserted in `tests/browser/roster.spec.ts` against the
seeded fixture instead of being pixel-diffed. Do not "fix" a roster change by
regenerating that baseline; fix the data or the fixture.

Do not regenerate screenshots simply because a test failed. First establish whether the change is intended. An unexplained screenshot difference is a release blocker.

## Enforced repository settings

The `main` branch is protected with these release controls. Treat weakening or removing them as a launch-affecting change:

- Require a pull request for every change to `main`.
- Record written owner approval and reviewed before/after evidence in the pull request for every material visual change; `CODEOWNERS` identifies the responsible owner.
- Require the `quality` and `browser-regression` status checks.
- Require all review conversations to be resolved before merge.
- Block force pushes and branch deletion.
- Restrict direct pushes to `main`, including administrator bypass.
