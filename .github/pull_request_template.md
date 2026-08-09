## What changed

Describe the user-visible and technical change.

## Visual contract

- [ ] No visual-system change.
- [ ] Intentional visual-system change with written owner approval attached.
- [ ] Desktop and mobile before/after screenshots are attached when appearance changed.
- [ ] Snapshot changes were reviewed; they were not regenerated merely to make CI pass.

## Required verification

- [ ] `npm run check:design`
- [ ] `npm run audit`
- [ ] `npm run lint`
- [ ] `npm run types`
- [ ] `npm run test:vagaro`
- [ ] `npm run test:quiz`
- [ ] `npm run test:images`
- [ ] `npm run test:storage`
- [ ] `npm run test:fixtures`
- [ ] `npm run test:staff`
- [ ] `npm run test:visual` when public UI changed
- [ ] `npm run test:a11y` when public UI or interaction changed
- [ ] `npm run build`

## Launch risk and rollback

State the affected user paths and the rollback commit/procedure.
