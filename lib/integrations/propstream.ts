// LeadFlow AI - PropStream Integration (2025)
// Advanced property data integration for real estate investors

import axios, { AxiosInstance } from 'axios'

export interface PropStreamConfig {
  apiKey: string
  baseUrl: string
  timeout: number
  retries: number
}

export interface PropertySearchCriteria {
  address?: string
  city?: string
  state?: string
  zipCode?: string
  county?: string
  apn?: string
  radius?: number
  propertyType?: string[]
  priceRange?: {
    min?: number
    max?: number
  }
  squareFootageRange?: {
    min?: number
    max?: number
  }
  yearBuiltRange?: {
    min?: number
    max?: number
  }
  equity?: {
    min?: number
    max?: number
  }
  ownerOccupied?: boolean
  absenteeOwner?: boolean
  highEquity?: boolean
  distressed?: boolean
  preForeclosure?: boolean
  foreclosure?: boolean
  limit?: number
  offset?: number
}

export interface PropStreamProperty {
  id: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    county: string
    apn: string
  }
  propertyDetails: {
    propertyType: string
    bedrooms: number
    bathrooms: number
    squareFootage: number
    lotSize: number
    yearBuilt: number
    stories: number
    garage: boolean
    pool: boolean
    fireplace: boolean
  }
  valuation: {
    estimatedValue: number
    lastSalePrice: number
    lastSaleDate: string
    taxAssessedValue: number
    annualTaxes: number
    pricePerSquareFoot: number
    equity: number
    equityPercent: number
  }
  ownership: {
    ownerName: string
    ownerType: string
    ownerOccupied: boolean
    absenteeOwner: boolean
    acquisitionDate: string
    deedType: string
    legalDescription: string
  }
  mortgage: {
    hasLoan: boolean
    loanAmount: number
    loanDate: string
    lender: string
    loanType: string
    interestRate: number
  }
  distress: {
    isDistressed: boolean
    preForeclosure: boolean
    foreclosure: boolean
    bankruptcy: boolean
    taxLien: boolean
    codeViolation: boolean
  }
  marketData: {
    daysOnMarket: number
    listPrice: number
    listDate: string
    mlsNumber: string
    listingAgent: string
    status: string
  }
  comparables: Array<{
    address: string
    salePrice: number
    saleDate: string
    squareFootage: number
    distance: number
  }>
}

export interface PropStreamOwner {
  name: string
  type: 'individual' | 'corporation' | 'trust' | 'llc'
  mailingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  phone: string[]
  email: string[]
  properties: string[]
  totalEquity: number
  portfolioValue: number
}

export class PropStreamAPI {
  private client: AxiosInstance
  private config: PropStreamConfig

