import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { uploadToS3, generateAssetKey } from "@/lib/dam/s3-client"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const teamMemberId = formData.get("teamMemberId") as string

    if (!file || !teamMemberId) {
      return NextResponse.json(
        { error: "File and team member ID required" },
        { status: 400 }
      )
    }

    // Upload to S3
    const key = generateAssetKey(file.name, teamMemberId)
    const { url } = await uploadToS3({
      file,
      key,
      contentType: file.type
    })

    // Save to database
    const db = getDb()
    const [photo] = await db
      .insert(teamMemberPhotos)
      .values({
        teamMemberId,
        fileName: file.name,
        filePath: url,
        isPrimary: false
      })
      .returning()

    return NextResponse.json({
      success: true,
      photo
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    )
  }
}
