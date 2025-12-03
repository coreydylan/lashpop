import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { services } from '@/db/schema/services'
import { serviceCategories } from '@/db/schema/service_categories'
import { serviceSubcategories } from '@/db/schema/service_subcategories'
import { eq, and, asc } from 'drizzle-orm'

/**
 * GET /api/ask-lashpop/services?categoryId=xxx
 *
 * Fetches services and subcategories for a given category,
 * formatted for the ServicePanel component.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const categorySlug = searchParams.get('categorySlug')

    if (!categoryId && !categorySlug) {
      return NextResponse.json(
        { error: 'categoryId or categorySlug is required' },
        { status: 400 }
      )
    }

    // Get the category
    let category
    if (categoryId) {
      const result = await db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.id, categoryId))
        .limit(1)
      category = result[0]
    } else if (categorySlug) {
      const result = await db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.slug, categorySlug))
        .limit(1)
      category = result[0]
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Fetch subcategories for this category
    const subcategoriesResult = await db
      .select({
        id: serviceSubcategories.id,
        name: serviceSubcategories.name,
        slug: serviceSubcategories.slug,
      })
      .from(serviceSubcategories)
      .where(
        and(
          eq(serviceSubcategories.categoryId, category.id),
          eq(serviceSubcategories.isActive, true)
        )
      )
      .orderBy(asc(serviceSubcategories.displayOrder))

    // Fetch services for this category
    const servicesResult = await db
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
        subcategoryId: services.subcategoryId,
        subcategorySlug: serviceSubcategories.slug,
        vagaroWidgetUrl: services.vagaroWidgetUrl,
        vagaroServiceCode: services.vagaroServiceCode,
      })
      .from(services)
      .leftJoin(serviceSubcategories, eq(services.subcategoryId, serviceSubcategories.id))
      .where(
        and(
          eq(services.categoryId, category.id),
          eq(services.isActive, true)
        )
      )
      .orderBy(asc(services.displayOrder))

    // Return formatted data matching ServicePanelData interface
    return NextResponse.json({
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
      subcategories: subcategoriesResult,
      services: servicesResult,
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
