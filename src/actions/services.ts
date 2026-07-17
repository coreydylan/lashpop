"use server"

import { getDb } from "@/db"
import { services } from "@/db/schema/services"
import { serviceCategories } from "@/db/schema/service_categories"
import { vagaroServiceCategories } from "@/db/schema/vagaro_service_categories"
import { vagaroCategoryMappings } from "@/db/schema/vagaro_category_mappings"
import { vagaroSyncRuns } from "@/db/schema/vagaro_sync_runs"
import { serviceSubcategories } from "@/db/schema/service_subcategories"
import { assetServices } from "@/db/schema/asset_services"
import { assets } from "@/db/schema/assets"
import { requireAdminRole } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"
import { and, eq, asc, desc, inArray, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/sqlite-core"

export async function getServices() {
  const db = getDb()

  const allServices = await db
    .select({
      id: services.id,
      categoryId: services.categoryId,
      name: services.name,
      displayTitle: services.name,
      slug: services.slug,
      subtitle: services.subtitle,
      description: sql<string | null>`COALESCE(${services.description}, ${services.vagaroDescription})`,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      // Vagaro is source of truth; fall back to local override then nothing
      imageUrl: sql<string | null>`COALESCE(${services.vagaroImageUrl}, ${services.imageUrl})`,
      color: services.color,
      displayOrder: services.displayOrder,
      category: serviceCategories.slug
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(eq(services.isActive, true))
    .orderBy(services.displayOrder)

  return allServices
}

export async function getServiceBySlug(slug: string) {
  const db = getDb()

  const result = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      subtitle: services.subtitle,
      description: sql<string | null>`COALESCE(${services.description}, ${services.vagaroDescription})`,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      // Vagaro is source of truth; fall back to local override then nothing
      imageUrl: sql<string | null>`COALESCE(${services.vagaroImageUrl}, ${services.imageUrl})`,
      color: services.color,
      categoryId: services.categoryId,
      categoryName: serviceCategories.name,
      categorySlug: serviceCategories.slug,
      subcategoryId: services.subcategoryId,
      subcategoryName: serviceSubcategories.name,
      subcategorySlug: serviceSubcategories.slug,
      vagaroWidgetUrl: services.vagaroWidgetUrl,
      vagaroServiceCode: services.vagaroServiceCode,
      vagaroServiceId: services.vagaroServiceId,
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .leftJoin(serviceSubcategories, eq(services.subcategoryId, serviceSubcategories.id))
    .where(and(eq(services.slug, slug), eq(services.isActive, true)))
    .limit(1)

  return result[0] || null
}

export async function getServicesByCategory(categorySlug: string) {
  const db = getDb()

  const categoryResult = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.slug, categorySlug))
    .limit(1)

  if (categoryResult.length === 0) {
    return []
  }

  const categoryServices = await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.categoryId, categoryResult[0].id),
        eq(services.isActive, true)
      )
    )
    .orderBy(services.displayOrder)

  return categoryServices
}

export async function getAllServices() {
  const db = getDb()

  // Create aliases for assets table to join twice
  const serviceKeyImage = alias(assets, "service_key_image")
  const subcategoryKeyImage = alias(assets, "subcategory_key_image")

  const allServices = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      subtitle: services.subtitle,
      description: sql<string | null>`COALESCE(${services.description}, ${services.vagaroDescription})`,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      // Resolve image URL with priority: Vagaro (source of truth) -> DAM override -> Subcategory fallback
      imageUrl: sql<string | null>`COALESCE(
        ${services.vagaroImageUrl},
        ${serviceKeyImage.filePath},
        ${subcategoryKeyImage.filePath}
      )`,
      color: services.color,
      displayOrder: services.displayOrder,
      categoryId: services.categoryId,
      categoryName: serviceCategories.name,
      categorySlug: serviceCategories.slug,
      subcategoryId: services.subcategoryId,
      subcategoryName: serviceSubcategories.name,
      subcategorySlug: serviceSubcategories.slug,
      subcategoryDisplayOrder: serviceSubcategories.displayOrder,
      vagaroWidgetUrl: services.vagaroWidgetUrl,
      vagaroServiceCode: services.vagaroServiceCode,
      keyImageAssetId: services.keyImageAssetId,
      useDemoPhotos: services.useDemoPhotos,
      isActive: services.isActive,
      vagaroServiceId: services.vagaroServiceId,
      lastSyncedAt: services.lastSyncedAt,
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .leftJoin(serviceSubcategories, eq(services.subcategoryId, serviceSubcategories.id))
    .leftJoin(serviceKeyImage, eq(services.keyImageAssetId, serviceKeyImage.id))
    .leftJoin(subcategoryKeyImage, eq(serviceSubcategories.keyImageAssetId, subcategoryKeyImage.id))
    .where(eq(services.isActive, true))
    .orderBy(asc(services.displayOrder))

  return allServices
}

