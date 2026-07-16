// Vagaro's public services endpoint — same booking-page composite that
// /lashpop32/services calls. Returns ServicePhotoURL per service.
//
// The authenticated v2 /api/v2/services endpoint omits image fields entirely,
// so we have to source service photos from this public payload and match
// back to v2 services by title.

export interface VagaroPublicService {
  ServiceID: number
  ParentServiceID: number
  ServiceTitle: string
  Photo: string                  // relative filename, e.g. "32173928_69973$2026_03_18_17_27_10_9240.jpg"
  ServicePhotoURL?: string       // fully-formed CDN URL at /Service/340x340/<Photo>
  IsActive: boolean
  IsSoftDeleted: boolean
}

interface CompositeResponse {
  Services?: Array<{
    ServiceList?: VagaroPublicService[]
    ServiceCategoryTitle?: string
    ServiceCategoryID?: number
    ParentServiceTitle?: string
    ServiceTitle?: string
    ParentServiceID?: number
  }>
  ServicesData?: VagaroPublicService[]
}

const COMPOSITE_BODY = {
  loginUserID: '0',
  pageIndex: 1,
  pageSize: null as number | null,
  IsForNewCustomer: 0,
  IsPackageInclude: 1,
  bookText: 'Request',
  classBookText: 'Request',
  currencySymbol: '$',
  MerchantAccount: 3,
  IsShowCustomPackage: false,
  IsOutcallMandatory: false,
  OutcallPointRedeem: 0,
  OutCallPrice: 0,
  IsMobileServiceMandatory: 0,
  ServiceProviderId: null as string | null,
  Referral: 0,
}

// Swap /Service/<size>/ for /Service/Original/ to get the full-res variant.
// The CDN exposes 155x155, 340x340, and Original; the rest 404.
export function originalServicePhotoUrl(url: string | undefined | null): string | null {
  if (!url) return null
  return url.replace(/\/Service\/(155x155|340x340|400x400)\//, '/Service/Original/')
}

/**
 * HEAD-check a Vagaro CDN URL. Vagaro's composite endpoint sometimes returns
 * URLs for service photos that have been deleted from their CDN (the row
 * still has a Photo field but the file 404s). Without this guard we'd write
 * the dead URL into vagaro_image_url every sync and the website would render
 * a broken-image badge. Returns the URL if it serves, otherwise null.
 *
 * One HTTP round-trip per photo per sync (~84 services) — adds ~5-8s to the
 * sync wall-clock but eliminates broken-image badges as a class of bug.
 */
export async function probeVagaroPhotoUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (res.ok) return url
  } catch {
    // Network errors treated the same as 404 — better to skip than to write
    // a URL we couldn't verify.
  }
  return null
}

export function serviceTitleKey(title: string | undefined | null): string {
  return (title ?? '').trim().toLowerCase()
}

export interface PublicServicePhotos {
  byTitle: Map<string, string>
  byServiceId: Map<string, string>
}

/**
 * Enriched per-service record from the public composite. `ParentServiceTitle`
 * is the category title for the group the service was listed under (the
 * composite groups services by parent category but doesn't repeat it on each
 * row, so we attach it during traversal).
 */
export interface PublicServiceRecord {
  serviceId: string                  // stringified for consistency with vagaroServiceId column
  parentServiceId: string | null     // ditto
  serviceTitle: string
  parentServiceTitle: string | null
  parentCategoryId: string | null
  photoUrl: string | null            // upgraded to /Original/ variant, or null when no real photo
  isActive: boolean
  isSoftDeleted: boolean
  raw: VagaroPublicService           // keep original for vagaro_data fallback storage
}

export interface PublicCategoryRecord {
  categoryId: string
  title: string
  displayOrder: number
  serviceCount: number
}

export interface PublicServicesPayload {
  /** Vagaro categories in the exact order shown on its booking page. */
  categories: PublicCategoryRecord[]
  /** Full list of services from the composite, filtered to active+non-deleted. */
  records: PublicServiceRecord[]
  /** Title → photo URL map. Retained for legacy callers and for title-fallback lookups. */
  photosByTitle: Map<string, string>
  /** ServiceID (stringified) → photo URL map. */
  photosByServiceId: Map<string, string>
}

/**
 * Internal: fetch + parse the composite once. Walks the category-grouped
 * structure and emits one record per service plus the matching photo maps.
 * Photos and records are derived from the same traversal so they stay in sync.
 */
