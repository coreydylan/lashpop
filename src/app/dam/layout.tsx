import { ReactNode } from 'react'

// Force dynamic rendering for all DAM routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DAMLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
