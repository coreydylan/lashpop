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

interface BaseStorageConfig {
  bucketName: string
  bucketUrl: string
}

interface ProxyStorageConfig extends BaseStorageConfig {
  kind: "proxy"
  proxyUrl: string
  proxyToken: string
}

interface R2Config extends BaseStorageConfig {
  kind: "r2"
  endpoint: string
  client: AwsClient
}

type StorageConfig = ProxyStorageConfig | R2Config

let cachedConfig: StorageConfig | undefined

function getStorageConfig(): StorageConfig {
  if (cachedConfig) return cachedConfig

  const bucketName = requireEnv("R2_BUCKET_NAME", "lashpop-dam")
  const proxyUrl = sanitizeEnvValue(process.env.R2_PROXY_URL)?.replace(/\/+$/, "")
  const proxyToken = sanitizeEnvValue(process.env.R2_PROXY_TOKEN)
  const bucketUrl =
    sanitizeEnvValue(process.env.NEXT_PUBLIC_R2_BUCKET_URL) ||
    (proxyUrl ? proxyUrl : undefined)

  if (proxyUrl || proxyToken) {
    if (!proxyUrl || !proxyToken) {
      throw new Error("R2_PROXY_URL and R2_PROXY_TOKEN must be configured together")
    }

    cachedConfig = {
      kind: "proxy",
      bucketName,
      bucketUrl: bucketUrl || proxyUrl,
      proxyUrl,
      proxyToken,
    }
    return cachedConfig
  }

  const accountId = requireEnv("R2_ACCOUNT_ID")
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID")
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY")

  cachedConfig = {
    kind: "r2",
    bucketName,
    bucketUrl: bucketUrl || `https://${bucketName}.${accountId}.r2.dev`,
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

function proxyObjectUrl(config: ProxyStorageConfig, key: string): string {
  return `${config.proxyUrl}/__storage/${key.split("/").map(encodeURIComponent).join("/")}`
}

async function proxyFetch(
  config: ProxyStorageConfig,
  key: string,
  init: RequestInit,
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${config.proxyToken}`)
  return fetch(proxyObjectUrl(config, key), { ...init, headers })
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

export async function uploadFile(params: UploadParams) {
  const { file, key, contentType } = params
  const body = new Uint8Array(await file.arrayBuffer())
  const config = getStorageConfig()

  const res = config.kind === "proxy"
    ? await proxyFetch(config, key, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body,
      })
    : await config.client.fetch(`${config.endpoint}/${config.bucketName}/${key}`, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body,
  })

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`)
  }

  return {
    url: `${config.bucketUrl}/${key}`,
    key
  }
}

export async function uploadBuffer(params: UploadBufferParams) {
  const { buffer, key, contentType } = params
  const config = getStorageConfig()

  const body = new Uint8Array(buffer)
  const res = config.kind === "proxy"
    ? await proxyFetch(config, key, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body,
      })
    : await config.client.fetch(`${config.endpoint}/${config.bucketName}/${key}`, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body,
      })

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`)
  }

  return {
    url: `${config.bucketUrl}/${key}`,
    key
  }
}

export async function deleteObject(key: string) {
  const config = getStorageConfig()
  const res = config.kind === "proxy"
    ? await proxyFetch(config, key, { method: "DELETE" })
    : await config.client.fetch(`${config.endpoint}/${config.bucketName}/${key}`, { method: "DELETE" })

  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed: ${res.status} ${await res.text()}`)
  }
}

export async function downloadBuffer(key: string): Promise<Buffer> {
  const config = getStorageConfig()
  const res = config.kind === "proxy"
    ? await proxyFetch(config, key, { method: "GET" })
    : await config.client.fetch(`${config.endpoint}/${config.bucketName}/${key}`, { method: "GET" })

  if (!res.ok) {
    throw new Error(`R2 download failed: ${res.status} ${await res.text()}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600) {
  const config = getStorageConfig()
  if (config.kind === "proxy") {
    throw new Error("Presigned browser uploads are disabled for isolated storage")
  }

  const url = new URL(`${config.endpoint}/${config.bucketName}/${key}`)
  url.searchParams.set("X-Amz-Expires", String(expiresIn))

  const signed = await config.client.sign(url.toString(), {
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
  const config = getStorageConfig()

  const headers: Record<string, string> = { "Content-Type": contentType }
  if (cacheControl) headers["Cache-Control"] = cacheControl

  const body = new Uint8Array(buffer)
  const res = config.kind === "proxy"
    ? await proxyFetch(config, key, { method: "PUT", headers, body })
    : await config.client.fetch(`${config.endpoint}/${config.bucketName}/${key}`, {
        method: "PUT",
        headers,
        body,
      })

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`)
  }

  return {
    url: `${config.bucketUrl}/${key}`,
    key
  }
}

export function getStorageBucketUrl(): string {
  return getStorageConfig().bucketUrl
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
