"use server"

import { getDb } from "@/db"
import { services } from "@/db/schema/services"
import { serviceCategories } from "@/db/schema/service_categories"
import { and, eq, asc } from "drizzle-orm"

export interface ServiceFilter {
  mainCategory?: string
  subCategory?: string
}

export async function getServices() {
  const db = getDb()

  const allServices = await db
    .select({
      id: services.id,
      categoryId: services.categoryId,
      name: services.name,
      displayTitle: services.displayTitle,
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

export async function getAllServices(filter?: ServiceFilter) {
  const db = getDb()

  const conditions = [eq(services.isActive, true)]

  if (filter?.mainCategory) {
    conditions.push(eq(services.mainCategory, filter.mainCategory))
  }

  if (filter?.subCategory) {
    conditions.push(eq(services.subCategory, filter.subCategory))
  }

  const allServices = await db
    .select({
      id: services.id,
      name: services.name,
      displayTitle: services.displayTitle,
      slug: services.slug,
      subtitle: services.subtitle,
      description: services.description,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      imageUrl: services.imageUrl,
      color: services.color,
      mainCategory: services.mainCategory,
      subCategory: services.subCategory,
      displayOrder: services.displayOrder
    })
    .from(services)
    .where(and(...conditions))
    .orderBy(asc(services.displayOrder))

  return allServices
}

export async function getMainCategories() {
  const db = getDb()

  const result = await db
    .selectDistinct({ mainCategory: services.mainCategory })
    .from(services)
    .where(eq(services.isActive, true))

  return result.map(r => r.mainCategory).sort()
}

export async function getSubCategories(mainCategory?: string) {
  const db = getDb()

  const conditions = [eq(services.isActive, true)]

  if (mainCategory) {
    conditions.push(eq(services.mainCategory, mainCategory))
  }

  const result = await db
    .selectDistinct({ subCategory: services.subCategory })
    .from(services)
    .where(and(...conditions))

  return result
    .map(r => r.subCategory)
    .filter(sc => sc !== null)
    .sort() as string[]
}
