import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { faqCategories, faqItems } from '@/db/schema/faqs'
import { eq, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET - Fetch all FAQ categories and items
export async function GET() {
  try {
    const db = getDb()

    // Fetch all categories
    const categories = await db
      .select()
      .from(faqCategories)
      .orderBy(asc(faqCategories.displayOrder))

    // Fetch all items
    const items = await db
      .select()
      .from(faqItems)
      .orderBy(asc(faqItems.displayOrder))

    return NextResponse.json({
      categories,
      items
    })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    )
  }
}

// POST - Create a new FAQ category or item
export async function POST(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { type, data } = body

    if (type === 'category') {
      const [newCategory] = await db
        .insert(faqCategories)
        .values({
          name: data.name.toLowerCase().replace(/\s+/g, '_'),
          displayName: data.displayName,
          description: data.description || null,
          displayOrder: data.displayOrder || 0,
          isActive: data.isActive ?? true
        })
        .returning()

      return NextResponse.json({ category: newCategory })
    } else if (type === 'item') {
      const [newItem] = await db
        .insert(faqItems)
        .values({
          categoryId: data.categoryId,
          question: data.question,
          answer: data.answer,
          displayOrder: data.displayOrder || 0,
          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false
        })
        .returning()

      return NextResponse.json({ item: newItem })
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "category" or "item"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    )
  }
}

// PUT - Update FAQ category or item
export async function PUT(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { type, id, data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    if (type === 'category') {
      const [updated] = await db
        .update(faqCategories)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(faqCategories.id, id))
        .returning()

      return NextResponse.json({ category: updated })
    } else if (type === 'item') {
      const [updated] = await db
        .update(faqItems)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(faqItems.id, id))
        .returning()

      return NextResponse.json({ item: updated })
    }

    return NextResponse.json(
      { error: 'Invalid type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return NextResponse.json(
      { error: 'Failed to update FAQ' },
      { status: 500 }
    )
  }
}

// DELETE - Delete FAQ category or item
export async function DELETE(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      )
    }

    if (type === 'category') {
      await db
        .delete(faqCategories)
        .where(eq(faqCategories.id, id))
    } else if (type === 'item') {
      await db
        .delete(faqItems)
        .where(eq(faqItems.id, id))
    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    )
  }
}