async function fetchPublicServices(numericBusinessId: string): Promise<PublicServicesPayload> {
  const res = await fetch(
    'https://www.vagaro.com/us02/websiteapi/homepage/getshopdetailcompositeservice',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=UTF-8',
        accept: 'application/json, text/javascript, */*; q=0.01',
        'x-requested-with': 'XMLHttpRequest',
        grouptoken: 'US02',
        brandedapp: 'false',
        referer: `https://www.vagaro.com/`,
      },
      body: JSON.stringify({ ...COMPOSITE_BODY, businessID: numericBusinessId }),
    }
  )
  if (!res.ok) {
    throw new Error(`Vagaro public services endpoint ${res.status}: ${await res.text()}`)
  }

  const json = (await res.json()) as CompositeResponse
  const records: PublicServiceRecord[] = []
  const categories: PublicCategoryRecord[] = []
  const photosByTitle = new Map<string, string>()
  const photosByServiceId = new Map<string, string>()
  const seenServiceIds = new Set<string>()

  // Services[] is grouped by category. Each group carries a title and a list
  // of child services. The parent category title isn't always denormalized
  // onto each service row, so we pull it off the group level here.
  for (const [categoryIndex, category] of (json.Services ?? []).entries()) {
    const parentServiceTitle =
      (category.ServiceCategoryTitle || category.ParentServiceTitle || category.ServiceTitle || '').trim() || null
    const parentCategoryId = category.ServiceCategoryID != null ? String(category.ServiceCategoryID) : null
    if (parentCategoryId && parentServiceTitle) {
      categories.push({
        categoryId: parentCategoryId,
        title: parentServiceTitle,
        displayOrder: categoryIndex + 1,
        serviceCount: (category.ServiceList ?? []).filter(service =>
          service.IsActive !== false && service.IsSoftDeleted !== true
        ).length,
      })
    }
    for (const s of category.ServiceList ?? []) {
      if (s.ServiceID == null) continue
      const idKey = String(s.ServiceID)
      if (seenServiceIds.has(idKey)) continue
      seenServiceIds.add(idKey)

      // HEAD-check the rewritten URL before adding it to the maps. Vagaro
      // sometimes returns Photo refs whose file has been deleted — without
      // this gate we'd write the dead URL every sync and the website would
      // render a broken-image badge.
      const raw = originalServicePhotoUrl(s.ServicePhotoURL)
      const full = await probeVagaroPhotoUrl(raw)
      const titleKey = serviceTitleKey(s.ServiceTitle)
      if (full) {
        if (titleKey && !photosByTitle.has(titleKey)) photosByTitle.set(titleKey, full)
        if (!photosByServiceId.has(idKey)) photosByServiceId.set(idKey, full)
      }

      records.push({
        serviceId: idKey,
        parentServiceId: s.ParentServiceID != null ? String(s.ParentServiceID) : null,
        serviceTitle: s.ServiceTitle ?? '',
        parentServiceTitle,
        parentCategoryId,
        photoUrl: full,
        isActive: s.IsActive !== false,
        isSoftDeleted: s.IsSoftDeleted === true,
        raw: s,
      })
    }
  }

  return { categories, records, photosByTitle, photosByServiceId }
}

/**
 * Build title→photo-URL and serviceId→photo-URL maps from Vagaro's public
 * booking-page composite. ServiceID is the stable identifier — title can drift
 * across renames. Returns empty maps on failure; callers should treat that as
 * "leave existing photo URLs alone" rather than clobbering with nulls.
 *
 * Kept as a thin wrapper for callers that only need the photo maps.
 */
export async function fetchPublicServicePhotos(numericBusinessId: string): Promise<PublicServicePhotos> {
  const { photosByTitle, photosByServiceId } = await fetchPublicServices(numericBusinessId)
  return { byTitle: photosByTitle, byServiceId: photosByServiceId }
}

/**
 * Full payload: every service in the composite plus the photo lookups built
 * from the same traversal. This is the source of truth for the service list
 * because the authenticated v2 /api/v2/services endpoint caps responses at
 * 10 rows regardless of page-size params, so most of the studio's 95 services
 * never get touched by a v2-only sync.
 */
export async function fetchPublicServicesFull(numericBusinessId: string): Promise<PublicServicesPayload> {
  return fetchPublicServices(numericBusinessId)
}

/**
 * Per-stylist composite call. Same endpoint as the unfiltered fetch, but with
 * ServiceProviderId set so Vagaro returns ONLY that stylist's services. This
 * is the source of truth for the team-member→service mapping we use to drive
 * the per-stylist tag chips on the team section: it returns data for ALL
 * services every sync (vs. the authenticated v2 endpoint which caps at 10
 * services per response and so missed performer info for 80+ services).
 *
 * One call per active Vagaro stylist per sync (~17 calls total).
 *
 * Returns a slimmer record than the full composite: we only need IDs + the
 * category title for the read path. No photo probing — photos are owned by
 * the unfiltered composite.
 */
export interface PerStylistServiceRecord {
  serviceId: string                 // stringified ServiceID
  serviceTitle: string
  vagaroCategoryTitle: string | null  // ServiceCategoryTitle from the per-stylist composite group
  vagaroCategoryId: string | null
}

export async function fetchPublicServicesForProvider(
  numericBusinessId: string,
  serviceProviderId: number | string
): Promise<PerStylistServiceRecord[]> {
  const res = await fetch(
    'https://www.vagaro.com/us02/websiteapi/homepage/getshopdetailcompositeservice',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=UTF-8',
        accept: 'application/json, text/javascript, */*; q=0.01',
        'x-requested-with': 'XMLHttpRequest',
        grouptoken: 'US02',
        brandedapp: 'false',
        referer: `https://www.vagaro.com/`,
      },
      body: JSON.stringify({
        ...COMPOSITE_BODY,
        businessID: numericBusinessId,
        ServiceProviderId: String(serviceProviderId),
      }),
    }
  )
  if (!res.ok) {
    throw new Error(
      `Vagaro per-stylist composite ${res.status} for provider ${serviceProviderId}: ${await res.text()}`
    )
  }

  const json = (await res.json()) as {
    Services?: Array<{
      ServiceCategoryTitle?: string
      ServiceCategoryID?: number
      ServiceList?: Array<{ ServiceID?: number; ServiceTitle?: string }>
    }>
  }

  const out: PerStylistServiceRecord[] = []
  const seen = new Set<string>()
  for (const category of json.Services ?? []) {
    const catTitle = (category.ServiceCategoryTitle || '').trim() || null
    const catId = category.ServiceCategoryID != null ? String(category.ServiceCategoryID) : null
    for (const s of category.ServiceList ?? []) {
      if (s.ServiceID == null) continue
      const key = String(s.ServiceID)
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        serviceId: key,
        serviceTitle: (s.ServiceTitle ?? '').trim(),
        vagaroCategoryTitle: catTitle,
        vagaroCategoryId: catId,
      })
    }
  }
  return out
}
