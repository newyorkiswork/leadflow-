// Lead AI Pro - AI Service Manager (2025)
// Centralized AI service management with error handling, rate limiting, and optimization

import { OpenAI } from 'openai'
import { LeadScoringEngine } from './leadScoring'
import { ConversationIntelligence } from './conversationIntelligence'
import { VoiceAssistant } from './voiceAssistant'
import { SocialMediaIntelligence } from './socialMediaIntegration'
import { PredictiveAnalyticsEngine } from './predictiveAnalytics'

export interface AIServiceConfig {
  openaiApiKey: string
  anthropicApiKey?: string
  maxRetries: number
  timeout: number
  rateLimits: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
  caching: {
    enabled: boolean
    ttl: number // seconds
  }
  monitoring: {
    enabled: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
}

export interface AIServiceMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  tokensUsed: number
  cacheHitRate: number
  errorRate: number
  lastError?: {
    message: string
    timestamp: Date
    service: string
  }
}

export interface RateLimitState {
  requestCount: number
  tokenCount: number
  windowStart: Date
  isLimited: boolean
}

export class AIServiceManager {
  private config: AIServiceConfig
  private openai: OpenAI
  private services: Map<string, any> = new Map()
  private metrics: AIServiceMetrics
  private rateLimitState: RateLimitState
  private cache: Map<string, { data: any; expires: Date }> = new Map()
  private requestQueue: Array<{ resolve: Function; reject: Function; request: Function }> = []
  private isProcessingQueue = false

