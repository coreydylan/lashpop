import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { campaigns } from "@/db/schema/campaigns"
import { eq, desc } from "drizzle-orm"
import type { CampaignBriefInput } from "@/types/campaign"

/**
 * GET /api/campaigns
 * List all campaigns
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const objective = searchParams.get('objective')

    let query = db.select().from(campaigns).orderBy(desc(campaigns.createdAt))

    if (status) {
      query = query.where(eq(campaigns.status, status as any))
    }

    if (objective) {
      query = query.where(eq(campaigns.objective, objective as any))
    }

    const allCampaigns = await query

    return NextResponse.json({
      success: true,
      campaigns: allCampaigns
    })
  } catch (error) {
    console.error("[API] Error fetching campaigns:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaigns" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CampaignBriefInput & {
      createdBy?: string
    }

    // Validate required fields
    if (!body.campaignName || !body.objective) {
      return NextResponse.json(
        { success: false, error: "Campaign name and objective are required" },
        { status: 400 }
      )
    }

    // Create campaign record
    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        name: body.campaignName,
        description: body.objective,
        objective: body.objective as any,
        status: "draft",
        createdBy: body.createdBy,
        brandAssets: body.brandAssets,
        inspiration: body.inspiration,
        requirements: body.requirements,
        generationMetadata: {
          totalAssets: body.requirements?.deliverables?.length || 0,
          generatedAssets: 0,
          failedAssets: 0,
          refinedAssets: 0,
          totalCost: 0,
          totalTime: 0,
          iterations: 0
        }
      })
      .returning()

    return NextResponse.json({
      success: true,
      campaign: newCampaign
    })
  } catch (error) {
    console.error("[API] Error creating campaign:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    )
  }
}
