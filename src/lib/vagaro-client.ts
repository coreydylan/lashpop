/**
 * Vagaro API Client
 *
 * Handles authentication and API requests to the Vagaro platform.
 * Implements token caching and automatic refresh.
 */

interface VagaroAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface VagaroService {
  service_id: string
  name: string
  category: string
  description: string
  duration_minutes: number
  price: number
  currency: string
  price_range?: {
    min: number
    max: number
  }
  locations: string[]
  employees: string[]
  image_url?: string
  requires_consultation: boolean
  deposit_required: boolean
  deposit_amount?: number
  booking_buffer_minutes: number
  cancellation_policy?: string
  prerequisites?: string[]
  add_ons?: Array<{
    name: string
    duration_minutes: number
    price: number
  }>
  status: 'active' | 'inactive' | 'seasonal'
  created_at: string
}

interface VagaroEmployee {
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  locations: string[]
  services: string[]
  status: 'active' | 'inactive'
}

interface VagaroLocation {
  location_id: string
  name: string
  address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  phone: string
  email?: string
  timezone: string
  status: 'active' | 'inactive'
}

export class VagaroClient {
  private baseURL: string
  private region: string
  private clientId: string
  private clientSecret: string
  private businessId: string
  private accessToken: string | null = null
  private tokenExpiry: number | null = null

  constructor() {
    this.baseURL = process.env.VAGARO_API_BASE_URL || 'https://api.vagaro.com'
    this.region = process.env.VAGARO_REGION || 'us02'
    this.clientId = process.env.VAGARO_CLIENT_ID || ''
    this.clientSecret = process.env.VAGARO_CLIENT_SECRET || ''
    this.businessId = process.env.VAGARO_BUSINESS_ID || ''

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Vagaro API credentials not configured')
    }
    if (!this.businessId) {
      throw new Error('Vagaro businessId not configured')
    }
  }

  /**
   * Authenticate with Vagaro API and obtain access token
   */
  private async authenticate(): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/${this.region}/api/v2/merchants/generate-access-token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.clientId,
          clientSecretKey: this.clientSecret,
          scope: 'read access',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Authentication failed (${response.status}): ${errorText}`)
      }

      const result = await response.json()

      // Vagaro returns status 200 for success, responseCode 1000
      if (result.status !== 200 || result.responseCode !== 1000 || !result.data?.access_token) {
        throw new Error(`Authentication failed: ${result.message || 'Unknown error'}`)
      }

      const token: string = result.data.access_token

      this.accessToken = token
      // Set expiry 1 minute before actual expiry to be safe
      this.tokenExpiry = Date.now() + (result.data.expires_in * 1000) - 60000

      console.log('✓ Vagaro authentication successful')
      return token
    } catch (error) {
      console.error('✗ Vagaro authentication failed:', error)
      throw error
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    // Otherwise authenticate to get new token
    return await this.authenticate()
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data: unknown = null
  ): Promise<T> {
    const token = await this.getAccessToken()

    const config: RequestInit = {
      method,
      headers: {
        'accessToken': token,  // Vagaro uses accessToken header, not Authorization Bearer
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(`${this.baseURL}/${this.region}${endpoint}`, config)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error [${endpoint}] (${response.status}): ${errorText}`)
      }

      const result = await response.json()

      // Check Vagaro response format
      if (result.status && result.status !== 200) {
        throw new Error(`API Error [${endpoint}]: ${result.message || 'Unknown error'}`)
      }

      return result
    } catch (error) {
      console.error(`Vagaro API request failed [${endpoint}]:`, error)
      throw error
    }
  }

  /**
   * Make API request with retry logic for server errors
   */
  private async requestWithRetry<T>(
    method: string,
    endpoint: string,
    data: unknown = null,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(method, endpoint, data)
      } catch (error) {
        lastError = error as Error

        // Check if it's a client error (4xx) - don't retry these
        if (error instanceof Error && error.message.includes('40')) {
          throw error
        }

        // Retry server errors (5xx) and network errors
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          console.log(`Retry attempt ${attempt} after ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  /**
   * Retrieve all services or filter by criteria
   */
  async getServices(filters?: {
    categoryId?: string
    status?: 'active' | 'inactive'
  }): Promise<VagaroService[]> {
    const response = await this.requestWithRetry<any>(
      'POST',
      '/api/v2/services',
      {
        businessId: this.businessId,
        ...filters
      }
    )

    // API returns { services: [...] } not { data: [...] }
    return response.services || response.data || []
  }

  /**
   * Retrieve employee information
   */
  async getEmployee(employeeId: string): Promise<VagaroEmployee> {
    const response = await this.requestWithRetry<{
      status: number
      responseCode: number
      message: string
      data: VagaroEmployee
    }>(
      'POST',
      '/api/v2/employees',
      {
        businessId: this.businessId,
        employeeId
      }
    )
    return response.data
  }

  /**
   * Retrieve all employees
   */
  async getEmployees(filters?: {
    status?: 'active' | 'inactive'
  }): Promise<VagaroEmployee[]> {
    const response = await this.requestWithRetry<any>(
      'POST',
      '/api/v2/employees',
      {
        businessId: this.businessId,
        ...filters
      }
    )
    // API might return { employees: [...] } or { data: [...] }
    return response.employees || response.serviceProviders || response.data || []
  }

  /**
   * Retrieve business information
   */
  async getBusinessInfo(): Promise<{
    businessId: string
    businessName: string
    address?: string
    city?: string
    state?: string
    zip?: string
    phone?: string
  }> {
    const response = await this.requestWithRetry<{
      status: number
      responseCode: number
      message: string
      data: any
    }>(
      'GET',
      '/api/v2/merchants/business'
    )
    return response.data
  }

  /**
   * Search appointment availability
   */
  async searchAvailability(params: {
    location_id: string
    service_id: string
    employee_id?: string
    date: string
    duration_minutes?: number
  }): Promise<{
    available_slots: Array<{
      start_time: string
      end_time: string
      employee_id: string
    }>
  }> {
    return await this.requestWithRetry(
      'POST',
      '/api/appointments/availability',
      params
    )
  }
}

// Export singleton instance
let vagaroClient: VagaroClient | null = null

export function getVagaroClient(): VagaroClient {
  if (!vagaroClient) {
    vagaroClient = new VagaroClient()
  }
  return vagaroClient
}
