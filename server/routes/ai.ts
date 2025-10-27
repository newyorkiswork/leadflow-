// LeadAI Pro - AI Routes
// AI-powered features and insights

import express from 'express'
import { requireSubscriptionTier } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { prisma } from '../../lib/database'
import { AdvancedLeadScoringEngine } from '../../lib/ai/leadScoring'
import { ConversationIntelligenceEngine } from '../../lib/ai/conversationIntelligence'
import { BehavioralAnalysisEngine } from '../../lib/ai/behavioralAnalysis'
import { IntelligentRoutingEngine } from '../../lib/ai/routingEngine'
import { NextGenAIEngine } from '../../lib/ai/nextGenAI'

const router = express.Router()

// Initialize AI engines
const scoringEngine = new AdvancedLeadScoringEngine()
const conversationEngine = new ConversationIntelligenceEngine()
const behavioralEngine = new BehavioralAnalysisEngine()
const routingEngine = new IntelligentRoutingEngine()
const nextGenEngine = new NextGenAIEngine()

// Get AI insights for a lead
router.get('/insights/:leadId', asyncHandler(async (req, res) => {
  const { leadId } = req.params

  // Get lead with related data
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 50
      },
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 20
      },
      scores: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' })
  }

  // Generate comprehensive AI insights
  const [scoringResult, behavioralInsights] = await Promise.all([
    scoringEngine.calculateScore({
      lead,
      activities: lead.activities,
      conversations: lead.conversations
    }),
    behavioralEngine.analyzeLeadBehavior({
      lead,
      activities: lead.activities,
      conversations: lead.conversations
    })
  ])

  // Analyze recent conversations
  const conversationInsights = await Promise.all(
    lead.conversations.slice(0, 5).map(conv =>
      conversationEngine.analyzeConversation(conv)
    )
  )

  res.json({
    leadId,
    scoring: scoringResult,
    behavioral: behavioralInsights,
    conversations: conversationInsights,
    summary: {
      overallScore: scoringResult.score,
      confidence: scoringResult.confidence,
      currentStage: behavioralInsights.currentStage.current,
      nextBestActions: scoringResult.nextBestActions,
      riskFactors: [...scoringResult.riskFactors, ...behavioralInsights.anomalies]
    }
  })
}))

// Trigger lead scoring
router.post('/score/:leadId', asyncHandler(async (req, res) => {
  const { leadId } = req.params

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      activities: true,
      conversations: true
    }
  })

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' })
  }

  const scoringResult = await scoringEngine.calculateScore({
    lead,
    activities: lead.activities,
    conversations: lead.conversations
  })

  // Update lead score in database
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      currentScore: scoringResult.score,
      scoreConfidence: scoringResult.confidence,
      lastScoredAt: new Date()
    }
  })

  // Create score history record
  await prisma.leadScore.create({
    data: {
      leadId,
      score: scoringResult.score,
      confidence: scoringResult.confidence,
      factors: scoringResult.factors as any,
      explanation: scoringResult.explanation,
      recommendations: scoringResult.recommendations
    }
  })

  res.json(scoringResult)
}))

// Analyze conversation
router.post('/analyze-conversation', requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { conversationId, content, type, leadId } = req.body

  if (!content) {
    return res.status(400).json({ error: 'Conversation content is required' })
  }

  // Create or get conversation record
  let conversation
  if (conversationId) {
    conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    })
  } else {
    conversation = await prisma.conversation.create({
      data: {
        leadId,
        content,
        direction: 'inbound',
        channel: type || 'email'
      }
    })
  }

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' })
  }

  const analysis = await conversationEngine.analyzeConversation(conversation)

  // Update conversation with analysis results
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      sentiment: analysis.sentiment as any,
      intent: analysis.intent as any,
      topics: analysis.topics.mainTopics,
      entities: analysis.topics.entities as any,
      analyzedAt: new Date()
    }
  })

  res.json(analysis)
}))

// Behavioral analysis
router.get('/behavior/:leadId', asyncHandler(async (req, res) => {
  const { leadId } = req.params

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' }
      },
      conversations: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' })
  }

  const behavioralInsights = await behavioralEngine.analyzeLeadBehavior({
    lead,
    activities: lead.activities,
    conversations: lead.conversations
  })

  res.json(behavioralInsights)
}))

