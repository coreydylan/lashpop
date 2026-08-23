# D1 migrations

Applied with `npx wrangler d1 migrations apply lashpop-production --remote --config workers/lashpop-db/wrangler.jsonc`.

## Before you apply anything to production

1. Take a full export first and keep it outside the repo:
   `npx wrangler d1 export lashpop-production --remote --config workers/lashpop-db/wrangler.jsonc --output ~/Developer/lashpop-backups/<name>.sql`
2. Write the rollback statement into the migration header.
3. Rehearse against a copy of that export **with `PRAGMA foreign_keys = ON`**. The
   `sqlite3` CLI defaults to OFF; D1 runs with foreign keys ON, so an OFF rehearsal
   hides the whole class of bug below.

## Table rebuilds cascade

SQLite cannot alter a column default or drop a NOT NULL, so changing one means the
rebuild dance: create `__new_x`, copy, `DROP TABLE x`, rename.

With foreign keys enforced, `DROP TABLE` first performs an implicit DELETE of every
row, and that DELETE fires `ON DELETE CASCADE` and `ON DELETE SET NULL` on child
tables. `PRAGMA defer_foreign_keys` defers constraint *violations*; it does not
suppress cascade actions.

On 2026-08-23 the first version of `0010_show_on_website_hidden_by_default.sql`
rebuilt `team_members` and deleted 716 rows from seven child tables in production.
Restored from the pre-migration export within three minutes.

`team_members` children today: `sets`, `team_member_categories`,
`team_member_highlights`, `team_member_photos`, `team_member_services`,
`team_member_services_vagaro`, `team_quick_facts` cascade;
`assets` and `reviews` set null; `profiles` and `friend_booking_requests` no action.

If you rebuild a parent table, snapshot the child rows into temp tables inside the
migration, restore them after the rename, and drop the snapshots - see 0010 for the
pattern. `src/db/migrations-cascade.test.ts` applies the whole chain with foreign
keys on and fails if a migration eats child rows; it runs in `npm run test:staff`.
