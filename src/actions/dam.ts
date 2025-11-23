"use server";

import { getDb } from "@/db";
import { assets } from "@/db/schema/assets";
import { services } from "@/db/schema/services";
import { assetServices } from "@/db/schema/asset_services";
import { assetTags } from "@/db/schema/asset_tags";
import { tags } from "@/db/schema/tags";
import { tagCategories } from "@/db/schema/tag_categories";
import { eq, desc, inArray } from "drizzle-orm";

export interface AssetWithTags {
  id: string;
  fileName: string;
  filePath: string;
  fileType: "image" | "video";
  uploadedAt: Date;
  teamMemberId: string | null;
  altText?: string | null;
  caption?: string | null;
  tags?: Array<{
    id: string;
    name: string;
    displayName: string;
    category: {
      id: string;
      name: string;
      displayName: string;
      color: string | null;
    };
  }>;
}

/**
 * Fetch assets associated with a specific service slug
 */
export async function getAssetsByServiceSlug(serviceSlug: string): Promise<AssetWithTags[]> {
  try {
    const db = getDb();

    // First get the service ID from slug
    const serviceResult = await db
      .select()
      .from(services)
      .where(eq(services.slug, serviceSlug))
      .limit(1);

    if (serviceResult.length === 0) {
      return [];
    }

    const serviceId = serviceResult[0].id;

    // Get all assets associated with this service
    const serviceAssets = await db
      .select({
        assetId: assetServices.assetId,
      })
      .from(assetServices)
      .where(eq(assetServices.serviceId, serviceId));

    const assetIds = serviceAssets.map((sa) => sa.assetId);

    if (assetIds.length === 0) {
      return [];
    }

    // Fetch the full asset details
    const fullAssets = await db
      .select()
      .from(assets)
      .where(inArray(assets.id, assetIds))
      .orderBy(desc(assets.uploadedAt));

    // Fetch asset tags for these assets
    const relevantAssetTags = await db
      .select({
        assetId: assetTags.assetId,
        tagId: assetTags.tagId,
        tagName: tags.name,
        tagDisplayName: tags.displayName,
        categoryId: tags.categoryId,
        categoryName: tagCategories.name,
        categoryDisplayName: tagCategories.displayName,
        categoryColor: tagCategories.color,
      })
      .from(assetTags)
      .where(inArray(assetTags.assetId, assetIds))
      .leftJoin(tags, eq(assetTags.tagId, tags.id))
      .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id));

    // Group tags by asset
    const assetTagsMap = new Map<string, any[]>();
    relevantAssetTags.forEach((row) => {
      if (!assetTagsMap.has(row.assetId)) {
        assetTagsMap.set(row.assetId, []);
      }
      assetTagsMap.get(row.assetId)!.push({
        id: row.tagId,
        name: row.tagName,
        displayName: row.tagDisplayName,
        category: {
          id: row.categoryId,
          name: row.categoryName,
          displayName: row.categoryDisplayName,
          color: row.categoryColor,
        },
      });
    });

    // Attach tags to assets
    const assetsWithTags = fullAssets.map((asset) => ({
      ...asset,
      tags: assetTagsMap.get(asset.id) || [],
    }));

    return assetsWithTags;
  } catch (error) {
    console.error("Error fetching assets by service:", error);
    return [];
  }
}

/**
 * Fetch assets associated with a specific team member
 */
export async function getAssetsByTeamMemberId(teamMemberId: string): Promise<AssetWithTags[]> {
  try {
    const db = getDb();

    // Fetch assets for this team member
    const teamAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.teamMemberId, teamMemberId))
      .orderBy(desc(assets.uploadedAt));

    // Fetch all asset tags
    const allAssetTags = await db
      .select({
        assetId: assetTags.assetId,
        tagId: assetTags.tagId,
        tagName: tags.name,
        tagDisplayName: tags.displayName,
        categoryId: tags.categoryId,
        categoryName: tagCategories.name,
        categoryDisplayName: tagCategories.displayName,
        categoryColor: tagCategories.color,
      })
      .from(assetTags)
      .leftJoin(tags, eq(assetTags.tagId, tags.id))
      .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id));

    // Group tags by asset
    const assetTagsMap = new Map<string, any[]>();
    allAssetTags.forEach((row) => {
      if (!assetTagsMap.has(row.assetId)) {
        assetTagsMap.set(row.assetId, []);
      }
      assetTagsMap.get(row.assetId)!.push({
        id: row.tagId,
        name: row.tagName,
        displayName: row.tagDisplayName,
        category: {
          id: row.categoryId,
          name: row.categoryName,
          displayName: row.categoryDisplayName,
          color: row.categoryColor,
        },
      });
    });

    // Attach tags to assets
    const assetsWithTags = teamAssets.map((asset) => ({
      ...asset,
      tags: assetTagsMap.get(asset.id) || [],
    }));

    return assetsWithTags;
  } catch (error) {
    console.error("Error fetching assets by team member:", error);
    return [];
  }
}
