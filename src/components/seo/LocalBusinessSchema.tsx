/**
 * LocalBusiness Schema Component
 *
 * Generates JSON-LD structured data for local business SEO.
 * This helps Google understand your business and display rich results.
 * Includes employee credentials for E-E-A-T signals.
 */

import { getDb } from '@/db'
import { businessLocations } from '@/db/schema/business_locations'
import { reviews } from '@/db/schema/reviews'
import { teamMembers, type TeamMemberCredential } from '@/db/schema/team_members'
import { sql, eq, and, isNotNull, gte } from 'drizzle-orm'
import type { BusinessCredential } from '@/types/seo'

interface LocalBusinessSchemaProps {
  siteSettings: {
    businessName: string
    businessDescription: string
    businessType: string
    phone?: string
    email?: string
    siteUrl: string
    siteName: string
    logo?: { url: string } | null
    socialProfiles: {
      instagram?: string
      facebook?: string
      tiktok?: string
      twitter?: string
      yelp?: string
      pinterest?: string
    }
    credentials?: BusinessCredential[]
  }
}

interface BusinessLocation {
  id: string
  businessName: string
  streetAddress?: string | null
  city?: string | null
  regionCode?: string | null
  regionName?: string | null
  postalCode?: string | null
  businessPhone?: string | null
}

interface ReviewStats {
  count: number
  averageRating: number
}

interface TeamMemberWithCredentials {
  id: string
  name: string
  role: string
  credentials: TeamMemberCredential[]
}

async function getBusinessLocations(): Promise<BusinessLocation[]> {
  try {
    const db = getDb()
    const locations = await db
      .select({
        id: businessLocations.id,
        businessName: businessLocations.businessName,
        streetAddress: businessLocations.streetAddress,
        city: businessLocations.city,
        regionCode: businessLocations.regionCode,
        regionName: businessLocations.regionName,
        postalCode: businessLocations.postalCode,
        businessPhone: businessLocations.businessPhone
      })
      .from(businessLocations)

    return locations
  } catch {
    return []
  }
}

async function getReviewStats(): Promise<ReviewStats> {
  try {
    const db = getDb()
    const stats = await db
      .select({
        count: sql<number>`count(*)::int`,
        averageRating: sql<number>`round(avg(${reviews.rating})::numeric, 1)::float`
      })
      .from(reviews)
      .where(
        and(
          isNotNull(reviews.rating),
          gte(reviews.rating, 1)
        )
      )

    return {
      count: stats[0]?.count || 0,
      averageRating: stats[0]?.averageRating || 0
    }
  } catch {
    return { count: 0, averageRating: 0 }
  }
}

async function getTeamMembersWithCredentials(): Promise<TeamMemberWithCredentials[]> {
  try {
    const db = getDb()
    const members = await db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        role: teamMembers.role,
        credentials: teamMembers.credentials
      })
      .from(teamMembers)
      .where(eq(teamMembers.isActive, true))

    // Filter to only members who have credentials
    return members
      .filter(m => m.credentials && Array.isArray(m.credentials) && m.credentials.length > 0)
      .map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        credentials: m.credentials as TeamMemberCredential[]
      }))
  } catch {
    return []
  }
}

export async function LocalBusinessSchema({ siteSettings }: LocalBusinessSchemaProps) {
  const [locations, reviewStats, teamMembersWithCreds] = await Promise.all([
    getBusinessLocations(),
    getReviewStats(),
    getTeamMembersWithCredentials()
  ])

  // Build social profiles array
  const sameAs = Object.values(siteSettings.socialProfiles).filter(Boolean) as string[]

  // If we have locations, create schema for each
  const schemas = locations.length > 0
    ? locations.map((location, index) => createLocationSchema(
        location,
        siteSettings,
        reviewStats,
        sameAs,
        index === 0,
        teamMembersWithCreds
      ))
    : [createFallbackSchema(siteSettings, reviewStats, sameAs, teamMembersWithCreds)]

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}

