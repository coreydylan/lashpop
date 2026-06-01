export const meta = {
  name: 'lashpop-updates-triage',
  description: 'Parallel-scout the LashPop website-updates doc into a decision-ready punch list at tmp/lashpop-updates.md',
  whenToUse: 'When Corey hands over the full LashPop updates list and wants triage + classification + a per-item plan before any code changes.',
  phases: [
    { title: 'Scout', detail: 'Parallel scouts per section + cross-cutting themes' },
    { title: 'Synthesize', detail: 'Merge findings into a classified punch list' },
    { title: 'Report', detail: 'Write tmp/lashpop-updates.md' },
  ],
}

const FINDING_SCHEMA = {
  type: 'object',
  required: ['section', 'summary', 'issues'],
  properties: {
    section: { type: 'string' },
    summary: { type: 'string', description: 'One-paragraph overview of what this section covers and the overall state' },
    primaryFiles: {
      type: 'array',
      items: { type: 'string' },
      description: 'Most important files for this section (absolute or repo-relative paths)',
    },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'type', 'proposedFix', 'risk', 'effort'],
        properties: {
          title: { type: 'string', description: 'Short label, e.g. "Remove brown heart icon"' },
          quote: { type: 'string', description: 'Verbatim snippet from the source doc this maps to' },
          type: {
            type: 'string',
            enum: ['copy', 'bug', 'feature', 'asset', 'decision', 'cross-cutting'],
          },
          rootCause: { type: 'string', description: 'Why this happens, with file:line refs when known' },
          proposedFix: { type: 'string', description: 'Concrete approach, with file paths' },
          risk: { type: 'string', enum: ['low', 'med', 'high'] },
          effort: { type: 'string', enum: ['xs', 's', 'm', 'l'] },
          files: { type: 'array', items: { type: 'string' } },
          needsInput: {
            type: 'string',
            description: 'If Corey decision/asset is required, what exactly do we need from him',
          },
          decisionOptions: {
            type: 'array',
            items: { type: 'string' },
            description: 'If type=decision, 2-4 viable options to present',
          },
          blockedBy: { type: 'string', description: 'Other issue this depends on, if any' },
        },
      },
    },
  },
}

const REPO = '/Users/coreydylan/Developer/lashpop'

function scoutPrompt(label, body) {
  return `You are a triage scout for the LashPop website. Repo: ${REPO} (Next.js + Tailwind, deployed on Vercel, image CDN through Cloudflare).

Your job is RESEARCH ONLY — do not edit files. Read code, locate the relevant components, and produce structured findings. Use grep/find liberally. Keep your investigation tight: enough to propose a credible fix approach with file paths, not a full implementation.

For each issue below, return a structured finding with:
- title: short label
- quote: the verbatim snippet from the source doc
- type: copy | bug | feature | asset | decision | cross-cutting
- rootCause: with file:line refs where possible
- proposedFix: concrete, with paths
- risk: low | med | high
- effort: xs (1-line) | s (~15 min) | m (~1 hr) | l (multi-step)
- files: paths touched
- needsInput: if Corey must decide/provide something, name it
- decisionOptions: if type=decision, list 2-4 viable options
- blockedBy: name another issue if dependent

ITEMS TO SCOUT (${label}):
${body}

When done, return ONLY the structured finding via the StructuredOutput tool. No prose.`
}

