import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { teamMembers } from "@/db/schema/team_members"
import { eq } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

type PhotoRouteContext = {
  params: Promise<{ photoId: string }>
}

function safeStoragePath(value: string): string {
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`
  } catch {
    return value.split(/[?#]/, 1)[0]
  }
}

export async function POST(request: NextRequest, context: PhotoRouteContext) {
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const teamMemberId = typeof body.teamMemberId === "string" ? body.teamMemberId : ""
    const photoId = await getRouteParam(context, "photoId")

    if (!photoId || !teamMemberId) {
      return NextResponse.json(
        { error: "Missing photoId or teamMemberId" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get the photo being set as primary
    const [photo] = await db
      .select()
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.id, photoId))

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }
    if (photo.teamMemberId !== teamMemberId) {
      return NextResponse.json(
        { error: "Photo does not belong to this team member" },
        { status: 400 }
      )
    }

    const beforePhotos = await db
      .select({ id: teamMemberPhotos.id, isPrimary: teamMemberPhotos.isPrimary })
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.teamMemberId, teamMemberId))
    const [beforeTeamMember] = await db
      .select({ id: teamMembers.id, imageUrl: teamMembers.imageUrl })
      .from(teamMembers)
      .where(eq(teamMembers.id, teamMemberId))

    // Unset all other photos as primary for this team member
    await db
      .update(teamMemberPhotos)
      .set({ isPrimary: false })
      .where(eq(teamMemberPhotos.teamMemberId, teamMemberId))

    // Set this photo as primary
    await db
      .update(teamMemberPhotos)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(eq(teamMemberPhotos.id, photoId))

    // SYNC MECHANISM: Update team member's imageUrl to keep it in sync with primary photo
    // This ensures the team member record always points to the current primary photo
    // and maintains consistency across the platform
    await db
      .update(teamMembers)
      .set({ imageUrl: photo.filePath, updatedAt: new Date() })
      .where(eq(teamMembers.id, teamMemberId))

    const afterPhotos = await db
      .select({ id: teamMemberPhotos.id, isPrimary: teamMemberPhotos.isPrimary })
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.teamMemberId, teamMemberId))
    const [afterTeamMember] = await db
      .select({ id: teamMembers.id, imageUrl: teamMembers.imageUrl })
      .from(teamMembers)
      .where(eq(teamMembers.id, teamMemberId))

    await recordAdminAction({
      action: "dam.team.photo.primary.set",
      surface: "dam",
      targetType: "team_member_photo",
      targetId: photoId,
      actorUserId: auth.userId,
      diff: {
        teamMemberId,
        before: {
          photos: beforePhotos,
          teamMember: beforeTeamMember
            ? { ...beforeTeamMember, imageUrl: safeStoragePath(beforeTeamMember.imageUrl) }
            : null,
        },
        after: {
          photos: afterPhotos,
          teamMember: afterTeamMember
            ? { ...afterTeamMember, imageUrl: safeStoragePath(afterTeamMember.imageUrl) }
            : null,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting primary:", error)
    return NextResponse.json(
      { error: "Failed to set primary photo" },
      { status: 500 }
    )
  }
}
