// LeadAI Pro - Lead Scoring Tests
// Comprehensive tests for the AI lead scoring engine

import { describe, it, expect, beforeEach } from '@jest/globals'
import { AdvancedLeadScoringEngine } from '../../lib/ai/leadScoring'
import { Lead, Activity, Conversation } from '@prisma/client'

describe('AdvancedLeadScoringEngine', () => {
  let scoringEngine: AdvancedLeadScoringEngine
  let mockLead: Lead
  let mockActivities: Activity[]
  let mockConversations: Conversation[]

  beforeEach(() => {
    scoringEngine = new AdvancedLeadScoringEngine()
    
    mockLead = {
      id: 'lead-1',
      organizationId: 'org-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Example Corp',
      title: 'VP of Sales',
      phone: '+1234567890',
      industry: 'technology',
      status: 'qualified',
      source: 'website',
      currentScore: 0,
      scoreConfidence: 0,
      predictedValue: 50000,
      conversionProbability: null,
      assignedTo: 'user-1',
      teamId: 'team-1',
      stage: 'prospect',
      tags: [],
      customFields: {},
      address: null,
      website: 'https://example.com',
      linkedinUrl: null,
      notes: null,
      lastContactedAt: null,
      lastScoredAt: null,
      optimalContactTime: null,
      engagementLevel: 'medium',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    } as Lead

    mockActivities = [
      {
        id: 'activity-1',
        leadId: 'lead-1',
        userId: 'user-1',
        type: 'email_sent',
        subject: 'Follow up',
        description: 'Sent follow up email',
        outcome: 'opened',
        scheduledAt: null,
        completedAt: new Date('2024-01-02'),
        durationMinutes: null,
        sentimentScore: 0.8,
        intentDetected: 'interest',
        buyingSignals: ['pricing_inquiry'],
        metadata: {},
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      },
      {
        id: 'activity-2',
        leadId: 'lead-1',
        userId: 'user-1',
        type: 'call_completed',
        subject: 'Discovery call',
        description: 'Had discovery call',
        outcome: 'positive',
        scheduledAt: new Date('2024-01-03'),
        completedAt: new Date('2024-01-03'),
        durationMinutes: 30,
        sentimentScore: 0.9,
        intentDetected: 'purchase',
        buyingSignals: ['budget_mentioned', 'timeline_discussed'],
        metadata: {},
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03')
      }
    ] as Activity[]

    mockConversations = [
      {
        id: 'conv-1',
        leadId: 'lead-1',
        activityId: 'activity-1',
        direction: 'inbound',
        channel: 'email',
        subject: 'Interested in your product',
        content: 'Hi, I am interested in your product and would like to know more about pricing.',
        sentiment: { overall: 'positive', score: 0.8 },
        intent: { primaryIntent: 'pricing', confidence: 0.9 },
        topics: ['pricing', 'product'],
        entities: [],
        attachments: [],
        metadata: {},
        analyzedAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ] as Conversation[]
  })

  describe('calculateScore', () => {
    it('should calculate a valid score between 0 and 100', async () => {
      const result = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(typeof result.score).toBe('number')
    })

    it('should return confidence between 0 and 1', async () => {
      const result = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should include all scoring factors', async () => {
      const result = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      expect(result.factors).toHaveProperty('demographic')
      expect(result.factors).toHaveProperty('behavioral')
      expect(result.factors).toHaveProperty('temporal')
      expect(result.factors).toHaveProperty('conversational')
    })

    it('should provide explanations for the score', async () => {
      const result = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      expect(Array.isArray(result.explanation)).toBe(true)
      expect(result.explanation.length).toBeGreaterThan(0)
      expect(typeof result.explanation[0]).toBe('string')
    })

    it('should provide actionable recommendations', async () => {
      const result = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should provide next best actions', async () => {
      const result = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      expect(Array.isArray(result.nextBestActions)).toBe(true)
      expect(result.nextBestActions.length).toBeGreaterThan(0)
    })
  })

  describe('demographic scoring', () => {
    it('should score higher for senior titles', async () => {
      const seniorLead = { ...mockLead, jobTitle: 'CEO' }
      const juniorLead = { ...mockLead, jobTitle: 'Intern' }

      const seniorResult = await scoringEngine.calculateScore({
        lead: seniorLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      const juniorResult = await scoringEngine.calculateScore({
        lead: juniorLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      expect(seniorResult.factors.demographic).toBeGreaterThan(juniorResult.factors.demographic)
    })

    it('should score higher for technology industry', async () => {
      const techLead = { ...mockLead, company: 'TechCorp Software' }
      const otherLead = { ...mockLead, company: 'Agriculture Corp' }

      const techResult = await scoringEngine.calculateScore({
        lead: techLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      const otherResult = await scoringEngine.calculateScore({
        lead: otherLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      expect(techResult.factors.demographic).toBeGreaterThan(otherResult.factors.demographic)
    })
  })

  describe('behavioral scoring', () => {
    it('should score higher with more activities', async () => {
      const moreActivities = [...mockActivities, {
        ...mockActivities[0],
        id: 'activity-3',
        type: 'demo_attended',
        createdAt: new Date('2024-01-04')
      }] as Activity[]

      const moreResult = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: moreActivities,
        conversations: mockConversations
      })

      const lessResult = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      expect(moreResult.factors.behavioral).toBeGreaterThan(lessResult.factors.behavioral)
    })

    it('should score higher for high-value activities', async () => {
      const highValueActivities = [{
        ...mockActivities[0],
        type: 'demo_attended',
        outcome: 'positive'
      }] as Activity[]

      const lowValueActivities = [{
        ...mockActivities[0],
        type: 'email_opened',
        outcome: 'opened'
      }] as Activity[]

      const highResult = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: highValueActivities,
        conversations: mockConversations
      })

      const lowResult = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: lowValueActivities,
        conversations: mockConversations
      })

      expect(highResult.factors.behavioral).toBeGreaterThan(lowResult.factors.behavioral)
    })
  })

  describe('temporal scoring', () => {
    it('should score higher for recent activities', async () => {
      const recentActivities = [{
        ...mockActivities[0],
        createdAt: new Date() // Today
      }] as Activity[]

      const oldActivities = [{
        ...mockActivities[0],
        createdAt: new Date('2023-01-01') // Old
      }] as Activity[]

      const recentResult = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: recentActivities,
        conversations: mockConversations
      })

      const oldResult = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: oldActivities,
        conversations: mockConversations
      })

      expect(recentResult.factors.temporal).toBeGreaterThan(oldResult.factors.temporal)
    })

    it('should score higher for fresh leads', async () => {
      const freshLead = { ...mockLead, createdAt: new Date() }
      const oldLead = { ...mockLead, createdAt: new Date('2023-01-01') }

      const freshResult = await scoringEngine.calculateScore({
        lead: freshLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      const oldResult = await scoringEngine.calculateScore({
        lead: oldLead,
        activities: mockActivities,
        conversations: mockConversations
      })

      expect(freshResult.factors.temporal).toBeGreaterThan(oldResult.factors.temporal)
    })
  })

  describe('conversational scoring', () => {
    it('should score higher for positive sentiment', async () => {
      const positiveConversations = [{
        ...mockConversations[0],
        sentiment: { overall: 'positive', score: 0.9 }
      }] as Conversation[]

      const negativeConversations = [{
        ...mockConversations[0],
        sentiment: { overall: 'negative', score: -0.9 }
      }] as Conversation[]

      const positiveResult = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: positiveConversations
      })

      const negativeResult = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: negativeConversations
      })

      expect(positiveResult.factors.conversational).toBeGreaterThan(negativeResult.factors.conversational)
    })

    it('should score higher for purchase intent', async () => {
      const purchaseConversations = [{
        ...mockConversations[0],
        intent: { primaryIntent: 'purchase', confidence: 0.9 }
      }] as Conversation[]

      const infoConversations = [{
        ...mockConversations[0],
        intent: { primaryIntent: 'information', confidence: 0.9 }
      }] as Conversation[]

      const purchaseResult = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: purchaseConversations
      })

      const infoResult = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: infoConversations
      })

      expect(purchaseResult.factors.conversational).toBeGreaterThan(infoResult.factors.conversational)
    })
  })

  describe('edge cases', () => {
    it('should handle leads with no activities', async () => {
      const result = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: [],
        conversations: mockConversations
      })

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should handle leads with no conversations', async () => {
      const result = await scoringEngine.calculateScore({
        lead: mockLead,
        activities: mockActivities,
        conversations: []
      })

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should handle leads with minimal data', async () => {
      const minimalLead = {
        ...mockLead,
        title: null,
        industry: null,
        company: null
      }

      const result = await scoringEngine.calculateScore({
        lead: minimalLead,
        activities: [],
        conversations: []
      })

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.confidence).toBeGreaterThan(0)
    })
  })
})
