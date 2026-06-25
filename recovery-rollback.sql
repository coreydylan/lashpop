-- ROLLBACK for the 2026-06-22 lashpop image-recovery repoint.
-- Before repointing, all 115 rows still on the dead bucket (pub-f98565...) had
-- their old file_path snapshotted into table _recovery_backup_20260622.
-- To revert the repoint completely:

UPDATE assets a
SET file_path = b.old_file_path, updated_at = now()
FROM _recovery_backup_20260622 b
WHERE a.id = b.id;

-- Verify, then optionally drop the backup once you're confident:
--   SELECT count(*) FROM assets WHERE file_path LIKE '%pub-f98565%';   -- expect 115 after rollback
--   DROP TABLE _recovery_backup_20260622;
