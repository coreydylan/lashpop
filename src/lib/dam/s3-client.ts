import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "lashpop-dam-assets"
const BUCKET_URL = process.env.NEXT_PUBLIC_S3_BUCKET_URL || `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-west-2"}.amazonaws.com`

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
