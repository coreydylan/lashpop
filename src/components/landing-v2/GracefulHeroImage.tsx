'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getPublicImageBlur } from '@/lib/image-blur'

interface GracefulHeroImageProps {
  src: string
  alt: string
  objectFit?: 'cover' | 'contain'
  objectPosition?: string
  sizes: string
  priority?: boolean
  fetchPriority?: 'high' | 'low' | 'auto'
  quality?: number
  className?: string
}

/**
 * Keeps the hero composed while the full image is downloading or decoding.
 * Public hero assets get a tiny precomputed blur; remotely managed images fall
 * back to the same warm tonal wash used throughout the landing page.
 */
export function GracefulHeroImage({
  src,
  alt,
  objectFit = 'cover',
  objectPosition,
  sizes,
  priority = false,
  fetchPriority = 'auto',
  quality = 70,
  className = '',
}: GracefulHeroImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)
  const blurDataUrl = getPublicImageBlur(src)
  const status = loadedSrc === src ? 'loaded' : erroredSrc === src ? 'error' : 'loading'

  return (
    <>
      <div
        aria-hidden
        className={`absolute inset-0 overflow-hidden bg-[#d8aa9a] transition-opacity duration-700 ease-out ${
          status === 'loaded' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {blurDataUrl && (
          <div
            className="absolute -inset-5 scale-110 bg-cover bg-center blur-xl"
            style={{ backgroundImage: `url("${blurDataUrl}")` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-ivory/25 via-transparent to-terracotta/15" />
        <div
          className={`hero-loading-sheen absolute inset-y-0 w-1/2 transition-opacity duration-300 ${
            status === 'loading' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      <Image
        src={src}
        alt={alt}
        fill
        className={`${objectFit === 'contain' ? 'object-contain' : 'object-cover'} transition-opacity duration-700 ease-out ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        style={{ objectPosition }}
        sizes={sizes}
        priority={priority}
        fetchPriority={fetchPriority}
        decoding="async"
        quality={quality}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setErroredSrc(src)}
      />
    </>
  )
}