const SECTIONS = [
  {
    key: 'home',
    label: 'Home page refresh glitches',
    body: `- (Mobile) refreshing the page glitches
- (Desktop) refreshing the page glitches and then kicks you down to the gallery section

Look at: app/page.tsx, scroll restoration behavior, hash-routing on mount, IntersectionObserver setup, anchor scroll-into-view on hydration. Recent commit "fix(nav): hash deep-link from other pages targets correct scroll container" (232cebb) is relevant context.`,
  },
  {
    key: 'welcome',
    label: 'Welcome section',
    body: `- (Mobile) Scrolling gets stuck while scrolling down through this section
- Remove the brown heart icon
- Replace en/em dashes with colons inside the letter copy
- Replace the full letter body with this exact text:
  "I'm so glad you're here.
  When I launched LashPop back in 2016, I wanted something simple: a place where women could feel genuinely cared for and walk out looking refreshed without the long routine. That idea grew into the beauty collective we have today: artists who specialize in lashes, brows, skincare, botox, waxing, permanent jewelry, and more, all with one goal in mind.
  We're united by the same mission: helping you feel effortlessly beautiful and confident, with a few less things to stress about during your busy week. If we can give you that "just woke up from eight blissful hours" look with almost no effort, even if you're running on five, we'll call that a win.
  We can't wait to see you soon!"

Locate the Welcome component and the heart icon. Identify what causes the mobile scroll-stick (likely scroll-snap, sticky positioning, or a tall sticky element).`,
  },
  {
    key: 'booking',
    label: 'Booking process',
    body: `- Add "Bundles" as a service category on step 2, positioned right after "Botox". Source: bundles category exists on Vagaro today.
- Vagaro is not syncing to the website for auto updates — photos missing, descriptions unclear. Diagnose where the sync runs.
- (Mobile + desktop) During booking flow, accidental scroll-refresh kicks user back to the homepage — even after logging into Vagaro and being at final checkout.
- On the post-checkout review page, rename "Book another" → "Book another service".
- Post-checkout page also auto-kicks users back to the OLD lashpop site before they can click Done.
- After choosing a service, current flow shows: cards w/ photos → click card → shows price/time/description → Book Now → Vagaro shows same price/time/description. DELETE the middle step (the price/time/description card) so Book Now goes straight from the cards to Vagaro.
- At checkout users can't add a second service — only re-pick the same one.

Repo notes: there is a booking flow in app/ and a quiz-related vagaro sync was added recently (commit 38f6c43 "feat(quiz): pull result-screen services live from Vagaro"). Look for the booking flow components and any Vagaro client/sync code (likely workers/ or app/api/).`,
  },
  {
    key: 'stylist',
    label: 'Find Your Stylist section',
    body: `- (Mobile + Desktop) Dots at top of section stay pinned during scroll and overlap content — remove or hide on scroll.
- (Desktop only) Inside a stylist's About card, the close affordance reads "X ESC". Drop "ESC", leave a sleek "X" matching mobile.
- Photo issues: some show "missing photo" icon, mobile photos are blurry/zoomed, desktop has some sideways photos. Need a photo pass.
- (Mobile only) When swiping through a stylist's photos it advances to the NEXT stylist. Want swipe-on-photos isolated from card-level horizontal swipe.
- Tori: needs photo, fun facts, work photos, services (Lashes, Brows), and IG updated to @torilburnett.
- Staff who aren't on Vagaro should still get a fake/disabled profile so the page can sync.
- Grace: needs her own "Book Now" button inside her card linking to her external site (same link pattern as the Botox service).
- Emily: add credential "Lashpop Pro Creator" on her card.

Locate the stylist data source (likely a JSON/MDX/CMS), the stylist card component, the swipe/carousel, and the "X ESC" affordance.`,
  },
  {
    key: 'reviews',
    label: 'Reviews section',
    body: `- Bot dedup: "Renna M" and "Renna Ming" are the same person, posted identical reviews on Google + Yelp, appearing back-to-back. Want dedup across platforms.
- (Desktop) Scrolling through reviews glitches and redirects.

Likely files: workers/reviews/ (reviews worker — replaces old BrightData/Jina cron), the reviews carousel component, and the review-editor Durable Object if it exists. Memory note: workers/reviews/ is the active path.`,
  },
  {
    key: 'faq-footer',
    label: 'FAQ + Footer',
    body: `FAQ:
- Remove "Permanent Jewelry" from the top FAQs.

Footer:
- Spacing looks off — big uneven gaps between services. Diagnose what regressed (recent commit 5efcf25 "fix(footer): tighten Services stack + opt policy links out of 44px floor" is the most recent footer change).
- Hours: change "8A - 7:30P" to "8:00AM - 7:30PM" everywhere it appears (footer + map/directions card).`,
  },
  {
    key: 'quiz',
    label: 'Take Our Lash Quiz',
    body: `- Final results page photos aren't syncing from Vagaro.
- Final results page should display "Starting at $X" and "(hours/min)" time per service.
- Quiz result accuracy needs a once-over.
- Copy change on the quiz: "New to lashes? Pick a Full Set. Already have lashes within ~3 weeks? Choose a Fill." → "New to lashes? Choose a "full set". Already have lashes that were done 2-3 weeks ago? Choose a "fill"."

Relevant: commit 38f6c43 "feat(quiz): pull result-screen services live from Vagaro" + commit 3b80f08 "fix(quiz): escape apostrophe in result-screen empty state". Look at the quiz components and the result-screen.`,
  },
  {
    key: 'work-with-us',
    label: 'Work With Us page',
    body: `- (Desktop only) photos in the gallery get stuck — can't scroll left or right.
- (Mobile + Desktop) slow to load after clicking a photo to view it.

Locate the Work With Us page and its gallery/lightbox component. Note the image CDN setup: custom next/image loader rewrites R2 URLs to cdn.lashpopstudios.com/cdn-cgi/image/... — do NOT add /_next/image back.`,
  },
  {
    key: 'spacing-anchors',
    label: 'Spacing + nav anchor positions (cross-cutting)',
    body: `Top-nav anchors land in wrong positions across breakpoints:
- (Desktop) FAQ lands slightly too high.
- (Mobile) Reviews lands too low, should show the "What people are saying" title.
- (Mobile + Desktop) Gallery lands too low — visible pink strip from prior section at the bottom.
- (Mobile) On "Work With Us" page, top-nav doesn't take you to the right place.
- (Desktop) On "Work With Us" page, nav landing is off for some sections.

This is a single architectural concern: scroll-margin / anchor offset / sticky-nav-height math. Recent commit 232cebb "fix(nav): hash deep-link from other pages targets correct scroll container" addressed cross-page deep links but per-section offsets remain off. Find the anchor target spans and the scroll-margin-top values.`,
  },
  {
    key: 'vagaro-sync',
    label: 'Vagaro sync architecture (cross-cutting)',
    body: `Multiple downstream symptoms suggest one architectural issue:
- Booking step 2 doesn't show Bundles category (exists on Vagaro)
- Service descriptions and photos missing/stale
- Quiz result-screen photos not syncing
- Stylist photos/services not in sync

Find: where the Vagaro sync runs (worker? cron? on-demand fetch?), what it pulls, what it caches, and what's broken. Commit 38f6c43 added live Vagaro pulls for the quiz result-screen — figure out if that pattern should extend to booking and stylist views, or if there's an existing sync that's broken.`,
  },
]

