import { NextResponse } from 'next/server'
import { getSEOSettings } from '@/actions/seo'
import { getDb } from '@/db'
import { services } from '@/db/schema/services'
import { serviceCategories } from '@/db/schema/service_categories'
import { serviceSubcategories } from '@/db/schema/service_subcategories'
import { faqItems } from '@/db/schema/faqs'
import { businessLocations } from '@/db/schema/business_locations'
import { teamMembers } from '@/db/schema/team_members'
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
    content += `${site.businessName} is an award-winning beauty salon in Oceanside, California, specializing in lash extensions, brow services, skincare, and more. Founded in 2016, LashPop has grown from Emily's living room to a full-service beauty collective with a team of expert artists.\n\n`
    content += `### What Makes LashPop Special\n\n`
    content += `- **Expert Artists:** Certified lash technicians with years of experience\n`
    content += `- **Premium Products:** High-quality lashes and skincare products\n`
    content += `- **Relaxing Environment:** Beautiful coastal studio designed for comfort\n`
    content += `- **Personalized Service:** Every client receives a customized consultation\n`
    content += `- **5-Star Rated:** Over 300 five-star reviews on Google and Yelp\n\n`

    content += `### Contact Information\n\n`
    if (site.phone) {
      content += `- **Phone:** ${site.phone}\n`
    }
    if (site.email) {
      content += `- **Email:** ${site.email}\n`
    }
    content += `- **Website:** ${site.siteUrl}\n`
    content += `- **Address:** 429 S Coast Hwy, Oceanside, CA 92054\n`

    content += `\n### Service Areas\n\n`
    content += `LashPop Studios serves clients from throughout North County San Diego including:\n`
    content += `- Oceanside (home location)\n`
    content += `- Carlsbad (12 min drive)\n`
    content += `- Encinitas (18 min drive)\n`
    content += `- Vista (15 min drive)\n`
    content += `- San Marcos (20 min drive)\n`
    content += `- Del Mar, Solana Beach, Leucadia, and surrounding areas\n`

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

    // Team Members Section
    try {
      const team = await db
        .select({
          name: teamMembers.name,
          role: teamMembers.role,
          specialties: teamMembers.specialties,
          bio: teamMembers.bio
        })
        .from(teamMembers)
        .where(eq(teamMembers.isActive, true))
        .limit(20)

      if (team.length > 0) {
        content += '## Our Team\n\n'
        content += `LashPop Studios has a team of ${team.length} talented beauty professionals.\n\n`
        for (const member of team) {
          content += `### ${member.name}\n`
          content += `**${member.role}**\n`
          if (member.specialties && Array.isArray(member.specialties) && member.specialties.length > 0) {
            content += `Specialties: ${member.specialties.join(', ')}\n`
          }
          if (member.bio) {
            content += `${member.bio.slice(0, 150)}${member.bio.length > 150 ? '...' : ''}\n`
          }
          content += '\n'
        }
      }
    } catch {
      // Team members table might not exist
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
    content += `### Booking Policies\n\n`
    content += `- **Appointments Required:** Walk-ins welcome based on availability, but appointments are recommended\n`
    content += `- **Cancellation Policy:** Please provide 24-hour notice for cancellations\n`
    content += `- **Late Arrivals:** Appointments may be shortened or rescheduled if more than 15 minutes late\n`
    content += `- **New Clients:** First-time lash extension appointments include a consultation\n\n`

    // Careers section
    content += '## Careers\n\n'
    content += `LashPop Studios is always looking for talented beauty professionals to join our team.\n\n`
    content += `### Career Opportunities\n\n`
    content += `- **Employee Positions:** Full benefits, training, flexible scheduling, competitive commission\n`
    content += `- **Booth Rental:** Independence with community support, starting at $55-85/day depending on space and days per week\n`
    content += `- **LashPop Pro Training:** Comprehensive lash extension training program for aspiring artists\n\n`
    content += `Visit ${site.siteUrl}/work-with-us to learn more or apply.\n\n`

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
      '# LashPop Studios\n\n> Premium lash extensions and beauty services in Oceanside, California. Serving North County San Diego including Carlsbad, Encinitas, Vista, and San Marcos.\n\nVisit https://lashpopstudios.com for more information.\n',
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      }
    )
  }
}
