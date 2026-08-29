import { createHash } from "node:crypto"

const HOSTED_UPLOAD_LIMIT = 10 * 1024 * 1024
const DEFAULT_ACCOUNT_HASH = "zXebLwufc8AGAQU5E9oXHw"

const sanitizeEnvValue = (value?: string | null) => {
  if (typeof value !== "string") return undefined
  const cleaned = value.replace(/\\n/g, "").replace(/\r?\n/g, "").trim()
  return cleaned.length > 0 ? cleaned : undefined
}

function config() {
  const accountId = sanitizeEnvValue(process.env.CLOUDFLARE_ACCOUNT_ID)
  const apiToken = sanitizeEnvValue(process.env.CLOUDFLARE_API_TOKEN)
  return accountId && apiToken ? { accountId, apiToken } : null
}

function deliveryUrl(imageId: string) {
  const accountHash = sanitizeEnvValue(process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH)
    || sanitizeEnvValue(process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH)
    || DEFAULT_ACCOUNT_HASH
  return `https://imagedelivery.net/${accountHash}/${imageId}/public`
}

function hostedImageIdForR2Key(key: string) {
  const digest = createHash("sha256").update(`r2:${key}`).digest("hex")
  return `lp/${digest}`
}

async function imageDetails(imageId: string) {
  const current = config()
  if (!current) return null
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${current.accountId}/images/v1/${encodeURIComponent(imageId)}`,
    { headers: { authorization: `Bearer ${current.apiToken}` } },
  )
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Cloudflare Images lookup failed (${response.status})`)
  const payload = await response.json() as { success: boolean; result?: { draft?: boolean } }
  if (!payload.success) throw new Error("Cloudflare Images lookup was unsuccessful")
  return payload.result ?? null
}

export async function mirrorR2Image(params: {
  body: Uint8Array
  key: string
  contentType: string
  fileName: string
}) {
  const current = config()
  if (!current) return { status: "disabled" as const }
  if (!params.contentType.startsWith("image/")) return { status: "not-image" as const }
  if (params.body.byteLength > HOSTED_UPLOAD_LIMIT) {
    return { status: "oversized" as const, size: params.body.byteLength }
  }

  const imageId = hostedImageIdForR2Key(params.key)
  const existing = await imageDetails(imageId)
  if (existing && !existing.draft) return { status: "existing" as const, imageId, deliveryUrl: deliveryUrl(imageId) }

  const form = new FormData()
  form.set("id", imageId)
  form.set("requireSignedURLs", "false")
  form.set("metadata", JSON.stringify({
    lpVersion: 1,
    kind: "r2",
    sourceHash: imageId.slice("lp/".length),
  }))
  const blobBody = new ArrayBuffer(params.body.byteLength)
  new Uint8Array(blobBody).set(params.body)
  form.set("file", new Blob([blobBody], { type: params.contentType }), params.fileName)

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${current.accountId}/images/v1`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${current.apiToken}` },
      body: form,
    },
  )
  const payload = await response.json() as {
    success: boolean
    errors?: Array<{ message?: string }>
  }
  if (!response.ok || !payload.success) {
    const detail = payload.errors?.map((error) => error.message).filter(Boolean).join("; ")
    throw new Error(`Cloudflare Images upload failed (${response.status})${detail ? `: ${detail}` : ""}`)
  }
  return { status: "uploaded" as const, imageId, deliveryUrl: deliveryUrl(imageId) }
}

export async function mirrorR2ImageFromUrl(params: {
  key: string
  sourceUrl: string
}) {
  const current = config()
  if (!current) return { status: "disabled" as const }

  const imageId = hostedImageIdForR2Key(params.key)
  const existing = await imageDetails(imageId)
  if (existing && !existing.draft) return { status: "existing" as const, imageId, deliveryUrl: deliveryUrl(imageId) }

  const form = new FormData()
  form.set("id", imageId)
  form.set("url", params.sourceUrl)
  form.set("requireSignedURLs", "false")
  form.set("metadata", JSON.stringify({
    lpVersion: 1,
    kind: "r2",
    sourceHash: imageId.slice("lp/".length),
  }))

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${current.accountId}/images/v1`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${current.apiToken}` },
      body: form,
    },
  )
  const payload = await response.json() as {
    success: boolean
    errors?: Array<{ message?: string }>
  }
  if (!response.ok || !payload.success) {
    const detail = payload.errors?.map((error) => error.message).filter(Boolean).join("; ")
    throw new Error(`Cloudflare Images URL import failed (${response.status})${detail ? `: ${detail}` : ""}`)
  }
  return { status: "uploaded" as const, imageId, deliveryUrl: deliveryUrl(imageId) }
}

export async function deleteMirroredR2Image(key: string) {
  const current = config()
  if (!current) return { status: "disabled" as const }
  const imageId = hostedImageIdForR2Key(key)
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${current.accountId}/images/v1/${encodeURIComponent(imageId)}`,
    {
      method: "DELETE",
      headers: { authorization: `Bearer ${current.apiToken}` },
    },
  )
  if (response.status === 404) return { status: "missing" as const, imageId }
  if (!response.ok) throw new Error(`Cloudflare Images delete failed (${response.status})`)
  return { status: "deleted" as const, imageId }
}

export const cloudflareImagesInternals = {
  HOSTED_UPLOAD_LIMIT,
  deliveryUrl,
  hostedImageIdForR2Key,
}
