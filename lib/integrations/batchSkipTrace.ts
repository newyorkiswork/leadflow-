// LeadFlow AI - BatchSkipTrace Integration (2025)
// Advanced skip tracing for real estate lead generation

import axios, { AxiosInstance } from 'axios'

export interface BatchSkipTraceConfig {
  apiKey: string
  baseUrl: string
  timeout: number
  retries: number
}

export interface SkipTraceRequest {
  firstName?: string
  lastName?: string
  fullName?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  phone?: string
  email?: string
  age?: number
  relatives?: string[]
  previousAddresses?: string[]
}

export interface SkipTraceResult {
  id: string
  status: 'found' | 'partial' | 'not_found' | 'processing'
  confidence: number
  person: {
    firstName: string
    lastName: string
    fullName: string
    age: number
    dateOfBirth: string
    ssn?: string
    aliases: string[]
  }
  contact: {
    phones: Array<{
      number: string
      type: 'mobile' | 'landline' | 'voip'
      carrier: string
      isValid: boolean
      isActive: boolean
      confidence: number
    }>
    emails: Array<{
      address: string
      type: 'personal' | 'business'
      isValid: boolean
      confidence: number
    }>
    socialMedia: Array<{
      platform: string
      username: string
      url: string
      confidence: number
    }>
  }
  addresses: Array<{
    street: string
    city: string
    state: string
    zipCode: string
    type: 'current' | 'previous' | 'mailing'
    dateRange: {
      from: string
      to: string
    }
    confidence: number
  }>
  relatives: Array<{
    name: string
    relationship: string
    age: number
    phones: string[]
    addresses: string[]
  }>
  associates: Array<{
    name: string
    relationship: string
    phones: string[]
    addresses: string[]
  }>
  employment: Array<{
    company: string
    position: string
    industry: string
    dateRange: {
      from: string
      to: string
    }
    address: string
    phone: string
  }>
  financial: {
    estimatedIncome: number
    creditScore: number
    bankruptcies: Array<{
      date: string
      type: string
      amount: number
    }>
    liens: Array<{
      date: string
      type: string
      amount: number
      creditor: string
    }>
    judgments: Array<{
      date: string
      amount: number
      creditor: string
    }>
  }
  criminal: Array<{
    date: string
    type: string
    description: string
    jurisdiction: string
  }>
  properties: Array<{
    address: string
    type: 'owned' | 'rented' | 'previous'
    value: number
    equity: number
    mortgageAmount: number
    dateAcquired: string
  }>
  metadata: {
    searchDate: string
    dataSource: string[]
    processingTime: number
    cost: number
  }
}

export interface BatchSkipTraceJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalRecords: number
  processedRecords: number
  successfulTraces: number
  partialTraces: number
  failedTraces: number
  estimatedCost: number
  actualCost: number
  createdAt: string
  completedAt?: string
  results: SkipTraceResult[]
}

export class BatchSkipTraceAPI {
  private client: AxiosInstance
  private config: BatchSkipTraceConfig

