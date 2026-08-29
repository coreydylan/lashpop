import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { getPageSEO } from '@/actions/seo'
import type { CarouselDisplayPhoto } from '@/actions/work-with-us-carousel'
import { WorkWithUsPhotosProvider } from '@/components/work-with-us/WorkWithUsPhotosProvider'
import { resolvePublicImages } from '@/lib/public-image-delivery.server'

export const dynamic = 'force-dynamic'

// The work-with-us page itself is a client component, so its metadata lives
// here in a server layout. Reads the admin-configured "Work With Us" SEO
// (/admin/website/seo → Work With Us tab) with fallback to site defaults.
export async function generateMetadata(): Promise<Metadata> {
  const { site, page } = resolvePublicImages(await getPageSEO('workWithUs'))

  const title = page.title || `Careers at ${site.siteName} | Join Our Team`
  const description = page.metaDescription || site.businessDescription

  const ogImageUrl = page.ogImage?.url || site.defaultOgImage?.url
  const ogImages = ogImageUrl
    ? [{ url: ogImageUrl, width: 1200, height: 630, alt: page.ogImage?.alt || site.siteName }]
    : undefined

  return {
    title,
    description,
    metadataBase: new URL(site.siteUrl),
    alternates: { canonical: page.canonicalUrl || `${site.siteUrl}/work-with-us` },
    robots: { index: !page.noIndex, follow: !page.noFollow },
    openGraph: {
      title: page.ogTitle || title,
      description: page.ogDescription || description,
      images: ogImages,
      url: `${site.siteUrl}/work-with-us`,
      type: page.ogType || 'website',
      siteName: site.siteName,
    },
    twitter: {
      card: page.twitterCard || 'summary_large_image',
      title: page.twitterTitle || page.ogTitle || title,
      description: page.twitterDescription || page.ogDescription || description,
      images: page.twitterImage?.url
        ? [page.twitterImage.url]
        : ogImageUrl
        ? [ogImageUrl]
        : undefined,
    },
  }
}

async function loadCarouselPhotos(): Promise<CarouselDisplayPhoto[]> {
  try {
    // Defer the action module because it initializes the Cloudflare DB client
    // at module evaluation. Build workers intentionally do not receive runtime
    // database credentials; the live request does.
    const { getEnabledCarouselPhotos } = await import('@/actions/work-with-us-carousel')
    return await getEnabledCarouselPhotos()
  } catch (error) {
    console.error(JSON.stringify({
      message: 'failed to load Work With Us carousel photos',
      error: error instanceof Error ? error.message : String(error),
    }))
    return []
  }
}

export default function WorkWithUsLayout({ children }: { children: ReactNode }) {
  // Start the database request with the route, but let the page stream while
  // only the carousel waits inside its Suspense boundary.
  const photosPromise = process.env.PLAYWRIGHT_FIXTURES === '1'
    ? Promise.resolve([])
    : loadCarouselPhotos()

  return (
    <WorkWithUsPhotosProvider photosPromise={photosPromise}>
      {children}
    </WorkWithUsPhotosProvider>
  )
}
