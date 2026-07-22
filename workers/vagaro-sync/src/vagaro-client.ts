// Workers-compatible Vagaro API client (no process.env, no node fs).
// Mirrors src/lib/vagaro-client.ts in the main app but takes env via constructor.

export interface VagaroEnv {
  VAGARO_REGION: string
  VAGARO_CLIENT_ID: string
  VAGARO_CLIENT_SECRET: string
  VAGARO_API_BASE_URL: string
  VAGARO_BUSINESS_ID: string
  /** Hard safety ceiling for attempted metered calls in one Worker run. */
  VAGARO_MAX_METERED_CALLS_PER_RUN?: string
}

export interface VagaroMeteredUsage {
  authCalls: number
  apiCalls: number
  totalCalls: number
  maxCallsPerRun: number
  byEndpoint: Record<string, number>
}

export class VagaroClient {
  private accessToken: string | null = null
  private tokenExpiry: number | null = null
  private readonly maxMeteredCallsPerRun: number
  private readonly callsByEndpoint = new Map<string, number>()
  private authCalls = 0
  private apiCalls = 0

  constructor(private env: VagaroEnv) {
    const configured = Number.parseInt(env.VAGARO_MAX_METERED_CALLS_PER_RUN ?? '', 10)
    this.maxMeteredCallsPerRun = Number.isFinite(configured) && configured > 0
      ? Math.min(configured, 50)
      : 5
  }

  private recordMeteredCall(endpoint: string, kind: 'auth' | 'api'): void {
    const attempted = this.authCalls + this.apiCalls
    if (attempted >= this.maxMeteredCallsPerRun) {
      throw new Error(
        `Vagaro metered-call budget exhausted before ${endpoint} ` +
        `(${attempted}/${this.maxMeteredCallsPerRun} attempted this run)`,
      )
    }

    if (kind === 'auth') this.authCalls++
    else this.apiCalls++
    this.callsByEndpoint.set(endpoint, (this.callsByEndpoint.get(endpoint) ?? 0) + 1)
  }

  getMeteredUsage(): VagaroMeteredUsage {
    return {
      authCalls: this.authCalls,
      apiCalls: this.apiCalls,
      totalCalls: this.authCalls + this.apiCalls,
      maxCallsPerRun: this.maxMeteredCallsPerRun,
      byEndpoint: Object.fromEntries(this.callsByEndpoint),
    }
  }

  private async authenticate(): Promise<string> {
    const endpoint = '/api/v2/merchants/generate-access-token'
    this.recordMeteredCall(endpoint, 'auth')
    const res = await fetch(
      `${this.env.VAGARO_API_BASE_URL}/${this.env.VAGARO_REGION}${endpoint}`,
      {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.env.VAGARO_CLIENT_ID,
          clientSecretKey: this.env.VAGARO_CLIENT_SECRET,
          scope: 'read access',
        }),
      }
    )
    if (!res.ok) throw new Error(`Vagaro auth ${res.status}: ${await res.text()}`)
    const json = (await res.json()) as { status: number; responseCode: number; data: { access_token: string; expires_in: number }; message?: string }
    if (json.status !== 200 || json.responseCode !== 1000 || !json.data?.access_token) {
      throw new Error(`Vagaro auth failed: ${json.message ?? 'unknown'}`)
    }
    this.accessToken = json.data.access_token
    this.tokenExpiry = Date.now() + json.data.expires_in * 1000 - 60_000
    return this.accessToken
  }

  private async token(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) return this.accessToken
    return this.authenticate()
  }

  private async request<T>(method: 'GET' | 'POST', endpoint: string, body?: unknown): Promise<T> {
    const token = await this.token()
    this.recordMeteredCall(endpoint, 'api')
    const res = await fetch(`${this.env.VAGARO_API_BASE_URL}/${this.env.VAGARO_REGION}${endpoint}`, {
      method,
      headers: {
        accessToken: token,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`Vagaro ${endpoint} ${res.status}: ${await res.text()}`)
    const json = (await res.json()) as any
    if (json.status && json.status !== 200) throw new Error(`Vagaro ${endpoint}: ${json.message ?? 'unknown'}`)
    return json as T
  }

  async getServices(): Promise<any[]> {
    // Vagaro's /api/v2/services defaults to a page size of 10 with no
    // nextPage token, so the pagination loop bailed after the first batch
    // and only ever synced ~10 of the studio's 95 services. That's why
    // brow / nanobrow / microblading rows stayed at last_synced_at = Nov
    // 2025 with empty vagaro_image_url — they never got revisited.
    // Bump pageSize so the request returns everything in one shot. Keep
    // the pagination loop in place as belt-and-suspenders if Vagaro ever
    // starts returning nextPage tokens.
    const PAGE_SIZE = 500
    const all: any[] = []
    const seen = new Set<string>()
    let nextPage: string | null = null
    let pages = 0
    do {
      pages++
      const body: any = {
        businessId: this.env.VAGARO_BUSINESS_ID,
        pageSize: PAGE_SIZE,
        pageNumber: pages,
      }
      if (nextPage) body.nextPage = nextPage
      const res = await this.request<any>('POST', '/api/v2/services', body)
      const list: any[] = res.data?.services ?? res.services ?? res.data ?? []
      let added = 0
      for (const s of list) {
        const id = s.serviceId || s.id
        if (id && !seen.has(id)) {
          seen.add(id)
          all.push(s)
          added++
        }
      }
      if (added === 0) break
      nextPage = res.data?.nextPage ?? res.nextPage ?? null
      if (!nextPage && list.length < PAGE_SIZE) break
      if (pages >= 100) break
    } while (nextPage || pages < 5)
    return all
  }

}
