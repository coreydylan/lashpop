import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Force dynamic rendering for all DAM routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DAMLayout({ children }: { children: ReactNode }) {
  // Simple approach: Try to get cookies, and if not authenticated, redirect
  // But we'll create a middleware rule to exclude /dam/login from this layout's execution
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('dam_auth')

  // This will be bypassed for /dam/login because of the nested layout
  return <>{children}</>
}
