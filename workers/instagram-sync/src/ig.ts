/**
 * Instagram fetch logic for the Cloudflare Worker.
 *
 * Uses Instagram's web API (the same endpoints the official web app calls).
 * Auth is via session cookies stored as Worker secrets — no third-party
 * scraping library, just `fetch`.
 */

export interface InstagramAuth {
  sessionId: string
  dsUserId: string
  csrfToken: string
}

export interface IgImage {
  index: number
  url: string
  width: number
  height: number
  alt: string | null
}

export interface IgPost {
  shortcode: string
  permalink: string
  caption: string
  takenAt: string
  postType: 'Image' | 'Carousel' | 'Video' | string
  images: IgImage[]
}

const USERNAME = 'lashpopstudios'
const APP_ID = '936619743392459'

function authHeaders(auth: InstagramAuth): HeadersInit {
  return {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120 Safari/537.36',
    'X-IG-App-ID': APP_ID,
    'X-CSRFToken': auth.csrfToken,
    'X-Requested-With': 'XMLHttpRequest',
    Cookie: `sessionid=${auth.sessionId}; ds_user_id=${auth.dsUserId}; csrftoken=${auth.csrfToken}`,
    Accept: 'application/json',
  }
}

async function getUserId(auth: InstagramAuth): Promise<string> {
  const res = await fetch(
    `https://i.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`,
    { headers: authHeaders(auth) },
  )
  if (!res.ok) {
    throw new Error(`web_profile_info ${res.status}: ${await res.text().catch(() => '')}`)
  }
  const json: any = await res.json()
  const id = json?.data?.user?.id
  if (!id) throw new Error('web_profile_info returned no user id')
  return id
}

/**
 * Pick the biggest URL from image_versions2 candidates (or video_versions for
 * carousel video covers, though we typically skip those downstream).
 */
function bestImageUrl(item: any): { url: string; width: number; height: number } | null {
  const candidates: Array<{ url: string; width: number; height: number }> =
    item?.image_versions2?.candidates ?? []
  if (candidates.length === 0) return null
  return candidates.reduce((best, c) =>
    (c.width ?? 0) * (c.height ?? 0) > (best.width ?? 0) * (best.height ?? 0) ? c : best,
  )
}

async function fetchFeed(auth: InstagramAuth, userId: string, count: number): Promise<any[]> {
  // The user feed endpoint returns ~12 items per call; paginate via max_id.
  const items: any[] = []
  let maxId: string | undefined
  while (items.length < count) {
    const url = new URL(`https://i.instagram.com/api/v1/feed/user/${userId}/`)
    url.searchParams.set('count', String(Math.min(count - items.length, 33)))
    if (maxId) url.searchParams.set('max_id', maxId)

    const res = await fetch(url.toString(), { headers: authHeaders(auth) })
    if (!res.ok) {
      throw new Error(`feed ${res.status}: ${await res.text().catch(() => '')}`)
    }
    const json: any = await res.json()
    const batch: any[] = json?.items ?? []
    if (batch.length === 0) break
    items.push(...batch)
    if (!json?.more_available) break
    maxId = json?.next_max_id
    if (!maxId) break
    await new Promise(r => setTimeout(r, 750))
  }
  return items.slice(0, count)
}

function classify(mediaType: number): 'Image' | 'Carousel' | 'Video' | 'Other' {
  if (mediaType === 1) return 'Image'
  if (mediaType === 2) return 'Video'
  if (mediaType === 8) return 'Carousel'
  return 'Other'
}

export async function fetchRecentPosts(
  auth: InstagramAuth,
  count: number,
): Promise<IgPost[]> {
  const userId = await getUserId(auth)
  const rawItems = await fetchFeed(auth, userId, count)

  const posts: IgPost[] = []
  for (const item of rawItems) {
    const shortcode: string = item.code
    if (!shortcode) continue
    const postType = classify(item.media_type)

    const caption: string = item?.caption?.text ?? ''
    const takenAt = item.taken_at
      ? new Date(item.taken_at * 1000).toISOString()
      : new Date().toISOString()

    const images: IgImage[] = []
    if (postType === 'Carousel' && Array.isArray(item.carousel_media)) {
      item.carousel_media.forEach((child: any, idx: number) => {
        const best = bestImageUrl(child)
        if (best && best.width >= 1000) {
          images.push({
            index: idx,
            url: best.url,
            width: best.width,
            height: best.height,
            alt: child.accessibility_caption ?? null,
          })
        }
      })
    } else if (postType === 'Image' || postType === 'Video') {
      const best = bestImageUrl(item)
      if (best && best.width >= 1000) {
        images.push({
          index: 0,
          url: best.url,
          width: best.width,
          height: best.height,
          alt: item.accessibility_caption ?? null,
        })
      }
    }

    if (images.length > 0) {
      posts.push({
        shortcode,
        permalink: `https://www.instagram.com/p/${shortcode}/`,
        caption,
        takenAt,
        postType,
        images,
      })
    }
  }
  return posts
}

export async function downloadImage(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  })
  if (!res.ok) throw new Error(`download ${res.status}`)
  return await res.arrayBuffer()
}
