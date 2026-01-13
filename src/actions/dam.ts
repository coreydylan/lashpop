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
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  teamMemberId: string | null;
  color: "brown" | "black" | null;
  length: "S" | "M" | "L" | null;
  curl: "1" | "2" | "3" | "4" | null;
  altText: string | null;
  caption: string | null;
  externalId: string | null;
  source: string | null;
  sourceMetadata: unknown;
  uploadedAt: Date;
  updatedAt: Date;
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

/**
 * Fetch assets by tag names (e.g., "classic", "volume", "wet-angel")
 * Used for Find Your Look quiz to get sample images
 */
export async function getAssetsByTagNames(tagNames: string[]): Promise<Record<string, AssetWithTags[]>> {
  try {
    const db = getDb();

    // Fetch all tags matching the names
    const matchingTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        displayName: tags.displayName,
        categoryId: tags.categoryId,
      })
      .from(tags)
      .where(inArray(tags.name, tagNames));

    if (matchingTags.length === 0) {
      return {};
    }

    const tagIds = matchingTags.map((t) => t.id);
    const tagNameMap = new Map(matchingTags.map((t) => [t.id, t.name]));

    // Fetch asset tags for matching tags
    const relevantAssetTags = await db
      .select({
        assetId: assetTags.assetId,
        tagId: assetTags.tagId,
      })
      .from(assetTags)
      .where(inArray(assetTags.tagId, tagIds));

    if (relevantAssetTags.length === 0) {
      return {};
    }

    // Group asset IDs by tag name
    const assetIdsByTag = new Map<string, string[]>();
    relevantAssetTags.forEach((row) => {
      const tagName = tagNameMap.get(row.tagId);
      if (tagName) {
        if (!assetIdsByTag.has(tagName)) {
          assetIdsByTag.set(tagName, []);
        }
        assetIdsByTag.get(tagName)!.push(row.assetId);
      }
    });

    // Fetch all unique asset IDs
    const allAssetIds = Array.from(new Set(relevantAssetTags.map((r) => r.assetId)));

    // Fetch the full asset details
    const fullAssets = await db
      .select()
      .from(assets)
      .where(inArray(assets.id, allAssetIds))
      .orderBy(desc(assets.uploadedAt));

    // Create asset map for quick lookup
    const assetMap = new Map(fullAssets.map((a) => [a.id, a]));

    // Fetch all tags for these assets (for complete tag info)
    const allAssetTagsData = await db
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
      .where(inArray(assetTags.assetId, allAssetIds))
      .leftJoin(tags, eq(assetTags.tagId, tags.id))
      .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id));

    // Group tags by asset
    const assetTagsMap = new Map<string, any[]>();
    allAssetTagsData.forEach((row) => {
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

    // Build result object grouped by tag name
    const result: Record<string, AssetWithTags[]> = {};

    assetIdsByTag.forEach((assetIds, tagName) => {
      const assetsForTag: AssetWithTags[] = [];
      assetIds.forEach((id) => {
        const asset = assetMap.get(id);
        if (asset) {
          assetsForTag.push({
            ...asset,
            tags: assetTagsMap.get(id) || [],
          });
        }
      });
      result[tagName] = assetsForTag;
    });

    return result;
  } catch (error) {
    console.error("Error fetching assets by tag names:", error);
    return {};
  }
}

/**
 * Get random assets for quiz (general lash images)
 * Returns up to `limit` random image assets
 */
export async function getRandomLashAssets(limit: number = 8): Promise<AssetWithTags[]> {
  try {
    const db = getDb();

    // Fetch all image assets
    const allImages = await db
      .select()
      .from(assets)
      .where(eq(assets.fileType, "image"))
      .orderBy(desc(assets.uploadedAt))
      .limit(limit * 3); // Fetch more to allow for randomization

    if (allImages.length === 0) {
      return [];
    }

    // Shuffle and take limit
    const shuffled = allImages.sort(() => Math.random() - 0.5).slice(0, limit);
    const assetIds = shuffled.map((a) => a.id);

    // Fetch tags for these assets
    const allAssetTagsData = await db
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
    allAssetTagsData.forEach((row) => {
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

    return shuffled.map((asset) => ({
      ...asset,
      tags: assetTagsMap.get(asset.id) || [],
    }));
  } catch (error) {
    console.error("Error fetching random lash assets:", error);
    return [];
  }
}
