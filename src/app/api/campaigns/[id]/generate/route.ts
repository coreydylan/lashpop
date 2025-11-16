import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { campaigns } from "@/db/schema/campaigns"
import { campaignAssets } from "@/db/schema/campaign_assets"
import { assets } from "@/db/schema/assets"
import { eq } from "drizzle-orm"
import { ConductorAgent } from "@/lib/ai/conductor-agent"
import { ParallelGenerationOrchestrator } from "@/lib/ai/generation-agent"
import { BatchQualityControl } from "@/lib/ai/quality-control-agent"
import type { CampaignBriefInput } from "@/types/campaign"

/**
 * POST /api/campaigns/[id]/generate
 * Generate campaign assets using AI orchestration
 *
 * This is the main orchestration endpoint that:
 * 1. Creates detailed brief with Conductor agent
 * 2. Generates assets in parallel with Specialist agents
 * 3. Validates with Quality Control agent
 * 4. Saves results to database
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params

    console.log(`[API] Starting campaign generation for ${campaignId}`)

    // Fetch campaign
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .then(rows => rows[0])

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      )
    }

    // Update status to generating_brief
    await db
      .update(campaigns)
      .set({ status: "generating_brief", updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId))

    // Step 1: Create detailed brief with Conductor agent
    const conductor = new ConductorAgent()

    // Fetch brand assets and inspiration from database
    const brandAssetIds = [
      ...(campaign.brandAssets?.logos || []),
      ...(campaign.brandAssets?.colors || []),
      ...(campaign.brandAssets?.typography || []),
      ...(campaign.brandAssets?.guidelines || [])
    ]

    const inspirationAssetIds = [
      ...(campaign.inspiration?.photos || []),
      ...(campaign.inspiration?.styleReferences || []),
      ...(campaign.inspiration?.competitors || [])
    ]

    const brandAssets = brandAssetIds.length > 0
      ? await db.select().from(assets).where(eq(assets.id, brandAssetIds[0])) // Simplified for now
      : []

    const inspirationAssets = inspirationAssetIds.length > 0
      ? await db.select().from(assets).where(eq(assets.id, inspirationAssetIds[0])) // Simplified for now
      : []

    // Create campaign brief input
    const briefInput: CampaignBriefInput = {
      campaignName: campaign.name,
      objective: campaign.description || "",
      platforms: ['instagram', 'tiktok'], // TODO: Get from campaign data
      brandAssets: campaign.brandAssets || {},
      inspiration: campaign.inspiration || {},
      requirements: campaign.requirements || {}
    }

    // Generate detailed brief
    const detailedBrief = await conductor.createDetailedBrief(
      briefInput,
      brandAssets,
      inspirationAssets
    )

    // Save brief to campaign
    await db
      .update(campaigns)
      .set({
        creativeBrief: detailedBrief,
        status: "brief_ready",
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))

    // Update status to generating_assets
    await db
      .update(campaigns)
      .set({ status: "generating_assets", updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId))

    // Step 2: Generate assets in parallel
    const orchestrator = new ParallelGenerationOrchestrator(detailedBrief, 3) // Max 3 concurrent

    const generatedAssets = await orchestrator.generateAll((progress) => {
      console.log(`[API] Generation progress: ${progress.completed}/${progress.total}`)
      // In production, this would publish to a websocket or SSE endpoint for real-time updates
    })

    // Update metadata
    const totalCost = generatedAssets.reduce((sum, a) => sum + a.metadata.cost, 0)
    const totalTime = Math.max(...generatedAssets.map(a => a.metadata.generationTime))

    await db
      .update(campaigns)
      .set({
        generationMetadata: {
          totalAssets: detailedBrief.assets.length,
          generatedAssets: generatedAssets.length,
          failedAssets: detailedBrief.assets.length - generatedAssets.length,
          refinedAssets: 0,
          totalCost,
          totalTime,
          iterations: 0
        },
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))

    // Step 3: Quality control
    await db
      .update(campaigns)
      .set({ status: "quality_check", updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId))

    const qc = new BatchQualityControl()
    const qcResults = await qc.validateAll(generatedAssets, detailedBrief, (completed, total) => {
      console.log(`[API] QC progress: ${completed}/${total}`)
    })

    // Step 4: Save assets to database
    for (let i = 0; i < generatedAssets.length; i++) {
      const generatedAsset = generatedAssets[i]
      const qcResult = qcResults[i]
      const assetSpec = detailedBrief.assets[i]

      // First, create the asset record
      const [newAsset] = await db
        .insert(assets)
        .values({
          fileName: `${campaign.name}-${assetSpec.role}-${i + 1}.png`,
          filePath: generatedAsset.url,
          fileType: "image",
          mimeType: "image/png",
          fileSize: 0, // Would need to fetch and measure
          width: 1024, // From generation
          height: 1024,
          caption: assetSpec.purpose
        })
        .returning()

      // Then create the campaign asset record
      await db
        .insert(campaignAssets)
        .values({
          campaignId,
          assetId: newAsset.id,
          role: assetSpec.role as any,
          purpose: assetSpec.purpose,
          platform: assetSpec.platform,
          variant: assetSpec.variant,
          assetSpec: assetSpec.specs,
          status: qcResult.passed ? "generated" : "failed",
          generationPrompt: generatedAsset.metadata.prompt,
          generationModel: generatedAsset.metadata.model,
          generationCost: generatedAsset.metadata.cost,
          generationTime: generatedAsset.metadata.generationTime,
          generationAttempts: generatedAsset.metadata.attempt,
          qualityCheckResults: {
            score: qcResult.score,
            passed: qcResult.passed,
            checks: qcResult.checks,
            feedback: qcResult.feedback,
            requiresRefinement: qcResult.requiresRefinement
          },
          sortOrder: i
        })
    }

    // Update campaign status to review
    await db
      .update(campaigns)
      .set({ status: "review", updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId))

    console.log(`[API] Campaign generation complete for ${campaignId}`)

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaignId,
        status: "review",
        generatedAssets: generatedAssets.length,
        passedQC: qcResults.filter(r => r.passed).length,
        failedQC: qcResults.filter(r => !r.passed).length
      }
    })
  } catch (error) {
    console.error("[API] Error generating campaign:", error)

    // Update campaign to failed state
    const { id: campaignId } = await params
    await db
      .update(campaigns)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId))

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate campaign"
      },
      { status: 500 }
    )
  }
}
