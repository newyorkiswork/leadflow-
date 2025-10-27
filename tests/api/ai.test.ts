// LeadAI Pro - AI API Integration Tests
// Tests for AI-powered API endpoints

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { prisma } from '../../lib/database'
import aiRoutes from '../../server/routes/ai'

// Mock middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = {
    id: 'user-1',
    organizationId: 'org-1',
    role: 'sales_rep'
  }
  next()
}

const mockSubscriptionMiddleware = (tier: string) => (req: any, res: any, next: any) => {
  next()
}

// Create test app
const app = express()
app.use(express.json())
app.use(mockAuthMiddleware)
app.use('/api/ai', aiRoutes)

// Mock Prisma
jest.mock('../../lib/database', () => ({
  prisma: {
    lead: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    leadScore: {
      create: jest.fn()
    },
    conversation: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    user: {
      findMany: jest.fn()
    }
  }
}))

describe('AI API Endpoints', () => {
  const mockLead = {
    id: 'lead-1',
    organizationId: 'org-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    company: 'Example Corp',
    title: 'VP of Sales',
    industry: 'technology',
    status: 'qualified',
    source: 'website',
    currentScore: 75,
    scoreConfidence: 0.85,
    predictedValue: 50000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    activities: [
      {
        id: 'activity-1',
        type: 'email_sent',
        subject: 'Follow up',
        outcome: 'opened',
        createdAt: new Date('2024-01-02')
      }
    ],
    conversations: [
      {
        id: 'conv-1',
        content: 'Interested in your product',
        sentiment: { overall: 'positive' },
        intent: { primaryIntent: 'pricing' },
        createdAt: new Date('2024-01-02')
      }
    ],
    scores: [
      {
        id: 'score-1',
        score: 75,
        confidence: 0.85,
        createdAt: new Date('2024-01-02')
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/ai/insights/:leadId', () => {
    it('should return comprehensive AI insights for a lead', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead)

      const response = await request(app)
        .get('/api/ai/insights/lead-1')
        .expect(200)

      expect(response.body).toHaveProperty('leadId', 'lead-1')
      expect(response.body).toHaveProperty('scoring')
      expect(response.body).toHaveProperty('behavioral')
      expect(response.body).toHaveProperty('conversations')
      expect(response.body).toHaveProperty('summary')

      expect(response.body.scoring).toHaveProperty('score')
      expect(response.body.scoring).toHaveProperty('confidence')
      expect(response.body.scoring).toHaveProperty('factors')
      expect(response.body.scoring).toHaveProperty('recommendations')

      expect(response.body.summary).toHaveProperty('overallScore')
      expect(response.body.summary).toHaveProperty('currentStage')
      expect(response.body.summary).toHaveProperty('nextBestActions')
    })

    it('should return 404 for non-existent lead', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .get('/api/ai/insights/non-existent-lead')
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Lead not found')
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .get('/api/ai/insights/lead-1')
        .expect(500)
    })
  })

  describe('POST /api/ai/score/:leadId', () => {
    it('should calculate and update lead score', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead)
      ;(prisma.lead.update as jest.Mock).mockResolvedValue({ ...mockLead, currentScore: 80 })
      ;(prisma.leadScore.create as jest.Mock).mockResolvedValue({
        id: 'score-2',
        leadId: 'lead-1',
        score: 80,
        confidence: 0.9
      })

      const response = await request(app)
        .post('/api/ai/score/lead-1')
        .expect(200)

      expect(response.body).toHaveProperty('score')
      expect(response.body).toHaveProperty('confidence')
      expect(response.body).toHaveProperty('factors')
      expect(response.body).toHaveProperty('explanation')
      expect(response.body).toHaveProperty('recommendations')

      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: expect.objectContaining({
          currentScore: expect.any(Number),
          scoreConfidence: expect.any(Number),
          lastScoredAt: expect.any(Date)
        })
      })

      expect(prisma.leadScore.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead-1',
          score: expect.any(Number),
          confidence: expect.any(Number)
        })
      })
    })

    it('should return 404 for non-existent lead', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .post('/api/ai/score/non-existent-lead')
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Lead not found')
    })
  })

  describe('POST /api/ai/analyze-conversation', () => {
    const mockConversation = {
      id: 'conv-1',
      leadId: 'lead-1',
      content: 'I am interested in your product and would like to know more about pricing.',
      direction: 'inbound',
      channel: 'email'
    }

    it('should analyze conversation content', async () => {
      ;(prisma.conversation.findUnique as jest.Mock).mockResolvedValue(mockConversation)
      ;(prisma.conversation.update as jest.Mock).mockResolvedValue(mockConversation)

      const response = await request(app)
        .post('/api/ai/analyze-conversation')
        .send({
          conversationId: 'conv-1',
          content: 'I am interested in your product and would like to know more about pricing.',
          type: 'email',
          leadId: 'lead-1'
        })
        .expect(200)

      expect(response.body).toHaveProperty('sentiment')
      expect(response.body).toHaveProperty('intent')
      expect(response.body).toHaveProperty('buyingSignals')
      expect(response.body).toHaveProperty('topics')
      expect(response.body).toHaveProperty('recommendations')

      expect(response.body.sentiment).toHaveProperty('overall')
      expect(response.body.sentiment).toHaveProperty('score')
      expect(response.body.sentiment).toHaveProperty('confidence')

      expect(response.body.intent).toHaveProperty('primaryIntent')
      expect(response.body.intent).toHaveProperty('confidence')
    })

    it('should create new conversation if conversationId not provided', async () => {
      ;(prisma.conversation.create as jest.Mock).mockResolvedValue(mockConversation)
      ;(prisma.conversation.update as jest.Mock).mockResolvedValue(mockConversation)

      const response = await request(app)
        .post('/api/ai/analyze-conversation')
        .send({
          content: 'I am interested in your product.',
          type: 'email',
          leadId: 'lead-1'
        })
        .expect(200)

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead-1',
          content: 'I am interested in your product.',
          direction: 'inbound',
          channel: 'email'
        })
      })
    })

    it('should return 400 for missing content', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-conversation')
        .send({
          conversationId: 'conv-1',
          type: 'email',
          leadId: 'lead-1'
        })
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Conversation content is required')
    })
  })

  describe('GET /api/ai/behavior/:leadId', () => {
    it('should return behavioral analysis for a lead', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead)

      const response = await request(app)
        .get('/api/ai/behavior/lead-1')
        .expect(200)

      expect(response.body).toHaveProperty('patterns')
      expect(response.body).toHaveProperty('currentStage')
      expect(response.body).toHaveProperty('predictedPath')
      expect(response.body).toHaveProperty('engagementScore')
      expect(response.body).toHaveProperty('velocityScore')
      expect(response.body).toHaveProperty('recommendations')

      expect(Array.isArray(response.body.patterns)).toBe(true)
      expect(response.body.currentStage).toHaveProperty('current')
      expect(response.body.currentStage).toHaveProperty('confidence')
    })

    it('should return 404 for non-existent lead', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .get('/api/ai/behavior/non-existent-lead')
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Lead not found')
    })
  })

  describe('POST /api/ai/route-lead', () => {
    const mockUsers = [
      {
        id: 'user-1',
        fullName: 'John Smith',
        role: 'sales_rep',
        organizationId: 'org-1'
      },
      {
        id: 'user-2',
        fullName: 'Jane Doe',
        role: 'sales_rep',
        organizationId: 'org-1'
      }
    ]

    it('should provide routing recommendations', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead)
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const response = await request(app)
        .post('/api/ai/route-lead')
        .send({
          leadId: 'lead-1',
          criteria: {
            leadProfile: {
              industry: 'technology',
              urgency: 'high'
            }
          }
        })
        .expect(200)

      expect(response.body).toHaveProperty('primaryAssignment')
      expect(response.body).toHaveProperty('alternativeOptions')
      expect(response.body).toHaveProperty('routingScore')

      expect(response.body.primaryAssignment).toHaveProperty('repId')
      expect(response.body.primaryAssignment).toHaveProperty('repName')
      expect(response.body.primaryAssignment).toHaveProperty('confidence')
      expect(response.body.primaryAssignment).toHaveProperty('reasoning')
      expect(response.body.primaryAssignment).toHaveProperty('expectedOutcome')

      expect(Array.isArray(response.body.alternativeOptions)).toBe(true)
    })

    it('should return 404 for non-existent lead', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .post('/api/ai/route-lead')
        .send({
          leadId: 'non-existent-lead',
          criteria: {}
        })
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Lead not found')
    })
  })

  describe('GET /api/ai/recommendations/:leadId', () => {
    it('should return content recommendations', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead)

      const response = await request(app)
        .get('/api/ai/recommendations/lead-1')
        .expect(200)

      expect(response.body).toHaveProperty('content')
      expect(response.body).toHaveProperty('timing')
      expect(response.body).toHaveProperty('channels')
      expect(response.body).toHaveProperty('messaging')

      expect(Array.isArray(response.body.content)).toBe(true)
      expect(Array.isArray(response.body.channels)).toBe(true)
      expect(response.body.timing).toHaveProperty('bestDays')
      expect(response.body.timing).toHaveProperty('bestTimes')
    })

    it('should return 404 for non-existent lead', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .get('/api/ai/recommendations/non-existent-lead')
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Lead not found')
    })
  })

  describe('GET /api/ai/forecast', () => {
    it('should return forecasting data', async () => {
      ;(prisma.lead.findMany as jest.Mock).mockResolvedValue([mockLead])

      const response = await request(app)
        .get('/api/ai/forecast')
        .query({ timeframe: '30d' })
        .expect(200)

      expect(response.body).toHaveProperty('period', '30d')
      expect(response.body).toHaveProperty('predictions')
      expect(response.body).toHaveProperty('breakdown')

      expect(response.body.predictions).toHaveProperty('expectedDeals')
      expect(response.body.predictions).toHaveProperty('expectedRevenue')
      expect(response.body.predictions).toHaveProperty('confidence')

      expect(response.body.breakdown).toHaveProperty('byStage')
      expect(response.body.breakdown).toHaveProperty('byRep')
      expect(response.body.breakdown).toHaveProperty('bySource')

      expect(Array.isArray(response.body.breakdown.byStage)).toBe(true)
      expect(Array.isArray(response.body.breakdown.byRep)).toBe(true)
      expect(Array.isArray(response.body.breakdown.bySource)).toBe(true)
    })

    it('should handle empty lead data', async () => {
      ;(prisma.lead.findMany as jest.Mock).mockResolvedValue([])

      const response = await request(app)
        .get('/api/ai/forecast')
        .expect(200)

      expect(response.body.predictions.expectedDeals).toBe(0)
      expect(response.body.predictions.expectedRevenue).toBe(0)
    })
  })

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockRejectedValue(new Error('Connection failed'))

      const response = await request(app)
        .get('/api/ai/insights/lead-1')
        .expect(500)
    })

    it('should handle malformed request data', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-conversation')
        .send('invalid json')
        .expect(400)
    })
  })

  describe('Performance', () => {
    it('should respond to insights request within reasonable time', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead)

      const startTime = Date.now()
      
      await request(app)
        .get('/api/ai/insights/lead-1')
        .expect(200)

      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds
    })

    it('should handle concurrent requests', async () => {
      ;(prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead)

      const requests = Array(10).fill(null).map(() =>
        request(app).get('/api/ai/insights/lead-1')
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})
