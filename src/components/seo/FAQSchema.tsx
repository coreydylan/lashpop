/**
 * FAQ Schema Component
 *
 * Generates JSON-LD structured data for FAQ sections.
 * This helps Google display FAQ rich results in search.
 */

import { getDb } from '@/db'
import { faqItems } from '@/db/schema/faqs'
import { eq } from 'drizzle-orm'

interface FAQ {
  id: string
  question: string
  answer: string
}

async function getFAQs(): Promise<FAQ[]> {
  try {
    const db = getDb()
    const results = await db
      .select({
        id: faqItems.id,
        question: faqItems.question,
        answer: faqItems.answer
      })
      .from(faqItems)
      .where(eq(faqItems.isActive, true))
      .limit(50) // Limit to prevent too much data

    return results
  } catch {
    return []
  }
}

export async function FAQSchema() {
  const faqList = await getFAQs()

  if (faqList.length === 0) {
    return null
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default FAQSchema
