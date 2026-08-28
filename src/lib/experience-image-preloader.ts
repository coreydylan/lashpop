'use client'

import type { CarouselDisplayPhoto } from '@/actions/work-with-us-carousel'
import {
  isConstrainedImageConnection,
  isResponsiveImageReady,
  preloadResponsiveImage,
  preloadResponsiveImages,
  type ResponsiveImageCandidate,
} from '@/lib/responsive-image-preloader'

export interface GalleryImageSource {
  mediaUrl: string
}

export const GALLERY_THUMB_SIZES = '(max-width: 768px) 100vw, 320px'
export const GALLERY_THUMB_WIDTHS = [320, 384, 600, 900, 1200, 1440, 1800, 2400] as const
export const TEAM_THUMB_SIZES = '(max-width: 768px) 224px, 256px'
export const TEAM_THUMB_WIDTHS = [256, 320, 384, 600, 900] as const
export const LIGHTBOX_SIZES = '1600px'
export const LIGHTBOX_WIDTHS = [1600] as const
export const WORK_PATH_CARD_SIZES = '(max-width: 767px) calc(100vw - 40px), 360px'
export const WORK_FRONT_DESK_SIZES = '480px'
export const WORK_TRAINING_SIZES = '(max-width: 767px) calc(100vw - 40px), 480px'
export const WORK_LOUNGE_SIZES = '(max-width: 767px) calc(100vw - 40px), 896px'
export const WORK_STATIC_WIDTHS = [320, 384, 600, 900, 1200, 1440, 1800, 2400] as const

export const WORK_WITH_US_STATIC_IMAGES = [
  '/lashpop-images/culture/join-our-team.webp',
  '/lashpop-images/culture/booth-rental.webp',
  '/lashpop-images/culture/training.webp',
  '/lashpop-images/culture/team-front-desk.jpeg',
  '/lashpop-images/culture/team-lounge.jpg',
] as const

export function galleryThumbnailCandidate(src: string): ResponsiveImageCandidate {
  return { src, sizes: GALLERY_THUMB_SIZES, widths: GALLERY_THUMB_WIDTHS, quality: 90 }
}

export function teamThumbnailCandidate(src: string): ResponsiveImageCandidate {
  return { src, sizes: TEAM_THUMB_SIZES, widths: TEAM_THUMB_WIDTHS, quality: 90 }
}

export function lightboxCandidate(src: string): ResponsiveImageCandidate {
  return { src, sizes: LIGHTBOX_SIZES, widths: LIGHTBOX_WIDTHS, quality: 90 }
}

export function workWithUsStaticCandidate(src: string, sizes: string): ResponsiveImageCandidate {
  return {
    src,
    sizes,
    widths: WORK_STATIC_WIDTHS,
    quality: 90,
  }
}

function workWithUsStaticCandidates(): ResponsiveImageCandidate[] {
  const pathCards = WORK_WITH_US_STATIC_IMAGES.slice(0, 3)
    .map((src) => workWithUsStaticCandidate(src, WORK_PATH_CARD_SIZES))

  return [
    ...pathCards,
    workWithUsStaticCandidate('/lashpop-images/culture/team-front-desk.jpeg', WORK_FRONT_DESK_SIZES),
    workWithUsStaticCandidate('/lashpop-images/culture/training.webp', WORK_TRAINING_SIZES),
    workWithUsStaticCandidate('/lashpop-images/culture/team-lounge.jpg', WORK_LOUNGE_SIZES),
  ]
}

export function isGalleryThumbnailReady(src: string): boolean {
  return isResponsiveImageReady(galleryThumbnailCandidate(src))
}

export function isTeamThumbnailReady(src: string): boolean {
  return isResponsiveImageReady(teamThumbnailCandidate(src))
}

export function isLightboxImageReady(src: string): boolean {
  return isResponsiveImageReady(lightboxCandidate(src))
}

export function isWorkWithUsImageReady(src: string, sizes: string): boolean {
  return isResponsiveImageReady(workWithUsStaticCandidate(src, sizes))
}

export function preloadWorkWithUsImage(src: string, sizes: string): Promise<void> {
  return preloadResponsiveImage(workWithUsStaticCandidate(src, sizes))
}

export async function preloadGalleryExperience(posts: readonly GalleryImageSource[]): Promise<void> {
  if (isConstrainedImageConnection()) return
  const sources = Array.from(new Set(posts.map((post) => post.mediaUrl).filter(Boolean)))
  await preloadResponsiveImages(sources.map(galleryThumbnailCandidate), { concurrency: 8 })
  await preloadResponsiveImages(sources.map(lightboxCandidate), { concurrency: 4 })
}

export async function preloadWorkWithUsPhotos(photos: readonly CarouselDisplayPhoto[]): Promise<void> {
  if (isConstrainedImageConnection()) return
  const sources = Array.from(new Set(photos.map((photo) => photo.filePath).filter(Boolean)))
  await Promise.all([
    preloadResponsiveImages(
      workWithUsStaticCandidates(),
      { concurrency: 5 },
    ),
    preloadResponsiveImages(sources.map(teamThumbnailCandidate), { concurrency: 8 }),
  ])
  await preloadResponsiveImages(sources.map(lightboxCandidate), { concurrency: 4 })
}

export function promoteGalleryImage(src: string): void {
  void preloadResponsiveImage(galleryThumbnailCandidate(src), 'high')
  void preloadResponsiveImage(lightboxCandidate(src), 'high')
}

export function promoteTeamImage(src: string): void {
  void preloadResponsiveImage(teamThumbnailCandidate(src), 'high')
  void preloadResponsiveImage(lightboxCandidate(src), 'high')
}
