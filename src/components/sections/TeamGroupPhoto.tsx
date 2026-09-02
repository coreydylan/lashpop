import Image from 'next/image'

import { getPublicImageBlur } from '@/lib/image-blur'

import styles from './TeamGroupPhoto.module.css'

const TEAM_PHOTO_SRC = '/lashpop-images/team/team-group-photo-2026-09-01.jpg'
const TEAM_PHOTO_WIDTH = 2048
const TEAM_PHOTO_HEIGHT = 1365

export function TeamGroupPhoto() {
  const blurDataURL = getPublicImageBlur(TEAM_PHOTO_SRC)

  return (
    <div className="mt-12 md:mt-20">
      <div className={styles.frame} data-team-group-photo-frame>
        <Image
          src={TEAM_PHOTO_SRC}
          alt=""
          aria-hidden="true"
          fill
          sizes="(min-width: 2048px) 100vw, 1px"
          quality={60}
          className={styles.backdrop}
          placeholder="blur"
          blurDataURL={blurDataURL}
          data-team-group-photo-backdrop
        />
        <Image
          src={TEAM_PHOTO_SRC}
          alt="The LashPop Studios team"
          width={TEAM_PHOTO_WIDTH}
          height={TEAM_PHOTO_HEIGHT}
          sizes="(min-width: 2048px) 2048px, 100vw"
          className={styles.foreground}
          placeholder="blur"
          blurDataURL={blurDataURL}
          data-team-group-photo-foreground
        />
      </div>
    </div>
  )
}
