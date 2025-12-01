"use server"

import { getDb } from "@/db"
import { services } from "@/db/schema/services"
import { serviceCategories } from "@/db/schema/service_categories"
import { serviceSubcategories } from "@/db/schema/service_subcategories"
import { and, eq, asc } from "drizzle-orm"

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
