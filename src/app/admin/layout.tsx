import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/auth'
import { AdminShell } from '@/components/admin-shell/AdminShell'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * Master admin layout.
 *
 * Auth-gates the entire /admin tree, then wraps children in the unified
 * AdminShell (sidebar + mobile menu + user footer). Replaces what used
 * to live in /admin/website/layout.tsx so there's one shell everywhere.
 *
 * The /admin/no-access route is excluded from the shell so signed-in
 * users without admin access get a clean message instead of seeing the
 * nav they can't use.
 */
export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  // The middleware already ensured a cookie exists; this validates the
  // session against the DB and checks the admin flag.
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  // /admin/no-access and /admin/login render without the shell or auth gate —
  // let them through (the login page must be reachable while signed out).
  if (pathname.startsWith('/admin/no-access') || pathname.startsWith('/admin/login')) {
    return <>{children}</>
  }

  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }
  if (!session.isAdmin) {
    redirect('/admin/no-access')
  }

  return (
    <AdminShell
      user={{
        name: session.name,
        phoneNumber: session.phoneNumber,
        email: session.email,
      }}
    >
      {children}
    </AdminShell>
  )
}
