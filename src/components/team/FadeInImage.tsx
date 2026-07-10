'use client'

import { useCallback, useEffect, useState, type ComponentProps } from 'react'
import Image from 'next/image'

/**
 * next/image swaps its blur placeholder for the sharp pixels in a single
 * frame — a visible "snap". This renders the arrival smoothly instead: the
 * sharp image starts blurred + slightly scaled and eases to crisp over
 * 500ms (the Medium-style focus-in). It never changes DOM structure — only
 * the img's filter/transform — so it works for both fill and intrinsic
 * layouts, and the tiny LQIP still paints instantly underneath.
 */
export function FadeInImage({
  blurDataUrl,
  className = '',
  onLoad,
  ...props
}: ComponentProps<typeof Image> & { blurDataUrl?: string | null }) {
  const [loaded, setLoaded] = useState(false)

  // Re-blur when the src swaps in place (e.g. drawer photo navigation).
  const src = props.src
  useEffect(() => {
    setLoaded(false)
  }, [src])

  // Cached images can complete before hydration, so React's synthetic
  // onLoad never fires — check .complete on mount via callback ref.
  const refCb = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) setLoaded(true)
  }, [])

  return (
    <Image
      {...props}
      ref={refCb}
      alt={props.alt ?? ''}
      placeholder={blurDataUrl ? 'blur' : 'empty'}
      blurDataURL={blurDataUrl ?? undefined}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
      className={`${className} transition-[filter,transform] duration-500 ease-out ${
        loaded ? 'blur-0 scale-100' : 'blur-md scale-105'
      }`}
    />
  )
}
