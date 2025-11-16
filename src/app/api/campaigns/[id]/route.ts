import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { campaigns } from "@/db/schema/campaigns"
import { campaignAssets } from "@/db/schema/campaign_assets"
import { eq } from "drizzle-orm"

/**
 * GET /api/campaigns/[id]
 * Get a specific campaign with all its assets
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch campaign
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .then(rows => rows[0])

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      )
    }

    // Fetch campaign assets
    const assets = await db
      .select()
      .from(campaignAssets)
      .where(eq(campaignAssets.campaignId, id))
      .orderBy(campaignAssets.sortOrder)

    return NextResponse.json({
      success: true,
      campaign,
      assets
    })
  } catch (error) {
    console.error("[API] Error fetching campaign:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaign" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/campaigns/[id]
 * Update campaign status or data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const [updatedCampaign] = await db
      .update(campaigns)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, id))
      .returning()

    if (!updatedCampaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign
    })
  } catch (error) {
    console.error("[API] Error updating campaign:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update campaign" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete a campaign and all its assets
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete campaign (cascade will delete assets)
    await db
      .delete(campaigns)
      .where(eq(campaigns.id, id))

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error("[API] Error deleting campaign:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete campaign" },
      { status: 500 }
    )
  }
}
