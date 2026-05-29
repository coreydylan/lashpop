import { NextRequest, NextResponse } from "next/server"
import { getPresignedUploadUrl, generateAssetKey, getStorageBucketUrl } from "@/lib/dam/r2-client"
import { requireAdminApi } from "@/lib/admin/auth"

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

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
      url: `${getStorageBucketUrl()}/${key}`
    })
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    )
  }
}
