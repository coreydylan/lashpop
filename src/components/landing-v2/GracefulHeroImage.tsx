'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getPublicImageBlur } from '@/lib/image-blur'
import cfImageLoader, { cfPortraitImageLoader } from '@/lib/cf-image-loader'

const RESPONSIVE_HERO_WIDTHS = [320, 600, 900, 1200, 1440, 1800, 2400, 2880, 3200]

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
  portraitAspectRatio?: number
  preloadMedia?: string
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
  quality,
  className = '',
  portraitAspectRatio,
  preloadMedia,
}: GracefulHeroImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)
  const blurDataUrl = getPublicImageBlur(src)
  const status = loadedSrc === src ? 'loaded' : erroredSrc === src ? 'error' : 'loading'
  const responsiveLoader = ({ width }: { width: number }) => portraitAspectRatio && objectFit === 'cover'
    ? cfPortraitImageLoader({ src, width, quality, aspectRatio: portraitAspectRatio })
    : cfImageLoader({ src, width, quality })
  const responsiveSrcSet = preloadMedia
    ? RESPONSIVE_HERO_WIDTHS.map((width) => `${responsiveLoader({ width })} ${width}w`).join(', ')
    : undefined

  return (
    <>
      {preloadMedia && responsiveSrcSet && (
        <link
          rel="preload"
          as="image"
          href={responsiveLoader({ width: portraitAspectRatio ? 1200 : 1440 })}
          imageSrcSet={responsiveSrcSet}
          imageSizes={sizes}
          media={preloadMedia}
          fetchPriority="high"
          data-lashpop-hero-preload={preloadMedia}
        />
      )}
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
      </div>

      <Image
        src={src}
        alt={alt}
        fill
        className={`${objectFit === 'contain' ? 'object-contain' : 'object-cover'} transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 ${
          status === 'loaded' ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
        } ${className}`}
        style={{ objectPosition }}
        sizes={sizes}
        priority={priority && !preloadMedia}
        fetchPriority={preloadMedia ? 'auto' : fetchPriority}
        decoding="async"
        quality={quality}
        loader={portraitAspectRatio && objectFit === 'cover'
          ? ({ src: loaderSrc, width, quality: loaderQuality }) => cfPortraitImageLoader({
              src: loaderSrc,
              width,
              quality: loaderQuality,
              aspectRatio: portraitAspectRatio,
            })
          : undefined}
        onLoad={(event) => {
          const image = event.currentTarget
          void image.decode().catch(() => undefined).finally(() => setLoadedSrc(src))
        }}
        onError={() => setErroredSrc(src)}
      />
    </>
  )
}