// Get all services including inactive ones (for admin)
export async function getAllServicesAdmin() {
  await requireAdminRole('owner', 'publisher', 'viewer')
  const db = getDb()

  // Create aliases for assets table to join
  const serviceKeyImage = alias(assets, "service_key_image")
  const subcategoryKeyImage = alias(assets, "subcategory_key_image")

  const allServices = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      subtitle: services.subtitle,
      // Admin view shows both fields so editors can see what Vagaro says vs.
      // what the local override is set to.
      description: services.description,
      vagaroDescription: services.vagaroDescription,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      imageUrl: services.imageUrl,
      vagaroImageUrl: services.vagaroImageUrl,
      color: services.color,
      displayOrder: services.displayOrder,
      categoryId: services.categoryId,
      categoryName: serviceCategories.name,
      categorySlug: serviceCategories.slug,
      subcategoryId: services.subcategoryId,
      subcategoryName: serviceSubcategories.name,
      subcategorySlug: serviceSubcategories.slug,
      subcategoryKeyImagePath: subcategoryKeyImage.filePath,
      vagaroWidgetUrl: services.vagaroWidgetUrl,
      vagaroServiceCode: services.vagaroServiceCode,
      keyImageAssetId: services.keyImageAssetId,
      keyImagePath: serviceKeyImage.filePath,
      useDemoPhotos: services.useDemoPhotos,
      isActive: services.isActive,
      vagaroServiceId: services.vagaroServiceId,
      lastSyncedAt: services.lastSyncedAt,
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .leftJoin(serviceSubcategories, eq(services.subcategoryId, serviceSubcategories.id))
    .leftJoin(serviceKeyImage, eq(services.keyImageAssetId, serviceKeyImage.id))
    .leftJoin(subcategoryKeyImage, eq(serviceSubcategories.keyImageAssetId, subcategoryKeyImage.id))
    .orderBy(asc(services.displayOrder))

  // Compute imageSource for each service
  return allServices.map(service => {
    let imageSource: 'dam' | 'vagaro' | 'subcategory' | 'none' = 'none'
    let resolvedImageUrl: string | null = null

    if (service.vagaroImageUrl) {
      imageSource = 'vagaro'
      resolvedImageUrl = service.vagaroImageUrl
    } else if (service.keyImageAssetId && service.keyImagePath) {
      imageSource = 'dam'
      resolvedImageUrl = service.keyImagePath
    } else if (service.subcategoryKeyImagePath) {
      imageSource = 'subcategory'
      resolvedImageUrl = service.subcategoryKeyImagePath
    }

    return {
      ...service,
      imageSource,
      resolvedImageUrl
    }
  })
}

// Update the local service image override. Demo mode is retired; it was never
// consumed by the public frontend.
export async function updateServiceImage(
  serviceId: string,
  data: {
    keyImageAssetId?: string | null
    imageUrl?: string | null
  }
) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  const [before] = await db
    .select({
      keyImageAssetId: services.keyImageAssetId,
      imageUrl: services.imageUrl,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1)

  if (!before) throw new Error('Service not found')

  const [after] = await db
    .update(services)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(services.id, serviceId))
    .returning({
      keyImageAssetId: services.keyImageAssetId,
      imageUrl: services.imageUrl,
    })

  await recordAdminAction({
    action: 'service.image.update',
    targetType: 'service',
    targetId: serviceId,
    actorUserId: auth.userId,
    diff: { before, after },
  })

  return { success: true }
}

