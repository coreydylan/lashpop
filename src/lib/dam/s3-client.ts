import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

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

const AWS_REGION = requireEnv("AWS_REGION", "us-west-2")
const AWS_ACCESS_KEY_ID = requireEnv("AWS_ACCESS_KEY_ID")
const AWS_SECRET_ACCESS_KEY = requireEnv("AWS_SECRET_ACCESS_KEY")
const BUCKET_NAME = requireEnv("AWS_S3_BUCKET_NAME", "lashpop-dam-assets")
const BUCKET_URL =
  sanitizeEnvValue(process.env.NEXT_PUBLIC_S3_BUCKET_URL) ||
  `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
})

export interface UploadParams {
  file: File
  key: string
  contentType: string
}

export async function uploadToS3(params: UploadParams) {
  const { file, key, contentType } = params

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: contentType
  })

  await s3Client.send(command)

  return {
    url: `${BUCKET_URL}/${key}`,
    key
  }
}

export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  })

  await s3Client.send(command)
}

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
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
