import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, Josefin_Slab, Chivo, Andika, League_Script } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { UserKnowledgeProvider } from '@/contexts/UserKnowledgeContext'

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // iOS safe area support
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F1' }, // cream color
    { media: '(prefers-color-scheme: dark)', color: '#1C1917' }, // stone-900
  ],
}

export const metadata: Metadata = {
  title: 'LashPop Studios | Award-Winning Lash Extensions & Beauty Services',
  description: 'Experience the art of natural beauty enhancement at LashPop Studios. Award-winning lash extensions, lifts, brow services, and advanced skincare treatments.',
  keywords: 'lash extensions, volume lashes, classic lashes, lash lift, brow services, beauty salon, skincare',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LashPop Studios',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${josefin.variable} ${chivo.variable} ${andika.variable} ${leagueScript.variable}`}>
      <body className={`${inter.className} antialiased bg-stone-50 text-gray-800`}>
        <AuthProvider>
          <UserKnowledgeProvider>
            {children}
          </UserKnowledgeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}