// Get service categories with subcategories
export async function getServiceCategoriesWithSubcategories() {
  const db = getDb()

  const categories = await db
    .select({
      id: serviceCategories.id,
      name: sql<string>`COALESCE(${serviceCategories.displayName}, ${serviceCategories.name})`,
      sourceName: serviceCategories.name,
      displayName: serviceCategories.displayName,
      slug: serviceCategories.slug,
      description: serviceCategories.description,
      tagline: serviceCategories.tagline,
      icon: serviceCategories.icon,
      displayOrder: serviceCategories.displayOrder,
      isActive: serviceCategories.isActive,
      sourceType: serviceCategories.sourceType,
      showInBooking: serviceCategories.showInBooking,
      syncStatus: serviceCategories.syncStatus,
      lastSyncedAt: serviceCategories.lastSyncedAt,
      keyImageAssetId: serviceCategories.keyImageAssetId,
    })
    .from(serviceCategories)
    .where(and(eq(serviceCategories.isActive, true), eq(serviceCategories.showInBooking, true)))
    .orderBy(asc(serviceCategories.displayOrder))

  const subcategories = await db
    .select({
      id: serviceSubcategories.id,
      categoryId: serviceSubcategories.categoryId,
      name: serviceSubcategories.name,
      slug: serviceSubcategories.slug,
      description: serviceSubcategories.description,
      displayOrder: serviceSubcategories.displayOrder,
      isActive: serviceSubcategories.isActive,
      keyImageAssetId: serviceSubcategories.keyImageAssetId,
    })
    .from(serviceSubcategories)
    .where(eq(serviceSubcategories.isActive, true))
    .orderBy(asc(serviceSubcategories.displayOrder))

  // Attach subcategories to categories
  return categories.map(cat => ({
    ...cat,
    subcategories: subcategories.filter(sub => sub.categoryId === cat.id)
  }))
}

// Update category key image
export async function updateServiceCategoryImage(
  categoryId: string,
  keyImageAssetId: string | null
) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  const [before] = await db
    .select({ keyImageAssetId: serviceCategories.keyImageAssetId })
    .from(serviceCategories)
    .where(eq(serviceCategories.id, categoryId))
    .limit(1)

  if (!before) throw new Error('Service category not found')

  const [after] = await db
    .update(serviceCategories)
    .set({
      keyImageAssetId,
      updatedAt: new Date()
    })
    .where(eq(serviceCategories.id, categoryId))
    .returning({ keyImageAssetId: serviceCategories.keyImageAssetId })

  await recordAdminAction({
    action: 'service-category.image.update',
    targetType: 'service-category',
    targetId: categoryId,
    actorUserId: auth.userId,
    diff: { before, after },
  })

  return { success: true }
}

// Update subcategory key image
export async function updateServiceSubcategoryImage(
  subcategoryId: string,
  keyImageAssetId: string | null
) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  const [before] = await db
    .select({ keyImageAssetId: serviceSubcategories.keyImageAssetId })
    .from(serviceSubcategories)
    .where(eq(serviceSubcategories.id, subcategoryId))
    .limit(1)

  if (!before) throw new Error('Service subcategory not found')

  const [after] = await db
    .update(serviceSubcategories)
    .set({
      keyImageAssetId,
      updatedAt: new Date()
    })
    .where(eq(serviceSubcategories.id, subcategoryId))
    .returning({ keyImageAssetId: serviceSubcategories.keyImageAssetId })

  await recordAdminAction({
    action: 'service-subcategory.image.update',
    targetType: 'service-subcategory',
    targetId: subcategoryId,
    actorUserId: auth.userId,
    diff: { before, after },
  })

  return { success: true }
}

// Tag an asset with a service (many-to-many relationship)
// This is called when selecting an image from "all images" view
// to auto-tag it for the service
export async function tagAssetWithService(
  assetId: string,
  serviceId: string
) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  // Check if already tagged
  const existing = await db
    .select()
    .from(assetServices)
    .where(
      and(
        eq(assetServices.assetId, assetId),
        eq(assetServices.serviceId, serviceId)
      )
    )
    .limit(1)

  // Only insert if not already tagged
  if (existing.length === 0) {
    const [tag] = await db
      .insert(assetServices)
      .values({
        assetId,
        serviceId
      })
      .returning({ id: assetServices.id })

    await recordAdminAction({
      action: 'dam.asset.service-tag.add',
      targetType: 'asset-service',
      targetId: tag.id,
      actorUserId: auth.userId,
      diff: {
        before: null,
        after: { assetId, serviceId },
      },
    })
  }

  return { success: true }
}

