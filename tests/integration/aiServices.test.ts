// Lead AI Pro - AI Services Integration Tests (2025)
// End-to-end tests for AI service integration and workflows

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { AIServiceManager } from '../../lib/ai/aiServiceManager'
import { initializeAIServices, getAIServiceManager } from '../../lib/ai'
import '../setup'

describe('AI Services Integration', () => {
  let aiManager: AIServiceManager

  beforeAll(async () => {
    // Initialize AI services with test configuration
    aiManager = initializeAIServices({
      openaiApiKey: 'test-key',
      maxRetries: 1,
      timeout: 5000,
      rateLimits: {
        requestsPerMinute: 1000,
        tokensPerMinute: 100000
      },
      caching: {
        enabled: true,
        ttl: 60
      },
      monitoring: {
        enabled: true,
        logLevel: 'error'
      }
    })
  })

  afterAll(async () => {
    aiManager.destroy()
  })

  beforeEach(() => {
    // Reset metrics before each test
    jest.clearAllMocks()
  })

  describe('Service Manager', () => {
    test('should initialize all AI services', () => {
      expect(aiManager).toBeDefined()
      expect(aiManager.getMetrics()).toBeDefined()
      expect(aiManager.getRateLimitStatus()).toBeDefined()
    })

    test('should track metrics correctly', async () => {
      const initialMetrics = aiManager.getMetrics()
      expect(initialMetrics.totalRequests).toBe(0)
      expect(initialMetrics.successfulRequests).toBe(0)
      expect(initialMetrics.failedRequests).toBe(0)
    })

    test('should handle rate limiting', () => {
      const rateLimitStatus = aiManager.getRateLimitStatus()
      expect(rateLimitStatus).toHaveProperty('requestCount')
      expect(rateLimitStatus).toHaveProperty('tokenCount')
      expect(rateLimitStatus).toHaveProperty('isLimited')
      expect(rateLimitStatus.isLimited).toBe(false)
    })

    test('should provide cache statistics', () => {
      const cacheStats = aiManager.getCacheStats()
      expect(cacheStats).toHaveProperty('size')
      expect(cacheStats).toHaveProperty('hitRate')
      expect(typeof cacheStats.size).toBe('number')
      expect(typeof cacheStats.hitRate).toBe('number')
    })

    test('should perform health checks', async () => {
      const health = await aiManager.healthCheck()
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('details')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
    })
  })

  describe('Lead Scoring Integration', () => {
    test('should score leads with caching', async () => {
      const mockLeads = [
        global.testUtils.createMockLead({ id: 'lead-1' }),
        global.testUtils.createMockLead({ id: 'lead-2' })
      ]

      // Mock the AI response
      jest.spyOn(aiManager as any, 'makeAIRequest').mockResolvedValue([
        global.testUtils.mockAIServiceResponse('leadScoring', { leadId: 'lead-1' }),
        global.testUtils.mockAIServiceResponse('leadScoring', { leadId: 'lead-2' })
      ])

      // First request
      const results1 = await aiManager.scoreLeads(mockLeads)
      expect(results1).toHaveLength(2)

      // Second request should use cache
      const results2 = await aiManager.scoreLeads(mockLeads)
      expect(results2).toHaveLength(2)

      // Verify caching worked
      const cacheStats = aiManager.getCacheStats()
      expect(cacheStats.hitRate).toBeGreaterThan(0)
    })

    test('should handle scoring errors gracefully', async () => {
      const mockLeads = [global.testUtils.createMockLead()]

      jest.spyOn(aiManager as any, 'makeAIRequest').mockRejectedValue(
        new Error('AI service unavailable')
      )

      await expect(aiManager.scoreLeads(mockLeads)).rejects.toThrow('AI service unavailable')

      const metrics = aiManager.getMetrics()
      expect(metrics.failedRequests).toBeGreaterThan(0)
    })
  })

  describe('Conversation Analysis Integration', () => {
    test('should analyze conversations with proper error handling', async () => {
      const transcript = 'Agent: Hello, how can I help you today? Customer: I am interested in your product.'
      const leadData = global.testUtils.createMockLead()

      jest.spyOn(aiManager as any, 'makeAIRequest').mockResolvedValue(
        global.testUtils.mockAIServiceResponse('conversationAnalysis', {
          transcript,
          leadId: leadData.id
        })
      )

      const result = await aiManager.analyzeConversation(transcript, leadData)
      
      expect(result).toBeDefined()
      expect(result.sentiment).toBeDefined()
      expect(result.keyTopics).toBeDefined()
      expect(result.actionItems).toBeDefined()
    })

    test('should handle long transcripts efficiently', async () => {
      const longTranscript = 'Agent: Hello. '.repeat(1000) + 'Customer: Thank you.'
      const leadData = global.testUtils.createMockLead()

      jest.spyOn(aiManager as any, 'makeAIRequest').mockResolvedValue(
        global.testUtils.mockAIServiceResponse('conversationAnalysis', {})
      )

      const startTime = Date.now()
      await aiManager.analyzeConversation(longTranscript, leadData)
      const endTime = Date.now()

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000)
    })
  })

  describe('Voice Command Integration', () => {
    test('should process voice commands correctly', async () => {
      const audioText = 'Call John Smith from Acme Corporation'
      const userId = 'test-user-1'

      jest.spyOn(aiManager as any, 'makeAIRequest').mockResolvedValue(
        global.testUtils.mockAIServiceResponse('voiceCommand', {
          intent: 'call_lead',
          entities: { leadName: 'John Smith', company: 'Acme Corporation' }
        })
      )

      const result = await aiManager.processVoiceCommand(audioText, userId)
      
      expect(result).toBeDefined()
      expect(result.intent).toBe('call_lead')
      expect(result.entities).toBeDefined()
      expect(result.confidence).toBeValidConfidence()
    })

    test('should handle unclear voice commands', async () => {
      const unclearAudioText = 'umm... maybe call... uh... someone?'
      const userId = 'test-user-1'

      jest.spyOn(aiManager as any, 'makeAIRequest').mockResolvedValue(
        global.testUtils.mockAIServiceResponse('voiceCommand', {
          intent: 'unknown',
          confidence: 0.2
        })
      )

      const result = await aiManager.processVoiceCommand(unclearAudioText, userId)
      
      expect(result.confidence).toBeLessThan(0.5)
    })
  })

  describe('Social Media Integration', () => {
    test('should research social media profiles', async () => {
      const leadData = global.testUtils.createMockLead()

      jest.spyOn(aiManager as any, 'makeAIRequest').mockResolvedValue(
        global.testUtils.mockAIServiceResponse('socialIntelligence', {
          leadId: leadData.id
        })
      )

      const result = await aiManager.researchSocialMedia(leadData)
      
      expect(result).toBeDefined()
      expect(result.profiles).toBeDefined()
      expect(result.interests).toBeDefined()
      expect(result.opportunities).toBeDefined()
    })

    test('should handle leads with no social presence', async () => {
      const leadData = global.testUtils.createMockLead({
        email: 'nopresence@example.com'
      })

      jest.spyOn(aiManager as any, 'makeAIRequest').mockResolvedValue(
        global.testUtils.mockAIServiceResponse('socialIntelligence', {
          profiles: [],
          interests: [],
          opportunities: []
        })
      )

      const result = await aiManager.researchSocialMedia(leadData)
      
      expect(result.profiles).toEqual([])
      expect(result.interests).toEqual([])
    })
  })

  describe('Predictive Analytics Integration', () => {
    test('should predict lead outcomes', async () => {
      const leadData = global.testUtils.createMockLead()
      const historicalData = [
        global.testUtils.createMockLead({ status: 'closed_won' }),
        global.testUtils.createMockLead({ status: 'closed_lost' })
      ]

      jest.spyOn(aiManager as any, 'makeAIRequest').mockResolvedValue(
        global.testUtils.mockAIServiceResponse('predictiveAnalytics', {
          leadId: leadData.id
        })
      )

      const result = await aiManager.predictLeadOutcome(leadData, historicalData)
      
      expect(result).toBeDefined()
      expect(result.conversionProbability).toBeValidConfidence()
      expect(result.expectedValue).toBeDefined()
      expect(result.timeToClose).toBeDefined()
    })

    test('should handle insufficient historical data', async () => {
      const leadData = global.testUtils.createMockLead()
      const limitedHistoricalData = []

      jest.spyOn(aiManager as any, 'makeAIRequest').mockResolvedValue(
        global.testUtils.mockAIServiceResponse('predictiveAnalytics', {
          conversionProbability: 0.5,
          confidence: 0.3
        })
      )

      const result = await aiManager.predictLeadOutcome(leadData, limitedHistoricalData)
      
      expect(result.conversionProbability).toBeDefined()
      // Should have lower confidence with limited data
      expect(result.confidence).toBeLessThan(0.7)
    })
  })

  describe('Performance and Reliability', () => {
    test('should handle concurrent requests', async () => {
      const mockLeads = Array.from({ length: 5 }, (_, i) => 
        global.testUtils.createMockLead({ id: `concurrent-lead-${i}` })
      )

      jest.spyOn(aiManager as any, 'makeAIRequest').mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(global.testUtils.mockAIServiceResponse('leadScoring', {})), 100)
        )
      )

      const promises = mockLeads.map(lead => aiManager.scoreLeads([lead]))
      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toHaveLength(1)
      })
    })

    test('should respect rate limits', async () => {
      // Configure strict rate limits for this test
      const strictManager = new AIServiceManager({
        openaiApiKey: 'test-key',
        maxRetries: 1,
        timeout: 5000,
        rateLimits: {
          requestsPerMinute: 2,
          tokensPerMinute: 1000
        },
        caching: { enabled: false, ttl: 0 },
        monitoring: { enabled: false, logLevel: 'error' }
      })

      const mockLeads = Array.from({ length: 5 }, (_, i) => 
        global.testUtils.createMockLead({ id: `rate-limit-lead-${i}` })
      )

      jest.spyOn(strictManager as any, 'makeAIRequest').mockImplementation(
        () => Promise.resolve(global.testUtils.mockAIServiceResponse('leadScoring', {}))
      )

      // Make requests that should trigger rate limiting
      const promises = mockLeads.map(lead => strictManager.scoreLeads([lead]))
      
      // Some requests should be queued due to rate limiting
      const startTime = Date.now()
      await Promise.all(promises)
      const endTime = Date.now()

      // Should take longer due to rate limiting
      expect(endTime - startTime).toBeGreaterThan(100)

      strictManager.destroy()
    })

    test('should recover from service failures', async () => {
      const mockLead = global.testUtils.createMockLead()

      // First call fails
      jest.spyOn(aiManager as any, 'makeAIRequest')
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockResolvedValueOnce(global.testUtils.mockAIServiceResponse('leadScoring', {}))

      // Should retry and succeed
      const result = await aiManager.scoreLeads([mockLead])
      expect(result).toHaveLength(1)

      const metrics = aiManager.getMetrics()
      expect(metrics.successfulRequests).toBeGreaterThan(0)
    })
  })

  describe('End-to-End Workflows', () => {
    test('should complete full lead analysis workflow', async () => {
      const leadData = global.testUtils.createMockLead()
      const transcript = 'Customer expressed interest in enterprise features'
      const historicalData = [global.testUtils.createMockLead()]

      // Mock all AI service responses
      jest.spyOn(aiManager as any, 'makeAIRequest')
        .mockImplementation((serviceName) => {
          return Promise.resolve(global.testUtils.mockAIServiceResponse(serviceName, {}))
        })

      // Execute full workflow
      const [scoring, conversation, social, prediction] = await Promise.all([
        aiManager.scoreLeads([leadData]),
        aiManager.analyzeConversation(transcript, leadData),
        aiManager.researchSocialMedia(leadData),
        aiManager.predictLeadOutcome(leadData, historicalData)
      ])

      expect(scoring).toHaveLength(1)
      expect(conversation).toBeDefined()
      expect(social).toBeDefined()
      expect(prediction).toBeDefined()

      // Verify all services were called
      const metrics = aiManager.getMetrics()
      expect(metrics.totalRequests).toBeGreaterThan(0)
    })
  })
})
