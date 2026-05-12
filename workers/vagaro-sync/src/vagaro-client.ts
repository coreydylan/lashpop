// Workers-compatible Vagaro API client (no process.env, no node fs).
// Mirrors src/lib/vagaro-client.ts in the main app but takes env via constructor.

export interface VagaroEnv {
  VAGARO_REGION: string
  VAGARO_CLIENT_ID: string
  VAGARO_CLIENT_SECRET: string
  VAGARO_API_BASE_URL: string
  VAGARO_BUSINESS_ID: string
}

export class VagaroClient {
  private accessToken: string | null = null
  private tokenExpiry: number | null = null

  constructor(private env: VagaroEnv) {}

  private async authenticate(): Promise<string> {
    const res = await fetch(
      `${this.env.VAGARO_API_BASE_URL}/${this.env.VAGARO_REGION}/api/v2/merchants/generate-access-token`,
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
    const all: any[] = []
    const seen = new Set<string>()
    let nextPage: string | null = null
    let pages = 0
    do {
      pages++
      const body: any = { businessId: this.env.VAGARO_BUSINESS_ID }
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
      if (added === 0 && list.length > 0) break
      nextPage = res.data?.nextPage ?? res.nextPage ?? null
      if (pages >= 100) break
    } while (nextPage)
    return all
  }

  async getEmployee(employeeId: string): Promise<any> {
    const res = await this.request<{ data: any }>('POST', '/api/v2/employees', {
      businessId: this.env.VAGARO_BUSINESS_ID,
      serviceProviderId: employeeId,
    })
    return res.data
  }
}