// Remove service tag from an asset
export async function untagAssetFromService(
  assetId: string,
  serviceId: string
) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  const [existing] = await db
    .select({ id: assetServices.id })
    .from(assetServices)
    .where(
      and(
        eq(assetServices.assetId, assetId),
        eq(assetServices.serviceId, serviceId)
      )
    )
    .limit(1)

  await db
    .delete(assetServices)
    .where(
      and(
        eq(assetServices.assetId, assetId),
        eq(assetServices.serviceId, serviceId)
      )
    )

  if (existing) {
    await recordAdminAction({
      action: 'dam.asset.service-tag.remove',
      targetType: 'asset-service',
      targetId: existing.id,
      actorUserId: auth.userId,
      diff: {
        before: { assetId, serviceId },
        after: null,
      },
    })
  }

  return { success: true }
}

// Update subcategory display order
export async function updateSubcategoryDisplayOrder(
  subcategoryId: string,
  displayOrder: number
) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  const [before] = await db
    .select({ displayOrder: serviceSubcategories.displayOrder })
    .from(serviceSubcategories)
    .where(eq(serviceSubcategories.id, subcategoryId))
    .limit(1)

  if (!before) throw new Error('Service subcategory not found')

  const [after] = await db
    .update(serviceSubcategories)
    .set({
      displayOrder,
      updatedAt: new Date()
    })
    .where(eq(serviceSubcategories.id, subcategoryId))
    .returning({ displayOrder: serviceSubcategories.displayOrder })

  await recordAdminAction({
    action: 'service-subcategory.reorder',
    targetType: 'service-subcategory',
    targetId: subcategoryId,
    actorUserId: auth.userId,
    diff: { before, after },
  })

  return { success: true }
}

// Bulk update subcategory display orders
export async function updateSubcategoryDisplayOrders(
  updates: Array<{ subcategoryId: string; displayOrder: number }>
) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  if (updates.length === 0) return { success: true }

  const ids = updates.map(update => update.subcategoryId)
  const before = await db
    .select({
      subcategoryId: serviceSubcategories.id,
      displayOrder: serviceSubcategories.displayOrder,
    })
    .from(serviceSubcategories)
    .where(inArray(serviceSubcategories.id, ids))

  // Update each subcategory's display order
  for (const update of updates) {
    await db
      .update(serviceSubcategories)
      .set({
        displayOrder: update.displayOrder,
        updatedAt: new Date()
      })
      .where(eq(serviceSubcategories.id, update.subcategoryId))
  }

  await recordAdminAction({
    action: 'service-subcategory.reorder',
    targetType: 'service-subcategory',
    targetId: 'bulk',
    actorUserId: auth.userId,
    diff: {
      before,
      after: updates,
    },
  })

  return { success: true }
}

// Get all subcategories for a category (for admin ordering)
export async function getSubcategoriesByCategory(categorySlug: string) {
  const db = getDb()

  const category = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.slug, categorySlug))
    .limit(1)

  if (category.length === 0) {
    return []
  }

  const subcategories = await db
    .select({
      id: serviceSubcategories.id,
      name: serviceSubcategories.name,
      slug: serviceSubcategories.slug,
      displayOrder: serviceSubcategories.displayOrder,
      isActive: serviceSubcategories.isActive,
    })
    .from(serviceSubcategories)
    .where(eq(serviceSubcategories.categoryId, category[0].id))
    .orderBy(asc(serviceSubcategories.displayOrder))

  return subcategories
}

// Update service category description and tagline
export async function updateServiceCategoryContent(
  categoryId: string,
  data: {
    description?: string | null
    tagline?: string | null
    icon?: string | null
    displayName?: string | null
  }
) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  const [before] = await db
    .select({
      description: serviceCategories.description,
      tagline: serviceCategories.tagline,
      icon: serviceCategories.icon,
      displayName: serviceCategories.displayName,
    })
    .from(serviceCategories)
    .where(eq(serviceCategories.id, categoryId))
    .limit(1)

  if (!before) throw new Error('Service category not found')

  const [after] = await db
    .update(serviceCategories)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(serviceCategories.id, categoryId))
    .returning({
      description: serviceCategories.description,
      tagline: serviceCategories.tagline,
      icon: serviceCategories.icon,
      displayName: serviceCategories.displayName,
    })

  await recordAdminAction({
    action: 'service-category.content.update',
    targetType: 'service-category',
    targetId: categoryId,
    actorUserId: auth.userId,
    diff: { before, after },
  })

  return { success: true }
}

