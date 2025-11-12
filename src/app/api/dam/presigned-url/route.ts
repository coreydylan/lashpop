import { NextRequest, NextResponse } from "next/server"
import { getPresignedUploadUrl, generateAssetKey } from "@/lib/dam/s3-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName, contentType, teamMemberId } = body

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" },
        { status: 400 }
      )
    }

    // Generate unique key for the file
    const key = generateAssetKey(fileName, teamMemberId)

    // Generate presigned URL (valid for 1 hour)
    const presignedUrl = await getPresignedUploadUrl(key, contentType, 3600)

    return NextResponse.json({
      presignedUrl,
      key,
      url: `${process.env.NEXT_PUBLIC_S3_BUCKET_URL || `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`}/${key}`
    })
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    )
  }
}