  constructor(config: AIServiceConfig) {
    this.config = config
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
      timeout: config.timeout
    })

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      tokensUsed: 0,
      cacheHitRate: 0,
      errorRate: 0
    }

    this.rateLimitState = {
      requestCount: 0,
      tokenCount: 0,
      windowStart: new Date(),
      isLimited: false
    }

    this.initializeServices()
    this.startRateLimitReset()
    this.startCacheCleanup()
  }

  private initializeServices(): void {
    // Initialize all AI services
    this.services.set('leadScoring', new LeadScoringEngine())
    this.services.set('conversationIntelligence', new ConversationIntelligence())
    this.services.set('voiceAssistant', new VoiceAssistant())
    this.services.set('socialIntelligence', new SocialMediaIntelligence())
    this.services.set('predictiveAnalytics', new PredictiveAnalyticsEngine())
  }

  // Rate limiting management
  private checkRateLimit(estimatedTokens: number = 1000): boolean {
    const now = new Date()
    const windowDuration = 60 * 1000 // 1 minute

    // Reset window if needed
    if (now.getTime() - this.rateLimitState.windowStart.getTime() > windowDuration) {
      this.rateLimitState.requestCount = 0
      this.rateLimitState.tokenCount = 0
      this.rateLimitState.windowStart = now
      this.rateLimitState.isLimited = false
    }

    // Check limits
    const wouldExceedRequests = this.rateLimitState.requestCount >= this.config.rateLimits.requestsPerMinute
    const wouldExceedTokens = this.rateLimitState.tokenCount + estimatedTokens >= this.config.rateLimits.tokensPerMinute

    if (wouldExceedRequests || wouldExceedTokens) {
      this.rateLimitState.isLimited = true
      return false
    }

    return true
  }

  private updateRateLimit(tokensUsed: number): void {
    this.rateLimitState.requestCount++
    this.rateLimitState.tokenCount += tokensUsed
  }

  // Caching management
  private getCacheKey(service: string, method: string, params: any): string {
    return `${service}:${method}:${JSON.stringify(params)}`
  }

  private getFromCache(key: string): any | null {
    if (!this.config.caching.enabled) return null

    const cached = this.cache.get(key)
    if (!cached) return null

    if (new Date() > cached.expires) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCache(key: string, data: any): void {
    if (!this.config.caching.enabled) return

    const expires = new Date(Date.now() + this.config.caching.ttl * 1000)
    this.cache.set(key, { data, expires })
  }

  // Queue management for rate limiting
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      if (this.rateLimitState.isLimited) {
        // Wait for rate limit reset
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }

      const { resolve, reject, request } = this.requestQueue.shift()!
      
      try {
        const result = await request()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    this.isProcessingQueue = false
  }

  // Core AI request method with error handling and retries
  private async makeAIRequest<T>(
    serviceName: string,
    methodName: string,
    requestFn: () => Promise<T>,
    params: any = {},
    estimatedTokens: number = 1000
  ): Promise<T> {
    const startTime = Date.now()
    const cacheKey = this.getCacheKey(serviceName, methodName, params)

    try {
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        this.metrics.totalRequests++
        this.updateMetrics(startTime, true, 0)
        return cached
      }

      // Check rate limits
      if (!this.checkRateLimit(estimatedTokens)) {
        return new Promise((resolve, reject) => {
          this.requestQueue.push({ resolve, reject, request: requestFn })
          this.processQueue()
        })
      }

      // Make the request with retries
      let lastError: Error
      for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
        try {
          const result = await requestFn()
          
          // Update metrics and cache
          this.updateRateLimit(estimatedTokens)
          this.updateMetrics(startTime, true, estimatedTokens)
          this.setCache(cacheKey, result)
          
          return result
        } catch (error) {
          lastError = error as Error
          
          // Don't retry on certain errors
          if (this.isNonRetryableError(error)) {
            break
          }
          
          // Exponential backoff
          if (attempt < this.config.maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          }
        }
      }

      throw lastError!
    } catch (error) {
      this.updateMetrics(startTime, false, 0)
      this.logError(serviceName, methodName, error as Error)
      throw error
    }
  }

  private isNonRetryableError(error: any): boolean {
    // Don't retry on authentication, permission, or validation errors
    const nonRetryableCodes = [401, 403, 422, 400]
    return error.status && nonRetryableCodes.includes(error.status)
  }

  private updateMetrics(startTime: number, success: boolean, tokensUsed: number): void {
    const responseTime = Date.now() - startTime
    
    this.metrics.totalRequests++
    this.metrics.tokensUsed += tokensUsed
    
    if (success) {
      this.metrics.successfulRequests++
    } else {
      this.metrics.failedRequests++
    }
    
    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests
    
    // Update error rate
    this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests
    
    // Update cache hit rate
    const cacheHits = this.metrics.totalRequests - this.metrics.successfulRequests - this.metrics.failedRequests
    this.metrics.cacheHitRate = cacheHits / this.metrics.totalRequests
  }

  private logError(service: string, method: string, error: Error): void {
    this.metrics.lastError = {
      message: error.message,
      timestamp: new Date(),
      service: `${service}.${method}`
    }

    if (this.config.monitoring.enabled) {
      console.error(`[AI Service Error] ${service}.${method}:`, error)
    }
  }

  // Cleanup and maintenance
  private startRateLimitReset(): void {
    setInterval(() => {
      const now = new Date()
      if (now.getTime() - this.rateLimitState.windowStart.getTime() > 60000) {
        this.rateLimitState.requestCount = 0
        this.rateLimitState.tokenCount = 0
        this.rateLimitState.windowStart = now
        this.rateLimitState.isLimited = false
      }
    }, 10000) // Check every 10 seconds
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = new Date()
      for (const [key, value] of this.cache.entries()) {
        if (now > value.expires) {
          this.cache.delete(key)
        }
      }
    }, 60000) // Clean every minute
  }

  // Public API methods
  async scoreLeads(leads: any[]): Promise<any[]> {
    const leadScoring = this.services.get('leadScoring')
    return this.makeAIRequest(
      'leadScoring',
      'scoreLeads',
      () => leadScoring.scoreLeads(leads),
      { leads: leads.map(l => l.id) },
      leads.length * 500
    )
  }

  async analyzeConversation(transcript: string, leadData: any): Promise<any> {
    const conversationIntelligence = this.services.get('conversationIntelligence')
    return this.makeAIRequest(
      'conversationIntelligence',
      'analyzeConversation',
      () => conversationIntelligence.analyzeConversation(transcript, leadData),
      { transcript: transcript.substring(0, 100), leadId: leadData.id },
      Math.ceil(transcript.length / 4) // Rough token estimate
    )
  }

  async processVoiceCommand(audioText: string, userId: string): Promise<any> {
    const voiceAssistant = this.services.get('voiceAssistant')
    return this.makeAIRequest(
      'voiceAssistant',
      'processVoiceCommand',
      () => voiceAssistant.processVoiceCommand(audioText, userId),
      { audioText: audioText.substring(0, 50), userId },
      Math.ceil(audioText.length / 4)
    )
  }

  async researchSocialMedia(leadData: any): Promise<any> {
    const socialIntelligence = this.services.get('socialIntelligence')
    return this.makeAIRequest(
      'socialIntelligence',
      'researchLead',
      () => socialIntelligence.researchLead(leadData),
      { leadId: leadData.id },
      1000
    )
  }

  async predictLeadOutcome(leadData: any, historicalData: any[]): Promise<any> {
    const predictiveAnalytics = this.services.get('predictiveAnalytics')
    return this.makeAIRequest(
      'predictiveAnalytics',
      'predictLeadOutcome',
      () => predictiveAnalytics.predictLeadOutcome(leadData, historicalData),
      { leadId: leadData.id, historicalCount: historicalData.length },
      1500
    )
  }

  // Health and monitoring
  getMetrics(): AIServiceMetrics {
    return { ...this.metrics }
  }

  getRateLimitStatus(): RateLimitState {
    return { ...this.rateLimitState }
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: this.metrics.cacheHitRate
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    const checks = {
      openai: false,
      rateLimit: !this.rateLimitState.isLimited,
      errorRate: this.metrics.errorRate < 0.1,
      responseTime: this.metrics.averageResponseTime < 5000
    }

    try {
      // Test OpenAI connection
      await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
      checks.openai = true
    } catch (error) {
      checks.openai = false
    }

    const healthyChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.keys(checks).length

    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyChecks === totalChecks) {
      status = 'healthy'
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    return { status, details: checks }
  }

  // Cleanup
  destroy(): void {
    this.cache.clear()
    this.requestQueue.length = 0
  }
}

export { AIServiceManager }
