# LashPop Admin plain-language rules

These rules apply to every protected Admin page, including the Owner guide. They keep repeated operator tasks quick to scan and make labels match the action or data shown.

## Write for the task

- Put the task or result first.
- Use short, active sentences and everyday words.
- Use sentence case for headings, buttons and labels.
- Name the actual page, action, count, error or next step.
- Explain limits next to the affected data. Do not make totals sound like customer-by-customer tracking.
- Name outside systems only when the operator must use or verify that system, such as Vagaro.
- Keep implementation details, service credentials and provider error details out of the interface.

The approach follows GOV.UK guidance for [writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces), [clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/) and [services for government users](https://www.gov.uk/service-manual/design/services-for-government-users).

## Preferred terms

| Use | Do not use | Why |
| --- | --- | --- |
| Website analytics | Website performance | The page reports visits and actions, not page speed. |
| Visitors and page views by day | How attention moved, traffic rhythm | Name the chart and measures. |
| Tracked actions or recorded actions | Signals, directional signals | Name what the count contains. |
| Vagaro submissions ÷ tracked booking starts | Signal rate, conversion rate | The totals are not joined by customer or session, and a submission may still need approval. |
| Most-viewed public pages | Pages earning attention | Name the ranking. |
| Media library | DAM | Use the product label shown in navigation. |
| Booking category mapping | Taxonomy | Use the operator's task. |
| Daily review update | Worker tick, cron | Say what updates and when. |
| State the exact warning or task | Needs attention | Tell the operator what to do. |

## Automated checks

`npm run check:admin-copy` reads user-facing text from Admin pages, components and Admin content modules. It fails when vague language, internal product names or implementation terms return.

`npm run test:admin-copy` proves the lexicon rejects the removed phrases and accepts the preferred replacements. Both checks run inside `npm run test:launch`.
