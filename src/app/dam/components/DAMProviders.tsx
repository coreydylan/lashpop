"use client"

import { ReactNode } from 'react'
import { TutorialProvider } from '@/contexts/TutorialContext'

export function DAMProviders({ children }: { children: ReactNode }) {
  return (
    <TutorialProvider>
      {children}
    </TutorialProvider>
  )
}
