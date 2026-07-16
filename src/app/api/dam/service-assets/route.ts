import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assetServices } from "@/db/schema/asset_services"
import { eq } from "drizzle-orm"
import { requireAdminApi } from "@/lib/admin/auth"

/**
 * Get asset IDs that are tagged for a specific service
 * This powers the "For This Service" view in the hero image picker
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')

    if (!serviceId) {
      return NextResponse.json(
        { error: "serviceId is required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get all asset IDs associated with this service
    const serviceAssetRows = await db
      .select({
        assetId: assetServices.assetId,
      })
      .from(assetServices)
      .where(eq(assetServices.serviceId, serviceId))

    const assetIds = serviceAssetRows.map(row => row.assetId)

    return NextResponse.json({
      assetIds,
      count: assetIds.length
    }, {
      headers: {
        'Cache-Control': 'private, no-store'
      }
    })
  } catch (error) {
    console.error("Error fetching service assets:", error)
    return NextResponse.json(
      { error: "Failed to fetch service assets" },
      { status: 500 }
    )
  }
}
