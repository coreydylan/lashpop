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
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .leftJoin(serviceSubcategories, eq(services.subcategoryId, serviceSubcategories.id))
    .where(eq(services.isActive, true))
    .orderBy(asc(services.displayOrder))

  return allServices
}
