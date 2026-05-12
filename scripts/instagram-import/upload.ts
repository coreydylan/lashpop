/**
 * Read scripts/instagram-import/manifest.json (produced by fetch.py),
 * upload each image to R2, and replace the existing Instagram assets in the
 * DB with the new high-res versions.
 *
 *   set -a; source .env.local; set +a
 *   npx tsx scripts/instagram-import/upload.ts [--dry-run]
 */

import { config } from "dotenv"
config({ path: ".env.local" })
config({ path: ".env" })

import fs from "node:fs"
import path from "node:path"
import postgres from "postgres"
import { uploadBufferWithOptions } from "@/lib/dam/r2-client"

const MANIFEST = path.join(__dirname, "manifest.json")
const DRY_RUN = process.argv.includes("--dry-run")

interface ManifestImage {
  index: number
  source_url: string
  local_path: string
  alt_text: string | null
}
interface ManifestPost {
  shortcode: string
  permalink: string
  post_type: string
  caption: string
  date_utc: string
  images: ManifestImage[]
}
interface Manifest {
  profile: Record<string, unknown>
  posts: ManifestPost[]
}

async function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.error(`Manifest not found: ${MANIFEST}\nRun fetch.py first.`)
    process.exit(1)
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"))
  console.log(
    `Manifest: ${manifest.posts.length} posts, ` +
      `${manifest.posts.reduce((s, p) => s + p.images.length, 0)} images`
  )

  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  await sql.unsafe("SET statement_timeout = 0")

  let uploaded = 0
  let dbUpdates = 0
  let errors = 0

  // Track the file_path for each new asset we insert so we can return them
  // at the end for verification.
  const newAssets: Array<{ shortcode: string; r2_url: string; size: number }> =
    []

  for (const post of manifest.posts) {
    for (const img of post.images) {
      try {
        const buffer = fs.readFileSync(img.local_path)
        const key = `instagram/${post.shortcode}_${img.index}.jpg`

        if (DRY_RUN) {
          console.log(
            `[DRY] would upload ${img.local_path} (${(buffer.length / 1024).toFixed(0)}KB) -> ${key}`
          )
        } else {
          const result = await uploadBufferWithOptions({
            buffer,
            key,
            contentType: "image/jpeg",
            cacheControl: "public, max-age=31536000, immutable",
          })
          uploaded++
          newAssets.push({
            shortcode: post.shortcode,
            r2_url: result.url,
            size: buffer.length,
          })
          console.log(
            `[OK] ${post.shortcode}#${img.index} -> ${result.url} (${(buffer.length / 1024).toFixed(0)}KB)`
          )

          // Insert a new asset row. Re-runs are safe: ON CONFLICT skips
          // existing rows (matched by external_id which is "{shortcode}_{idx}").
          const inserted = await sql`
            INSERT INTO assets (
              file_name, file_path, file_type, mime_type, file_size,
              external_id, source, source_metadata, caption, alt_text,
              uploaded_at, updated_at
            ) VALUES (
              ${`${post.shortcode}_${img.index}.jpg`},
              ${result.url},
              ${"image"},
              ${"image/jpeg"},
              ${buffer.length},
              ${`${post.shortcode}_${img.index}`},
              ${"instagram"},
              ${sql.json({
                permalink: post.permalink,
                post_type: post.post_type,
                date_utc: post.date_utc,
                image_index: img.index,
                imported_at: new Date().toISOString(),
              })},
              ${post.caption || null},
              ${img.alt_text || null},
              NOW(),
              NOW()
            )
            ON CONFLICT (external_id) DO NOTHING
            RETURNING id
          `
          if (inserted.length > 0) dbUpdates++
        }
      } catch (e) {
        errors++
        console.error(`[ERR] ${post.shortcode}#${img.index}:`, e)
      }
    }
  }

  if (!DRY_RUN && uploaded > 0) {
    // The Instagram carousel on the homepage pulls assets tagged 'ig_carousel'.
    console.log("\nLinking new assets to 'ig_carousel' tag…")
    const [carouselTag] = await sql<Array<{ id: string }>>`
      SELECT id FROM tags WHERE name = 'ig_carousel' LIMIT 1
    `
    if (carouselTag) {
      // First: remove old cached low-res rows from the carousel tag (and delete them).
      const oldRows = await sql`
        SELECT id FROM assets
        WHERE source = 'instagram'
          AND source_metadata::text LIKE '%recoveredFromCache%'
      `
      if (oldRows.length > 0) {
        const oldIds = oldRows.map(r => r.id)
        await sql`DELETE FROM asset_tags WHERE asset_id IN ${sql(oldIds)}`
        await sql`DELETE FROM assets WHERE id IN ${sql(oldIds)}`
        console.log(`  Removed ${oldRows.length} old cached assets`)
      }

      // Then: tag the new ones
      for (const a of newAssets) {
        await sql`
          INSERT INTO asset_tags (asset_id, tag_id)
          SELECT id, ${carouselTag.id} FROM assets WHERE file_path = ${a.r2_url}
          ON CONFLICT DO NOTHING
        `
      }
      console.log(`  Tagged ${newAssets.length} new assets with ig_carousel`)
    } else {
      console.log("  ⚠ No 'ig_carousel' tag found - skipping tagging")
    }

    // Also tag with the 'collections/instagram' tag for DAM organization.
    const [collectionTag] = await sql<Array<{ id: string }>>`
      SELECT t.id FROM tags t
      JOIN tag_categories tc ON tc.id = t.category_id
      WHERE t.name = 'instagram' AND tc.name = 'collections'
      LIMIT 1
    `
    if (collectionTag) {
      for (const a of newAssets) {
        await sql`
          INSERT INTO asset_tags (asset_id, tag_id)
          SELECT id, ${collectionTag.id} FROM assets WHERE file_path = ${a.r2_url}
          ON CONFLICT DO NOTHING
        `
      }
    }
  }

  console.log(
    `\nDone. uploaded=${uploaded} db_inserts=${dbUpdates} errors=${errors}`
  )

  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
