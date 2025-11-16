"use client"

import { ReactNode } from 'react'
import { DamTutorialProvider } from '@/contexts/DamTutorialContext'
import { QueryProvider } from '@/providers/QueryProvider'
import { PermissionsProvider } from '@/contexts/PermissionsContext'

export function DAMProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <PermissionsProvider>
        <DamTutorialProvider>
          {children}
        </DamTutorialProvider>
      </PermissionsProvider>
    </QueryProvider>
  )
}
