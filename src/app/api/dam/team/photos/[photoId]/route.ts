import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { eq } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"
import { deleteObject } from "@/lib/dam/r2-client"

export async function DELETE(request: NextRequest, context: any) {
  try {
    const photoId = await getRouteParam(context, "photoId")

    if (!photoId) {
      return NextResponse.json(
        { error: "Missing photoId" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get the photo to delete
    const [photo] = await db
      .select()
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.id, photoId))

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // Don't allow deleting the primary photo
    if (photo.isPrimary) {
      return NextResponse.json(
        { error: "Cannot delete the primary photo. Set a different photo as primary first." },
        { status: 400 }
      )
    }

    // If the photo is stored in R2, delete it from there too
    if (photo.filePath.startsWith('http')) {
      try {
        const url = new URL(photo.filePath)
        const key = url.pathname.substring(1) // Remove leading slash

        await deleteObject(key)

        // Also delete any crop URLs if they exist
        const cropUrls = [
          photo.cropSquareUrl,
          photo.cropCloseUpCircleUrl,
          photo.cropMediumCircleUrl,
          photo.cropFullVerticalUrl,
          photo.cropFullHorizontalUrl,
        ].filter(Boolean)

        for (const cropUrl of cropUrls) {
          try {
            const cropUrlObj = new URL(cropUrl!)
            const cropKey = cropUrlObj.pathname.substring(1)
            await deleteObject(cropKey)
          } catch {
            // Ignore errors deleting crop URLs
          }
        }
      } catch (r2Error) {
        console.error("Error deleting from R2:", r2Error)
        // Continue with database deletion even if R2 delete fails
      }
    }

    // Delete from database
    await db
      .delete(teamMemberPhotos)
      .where(eq(teamMemberPhotos.id, photoId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting photo:", error)
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    )
  }
}
