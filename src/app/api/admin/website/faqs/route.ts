import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { faqCategories, faqItems } from '@/db/schema/faqs'
import { eq, asc } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import { revalidatePath } from 'next/cache'
import { sanitizeFaqHtml } from '@/lib/sanitize-faq-html'

export const dynamic = 'force-dynamic'

// GET - Fetch all FAQ categories and items
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

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
      items: items.map(item => ({ ...item, answer: sanitizeFaqHtml(item.answer) }))
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
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()
    const body = await request.json()
    const { type, data } = body

    if (type === 'category') {
      // Slugify from whatever the admin sent. The form posts `displayName`
      // (human-readable) but the schema requires a unique `name` slug too,
      // so derive it. Pre-2026 this read `data.name` which the admin never
      // sent, so every category-create hit a `.toLowerCase() on undefined`
      // crash. (Bug from tmp/admin-audit.md, Part 1 § FAQ.)
      const slugSource = data.name || data.displayName || ''
      if (!slugSource) {
        return NextResponse.json(
          { error: 'Missing name/displayName' },
          { status: 400 }
        )
      }
      const slug = slugSource
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')

      const [newCategory] = await db
        .insert(faqCategories)
        .values({
          name: slug,
          displayName: data.displayName || slugSource,
          description: data.description || null,
          displayOrder: data.displayOrder || 0,
          isActive: data.isActive ?? true
        })
        .returning()

      await recordAdminAction({
        action: 'faq.category.create',
        targetType: 'faq_category',
        targetId: newCategory.id,
        actorUserId: auth.userId,
        diff: { after: newCategory },
      })
      revalidatePath('/', 'page')

      return NextResponse.json({ category: newCategory })
    } else if (type === 'item') {
      const [newItem] = await db
        .insert(faqItems)
        .values({
          categoryId: data.categoryId,
          question: data.question,
          answer: sanitizeFaqHtml(String(data.answer || '')),
          displayOrder: data.displayOrder || 0,
          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false
        })
        .returning()

      await recordAdminAction({
        action: 'faq.item.create',
        targetType: 'faq_item',
        targetId: newItem.id,
        actorUserId: auth.userId,
        diff: { after: newItem },
      })
      revalidatePath('/', 'page')

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
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

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
      const [before] = await db.select().from(faqCategories).where(eq(faqCategories.id, id)).limit(1)
      if (!before) return NextResponse.json({ error: 'FAQ category not found' }, { status: 404 })
      const categoryChanges: Partial<typeof faqCategories.$inferInsert> = { updatedAt: new Date() }
      if (typeof data?.displayName === 'string') categoryChanges.displayName = data.displayName
      if (typeof data?.description === 'string' || data?.description === null) categoryChanges.description = data.description
      if (Number.isInteger(data?.displayOrder)) categoryChanges.displayOrder = data.displayOrder
      if (typeof data?.isActive === 'boolean') categoryChanges.isActive = data.isActive
      const [updated] = await db
        .update(faqCategories)
        .set(categoryChanges)
        .where(eq(faqCategories.id, id))
        .returning()

      await recordAdminAction({
        action: 'faq.category.update',
        targetType: 'faq_category',
        targetId: id,
        actorUserId: auth.userId,
        diff: { before, after: updated },
      })
      revalidatePath('/', 'page')

      return NextResponse.json({ category: updated })
    } else if (type === 'item') {
      const [before] = await db.select().from(faqItems).where(eq(faqItems.id, id)).limit(1)
      if (!before) return NextResponse.json({ error: 'FAQ item not found' }, { status: 404 })
      const itemChanges: Partial<typeof faqItems.$inferInsert> = { updatedAt: new Date() }
      if (typeof data?.categoryId === 'string') itemChanges.categoryId = data.categoryId
      if (typeof data?.question === 'string') itemChanges.question = data.question
      if (typeof data?.answer === 'string') itemChanges.answer = sanitizeFaqHtml(data.answer)
      if (Number.isInteger(data?.displayOrder)) itemChanges.displayOrder = data.displayOrder
      if (typeof data?.isActive === 'boolean') itemChanges.isActive = data.isActive
      if (typeof data?.isFeatured === 'boolean') itemChanges.isFeatured = data.isFeatured
      const [updated] = await db
        .update(faqItems)
        .set(itemChanges)
        .where(eq(faqItems.id, id))
        .returning()

      await recordAdminAction({
        action: 'faq.item.update',
        targetType: 'faq_item',
        targetId: id,
        actorUserId: auth.userId,
        diff: { before, after: updated },
      })
      revalidatePath('/', 'page')

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
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

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
      const [deleted] = await db
        .delete(faqCategories)
        .where(eq(faqCategories.id, id))
        .returning()
      if (!deleted) return NextResponse.json({ error: 'FAQ category not found' }, { status: 404 })
      await recordAdminAction({
        action: 'faq.category.delete', targetType: 'faq_category', targetId: id,
        actorUserId: auth.userId, diff: { before: deleted, after: null },
      })
    } else if (type === 'item') {
      const [deleted] = await db
        .delete(faqItems)
        .where(eq(faqItems.id, id))
        .returning()
      if (!deleted) return NextResponse.json({ error: 'FAQ item not found' }, { status: 404 })
      await recordAdminAction({
        action: 'faq.item.delete', targetType: 'faq_item', targetId: id,
        actorUserId: auth.userId, diff: { before: deleted, after: null },
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      )
    }

    revalidatePath('/', 'page')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    )
  }
}
