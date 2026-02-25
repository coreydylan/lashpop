import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, League_Script, Swanky_and_Moo_Moo } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { UserKnowledgeProvider } from '@/contexts/UserKnowledgeContext'
import { FindYourLookProvider } from '@/components/find-your-look'
import { getSEOSettings } from '@/actions/seo'
import { LocalBusinessSchema, WebSiteSchema, FAQSchema, ServicesSchema, ReviewSchema } from '@/components/seo'
import { DesignModeGate } from '@/components/dev/DesignModeGate'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Force dynamic rendering for all pages - root layout fetches SEO settings from database
export const dynamic = 'force-dynamic'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
})

const leagueScript = League_Script({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-league-script',
})

const swanky = Swanky_and_Moo_Moo({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-swanky',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // iOS safe area support
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf6f2' }, // ivory color
    { media: '(prefers-color-scheme: dark)', color: '#1C1917' }, // stone-900
  ],
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSEOSettings()
  const { site, pages } = settings
  const homepage = pages.homepage

  // Build OG images array
  const ogImages: { url: string; width?: number; height?: number; alt?: string }[] = []
  if (homepage.ogImage?.url) {
    ogImages.push({ url: homepage.ogImage.url, width: 1200, height: 630, alt: homepage.ogImage.alt || site.siteName })
  } else if (site.defaultOgImage?.url) {
    ogImages.push({ url: site.defaultOgImage.url, width: 1200, height: 630, alt: site.defaultOgImage.alt || site.siteName })
  }

  // Build Twitter images array
  const twitterImages: string[] = []
  if (homepage.twitterImage?.url) {
    twitterImages.push(homepage.twitterImage.url)
  } else if (site.defaultTwitterImage?.url) {
    twitterImages.push(site.defaultTwitterImage.url)
  } else if (ogImages.length > 0) {
    twitterImages.push(ogImages[0].url)
  }

  return {
    title: homepage.title || `${site.siteName} - ${site.businessDescription.slice(0, 50)}`,
    description: homepage.metaDescription || site.businessDescription,
    keywords: 'lash extensions, eyelash extensions, volume lashes, classic lashes, mega volume, lash lift, Oceanside, North County San Diego, beauty studio',
    metadataBase: new URL(site.siteUrl),
    alternates: {
      canonical: homepage.canonicalUrl || site.siteUrl,
    },
    robots: {
      index: !homepage.noIndex,
      follow: !homepage.noFollow,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: site.siteName,
    },
    openGraph: {
      title: homepage.ogTitle || homepage.title || site.siteName,
      description: homepage.ogDescription || homepage.metaDescription || site.businessDescription,
      images: ogImages.length > 0 ? ogImages : undefined,
      url: site.siteUrl,
      type: homepage.ogType || 'website',
      siteName: site.siteName,
    },
    twitter: {
      card: homepage.twitterCard || 'summary_large_image',
      title: homepage.twitterTitle || homepage.ogTitle || homepage.title || site.siteName,
      description: homepage.twitterDescription || homepage.ogDescription || homepage.metaDescription || site.businessDescription,
      images: twitterImages.length > 0 ? twitterImages : undefined,
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch SEO settings for Schema components
  const settings = await getSEOSettings()

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${leagueScript.variable} ${swanky.variable}`}>
      <head>
        {/* llms.txt discovery for AI assistants */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Information" />

        {/* JSON-LD Structured Data */}
        <WebSiteSchema siteSettings={settings.site} />
        <LocalBusinessSchema siteSettings={settings.site} />
        <FAQSchema />
        <ServicesSchema siteSettings={settings.site} />
        <ReviewSchema siteSettings={settings.site} />
      </head>
      <body className={`${inter.className} antialiased bg-ivory text-gray-800`}>
        <AuthProvider>
          <UserKnowledgeProvider>
            <FindYourLookProvider>
              {children}
              <DesignModeGate />
            </FindYourLookProvider>
          </UserKnowledgeProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}