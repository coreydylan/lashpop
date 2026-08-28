'use client'

import { useState } from 'react'
import Image from 'next/image'
import { uniqueImageCandidates } from './quiz-result-image'

interface QuizBlurFadeImageProps {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  className?: string
  objectPosition?: string
  fallbackSrcs?: Array<string | null | undefined>
}

export function QuizBlurFadeImage({
  src,
  alt,
  sizes,
  priority = false,
  className = '',
  objectPosition,
  fallbackSrcs = [],
}: QuizBlurFadeImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set())
  const candidates = uniqueImageCandidates(src, fallbackSrcs)
  const activeSrc = candidates.find((candidate) => !failedSrcs.has(candidate)) ?? null
  const isLoaded = loadedSrc === activeSrc

  return (
    <>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-br from-[#ead7cf] via-[#f5ebe5] to-[#dfb9aa] transition-opacity duration-500 ease-out motion-reduce:transition-none ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.72),transparent_48%)]" />
        <div className="absolute inset-0 animate-pulse bg-white/10 motion-reduce:animate-none" />
      </div>

      {activeSrc && (
        <Image
          key={activeSrc}
          src={activeSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={90}
          style={objectPosition ? { objectPosition } : undefined}
          onLoad={() => setLoadedSrc(activeSrc)}
          onError={() => {
            setFailedSrcs((current) => new Set(current).add(activeSrc))
          }}
          className={`object-cover will-change-[opacity,filter,transform] transition-[opacity,filter,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            isLoaded
              ? 'opacity-100 blur-0 scale-100'
              : 'opacity-0 blur-[14px] scale-[1.04]'
          } ${className}`}
        />
      )}
    </>
  )
}
