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
