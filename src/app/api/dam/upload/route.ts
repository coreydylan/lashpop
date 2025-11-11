import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { uploadToS3, generateAssetKey } from "@/lib/dam/s3-client"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const teamMemberId = formData.get("teamMemberId") as string | null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadPromises = files.map(async (file) => {
      const key = generateAssetKey(file.name, teamMemberId || undefined)

      // Upload to S3
      const { url } = await uploadToS3({
        file,
        key,
        contentType: file.type
      })

      // Get image dimensions if it's an image
      let width: number | undefined
      let height: number | undefined

      if (file.type.startsWith("image/")) {
        // Note: In production, you'd want to use sharp or similar to get actual dimensions
        // For now, we'll leave it undefined and can update later
      }

      // Save to database
      const db = getDb()
      const [asset] = await db
        .insert(assets)
        .values({
          fileName: file.name,
          filePath: url,
          fileType: file.type.startsWith("video/") ? "video" : "image",
          mimeType: file.type,
          fileSize: file.size,
          width,
          height,
          teamMemberId: teamMemberId || undefined
        })
        .returning()

      return asset
    })

    const uploadedAssets = await Promise.all(uploadPromises)

    return NextResponse.json({
      success: true,
      assets: uploadedAssets
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    )
  }
}
