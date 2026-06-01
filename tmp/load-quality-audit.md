# LashPop Load-Quality Audit
**Date:** 2026-05-28
**Subject:** https://lashpop.vercel.app
**Method:** Playwright headed Chromium (desktop 1440×900 + iPhone 14 393×852), CDP `Network.emulateNetworkConditions` for Slow-3G playback (80KB/s + 300ms, 30KB/s + 500ms), per-100/200ms frame capture, DOM probing via `getComputedStyle` + `PerformanceObserver`. Screenshots in `tmp/audit-shots/`.

---

## TL;DR

The "weird white box behind 773 Reviews" is the **frosted-glass reviews chip** (`bg-white/60 backdrop-blur-sm`) rendering its `bg-white/60` plate against the ivory hero background *before the hero photo paints*. On a fully-cached load it's a 100-300ms blink. On a cold/slow load it can sit visible for 1-2 seconds. Same pattern affects the **Take Our Lash Quiz** secondary button (`bg-white/50`).

Three load-quality bombs that overshadow the chip flash:

1. **Mobile users see the desktop hero for ~5 seconds on slow networks**, then it snaps to the arched mobile layout — `isMobile` defaults to `false` in `LandingPageV2Client.tsx:316` and `HeroSection.tsx:65`, so SSR ships the desktop hero to every device until JS hydrates.
2. **Hero JPG is served at 3781×2520 native** displayed at 1904×1109, and **`founder-letter-bg.jpg` is 7235×4188** displayed at 1898×1109 — the custom Cloudflare image loader (`src/lib/cf-image-loader.ts`) only rewrites `cdn.lashpopstudios.com` and `*.r2.dev`; everything under `/lashpop-images/*` is served raw and uncompressed.
3. **9 below-the-fold images get `<link rel=preload>` priority** — `founder-letter-bg.jpg` plus 8 service-icon SVGs — because of inappropriate `priority` props in `FounderLetterSection.tsx:29` and `ServicesSection.tsx:260`. They compete with the hero image for HTTP/2 bandwidth on first load.

Plus the standard pop-in for Vagaro team headshots (no CDN, hotlinked from Rackspace), no skeletons during portfolio fetch, and the Instagram lightbox preloader (newly shipped) is firing correctly — confirmed warming the cache.

---

## Section 1 — Hero white-box artifact (the specific one Corey flagged)

### Repro
Open https://lashpop.vercel.app at 1440×900 with a fresh tab. Hard refresh. In the ~200-1000ms window between first-contentful-paint and hero-image-paint, the "773 Reviews" chip is visible as a pale rectangle on the ivory background. Confirmed visually by hiding the hero `<img>` via DevTools (`tmp/audit-shots/desktop-hero-hidden.png`) — produces the exact artifact Corey described.

### Element causing the flash
**The `bg-white/60 backdrop-blur-sm border border-white/80` pill inside the reviews chip button** in `HeroSection.tsx:287`:

```tsx
<div className="relative px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm">
  {/* 773 Reviews content */}
</div>
```

Computed styles confirm: `backgroundColor: rgba(255,255,255,0.6)`, `borderColor: rgba(255,255,255,0.8)`, `backdropFilter: blur(4px)`. The pill is designed to layer *over* a photo — its translucency assumes a darker visual behind it. With no photo, it sits on `bg-ivory` (`#faf6f2`) and renders as a near-white rectangle ~250×44px at viewport coords (284, 411).

The "for the modern woman" pill (`HeroSection.tsx:322`) is also frosted-style but uses a *transparent* fill with a terracotta border, so it survives the photo-loading window cleanly — only the white-fill pills flash.

