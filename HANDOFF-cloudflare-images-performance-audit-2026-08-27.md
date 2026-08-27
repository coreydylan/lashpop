# Handoff: Cloudflare Images first-paint and loading-order audit

## Task for the next session

Perform a **read-only, evidence-based performance audit** of the LashPop
Cloudflare Images feature preview. The user’s primary concern is slow first
paint of the hero image. Measure the real page before recommending or editing
anything.

Audit target:

- App preview: `https://lashpop-chsl3ne4h-experial.vercel.app`
- Image Worker: `https://lashpop-img-preview.experial.workers.dev`
- Branch: `feat/cloudflare-images-cutover-preview`
- Head commit: `dff89cc`
- PR: `https://github.com/coreydylan/lashpop/pull/25`
- Worktree: `/Users/coreydylan/Developer/lashpop-cloudflare-images`

The Chrome DevTools MCP is now installed globally:

```text
chrome-devtools -> npx -y chrome-devtools-mcp@latest
```

Start by confirming the new session exposes `navigate_page`,
`performance_start_trace`, `performance_analyze_insight`,
`list_network_requests`, `get_network_request`, and `take_snapshot`. The MCP
configuration is shared at `~/.codex/config.toml`; this session must be
restarted before those tools appear.

## Audit sequence

1. Confirm the exact preview URL returns the real LashPop page, not a Vercel
   authentication interstitial or error page. The preview is protected, so use
   an authorized logged-in Chrome/auto-connect or an approved protection
   bypass if the isolated MCP browser cannot access it. Do not silently
   substitute production.
2. Capture cold-load desktop and mobile traces. Include an appropriately
   throttled mobile run in addition to the local unthrottled baseline.
3. Report LCP, FCP, TTFB, CLS, TBT/INP proxy, and Speed Index where available.
   Identify the actual LCP element.
4. Break hero LCP into document/server time, resource discovery delay, image
   transfer time, decode time, and render delay.
5. Inspect the exact hero request: initiator, start time, priority, requested
   width, encoded bytes, response format, cache headers, repeat-load timing,
   `x-lp-img-backend`, `x-lp-img-id`, and any fallback header.
6. Inventory all image requests by start time and priority. Verify that only
   the critical hero candidate competes before LCP and that below-fold team,
   services, gallery, quiz, and lightbox images are lazy-loaded or
   intent/adjacent-prefetched in a sensible order.
7. Inspect connection setup to the Worker: DNS, TCP/TLS, preconnect use, edge
   location, cache hit/miss behavior, and whether a document-to-image origin
   hop is adding avoidable latency.
8. After tracing, review the code paths listed below and map every proposed fix
   to measured evidence and expected impact.
9. Return the audit and ranked implementation plan only. Do not edit until
   Corey approves the plan.

## Relevant code

- `src/components/landing-v2/GracefulHeroImage.tsx`
- `src/components/landing-v2/slideshow/HeroArchSlideshow.tsx`
- `src/app/LandingPageV2Client.tsx`
- `src/app/layout.tsx`
- `src/lib/cf-image-loader.ts`
- `next.config.js`
- `src/components/find-your-look/quiz-image-preloader.ts`
- `src/components/service-browser/service-image-preloader.ts`
- `src/components/landing-v2/sections/InstagramCarousel.tsx`
- `src/components/work-with-us/TeamCarousel.tsx`
- `workers/lashpop-img/src/index.js`
- `workers/lashpop-img/src/hosted.js`
- `docs/ops/cloudflare-images-cutover.md`

## Current state and constraints

- All repository release checks and PR checks are green.
- The functional preview returns HTTP 200 and its rendered image URLs use the
  preview Worker. A real page image was verified with
  `x-lp-img-backend: hosted` and no fallback.
- Production remains `IMAGE_BACKEND=legacy`; do not cut over or merge PR #25.
- The strict 4,518-comparison parity matrix has complete status, dimension,
  and hosted-coverage parity, but 375 AVIF comparisons are not decoded-pixel
  exact (maximum mean absolute channel error `2.23/255`). This remains a
  separate production blocker.
- The public visual design is frozen. This audit does not authorize visual or
  design-system changes.
- Preserve the original checkout at `/Users/coreydylan/Developer/lashpop`;
  it contains user-owned changes. Work in the feature worktree above.
- Prior image-loading audit results are historical. Reproduce the current
  waterfall and headers before making claims.
- Field MCP currently returns `Auth required`; use this file, PR #25, and the
  cutover runbook as the authoritative handoff if Field is still unavailable.

