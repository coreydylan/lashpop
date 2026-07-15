INSERT INTO `service_categories` (
  `id`,
  `name`,
  `slug`,
  `description`,
  `tagline`,
  `icon`,
  `display_order`,
  `is_active`,
  `created_at`,
  `updated_at`
)
VALUES (
  '4ab37a96-6476-4ad8-a093-bd4f7ec2bf5a',
  'Fine Line Tattoos',
  'fine-line-tattoos',
  'Delicate, custom tattoos designed around your story and style. From tiny symbols and meaningful words to soft florals and one-of-a-kind linework, each piece is thoughtfully created to feel uniquely yours.',
  'Tiny, personal + yours.',
  '/lashpop-images/services/fine-line-tattoos.jpg',
  7,
  1,
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER),
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
)
ON CONFLICT(`slug`) DO UPDATE SET
  `name` = excluded.`name`,
  `description` = excluded.`description`,
  `tagline` = excluded.`tagline`,
  `icon` = excluded.`icon`,
  `display_order` = excluded.`display_order`,
  `is_active` = 1,
  `updated_at` = excluded.`updated_at`;
--> statement-breakpoint
UPDATE `service_categories`
SET `display_order` = CASE `slug`
  WHEN 'lashes' THEN 1
  WHEN 'brows' THEN 2
  WHEN 'facials' THEN 3
  WHEN 'waxing' THEN 4
  WHEN 'permanent-makeup' THEN 5
  WHEN 'specialty' THEN 6
  WHEN 'fine-line-tattoos' THEN 7
  WHEN 'injectables' THEN 8
  WHEN 'bundles' THEN 9
  WHEN 'nails' THEN 10
  ELSE `display_order`
END,
`updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `slug` IN (
  'lashes',
  'brows',
  'facials',
  'waxing',
  'permanent-makeup',
  'specialty',
  'fine-line-tattoos',
  'injectables',
  'bundles',
  'nails'
);
--> statement-breakpoint
UPDATE `services`
SET
  `category_id` = (
    SELECT `id`
    FROM `service_categories`
    WHERE `slug` = 'fine-line-tattoos'
    LIMIT 1
  ),
  `main_category` = 'Fine Line Tattoos',
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `vagaro_service_id` = '35729654'
   OR lower(`name`) = 'fine line tattoos';
--> statement-breakpoint
UPDATE `team_members`
SET
  `instagram` = NULL,
  `instagram_url` = NULL,
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `id` = '50317859-e156-467c-9380-bfbc8b0babd2';
