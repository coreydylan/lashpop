'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { preloadQuizExperienceFully } from '@/components/find-your-look/quiz-image-preloader'
import { setBackgroundImagePreloadingDisabled } from '@/lib/responsive-image-preloader'
import type { CarouselDisplayPhoto } from '@/actions/work-with-us-carousel'
import {
  preloadWorkWithUsPhotos,
} from '@/lib/experience-image-preloader'

export function ExperienceImagePreloader({
  disabled = false,
  workWithUsPhotos,
}: {
  disabled?: boolean
  workWithUsPhotos: readonly CarouselDisplayPhoto[]
}) {
  const router = useRouter()

  useEffect(() => {
    setBackgroundImagePreloadingDisabled(disabled)
    if (disabled) return
    let active = true

    const warmEverything = async () => {
      if (!active) return

      router.prefetch('/work-with-us')
      try {
        await preloadQuizExperienceFully()
        if (!active) return
        if (active) await preloadWorkWithUsPhotos(workWithUsPhotos)
      } catch (error) {
        console.error('[preload] failed to warm image experiences', error)
      }
    }

    if (document.readyState === 'complete') {
      const timer = window.setTimeout(() => { void warmEverything() }, 0)
      return () => {
        active = false
        window.clearTimeout(timer)
      }
    }

    const onLoad = () => { void warmEverything() }
    window.addEventListener('load', onLoad, { once: true })
    return () => {
      active = false
      window.removeEventListener('load', onLoad)
      setBackgroundImagePreloadingDisabled(false)
    }
  }, [disabled, router, workWithUsPhotos])

  return null
}
