import { NextRequest, NextResponse } from "next/server"
import { getPresignedUploadUrl, generateAssetKey } from "@/lib/dam/s3-client"
import { requireAuth, requirePermission, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

export async function POST(request: NextRequest) {
  try {
    // Require authentication and upload permission
    const user = await requireAuth()
    await requirePermission('canUpload')

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
      url: `${process.env.NEXT_PUBLIC_S3_BUCKET_URL || `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`}/${key}`,
      uploadedBy: user.id // Include user ID for later asset creation
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error generating presigned URL:", error)
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    )
  }
}
