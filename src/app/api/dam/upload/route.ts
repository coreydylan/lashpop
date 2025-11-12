import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { uploadToS3, generateAssetKey } from "@/lib/dam/s3-client"

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024 // 200MB
const ALLOWED_MIME_PREFIXES = ["image/", "video/"]

type UploadSuccess = {
  fileName: string
  status: "success"
  asset: typeof assets.$inferSelect
}

type UploadFailure = {
  fileName: string
  status: "error"
  errorCode: "NO_FILE" | "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE" | "UPLOAD_FAILED" | "DB_ERROR"
  message: string
}

type UploadResult = UploadSuccess | UploadFailure

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const teamMemberId = formData.get("teamMemberId") as string | null

    if (!files || files.length === 0) {
      const result: UploadFailure = {
        fileName: "",
        status: "error",
        errorCode: "NO_FILE",
        message: "No files provided"
      }

      return NextResponse.json(
        { success: false, assets: [], results: [result] },
        { status: 400 }
      )
    }

    const db = getDb()
    const results: UploadResult[] = []

    for (const file of files) {
      if (!ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
        results.push({
          fileName: file.name,
          status: "error",
          errorCode: "UNSUPPORTED_TYPE",
          message: "Only image and video uploads are supported."
        })
        continue
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        results.push({
          fileName: file.name,
          status: "error",
          errorCode: "FILE_TOO_LARGE",
          message: "File exceeds the 200MB size limit."
        })
        continue
      }

      try {
        const key = generateAssetKey(file.name, teamMemberId || undefined)

        const { url } = await uploadToS3({
          file,
          key,
          contentType: file.type
        })

        let width: number | undefined
        let height: number | undefined

        if (file.type.startsWith("image/")) {
          // Note: In production, you'd want to use sharp or similar to get actual dimensions
          // For now, we'll leave it undefined and can update later
        }

        try {
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

          results.push({
            fileName: file.name,
            status: "success",
            asset
          })
        } catch (dbError) {
          console.error("Database insert error:", dbError)
          results.push({
            fileName: file.name,
            status: "error",
            errorCode: "DB_ERROR",
            message: "Failed to save asset metadata."
          })
        }
      } catch (uploadError) {
        console.error("Upload error:", uploadError)
        results.push({
          fileName: file.name,
          status: "error",
          errorCode: "UPLOAD_FAILED",
          message: "Upload to storage failed. Please retry."
        })
      }
    }

    const successful = results.filter(
      (result): result is UploadSuccess => result.status === "success"
    )
    const status =
      successful.length === 0
        ? 400
        : successful.length === results.length
          ? 200
          : 207

    return NextResponse.json(
      {
        success: successful.length === results.length,
        assets: successful.map((result) => result.asset),
        results
      },
      { status }
    )
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    )
  }
}
