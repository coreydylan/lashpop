// Vagaro's public staff endpoint — the one the actual /lashpop32/staff page calls.
// Returns photos, bios, and a numeric ServiceProviderID (distinct from the base64
// ID in the authenticated v2 API). No auth headers required.

export interface VagaroPublicProvider {
  ServiceProviderID: number
  FirstName: string
  LastName: string
  Cell?: string
  DayPhone?: string
  EmailId?: string
  Photo?: string
  ServiceProviderPhotoURL?: string         // 155x155 variant
  ServiceProviderPhotoURLForReviewPopup?: string  // 300x300 variant
  CDNUrl?: string
  BusinessSummary?: string
  EmployeeSortOrder?: number
  ReviewRank?: number
  ReviewCount?: number
  IsAllowBook?: boolean
  IsAcceptAppOnline?: boolean
}

// Vagaro serves generic silhouettes when a provider has no real photo.
// Filenames look like `user-female-img_155.jpg`, `user-male-img_155.jpg`, etc.
// Skip these so we don't overwrite a good local photo with a placeholder.
function isGenericVagaroPlaceholder(filename: string | null | undefined): boolean {
  if (!filename) return false
  return /\/?Images\/user-[a-z]+-img(?:_\d+)?\.(?:jpe?g|png|webp)$/i.test(filename) ||
         /^user-[a-z]+-img(?:_\d+)?\.(?:jpe?g|png|webp)$/i.test(filename)
}

// Build the highest-resolution photo URL by swapping the size segment to Original.
// The Vagaro CDN exposes: /155x155/, /300x300/, and /Original/ — the rest 404.
// Returns null when the source is a generic Vagaro placeholder so callers can
// preserve any local photo instead.
export function originalPhotoUrl(p: VagaroPublicProvider): string | null {
  if (p.CDNUrl && p.Photo) {
    if (isGenericVagaroPlaceholder(p.Photo)) return null
    return `${p.CDNUrl.replace(/\/+$/, '')}/Original/${p.Photo}`
  }
  // Fallback: swap a 155x155 or 300x300 in any known URL field
  const seed = p.ServiceProviderPhotoURLForReviewPopup || p.ServiceProviderPhotoURL || ''
  if (!seed) return null
  if (isGenericVagaroPlaceholder(seed)) return null
  return seed.replace(/\/(155x155|300x300|400x400)\//, '/Original/')
}

export async function fetchPublicStaff(numericBusinessId: string): Promise<VagaroPublicProvider[]> {
  const res = await fetch(
    'https://www.vagaro.com/us02/websiteapi/homepage/getshopdetailcompositestaff',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=UTF-8',
        accept: 'application/json',
        'x-requested-with': 'XMLHttpRequest',
        grouptoken: 'US02',
        brandedapp: 'false',
      },
      body: JSON.stringify({
        businessID: numericBusinessId,
        loginUserID: '0',
        bookText: 'Request',
      }),
    }
  )
  if (!res.ok) {
    throw new Error(`Vagaro public staff endpoint ${res.status}: ${await res.text()}`)
  }
  const json = (await res.json()) as { ServiceProviders?: VagaroPublicProvider[] } | VagaroPublicProvider[]
  const list = Array.isArray(json) ? json : (json.ServiceProviders ?? [])
  return list
}

export function nameKey(first?: string, last?: string): string {
  return `${(first ?? '').trim().toLowerCase()}|${(last ?? '').trim().toLowerCase()}`
}
