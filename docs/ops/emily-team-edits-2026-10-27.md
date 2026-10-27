# Emily's team edits — October 27, 2026

Emily requested these edits at 18:18:17 UTC (11:18:17 PDT) in the existing
LashPop group with Jacob Rogers. The supported Messages read returned no later
reply; the group's unread count was zero before and after reading. macOS saves
her as Emily Stoehr; project memory associates that contact with LashPop, and
Google Contacts has Emily Rogers under her Stoehr email. No reply was sent.

The requested changes are:

- Remove **Paige Gordon** from the public team page by setting website
  publication to hidden. Retain her record and provider activity.
- Change **Kelly Richter** (Kelly R, not Kelly Katona) to the fun fact
  **“I’ve traveled to 11 countries”** and favorite movie **“Twilight.”**

Migration `0014_emily_team_edits.sql` targets the production-verified member and
quick-fact IDs, checks old values and names, and records four before/after audit
entries. It updates both Kelly's public quick fact and legacy fallback field.
Vagaro sync preserves publication and does not own these quick facts.
No image, booking, provider activity, layout, design token, or baseline changes.

## Production gate

This branch prepares the change; it does **not** apply it. Merging or deploying
the web app alone does not apply D1 data migrations. Production merge,
deployment and migration application require separate explicit approval.

Before approved application:

1. Follow `cloudflare-backup-recovery.md` and the migrations README. Export the
   current database outside the repository and rehearse against that export
   with `PRAGMA foreign_keys = ON`.
2. Recheck Paige's ID/name/publication provenance and Kelly's member/fact IDs,
   types and old values against the migration guards. Stop on drift; do not
   loosen guards or overwrite a later owner edit. Review all pending migrations
   before invoking the migration runner.
3. After the separately approved application, require four migration audit rows;
   Paige hidden with unchanged `is_active`; Kelly's two requested values and
   legacy fallback updated; Kelly Katona and other facts unchanged; and a clean
   foreign-key check. Verify public team/profile behavior at phone and desktop
   sizes against live data. The fixture suite does not apply D1 migrations.
   The emergency public-read fallback described in PR #57 can serve a backup;
   verify the actual public result rather than only checking primary D1 rows.

## Guarded rollback

Inspect the backup and the `Migration 0014:` audit rows first. Rollback is also a
separately approved production write. These guards preserve different later
owner edits. If values or provenance have changed, reconcile manually instead.
Keep the original audit history and record the rollback operation.

```sql
UPDATE team_members
SET show_on_website = 1, show_on_website_reason = NULL,
    show_on_website_actor = NULL, show_on_website_changed_at = NULL,
    updated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE id = '0bf9968f-69ea-4e66-ae3a-8c80ec3c7296' AND name = 'Paige Gordon'
  AND show_on_website = 0
  AND show_on_website_actor = 'migration:0014_emily_team_edits'
  AND show_on_website_reason = 'Emily Rogers requested removal from the public team page (2026-10-27).';

UPDATE team_members
SET fun_fact = 'Can recite The Nightmare Before Christmas word for word',
    updated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE id = 'ff5f9b78-e530-4b7f-808b-c20f90f6e5da' AND name = 'Kelly Richter'
  AND fun_fact = 'I’ve traveled to 11 countries';

UPDATE team_quick_facts
SET value = CASE fact_type WHEN 'fun_fact'
    THEN 'Can recite The Nightmare Before Christmas word for word'
    ELSE 'The Nightmare Before Christmas' END,
    updated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE team_member_id = 'ff5f9b78-e530-4b7f-808b-c20f90f6e5da'
  AND EXISTS (SELECT 1 FROM team_members WHERE id = team_member_id AND name = 'Kelly Richter')
  AND ((id = 'fc789695-c63c-46fd-be93-4f08bfcb6096' AND fact_type = 'fun_fact'
        AND value = 'I’ve traveled to 11 countries')
    OR (id = '4f02a8f7-e218-4b1b-b0e1-0d64ce04c8f5' AND fact_type = 'movie'
        AND value = 'Twilight'));
```