### Root cause
1. **No `<picture>`-style placeholder/blur on the hero `<Image>`**. The hero `<Image>` in `HeroSection.tsx:238-251` has `priority` and `fetchPriority="high"` but no `placeholder="blur"` or `blurDataURL`. The DOM mounts the chip before the JPG paints.
2. **The hero photo isn't being preloaded efficiently** — see Section 4. Native size is 3781×2520; even on fast networks, that's hundreds of ms to decode.
3. **Frosted glass UI is being used as critical above-fold chrome with no fallback for the no-photo state.** The chip looks great over a photo, but the design owes the user *some* fallback when the photo isn't there yet.

### Recommended fix
**Quick win (`HeroSection.tsx` desktop layout, lines 287-309 and 355-358):**

Add a tinted background that blends into ivory cleanly until the photo paints. Replace `bg-white/60 backdrop-blur-sm border border-white/80` on the chip with a more photo-aware combination, e.g. tint the chip with the same dusty-rose-cream tone that lives in the hero photo background (the photo's actual background color is close to `#d4baa9` / `rgb(212, 186, 169)`).

Either:
- (a) Set a CSS variable `--hero-pre-paint: rgba(204, 148, 127, 0.12)` and use it as the chip's fallback background that *gets covered* by the white once the photo loads (via a sibling `<style>` block that flips on `img.complete`), OR
- (b) Add `placeholder="blur"` with a synthetic 8×8 blurDataURL of the hero photo, so the photo's tone fills the viewport at first paint and the chip's white pill has a colored backdrop from the very first frame.

The simpler version: keep the chip styling, but on the hero `<Image>` add `placeholder="blur" blurDataURL="data:image/jpeg;base64,..."` (Next can generate one at build time — see the `next.config.js` `images` config). That eliminates the flash globally without any chip changes.

**File paths:**
- `src/components/landing-v2/HeroSection.tsx:238-251` (hero Image — add blur placeholder)
- `src/components/landing-v2/HeroSection.tsx:287-309` (desktop reviews chip)
- `src/components/landing-v2/HeroSection.tsx:355-358` (desktop "Take Our Lash Quiz" button — same `bg-white/50` issue)
- `src/components/landing-v2/HeroSection.tsx:168-172` (mobile "Take Our Lash Quiz" — same pattern, less visible on mobile because below the fold)

---

## Section 2 — Other load artifacts found

### A. Mobile-on-desktop-layout flash (largest CLS event on the site)
**Where:** Every page, every mobile viewport, every fresh load.
**Visual:** On a 393×852 viewport, the user sees the *desktop* hero layout (full-bleed photo, desktop reviews chip, desktop buttons) until JS hydrates and the `isMobile` flag flips. At Slow-3G that's ~5 seconds (confirmed via frame capture: `tmp/audit-shots/mobile-slow-01-0993.jpg` through `mobile-slow-18-5013.jpg` show desktop layout; `mobile-slow-19-5248.jpg` is the first frame of the arched mobile hero). On regular 4G it's ~200-500ms.
**Root cause:**
```ts
// LandingPageV2Client.tsx:316
const [isMobile, setIsMobile] = useState(false);  // default: desktop
// HeroSection.tsx:65
const [isMobile, setIsMobile] = useState(false);  // default: desktop
```
The page renders desktop SSR and only swaps to mobile after the first `useEffect` runs (post-hydration). Same pattern in `MobileHeader`, `EnhancedTeamSectionClient`, `ReviewsSection`, and `MobileHeroBackground` (the last is fine because it gates with `md:hidden` CSS, but the *content* sections inside it use the JS-detected `isMobile`).
**Fix:**
- Use a CSS media-query-driven layout for the hero (`hidden md:block` / `block md:hidden`) instead of JS branching. The desktop and mobile heroes are different enough that a CSS-only split is doable.
- Or, render BOTH layouts on the server inside `<div className="md:hidden">` and `<div className="hidden md:block">` wrappers so the correct one paints on first paint regardless of JS.
- Or, use Next.js's `headers().get('user-agent')` in the RSC to detect device class server-side and only ship the correct layout (loses static optimization, but solves CLS).
**File paths:**
- `src/app/LandingPageV2Client.tsx:316-329`
- `src/components/landing-v2/HeroSection.tsx:65-83`
- `src/components/sections/EnhancedTeamSectionClient.tsx:431-440`
- `src/components/landing-v2/sections/ReviewsSection.tsx:104-109`
**Effort:** DW (deep work — touches every section's mobile/desktop branching)

### B. Yelp + Vagaro logos appear ~600-2000ms after Google logo in the hero chip
**Where:** Hero reviews chip, both desktop and mobile.
**Visual:** Frame `desktop-slow30-01-01635.jpg` shows only Google "G"; Yelp and Vagaro materialize ~500ms later (frame 02 at 2114ms). On 30KB/s slow the gap is wider.
**Root cause:** In `ReviewLogos.tsx`, the compact monochrome Yelp and Vagaro logos render as CSS `mask-image: url(/lashpop-images/168812.png)` (Yelp) and `url(/lashpop-images/Vagaro_Logo.png)` (Vagaro). CSS-driven mask images are discovered only after CSSOM parse, with low priority. Google's logo is an inline SVG so it paints immediately.
**Fix:**
- Replace both PNG mask-images with inline SVG paths (same approach as the inline Google SVG in the same file). Removes 2 network round-trips and 2 PNG decodes, makes all 3 chip logos paint together.
**File paths:**
- `src/components/icons/ReviewLogos.tsx:64-94` (YelpLogoCompact)
- `src/components/icons/ReviewLogos.tsx:96-end` (VagaroLogoCompact)
**Effort:** QW (~30 min — convert PNGs to inline SVG)

### C. Founder-letter section gets `<link rel=preload>` priority alongside the hero
**Where:** Below-the-fold founder letter section.
**Visual:** Not directly visible, but consumes HTTP/2 bandwidth that could go to the hero image; widens the white-pill flash window in Section 1.
**Root cause:** `priority` prop on the founder Image in `FounderLetterSection.tsx:29`. Next emits `<link rel=preload imagesrcset="...">` for every `priority` Image; the founder image is below the fold, so this is premature.
**Fix:** Remove `priority` (drops to lazy/eager-on-mount); the section is far enough below the hero that natural in-viewport loading is fine.
**File paths:**
- `src/components/landing-v2/sections/FounderLetterSection.tsx:29`
**Effort:** QW (1-line)

### D. Mobile service-section cards preload all 8 service-icon SVGs at hero priority
**Where:** Below-the-fold mobile services swipe deck.
**Visual:** Not directly visible (the SVGs are tiny). But again — bandwidth contention with hero.
**Root cause:** `ServicesSection.tsx:260` sets `priority` on every service-card icon in the mobile carousel (8 of them). Because the cards are SSR'd, every icon gets a `<link rel=preload>` injected at SSR time.
**Fix:** Drop `priority` and `loading="eager"`. The icons are very small SVGs; standard lazy loading is fine, and dropping priority frees up HTTP/2 priority slots for the hero.
**File paths:**
- `src/components/landing-v2/sections/ServicesSection.tsx:254-261`
**Effort:** QW

### E. Team headshots pop in eagerly with no fade
**Where:** Team grid (`#team` section), desktop and mobile.
**Visual:** On a fresh load, after scrolling to the team grid, each card image pops from gray placeholder (`bg-stone-100`) to full image. No skeleton, no fade.
**Root cause:** `EnhancedTeamSectionClient.tsx:944-951` renders Next `<Image>` with `unoptimized={isVagaroPhoto(member.image)}`. Vagaro photos hotlink directly from `ssl.cf2.rackcdn.com` — no transform pipeline, no `placeholder="blur"` support (Vercel won't generate blur for unoptimized images). All team images are full Vagaro resolution (~640×768) but lazy-loaded.
**Fix:**
- Wrap the `<Image>` in a small `useState`-backed opacity transition (mirror the IG carousel pattern in `InstagramCarousel.tsx:209-216`) — start at `opacity: 0`, transition to 1 on `onLoad`. 200-300ms fade hides the pop.
- Optional: route Vagaro Rackspace URLs through `cdn.lashpopstudios.com/cdn-cgi/image/` like R2 — would require backend rewriting in `cf-image-loader.ts` plus updating `isVagaroPhoto` callers.
**File paths:**
- `src/components/sections/EnhancedTeamSectionClient.tsx:944-951` (desktop card)
- `src/components/sections/EnhancedTeamSectionClient.tsx:807-820` (mobile card)
**Effort:** QW for the fade; DW for the CDN routing

### F. Embla reviews carousel auto-rotate fights with the user during the first 7s
**Where:** Reviews section.
**Visual:** Once the carousel is in view, it auto-advances every 7 seconds (`ReviewsSection.tsx:143-150`). Combined with the auto-CountUp animation that runs on stats chip in-view (`ReviewsSection.tsx:12-28`), there's a lot of motion just on entry.
**Root cause:** No-op pause when the user hasn't interacted yet — auto-rotate starts on mount regardless.
**Fix:** Delay first auto-advance by 8-10 seconds after the section enters view, OR pause auto-rotate until the user has been on the section for 3+ seconds without interaction. (Borderline UX-not-load.)
**Effort:** QW
**Note:** Tagged as low priority — not a load artifact per se, but contributes to the "site feels jumpy" perception.

### G. Reviews-section stats chip stagger animates on every refresh
**Where:** Reviews section, just above the carousel.
**Visual:** Three stats chips fade-up in sequence (80ms stagger via `ReviewsSection.tsx:251-252`). Looks great once. But because the reviews section is a `dynamic(() => import…, { ssr: false })` import in `LandingPageV2Client.tsx:23`, the chips ALSO fade-in fresh on every navigation — there's no SSR copy, so a user scrolling back up after deep-linking always sees the animation.
**Root cause:** `ssr: false` on a section that's used as a deep-link target.
**Fix:** Switch `ReviewsSection` to a server-rendered import (drop `ssr: false`). It's a client component already (`'use client'`), so it'll still hydrate; SSR just gives you HTML on first paint.
**File paths:**
- `src/app/LandingPageV2Client.tsx:23`
**Effort:** QW (1-line) — test that nothing inside breaks (Embla, framer-motion, motion `useInView` — all SSR-safe; should be fine)

### H. IG carousel images pop in without skeleton
**Where:** Gallery (#gallery) section, desktop and mobile.
**Visual:** 60 image cards render with `style={{ opacity: loadedImages.has(item.mediaUrl) ? 1 : 0 }}` (`InstagramCarousel.tsx:209`) — they start fully transparent and fade in on load. The fade is fine, but during the fade the cards are blank rounded rectangles on the cream background. No skeleton shimmer, no placeholder image.
**Fix:** Add a `bg-cream` (or a 1px blur of the actual image as `style.backgroundColor`) to the parent of the image, so blanks look like skeletons not gaps.
**File paths:**
- `src/components/landing-v2/sections/InstagramCarousel.tsx:202-220`
**Effort:** QW

### I. Hero photo decode is on the main thread without a `decoding` hint
**Where:** Hero image.
**Visual:** Subtle hitch on very slow CPUs during hero photo paint.
**Root cause:** The hero `<Image>` doesn't set `decoding="async"`. Next defaults to async for most Images, but a 3781×2520 JPG benefits from explicit `decoding="async"` to prevent main-thread blocking.
**Fix:** Add `decoding="async"` on the hero Image; explicitly off-thread the decode.
**File paths:**
- `src/components/landing-v2/HeroSection.tsx:244`
- `src/components/landing-v2/MobileHeroBackground.tsx:167`
**Effort:** QW
**Note:** Likely already async by default. Low-priority finding.

---

## Section 3 — Portfolio (team detail work photos) lazy loading

### Current behavior (`EnhancedTeamSectionClient.tsx:443-485` + `preloadPhotosForMember` at 554-585)

**Desktop (takeover):**
- On `onMouseEnter` of a team card (`onMouseEnter` at line 924-927), the `preloadPhotosForMember()` function fires.
- It immediately calls `fetch('/api/dam/team/${uuid}/photos')` for that stylist.
- When the API resolves, **every work photo URL is injected into a `<link rel="preload" as="image">` tag in the document head** (lines 574-580) — eager full-quality preload of every photo.
- Results are cached in `preloadedPhotosCache` (React `useRef<Map>`).
- When the user actually clicks the card, the takeover opens with `isLoadingPortfolio: false` immediately (cache hit, line 449-453) — no spinner.
- Takeover renders the `PortfolioBlock` using Next `<Image>` with `loading="lazy"` *but* the photos are already in browser cache from the preload, so they paint instantly.

**Desktop (no hover, click-direct):**
- API fetch starts on takeover open (line 464).
- Spinner shows for ~200ms (`isLoadingPortfolio={true}` state, `PortfolioBlock` renders spinner).
- All photos hit network simultaneously when API returns; all use `loading="lazy"` but they're all in-viewport so browser fetches them all.
- Confirmed: 12 photos arrived in a single batch (network log: `start: 25365` for all 12).

**Mobile (modal):**
- Same `useEffect` (line 443) runs on `selectedMember?.uuid` change. Headshot + work images load.
- Modal shows the hero photo carousel — photos are `<Image priority>` with `unoptimized={isVagaroPhoto(...)}` (line 1290).
- No preload on tap (mobile doesn't have hover) — first photo pop is visible.

### Issues
1. **Eager `<link rel=preload>` of every work photo on hover** is overkill. If a user mouse-passes over 4 cards, that's 30-50 preload tags injected, all fighting for bandwidth.
2. **No skeleton during hover-fetch** — fine for desktop hover-then-click, problematic if user hovers and then clicks fast (~100-200ms latency on the fetch).
3. **The masonry grid in `MemberTakeover.tsx:663-686` requests width=2400 transforms** for ~247px-wide photos. The `Image` `sizes` prop is `'(max-width: 1024px) 50vw, 25vw'` but with `width={p.width || 600}`, Next picks the largest device size (`2400`) for retina compensation. 5-7x overfetch per photo.

### Recommendation: when to fetch, what cache strategy

**Tiered approach:**

| Stage | Action | Why |
|-------|--------|-----|
| **Idle prefetch** (after window.load) | For the first 4-6 visible team cards in the viewport, drip-fetch `/api/dam/team/{uuid}/photos` via `requestIdleCallback`. Cache the JSON in `preloadedPhotosCache`. **Don't** inject `<link rel=preload>` for the photo binaries — just the API metadata. | Predict which cards the user is likely to visit; warm the cache cheaply (JSON is tiny). |
| **Hover (desktop)** | Already-cached: open instantly. Not cached: fire fetch (no preload tags). | Avoid n×30 preload tags. |
| **First open (cold)** | Render `PortfolioBlock` with skeleton boxes sized to `aspect-[4/5]` per image slot. Replace each box on `onLoad`. | Reassuring visual progress. |
| **First lightbox open** | Pre-decode the next/prev photos via `new Image()` (mirror the IG lightbox pattern at `InstagramCarousel.tsx:100-140`). | Lightbox nav feels instant. |
| **CF Image sizing** | Cap requested width at `min(720, naturalWidth)` for masonry thumbs. The lightbox already uses `width=1600`. | 5x bandwidth saving on the grid. |

**File paths to edit:**
- `src/components/sections/EnhancedTeamSectionClient.tsx:443-485` (fetch logic)
- `src/components/sections/EnhancedTeamSectionClient.tsx:554-585` (preload injection)
- `src/components/team/MemberTakeover.tsx:563-689` (PortfolioBlock — add skeleton)
- `src/components/team/MemberTakeover.tsx:672-680` (lightbox sizing)

**Effort:** DW (~2-3 hours)

---

## Section 4 — Image priority audit

| File:Line | Image | Justified? | Rec |
|-----------|-------|-----------|-----|
| `HeroSection.tsx:244` | `/lashpop-images/studio/hero-facetune.jpg` (desktop single-image hero) | **YES** (above-fold LCP) | Keep `priority`. **Add `placeholder="blur" blurDataURL`** to fix Section 1 flash. **Compress source** — currently 3781×2520 raw JPG. Re-export at 1920×1280 q85 (~150KB) or route through CF Image. |
| `MobileHeroBackground.tsx:167` | `/lashpop-images/studio/hero-facetune.jpg` (mobile arch background) | **YES** | Same fixes as above. Also: drop `quality={90}` (Next quality is opaque under custom loader anyway). |
| `HeroArchSlideshow.tsx:299, 348` | Slideshow image (current slide) | **YES** when slideshow is enabled | Keep. Only the current slide gets `priority`; previous slide is unprioritized — correct. |
| `FounderLetterSection.tsx:29` | `/lashpop-images/founder-letter-bg.jpg` (7235×4188 raw JPG) | **NO** (below-fold) | **Drop `priority`.** This is the worst offender — preloads a 7000px JPG that's not LCP. |
| `ServicesSection.tsx:260` | Service-category SVG icons (8 of them in mobile carousel) | **NO** (below-fold, mobile only, tiny icons) | **Drop `priority` and `loading="eager"`.** Native lazy loading is fine. |
| `WelcomeSection.tsx:21, 75` | `/lashpop-images/frontdeskeditwgradientedit2.webp` | N/A — not currently rendered on homepage | Dead code as far as homepage is concerned. No action. |
| `MemberTakeover.tsx:262` | Sidebar headshot in takeover | **YES** when takeover open | Keep. |
| `EnhancedTeamSectionClient.tsx:1044` | Team group photo at bottom of section | Explicitly `priority={false}` | Good. |
| `EnhancedTeamSectionClient.tsx:1290` | Mobile takeover hero photo | **YES** when modal open | Keep. |

### Missing (above-fold critical, currently lazy)
- **Yelp + Vagaro logo PNGs** in `ReviewLogos.tsx:71, 75` (`/lashpop-images/168812.png`, `/lashpop-images/Vagaro_Logo.png`) — these block the reviews chip from completing. **Fix by inlining as SVG** (Section 2.B) rather than adding `priority` — eliminates the network round-trip entirely.

---

## Section 5 — Bundle / load-order tuning

### Currently dynamic — should consider inlining for first paint
None. The current dynamic boundaries (`InstagramCarousel`, `ReviewsSection`, `FAQSection`, `MapSection` in `LandingPageV2Client.tsx:22-25`) are all below-fold sections; dynamic-with-`ssr:false` is mostly correct. **One nit:** `ReviewsSection` with `ssr: false` means hash-deep-links to `#reviews` race against the dynamic-import resolve (see existing `SectionHashDeepLink` retry loop at `LandingPageV2Client.tsx:271-285` — it's a workaround for exactly this). Could ship `ReviewsSection` as SSR'd to drop that race, save the polling.

### Currently eager — could be dynamic
- `EnhancedTeamSectionClient` is statically imported (`LandingPageV2Client.tsx:18`). It's a large client component (~1500 lines, drags in `framer-motion`, `embla-carousel-react`, `embla-carousel-wheel-gestures`, `lucide-react` icons, the `MemberTakeover` portal). Could be `dynamic(() => import(...), { ssr: true })`. The team grid is ~2 viewports down; deferring its JS until after first paint would shrink the main bundle considerably.
- `MemberTakeover` (`team/MemberTakeover.tsx`) is statically pulled in by EnhancedTeamSection; it's only used on click. Should be `dynamic` inside EnhancedTeamSection so the portal code only ships when needed.
- `ServiceBrowserModal` (`LandingPageV2Client.tsx:29-30`) — same pattern, only loaded on click.

### Heavy client components that could be RSC
- `FounderLetterSection` is a `'use client'` component but it has no interactivity beyond rendering text + image. **Should be a server component.** Removes its JS from the bundle entirely.
- `ServicesSection` is `'use client'`. Mostly because of the mobile swipe state. Could split: render the cards as RSC, and only the mobile swiper state as a small client island.

**Effort:** DW for each.

---

## Section 6 — Smooth-transition recommendations

Listed in priority order:

1. **Hero photo blur placeholder** (fixes the 773 Reviews flash + general LCP feel).
   `HeroSection.tsx:238-251`, `MobileHeroBackground.tsx:161-171`.
2. **Team headshot fade-in** instead of snap-paint.
   `EnhancedTeamSectionClient.tsx:807-820, 944-951` — mirror IG carousel pattern.
3. **Portfolio masonry skeleton during fetch.**
   `MemberTakeover.tsx:563-689`.
4. **IG carousel image skeleton background** (cream-tinted placeholder, not transparent).
   `InstagramCarousel.tsx:202-220`.
5. **Mobile-on-desktop layout — CSS-driven not JS-driven** so first paint is correct.
   `LandingPageV2Client.tsx:316-329`, `HeroSection.tsx:65-83`.
6. **Stats chip stagger** in `ReviewsSection.tsx:251-252` should fire on first view only — currently re-fires on every `useInView` re-mount when section is re-hydrated. Sticky `once: true` is set; problem is dynamic import remounts it. Drop `ssr:false` to fix.
7. **Lightbox-shimmer** in `MemberTakeover.tsx:740-744` is already present — great. Just apply the same pattern to masonry photos during initial fetch.

---

## Section 7 — Quick wins vs deeper work (sorted by impact-per-effort)

### Quick Wins (QW) — minutes to ~1 hr each

| # | Finding | File | Impact |
|---|---------|------|--------|
| 1 | Drop `priority` from founder-letter-bg.jpg | `FounderLetterSection.tsx:29` | Frees hero bandwidth, dramatic on slow networks |
| 2 | Drop `priority` + `loading="eager"` from service-icon SVGs | `ServicesSection.tsx:254-261` | Frees 8 preload slots |
| 3 | Inline Yelp + Vagaro PNG → SVG | `ReviewLogos.tsx:71-93, 96+` | Fixes "Google logo paints alone for 500ms" |
| 4 | Add `placeholder="blur"` + `blurDataURL` to hero Image | `HeroSection.tsx:238`, `MobileHeroBackground.tsx:161` | **Fixes the white-pill flash Corey flagged** |
| 5 | Drop `ssr: false` from ReviewsSection (and ideally FAQ + Map too) | `LandingPageV2Client.tsx:23-25` | Stabilizes hash-deep-link, ships HTML on first paint, drops polling code |
| 6 | Wrap team Image with opacity-fade-on-load | `EnhancedTeamSectionClient.tsx:807, 944` | Removes the headshot pop-in |
| 7 | Add `bg-cream` to IG carousel image parent | `InstagramCarousel.tsx:202` | Card slots look like skeletons not holes |
| 8 | Compress `hero-facetune.jpg` (3781×2520 → 1920×1280 q85) | `public/lashpop-images/studio/hero-facetune.jpg` (asset) | ~70% size reduction, faster LCP |
| 9 | Compress `founder-letter-bg.jpg` (7235×4188 → 1920×1280 q85) | `public/lashpop-images/founder-letter-bg.jpg` (asset) | ~90% size reduction |
| 10 | Add masonry skeleton boxes to `PortfolioBlock` (loading state) | `MemberTakeover.tsx:563-689` | Eliminates spinner-then-pop |

### Deeper Work (DW) — hours each

| # | Finding | File | Impact |
|---|---------|------|--------|
| 11 | **Mobile-on-desktop layout flash** — convert isMobile JS branching to CSS media queries | `LandingPageV2Client.tsx`, `HeroSection.tsx`, `EnhancedTeamSection`, `ReviewsSection`, etc. | Biggest single load-quality win on mobile |
| 12 | Extend `cf-image-loader.ts` to rewrite `/lashpop-images/*` paths through CF Image | `src/lib/cf-image-loader.ts` (also need to set up CF Image to source from Vercel) | All local images get auto-resize/format |
| 13 | Extend `cf-image-loader.ts` to rewrite Vagaro Rackspace URLs | `src/lib/cf-image-loader.ts` (CF would need to fetch from Rackspace) | Team headshots get proper sizing |
| 14 | Dynamic-import `EnhancedTeamSectionClient` + `MemberTakeover` + `ServiceBrowserModal` | `LandingPageV2Client.tsx:18, 29` | Significant bundle-size reduction on first paint |
| 15 | Convert `FounderLetterSection` to RSC | `FounderLetterSection.tsx` | Removes its client JS from bundle |
| 16 | Replace eager portfolio-photo `<link rel=preload>` injection with `requestIdleCallback` metadata prefetch | `EnhancedTeamSectionClient.tsx:554-585` | Stops the preload-tag explosion |
| 17 | Cap masonry portfolio image transform width at 720 (currently requests 2400) | `MemberTakeover.tsx:672-680` | 5x bandwidth saving on takeover open |

---

## Appendix — Confirmed working things

- **IG lightbox preloader (newly shipped) is firing correctly.** Network log shows 117 `cdn-cgi/image` prefetch requests starting at t=959ms (after window.load at 748ms), drip-fed at ~17ms intervals via `requestIdleCallback`. Duration=0 for repeat-load = cache hits. The preloader is doing exactly what it's designed to do.
- **Hash-deep-link to `#reviews` works** (eventually) — the `SectionHashDeepLink` polling loop in `LandingPageV2Client.tsx:271-285` handles the dynamic-import race. Recommendation in Section 7 #5 would eliminate the need for the loop.
- **Custom CF Image loader is correctly applied to R2 + cdn.lashpopstudios.com URLs.** The problem is *what's not being routed through it*, not that it's broken.
- **Body scroll-lock on lightbox / takeover** works on desktop and mobile.
- **Embla wheel-gesture pause-on-hover** is honored on the IG and reviews carousels.

---

## Screenshots captured (for reference)

| File | Description |
|------|-------------|
| `tmp/audit-shots/desktop-loaded.png` | Desktop homepage, fully loaded baseline |
| `tmp/audit-shots/desktop-hero-hidden.png` | **The artifact** — hero `<img>` visibility:hidden, shows the white-pill flash exactly as Corey described |
| `tmp/audit-shots/desktop-slow30-*.jpg` | 30-frame capture of desktop fresh load on 30KB/s + 500ms latency |
| `tmp/audit-shots/mobile-slow-*.jpg` | 20-frame capture of mobile fresh load on 60KB/s + 300ms latency — shows desktop-layout-on-mobile for 5+ seconds before snapping to mobile |
| `tmp/audit-shots/mobile-hero-imgs-hidden.png` | Mobile hero with photos hidden — shows the empty arch container and bottom buttons stack |
| `tmp/audit-shots/takeover-emily.png` | Desktop member takeover, Emily Rogers (intro view) |
| `tmp/audit-shots/takeover-portfolio.png` | Desktop member takeover, scrolled to portfolio masonry |
| `tmp/audit-shots/reviews-section.png` | Reviews section in view, stats chips + carousel rendered |
