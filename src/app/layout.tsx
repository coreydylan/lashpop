import type { Metadata, Viewport } from 'next'
import { Inter, Zilla_Slab, Playfair_Display, Josefin_Slab, Chivo, Andika, League_Script, Swanky_and_Moo_Moo, Licorice } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { UserKnowledgeProvider } from '@/contexts/UserKnowledgeContext'
import { FindYourLookProvider } from '@/components/find-your-look'

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

export const metadata: Metadata = {
  title: 'LashPop Studios - Effortless Beauty for the Modern Woman',
  description: 'Experience luxury lash services in Los Angeles. From classic to mega volume, discover your perfect lash look with our expert artists.',
  keywords: 'lash extensions, eyelash extensions, volume lashes, classic lashes, mega volume, lash lift, Los Angeles, beauty studio',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LashPop Studios',
  },
  openGraph: {
    title: 'LashPop Studios - Effortless Beauty for the Modern Woman',
    description: 'Experience luxury lash services in Los Angeles. Book your appointment today.',
    images: ['/images/og-image.jpg'],
    url: 'https://lashpopstudios.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LashPop Studios - Effortless Beauty for the Modern Woman',
    description: 'Effortless beauty for the modern woman',
    images: ['/images/twitter-card.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${zillaSlab.variable} ${playfair.variable} ${josefin.variable} ${chivo.variable} ${andika.variable} ${leagueScript.variable} ${swanky.variable} ${licorice.variable}`}>
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