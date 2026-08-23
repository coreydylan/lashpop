-- Clear the latent auto-publish flags on inactive rows.
--
-- Seven inactive rows still carried show_on_website = 1: two Kimberly Starnes
-- rows, Ryann Alcorn, Gabby Sanchez, Tori Burnett, and empty duplicate rows for
-- Evie Ells and Grace Ramos. Deactivation only ever set is_active = 0, so the
-- editorial flag stayed on. The Vagaro sync sets isActive: true on a match and
-- deliberately never touches showOnWebsite, so any reactivation would have
-- published these rows instantly with nobody in the loop.
--
-- Rows affected when this was written (2026-08-23):
--   204a8420-f5d6-40b5-8e31-9ff3a0a7ec7f  Evie Ells (empty duplicate)
--   6f146b4b-2889-45b8-8480-3ba98c83baee  Gabby Sanchez
--   6aab3891-fe5d-4150-9bf5-4e9a0b2aa0cb  Grace Ramos (empty duplicate)
--   2f8a0d0e-9f89-4c48-bb74-22a7f8ccaa2d  Kimberly Starnes
--   ca0464a6-010f-486f-8584-895415939d09  Kimberly Starnes
--   1461326e-f5ad-4953-bdfe-4365775eb803  Ryann Alcorn
--   e3ab3b62-2249-4a2d-9644-c652be7e50b4  Tori Burnett
--
-- No visible change: every one of these rows is already excluded from the
-- public site by is_active = 0. This only removes the trap.
--
-- Rollback:
--   UPDATE `team_members`
--   SET `show_on_website` = 1, `show_on_website_reason` = NULL,
--       `show_on_website_actor` = NULL, `show_on_website_changed_at` = NULL
--   WHERE `id` IN (
--     '204a8420-f5d6-40b5-8e31-9ff3a0a7ec7f','6f146b4b-2889-45b8-8480-3ba98c83baee',
--     '6aab3891-fe5d-4150-9bf5-4e9a0b2aa0cb','2f8a0d0e-9f89-4c48-bb74-22a7f8ccaa2d',
--     'ca0464a6-010f-486f-8584-895415939d09','1461326e-f5ad-4953-bdfe-4365775eb803',
--     'e3ab3b62-2249-4a2d-9644-c652be7e50b4');
INSERT INTO `admin_audit_log`
  (`id`, `actor_user_id`, `surface`, `action`, `target_type`, `target_id`, `diff`, `notes`, `created_at`)
SELECT
  lower(hex(randomblob(16))),
  NULL,
  'system',
  'team.publication.clear-latent-flag',
  'team_members',
  `id`,
  json_object('before', json_object('is_active', `is_active`, 'show_on_website', `show_on_website`),
              'after', json_object('is_active', `is_active`, 'show_on_website', 0)),
  'Migration 0009: inactive row unpublished so a future reactivation cannot auto-publish it.',
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
FROM `team_members`
WHERE `is_active` = 0 AND `show_on_website` = 1;
--> statement-breakpoint
UPDATE `team_members`
SET
  `show_on_website` = 0,
  `show_on_website_reason` = 'Inactive in Vagaro; unpublished so a future reactivation cannot auto-publish this row (migration 0009)',
  `show_on_website_actor` = 'system:migration-0009',
  `show_on_website_changed_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER),
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `is_active` = 0 AND `show_on_website` = 1;
