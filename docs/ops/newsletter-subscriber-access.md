# Newsletter subscriber access

The footer form persists lowercased email addresses in the production D1
`newsletter_subscriptions` consent ledger.

## Jake and Emily

1. Sign in to LashPop Admin.
2. Open **Inbox → Newsletter subscribers**, or go directly to
   `/admin/inbox/newsletter`.
3. Search, filter by consent status, copy the active list, or export active
   subscribers as CSV.

Unsubscribed and suppressed records remain in the ledger and are excluded from
the active export.

## Read-only operational query

Use this only through an authenticated D1 console or the existing database
query service:

```sql
SELECT
  email,
  status,
  source,
  subscribed_at,
  unsubscribed_at,
  updated_at
FROM newsletter_subscriptions
ORDER BY subscribed_at DESC;
```

The website ledger records consent. Campaign delivery, bounce, complaint, and
unsubscribe enforcement must also remain active in the approved sending
platform.
