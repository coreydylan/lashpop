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
  Services?: Array<{ ServiceList?: VagaroPublicService[] }>
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

export function serviceTitleKey(title: string | undefined | null): string {
  return (title ?? '').trim().toLowerCase()
}

/**
 * Build a title→photo-URL map from Vagaro's public booking-page composite.
 * Returns an empty map on failure; callers should treat that as "leave existing
 * photo URLs alone" rather than clobbering with nulls.
 */
export async function fetchPublicServicePhotos(numericBusinessId: string): Promise<Map<string, string>> {
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
  const byTitle = new Map<string, string>()

  // Services[].ServiceList[] carries ServicePhotoURL pre-built;
  // ServicesData[] is a flatter list but has the Photo filename without the CDN host.
  // Walk the structured tree first because it gives us the full URL.
  for (const category of json.Services ?? []) {
    for (const s of category.ServiceList ?? []) {
      const key = serviceTitleKey(s.ServiceTitle)
      const full = originalServicePhotoUrl(s.ServicePhotoURL)
      if (key && full && !byTitle.has(key)) byTitle.set(key, full)
    }
  }

  return byTitle
}
