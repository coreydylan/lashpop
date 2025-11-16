"use server";

import { getDb } from "@/db";
import { assets } from "@/db/schema/assets";
import { services } from "@/db/schema/services";
import { assetServices } from "@/db/schema/asset_services";
import { assetTags } from "@/db/schema/asset_tags";
import { tags } from "@/db/schema/tags";
import { tagCategories } from "@/db/schema/tag_categories";
import { eq, desc, inArray, and, gte, isNotNull } from "drizzle-orm";
import { SocialPlatform, SocialVariantFilters } from "@/types/social-variants";

export interface AssetWithTags {
  id: string;
  fileName: string;
  filePath: string;
  fileType: "image" | "video";
  uploadedAt: Date;
  teamMemberId: string | null;
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
 * Fetch social variant assets by source asset ID
 */
export async function getSocialVariantsBySource(sourceAssetId: string) {
  try {
    const db = getDb();

    // Fetch all variants for this source asset
    const variants = await db
      .select()
      .from(assets)
      .where(eq(assets.sourceAssetId, sourceAssetId))
      .orderBy(desc(assets.uploadedAt));

    return variants;
  } catch (error) {
    console.error("Error fetching social variants by source:", error);
    return [];
  }
}

/**
 * Fetch social variant assets by platform with optional filters
 */
export async function getSocialVariantsByPlatform(
  platform: SocialPlatform,
  filters?: SocialVariantFilters
) {
  try {
    const db = getDb();

    // Build where conditions
    const conditions = [eq(assets.platform, platform)];

    if (filters?.variant) {
      if (Array.isArray(filters.variant)) {
        conditions.push(inArray(assets.variant, filters.variant));
      } else {
        conditions.push(eq(assets.variant, filters.variant));
      }
    }

    if (filters?.ratio) {
      if (Array.isArray(filters.ratio)) {
        conditions.push(inArray(assets.ratio, filters.ratio));
      } else {
        conditions.push(eq(assets.ratio, filters.ratio));
      }
    }

    if (filters?.cropStrategy) {
      if (Array.isArray(filters.cropStrategy)) {
        conditions.push(inArray(assets.cropStrategy, filters.cropStrategy));
      } else {
        conditions.push(eq(assets.cropStrategy, filters.cropStrategy));
      }
    }

    if (filters?.exported !== undefined) {
      conditions.push(eq(assets.exported, filters.exported));
    }

    if (filters?.minValidationScore !== undefined) {
      conditions.push(gte(assets.validationScore, filters.minValidationScore));
    }

    if (filters?.sourceAssetId) {
      if (Array.isArray(filters.sourceAssetId)) {
        conditions.push(inArray(assets.sourceAssetId, filters.sourceAssetId));
      } else {
        conditions.push(eq(assets.sourceAssetId, filters.sourceAssetId));
      }
    }

    // Fetch variants with all conditions
    const variants = await db
      .select()
      .from(assets)
      .where(and(...conditions))
      .orderBy(desc(assets.uploadedAt));

    return variants;
  } catch (error) {
    console.error("Error fetching social variants by platform:", error);
    return [];
  }
}

/**
 * Fetch all social variant assets (assets with sourceAssetId set)
 */
export async function getAllSocialVariants(filters?: SocialVariantFilters) {
  try {
    const db = getDb();

    // Build where conditions
    const conditions = [isNotNull(assets.sourceAssetId)];

    if (filters?.platform) {
      if (Array.isArray(filters.platform)) {
        conditions.push(inArray(assets.platform, filters.platform));
      } else {
        conditions.push(eq(assets.platform, filters.platform));
      }
    }

    if (filters?.variant) {
      if (Array.isArray(filters.variant)) {
        conditions.push(inArray(assets.variant, filters.variant));
      } else {
        conditions.push(eq(assets.variant, filters.variant));
      }
    }

    if (filters?.ratio) {
      if (Array.isArray(filters.ratio)) {
        conditions.push(inArray(assets.ratio, filters.ratio));
      } else {
        conditions.push(eq(assets.ratio, filters.ratio));
      }
    }

    if (filters?.cropStrategy) {
      if (Array.isArray(filters.cropStrategy)) {
        conditions.push(inArray(assets.cropStrategy, filters.cropStrategy));
      } else {
        conditions.push(eq(assets.cropStrategy, filters.cropStrategy));
      }
    }

    if (filters?.exported !== undefined) {
      conditions.push(eq(assets.exported, filters.exported));
    }

    if (filters?.minValidationScore !== undefined) {
      conditions.push(gte(assets.validationScore, filters.minValidationScore));
    }

    if (filters?.sourceAssetId) {
      if (Array.isArray(filters.sourceAssetId)) {
        conditions.push(inArray(assets.sourceAssetId, filters.sourceAssetId));
      } else {
        conditions.push(eq(assets.sourceAssetId, filters.sourceAssetId));
      }
    }

    // Fetch all social variants with conditions
    const variants = await db
      .select()
      .from(assets)
      .where(and(...conditions))
      .orderBy(desc(assets.uploadedAt));

    return variants;
  } catch (error) {
    console.error("Error fetching all social variants:", error);
    return [];
  }
}
