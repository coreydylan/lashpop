"use server"

import { getDb } from "@/db"
import { services } from "@/db/schema/services"
import { serviceCategories } from "@/db/schema/service_categories"
import { serviceSubcategories } from "@/db/schema/service_subcategories"
import { assetServices } from "@/db/schema/asset_services"
import { and, eq, asc, inArray } from "drizzle-orm"

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
      description: services.description,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      imageUrl: services.imageUrl,
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
      description: services.description,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      imageUrl: services.imageUrl,
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

  const allServices = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      subtitle: services.subtitle,
      description: services.description,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      imageUrl: services.imageUrl,
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
    .where(eq(services.isActive, true))
    .orderBy(asc(services.displayOrder))

  return allServices
}

// Get all services including inactive ones (for admin)
export async function getAllServicesAdmin() {
  const db = getDb()

  const allServices = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      subtitle: services.subtitle,
      description: services.description,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      imageUrl: services.imageUrl,
      color: services.color,
      displayOrder: services.displayOrder,
      categoryId: services.categoryId,
      categoryName: serviceCategories.name,
      categorySlug: serviceCategories.slug,
      subcategoryId: services.subcategoryId,
      subcategoryName: serviceSubcategories.name,
      subcategorySlug: serviceSubcategories.slug,
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
    .orderBy(asc(services.displayOrder))

  return allServices
}

// Update service key image and demo settings
export async function updateServiceImage(
  serviceId: string,
  data: {
    keyImageAssetId?: string | null
    useDemoPhotos?: boolean
    imageUrl?: string | null
  }
) {
  const db = getDb()

  await db
    .update(services)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(services.id, serviceId))

  return { success: true }
}

// Get service categories with subcategories
export async function getServiceCategoriesWithSubcategories() {
  const db = getDb()

  const categories = await db
    .select({
      id: serviceCategories.id,
      name: serviceCategories.name,
      slug: serviceCategories.slug,
      description: serviceCategories.description,
      icon: serviceCategories.icon,
      displayOrder: serviceCategories.displayOrder,
      isActive: serviceCategories.isActive,
      keyImageAssetId: serviceCategories.keyImageAssetId,
    })
    .from(serviceCategories)
    .where(eq(serviceCategories.isActive, true))
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
  const db = getDb()

  await db
    .update(serviceCategories)
    .set({
      keyImageAssetId,
      updatedAt: new Date()
    })
    .where(eq(serviceCategories.id, categoryId))

  return { success: true }
}

// Update subcategory key image
export async function updateServiceSubcategoryImage(
  subcategoryId: string,
  keyImageAssetId: string | null
) {
  const db = getDb()

  await db
    .update(serviceSubcategories)
    .set({
      keyImageAssetId,
      updatedAt: new Date()
    })
    .where(eq(serviceSubcategories.id, subcategoryId))

  return { success: true }
}

// Tag an asset with a service (many-to-many relationship)
// This is called when selecting an image from "all images" view
// to auto-tag it for the service
export async function tagAssetWithService(
  assetId: string,
  serviceId: string
) {
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
    await db
      .insert(assetServices)
      .values({
        assetId,
        serviceId
      })
  }

  return { success: true }
}

// Remove service tag from an asset
export async function untagAssetFromService(
  assetId: string,
  serviceId: string
) {
  const db = getDb()

  await db
    .delete(assetServices)
    .where(
      and(
        eq(assetServices.assetId, assetId),
        eq(assetServices.serviceId, serviceId)
      )
    )

  return { success: true }
}

// Update subcategory display order
export async function updateSubcategoryDisplayOrder(
  subcategoryId: string,
  displayOrder: number
) {
  const db = getDb()

  await db
    .update(serviceSubcategories)
    .set({
      displayOrder,
      updatedAt: new Date()
    })
    .where(eq(serviceSubcategories.id, subcategoryId))

  return { success: true }
}

// Bulk update subcategory display orders
export async function updateSubcategoryDisplayOrders(
  updates: Array<{ subcategoryId: string; displayOrder: number }>
) {
  const db = getDb()

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
