# Cloudflare Hosted Images zero-downtime cutover

## Contract

The public image URL contract does not change. `lashpop-img` remains the edge
router and selects the source service:

- `IMAGE_BACKEND=legacy` reads R2, the deployed site's static assets, or the
  allow-listed Rackspace origin.
- `IMAGE_BACKEND=hosted` reads the byte-identical original from Cloudflare
  Hosted Images.
- Both paths use the same Images binding transform, format negotiation,
  quality curve, crop math, and cache policy.
- A hosted lookup failure immediately falls back to the legacy source and is
  returned with `x-lp-img-fallback`. Fallbacks are never pinned in the
  year-long hosted cache namespace.

The backend name is included in every edge cache key. A flag flip cannot serve
a response cached under the other service.

## Feature preview

The isolated preview Worker is:

```text
https://lashpop-img-preview.experial.workers.dev
```

It defaults to `IMAGE_BACKEND=hosted`. A Vercel feature deployment uses:

```text
NEXT_PUBLIC_IMAGE_WORKER_BASE=https://lashpop-img-preview.experial.workers.dev
```

The deployed production Worker stays on its current legacy version until the
approved branch is merged and deployed. The branch sets `IMAGE_BACKEND=hosted`
for that cutover. Public requests cannot opt themselves into the hosted backend;
`IMAGE_BACKEND` is the only production cutover control. A `backend=legacy`
request override remains available for targeted rollback diagnosis.

## Backfill

Dry-run first:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local npm run images:backfill
```

Apply idempotently:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local npm run images:backfill -- --apply
```

Hosted IDs are deterministic SHA-256 paths derived from the canonical source:

- `r2:<object-key>`
- `site:<public-path>`
- `ext:<normalized-url>`

Re-running checks each ID before upload. Oversized or mislabeled sources are
normalized through the existing decoder without changing their deterministic
ID. Reports are written under ignored `.artifacts/cloudflare-images/`.

AVIF output is also pinned at the acceptance widths because Hosted Images
source ingestion can otherwise produce small decoded-pixel differences even
when the same Images binding and transform parameters are used. Two 16-bit PNG
originals cannot fit under Hosted Images' 10 MB upload limit without changing
their decoded pixels, so all of their known production variants are pinned as
well. Exact variants must be generated from the production legacy Worker using
the same public URL and query string guests receive; adding a cache-busting
parameter creates a separate AVIF encode and is not valid parity evidence.
Generate both sets under versioned deterministic IDs:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  npm run images:precompute-exact -- --apply \
  --worker=https://lashpop-img.experial.workers.dev
```

AVIF variants are stored as lossless SVG metadata wrappers because Hosted
Images does not accept AVIF uploads; the Worker unwraps the original bytes
before responding. Any missing precomputed AVIF combination, or any missing
variant for the two oversized sources, falls back to the legacy source instead
of returning a visually different image.

## Exact parity gate

Run against the preview Worker:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  npm run images:verify-parity -- \
  --legacy-worker=https://lashpop-img.experial.workers.dev \
  --worker=https://lashpop-img-preview.experial.workers.dev \
  --widths=320,600,1600 \
  --formats=avif,webp,jpeg \
  --require-exact-pixels
```

The command fails unless every available source:

1. returns the same HTTP status,
2. is actually served from `x-lp-img-backend: hosted`,
3. decodes to the exact same dimensions, and
4. has byte-for-byte identical decoded RGBA pixels.

Known unavailable legacy sources must return the same failure status on both
paths. The public visual snapshots and `npm run test:launch` remain separate,
mandatory page-level gates.

The current combined backfill evidence is 523 available originals, including
the 18 approved quiz comparison crops and four approved result photos. The
production-referenced exact set contains 1,650 variants. The strict parity run
covers all 524 discovered sources at 320, 600, and 1600 pixels in AVIF, WebP,
and JPEG. Two retired/unavailable sources preserve their current production
failure status across all nine width/format combinations.

Current preview evidence is 4,716/4,716 status matches, 4,698/4,698 available
responses served from Hosted Images, 4,716/4,716 dimension matches, and
4,716/4,716 byte-for-byte decoded RGBA pixel matches. Maximum mean absolute
channel error is 0.

The preview and production environments must use the live R2 public base
`https://pub-b6624c485ec245d68de72be196a72d75.r2.dev`. The feature preview also
sets `NEXT_PUBLIC_IMAGE_WORKER_BASE` to the isolated hosted Worker without
trailing whitespace. The application loader trims environment whitespace as a
defense against configuration formatting errors.

## Production cutover

Do not cut over until the pull request's `quality` and `browser-regression`
checks pass and the preview has owner approval.

1. Ensure the production `lashpop-img` Worker has the
   `CLOUDFLARE_IMAGES_API_TOKEN` secret.
2. Confirm the approved branch sets `IMAGE_BACKEND=hosted` in
   `workers/lashpop-img/wrangler.jsonc`.
3. Deploy the Worker. Worker versions activate atomically, so requests remain
   served throughout the change.
4. Verify representative responses report `x-lp-img-backend: hosted` and no
   `x-lp-img-fallback`.

Rollback is the inverse single-flag change: set `IMAGE_BACKEND=legacy` and
deploy. R2 and external source URLs remain untouched throughout the soak.
