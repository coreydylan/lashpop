import { downloadImage, fetchRecentPosts } from './ig'

interface Env {
  BUCKET: R2Bucket
  DB: D1Database
  IG_SESSION_ID: string
  IG_DS_USER_ID: string
  IG_CSRF_TOKEN: string
  NEXT_PUBLIC_R2_BUCKET_URL: string
  MANUAL_TRIGGER_SECRET?: string
}

interface RunResult {
  posts: number
  imagesUploaded: number
  rowsInserted: number
  oldRemoved: number
  errors: string[]
}

async function run(env: Env, limit = 24): Promise<RunResult> {
  const result: RunResult = {
    posts: 0,
    imagesUploaded: 0,
    rowsInserted: 0,
    oldRemoved: 0,
    errors: [],
  }

  if (!env.IG_SESSION_ID || !env.IG_DS_USER_ID || !env.IG_CSRF_TOKEN) {
    throw new Error('Missing Instagram session secrets (IG_SESSION_ID, IG_DS_USER_ID, IG_CSRF_TOKEN)')
  }

  console.log(`Fetching up to ${limit} posts from @lashpopstudios…`)
  const posts = await fetchRecentPosts(
    {
      sessionId: env.IG_SESSION_ID,
      dsUserId: env.IG_DS_USER_ID,
      csrfToken: env.IG_CSRF_TOKEN,
    },
    limit,
  )
  result.posts = posts.length
  const totalImages = posts.reduce((s, p) => s + p.images.length, 0)
  console.log(`  got ${posts.length} posts, ${totalImages} images >= 1000px`)

  if (posts.length === 0) {
    return result
  }

  {
    // Look up the ig_carousel tag once
    const carouselTag = await env.DB
      .prepare("SELECT id FROM tags WHERE name = 'ig_carousel' LIMIT 1")
      .first<{ id: string }>()

    const collectionTag = await env.DB
      .prepare(`SELECT t.id FROM tags t
        JOIN tag_categories tc ON tc.id = t.category_id
        WHERE t.name = 'instagram' AND tc.name = 'collections'
        LIMIT 1`)
      .first<{ id: string }>()

    // Remove old recoveredFromCache rows once (idempotent re-runs find none)
    const { results: oldRows } = await env.DB
      .prepare("SELECT id FROM assets WHERE source = 'instagram' AND source_metadata LIKE '%recoveredFromCache%'")
      .all<{ id: string }>()
    if (oldRows.length > 0) {
      const oldIds = oldRows.map(r => r.id)
      const placeholders = oldIds.map(() => '?').join(', ')
      await env.DB.batch([
        env.DB.prepare(`DELETE FROM asset_tags WHERE asset_id IN (${placeholders})`).bind(...oldIds),
        env.DB.prepare(`DELETE FROM assets WHERE id IN (${placeholders})`).bind(...oldIds),
      ])
      result.oldRemoved = oldRows.length
      console.log(`  removed ${oldRows.length} old cached rows`)
    }

    for (const post of posts) {
      for (const img of post.images) {
        try {
          const buf = await downloadImage(img.url)
          const key = `instagram/${post.shortcode}_${img.index}.jpg`

          await env.BUCKET.put(key, buf, {
            httpMetadata: {
              contentType: 'image/jpeg',
              cacheControl: 'public, max-age=31536000, immutable',
            },
          })
          result.imagesUploaded++

          const r2Url = `${env.NEXT_PUBLIC_R2_BUCKET_URL.replace(/\/$/, '')}/${key}`
          const externalId = `${post.shortcode}_${img.index}`

          const assetId = crypto.randomUUID()
          const inserted = await env.DB.prepare(`
            INSERT INTO assets (
              id,
              file_name, file_path, file_type, mime_type, file_size,
              external_id, source, source_metadata, caption, alt_text,
              width, height, uploaded_at, updated_at
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            ON CONFLICT (external_id) DO NOTHING
            RETURNING id
          `).bind(
            assetId,
            `${post.shortcode}_${img.index}.jpg`,
            r2Url,
            'image',
            'image/jpeg',
            buf.byteLength,
            externalId,
            'instagram',
            JSON.stringify({
              permalink: post.permalink,
              post_type: post.postType,
              date_utc: post.takenAt,
              image_index: img.index,
              imported_at: new Date().toISOString(),
            }),
            post.caption || null,
            img.alt || null,
            img.width,
            img.height,
            Date.now(),
            Date.now(),
          ).first<{ id: string }>()

          if (inserted) {
            result.rowsInserted++
            if (carouselTag) {
              await env.DB.prepare(`
                INSERT INTO asset_tags (id, asset_id, tag_id)
                SELECT ?, ?, ?
                WHERE NOT EXISTS (
                  SELECT 1 FROM asset_tags WHERE asset_id = ? AND tag_id = ?
                )
              `).bind(crypto.randomUUID(), assetId, carouselTag.id, assetId, carouselTag.id).run()
            }
            if (collectionTag) {
              await env.DB.prepare(`
                INSERT INTO asset_tags (id, asset_id, tag_id)
                SELECT ?, ?, ?
                WHERE NOT EXISTS (
                  SELECT 1 FROM asset_tags WHERE asset_id = ? AND tag_id = ?
                )
              `).bind(crypto.randomUUID(), assetId, collectionTag.id, assetId, collectionTag.id).run()
            }
          }

          console.log(
            `  [${post.shortcode}#${img.index}] ${img.width}x${img.height} ` +
              `${(buf.byteLength / 1024).toFixed(0)}KB ${inserted ? 'NEW' : 'exists'}`,
          )
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          result.errors.push(`${post.shortcode}#${img.index}: ${msg}`)
          console.error(`  [${post.shortcode}#${img.index}] error: ${msg}`)
        }
      }
    }
  }

  return result
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        try {
          const result = await run(env)
          console.log('Instagram sync done:', JSON.stringify(result))
        } catch (err) {
          console.error('Instagram sync failed:', err)
        }
      })(),
    )
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)

    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        instagramSessionConfigured: Boolean(
          env.IG_SESSION_ID && env.IG_DS_USER_ID && env.IG_CSRF_TOKEN,
        ),
      })
    }

    if (url.pathname !== '/run') {
      return new Response('Not found', { status: 404 })
    }

    if (!env.MANUAL_TRIGGER_SECRET) {
      return new Response('Manual trigger not configured', { status: 503 })
    }
    if (req.headers.get('authorization') !== `Bearer ${env.MANUAL_TRIGGER_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const requestedLimit = Number(url.searchParams.get('limit') ?? 24)
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(24, Math.max(1, Math.trunc(requestedLimit)))
      : 24
    try {
      const result = await run(env, limit)
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'content-type': 'application/json' },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return new Response(JSON.stringify({ error: msg }, null, 2), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })
    }
  },
} satisfies ExportedHandler<Env>
