import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// This layout protects all DAM routes except login
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('dam_auth')

  // If not authenticated, redirect to login
  if (!authCookie || authCookie.value !== 'authenticated') {
    redirect('/dam/login')
  }

  return <>{children}</>
}
