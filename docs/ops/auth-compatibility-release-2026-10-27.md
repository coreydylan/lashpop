# Auth compatibility and security update — October 27, 2026

Emily's team edits could not pass the mandatory launch audit with the existing
lockfile. Security updates clear the audit, but Better Auth 1.7 validates its
Drizzle schema during initialization. The old configuration supplied table-name
strings instead of table objects and lacked the core account table and two
timestamp columns. A runtime smoke test failed even though public-page fixtures
passed. Corey explicitly approved repairing auth compatibility before release.

## Release scope

- Update only the audited dependency closure within existing package ranges:
  Next 16.4.3, Better Auth 1.7.14, Sharp 0.35.5, sanitize-html 2.18.1, and affected
  transitive packages. No audit exception or visual baseline change.
- Pass actual Drizzle tables to Better Auth and add its missing core schema.
- Continue accepting the existing phone login's 32-character `auth_token`.
  Adapt that opaque token to Better Auth's signed request-cookie format using
  the library's signing helper; Better Auth still requires an unexpired D1
  session and its user. The synthesized credential stays inside the server.
- Keep native signed cookies working. Never fall back from a supplied invalid
  native cookie to a legacy cookie. Clear both cookie types on sign-out.
- Keep password/OAuth sign-in disabled, phone identity fields server-owned,
  and admin roles outside the public user payload and generic user edits.
- Disable session cookie caching so D1 revocation takes effect immediately,
  consistently with the existing admin authorization checks.
- Add real auth handler/session tests to `test:launch`, including the legacy
  cookie, expiry, revocation, session refresh, sign-out, origin rejection and
  forbidden identity/permission edits. Tests use local SQLite with real
  migrations and never contact Twilio or a remote database.

## Database and deployment order

The previous app remains compatible with the additive schema, so use this order
to avoid deploying a new auth handler against an old database:

1. Require the exact candidate's full launch gate, GitHub `quality` and
   `browser-regression`, and Vercel preview to pass. Review the auth integration
   evidence on Node 22, Vercel's configured runtime, as well as the CI runtime.
2. Re-read production state and the named pending migrations. Export
   `lashpop-production` to a private location outside the repository, record a
   D1 Time Travel bookmark, and rehearse `0014_emily_team_edits.sql` and
   `0015_auth_schema_compatibility.sql` against a disposable export copy with
   foreign keys enabled. Do not print real session tokens or user contact data.
3. Check all Emily migration guards, user/session/verification row counts,
   token/expiry/role preservation, integrity and foreign keys. Stop on drift.
4. Apply these exact migrations once through the migration journal. Migration
   0015 adds `session.updated_at` and `verification.updated_at`, backfills each
   from `created_at`, and creates an initially empty account table. It never
   rebuilds existing tables, changes roles, expires sessions or restores tokens.
5. Verify the journal, four Emily audit entries, target team values, unchanged
   auth record contents apart from the added timestamps, and an empty account
   table. Then merge the reviewed candidate and verify Vercel production serves
   that exact merge commit. Do not infer deployment completion from the merge.
6. Check phone/desktop team content, Kelly Richter's profile facts, public
   booking, image delivery, anonymous auth, protected admin redirects, and
   production errors. A local seeded-session test is not proof of a live SMS
   verification; do not claim an SMS was sent or an owner's login completed
   without actual evidence.

## Rollback

Restore the recorded previous Vercel deployment for any auth or public-flow
regression. Leave the additive auth table/columns in place: the previous app
ignores them, and an app rollback must not restore or reactivate old sessions.
Do not drop a table that has acquired data. Use the guarded rollback in
`emily-team-edits-2026-10-27.md` if the requested team content also needs undoing.
Keep original audit history and record any rollback separately.

No DNS, Worker, provider catalog, credential, or unrelated open-PR change belongs
to this release.
