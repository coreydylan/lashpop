/**
 * Auth Provider Component
 *
 * Wraps the app to provide authentication context
 */

'use client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // BetterAuth doesn't require a provider wrapper
  // The client hooks manage their own state
  return <>{children}</>
}
