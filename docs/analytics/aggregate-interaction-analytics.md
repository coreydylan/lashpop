# Aggregate interaction analytics for UX agents

## Product behavior

This integration runs without a banner or permission box. Once configured, it collects privacy-minimized interaction statistics from every visitor on the allowlisted public pages. It does **not** create session recordings or screenshots and does not give an agent a video-like reconstruction of an individual visitor.

The events are designed to answer aggregate questions:

- Where do visitors tap?
- Which direction and approximate distance do they swipe?
- How far do they scroll?
- Which public section or generic control type receives the interaction?
- Which viewport class is affected?
- Do visitors reach booking, quiz, newsletter, or application milestones?
- Which interaction patterns recur often enough to justify a UX hypothesis?

## Data contract

The client sends one summarized event per completed pointer gesture, not a stream of raw pointer coordinates.

| Event | Statistical fields |
| --- | --- |
| `ux_tap` | page, section, generic target type, pointer type, 10x10 coordinate bucket, duration bucket, viewport bucket |
| `ux_swipe` | page, section, generic target type, direction, short/medium/long distance, duration bucket, coarse endpoint bucket, viewport bucket |
| `ux_scroll_depth` | page, section, newly crossed 25/50/75/90/100 percent milestone, viewport bucket |
| `ux_page_view` | public pathname and viewport bucket |
| `ux_page_exit` | duration bucket and maximum scroll-depth percentage |
| existing conversion events | the existing non-PII booking, quiz, newsletter, and Work With Us contract |

The implementation intentionally does not collect:

- DOM snapshots, screen images, page text, input values, keystrokes, clipboard data, console logs, or network bodies
- raw pointer paths or precise coordinates
- names, email addresses, phone numbers, application answers, quiz answers, booking details, payment data, or tokens
- analytics cookies, analytics local storage, persistent browser IDs, or PostHog person profiles
- activity inside the cross-origin Vagaro iframe
- URL query strings or fragments

PostHog must be configured in **cookieless mode**. The SDK uses `cookieless_mode: "always"`, disables persistence, session recording, autocapture, heatmaps, surveys, experiments, exception capture, feature flags, and person profiles.

## Route boundary

Statistics are collected on:

- `/`
- `/services`
- `/services/<public-service-slug>`
- `/work-with-us`
- `/privacy`
- `/terms`

Admin, login, confirmation/token, punch-list, staff-photo, preview, API, and other internal routes are excluded. A newly added route is not collected until the explicit public-route allowlist is reviewed.

## Enablement

1. Create a LashPop PostHog project in the approved US or EU region.
2. In the project settings, enable cookieless mode. PostHog drops cookieless events when the project setting is not enabled.
3. Review the vendor terms, data region, retention, privacy disclosure, and service-provider configuration before production activation. This is a governance step, not a visitor interruption.
4. Connect PostHog's hosted MCP to Codex and connect `coreydylan/lashpop` to PostHog self-driving with pull-request creation only. Do not grant merge bypass.
5. Add these server environment values to a Vercel preview first:

   ```text
   INTERACTION_ANALYTICS_ENABLED=true
   POSTHOG_PROJECT_TOKEN=<public PostHog project token>
   POSTHOG_HOST=https://us.i.posthog.com
   ```

6. Deploy and verify the browser gate, event schemas, no-storage checks, and excluded routes.
7. Apply the same values to Production and redeploy. This begins aggregate collection for every eligible public visitor without showing analytics UI.

Rollback is one switch: set `INTERACTION_ANALYTICS_ENABLED=false` and redeploy.

## Agent/scout workflow

Start with reports only. A scheduled PostHog Scout or Codex automation should run weekly and query aggregate events for the previous seven days.

Suggested scout instructions:

> Analyze LashPop's aggregate `ux_*` events and approved conversion events for the last seven complete days. Look for repeated friction patterns by page, section, viewport, target type, swipe direction, scroll depth, and funnel outcome. Never infer demographics, identity, health information, or the meaning of one visitor's behavior. Require at least 20 eligible page views and either five repeated interactions or a meaningful conversion-rate difference before surfacing a finding. Include the exact aggregate counts, denominator, affected viewport, confidence, plausible alternative explanations, and the smallest reversible improvement. Create a report only; do not open a pull request during the first four weekly runs.

After four calibrated runs, a second agent may turn a high-confidence report into a draft PR when all of the following are true:

- the finding recurred in at least two weekly windows
- the evidence includes counts and denominators rather than a single-session anecdote
- the proposed change has a measurable expected outcome
- the code change is narrow, reversible, and inside the agent's authority
- the complete LashPop release gate can verify the implementation

## Pull-request rules

- Draft PRs only; agents never approve or merge their own work.
- Every PR links the aggregate report and reproduces the counts, denominator, viewport, affected route/section, and confidence.
- Distinguish observed statistics from the agent's interpretation.
- Scroll architecture, copy hierarchy, and material visual changes remain owner decisions and require intentional phone/desktop evidence.
- Never change the brand contract or visual snapshots as a convenience.
- One anomalous cohort is not a product requirement.
- Run `npm run test:launch` before review.

## Verification

```bash
npm run test:analytics
npm run check:design
npm run lint
npm run types
npm run build
npm run test:interaction-analytics
```

The browser gate verifies SDK initialization, local emission of the aggregate tap/swipe/page statistics, no permission UI, no PostHog cookies or browser-storage keys, no replay endpoint requests, and no initialization on sensitive routes. A controlled visit against the real cookieless-enabled PostHog project must separately prove production ingestion and the final event schemas before the analytics environment switch is considered live.
