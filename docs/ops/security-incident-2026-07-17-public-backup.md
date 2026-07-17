# Security incident record — public D1 backup path

Date detected: 2026-07-17

Status: technically contained; client/legal assessment open

## Summary

During the launch security audit, a LashPop D1 backup manifest and its
predictable data-part paths were reachable without authentication through the
public `lashpop-img` Worker. The manifest response was cacheable and advertised
cross-origin access. A total of 188 backup objects also existed in the public
`lashpop-dam` bucket prefix.

The reachable backup material included client/contact, appointment,
intake-form, transaction, and active-session data. This is a confirmed public
exposure condition. It is **not** currently known whether a third party fetched
the files before detection.

## Known scope

- Public path: the image Worker's `backups/lashpop-d1/` prefix and inferable
  dated parts.
- Objects discovered in the public prefix: 188.
- Sensitive table classes present in historical archives: customer contacts,
  appointments, form responses, transactions, web sessions, and one punchlist
  session.
- Earliest exposure time: not yet established from available evidence.
- Detection/containment date: 2026-07-17.

## Containment and remediation

1. Patched and deployed `lashpop-img` to reject `backups/`, `.backups/`, and
   every non-image R2 object before cache lookup.
2. Verified the manifest and dated-part paths return 404 with private/no-store
   behavior; valid image transformations still return images.
3. Copied the 188 historical objects into private `lashpop-d1-backups`, verified
   them, then removed all 188 from the public bucket. Public prefix count is 0.
4. Revoked 58 web sessions and one punchlist session; both session tables now
   contain zero rows.
5. Removed raw webhook payloads, customer addresses, appointment amounts/form
   references, 627 form responses, and 1,812 transactions.
6. Confirmed the remaining customer/appointment mirror served no functioning
   frontend/admin feature, stopped persisting those webhook events, and removed
   540 customer and 8,029 appointment rows.
7. Added default session scrubbing to the restore tool. A historical backup
   containing the revoked sessions restored both session tables as zero.
8. Moved daily backup output to the private bucket, added retry/health history,
   preserved indexes/triggers, and completed checksum plus SQLite restore
   drills.

Definitive minimized backup:
`backups/lashpop-d1/2026/07/17/2026-07-17T20-54-59.406Z/manifest.json`
(69 tables, 8,558 rows, 58 schema objects).

## Evidence still needed

- Establish the first date that backup objects became reachable.
- Preserve/review available Cloudflare Worker analytics/logs, R2 access
  evidence, deployment history, and any cache analytics for requests to the
  affected prefix.
- Record whether any non-team IP/user agent retrieved a manifest or data part.
- Preserve the relevant private historical objects until client/legal counsel
  sets the evidence-retention/deletion schedule.

## Required decision

Technical containment does not settle notification obligations. The project
owner must provide this record and the evidence review to the client and
qualified privacy counsel, document the decision on affected-person/regulator
notification, and record the approved retention/deletion date for historical
archives. A current 404 cannot be treated as proof that prior retrieval did not
occur.
