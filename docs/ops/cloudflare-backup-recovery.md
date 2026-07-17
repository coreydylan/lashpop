# Cloudflare D1 backup and recovery

## Architecture

- Source: D1 database `lashpop-production`.
- Destination: private R2 bucket `lashpop-d1-backups` (no `r2.dev` or custom public domain).
- Schedule: `0 9 * * *` (daily at 09:00 UTC).
- Retention: 35 days, enforced after each successful backup.
- Format: `lashpop-d1-ndjson-v1`; every part has byte count, row count, and SHA-256.
- Defense in depth: D1 Time Travel remains available independently of R2 backups.

The Worker records every attempt under `backups/lashpop-d1/health/attempts/` and updates
`latest-attempt.json` and `latest-success.json`. `/health` returns HTTP 503 if the last
successful backup is older than 30 hours or a newer attempt failed.

Every R2 write uses bounded retry delays (250 ms, 1 second, and 3 seconds). The scheduled
promise remains rejected after the final failure so Cloudflare observability also marks the
invocation as failed; the durable attempt record contains the same outcome.

## Daily health check

```bash
curl --fail --show-error https://lashpop-d1-backup.experial.workers.dev/health
```

Also confirm the cron remains attached:

```bash
curl --fail --silent \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/lashpop-d1-backup/schedules" \
  | jq '.result.schedules'
```

## Download and verify the latest backup

Use a new disposable directory; the tool refuses to overwrite an existing download.

```bash
node scripts/cloudflare/d1-backup-tool.mjs download \
  --bucket lashpop-d1-backups \
  --manifest-key backups/lashpop-d1/latest.json \
  --dir /tmp/lashpop-d1-latest

node scripts/cloudflare/d1-backup-tool.mjs verify \
  --dir /tmp/lashpop-d1-latest
```

## Non-destructive restore drill

This command restores only to a local SQLite file, runs `PRAGMA quick_check`, and compares
every restored table count to the manifest. It cannot address a remote D1 database.

The restore path deliberately deletes all rows from `session` and `punchlist_sessions`
after loading the archive. This is the default, non-optional behavior: a historical backup
must never reactivate a web or punchlist authentication token that has since been revoked.
The drill's JSON result lists both tables under `scrubbedTables` and expects their restored
row counts to be zero even when the source manifest contained sessions.

```bash
node scripts/cloudflare/d1-backup-tool.mjs drill \
  --dir /tmp/lashpop-d1-latest \
  --database /tmp/lashpop-d1-restore.sqlite \
  --replace
```

Keep the JSON output with the launch record. A production restore is a separate incident
operation: stop writes, take a fresh pre-restore backup, select either D1 Time Travel or a
verified R2 backup, restore into a new/scratch database first, compare critical counts, and
only then plan a binding cutover. Never point this drill command at production.

## D1 Time Travel check

```bash
workers/d1-backup/node_modules/.bin/wrangler d1 time-travel info lashpop-production --json
workers/d1-backup/node_modules/.bin/wrangler d1 time-travel info lashpop-production \
  --timestamp=2026-07-16T09:00:00Z --json
```

The commands are read-only. A bookmark returned for both a historical timestamp and the
current database confirms Time Travel is available. Never run `time-travel restore` during
a drill.

## Incident note: public-bucket isolation

On 2026-07-17, backups were found under the public `lashpop-dam` bucket. The Worker was
moved to the dedicated private bucket. The missed 09:00 UTC run was also traced in Workers
Observability to a transient R2 `put` internal error (`10001`), which motivated the bounded
write retries above. All 188 objects in the exposed prefix, including two pre-migration
archives, were copied to the private bucket and verified before the public copies were
deleted. Both the public `r2.dev` path and the image Worker path returned 404 afterward.
Database backups must never be stored in a bucket used for public media.

## Final privacy-minimized verification (2026-07-17)

After production stopped retaining unused appointment and customer records, the definitive
private backup completed at `2026-07-17T20:55:11.704Z` under
`backups/lashpop-d1/2026/07/17/2026-07-17T20-54-59.406Z`. Its manifest contains 69 tables,
8,558 rows, and 58 schema objects. `appointments`, `vagaro_customers`, `session`,
`punchlist_sessions`, `form_responses`, and `transactions` each contain zero rows and no
NDJSON parts.

The manifest also contains the empty `request_rate_limits` table and its
`request_rate_limits_reset_at_idx` index. Its 46 part checksums matched the fully downloaded
20:51 snapshot byte-for-byte (5,130,536 bytes); the definitive manifest was then used for a
fresh local restore. The restore passed `PRAGMA quick_check` with all 8,558 expected rows,
created the rate-limit table and index, and listed `session` and `punchlist_sessions` under
`scrubbedTables`. Direct queries confirmed all six minimized tables remained empty. This
snapshot supersedes the earlier snapshots as the current recovery point.