  constructor(config: PropStreamConfig) {
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
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`PropStream API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Rate limit handling
          const retryAfter = error.response.headers['retry-after'] || 60
          console.warn(`PropStream rate limit hit, retrying after ${retryAfter}s`)
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          return this.client.request(error.config)
        }
        return Promise.reject(error)
      }
    )
  }

  // Search properties by criteria
  async searchProperties(criteria: PropertySearchCriteria): Promise<{
    properties: PropStreamProperty[]
    totalCount: number
    hasMore: boolean
  }> {
    try {
      const response = await this.client.post('/properties/search', {
        ...criteria,
        limit: criteria.limit || 50,
        offset: criteria.offset || 0
      })

      return {
        properties: response.data.properties.map(this.transformProperty),
        totalCount: response.data.totalCount,
        hasMore: response.data.hasMore
      }
    } catch (error) {
      console.error('PropStream property search failed:', error)
      throw new Error('Failed to search properties in PropStream')
    }
  }

  // Get detailed property information
  async getProperty(propertyId: string): Promise<PropStreamProperty> {
    try {
      const response = await this.client.get(`/properties/${propertyId}`)
      return this.transformProperty(response.data)
    } catch (error) {
      console.error('PropStream property fetch failed:', error)
      throw new Error('Failed to fetch property from PropStream')
    }
  }

  // Get property by address
  async getPropertyByAddress(address: string, city: string, state: string): Promise<PropStreamProperty | null> {
    try {
      const searchResults = await this.searchProperties({
        address,
        city,
        state,
        limit: 1
      })

      return searchResults.properties.length > 0 ? searchResults.properties[0] : null
    } catch (error) {
      console.error('PropStream address lookup failed:', error)
      return null
    }
  }

  // Get owner information
  async getOwnerInfo(ownerName: string): Promise<PropStreamOwner[]> {
    try {
      const response = await this.client.get('/owners/search', {
        params: { name: ownerName }
      })

      return response.data.owners.map(this.transformOwner)
    } catch (error) {
      console.error('PropStream owner search failed:', error)
      throw new Error('Failed to search owners in PropStream')
    }
  }

  // Get comparable properties
  async getComparables(propertyId: string, radius: number = 0.5): Promise<PropStreamProperty[]> {
    try {
      const response = await this.client.get(`/properties/${propertyId}/comparables`, {
        params: { radius }
      })

      return response.data.comparables.map(this.transformProperty)
    } catch (error) {
      console.error('PropStream comparables fetch failed:', error)
      throw new Error('Failed to fetch comparables from PropStream')
    }
  }

  // Get market trends for area
  async getMarketTrends(city: string, state: string, timeframe: string = '12m'): Promise<{
    averagePrice: number
    medianPrice: number
    priceChange: number
    salesVolume: number
    daysOnMarket: number
    trends: Array<{
      month: string
      averagePrice: number
      salesCount: number
    }>
  }> {
    try {
      const response = await this.client.get('/market/trends', {
        params: { city, state, timeframe }
      })

      return response.data
    } catch (error) {
      console.error('PropStream market trends fetch failed:', error)
      throw new Error('Failed to fetch market trends from PropStream')
    }
  }

  // Search distressed properties
  async getDistressedProperties(criteria: PropertySearchCriteria): Promise<PropStreamProperty[]> {
    try {
      const distressedCriteria = {
        ...criteria,
        distressed: true,
        preForeclosure: true,
        foreclosure: true
      }

      const results = await this.searchProperties(distressedCriteria)
      return results.properties
    } catch (error) {
      console.error('PropStream distressed properties search failed:', error)
      throw new Error('Failed to search distressed properties')
    }
  }

  // Get high equity properties
  async getHighEquityProperties(criteria: PropertySearchCriteria, minEquity: number = 100000): Promise<PropStreamProperty[]> {
    try {
      const equityCriteria = {
        ...criteria,
        equity: { min: minEquity },
        highEquity: true
      }

      const results = await this.searchProperties(equityCriteria)
      return results.properties
    } catch (error) {
      console.error('PropStream high equity search failed:', error)
      throw new Error('Failed to search high equity properties')
    }
  }

  // Transform PropStream property data to our format
  private transformProperty(propStreamData: any): PropStreamProperty {
    return {
      id: propStreamData.id,
      address: {
        street: propStreamData.address?.street || '',
        city: propStreamData.address?.city || '',
        state: propStreamData.address?.state || '',
        zipCode: propStreamData.address?.zipCode || '',
        county: propStreamData.address?.county || '',
        apn: propStreamData.address?.apn || ''
      },
      propertyDetails: {
        propertyType: propStreamData.propertyType || 'Unknown',
        bedrooms: propStreamData.bedrooms || 0,
        bathrooms: propStreamData.bathrooms || 0,
        squareFootage: propStreamData.squareFootage || 0,
        lotSize: propStreamData.lotSize || 0,
        yearBuilt: propStreamData.yearBuilt || 0,
        stories: propStreamData.stories || 1,
        garage: propStreamData.garage || false,
        pool: propStreamData.pool || false,
        fireplace: propStreamData.fireplace || false
      },
      valuation: {
        estimatedValue: propStreamData.estimatedValue || 0,
        lastSalePrice: propStreamData.lastSalePrice || 0,
        lastSaleDate: propStreamData.lastSaleDate || '',
        taxAssessedValue: propStreamData.taxAssessedValue || 0,
        annualTaxes: propStreamData.annualTaxes || 0,
        pricePerSquareFoot: propStreamData.pricePerSquareFoot || 0,
        equity: propStreamData.equity || 0,
        equityPercent: propStreamData.equityPercent || 0
      },
      ownership: {
        ownerName: propStreamData.ownerName || '',
        ownerType: propStreamData.ownerType || 'individual',
        ownerOccupied: propStreamData.ownerOccupied || false,
        absenteeOwner: propStreamData.absenteeOwner || false,
        acquisitionDate: propStreamData.acquisitionDate || '',
        deedType: propStreamData.deedType || '',
        legalDescription: propStreamData.legalDescription || ''
      },
      mortgage: {
        hasLoan: propStreamData.hasLoan || false,
        loanAmount: propStreamData.loanAmount || 0,
        loanDate: propStreamData.loanDate || '',
        lender: propStreamData.lender || '',
        loanType: propStreamData.loanType || '',
        interestRate: propStreamData.interestRate || 0
      },
      distress: {
        isDistressed: propStreamData.isDistressed || false,
        preForeclosure: propStreamData.preForeclosure || false,
        foreclosure: propStreamData.foreclosure || false,
        bankruptcy: propStreamData.bankruptcy || false,
        taxLien: propStreamData.taxLien || false,
        codeViolation: propStreamData.codeViolation || false
      },
      marketData: {
        daysOnMarket: propStreamData.daysOnMarket || 0,
        listPrice: propStreamData.listPrice || 0,
        listDate: propStreamData.listDate || '',
        mlsNumber: propStreamData.mlsNumber || '',
        listingAgent: propStreamData.listingAgent || '',
        status: propStreamData.status || 'Unknown'
      },
      comparables: propStreamData.comparables || []
    }
  }

  // Transform PropStream owner data to our format
  private transformOwner(propStreamData: any): PropStreamOwner {
    return {
      name: propStreamData.name || '',
      type: propStreamData.type || 'individual',
      mailingAddress: {
        street: propStreamData.mailingAddress?.street || '',
        city: propStreamData.mailingAddress?.city || '',
        state: propStreamData.mailingAddress?.state || '',
        zipCode: propStreamData.mailingAddress?.zipCode || ''
      },
      phone: propStreamData.phone || [],
      email: propStreamData.email || [],
      properties: propStreamData.properties || [],
      totalEquity: propStreamData.totalEquity || 0,
      portfolioValue: propStreamData.portfolioValue || 0
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health')
      return true
    } catch (error) {
      console.error('PropStream health check failed:', error)
      return false
    }
  }
}

export { PropStreamAPI }
