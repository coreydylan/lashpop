import type { Metadata, Viewport } from 'next'
import { Inter, Zilla_Slab, Playfair_Display, Josefin_Slab, Chivo, Andika, League_Script, Swanky_and_Moo_Moo, Licorice } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { UserKnowledgeProvider } from '@/contexts/UserKnowledgeContext'
import { FindYourLookProvider } from '@/components/find-your-look'
import { getSEOSettings } from '@/actions/seo'
import { LocalBusinessSchema, WebSiteSchema, FAQSchema, ServicesSchema, ReviewSchema } from '@/components/seo'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const zillaSlab = Zilla_Slab({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-zilla-slab',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
})

const josefin = Josefin_Slab({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-josefin',
})

const chivo = Chivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-chivo',
})

const andika = Andika({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-andika',
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

const licorice = Licorice({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-licorice',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
    keywords: 'lash extensions, eyelash extensions, volume lashes, classic lashes, mega volume, lash lift, Los Angeles, beauty studio',
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
    <html lang="en" className={`${inter.variable} ${zillaSlab.variable} ${playfair.variable} ${josefin.variable} ${chivo.variable} ${andika.variable} ${leagueScript.variable} ${swanky.variable} ${licorice.variable}`}>
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
            </FindYourLookProvider>
          </UserKnowledgeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}