// Get all service categories for admin (including inactive)
export async function getAllServiceCategoriesAdmin() {
  await requireAdminRole('owner', 'publisher', 'viewer')
  const db = getDb()

  const categories = await db
    .select({
      id: serviceCategories.id,
      name: sql<string>`COALESCE(${serviceCategories.displayName}, ${serviceCategories.name})`,
      sourceName: serviceCategories.name,
      displayName: serviceCategories.displayName,
      slug: serviceCategories.slug,
      description: serviceCategories.description,
      tagline: serviceCategories.tagline,
      icon: serviceCategories.icon,
      displayOrder: serviceCategories.displayOrder,
      isActive: serviceCategories.isActive,
      sourceType: serviceCategories.sourceType,
      showInBooking: serviceCategories.showInBooking,
      syncStatus: serviceCategories.syncStatus,
      lastSyncedAt: serviceCategories.lastSyncedAt,
      keyImageAssetId: serviceCategories.keyImageAssetId,
    })
    .from(serviceCategories)
    .orderBy(asc(serviceCategories.displayOrder))

  return categories
}

export async function getVagaroTaxonomyAdmin() {
  await requireAdminRole('owner', 'publisher', 'viewer')
  const db = getDb()

  const [rawCategories, websiteCategories] = await Promise.all([
    db
      .select({
        id: vagaroServiceCategories.id,
        vagaroCategoryId: vagaroServiceCategories.vagaroCategoryId,
        title: vagaroServiceCategories.title,
        sourceOrder: vagaroServiceCategories.displayOrder,
        serviceCount: vagaroServiceCategories.serviceCount,
        isActive: vagaroServiceCategories.isActive,
        teamLabel: vagaroServiceCategories.teamLabel,
        teamDisplayOrder: vagaroServiceCategories.teamDisplayOrder,
        showOnTeam: vagaroServiceCategories.showOnTeam,
        lastSeenAt: vagaroServiceCategories.lastSeenAt,
        mappedCategoryId: serviceCategories.id,
        mappedCategoryName: sql<string | null>`COALESCE(${serviceCategories.displayName}, ${serviceCategories.name})`,
        mappedCategorySlug: serviceCategories.slug,
        mappedCategoryOrder: serviceCategories.displayOrder,
        mappingType: vagaroCategoryMappings.mappingType,
      })
      .from(vagaroServiceCategories)
      .leftJoin(
        vagaroCategoryMappings,
        eq(vagaroCategoryMappings.vagaroCategoryId, vagaroServiceCategories.id),
      )
      .leftJoin(
        serviceCategories,
        eq(vagaroCategoryMappings.serviceCategoryId, serviceCategories.id),
      )
      .orderBy(asc(vagaroServiceCategories.displayOrder)),
    getAllServiceCategoriesAdmin(),
  ])

  const mappedWebsiteIds = new Set(
    rawCategories.map(category => category.mappedCategoryId).filter(Boolean),
  )
  return {
    rawCategories,
    websiteCategories,
    localCategories: websiteCategories.filter(category => !mappedWebsiteIds.has(category.id)),
  }
}

export async function updateVagaroCategoryPresentation(
  categoryId: string,
  data: {
    teamLabel?: string | null
    teamDisplayOrder?: number | null
    showOnTeam?: boolean
  },
) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  const [before] = await db
    .select({
      teamLabel: vagaroServiceCategories.teamLabel,
      teamDisplayOrder: vagaroServiceCategories.teamDisplayOrder,
      showOnTeam: vagaroServiceCategories.showOnTeam,
    })
    .from(vagaroServiceCategories)
    .where(eq(vagaroServiceCategories.id, categoryId))
    .limit(1)

  if (!before) throw new Error('Vagaro category not found')

  const [after] = await db
    .update(vagaroServiceCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(vagaroServiceCategories.id, categoryId))
    .returning({
      teamLabel: vagaroServiceCategories.teamLabel,
      teamDisplayOrder: vagaroServiceCategories.teamDisplayOrder,
      showOnTeam: vagaroServiceCategories.showOnTeam,
    })

  await recordAdminAction({
    action: 'vagaro.category.presentation.update',
    targetType: 'vagaro-category',
    targetId: categoryId,
    actorUserId: auth.userId,
    diff: { before, after },
  })

  return { success: true }
}