phase('Scout')

const findings = await parallel(
  SECTIONS.map((s) => () =>
    agent(scoutPrompt(s.label, s.body), {
      label: `scout:${s.key}`,
      phase: 'Scout',
      schema: FINDING_SCHEMA,
    })
  )
)

const validFindings = findings.filter(Boolean)
log(`Scouts complete: ${validFindings.length}/${SECTIONS.length} returned findings`)

phase('Synthesize')

const SYNTHESIS_SCHEMA = {
  type: 'object',
  required: ['markdown'],
  properties: {
    markdown: {
      type: 'string',
      description: 'Full punch list markdown — the file body that will be written to tmp/lashpop-updates.md',
    },
    decisionCount: { type: 'number', description: 'How many items need Corey input' },
    justDoCount: { type: 'number', description: 'How many items are safe to batch-execute' },
    threadCount: { type: 'number', description: 'How many bigger threads (cross-cutting / high-risk)' },
  },
}

const synthesisPrompt = `You are synthesizing scout findings into a decision-ready punch list for Corey to walk through interactively.

Findings (JSON):
${JSON.stringify(validFindings, null, 2)}

Produce a single markdown document with this structure:

# LashPop Website Updates — Punch List
_Generated by lashpop-updates-triage workflow. Walk top-to-bottom; tick items as we complete them._

## How to use this doc
- **Just do it** items will be batch-executed; I'll surface a checkpoint before pushing.
- **Needs your input** items have a question + options. Answer them as a batch.
- **Bigger threads** are higher-risk; each gets a proposed approach to approve before I touch it.

## Summary
- Just-do-it items: N
- Needs-your-input items: N
- Bigger threads: N
- Total scout sections: ${validFindings.length}

## 1. Just do it (copy + low-risk bug fixes)
For each item:
\`\`\`
- [ ] **<title>** — <one-line description>
      Files: \`<path>\`
      Fix: <one-line approach>
      Risk: low | Effort: xs/s
\`\`\`
Group by section in subheadings.

## 2. Needs your input
For each item: title, what we need, 2-4 options if applicable, recommendation marked **(rec)**.

## 3. Bigger threads
For each cross-cutting / high-risk thread: title, scope (which symptoms it explains), proposed approach, risk, files in scope.

## 4. Appendix: per-section scout summaries
One short paragraph per scout, with primary files listed.

Rules:
- Use the exact item titles and quotes from the scouts.
- Preserve verbatim copy changes (the welcome letter, the quiz copy line, hours format) — do not paraphrase.
- Mark dependencies with "blocked by <other item>".
- Walk order is category-first (copy → bugs → features → spacing), so put copy/easy bug-fixes first within "Just do it".

Return only the markdown via the StructuredOutput tool.`

const synthesis = await agent(synthesisPrompt, {
  label: 'synthesize',
  phase: 'Synthesize',
  schema: SYNTHESIS_SCHEMA,
})

phase('Report')

const reportWriterPrompt = `Write the following markdown to ${REPO}/tmp/lashpop-updates.md using the Write tool. After writing, return a one-line confirmation with the file path.

MARKDOWN TO WRITE:
${synthesis.markdown}`

await agent(reportWriterPrompt, {
  label: 'write-report',
  phase: 'Report',
})

log(`Report written to tmp/lashpop-updates.md — ${synthesis.justDoCount} just-do, ${synthesis.decisionCount} needs-input, ${synthesis.threadCount} threads`)

return {
  reportPath: `${REPO}/tmp/lashpop-updates.md`,
  justDoCount: synthesis.justDoCount,
  decisionCount: synthesis.decisionCount,
  threadCount: synthesis.threadCount,
  sections: validFindings.length,
}