// Intelligent routing
router.post('/route-lead', requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { leadId, criteria } = req.body

  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  })

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' })
  }

  // Get available sales reps (mock data for now)
  const availableReps = await prisma.user.findMany({
    where: {
      role: 'sales_rep',
      organizationId: lead.organizationId
    }
  })

  // Convert to SalesRepProfile format (simplified)
  const repProfiles = availableReps.map(user => ({
    user,
    expertise: ['general'], // Would come from user profile
    performance: {
      conversionRate: 0.25,
      averageDealSize: 50000,
      responseTime: 4,
      customerSatisfaction: 0.85
    },
    workload: {
      currentLeads: 15,
      capacity: 25,
      availability: 'available' as const
    },
    preferences: {
      industries: ['technology'],
      leadSources: ['website'],
      dealSizes: ['medium']
    }
  }))

  const routingRecommendation = await routingEngine.findOptimalAssignment(
    lead,
    repProfiles,
    criteria || {}
  )

  res.json(routingRecommendation)
}))

// Get content recommendations
router.get('/recommendations/:leadId', asyncHandler(async (req, res) => {
  const { leadId } = req.params

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      activities: true,
      conversations: true
    }
  })

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' })
  }

  // Get behavioral insights to inform recommendations
  const behavioralInsights = await behavioralEngine.analyzeLeadBehavior({
    lead,
    activities: lead.activities,
    conversations: lead.conversations
  })

  // Generate content recommendations based on stage and behavior
  const recommendations = {
    content: this.generateContentRecommendations(behavioralInsights.currentStage.current),
    timing: this.getOptimalContactTiming(lead, behavioralInsights),
    channels: this.recommendChannels(lead, behavioralInsights),
    messaging: this.generateMessaging(behavioralInsights)
  }

  res.json(recommendations)
}))

// Predictive forecasting
router.get('/forecast', requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { organizationId } = req.user as any
  const { timeframe = '30d' } = req.query

  // Get leads for forecasting
  const leads = await prisma.lead.findMany({
    where: { organizationId },
    include: {
      activities: true,
      conversations: true
    }
  })

  // Simple forecasting logic (would be more sophisticated in production)
  const forecast = {
    period: timeframe,
    predictions: {
      expectedDeals: Math.floor(leads.length * 0.25),
      expectedRevenue: leads.reduce((sum, lead) =>
        sum + (lead.predictedValue?.toNumber() || 0) * 0.25, 0
      ),
      confidence: 0.75
    },
    breakdown: {
      byStage: this.forecastByStage(leads),
      byRep: this.forecastByRep(leads),
      bySource: this.forecastBySource(leads)
    }
  }

  res.json(forecast)
}))

// Helper methods (would be moved to separate service)
function generateContentRecommendations(stage: string) {
  const contentMap = {
    awareness: ['Blog posts', 'Industry reports', 'Educational webinars'],
    interest: ['Product demos', 'Case studies', 'Comparison guides'],
    consideration: ['ROI calculators', 'Implementation guides', 'Customer testimonials'],
    intent: ['Pricing information', 'Proposal templates', 'Contract terms'],
    evaluation: ['Technical documentation', 'Security certifications', 'Reference calls'],
    purchase: ['Onboarding materials', 'Implementation timeline', 'Success metrics']
  }

  return contentMap[stage] || contentMap.awareness
}

function getOptimalContactTiming(lead: any, insights: any) {
  return {
    bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
    bestTimes: ['10:00 AM', '2:00 PM', '4:00 PM'],
    timezone: lead.timezone || 'UTC',
    frequency: insights.engagementScore > 70 ? 'high' : 'medium'
  }
}

function recommendChannels(lead: any, insights: any) {
  const channels = ['email']

  if (insights.engagementScore > 60) channels.push('phone')
  if (lead.source === 'linkedin') channels.push('linkedin')
  if (insights.currentStage.current === 'intent') channels.push('video_call')

  return channels
}

function generateMessaging(insights: any) {
  return {
    tone: insights.currentStage.current === 'awareness' ? 'educational' : 'consultative',
    focus: insights.patterns.some((p: any) => p.type === 'high_intent') ? 'value_proposition' : 'problem_solving',
    urgency: insights.predictedPath.timeToNextStage < 7 ? 'high' : 'medium'
  }
}

function forecastByStage(leads: any[]) {
  const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation']
  return stages.map(stage => ({
    stage,
    count: leads.filter(l => l.status === stage).length,
    expectedConversions: Math.floor(leads.filter(l => l.status === stage).length * 0.3)
  }))
}

function forecastByRep(leads: any[]) {
  const repMap = new Map()
  leads.forEach(lead => {
    const repId = lead.assignedTo || 'unassigned'
    if (!repMap.has(repId)) {
      repMap.set(repId, { leads: 0, expectedRevenue: 0 })
    }
    const rep = repMap.get(repId)
    rep.leads++
    rep.expectedRevenue += (lead.predictedValue?.toNumber() || 0) * 0.25
  })

  return Array.from(repMap.entries()).map(([repId, data]) => ({
    repId,
    ...data
  }))
}

