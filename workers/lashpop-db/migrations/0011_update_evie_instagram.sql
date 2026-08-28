-- Set Evie Ells's client-approved current Instagram handle.
--
-- Target row verified against the active public team fixture on 2026-08-27:
--   50317859-e156-467c-9380-bfbc8b0babd2  Evie Ells
--
-- Production application is a separate, explicitly approved operation. This
-- migration is committed for review and rehearsal only by this branch.
--
-- Rollback:
--   UPDATE `team_members`
--   SET `instagram` = NULL, `instagram_url` = NULL,
--       `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
--   WHERE `id` = '50317859-e156-467c-9380-bfbc8b0babd2';
INSERT INTO `admin_audit_log`
  (`id`, `actor_user_id`, `surface`, `action`, `target_type`, `target_id`, `diff`, `notes`, `created_at`)
SELECT
  lower(hex(randomblob(16))),
  NULL,
  'system',
  'team.instagram.update',
  'team_members',
  `id`,
  json_object(
    'before', json_object('instagram', `instagram`, 'instagram_url', `instagram_url`),
    'after', json_object(
      'instagram', 'thedarlinspot',
      'instagram_url', 'https://instagram.com/thedarlinspot'
    )
  ),
  'Migration 0011: client supplied Evie Ells current Instagram handle @thedarlinspot.',
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
FROM `team_members`
WHERE `id` = '50317859-e156-467c-9380-bfbc8b0babd2'
  AND `name` = 'Evie Ells'
  AND (
    coalesce(`instagram`, '') <> 'thedarlinspot'
    OR coalesce(`instagram_url`, '') <> 'https://instagram.com/thedarlinspot'
  );
--> statement-breakpoint
UPDATE `team_members`
SET
  `instagram` = 'thedarlinspot',
  `instagram_url` = 'https://instagram.com/thedarlinspot',
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `id` = '50317859-e156-467c-9380-bfbc8b0babd2'
  AND `name` = 'Evie Ells';
