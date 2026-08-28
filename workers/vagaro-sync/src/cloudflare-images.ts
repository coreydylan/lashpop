export interface CloudflareImagesEnv {
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_IMAGES_API_TOKEN?: string
}

async function externalImageId(url: string): Promise<string> {
  const canonical = `ext:${new URL(url).toString()}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  return `lp/${hex}`
}

export function createExternalImageMirror(env: CloudflareImagesEnv) {
  return async (sourceUrl: string): Promise<void> => {
    if (!env.CLOUDFLARE_IMAGES_API_TOKEN) return
    const imageId = await externalImageId(sourceUrl)
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`
    const headers = { authorization: `Bearer ${env.CLOUDFLARE_IMAGES_API_TOKEN}` }
    const existing = await fetch(`${endpoint}/${encodeURIComponent(imageId)}`, { headers })
    if (existing.ok) return
    if (existing.status !== 404) throw new Error(`Cloudflare Images lookup failed (${existing.status})`)

    const form = new FormData()
    form.set('id', imageId)
    form.set('url', sourceUrl)
    form.set('requireSignedURLs', 'false')
    form.set('metadata', JSON.stringify({ lpVersion: 1, kind: 'ext', sourceHash: imageId.slice(3) }))
    const response = await fetch(endpoint, { method: 'POST', headers, body: form })
    if (!response.ok) throw new Error(`Cloudflare Images URL import failed (${response.status})`)
  }
}

