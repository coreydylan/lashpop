# PostHog session replay and UX agent pipeline

## Product behavior

Once configured, LashPop records privacy-masked sessions and aggregate interaction statistics for every visitor on allowlisted public pages. There is no permission banner, modal, settings link, or other analytics UI.

PostHog Replay Vision and scheduled Scouts analyze the resulting behavior for repeated confusion, friction, dead ends, rage/dead clicks, scroll problems, quiz abandonment, and booking-path failure. Findings can become evidence-backed reports and, after calibration, draft pull requests.

## Capture contract

The PostHog client enables:

- DOM-based session replay on allowlisted public routes
- automatic interaction capture, heatmaps, and dead-click detection
- one summarized statistical event per completed tap or swipe
- scroll-depth milestones, viewport buckets, page-duration buckets, and existing non-PII conversion events
- anonymous person processing (`person_profiles: "never"`)
- memory-only browser persistence, so no PostHog cookie or local-storage identity survives a page lifecycle

The implementation masks or excludes:

- all input values
- the newsletter form
- the complete cross-origin Vagaro widget container
- URL query strings and fragments in replay/network metadata
- admin, login, confirmation/token, punch-list, staff-photo, preview, API, and other internal routes
- network request bodies and headers, console logs, exception capture, surveys, experiments, and feature flags

PostHog cannot see inside Vagaro's third-party iframe. Booking analysis uses the existing `booking_started` and `booking_completed` events plus the public experience surrounding the iframe.

## Public route allowlist

- `/`
- `/services`
- `/services/<public-service-slug>`
- `/work-with-us`
- `/privacy`
- `/terms`

A newly added route is not recorded until the allowlist receives an intentional code review. Client-side navigation stops replay before an excluded route can paint.

## Enablement

1. Create the LashPop PostHog project in the approved US or EU region.
2. Enable Session Replay and Replay Vision for the project. Do not enable network-body/header or console-log recording.
3. Connect PostHog's hosted MCP to Codex.
4. Connect `coreydylan/lashpop` to PostHog self-driving with pull-request creation only. Preserve branch protection and do not grant merge bypass.
5. Add these server environment values to a Vercel preview first:

   ```text
   INTERACTION_ANALYTICS_ENABLED=true
   POSTHOG_PROJECT_TOKEN=<public PostHog project token>
   POSTHOG_HOST=https://us.i.posthog.com
   ```

6. Deploy the preview and complete controlled phone and desktop sessions on the allowlisted routes.
7. Verify the real PostHog project receives a replay, aggregate gesture events, and the existing funnel events; verify masked inputs and blank Vagaro/newsletter regions in playback.
8. Apply the same values to Production and redeploy. Collection then applies to every eligible public visitor without an analytics prompt.

Rollback is one switch: set `INTERACTION_ANALYTICS_ENABLED=false` and redeploy.

## Replay Vision scanners

Start with a 14-day report-only period. Scanners may create observations and reports but must not open implementation PRs during calibration.

### Service discovery dead ends

> On public LashPop pages, identify sessions where a visitor appears to be looking for a service or booking path but repeatedly scrolls, reverses direction, opens and closes the service browser, taps non-interactive content, or leaves without booking_started. Exclude inactivity, ordinary browsing, third-party Vagaro iframe time, and sessions under ten seconds. Return the observed behavior, page, viewport, confidence, cited replay moments, and whether a conversion event occurred. Do not infer identity, demographics, health information, or intent beyond visible interaction.

### Quiz comprehension

> Identify Lash Quiz sessions with repeated restarts, rapid backtracking, repeated Neither selections, missed controls, or exits before quiz_completed. Separate a legitimate Neither preference from probable interaction confusion. Cite exact replay moments and use only the approved non-PII result labels.

### Mobile interaction friction

> On phone-width sessions, find repeated taps, dead/rage clicks, horizontal overflow attempts, scroll trapping, obscured controls, or gestures that fail to produce the expected response. Ignore ordinary swipe exploration. Return the viewport, public component, repeated-session count, confidence, and cited replay moments.

### Session outcome

> Classify each eligible session as service_discovered, quiz_completed, booking_started, booking_completed, informational_browse, apparent_dead_end, or insufficient_evidence. Use only replayed public interactions and approved non-PII events. Choose insufficient_evidence whenever behavior does not support a reliable outcome.

Start scanners at 25% sampling and estimate credits before creation. Promote a finding only when it appears in at least three independent sessions or has corroborating funnel/error evidence.

## Agent pull-request rules

- Draft PRs only; agents never approve or merge their own work.
- Every PR links the Replay Vision report, cites exact moments, states the number of independent sessions, distinguishes observation from inference, and names the expected metric change.
- One unusual session is not a product requirement.
- Findings should recur across multiple sessions or be corroborated by aggregate/funnel evidence.
- Scroll architecture, copy hierarchy, and material visual changes remain owner decisions and require intentional phone/desktop evidence.
- Never change the brand contract or visual snapshots as a convenience.
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

The browser gate verifies there is no analytics UI, PostHog uses no cookie/local-storage identity, replay capture starts on public pages, the newsletter/Vagaro blocks are present, aggregate tap/swipe statistics emit, and analytics does not initialize on sensitive routes. A controlled visit against the real project must prove final replay ingestion, masking, and Replay Vision availability before production is described as live.
