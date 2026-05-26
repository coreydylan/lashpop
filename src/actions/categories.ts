'use server'

import { getDb } from "@/db"
import { serviceCategories } from "@/db/schema/service_categories"
import { eq, asc } from "drizzle-orm"

export async function getServiceCategories() {
  const db = getDb()
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
    // `tagline` was previously omitted, which is why the admin Category
    // Content editor's tagline field was dead-read for the drawer too.
    // (See tmp/admin-audit.md, Part 1 § services.)
    tagline: cat.tagline,
    icon: cat.icon,
    displayOrder: cat.displayOrder
  }))
}