import { useState, useEffect, useMemo } from 'react'
import {
  HeroArchwayConfig,
  HeroArchwayImage,
  DeviceVariant,
  defaultHeroArchwayConfig,
  getRandomImage
} from '@/types/hero-archway'

interface HeroArchwayData {
  config: HeroArchwayConfig
  selectedImages: {
    desktop: HeroArchwayImage | null
    mobile: HeroArchwayImage | null
  }
}

interface UseHeroArchwayConfigResult {
  config: HeroArchwayConfig
  currentVariant: DeviceVariant
  currentImage: HeroArchwayImage | null
  loading: boolean
  error: Error | null
}

// Session storage key for per-session mode
const SESSION_KEY = 'hero-archway-session-images'

// Get or generate session images
function getSessionImages(config: HeroArchwayConfig): { desktop: HeroArchwayImage | null; mobile: HeroArchwayImage | null } {
  if (typeof window === 'undefined') {
    return { desktop: null, mobile: null }
  }

  try {
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      // Verify the cached images still exist in config
      const desktopStillValid = parsed.desktop && config.desktop.images.some(
        img => img.id === parsed.desktop.id && img.enabled
      )
      const mobileStillValid = parsed.mobile && config.mobile.images.some(
        img => img.id === parsed.mobile.id && img.enabled
      )

      if (desktopStillValid || mobileStillValid) {
        return {
          desktop: desktopStillValid ? parsed.desktop : getRandomImage(config.desktop.images),
          mobile: mobileStillValid ? parsed.mobile : getRandomImage(config.mobile.images)
        }
      }
    }
  } catch {
    // Ignore storage errors
  }

  // Generate new session images
  const newImages = {
    desktop: getRandomImage(config.desktop.images),
    mobile: getRandomImage(config.mobile.images)
  }

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newImages))
  } catch {
    // Ignore storage errors
  }

  return newImages
}

export function useHeroArchwayConfig(isMobile: boolean): UseHeroArchwayConfigResult {
  const [data, setData] = useState<HeroArchwayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [sessionImages, setSessionImages] = useState<{
    desktop: HeroArchwayImage | null
    mobile: HeroArchwayImage | null
  }>({ desktop: null, mobile: null })

  useEffect(() => {
    let mounted = true

    async function fetchConfig() {
      try {
        const response = await fetch('/api/website/hero-archway')
        if (!response.ok) throw new Error('Failed to fetch hero config')

        const result: HeroArchwayData = await response.json()

        if (mounted) {
          setData(result)

          // Handle per-session mode
          if (result.config.randomMode === 'per-session') {
            const images = getSessionImages(result.config)
            setSessionImages(images)
          }

          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
          setLoading(false)
        }
      }
    }

    fetchConfig()

    return () => {
      mounted = false
    }
  }, [])

  const config = data?.config ?? defaultHeroArchwayConfig
  const currentVariant = isMobile ? config.mobile : config.desktop

  // Determine current image based on random mode
  const currentImage = useMemo(() => {
    if (!data) return null

    const { config, selectedImages } = data

    switch (config.randomMode) {
      case 'disabled':
        // First enabled image
        return currentVariant.images.find(img => img.enabled) || null

      case 'per-session':
        // Use session-cached images
        return isMobile ? sessionImages.mobile : sessionImages.desktop

      case 'per-page-load':
      case 'time-based':
      default:
        // Use server-selected random images
        return isMobile ? selectedImages.mobile : selectedImages.desktop
    }
  }, [data, currentVariant, isMobile, sessionImages])

  return {
    config,
    currentVariant,
    currentImage,
    loading,
    error
  }
}
