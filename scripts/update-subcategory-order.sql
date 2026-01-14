-- Update display order for Lash subcategories
-- Order: Classic (1), Hybrid (2), Volume (3), Wet/Angel (4), Enhancements (5), Mega Volume (6)

-- First, let's see what subcategories we have for lashes
-- SELECT ss.id, ss.name, ss.slug, ss.display_order, sc.name as category_name
-- FROM service_subcategories ss
-- JOIN service_categories sc ON ss.category_id = sc.id
-- WHERE sc.slug = 'lashes'
-- ORDER BY ss.name;

-- Update Classic Extensions to position 1
UPDATE service_subcategories
SET display_order = 1, updated_at = NOW()
WHERE slug = 'classic-extensions'
   OR name ILIKE '%classic%extension%';

-- Update Hybrid Extensions to position 2
UPDATE service_subcategories
SET display_order = 2, updated_at = NOW()
WHERE slug = 'hybrid-extensions'
   OR name ILIKE '%hybrid%extension%';

-- Update Volume Extensions to position 3
UPDATE service_subcategories
SET display_order = 3, updated_at = NOW()
WHERE slug = 'volume-extensions'
   OR name ILIKE 'volume%extension%';

-- Update Wet/Angel Extensions to position 4
UPDATE service_subcategories
SET display_order = 4, updated_at = NOW()
WHERE slug = 'wet-angel-extensions'
   OR name ILIKE '%wet%angel%'
   OR name ILIKE '%wet/angel%';

-- Update Enhancements to position 5
UPDATE service_subcategories
SET display_order = 5, updated_at = NOW()
WHERE slug = 'enhancements'
   OR name ILIKE '%enhancement%';

-- Update Mega Volume Extensions to position 6
UPDATE service_subcategories
SET display_order = 6, updated_at = NOW()
WHERE slug = 'mega-volume-extensions'
   OR name ILIKE '%mega%volume%';

-- Verify the changes
SELECT ss.id, ss.name, ss.slug, ss.display_order, sc.name as category_name
FROM service_subcategories ss
JOIN service_categories sc ON ss.category_id = sc.id
WHERE sc.slug = 'lashes'
ORDER BY ss.display_order;
