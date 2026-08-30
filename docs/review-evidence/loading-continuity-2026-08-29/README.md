# Loading continuity review — 2026-08-29

## Scope

This evidence covers the public homepage first paint, the team service-tag scroll cue, and the `/work-with-us` Core Values entrance. The candidate changes no brand tokens, copy, public image ownership, SEO metadata, or booking behavior.

## Root cause

The homepage flash was not a meaningful layout shift. Cold 4G/4x-CPU traces measured CLS below `0.001` at 320, 390, and desktop. The visible discontinuity had three concrete causes:

1. The hero `<img>` was paintable before its asynchronous decode completed, so the final raster appeared progressively from the top over the warm placeholder.
2. `MobileHeader` was omitted until the `isMobile` hydration effect, while the document relied on the external stylesheet for its initial ivory background. That created a second visible composition step after the first shell paint.
3. Both mobile and desktop hero images were marked high priority on every viewport. The server emitted two competing hero requests even though CSS hid one layout.

The self-hosted Inter and Playfair resources finished shortly after first content paint and produced only the measured sub-`0.001` CLS. Font swap was therefore secondary, not the flash source.

## First-paint evidence

Cold traces used an empty browser cache, 80 ms latency, 2.5 Mbps downstream, 750 Kbps upstream, and 4x CPU throttling.

| Viewport | Production before | Candidate after | CLS before | CLS after |
| --- | --- | --- | ---: | ---: |
| 320 × 720 | Two hero requests: `w=2700` and `w=900`; progressive image boundary; header added after hydration | One media-selected request: `w=2700`; inline ivory shell; stable tonal placeholder; decoded image receives one 4 px opacity/glide reveal; header is server-rendered | 0.000338 | 0 |
| 390 × 844 | Two hero requests: `w=3840` and `w=1200`; progressive image boundary; header added after hydration | One media-selected request: `w=3840`; inline ivory shell; stable tonal placeholder; decoded image receives one 4 px opacity/glide reveal; header is server-rendered | 0.000202 | 0 |
| 1440 × 900 | Two hero requests: `w=3840` and `w=1440` | One media-selected request: `w=1440`; one opacity/glide reveal after decode | 0.000998 | 0.000998 |

The before trace used the live Vercel production origin and the after trace used the exact production build with browser fixtures, so raw millisecond timings are not treated as a direct benchmark comparison. The deterministic comparison is request count, paint sequence, and layout stability. Direct Cloudflare Images delivery remains unchanged.

- [Before 320 sequence](./before-first-paint-320.png)
- [After 320 sequence](./after-first-paint-320.png)
- [Before 390 sequence](./before-first-paint-390.png)
- [After 390 sequence](./after-first-paint-390.png)
- [Before desktop sequence](./before-first-paint-desktop.png)
- [After desktop sequence](./after-first-paint-desktop.png)

## Team service-tag cue

The prior code treated “two or more tags” as scrollable and assigned the cue during render. Actual layout measurements show why that was wrong:

| Viewport | First rail in display order that actually overflows | Measurement | Cue owner after |
| --- | --- | --- | --- |
| 320 | Emily Rogers | 131 px scroll width / 112 px client width | Emily Rogers |
| 390 | Kelly Katona | Emily is 147 / 147 and does not overflow; Kelly is 186 / 147 | Kelly Katona |
| Desktop | None | Mobile tag rails are not rendered | No cue |

The candidate recomputes after layout, `ResizeObserver` updates, viewport changes, and `document.fonts.ready`, using a 2 px tolerance. The cue has a screen-reader status message, is pointer-inert, and becomes static under reduced motion.

- [320 cue owner](./after-team-hint-320.png)
- [390 cue owner](./after-team-hint-390.png)

## Core Values reveal

Production had ten separate viewport-driven entrances: one for the heading plus one for each of nine cards, with independent observer timing and per-card delays. The candidate has one wrapper reveal using only opacity and a 16 px-to-0 transform. Browser sampling at 320, 390, and 1440 found exactly one active animation during entry, no card-level transform/opacity animation, and no active animation after the 500 ms reveal. Re-entering the viewport does not replay it. Reduced-motion mode reports zero animations and forces the section immediately visible with no transform.

- [Production Core Values](./before-core-values-390.png)
- [Candidate Core Values](./after-core-values-390.png)

## Tradeoffs

- The final hero raster still arrives when the network and decode complete; the candidate does not disguise that latency with a timer or loader.
- On high-DPR portrait phones the existing composition-safe Cloudflare variant can still be large (`w=3840`). The candidate removes the competing desktop request but deliberately does not change the approved crop or image-quality policy.
- The reveal begins immediately after `img.decode()` resolves. It adds no waiting period, uses compositor-safe properties only, and is removed under reduced motion.
