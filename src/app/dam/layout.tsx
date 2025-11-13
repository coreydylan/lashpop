import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Force dynamic rendering for all DAM routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DAMLayout({ children }: { children: ReactNode }) {
  // Check authentication
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('dam_auth')

  // Get current path from headers
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''

  // If not authenticated and not on login page, redirect to login
  if (!authCookie || authCookie.value !== 'authenticated') {
    if (!pathname.includes('/login') && !pathname.includes('/api/dam/auth')) {
      redirect('/dam/login')
    }
  }

  return <>{children}</>
}
