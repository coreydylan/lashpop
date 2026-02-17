import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { uploadFile, uploadBuffer, generateAssetKey } from "@/lib/dam/r2-client"
import { optimizeImage, isOptimizableImage, getOptimizedFilename } from "@/lib/dam/image-optimizer"

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024 // 200MB
const ALLOWED_MIME_PREFIXES = ["image/", "video/"]

// Images larger than this will be optimized
const OPTIMIZATION_THRESHOLD_BYTES = 500 * 1024 // 500KB

type UploadSuccess = {
  fileName: string
  status: "success"
  asset: typeof assets.$inferSelect
  optimized?: boolean
}

type UploadFailure = {
  fileName: string
  status: "error"
  errorCode: "NO_FILE" | "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE" | "UPLOAD_FAILED" | "DB_ERROR" | "OPTIMIZATION_FAILED"
  message: string
}

type UploadResult = UploadSuccess | UploadFailure

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const teamMemberId = formData.get("teamMemberId") as string | null
    const skipOptimization = formData.get("skipOptimization") === "true"

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
        const isImage = file.type.startsWith("image/")
        const shouldOptimize = !skipOptimization &&
          isImage &&
          isOptimizableImage(file.type) &&
          file.size > OPTIMIZATION_THRESHOLD_BYTES

        let uploadUrl = ''
        let uploadKey = ''
        let width: number | undefined
        let height: number | undefined
        let finalMimeType = file.type
        let finalFileSize = file.size
        let wasOptimized = false

        if (shouldOptimize) {
          try {
            // Optimize the image
            const fileBuffer = Buffer.from(await file.arrayBuffer())
            const optimized = await optimizeImage(fileBuffer, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 85,
              format: 'webp'
            })

            // Generate key with optimized filename
            const optimizedFilename = getOptimizedFilename(file.name, optimized.format)
            uploadKey = generateAssetKey(optimizedFilename, teamMemberId || undefined)

            // Upload optimized version
            const result = await uploadBuffer({
              buffer: optimized.buffer,
              key: uploadKey,
              contentType: optimized.mimeType
            })

            uploadUrl = result.url
            width = optimized.width
            height = optimized.height
            finalMimeType = optimized.mimeType
            finalFileSize = optimized.buffer.length
            wasOptimized = true

            console.log(`Optimized ${file.name}: ${file.size} -> ${finalFileSize} bytes (${Math.round((1 - finalFileSize/file.size) * 100)}% reduction)`)
          } catch (optimizationError) {
            console.error("Image optimization failed, uploading original:", optimizationError)
            // Fall through to upload original
          }
        }

        // If not optimized (either by choice or failure), upload original
        if (!wasOptimized) {
          uploadKey = generateAssetKey(file.name, teamMemberId || undefined)
          const result = await uploadFile({
            file,
            key: uploadKey,
            contentType: file.type
          })
          uploadUrl = result.url
        }

        try {
          const [asset] = await db
            .insert(assets)
            .values({
              fileName: file.name,
              filePath: uploadUrl,
              fileType: file.type.startsWith("video/") ? "video" : "image",
              mimeType: finalMimeType,
              fileSize: finalFileSize,
              width,
              height,
              teamMemberId: teamMemberId || undefined
            })
            .returning()

          results.push({
            fileName: file.name,
            status: "success",
            asset,
            optimized: wasOptimized
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
    const optimizedCount = successful.filter(r => r.optimized).length
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
        results,
        optimizedCount
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