function forecastBySource(leads: any[]) {
  const sourceMap = new Map()
  leads.forEach(lead => {
    const source = lead.source || 'unknown'
    if (!sourceMap.has(source)) {
      sourceMap.set(source, { leads: 0, conversionRate: 0.25 })
    }
    sourceMap.get(source).leads++
  })

  return Array.from(sourceMap.entries()).map(([source, data]) => ({
    source,
    ...data,
    expectedConversions: Math.floor(data.leads * data.conversionRate)
  }))
}

// 2025 Advanced AI Endpoints

// Autonomous AI Agents
router.post('/agents', requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { organizationId } = req.user as any
  const { name, role, autonomyLevel, capabilities } = req.body

  const agent = await nextGenEngine.createAutonomousAgent({
    name,
    role,
    autonomyLevel,
    capabilities
  })

  // Save to database
  const savedAgent = await prisma.autonomousAgent.create({
    data: {
      organizationId,
      name: agent.name,
      agentType: role,
      autonomyLevel: agent.autonomyLevel,
      capabilities: agent.capabilities,
      learningModel: agent.learningModel,
      performance: agent.performance
    }
  })

  res.json(savedAgent)
}))

// Get autonomous agents
router.get('/agents', asyncHandler(async (req, res) => {
  const { organizationId } = req.user as any

  const agents = await prisma.autonomousAgent.findMany({
    where: { organizationId },
    include: {
      actions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  res.json(agents)
}))

// Quantum predictions
router.get('/quantum-predictions/:leadId', requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { leadId } = req.params
  const { timeframe = '30d' } = req.query

  const predictions = await nextGenEngine.generateQuantumPredictions(leadId, timeframe as string)

  // Save predictions to database
  await Promise.all(predictions.map(prediction =>
    prisma.quantumPrediction.create({
      data: {
        leadId,
        scenario: prediction.scenario,
        probability: prediction.probability,
        uncertainty: prediction.uncertainty,
        timeDecay: prediction.timeDecay,
        quantumStates: prediction.quantumStates,
        entanglements: prediction.entanglements,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    })
  ))

  res.json(predictions)
}))

// Emotional intelligence analysis
router.get('/emotional-intelligence/:leadId', asyncHandler(async (req, res) => {
  const { leadId } = req.params

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  })

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' })
  }

  const emotionalIntelligence = await nextGenEngine.analyzeEmotionalIntelligence(lead.conversations)

  // Save or update emotional profile
  await prisma.emotionalProfile.upsert({
    where: { leadId },
    create: {
      leadId,
      sentiment: emotionalIntelligence.sentiment,
      emotions: emotionalIntelligence.emotions,
      personality: emotionalIntelligence.personality,
      communicationStyle: emotionalIntelligence.communicationStyle,
      preferredApproach: emotionalIntelligence.preferredApproach,
      confidence: 0.85,
      lastAnalyzedAt: new Date()
    },
    update: {
      sentiment: emotionalIntelligence.sentiment,
      emotions: emotionalIntelligence.emotions,
      personality: emotionalIntelligence.personality,
      communicationStyle: emotionalIntelligence.communicationStyle,
      preferredApproach: emotionalIntelligence.preferredApproach,
      lastAnalyzedAt: new Date()
    }
  })

  res.json(emotionalIntelligence)
}))

// Autonomous deal management
router.post('/autonomous-management/:agentId', requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { agentId } = req.params

  const actions = await nextGenEngine.manageDealsAutonomously(agentId)

  // Save actions to database
  await Promise.all(actions.map(action =>
    prisma.autonomousAction.create({
      data: {
        agentId,
        leadId: action.leadId,
        actionType: action.type,
        description: action.description,
        executed: action.executed,
        requiresApproval: action.requiresApproval,
        result: action.result,
        executedAt: action.executed ? new Date() : null
      }
    })
  ))

  res.json(actions)
}))

// Market intelligence
router.get('/market-intelligence', requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { organizationId } = req.user as any

  const intelligence = await nextGenEngine.generateMarketIntelligence()

  // Save to database
  await prisma.marketIntelligence.create({
    data: {
      organizationId,
      competitorAnalysis: intelligence.competitorAnalysis,
      industryTrends: intelligence.industryTrends,
      economicFactors: intelligence.economicFactors,
      technologyShifts: intelligence.technologyShifts,
      regulatoryLandscape: intelligence.regulatoryLandscape,
      recommendations: intelligence.recommendations,
      confidence: 0.8,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  })

  res.json(intelligence)
}))

// Customer lifetime value prediction
router.get('/clv-prediction/:leadId', asyncHandler(async (req, res) => {
  const { leadId } = req.params

  const clvPrediction = await nextGenEngine.predictCustomerLifetimeValue(leadId)

  res.json(clvPrediction)
}))

