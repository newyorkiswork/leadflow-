// LeadAI Pro - Conversation Intelligence Tests
// Tests for conversation analysis and sentiment detection

import { describe, it, expect, beforeEach } from '@jest/globals'
import { ConversationIntelligenceEngine } from '../../lib/ai/conversationIntelligence'
import { Conversation } from '@prisma/client'

describe('ConversationIntelligenceEngine', () => {
  let engine: ConversationIntelligenceEngine
  let mockConversation: Conversation

  beforeEach(() => {
    engine = new ConversationIntelligenceEngine()
    
    mockConversation = {
      id: 'conv-1',
      leadId: 'lead-1',
      activityId: null,
      direction: 'inbound',
      channel: 'email',
      subject: 'Product Inquiry',
      content: 'Hi, I am interested in your product and would like to know more about pricing and implementation timeline.',
      sentiment: {},
      intent: {},
      topics: [],
      entities: [],
      attachments: [],
      metadata: {},
      analyzedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    } as Conversation
  })

  describe('analyzeConversation', () => {
    it('should analyze conversation and return insights', async () => {
      const result = await engine.analyzeConversation(mockConversation)

      expect(result).toHaveProperty('sentiment')
      expect(result).toHaveProperty('intent')
      expect(result).toHaveProperty('buyingSignals')
      expect(result).toHaveProperty('topics')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('riskFlags')
      expect(result).toHaveProperty('nextBestActions')
    })

    it('should detect positive sentiment', async () => {
      const positiveConversation = {
        ...mockConversation,
        content: 'This is amazing! I love your product and it looks fantastic. Great work!'
      }

      const result = await engine.analyzeConversation(positiveConversation)

      expect(result.sentiment.overall).toBe('positive')
      expect(result.sentiment.score).toBeGreaterThan(0)
      expect(result.sentiment.confidence).toBeGreaterThan(0.5)
    })

    it('should detect negative sentiment', async () => {
      const negativeConversation = {
        ...mockConversation,
        content: 'This is terrible! I hate this product and it is awful. Very disappointed.'
      }

      const result = await engine.analyzeConversation(negativeConversation)

      expect(result.sentiment.overall).toBe('negative')
      expect(result.sentiment.score).toBeLessThan(0)
      expect(result.sentiment.confidence).toBeGreaterThan(0.5)
    })

    it('should detect neutral sentiment', async () => {
      const neutralConversation = {
        ...mockConversation,
        content: 'I think this might be okay. Perhaps we could consider it.'
      }

      const result = await engine.analyzeConversation(neutralConversation)

      expect(result.sentiment.overall).toBe('neutral')
      expect(result.sentiment.confidence).toBeGreaterThanOrEqual(0)
    })
  })

  describe('intent analysis', () => {
    it('should detect purchase intent', async () => {
      const purchaseConversation = {
        ...mockConversation,
        content: 'I want to buy your product. How can I purchase it and get started?'
      }

      const result = await engine.analyzeConversation(purchaseConversation)

      expect(result.intent.primaryIntent).toBe('purchase')
      expect(result.intent.confidence).toBeGreaterThan(0)
    })

    it('should detect demo intent', async () => {
      const demoConversation = {
        ...mockConversation,
        content: 'Can you show me a demo of your product? I would like to see it in action.'
      }

      const result = await engine.analyzeConversation(demoConversation)

      expect(result.intent.primaryIntent).toBe('demo')
      expect(result.intent.confidence).toBeGreaterThan(0)
    })

    it('should detect pricing intent', async () => {
      const pricingConversation = {
        ...mockConversation,
        content: 'What is the cost of your product? Can you send me pricing information?'
      }

      const result = await engine.analyzeConversation(pricingConversation)

      expect(result.intent.primaryIntent).toBe('pricing')
      expect(result.intent.confidence).toBeGreaterThan(0)
    })

    it('should detect urgency levels', async () => {
      const urgentConversation = {
        ...mockConversation,
        content: 'This is urgent! We need this ASAP and have a tight deadline.'
      }

      const result = await engine.analyzeConversation(urgentConversation)

      expect(result.intent.urgency).toBe('high')
    })
  })

  describe('buying signals detection', () => {
    it('should detect budget mentions', async () => {
      const budgetConversation = {
        ...mockConversation,
        content: 'We have allocated $50,000 budget for this project and funding is approved.'
      }

      const result = await engine.analyzeConversation(budgetConversation)

      const budgetSignals = result.buyingSignals.filter(s => s.type === 'budget_mentioned')
      expect(budgetSignals.length).toBeGreaterThan(0)
      expect(budgetSignals[0].confidence).toBeGreaterThan(0)
    })

    it('should detect timeline discussions', async () => {
      const timelineConversation = {
        ...mockConversation,
        content: 'When can we implement this? We need to launch by next quarter.'
      }

      const result = await engine.analyzeConversation(timelineConversation)

      const timelineSignals = result.buyingSignals.filter(s => s.type === 'timeline_discussed')
      expect(timelineSignals.length).toBeGreaterThan(0)
    })

    it('should detect decision maker involvement', async () => {
      const decisionMakerConversation = {
        ...mockConversation,
        content: 'I need to discuss this with my boss and the CEO for approval.'
      }

      const result = await engine.analyzeConversation(decisionMakerConversation)

      const decisionSignals = result.buyingSignals.filter(s => s.type === 'decision_maker_involved')
      expect(decisionSignals.length).toBeGreaterThan(0)
    })

    it('should detect competitor comparisons', async () => {
      const competitorConversation = {
        ...mockConversation,
        content: 'How does your product compare to the competition? We are evaluating alternatives.'
      }

      const result = await engine.analyzeConversation(competitorConversation)

      const competitorSignals = result.buyingSignals.filter(s => s.type === 'competitor_comparison')
      expect(competitorSignals.length).toBeGreaterThan(0)
    })

    it('should detect pain points', async () => {
      const painConversation = {
        ...mockConversation,
        content: 'We have a major problem with our current system and it is causing issues.'
      }

      const result = await engine.analyzeConversation(painConversation)

      const painSignals = result.buyingSignals.filter(s => s.type === 'pain_point_expressed')
      expect(painSignals.length).toBeGreaterThan(0)
    })
  })

  describe('topic extraction', () => {
    it('should extract main topics', async () => {
      const topicConversation = {
        ...mockConversation,
        content: 'We need a software solution for project management and team collaboration.'
      }

      const result = await engine.analyzeConversation(topicConversation)

      expect(result.topics.mainTopics.length).toBeGreaterThan(0)
      expect(result.topics.keywords.length).toBeGreaterThan(0)
    })

    it('should extract entities', async () => {
      const entityConversation = {
        ...mockConversation,
        content: 'John Smith from Acme Corp is interested in our software platform.'
      }

      const result = await engine.analyzeConversation(entityConversation)

      expect(result.topics.entities.people.length).toBeGreaterThan(0)
      expect(result.topics.entities.organizations.length).toBeGreaterThan(0)
    })
  })

  describe('recommendations generation', () => {
    it('should provide recommendations for positive sentiment', async () => {
      const positiveConversation = {
        ...mockConversation,
        content: 'This looks great! I am very impressed with your solution.'
      }

      const result = await engine.analyzeConversation(positiveConversation)

      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.recommendations.some(r => r.includes('accelerate'))).toBe(true)
    })

    it('should provide recommendations for negative sentiment', async () => {
      const negativeConversation = {
        ...mockConversation,
        content: 'I am concerned about this approach and worried about the implementation.'
      }

      const result = await engine.analyzeConversation(negativeConversation)

      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.recommendations.some(r => r.includes('concerns') || r.includes('address'))).toBe(true)
    })

    it('should provide recommendations for purchase intent', async () => {
      const purchaseConversation = {
        ...mockConversation,
        content: 'I want to buy this product. How do we proceed with the purchase?'
      }

      const result = await engine.analyzeConversation(purchaseConversation)

      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.recommendations.some(r => r.includes('contract') || r.includes('proposal'))).toBe(true)
    })
  })

  describe('risk flags identification', () => {
    it('should identify high negative sentiment as risk', async () => {
      const negativeConversation = {
        ...mockConversation,
        content: 'This is terrible! I hate everything about this product. Very disappointed and angry.'
      }

      const result = await engine.analyzeConversation(negativeConversation)

      expect(result.riskFlags.length).toBeGreaterThan(0)
      expect(result.riskFlags.some(r => r.includes('negative sentiment'))).toBe(true)
    })

    it('should identify competitor comparison as risk', async () => {
      const competitorConversation = {
        ...mockConversation,
        content: 'We are comparing your solution with several competitors and evaluating alternatives.'
      }

      const result = await engine.analyzeConversation(competitorConversation)

      expect(result.riskFlags.some(r => r.includes('competitor'))).toBe(true)
    })

    it('should identify low engagement as risk', async () => {
      const lowEngagementConversation = {
        ...mockConversation,
        content: 'Maybe. I guess. Not sure.'
      }

      const result = await engine.analyzeConversation(lowEngagementConversation)

      expect(result.riskFlags.some(r => r.includes('engagement') || r.includes('intent'))).toBe(true)
    })
  })

  describe('next best actions', () => {
    it('should suggest closing actions for high intent', async () => {
      const highIntentConversation = {
        ...mockConversation,
        content: 'I want to buy this now. We have budget approved and need to purchase immediately.'
      }

      const result = await engine.analyzeConversation(highIntentConversation)

      expect(result.nextBestActions.length).toBeGreaterThan(0)
      expect(result.nextBestActions.some(a => a.includes('contract') || a.includes('close'))).toBe(true)
    })

    it('should suggest demo for demo intent', async () => {
      const demoConversation = {
        ...mockConversation,
        content: 'Can you show me how this works? I would like to see a demonstration.'
      }

      const result = await engine.analyzeConversation(demoConversation)

      expect(result.nextBestActions.some(a => a.includes('demo'))).toBe(true)
    })

    it('should suggest nurturing for low intent', async () => {
      const lowIntentConversation = {
        ...mockConversation,
        content: 'Just looking around. Not sure what we need yet.'
      }

      const result = await engine.analyzeConversation(lowIntentConversation)

      expect(result.nextBestActions.some(a => a.includes('educational') || a.includes('discovery'))).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty content', async () => {
      const emptyConversation = {
        ...mockConversation,
        content: ''
      }

      const result = await engine.analyzeConversation(emptyConversation)

      expect(result.sentiment.overall).toBe('neutral')
      expect(result.buyingSignals.length).toBe(0)
    })

    it('should handle very short content', async () => {
      const shortConversation = {
        ...mockConversation,
        content: 'Yes'
      }

      const result = await engine.analyzeConversation(shortConversation)

      expect(result).toHaveProperty('sentiment')
      expect(result).toHaveProperty('intent')
    })

    it('should handle very long content', async () => {
      const longContent = 'This is a very long conversation. '.repeat(100)
      const longConversation = {
        ...mockConversation,
        content: longContent
      }

      const result = await engine.analyzeConversation(longConversation)

      expect(result).toHaveProperty('sentiment')
      expect(result).toHaveProperty('intent')
      expect(result.topics.mainTopics.length).toBeGreaterThan(0)
    })
  })
})
