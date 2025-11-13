import { ReactNode } from 'react'
import { cookies } from 'next/headers'

// Force dynamic rendering for all DAM routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DAMLayout({ children }: { children: ReactNode }) {
  // Access cookies to force dynamic rendering
  await cookies()

  return <>{children}</>
}
