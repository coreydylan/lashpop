'use server'

import { db } from "@/db"
import { serviceCategories } from "@/db/schema/service_categories"
import { eq, asc } from "drizzle-orm"

export async function getServiceCategories() {
  const categories = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.isActive, true))
    .orderBy(asc(serviceCategories.displayOrder))

  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    icon: cat.icon,
    displayOrder: cat.displayOrder
  }))
}