  constructor(config: BatchSkipTraceConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'LeadFlow-AI/1.0'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`BatchSkipTrace API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 60
          console.warn(`BatchSkipTrace rate limit hit, retrying after ${retryAfter}s`)
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          return this.client.request(error.config)
        }
        return Promise.reject(error)
      }
    )
  }

  // Single skip trace
  async skipTrace(request: SkipTraceRequest): Promise<SkipTraceResult> {
    try {
      const response = await this.client.post('/skip-trace/single', request)
      return this.transformSkipTraceResult(response.data)
    } catch (error) {
      console.error('Skip trace failed:', error)
      throw new Error('Failed to perform skip trace')
    }
  }

  // Batch skip trace
  async batchSkipTrace(requests: SkipTraceRequest[]): Promise<BatchSkipTraceJob> {
    try {
      const response = await this.client.post('/skip-trace/batch', {
        records: requests,
        options: {
          includeRelatives: true,
          includeAssociates: true,
          includeEmployment: true,
          includeFinancial: true,
          includeCriminal: false, // Optional for privacy
          includeProperties: true
        }
      })

      return this.transformBatchJob(response.data)
    } catch (error) {
      console.error('Batch skip trace failed:', error)
      throw new Error('Failed to start batch skip trace')
    }
  }

  // Get batch job status
  async getBatchJobStatus(jobId: string): Promise<BatchSkipTraceJob> {
    try {
      const response = await this.client.get(`/skip-trace/batch/${jobId}`)
      return this.transformBatchJob(response.data)
    } catch (error) {
      console.error('Failed to get batch job status:', error)
      throw new Error('Failed to get batch job status')
    }
  }

  // Get batch job results
  async getBatchJobResults(jobId: string): Promise<SkipTraceResult[]> {
    try {
      const response = await this.client.get(`/skip-trace/batch/${jobId}/results`)
      return response.data.results.map(this.transformSkipTraceResult)
    } catch (error) {
      console.error('Failed to get batch job results:', error)
      throw new Error('Failed to get batch job results')
    }
  }

  // Phone validation
  async validatePhone(phoneNumber: string): Promise<{
    isValid: boolean
    isActive: boolean
    type: 'mobile' | 'landline' | 'voip'
    carrier: string
    location: {
      city: string
      state: string
    }
  }> {
    try {
      const response = await this.client.post('/validate/phone', {
        phoneNumber: phoneNumber.replace(/\D/g, '') // Remove non-digits
      })

      return response.data
    } catch (error) {
      console.error('Phone validation failed:', error)
      throw new Error('Failed to validate phone number')
    }
  }

  // Email validation
  async validateEmail(emailAddress: string): Promise<{
    isValid: boolean
    isDeliverable: boolean
    isDisposable: boolean
    domain: string
    provider: string
    riskScore: number
  }> {
    try {
      const response = await this.client.post('/validate/email', {
        emailAddress
      })

      return response.data
    } catch (error) {
      console.error('Email validation failed:', error)
      throw new Error('Failed to validate email address')
    }
  }

  // Reverse phone lookup
  async reversePhoneLookup(phoneNumber: string): Promise<SkipTraceResult | null> {
    try {
      const response = await this.client.post('/lookup/phone', {
        phoneNumber: phoneNumber.replace(/\D/g, '')
      })

      return response.data ? this.transformSkipTraceResult(response.data) : null
    } catch (error) {
      console.error('Reverse phone lookup failed:', error)
      return null
    }
  }

  // Reverse email lookup
  async reverseEmailLookup(emailAddress: string): Promise<SkipTraceResult | null> {
    try {
      const response = await this.client.post('/lookup/email', {
        emailAddress
      })

      return response.data ? this.transformSkipTraceResult(response.data) : null
    } catch (error) {
      console.error('Reverse email lookup failed:', error)
      return null
    }
  }

  // Property owner lookup
  async propertyOwnerLookup(address: string, city: string, state: string): Promise<SkipTraceResult[]> {
    try {
      const response = await this.client.post('/lookup/property-owner', {
        address,
        city,
        state
      })

      return response.data.owners.map(this.transformSkipTraceResult)
    } catch (error) {
      console.error('Property owner lookup failed:', error)
      throw new Error('Failed to lookup property owner')
    }
  }

  // Get account balance and usage
  async getAccountInfo(): Promise<{
    balance: number
    creditsRemaining: number
    monthlyUsage: number
    monthlyLimit: number
    costPerTrace: number
  }> {
    try {
      const response = await this.client.get('/account/info')
      return response.data
    } catch (error) {
      console.error('Failed to get account info:', error)
      throw new Error('Failed to get account information')
    }
  }

  // Transform skip trace result to our format
  private transformSkipTraceResult(data: any): SkipTraceResult {
    return {
      id: data.id || '',
      status: data.status || 'not_found',
      confidence: data.confidence || 0,
      person: {
        firstName: data.person?.firstName || '',
        lastName: data.person?.lastName || '',
        fullName: data.person?.fullName || '',
        age: data.person?.age || 0,
        dateOfBirth: data.person?.dateOfBirth || '',
        ssn: data.person?.ssn,
        aliases: data.person?.aliases || []
      },
      contact: {
        phones: (data.contact?.phones || []).map((phone: any) => ({
          number: phone.number || '',
          type: phone.type || 'unknown',
          carrier: phone.carrier || '',
          isValid: phone.isValid || false,
          isActive: phone.isActive || false,
          confidence: phone.confidence || 0
        })),
        emails: (data.contact?.emails || []).map((email: any) => ({
          address: email.address || '',
          type: email.type || 'personal',
          isValid: email.isValid || false,
          confidence: email.confidence || 0
        })),
        socialMedia: data.contact?.socialMedia || []
      },
      addresses: data.addresses || [],
      relatives: data.relatives || [],
      associates: data.associates || [],
      employment: data.employment || [],
      financial: data.financial || {
        estimatedIncome: 0,
        creditScore: 0,
        bankruptcies: [],
        liens: [],
        judgments: []
      },
      criminal: data.criminal || [],
      properties: data.properties || [],
      metadata: {
        searchDate: data.metadata?.searchDate || new Date().toISOString(),
        dataSource: data.metadata?.dataSource || [],
        processingTime: data.metadata?.processingTime || 0,
        cost: data.metadata?.cost || 0
      }
    }
  }

  // Transform batch job data
  private transformBatchJob(data: any): BatchSkipTraceJob {
    return {
      id: data.id || '',
      status: data.status || 'pending',
      totalRecords: data.totalRecords || 0,
      processedRecords: data.processedRecords || 0,
      successfulTraces: data.successfulTraces || 0,
      partialTraces: data.partialTraces || 0,
      failedTraces: data.failedTraces || 0,
      estimatedCost: data.estimatedCost || 0,
      actualCost: data.actualCost || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      completedAt: data.completedAt,
      results: (data.results || []).map(this.transformSkipTraceResult)
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health')
      return true
    } catch (error) {
      console.error('BatchSkipTrace health check failed:', error)
      return false
    }
  }
}

export { BatchSkipTraceAPI }
