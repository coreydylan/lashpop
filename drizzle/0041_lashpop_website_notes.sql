-- Client-approved website-note data corrections. Every statement is guarded
-- so a later admin edit or Vagaro rename is not overwritten on re-run.

UPDATE `service_categories`
SET
  `name` = 'Tiny Tattoos',
  `display_name` = CASE
    WHEN `display_name` IS NULL OR `display_name` = 'Fine Line Tattoos'
      THEN 'Tiny Tattoos'
    ELSE `display_name`
  END,
  `updated_at` = unixepoch() * 1000
WHERE `slug` = 'fine-line-tattoos'
  AND (`name` = 'Fine Line Tattoos' OR `display_name` = 'Fine Line Tattoos');
--> statement-breakpoint
UPDATE `vagaro_service_categories`
SET
  `team_label` = 'Tiny Tattoos',
  `updated_at` = unixepoch() * 1000
WHERE `team_label` = 'Fine Line Tattoos';
--> statement-breakpoint
UPDATE `website_settings`
SET
  `config` = json_set(
    `config`,
    '$.coordinates.lat', 33.1913757,
    '$.coordinates.lng', -117.3758363
  ),
  `updated_at` = unixepoch() * 1000
WHERE `section` = 'studio'
  AND lower(json_extract(`config`, '$.address.street')) IN (
    '429 s coast hwy',
    '429 south coast highway'
  )
  AND abs(CAST(json_extract(`config`, '$.coordinates.lat') AS REAL) - 33.1959) < 0.000001
  AND abs(CAST(json_extract(`config`, '$.coordinates.lng') AS REAL) - -117.3795) < 0.000001;
