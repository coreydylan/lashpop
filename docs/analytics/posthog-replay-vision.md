# PostHog Replay Vision pilot

## Status and authority

The code path in this repository is **off by default**. It must not be enabled in a production deployment until LashPop's owner has approved the tracking purpose and qualified privacy review has covered the policy, consent language, vendor terms, retention, opt-out behavior, and Global Privacy Control (GPC).

Enabling collection does not authorize an agent to merge changes. Replay-driven work remains human-reviewed, and the frozen launch visual contract continues to govern every public change.

## What the integration captures

After a visitor explicitly allows experience analytics, PostHog may reconstruct interactions on the allowlisted public discovery routes:

- `/`
- `/services`
- `/services/<public-service-slug>`

The SDK can observe page structure, taps, clicks, scrolling, navigation, viewport changes, and the existing non-PII conversion events. It is configured with anonymous-only person profiles, no automatic query-string pageviews, masked inputs, URL query/fragment redaction, and no cross-origin iframe capture.

The integration blocks the newsletter form and the Vagaro widget container. Browser security also prevents replay from seeing inside Vagaro's third-party iframe. Booking analysis must use LashPop's existing `booking_started` and `booking_completed` lifecycle events plus activity around the iframe boundary.

All other routes are denied by default, including admin, authentication, confirmation, application, punch-list, and staff-photo surfaces. New routes do not become replayable until the allowlist receives an intentional code review.

## Production activation checklist

1. Create the LashPop PostHog project in the owner-approved US or EU region and complete the vendor/DPA review.
2. Set the shortest approved replay retention in PostHog. Start with 30 days unless privacy review requires less.
3. Enable PostHog AI data processing only after the same review covers Replay Vision.
4. Connect `coreydylan/lashpop` through PostHog's GitHub integration with pull-request creation only. Preserve branch protection and never grant merge bypass.
5. Add these environment values to the intended Vercel preview environment first:

   ```text
   SESSION_REPLAY_ENABLED=true
   POSTHOG_PROJECT_TOKEN=<public PostHog project token>
   POSTHOG_HOST=https://us.i.posthog.com
   ```

6. Deploy the preview and verify all browser checks below. Do not place API keys, personal tokens, or PostHog personal keys in any `NEXT_PUBLIC_*` variable.
7. Obtain written production activation approval, apply the same three values to Production, redeploy, and complete one controlled consent-on and consent-off visit.

Rollback is one switch: set `SESSION_REPLAY_ENABLED=false` and redeploy. Then confirm that the consent surface disappears and the browser makes no PostHog requests.

## Shadow-mode scanners

Run the first 14 days as observation-only. Scanners may create reports, but they must not open implementation PRs during calibration.

### Service discovery dead ends

> On public LashPop discovery pages, identify sessions where a visitor appears to be looking for a service or booking path but repeatedly scrolls, reverses direction, opens and closes the service browser, taps non-interactive content, or leaves without starting a booking. Exclude inactivity, obvious browsing, third-party Vagaro iframe time, and sessions shorter than ten seconds. Return the observed behavior, page and viewport, confidence, cited replay moments, and whether booking_started occurred. Do not infer identity, age, gender, health information, or intent beyond the visible interaction.

### Quiz comprehension

> Identify Lash Quiz sessions with repeated restarts, rapid backtracking, repeated Neither selections, apparent missed controls, or exits before quiz_completed. Separate a legitimate preference for Neither from probable interaction confusion. Cite exact replay moments and include only aggregate-safe result labels already allowed by the analytics contract.

### Mobile interaction friction

> On phone-width sessions, find repeated taps, dead taps, rage clicks, horizontal overflow attempts, scroll trapping, or controls obscured by fixed UI. Ignore ordinary swipe exploration. Return the viewport width, affected public component, repeated-session count, confidence, and cited replay moments.

### Outcome classifier

> Classify each eligible session as service_discovered, quiz_completed, booking_started, booking_completed, informational_browse, apparent_dead_end, or insufficient_evidence. Use only recorded interactions and LashPop's approved non-PII events. Choose insufficient_evidence when the behavior does not support a reliable outcome.

Start scanners at 25% sampling and estimate credit usage before creation. Promote a finding only when it appears in at least three independent sessions or has corroborating funnel/error evidence.

## PR guardrails after calibration

- Agents may open **draft PRs only**. They must never merge or approve their own work.
- Every PR must link the aggregate observation/report, state the number of independent sessions, include exact cited replay moments, distinguish observation from inference, and name the expected metric change.
- One unusual session is not a product requirement.
- Changes to scroll architecture, layout, copy hierarchy, colors, fonts, spacing, radii, or screenshot baselines require owner review and intentional phone/desktop before-and-after evidence.
- Agents must not change `docs/design/brand-contract.json`, `src/styles/brand-contract.css`, or visual baselines as a convenience.
- Every implementation must pass `npm run test:launch`. A replay hypothesis is not acceptance evidence.
- Prefer feature flags or narrowly reversible changes. If success cannot be measured deterministically, create an issue/report instead of code.

## Verification

Run before requesting activation or review:

```bash
npm run test:analytics
npm run check:design
npm run lint
npm run types
npm run build
npm run test:privacy-replay
```

Verify manually in a clean browser profile:

- No PostHog request occurs before permission.
- Declining persists across reloads.
- Privacy Choices reopens the control from the footer.
- GPC prevents an enable action.
- Granting starts collection only on allowlisted routes.
- Query strings and fragments are absent from replay URLs.
- Typed input values, newsletter content, and Vagaro content are not visible.
- Revoking permission stops new capture.
- A recording contains enough public UI context for its cited observation to be reviewed.
