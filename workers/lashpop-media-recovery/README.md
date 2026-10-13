# Temporary public image recovery

This read-only Worker restores already-public LashPop media from the existing
backup account. It accepts only 531 ready IDs in the pinned public registry:
407 R2 originals, 49 site sources, and 75 fixed Vagaro source URLs. The 13
unregistered objects in the backup bucket cannot be requested. It has no
database, storage writes, generic URL proxy, schedules, or credential handling.

The frontend incident switch `NEXT_PUBLIC_IMAGE_RECOVERY_ORIGIN` is an HTTPS
origin. When absent, the current Cloudflare Images behavior is unchanged. When
present, all 51 static manifest images use their existing Vercel files and
registered dynamic IDs use `/image/<id>?w=<width>&q=<quality>` on this Worker.
Server output, `next/image`, backgrounds, and responsive preloaders share the
same resolver. Existing layout/crop/brand styles are unchanged.

## Readiness and activation

- The checked-in config has `workers_dev: false` and `preview_urls: false`.
  Publishing a public endpoint requires a separate explicit activation.
- Verify private R2 plus Images remote bindings before public activation.
  HEIC inputs must decode into browser formats; never return raw HEIC on error.
- After approving the endpoint, build the exact frontend candidate with the
  new public origin, verify desktop/mobile and current image requests, then
  separately approve the Vercel production promotion.
- All source URLs are fixed by the registry. External redirects are rejected.
  Range requests are not forwarded: some Vagaro sources reject Range but
  accept ordinary image GETs.

## Limits and rollback

Only GET/HEAD are accepted. Inputs are bounded at 20 MiB. Output is scale-down,
at most 3840 pixels, with 16 width buckets and three quality buckets. AVIF and
WebP follow Accept; legacy PNG output preserves PNG alpha, otherwise JPEG.
Errors are never cached. Successful cache entries include the registry revision
and negotiated format, with `Vary: Accept` and a one-hour browser lifetime.

Images binding calls consume the account's existing unique-transform allowance;
this change does not create or upgrade any plan. A theoretical full enumeration
is at most 531 × 16 × 3 × 3 = 76,464 variants per registry revision (actual use
is much smaller and repeat variants are cached). This is a bounded parameter
space, not an account spending cap; monitor provider usage after activation.

Rollback: restore the exact prior Vercel deployment, or rebuild the same source
with the recovery origin omitted. Disabling the Worker route alone would break
clients still using it. Keep the read-only endpoint available through client
cache expiry after frontend rollback, then disable its public route. There are
no source database, DNS, bucket-object, or credential changes to reverse.

## Verification

`npm run test:images` includes the recovery guards and resolver tests. Run types,
lint, the launch gate, and desktop/mobile image rendering on the exact candidate.
The October 13 base `e1ae9f5` has a pre-existing dependency-audit failure; do not
claim `test:launch` passes or update dependencies/baselines as part of this fix.
