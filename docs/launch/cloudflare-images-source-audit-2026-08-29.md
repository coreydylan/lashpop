# Cloudflare Images source audit — 2026-08-29

## Scope and ownership

Production D1 references plus raster references in `src/` and `workers/` yield
525 unique candidate sources after the direct-delivery audit added one
previously untracked CSS-mask logo:

| Source class | Count | Ownership | Delivery contract |
| --- | ---: | --- | --- |
| R2 DAM | 408 | First party | Deterministic Cloudflare Images original |
| Site-public raster | 49 | First party | Direct Cloudflare Images delivery |
| Rackspace booking-provider | 68 | External source custody | Ingested to Cloudflare Images; no public provider request |

Of 457 first-party candidates, 456 reachable sources have ready, non-draft
Cloudflare Images originals. All 68 external sources are reachable and their
transition Cloudflare Images objects are ready. No active
production database field uses the historical first-party CDN hostname.

The CSS-mask logo at `site:lashpop-images/lp-logo.png` was uploaded under its
deterministic ID after the scanner was corrected to detect `url(...)` syntax.
That targeted backfill uploaded exactly one object and did not repeat the 455
previously completed first-party uploads.

One historical local-primary team-photo row points to a deleted R2 object. It
is not the effective public portrait: the public portrait resolver selects the
member's live external provider image first. The stale row remains visible in
the conservative inventory and is not manufactured or silently substituted in
Cloudflare Images.

## Oversized source masters

Four R2 source objects exceed the 10 MB hosted-source upload limit. Two already
have prior lossless managed originals. The two commissioned 16-bit sources were
regenerated as full-frame sRGB PNG masters:

| Deterministic ID | Source | Master |
| --- | --- | --- |
| `lp/65812e87532b1be2944eacad12bcc22df48e4a06912601e06dc880bbf0548bb3` | 2048×2015, 16-bit RGB PNG, 17,048,214 bytes | 2048×2015, 8-bit sRGB PNG, 4,323,523 bytes |
| `lp/23ee938fcb1970fc68363207a1ffb1c714963111f6729d499b37f7a3ee72fa6d` | 2048×2015, 16-bit RGB PNG, 17,048,214 bytes | 2048×2015, 8-bit sRGB PNG, 4,323,523 bytes |

Both Cloudflare Images records now report preprocessing
`managed-srgb-png-v1`. No resize, crop, or composition change was applied.

## Width and format surface

The Next.js image configuration emits the canonical responsive widths
64, 128, 256, 320, 384, 600, 900, 1200, 1440, 1800, 2400, 2880, and 3200.
The portrait loader may oversample the full uncropped frame up to 3840; observed
or specifically exercised intermediate widths include 1152, 1440, 1600, and
1728. Runtime verification therefore covers the configured set plus emitted
portrait/manual widths, with special attention to 1152, 1440, and 1728 that
were absent from the retired precomputed-variant list.

Direct Cloudflare Images flexible variants negotiate AVIF, WebP, or JPEG from
the request `Accept` header. The payload and `Content-Type` must agree.

## Acceptance rule

Public delivery passes only when it uses a direct Cloudflare Images URL,
contains no image-Worker, R2, or provider-CDN request, returns a valid negotiated
image, and preserves meaningful visible composition and clarity on
representative phone and desktop surfaces. Pixel-for-pixel decoded equality is
intentionally not used. Existing page visual baselines remain authoritative and
unchanged.
