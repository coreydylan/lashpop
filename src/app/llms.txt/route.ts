import { NextResponse } from 'next/server'
import { getSEOSettings } from '@/actions/seo'
import { getDb } from '@/db'
import { services } from '@/db/schema/services'
import { serviceCategories } from '@/db/schema/service_categories'
import { serviceSubcategories } from '@/db/schema/service_subcategories'
import { faqItems } from '@/db/schema/faqs'
import { businessLocations } from '@/db/schema/business_locations'
import { eq } from 'drizzle-orm'

/**
 * Generate llms.txt - A file format designed for LLM accessibility
 *
 * Based on the llms.txt specification (https://llmstxt.org)
 * This helps AI assistants understand your business and services.
 */
export async function GET() {
  try {
    const settings = await getSEOSettings()
    const { site } = settings

    // Build the llms.txt content
    let content = ''

    // Header Section
    content += `# ${site.businessName}\n\n`

    // Custom intro if provided, otherwise generate one
    if (site.llmsTxtIntro) {
      content += site.llmsTxtIntro + '\n\n'
    } else {
      content += `> ${site.businessDescription}\n\n`
    }

    // Business Information
    content += `## About\n\n`
    content += `${site.businessName} is a ${site.businessType.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} located in Los Angeles, California.\n\n`

    if (site.phone) {
      content += `- **Phone:** ${site.phone}\n`
    }
    if (site.email) {
      content += `- **Email:** ${site.email}\n`
    }
    content += `- **Website:** ${site.siteUrl}\n`

    // Social profiles
    const socialLinks = Object.entries(site.socialProfiles)
      .filter(([, value]) => value)
      .map(([platform, url]) => `- **${platform.charAt(0).toUpperCase() + platform.slice(1)}:** ${url}`)

    if (socialLinks.length > 0) {
      content += '\n### Social Media\n\n'
      content += socialLinks.join('\n') + '\n'
    }

    // Fetch dynamic content from database
    const db = getDb()

    // Services Section
    try {
      const serviceList = await db
        .select({
          name: services.name,
          description: services.description,
          priceStarting: services.priceStarting,
          durationMinutes: services.durationMinutes,
          categoryName: serviceCategories.name,
          subcategoryName: serviceSubcategories.name
        })
        .from(services)
        .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .leftJoin(serviceSubcategories, eq(services.subcategoryId, serviceSubcategories.id))
        .where(eq(services.isActive, true))
        .limit(100)

      if (serviceList.length > 0) {
        content += '\n## Services\n\n'

        // Group by category
        const byCategory: Record<string, typeof serviceList> = {}
        for (const service of serviceList) {
          const cat = service.categoryName || 'Other'
          if (!byCategory[cat]) byCategory[cat] = []
          byCategory[cat].push(service)
        }

        for (const [category, categoryServices] of Object.entries(byCategory)) {
          content += `### ${category}\n\n`
          for (const service of categoryServices) {
            content += `- **${service.name}**`
            if (service.priceStarting) {
              content += ` - Starting at $${service.priceStarting}`
            }
            if (service.durationMinutes) {
              content += ` (${service.durationMinutes} min)`
            }
            content += '\n'
            if (service.description) {
              content += `  ${service.description.slice(0, 200)}${service.description.length > 200 ? '...' : ''}\n`
            }
          }
          content += '\n'
        }
      }
    } catch {
      // Services table might not exist
    }

    // Locations Section
    try {
      const locations = await db
        .select({
          businessName: businessLocations.businessName,
          streetAddress: businessLocations.streetAddress,
          city: businessLocations.city,
          regionCode: businessLocations.regionCode,
          postalCode: businessLocations.postalCode,
          businessPhone: businessLocations.businessPhone
        })
        .from(businessLocations)

      if (locations.length > 0) {
        content += '## Locations\n\n'
        for (const location of locations) {
          content += `### ${location.businessName}\n\n`
          if (location.streetAddress) {
            content += `- **Address:** ${location.streetAddress}`
            if (location.city) content += `, ${location.city}`
            if (location.regionCode) content += `, ${location.regionCode}`
            if (location.postalCode) content += ` ${location.postalCode}`
            content += '\n'
          }
          if (location.businessPhone) {
            content += `- **Phone:** ${location.businessPhone}\n`
          }
          content += '\n'
        }
      }
    } catch {
      // Locations table might not exist
    }

    // FAQ Section
    try {
      const faqList = await db
        .select({
          question: faqItems.question,
          answer: faqItems.answer
        })
        .from(faqItems)
        .where(eq(faqItems.isActive, true))
        .limit(30)

      if (faqList.length > 0) {
        content += '## Frequently Asked Questions\n\n'
        for (const faq of faqList) {
          content += `**Q: ${faq.question}**\n\n`
          content += `A: ${faq.answer}\n\n`
        }
      }
    } catch {
      // FAQs table might not exist
    }

    // Booking Information
    content += '## Booking\n\n'
    content += `To book an appointment, visit ${site.siteUrl} or call ${site.phone || 'us directly'}.\n\n`

    // Footer
    content += '---\n\n'
    content += `*This file follows the [llms.txt](https://llmstxt.org) specification to help AI assistants provide accurate information about ${site.businessName}.*\n`

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating llms.txt:', error)

    // Return a minimal fallback
    return new NextResponse(
      '# LashPop Studios\n\n> Premium lash extension services in Los Angeles.\n\nVisit https://lashpopstudios.com for more information.\n',
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      }
    )
  }
}
