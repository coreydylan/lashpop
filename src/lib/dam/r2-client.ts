import { AwsClient } from "aws4fetch"

const sanitizeEnvValue = (value?: string | null) => {
  if (typeof value !== "string") return undefined
  const cleaned = value.replace(/\\n/g, "").replace(/\r?\n/g, "").trim()
  return cleaned.length > 0 ? cleaned : undefined
}

const requireEnv = (name: string, fallback?: string) => {
  const cleaned = sanitizeEnvValue(process.env[name]) ?? sanitizeEnvValue(fallback)
  if (!cleaned) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return cleaned
}

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = requireEnv("R2_ACCOUNT_ID")
const R2_ACCESS_KEY_ID = requireEnv("R2_ACCESS_KEY_ID")
const R2_SECRET_ACCESS_KEY = requireEnv("R2_SECRET_ACCESS_KEY")
const BUCKET_NAME = requireEnv("R2_BUCKET_NAME", "lashpop-dam")
const BUCKET_URL =
  sanitizeEnvValue(process.env.NEXT_PUBLIC_R2_BUCKET_URL) ||
  `https://${BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev`

const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  region: "auto",
  service: "s3",
})

export interface UploadParams {
  file: File
  key: string
  contentType: string
}

export interface UploadBufferParams {
  buffer: Buffer
  key: string
  contentType: string
}

export async function uploadFile(params: UploadParams) {
  const { file, key, contentType } = params
  const body = new Uint8Array(await file.arrayBuffer())

  const url = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`
  const res = await r2.fetch(url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body,
  })

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`)
  }

  return {
    url: `${BUCKET_URL}/${key}`,
    key
  }
}

export async function uploadBuffer(params: UploadBufferParams) {
  const { buffer, key, contentType } = params

  const url = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`
  const res = await r2.fetch(url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: new Uint8Array(buffer),
  })

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`)
  }

  return {
    url: `${BUCKET_URL}/${key}`,
    key
  }
}

export async function deleteObject(key: string) {
  const url = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`
  const res = await r2.fetch(url, { method: "DELETE" })

  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed: ${res.status} ${await res.text()}`)
  }
}

export async function downloadBuffer(key: string): Promise<Buffer> {
  const url = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`
  const res = await r2.fetch(url, { method: "GET" })

  if (!res.ok) {
    throw new Error(`R2 download failed: ${res.status} ${await res.text()}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600) {
  const url = new URL(`${R2_ENDPOINT}/${BUCKET_NAME}/${key}`)
  url.searchParams.set("X-Amz-Expires", String(expiresIn))

  const signed = await r2.sign(url.toString(), {
    method: "PUT",
    headers: { "Content-Type": contentType },
    aws: { signQuery: true },
  })

  return signed.url
}

export async function uploadBufferWithOptions(params: {
  buffer: Buffer
  key: string
  contentType: string
  cacheControl?: string
}) {
  const { buffer, key, contentType, cacheControl } = params

  const url = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`
  const headers: Record<string, string> = { "Content-Type": contentType }
  if (cacheControl) headers["Cache-Control"] = cacheControl

  const res = await r2.fetch(url, {
    method: "PUT",
    headers,
    body: new Uint8Array(buffer),
  })

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`)
  }

  return {
    url: `${BUCKET_URL}/${key}`,
    key
  }
}

export function getStorageBucketUrl(): string {
  return BUCKET_URL
}

export function generateAssetKey(fileName: string, teamMemberId?: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(7)
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")

  if (teamMemberId) {
    return `team/${teamMemberId}/${timestamp}-${randomString}-${sanitizedFileName}`
  }

  return `uploads/${timestamp}-${randomString}-${sanitizedFileName}`
}
