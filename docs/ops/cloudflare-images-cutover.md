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

Production keeps its current Worker and legacy default until approval. Public
requests cannot opt themselves into the hosted backend; `IMAGE_BACKEND` is the
only production cutover control. A `backend=legacy` request override remains
available for targeted rollback diagnosis.

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
well. Generate both sets under deterministic IDs:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  npm run images:precompute-exact -- --apply
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

The current backfill evidence is 501 available originals plus 1,587 exact
variants. The strict parity run covers all 502 discovered sources at 320, 600,
and 1600 pixels in AVIF, WebP, and JPEG. Record the final comparison count in
the pull request; the single known unavailable source must match across all
nine width/format combinations.

Current preview evidence is 4,518/4,518 status and dimension matches and
4,509/4,509 available responses served from Hosted Images. JPEG and WebP are
decoded-pixel exact. The strict gate remains blocked because 375 AVIF
comparisons differ after independent legacy encoding (maximum mean absolute
channel error 2.23/255). Do not describe that as 100% exact parity and do not
flip production until the AVIF path is made exact or the owner explicitly
approves a different acceptance standard.

## Production cutover

Do not cut over until the pull request's `quality` and `browser-regression`
checks pass and the preview has owner approval.

1. Ensure the production `lashpop-img` Worker has the
   `CLOUDFLARE_IMAGES_API_TOKEN` secret.
2. Change only `IMAGE_BACKEND` in `workers/lashpop-img/wrangler.jsonc` from
   `legacy` to `hosted`.
3. Deploy the Worker. Worker versions activate atomically, so requests remain
   served throughout the change.
4. Verify representative responses report `x-lp-img-backend: hosted` and no
   `x-lp-img-fallback`.

Rollback is the inverse single-flag change: set `IMAGE_BACKEND=legacy` and
deploy. R2 and external source URLs remain untouched throughout the soak.