export async function getVagaroSyncRunsAdmin(limit = 10) {
  await requireAdminRole('owner', 'publisher', 'viewer')
  const db = getDb()
  return db
    .select()
    .from(vagaroSyncRuns)
    .orderBy(desc(vagaroSyncRuns.startedAt))
    .limit(Math.max(1, Math.min(limit, 50)))
}

// Get service categories for the landing page (public, with taglines and descriptions)
export async function getServiceCategoriesForLanding() {
  const db = getDb()

  const categories = await db
    .select({
      id: serviceCategories.id,
      name: sql<string>`COALESCE(${serviceCategories.displayName}, ${serviceCategories.name})`,
      slug: serviceCategories.slug,
      description: serviceCategories.description,
      tagline: serviceCategories.tagline,
      icon: serviceCategories.icon,
      displayOrder: serviceCategories.displayOrder,
    })
    .from(serviceCategories)
    .where(and(eq(serviceCategories.isActive, true), eq(serviceCategories.showInBooking, true)))
    .orderBy(asc(serviceCategories.displayOrder))

  return categories
}

// Reset service to use Vagaro image (removes DAM override)
export async function resetServiceToVagaroImage(serviceId: string) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  const [before] = await db
    .select({
      keyImageAssetId: services.keyImageAssetId,
      imageUrl: services.imageUrl,
      vagaroImageUrl: services.vagaroImageUrl,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1)

  if (!before) throw new Error('Service not found')

  const [after] = await db
    .update(services)
    .set({
      keyImageAssetId: null,
      imageUrl: null,
      updatedAt: new Date()
    })
    .where(eq(services.id, serviceId))
    .returning({
      keyImageAssetId: services.keyImageAssetId,
      imageUrl: services.imageUrl,
      vagaroImageUrl: services.vagaroImageUrl,
    })

  await recordAdminAction({
    action: 'service.image.reset-to-vagaro',
    targetType: 'service',
    targetId: serviceId,
    actorUserId: auth.userId,
    diff: { before, after },
  })

  return { success: true }
}

// Update a service's subcategory assignment
export async function updateServiceSubcategory(
  serviceId: string,
  subcategoryId: string | null
) {
  const auth = await requireAdminRole('owner', 'publisher')
  const db = getDb()

  const [before] = await db
    .select({
      subcategoryId: services.subcategoryId,
      categoryId: services.categoryId,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1)

  if (!before) throw new Error('Service not found')

  // If a subcategory is specified, get its category to ensure consistency
  let categoryId: string | null = null
  if (subcategoryId) {
    const [subcategory] = await db
      .select({ categoryId: serviceSubcategories.categoryId })
      .from(serviceSubcategories)
      .where(eq(serviceSubcategories.id, subcategoryId))
      .limit(1)

    if (subcategory) {
      categoryId = subcategory.categoryId
    }
  }

  const [after] = await db
    .update(services)
    .set({
      subcategoryId,
      ...(categoryId && { categoryId }),
      updatedAt: new Date()
    })
    .where(eq(services.id, serviceId))
    .returning({
      subcategoryId: services.subcategoryId,
      categoryId: services.categoryId,
    })

  await recordAdminAction({
    action: 'service.subcategory.assign',
    targetType: 'service',
    targetId: serviceId,
    actorUserId: auth.userId,
    diff: { before, after },
  })

  return { success: true }
}

// Get all subcategories (for service assignment dropdown)
export async function getAllSubcategories() {
  const db = getDb()

  const allSubcategories = await db
    .select({
      id: serviceSubcategories.id,
      name: serviceSubcategories.name,
      slug: serviceSubcategories.slug,
      categoryId: serviceSubcategories.categoryId,
      categoryName: serviceCategories.name,
      categorySlug: serviceCategories.slug,
      displayOrder: serviceSubcategories.displayOrder,
    })
    .from(serviceSubcategories)
    .leftJoin(serviceCategories, eq(serviceSubcategories.categoryId, serviceCategories.id))
    .where(eq(serviceSubcategories.isActive, true))
    .orderBy(asc(serviceCategories.displayOrder), asc(serviceSubcategories.displayOrder))

  return allSubcategories
}
