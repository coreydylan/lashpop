// Vagaro public booking-page composite endpoint — the only source for
// per-service photos. The authenticated /api/v2/services endpoint omits
// image fields entirely, so we fetch this and match back to v2 services by
// title. Kept in sync with workers/vagaro-sync/src/public-services.ts.

interface VagaroPublicService {
  ServiceID: number
  ServiceTitle: string
  Photo: string
  ServicePhotoURL?: string
}

interface CompositeResponse {
  Services?: Array<{ ServiceList?: VagaroPublicService[] }>
}

export function originalServicePhotoUrl(url: string | undefined | null): string | null {
  if (!url) return null
  return url.replace(/\/Service\/(155x155|340x340|400x400)\//, '/Service/Original/')
}

export function serviceTitleKey(title: string | undefined | null): string {
  return (title ?? '').trim().toLowerCase()
}

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
        referer: 'https://www.vagaro.com/',
      },
      body: JSON.stringify({
        businessID: numericBusinessId,
        loginUserID: '0',
        pageIndex: 1,
        pageSize: null,
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
        ServiceProviderId: null,
        Referral: 0,
      }),
    }
  )
  if (!res.ok) {
    throw new Error(`Vagaro public services endpoint ${res.status}: ${await res.text()}`)
  }

  const json = (await res.json()) as CompositeResponse
  const byTitle = new Map<string, string>()
  for (const category of json.Services ?? []) {
    for (const s of category.ServiceList ?? []) {
      const key = serviceTitleKey(s.ServiceTitle)
      const full = originalServicePhotoUrl(s.ServicePhotoURL)
      if (key && full && !byTitle.has(key)) byTitle.set(key, full)
    }
  }
  return byTitle
}
