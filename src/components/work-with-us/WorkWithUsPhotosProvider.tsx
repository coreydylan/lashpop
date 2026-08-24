'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { CarouselDisplayPhoto } from '@/actions/work-with-us-carousel'

const WorkWithUsPhotosContext = createContext<Promise<CarouselDisplayPhoto[]> | undefined>(undefined)

export function WorkWithUsPhotosProvider({
  photosPromise,
  children,
}: {
  photosPromise: Promise<CarouselDisplayPhoto[]>
  children: ReactNode
}) {
  return (
    <WorkWithUsPhotosContext.Provider value={photosPromise}>
      {children}
    </WorkWithUsPhotosContext.Provider>
  )
}

export function useWorkWithUsPhotos() {
  return useContext(WorkWithUsPhotosContext)
}
