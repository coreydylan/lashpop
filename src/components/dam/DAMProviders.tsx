"use client"

import { ReactNode } from 'react'
import { DamTutorialProvider } from '@/contexts/DamTutorialContext'
import { QueryProvider } from '@/providers/QueryProvider'

export function DAMProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <DamTutorialProvider>
        {children}
      </DamTutorialProvider>
    </QueryProvider>
  )
}
