import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Login layout - just pass through for now to avoid redirect loops
export default async function LoginLayout({ children }: { children: ReactNode }) {
  // Force dynamic rendering by accessing cookies
  await cookies()

  return <>{children}</>
}
