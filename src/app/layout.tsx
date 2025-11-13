import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // iOS safe area support
}

export const metadata: Metadata = {
  title: 'LashPop Studios | Award-Winning Lash Extensions & Beauty Services',
  description: 'Experience the art of natural beauty enhancement at LashPop Studios. Award-winning lash extensions, lifts, brow services, and advanced skincare treatments.',
  keywords: 'lash extensions, volume lashes, classic lashes, lash lift, brow services, beauty salon, skincare',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F1' }, // cream color
    { media: '(prefers-color-scheme: dark)', color: '#1C1917' }, // stone-900
  ],
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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={`${inter.className} antialiased bg-stone-50 text-gray-800`}>
        {children}
      </body>
    </html>
  )
}