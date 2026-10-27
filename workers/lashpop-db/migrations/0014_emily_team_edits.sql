-- Emily Rogers's 2026-10-27 request: hide Paige Gordon from the public team
-- page; set Kelly Richter's fun fact and favorite movie. IDs and old values
-- verified with read-only production queries on 2026-10-27.
--
-- Review/rehearsal only until separately approved for production application.
-- Preserve provider activity, bookings, photos, service mappings and other staff.
-- Guards preserve later owner edits; a mismatched row requires reconciliation.
-- Rollback: use the guarded SQL in docs/ops/emily-team-edits-2026-10-27.md
-- after exporting production and checking the migration's before/after audit.

INSERT INTO `admin_audit_log`
  (`id`, `actor_user_id`, `surface`, `action`, `target_type`, `target_id`, `diff`, `notes`, `created_at`)
SELECT lower(hex(randomblob(16))), NULL, 'system', 'team.publication.update',
  'team_member', `id`,
  json_object('before', json_object('show_on_website', `show_on_website`,
    'show_on_website_reason', `show_on_website_reason`,
    'show_on_website_actor', `show_on_website_actor`,
    'show_on_website_changed_at', `show_on_website_changed_at`),
    'after', json_object('show_on_website', 0)),
  'Migration 0014: Emily Rogers requested Paige removal from the public team page on 2026-10-27.',
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
FROM `team_members`
WHERE `id` = '0bf9968f-69ea-4e66-ae3a-8c80ec3c7296' AND `name` = 'Paige Gordon'
  AND `show_on_website` = 1 AND `show_on_website_reason` IS NULL
  AND `show_on_website_actor` IS NULL AND `show_on_website_changed_at` IS NULL;
--> statement-breakpoint
UPDATE `team_members`
SET `show_on_website` = 0,
  `show_on_website_reason` = 'Emily Rogers requested removal from the public team page (2026-10-27).',
  `show_on_website_actor` = 'migration:0014_emily_team_edits',
  `show_on_website_changed_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER),
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `id` = '0bf9968f-69ea-4e66-ae3a-8c80ec3c7296' AND `name` = 'Paige Gordon'
  AND `show_on_website` = 1 AND `show_on_website_reason` IS NULL
  AND `show_on_website_actor` IS NULL AND `show_on_website_changed_at` IS NULL;
--> statement-breakpoint
INSERT INTO `admin_audit_log`
  (`id`, `actor_user_id`, `surface`, `action`, `target_type`, `target_id`, `diff`, `notes`, `created_at`)
SELECT lower(hex(randomblob(16))), NULL, 'system', 'team.member.update',
  'team_member', `id`,
  json_object('before', json_object('fun_fact', `fun_fact`),
    'after', json_object('fun_fact', 'I’ve traveled to 11 countries')),
  'Migration 0014: Emily Rogers supplied Kelly Richter fun fact on 2026-10-27.',
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
FROM `team_members`
WHERE `id` = 'ff5f9b78-e530-4b7f-808b-c20f90f6e5da' AND `name` = 'Kelly Richter'
  AND `fun_fact` = 'Can recite The Nightmare Before Christmas word for word';
--> statement-breakpoint
UPDATE `team_members`
SET `fun_fact` = 'I’ve traveled to 11 countries',
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `id` = 'ff5f9b78-e530-4b7f-808b-c20f90f6e5da' AND `name` = 'Kelly Richter'
  AND `fun_fact` = 'Can recite The Nightmare Before Christmas word for word';
--> statement-breakpoint
INSERT INTO `admin_audit_log`
  (`id`, `actor_user_id`, `surface`, `action`, `target_type`, `target_id`, `diff`, `notes`, `created_at`)
SELECT lower(hex(randomblob(16))), NULL, 'system', 'team.quick-fact.update',
  'team_quick_fact', `id`,
  json_object('before', json_object('value', `value`),
    'after', json_object('value', CASE `fact_type`
      WHEN 'fun_fact' THEN 'I’ve traveled to 11 countries' ELSE 'Twilight' END)),
  'Migration 0014: Emily Rogers supplied Kelly Richter quick facts on 2026-10-27.',
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
FROM `team_quick_facts`
WHERE `team_member_id` = 'ff5f9b78-e530-4b7f-808b-c20f90f6e5da'
  AND EXISTS (SELECT 1 FROM `team_members` WHERE `id` = `team_member_id` AND `name` = 'Kelly Richter')
  AND ((`id` = 'fc789695-c63c-46fd-be93-4f08bfcb6096' AND `fact_type` = 'fun_fact'
      AND `value` = 'Can recite The Nightmare Before Christmas word for word')
    OR (`id` = '4f02a8f7-e218-4b1b-b0e1-0d64ce04c8f5' AND `fact_type` = 'movie'
      AND `value` = 'The Nightmare Before Christmas'));
--> statement-breakpoint
UPDATE `team_quick_facts`
SET `value` = CASE `fact_type`
    WHEN 'fun_fact' THEN 'I’ve traveled to 11 countries' ELSE 'Twilight' END,
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `team_member_id` = 'ff5f9b78-e530-4b7f-808b-c20f90f6e5da'
  AND EXISTS (SELECT 1 FROM `team_members` WHERE `id` = `team_member_id` AND `name` = 'Kelly Richter')
  AND ((`id` = 'fc789695-c63c-46fd-be93-4f08bfcb6096' AND `fact_type` = 'fun_fact'
      AND `value` = 'Can recite The Nightmare Before Christmas word for word')
    OR (`id` = '4f02a8f7-e218-4b1b-b0e1-0d64ce04c8f5' AND `fact_type` = 'movie'
      AND `value` = 'The Nightmare Before Christmas'));