// Intelligent response generation
router.post('/intelligent-response', asyncHandler(async (req, res) => {
  const { conversationId, context } = req.body

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  })

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' })
  }

  const response = await nextGenEngine.generateIntelligentResponse(conversation, context)

  res.json(response)
}))

// VOICE ASSISTANT ROUTES

// Process voice command
router.post('/voice/command', requireAuth, asyncHandler(async (req, res) => {
  const { audioText, userId } = req.body

  try {
    const { VoiceAssistant } = await import('../../lib/ai/voiceAssistant')
    const voiceAssistant = new VoiceAssistant()

    const command = await voiceAssistant.processVoiceCommand(audioText, userId)
    const result = await voiceAssistant.executeVoiceCommand(command)

    // Log voice command usage
    await prisma.journeyEvent.create({
      data: {
        leadId: command.entities.leadId || 'system',
        eventType: 'voice_command',
        eventName: 'Voice Command Executed',
        description: `Voice command: ${command.intent}`,
        properties: {
          command: command.command,
          intent: command.intent,
          entities: command.entities,
          confidence: command.confidence,
          result: result
        }
      }
    })

    res.json({
      command,
      result,
      success: result.success
    })
  } catch (error) {
    console.error('Voice command processing failed:', error)
    res.status(500).json({ error: 'Failed to process voice command' })
  }
}))

// Real-time conversation coaching
router.post('/voice/coaching', requireAuth, requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { transcript, leadId, sessionId } = req.body

  try {
    const { VoiceAssistant } = await import('../../lib/ai/voiceAssistant')
    const voiceAssistant = new VoiceAssistant()

    // Get lead data
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        activities: true,
        aiInsights: true
      }
    })

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    const coaching = await voiceAssistant.provideConversationCoaching(
      transcript,
      lead,
      sessionId
    )

    // Save coaching session
    await prisma.aiInsight.create({
      data: {
        leadId,
        insightType: 'conversation_coaching',
        title: 'Real-time Conversation Coaching',
        description: `Coaching session for call with ${lead.firstName} ${lead.lastName}`,
        confidence: coaching.coachingScore / 10,
        priority: coaching.coachingScore < 5 ? 'high' : 'medium',
        data: {
          coaching: coaching,
          sessionId: sessionId
        }
      }
    })

    res.json(coaching)
  } catch (error) {
    console.error('Conversation coaching failed:', error)
    res.status(500).json({ error: 'Failed to provide conversation coaching' })
  }
}))

// SOCIAL MEDIA INTELLIGENCE ROUTES

// Research lead on social media
router.post('/social/research-lead', requireAuth, requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { leadId } = req.body

  try {
    const { SocialMediaIntelligence } = await import('../../lib/ai/socialMediaIntegration')
    const socialIntelligence = new SocialMediaIntelligence()

    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    const socialInsight = await socialIntelligence.researchLead(lead)

    // Save social insights
    await prisma.aiInsight.create({
      data: {
        leadId,
        insightType: 'social_intelligence',
        title: 'Social Media Research',
        description: `Social media insights for ${lead.firstName} ${lead.lastName}`,
        confidence: 0.8,
        priority: 'medium',
        data: {
          socialInsight: socialInsight
        }
      }
    })

    res.json(socialInsight)
  } catch (error) {
    console.error('Social media research failed:', error)
    res.status(500).json({ error: 'Failed to research lead on social media' })
  }
}))

// PREDICTIVE ANALYTICS ROUTES

// Generate lead predictions
router.post('/analytics/predict-lead', requireAuth, requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { leadId } = req.body

  try {
    const { PredictiveAnalyticsEngine } = await import('../../lib/ai/predictiveAnalytics')
    const predictiveEngine = new PredictiveAnalyticsEngine()

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        activities: true,
        aiInsights: true
      }
    })

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    // Get historical data for similar leads
    const historicalData = await prisma.lead.findMany({
      where: {
        industry: lead.industry,
        status: 'converted'
      },
      take: 50,
      include: {
        activities: true
      }
    })

    const prediction = await predictiveEngine.predictLeadOutcome(lead, historicalData)

    // Save prediction
    await prisma.aiInsight.create({
      data: {
        leadId,
        insightType: 'lead_prediction',
        title: 'Lead Conversion Prediction',
        description: `${(prediction.prediction * 100).toFixed(1)}% conversion probability`,
        confidence: prediction.confidence,
        priority: prediction.prediction > 0.7 ? 'high' : 'medium',
        data: {
          prediction: prediction
        }
      }
    })

    res.json(prediction)
  } catch (error) {
    console.error('Lead prediction failed:', error)
    res.status(500).json({ error: 'Failed to generate lead prediction' })
  }
}))

export default router
