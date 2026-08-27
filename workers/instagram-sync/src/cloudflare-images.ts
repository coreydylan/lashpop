interface ImagesEnv {
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_IMAGES_API_TOKEN?: string
}

async function imageIdForR2Key(key: string): Promise<string> {
  const input = new TextEncoder().encode(`r2:${key}`)
  const digest = await crypto.subtle.digest('SHA-256', input)
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  return `lp/${hex}`
}

export async function mirrorR2Image(
  env: ImagesEnv,
  key: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<void> {
  if (!env.CLOUDFLARE_IMAGES_API_TOKEN || bytes.byteLength > 10 * 1024 * 1024) return
  const imageId = await imageIdForR2Key(key)
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`
  const headers = { authorization: `Bearer ${env.CLOUDFLARE_IMAGES_API_TOKEN}` }
  const existing = await fetch(`${endpoint}/${encodeURIComponent(imageId)}`, { headers })
  if (existing.ok) return
  if (existing.status !== 404) throw new Error(`Cloudflare Images lookup failed (${existing.status})`)

  const form = new FormData()
  form.set('id', imageId)
  form.set('requireSignedURLs', 'false')
  form.set('metadata', JSON.stringify({ lpVersion: 1, kind: 'r2', sourceHash: imageId.slice(3) }))
  form.set('file', new Blob([bytes], { type: contentType }), key.split('/').pop() || 'instagram.jpg')
  const response = await fetch(endpoint, { method: 'POST', headers, body: form })
  if (!response.ok) throw new Error(`Cloudflare Images upload failed (${response.status})`)
}

