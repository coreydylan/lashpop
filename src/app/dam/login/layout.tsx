import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Login layout - if already authenticated, redirect to /dam
export default async function LoginLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('dam_auth')

  // If already authenticated, redirect to DAM
  if (authCookie && authCookie.value === 'authenticated') {
    redirect('/dam')
  }

  return <>{children}</>
}
