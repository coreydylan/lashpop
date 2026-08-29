# Direct Cloudflare Images operations

## Production contract

Every public LashPop raster is delivered from `https://imagedelivery.net`.
The public application does not call `lashpop-img`, R2 public URLs, or Vagaro's
Rackspace CDN.

- Site-public and DAM sources retain deterministic `lp/<sha256>` Cloudflare
  Images IDs. A generated manifest maps repository image paths to those IDs.
- Vagaro service and staff sources are fetched only by `workers/vagaro-sync`
  from allow-listed HTTPS `*.rackcdn.com` hosts. The Worker imports the bytes,
  records source identity and refresh metadata in `public_image_sources`, and
  publishes only the direct Cloudflare Images delivery URL.
- A Vagaro entity's changed content gets an immutable
  `lp/vagaro/<entity-hash>/<content-hash>` ID. The prior ID is retained for
  rollback. A failed refresh preserves the last ready direct image; a first
  ingestion failure fails closed.
- The first refresh adopts already-hosted transition images without uploading
  them again. Conditional requests and content hashes make later refreshes
  idempotent.
- The Next.js custom loader changes only the Cloudflare Images flexible variant
  (`w`, `q`, `fit=scale-down`, `metadata=none`). Cloudflare negotiates the
  response format from `Accept`.
- Authenticated admin storage remains separate. R2 is the editable source store,
  but a new raster upload is not committed to public metadata until its
  Cloudflare Images object is ready. Deletion removes both objects.

`workers/lashpop-img` is transition and rollback infrastructure only. Its
currently deployed version must be recorded, but it is not a dependency of the
direct release and is not promoted as part of this runbook.

## Inventory and manifest

Use the Field-managed environment file without printing its values:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  npm run images:audit-sources
```

Backfill is idempotent. Narrow a repair to one canonical source when possible:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  node scripts/cloudflare-images/backfill.mjs \
  --apply --canonical=site:lashpop-images/example.png
```

Then regenerate the committed repository manifest. Generation fails if any
referenced site raster lacks a ready Cloudflare Images object:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  npm run images:generate-manifest
```

The conservative inventory may retain a historical deleted R2 source. Do not
manufacture a replacement. Confirm it is not an effective public image and
record it as an exception.

## Database migration and Vagaro refresh

The database schema must be migrated before either the direct-data migration or
the new Vagaro sync Worker is deployed:

1. create `public_image_sources`;
2. add `services.vagaro_image_source_url`;
3. add `team_members.vagaro_photo_source_url`.

Preview the data migration without writes:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  npm run images:migrate-direct
```

The plan must report zero `missingExternalSources`. After an exact D1 backup and
integrity check, apply only with the explicit confirmation:

```bash
LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  npm run images:migrate-direct -- --apply --confirm=direct-cloudflare-images
```

The migration stores original provider URLs only in source-only fields and the
registry. Public `vagaro_*_url` fields become direct Cloudflare Images URLs.
`CLOUDFLARE_IMAGES_API_TOKEN` is a secret binding on `workers/vagaro-sync`; it
must never be a public Next.js variable or appear in logs.

## Exact-candidate gate

Before merge or deployment:

```bash
npm run test:launch

LASHPOP_ENV_FILE=/absolute/path/to/.env.production.local \
  npm run images:verify-direct -- \
  --widths=64,128,256,320,384,600,900,1152,1200,1440,1600,1728,1800,2400,2880,3200,3840 \
  --formats=avif,webp,jpeg
```

The direct verifier requires a valid image payload, correct negotiated format,
valid dimensions, and an `imagedelivery.net` URL for every ready source. Browser
acceptance at desktop, 390px, and 320px must fully scroll lazy content and show:

- no broken public images or horizontal overflow;
- stable hero, gallery, team, service browser, quiz, booking, map, and forms;
- no public requests to `workers.dev`, `r2.dev`, or `rackcdn.com` for images;
- unchanged approved visual baselines and brand contract.

Decoded-pixel equality is not an acceptance requirement. Composition, clarity,
responsive behavior, and the approved visual contract are.

## Deployment order and rollback

Deploy only the exact reviewed commit after GitHub `quality` and
`browser-regression` and Vercel checks are green:

1. take and verify a D1 backup;
2. apply the D1 schema migration;
3. run the guarded direct-data migration;
4. install the Field-managed Vagaro Images secret and deploy
   `workers/vagaro-sync`;
5. deploy the exact Vercel candidate and promote it to `lashpop.vercel.app`;
6. run the source matrix, browser/network checks, D1 integrity checks, logs,
   booking, SEO/redirect, and rollback probes.

Rollback is explicit and recoverable:

1. restore the recorded prior Vercel deployment;
2. restore the previous public Vagaro URL values from the D1 backup or registry;
3. deploy the recorded prior Vagaro sync Worker version;
4. keep the transition `lashpop-img` Worker available only if that prior app
   deployment requires it;
5. re-run image, booking, privacy, and D1 checks.

No command in this runbook changes public DNS.
