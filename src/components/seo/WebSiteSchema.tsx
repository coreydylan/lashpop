/**
 * WebSite Schema Component
 *
 * Generates JSON-LD structured data for the website itself.
 * Includes site name, URL, and potential actions (search, etc.).
 */

interface WebSiteSchemaProps {
  siteSettings: {
    siteName: string
    siteUrl: string
    businessDescription: string
  }
}

export function WebSiteSchema({ siteSettings }: WebSiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteSettings.siteUrl}/#website`,
    name: siteSettings.siteName,
    url: siteSettings.siteUrl,
    description: siteSettings.businessDescription,
    publisher: {
      '@id': `${siteSettings.siteUrl}/#organization`
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default WebSiteSchema
