'use server'

import { getDb } from '@/db'
import { faqCategories, faqItems } from '@/db/schema/faqs'
import { eq, asc, and } from 'drizzle-orm'

export interface FAQCategory {
  id: string
  name: string
  displayName: string
  description: string | null
  displayOrder: number
  isActive: boolean
}

export interface FAQItem {
  id: string
  categoryId: string
  question: string
  answer: string
  displayOrder: number
  isActive: boolean
  isFeatured: boolean
}

export interface FAQWithCategory extends FAQItem {
  categoryName: string
  categoryDisplayName: string
}

/**
 * Get all active FAQ categories
 */
export async function getFAQCategories(): Promise<FAQCategory[]> {
  try {
    const db = getDb()
    const categories = await db
      .select()
      .from(faqCategories)
      .where(eq(faqCategories.isActive, true))
      .orderBy(asc(faqCategories.displayOrder))

    return categories
  } catch (error) {
    console.error('Error fetching FAQ categories:', error)
    return []
  }
}

/**
 * Get all active FAQ items
 */
export async function getFAQItems(): Promise<FAQItem[]> {
  try {
    const db = getDb()
    const items = await db
      .select()
      .from(faqItems)
      .where(eq(faqItems.isActive, true))
      .orderBy(asc(faqItems.displayOrder))

    return items
  } catch (error) {
    console.error('Error fetching FAQ items:', error)
    return []
  }
}

/**
 * Get FAQs grouped by category for display
 */
export async function getFAQsGroupedByCategory(): Promise<{
  categories: FAQCategory[]
  itemsByCategory: Record<string, FAQItem[]>
  featuredItems: FAQWithCategory[]
}> {
  try {
    const db = getDb()
    // Fetch categories
    const categories = await db
      .select()
      .from(faqCategories)
      .where(eq(faqCategories.isActive, true))
      .orderBy(asc(faqCategories.displayOrder))

    // Fetch all active items
    const items = await db
      .select()
      .from(faqItems)
      .where(eq(faqItems.isActive, true))
      .orderBy(asc(faqItems.displayOrder))

    // Group items by category
    const itemsByCategory: Record<string, FAQItem[]> = {}
    for (const category of categories) {
      itemsByCategory[category.id] = items.filter(item => item.categoryId === category.id)
    }

    // Get featured items with category info
    const featuredItems: FAQWithCategory[] = items
      .filter(item => item.isFeatured)
      .map(item => {
        const category = categories.find(c => c.id === item.categoryId)
        return {
          ...item,
          categoryName: category?.name || '',
          categoryDisplayName: category?.displayName || ''
        }
      })

    return {
      categories,
      itemsByCategory,
      featuredItems
    }
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return {
      categories: [],
      itemsByCategory: {},
      featuredItems: []
    }
  }
}

/**
 * Get featured FAQs for "Top FAQs" section
 */
export async function getFeaturedFAQs(): Promise<FAQWithCategory[]> {
  try {
    const db = getDb()
    const categories = await db
      .select()
      .from(faqCategories)
      .where(eq(faqCategories.isActive, true))

    const items = await db
      .select()
      .from(faqItems)
      .where(
        and(
          eq(faqItems.isActive, true),
          eq(faqItems.isFeatured, true)
        )
      )
      .orderBy(asc(faqItems.displayOrder))

    return items.map(item => {
      const category = categories.find(c => c.id === item.categoryId)
      return {
        ...item,
        categoryName: category?.name || '',
        categoryDisplayName: category?.displayName || ''
      }
    })
  } catch (error) {
    console.error('Error fetching featured FAQs:', error)
    return []
  }
}

