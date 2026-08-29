# Cloudflare Images canonical-source operations

## Production contract

`lashpop-img` is the sole deployed raster-delivery boundary.

- First-party R2 and site-public raster sources use deterministic `lp/<sha256>`
  originals in Cloudflare Images.
- The Worker reads those originals with the native Images binding, then asks
  Cloudflare for the requested width, crop, quality, and AVIF/WebP/JPEG output.
- A missing or unreadable managed original fails closed. There is no automatic
  source fallback and a public query parameter cannot select a legacy source.
- Externally owned booking-provider images are intentionally separate. Only
  HTTPS `*.rackcdn.com` URLs are accepted, and responses are labeled
  `x-lp-img-backend: external` and `x-lp-img-source: vagaro-rackcdn`.
- External final variants use a one-day cache instead of the immutable
  first-party policy so an upstream photo replacement can become visible.
- Successful final variants are format- and backend-keyed and cached
  immutably. Transform failures and managed-source misses are not cached.
- The private R2 prefixes `backups/` and `.backups/` remain unreachable.

Raw `/lashpop-images/*` raster references in deployed Next.js builds are
rewritten to `/site/lashpop-images/*` on the same Worker. SVGs remain static.
Local development reads working-tree public files directly.

## Source inventory

Audit without changing provider state:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  CLOUDFLARE_ACCOUNT_ID=<account-id> \
  npm run images:audit-sources
```

The audit reports first-party and externally owned sources separately. A
first-party source counts as ready only if its source is reachable and its
deterministic Cloudflare Images original exists and is not a draft.

Dry-run the first-party backfill:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  CLOUDFLARE_ACCOUNT_ID=<account-id> \
  npm run images:backfill
```

Apply idempotently:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  CLOUDFLARE_ACCOUNT_ID=<account-id> \
  npm run images:backfill -- --apply
```

Externally owned booking-provider URLs are excluded from first-party backfill.
Oversized PNG sources are converted to full-frame, non-resized sRGB PNG
masters under the same deterministic ID. The two approved 16-bit sources may
be deliberately regenerated with:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  CLOUDFLARE_ACCOUNT_ID=<account-id> \
  npm run images:backfill -- \
  --apply --replace-managed-masters --concurrency=1
```

That command preserves dimensions and composition. It changes only storage
encoding and color depth needed to fit Cloudflare Images' source-ingest limit.

## Hosted delivery gate

Deploy the isolated preview Worker:

```bash
npx wrangler deploy --env preview
```

Verify dynamic output from the exact preview Worker:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  npm run images:verify-hosted -- \
  --worker=https://lashpop-img-preview.experial.workers.dev \
  --widths=320,600,1152,1440,1600,1728 \
  --formats=avif,webp,jpeg
```

The gate requires every reachable first-party source to report the hosted
backend and Cloudflare Images source, a deterministic original ID, a valid
image payload and dimensions, an accurate content type, and no fallback/error
header. Cloudflare may return WebP or JPEG when an AVIF output is unsupported;
the Worker records requested and actual formats separately.

Meaningful visual parity is reviewed on phone and desktop at the page level.
Decoded-pixel equality is not an acceptance criterion, and visual regression
baselines are never changed to force acceptance.

## Production deployment and rollback

Production deployment requires the exact merged candidate, a green
`npm run test:launch`, green GitHub `quality` and `browser-regression` checks,
and a green Vercel deployment.

```bash
npx wrangler deploy
```

Post-deploy probes must show:

- first-party: `x-lp-img-backend: hosted`,
  `x-lp-img-source: cloudflare-images`, and no fallback header;
- external provider: `x-lp-img-backend: external` and
  `x-lp-img-source: vagaro-rackcdn`;
- correct status, content type, dimensions, focal composition, and responsive
  behavior at observed runtime widths.

Rollback is an explicit version operation, not a hidden per-request path:

1. restore the recorded prior `lashpop-img` Worker version;
2. if the candidate added the raw-public raster rewrite, restore the recorded
   prior Vercel deployment at the same time;
3. re-run first-party/external probes and the smoke checklist.

Public DNS is independent of this image deployment and is not changed by any
command in this runbook.
