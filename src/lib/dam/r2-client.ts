import { AwsClient } from "aws4fetch"
import { deleteMirroredR2Image, mirrorR2Image } from "./cloudflare-images"

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

interface R2Config {
  bucketName: string
  bucketUrl: string
  endpoint: string
  client: AwsClient
}

let cachedConfig: R2Config | undefined

function getR2Config(): R2Config {
  if (cachedConfig) return cachedConfig

  const accountId = requireEnv("R2_ACCOUNT_ID")
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID")
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY")
  const bucketName = requireEnv("R2_BUCKET_NAME", "lashpop-dam")
  const bucketUrl =
    sanitizeEnvValue(process.env.NEXT_PUBLIC_R2_BUCKET_URL) ||
    `https://${bucketName}.${accountId}.r2.dev`

  cachedConfig = {
    bucketName,
    bucketUrl,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    client: new AwsClient({
      accessKeyId,
      secretAccessKey,
      region: "auto",
      service: "s3",
    }),
  }

  return cachedConfig
}

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

async function mirrorBestEffort(params: {
  body: Uint8Array
  key: string
  contentType: string
  fileName: string
}) {
  try {
    return await mirrorR2Image(params)
  } catch (error) {
    console.error("Cloudflare Images mirror failed; R2 remains available:", error)
    return { status: "failed" as const }
  }
}

export async function uploadFile(params: UploadParams) {
  const { file, key, contentType } = params
  const body = new Uint8Array(await file.arrayBuffer())
  const { endpoint, bucketName, bucketUrl, client } = getR2Config()

  const url = `${endpoint}/${bucketName}/${key}`
  const res = await client.fetch(url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body,
  })

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`)
  }

  const mirror = await mirrorBestEffort({
    body,
    key,
    contentType,
    fileName: file.name,
  })

  return {
    url: `${bucketUrl}/${key}`,
    key,
    mirror,
  }
}

export async function uploadBuffer(params: UploadBufferParams) {
  const { buffer, key, contentType } = params
  const { endpoint, bucketName, bucketUrl, client } = getR2Config()

  const url = `${endpoint}/${bucketName}/${key}`
  const res = await client.fetch(url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: new Uint8Array(buffer),
  })

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`)
  }

  const mirror = await mirrorBestEffort({
    body: new Uint8Array(buffer),
    key,
    contentType,
    fileName: key.split("/").pop() || "image",
  })

  return {
    url: `${bucketUrl}/${key}`,
    key,
    mirror,
  }
}

export async function deleteObject(key: string) {
  const { endpoint, bucketName, client } = getR2Config()
  const url = `${endpoint}/${bucketName}/${key}`
  const res = await client.fetch(url, { method: "DELETE" })

  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed: ${res.status} ${await res.text()}`)
  }

  try {
    await deleteMirroredR2Image(key)
  } catch (error) {
    console.error("Cloudflare Images delete failed; cleanup can be retried:", error)
  }
}

export async function downloadBuffer(key: string): Promise<Buffer> {
  const { endpoint, bucketName, client } = getR2Config()
  const url = `${endpoint}/${bucketName}/${key}`
  const res = await client.fetch(url, { method: "GET" })

  if (!res.ok) {
    throw new Error(`R2 download failed: ${res.status} ${await res.text()}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600) {
  const { endpoint, bucketName, client } = getR2Config()
  const url = new URL(`${endpoint}/${bucketName}/${key}`)
  url.searchParams.set("X-Amz-Expires", String(expiresIn))

  const signed = await client.sign(url.toString(), {
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
  const { endpoint, bucketName, bucketUrl, client } = getR2Config()

  const url = `${endpoint}/${bucketName}/${key}`
  const headers: Record<string, string> = { "Content-Type": contentType }
  if (cacheControl) headers["Cache-Control"] = cacheControl

  const res = await client.fetch(url, {
    method: "PUT",
    headers,
    body: new Uint8Array(buffer),
  })

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`)
  }

  const mirror = await mirrorBestEffort({
    body: new Uint8Array(buffer),
    key,
    contentType,
    fileName: key.split("/").pop() || "image",
  })

  return {
    url: `${bucketUrl}/${key}`,
    key,
    mirror,
  }
}

export function getStorageBucketUrl(): string {
  return getR2Config().bucketUrl
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
