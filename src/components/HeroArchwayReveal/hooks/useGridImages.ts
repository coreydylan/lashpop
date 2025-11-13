/**
 * Hook to fetch and manage grid images from DAM
 */

import { useState, useEffect } from 'react'
import type { GridImage } from '../types'

// Fallback mock data with actual gallery images
const MOCK_IMAGES: GridImage[] = [
  {
    id: '1',
    url: '/lashpop-images/gallery/gallery-075b32b2.jpg',
    aspectRatio: 0.75,
    isKeyImage: true,
    alt: 'Featured lash work',
    width: 800,
    height: 1067,
  },
  {
    id: '2',
    url: '/lashpop-images/gallery/gallery-1b1e9a79.jpg',
    aspectRatio: 1.33,
    isKeyImage: false,
    alt: 'Beautiful lash styling',
    width: 1200,
    height: 900,
  },
  {
    id: '3',
    url: '/lashpop-images/gallery/gallery-img-1754.jpg',
    aspectRatio: 0.8,
    isKeyImage: false,
    alt: 'Lash extensions',
    width: 800,
    height: 1000,
  },
  {
    id: '4',
    url: '/lashpop-images/gallery/gallery-img-3405.jpeg',
    aspectRatio: 1.5,
    isKeyImage: false,
    alt: 'Professional lash work',
    width: 1200,
    height: 800,
  },
  {
    id: '5',
    url: '/lashpop-images/gallery/gallery-img-3961.jpeg',
    aspectRatio: 0.66,
    isKeyImage: false,
    alt: 'Lash artistry',
    width: 800,
    height: 1200,
  },
  {
    id: '6',
    url: '/lashpop-images/gallery/gallery-img-3962.jpeg',
    aspectRatio: 1.2,
    isKeyImage: false,
    alt: 'Lash transformation',
    width: 1200,
    height: 1000,
  },
  {
    id: '7',
    url: '/lashpop-images/gallery/gallery-img-3973.jpeg',
    aspectRatio: 0.85,
    isKeyImage: false,
    alt: 'Beautiful eyes',
    width: 900,
    height: 1060,
  },
  {
    id: '8',
    url: '/lashpop-images/gallery/gallery-img-3974.jpeg',
    aspectRatio: 1.1,
    isKeyImage: false,
    alt: 'Lash perfection',
    width: 1100,
    height: 1000,
  },
  {
    id: '9',
    url: '/lashpop-images/gallery/gallery-img-7044.jpg',
    aspectRatio: 0.9,
    isKeyImage: false,
    alt: 'Elegant lashes',
    width: 900,
    height: 1000,
  },
  {
    id: '10',
    url: '/lashpop-images/gallery/gallery-lash-40.jpeg',
    aspectRatio: 1.25,
    isKeyImage: false,
    alt: 'Stunning results',
    width: 1250,
    height: 1000,
  },
  {
    id: '11',
    url: '/lashpop-images/gallery/lash-102.jpeg',
    aspectRatio: 0.8,
    isKeyImage: false,
    alt: 'Lash volume',
    width: 800,
    height: 1000,
  },
  {
    id: '12',
    url: '/lashpop-images/gallery/lash-136.jpeg',
    aspectRatio: 1.3,
    isKeyImage: false,
    alt: 'Natural lashes',
    width: 1300,
    height: 1000,
  },
  {
    id: '13',
    url: '/lashpop-images/gallery/lash-92.jpeg',
    aspectRatio: 0.75,
    isKeyImage: false,
    alt: 'Lash extensions mastery',
    width: 750,
    height: 1000,
  },
]

export function useGridImages() {
  const [images, setImages] = useState<GridImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchImages() {
      try {
        // Try to fetch from DAM API
        const response = await fetch('/api/dam/grid-scroller')
        const data = await response.json()

        if (data.images && data.images.length > 0) {
          // Use images from DAM
          setImages(data.images)
        } else {
          // Fall back to mock images if no DAM images yet
          console.log('Using mock images:', data.message)
          setImages(MOCK_IMAGES)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching grid images, using mock data:', err)
        // Fall back to mock images on error
        setImages(MOCK_IMAGES)
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [])

  return {
    images,
    isLoading,
    error,
    keyImage: images.find((img) => img.isKeyImage),
    otherImages: images.filter((img) => !img.isKeyImage),
  }
}
