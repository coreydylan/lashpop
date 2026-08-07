'use client'

import type { ComponentProps } from 'react'
import Image from 'next/image'

/**
 * Team media is predecoded before navigation, so the image itself should not
 * add another blur animation. A supplied LQIP can still hold the frame during
 * a genuine cold load, but cached images paint sharp immediately.
 */
export function FadeInImage({
  blurDataUrl,
  className = '',
  ...props
}: ComponentProps<typeof Image> & { blurDataUrl?: string | null }) {
  return (
    <Image
      {...props}
      alt={props.alt ?? ''}
      placeholder={blurDataUrl ? 'blur' : 'empty'}
      blurDataURL={blurDataUrl ?? undefined}
      className={className}
    />
  )
}
