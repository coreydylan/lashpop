import { getEnabledCarouselPhotos } from '@/actions/work-with-us-carousel'
import { TeamCarousel } from './TeamCarousel'

export async function TeamCarouselServer() {
  const photos = await getEnabledCarouselPhotos()

  if (photos.length === 0) {
    return null
  }

  return <TeamCarousel photos={photos} />
}
