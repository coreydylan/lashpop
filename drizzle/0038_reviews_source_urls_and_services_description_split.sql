-- Reviews: cross-platform dedup. Stores both source URLs on the surviving row
-- so the homepage carousel can link to either platform. Fingerprint function
-- normalises the first 100 chars of review_text so duplicates across Google /
-- Yelp / Vagaro collapse regardless of reviewer-name drift ("Renna M" vs
-- "Renna Ming"). Applied via Supabase MCP; this file is the historical record.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source_urls jsonb DEFAULT '[]'::jsonb NOT NULL;

UPDATE reviews
SET source_urls = CASE
  WHEN source_url IS NOT NULL AND source_url <> ''
    THEN jsonb_build_array(jsonb_build_object('source', source, 'url', source_url))
  ELSE '[]'::jsonb
END
WHERE source_urls = '[]'::jsonb;

CREATE OR REPLACE FUNCTION reviews_fingerprint(review_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(left(coalesce(review_text, ''), 100), '\s+', ' ', 'g'));
$$;

CREATE INDEX IF NOT EXISTS reviews_fingerprint_idx ON reviews (reviews_fingerprint(review_text));

-- Services description split: sync writes Vagaro's copy to vagaro_description
-- only; the live `description` column becomes the admin's optional override.
-- Read sites use COALESCE(description, vagaro_description) so local edits
-- always win. Mirrors the existing vagaro_image_url / image_url split.
ALTER TABLE services ADD COLUMN IF NOT EXISTS vagaro_description text;
UPDATE services SET vagaro_description = description WHERE vagaro_description IS NULL;
ALTER TABLE services ALTER COLUMN description DROP NOT NULL;
