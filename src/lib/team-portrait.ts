export type EffectiveTeamPortraitSource = "vagaro" | "local" | "placeholder"

export interface TeamPhotoParityInput {
  vagaroPhotoUrl?: string | null
  imageUrl?: string | null
  primaryPhotoId?: string | null
  primaryPhotoPath?: string | null
  cropSquareUrl?: string | null
  cropCloseUpCircleUrl?: string | null
}

export interface TeamPhotoParity {
  effectiveImageUrl: string
  effectiveImageSource: EffectiveTeamPortraitSource
  hasLocalPrimary: boolean
  hasRequiredLocalCrops: boolean
  localPrimaryIsLive: boolean
}

const TEAM_PLACEHOLDER = "/placeholder-team.svg"

function cleanUrl(value?: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function isPlaceholder(value: string): boolean {
  return value.includes("placeholder-team")
}

/** Resolve the one effective portrait shared by the public site and Admin. */
export function resolveTeamPhotoParity(input: TeamPhotoParityInput): TeamPhotoParity {
  const vagaroPhotoUrl = cleanUrl(input.vagaroPhotoUrl)
  const imageUrl = cleanUrl(input.imageUrl)
  const primaryPhotoPath = cleanUrl(input.primaryPhotoPath)

  const effectiveImageUrl = vagaroPhotoUrl || imageUrl || TEAM_PLACEHOLDER
  const effectiveImageSource: EffectiveTeamPortraitSource = vagaroPhotoUrl
    ? "vagaro"
    : isPlaceholder(effectiveImageUrl)
      ? "placeholder"
      : "local"

  return {
    effectiveImageUrl,
    effectiveImageSource,
    hasLocalPrimary: Boolean(input.primaryPhotoId && primaryPhotoPath),
    hasRequiredLocalCrops: Boolean(
      input.primaryPhotoId &&
      primaryPhotoPath &&
      cleanUrl(input.cropSquareUrl) &&
      cleanUrl(input.cropCloseUpCircleUrl),
    ),
    localPrimaryIsLive: Boolean(primaryPhotoPath && primaryPhotoPath === effectiveImageUrl),
  }
}
