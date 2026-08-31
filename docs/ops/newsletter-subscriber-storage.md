# Newsletter subscriber storage and access

Footer signups are persisted in the Cloudflare D1 `newsletter_subscriptions`
table. The row is a consent ledger: repeat active signups are idempotent, and a
new signup from an unsubscribed address reactivates the existing row instead of
deleting history or creating a duplicate.

LashPop owners and publishers can review the list at:

- Admin: `https://lashpop.vercel.app/admin`
- Navigation: **Inbox → Newsletter subscribers**
- Direct route: `https://lashpop.vercel.app/admin/inbox/newsletter`

The directory supports search, consent status, notes, and active-only copy or
CSV export. Unsubscribed and suppressed records remain in the ledger and are
excluded from marketing exports. Email delivery, bounces, complaints, and
campaign unsubscribes must also stay enforced in LashPop's approved sending
platform.
