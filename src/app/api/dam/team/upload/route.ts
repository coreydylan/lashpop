import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { uploadBuffer, uploadFile, generateAssetKey } from "@/lib/dam/r2-client"
import { optimizeImage, isOptimizableImage, getOptimizedFilename } from "@/lib/dam/image-optimizer"

// Allow 5 minute execution for large uploads
export const maxDuration = 300

// Increase body size limit to 50MB for image uploads
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const teamMemberId = formData.get("teamMemberId") as string

    if (!files || files.length === 0 || !teamMemberId) {
      return NextResponse.json(
        { error: "Files and team member ID required" },
        { status: 400 }
      )
    }

    const db = getDb()
    const uploadedPhotos: (typeof teamMemberPhotos.$inferSelect)[] = []
    const errors: Array<{ fileName: string; error: string }> = []

    for (const file of files) {
      try {
        let uploadKey: string
        let uploadUrl: string
        let storedFileName = file.name

        if (isOptimizableImage(file.type)) {
          const buffer = Buffer.from(await file.arrayBuffer())
          const optimized = await optimizeImage(buffer, {
            maxWidth: 2400,
            maxHeight: 2400,
            quality: 85,
            format: 'webp',
          })
          storedFileName = getOptimizedFilename(file.name, optimized.format)
          uploadKey = generateAssetKey(storedFileName, teamMemberId)
          const result = await uploadBuffer({
            buffer: optimized.buffer,
            key: uploadKey,
            contentType: optimized.mimeType,
          })
          uploadUrl = result.url
        } else {
          uploadKey = generateAssetKey(file.name, teamMemberId)
          const result = await uploadFile({ file, key: uploadKey, contentType: file.type })
          uploadUrl = result.url
        }

        const [photo] = await db
          .insert(teamMemberPhotos)
          .values({
            teamMemberId,
            fileName: storedFileName,
            filePath: uploadUrl,
            isPrimary: false,
          })
          .returning()

        uploadedPhotos.push(photo)
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error)
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : "Upload failed"
        })
      }
    }

    // Return success if at least one file uploaded successfully
    if (uploadedPhotos.length > 0) {
      return NextResponse.json({
        success: true,
        photos: uploadedPhotos,
        errors: errors.length > 0 ? errors : undefined
      })
    } else {
      return NextResponse.json(
        { error: "All uploads failed", details: errors },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload photos" },
      { status: 500 }
    )
  }
}