function createLocationSchema(
  location: BusinessLocation,
  settings: LocalBusinessSchemaProps['siteSettings'],
  reviewStats: ReviewStats,
  sameAs: string[],
  isPrimary: boolean,
  employees: TeamMemberWithCredentials[]
) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': settings.businessType || 'BeautySalon',
    '@id': `${settings.siteUrl}/#${isPrimary ? 'organization' : `location-${location.id}`}`,
    name: location.businessName || settings.businessName,
    description: settings.businessDescription,
    url: settings.siteUrl,
    telephone: location.businessPhone || settings.phone,
    email: settings.email,
  }

  // Add logo if available
  if (settings.logo?.url) {
    schema.logo = {
      '@type': 'ImageObject',
      url: settings.logo.url
    }
    schema.image = settings.logo.url
  }

  // Add address if available
  if (location.streetAddress || location.city) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: location.streetAddress,
      addressLocality: location.city,
      addressRegion: location.regionCode || location.regionName,
      postalCode: location.postalCode,
      addressCountry: 'US'
    }
  }

  // Add aggregate rating if we have reviews
  if (reviewStats.count > 0 && reviewStats.averageRating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviewStats.averageRating,
      reviewCount: reviewStats.count,
      bestRating: 5,
      worstRating: 1
    }
  }

  // Add social profiles
  if (sameAs.length > 0) {
    schema.sameAs = sameAs
  }

  // Add price range (typical for beauty services)
  schema.priceRange = '$$'

  // Add opening hours (generic for now - could be made dynamic)
  schema.openingHoursSpecification = [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '19:00'
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens: '09:00',
      closes: '17:00'
    }
  ]

  // Add business credentials (licenses, certifications)
  if (settings.credentials && settings.credentials.length > 0) {
    schema.hasCredential = settings.credentials.map(cred => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: cred.type,
      name: cred.name,
      ...(cred.issuer && { recognizedBy: { '@type': 'Organization', name: cred.issuer } }),
      ...(cred.dateIssued && { dateCreated: cred.dateIssued }),
      ...(cred.licenseNumber && { identifier: cred.licenseNumber }),
      ...(cred.url && { url: cred.url })
    }))
  }

  // Add employees with credentials (for E-E-A-T signals)
  if (employees.length > 0) {
    schema.employee = employees.map(emp => ({
      '@type': 'Person',
      name: emp.name,
      jobTitle: emp.role,
      hasCredential: emp.credentials.map(cred => ({
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: cred.type,
        name: cred.name,
        ...(cred.issuer && { recognizedBy: { '@type': 'Organization', name: cred.issuer } }),
        ...(cred.dateIssued && { dateCreated: cred.dateIssued }),
        ...(cred.licenseNumber && { identifier: cred.licenseNumber }),
        ...(cred.url && { url: cred.url })
      }))
    }))
  }

  return schema
}

function createFallbackSchema(
  settings: LocalBusinessSchemaProps['siteSettings'],
  reviewStats: ReviewStats,
  sameAs: string[],
  employees: TeamMemberWithCredentials[]
) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': settings.businessType || 'BeautySalon',
    '@id': `${settings.siteUrl}/#organization`,
    name: settings.businessName,
    description: settings.businessDescription,
    url: settings.siteUrl,
    telephone: settings.phone,
    email: settings.email,
  }

  if (settings.logo?.url) {
    schema.logo = {
      '@type': 'ImageObject',
      url: settings.logo.url
    }
    schema.image = settings.logo.url
  }

  if (reviewStats.count > 0 && reviewStats.averageRating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviewStats.averageRating,
      reviewCount: reviewStats.count,
      bestRating: 5,
      worstRating: 1
    }
  }

  if (sameAs.length > 0) {
    schema.sameAs = sameAs
  }

  schema.priceRange = '$$'

  // Add business credentials (licenses, certifications)
  if (settings.credentials && settings.credentials.length > 0) {
    schema.hasCredential = settings.credentials.map(cred => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: cred.type,
      name: cred.name,
      ...(cred.issuer && { recognizedBy: { '@type': 'Organization', name: cred.issuer } }),
      ...(cred.dateIssued && { dateCreated: cred.dateIssued }),
      ...(cred.licenseNumber && { identifier: cred.licenseNumber }),
      ...(cred.url && { url: cred.url })
    }))
  }

  // Add employees with credentials (for E-E-A-T signals)
  if (employees.length > 0) {
    schema.employee = employees.map(emp => ({
      '@type': 'Person',
      name: emp.name,
      jobTitle: emp.role,
      hasCredential: emp.credentials.map(cred => ({
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: cred.type,
        name: cred.name,
        ...(cred.issuer && { recognizedBy: { '@type': 'Organization', name: cred.issuer } }),
        ...(cred.dateIssued && { dateCreated: cred.dateIssued }),
        ...(cred.licenseNumber && { identifier: cred.licenseNumber }),
        ...(cred.url && { url: cred.url })
      }))
    }))
  }

  return schema
}

export default LocalBusinessSchema
