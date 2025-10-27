// LeadAI Pro - End-to-End Lead Workflow Tests
// Complete workflow testing from lead creation to conversion

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { AdvancedLeadScoringEngine } from '../../lib/ai/leadScoring'
import { ConversationIntelligenceEngine } from '../../lib/ai/conversationIntelligence'
import { BehavioralAnalysisEngine } from '../../lib/ai/behavioralAnalysis'

// Import routes
import leadRoutes from '../../server/routes/leads'
import aiRoutes from '../../server/routes/ai'
import activityRoutes from '../../server/routes/activities'

describe('Lead AI Workflow E2E Tests', () => {
  let app: express.Application
  let prisma: PrismaClient
  let testOrganizationId: string
  let testUserId: string
  let testLeadId: string

  beforeAll(async () => {
    // Setup test app
    app = express()
    app.use(express.json())
    
    // Mock auth middleware
    app.use((req: any, res, next) => {
      req.user = {
        id: 'test-user-1',
        organizationId: 'test-org-1',
        role: 'sales_rep'
      }
      next()
    })

    // Setup routes
    app.use('/api/leads', leadRoutes)
    app.use('/api/ai', aiRoutes)
    app.use('/api/activities', activityRoutes)

    // Initialize database
    prisma = new PrismaClient()
    
    // Use test data from global setup
    testOrganizationId = 'test-org-1'
    testUserId = 'test-user-1'
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up any test leads created during tests
    await prisma.leadScore.deleteMany({
      where: { lead: { organizationId: testOrganizationId } }
    })
    await prisma.conversation.deleteMany({
      where: { lead: { organizationId: testOrganizationId } }
    })
    await prisma.activity.deleteMany({
      where: { lead: { organizationId: testOrganizationId } }
    })
    await prisma.lead.deleteMany({
      where: { 
        organizationId: testOrganizationId,
        id: { not: { in: ['test-lead-1', 'test-lead-2'] } }
      }
    })
  })

  describe('Complete Lead Lifecycle', () => {
    it('should handle complete lead workflow from creation to conversion', async () => {
      // Step 1: Create a new lead
      console.log('📝 Step 1: Creating new lead...')
      const createLeadResponse = await request(app)
        .post('/api/leads')
        .send({
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice.johnson@techcorp.com',
          company: 'TechCorp Solutions',
          title: 'VP of Engineering',
          phone: '+1555123456',
          industry: 'technology',
          source: 'website',
          website: 'https://techcorp.com'
        })
        .expect(201)

      testLeadId = createLeadResponse.body.id
      expect(createLeadResponse.body).toHaveProperty('firstName', 'Alice')
      expect(createLeadResponse.body).toHaveProperty('company', 'TechCorp Solutions')

      // Step 2: Initial AI scoring
      console.log('🧠 Step 2: Performing initial AI scoring...')
      const initialScoreResponse = await request(app)
        .post(`/api/ai/score/${testLeadId}`)
        .expect(200)

      expect(initialScoreResponse.body).toHaveProperty('score')
      expect(initialScoreResponse.body.score).toBeValidScore()
      expect(initialScoreResponse.body).toHaveProperty('confidence')
      expect(initialScoreResponse.body.confidence).toBeValidConfidence()

      const initialScore = initialScoreResponse.body.score

      // Step 3: Add first activity (email sent)
      console.log('📧 Step 3: Adding email activity...')
      const emailActivityResponse = await request(app)
        .post('/api/activities')
        .send({
          leadId: testLeadId,
          type: 'email_sent',
          subject: 'Welcome to our platform',
          description: 'Sent welcome email with product information',
          outcome: 'sent',
          scheduledAt: new Date().toISOString()
        })
        .expect(201)

      expect(emailActivityResponse.body).toHaveProperty('type', 'email_sent')

      // Step 4: Simulate email opened
      console.log('👀 Step 4: Updating email activity to opened...')
      await request(app)
        .put(`/api/activities/${emailActivityResponse.body.id}`)
        .send({
          outcome: 'opened',
          completedAt: new Date().toISOString()
        })
        .expect(200)

      // Step 5: Add conversation (lead responds)
      console.log('💬 Step 5: Adding inbound conversation...')
      const conversationResponse = await request(app)
        .post('/api/ai/analyze-conversation')
        .send({
          leadId: testLeadId,
          content: 'Hi, I received your email and I am very interested in your platform. Can you tell me more about pricing and implementation timeline? We have budget allocated for this quarter.',
          type: 'email'
        })
        .expect(200)

      expect(conversationResponse.body).toHaveProperty('sentiment')
      expect(conversationResponse.body.sentiment.overall).toBe('positive')
      expect(conversationResponse.body).toHaveProperty('buyingSignals')
      expect(conversationResponse.body.buyingSignals.length).toBeGreaterThan(0)

      // Verify buying signals detected
      const buyingSignals = conversationResponse.body.buyingSignals
      expect(buyingSignals.some((signal: any) => signal.type === 'budget_mentioned')).toBe(true)
      expect(buyingSignals.some((signal: any) => signal.type === 'timeline_discussed')).toBe(true)

      // Step 6: Re-score lead after conversation
      console.log('🔄 Step 6: Re-scoring lead after conversation...')
      const updatedScoreResponse = await request(app)
        .post(`/api/ai/score/${testLeadId}`)
        .expect(200)

      const updatedScore = updatedScoreResponse.body.score
      expect(updatedScore).toBeGreaterThan(initialScore) // Score should improve after positive conversation

      // Step 7: Get behavioral analysis
      console.log('📊 Step 7: Getting behavioral analysis...')
      const behaviorResponse = await request(app)
        .get(`/api/ai/behavior/${testLeadId}`)
        .expect(200)

      expect(behaviorResponse.body).toHaveProperty('currentStage')
      expect(behaviorResponse.body).toHaveProperty('engagementScore')
      expect(behaviorResponse.body).toHaveProperty('predictedPath')
      expect(behaviorResponse.body.engagementScore).toBeGreaterThan(0)

      // Step 8: Get AI recommendations
      console.log('💡 Step 8: Getting AI recommendations...')
      const recommendationsResponse = await request(app)
        .get(`/api/ai/recommendations/${testLeadId}`)
        .expect(200)

      expect(recommendationsResponse.body).toHaveProperty('content')
      expect(recommendationsResponse.body).toHaveProperty('timing')
      expect(recommendationsResponse.body).toHaveProperty('channels')
      expect(Array.isArray(recommendationsResponse.body.content)).toBe(true)

      // Step 9: Schedule demo (following AI recommendation)
      console.log('🎯 Step 9: Scheduling demo based on AI recommendation...')
      const demoActivityResponse = await request(app)
        .post('/api/activities')
        .send({
          leadId: testLeadId,
          type: 'demo_scheduled',
          subject: 'Product Demo',
          description: 'Scheduled product demo for next week',
          scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next week
        })
        .expect(201)

      // Step 10: Complete demo with positive outcome
      console.log('✅ Step 10: Completing demo with positive outcome...')
      await request(app)
        .put(`/api/activities/${demoActivityResponse.body.id}`)
        .send({
          outcome: 'positive',
          completedAt: new Date().toISOString(),
          durationMinutes: 45,
          sentimentScore: 0.9,
          intentDetected: 'purchase',
          buyingSignals: ['decision_maker_involved', 'timeline_discussed']
        })
        .expect(200)

      // Step 11: Add post-demo conversation
      console.log('🗣️ Step 11: Adding post-demo conversation...')
      const postDemoConversationResponse = await request(app)
        .post('/api/ai/analyze-conversation')
        .send({
          leadId: testLeadId,
          content: 'The demo was excellent! Our team is very impressed. We would like to move forward with implementation. Can you send us a proposal? We need to have this implemented by end of quarter.',
          type: 'email'
        })
        .expect(200)

      expect(postDemoConversationResponse.body.sentiment.overall).toBe('positive')
      expect(postDemoConversationResponse.body.intent.primaryIntent).toBe('purchase')

      // Step 12: Final scoring after demo
      console.log('🏆 Step 12: Final scoring after demo...')
      const finalScoreResponse = await request(app)
        .post(`/api/ai/score/${testLeadId}`)
        .expect(200)

      const finalScore = finalScoreResponse.body.score
      expect(finalScore).toBeGreaterThan(updatedScore) // Score should be highest after demo
      expect(finalScore).toBeGreaterThan(80) // Should be high-quality lead

      // Step 13: Get comprehensive AI insights
      console.log('🔍 Step 13: Getting comprehensive AI insights...')
      const insightsResponse = await request(app)
        .get(`/api/ai/insights/${testLeadId}`)
        .expect(200)

      expect(insightsResponse.body).toHaveProperty('summary')
      expect(insightsResponse.body.summary.overallScore).toBe(finalScore)
      expect(insightsResponse.body.summary.nextBestActions).toContain('Send contract')

      // Step 14: Verify lead progression
      console.log('📈 Step 14: Verifying lead progression...')
      const leadResponse = await request(app)
        .get(`/api/leads/${testLeadId}`)
        .expect(200)

      expect(leadResponse.body.currentScore).toBe(finalScore)
      expect(leadResponse.body.currentScore).toBeGreaterThan(initialScore)

      // Verify activities were recorded
      expect(leadResponse.body.activities.length).toBeGreaterThanOrEqual(3)
      
      // Verify conversations were analyzed
      expect(leadResponse.body.conversations.length).toBeGreaterThanOrEqual(2)

      console.log('🎉 Complete workflow test passed!')
      console.log(`Initial Score: ${initialScore} → Final Score: ${finalScore}`)
    }, 60000) // 60 second timeout for complete workflow

    it('should handle lead with negative sentiment and provide appropriate recommendations', async () => {
      // Create lead with negative interaction
      const createLeadResponse = await request(app)
        .post('/api/leads')
        .send({
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob.wilson@example.com',
          company: 'Example Inc',
          title: 'IT Manager',
          industry: 'technology',
          source: 'cold_call'
        })
        .expect(201)

      const leadId = createLeadResponse.body.id

      // Add negative conversation
      const negativeConversationResponse = await request(app)
        .post('/api/ai/analyze-conversation')
        .send({
          leadId,
          content: 'I am not interested in your product. It seems too expensive and complicated. We are happy with our current solution.',
          type: 'phone'
        })
        .expect(200)

      expect(negativeConversationResponse.body.sentiment.overall).toBe('negative')
      expect(negativeConversationResponse.body.riskFlags.length).toBeGreaterThan(0)

      // Score should be lower due to negative sentiment
      const scoreResponse = await request(app)
        .post(`/api/ai/score/${leadId}`)
        .expect(200)

      expect(scoreResponse.body.score).toBeLessThan(50) // Should be low score

      // Recommendations should focus on addressing concerns
      const recommendationsResponse = await request(app)
        .get(`/api/ai/recommendations/${leadId}`)
        .expect(200)

      expect(recommendationsResponse.body.content).toContain('Educational content')
    })

    it('should handle high-velocity lead progression', async () => {
      // Create lead
      const createLeadResponse = await request(app)
        .post('/api/leads')
        .send({
          firstName: 'Carol',
          lastName: 'Davis',
          email: 'carol.davis@fastcorp.com',
          company: 'FastCorp',
          title: 'CEO',
          industry: 'technology',
          source: 'referral'
        })
        .expect(201)

      const leadId = createLeadResponse.body.id

      // Rapid sequence of high-intent activities
      const activities = [
        {
          type: 'website_visit',
          subject: 'Pricing page visit',
          outcome: 'engaged'
        },
        {
          type: 'content_downloaded',
          subject: 'ROI Calculator download',
          outcome: 'completed'
        },
        {
          type: 'demo_requested',
          subject: 'Demo request',
          outcome: 'scheduled'
        }
      ]

      // Add activities in quick succession
      for (const activity of activities) {
        await request(app)
          .post('/api/activities')
          .send({
            leadId,
            ...activity,
            completedAt: new Date().toISOString()
          })
          .expect(201)
      }

      // Add high-intent conversation
      await request(app)
        .post('/api/ai/analyze-conversation')
        .send({
          leadId,
          content: 'We need to implement a solution urgently. Budget is approved for $100k. When can we start?',
          type: 'email'
        })
        .expect(200)

      // Behavioral analysis should detect high velocity
      const behaviorResponse = await request(app)
        .get(`/api/ai/behavior/${leadId}`)
        .expect(200)

      expect(behaviorResponse.body.velocityScore).toBeGreaterThan(70)
      expect(behaviorResponse.body.patterns.some((p: any) => p.type === 'high_intent')).toBe(true)

      // Score should be very high
      const scoreResponse = await request(app)
        .post(`/api/ai/score/${leadId}`)
        .expect(200)

      expect(scoreResponse.body.score).toBeGreaterThan(85)
    })
  })

  describe('AI Engine Integration', () => {
    it('should maintain consistency across all AI engines', async () => {
      const leadId = 'test-lead-1' // Use existing test lead

      // Get insights from all engines
      const [scoringResult, behaviorResult, conversationResult] = await Promise.all([
        request(app).post(`/api/ai/score/${leadId}`),
        request(app).get(`/api/ai/behavior/${leadId}`),
        request(app).get(`/api/ai/insights/${leadId}`)
      ])

      // All should succeed
      expect(scoringResult.status).toBe(200)
      expect(behaviorResult.status).toBe(200)
      expect(conversationResult.status).toBe(200)

      // Scores should be consistent
      const scoringScore = scoringResult.body.score
      const insightsScore = conversationResult.body.summary.overallScore
      expect(Math.abs(scoringScore - insightsScore)).toBeLessThan(5) // Within 5 points

      // Recommendations should be aligned
      const scoringRecommendations = scoringResult.body.recommendations
      const behaviorRecommendations = behaviorResult.body.recommendations
      const insightsActions = conversationResult.body.summary.nextBestActions

      expect(scoringRecommendations.length).toBeGreaterThan(0)
      expect(behaviorRecommendations.length).toBeGreaterThan(0)
      expect(insightsActions.length).toBeGreaterThan(0)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent lead processing', async () => {
      const leadPromises = Array(5).fill(null).map(async (_, index) => {
        const response = await request(app)
          .post('/api/leads')
          .send({
            firstName: `Test${index}`,
            lastName: 'User',
            email: `test${index}@concurrent.com`,
            company: `Company ${index}`,
            title: 'Manager',
            industry: 'technology',
            source: 'website'
          })

        const leadId = response.body.id

        // Process each lead through AI pipeline
        await Promise.all([
          request(app).post(`/api/ai/score/${leadId}`),
          request(app).post('/api/ai/analyze-conversation').send({
            leadId,
            content: `Hello, I am interested in your product. This is test message ${index}.`,
            type: 'email'
          })
        ])

        return leadId
      })

      const leadIds = await Promise.all(leadPromises)
      expect(leadIds.length).toBe(5)

      // Verify all leads were processed correctly
      const insightPromises = leadIds.map(leadId =>
        request(app).get(`/api/ai/insights/${leadId}`)
      )

      const insights = await Promise.all(insightPromises)
      insights.forEach(insight => {
        expect(insight.status).toBe(200)
        expect(insight.body.summary.overallScore).toBeValidScore()
      })
    }, 30000)
  })
})
