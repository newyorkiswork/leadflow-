// Lead AI Pro - Lead Generation & Outreach API Routes (2025)
// Advanced lead discovery, email marketing, calling, and response automation

import { Router } from 'express'
import { IntelligentLeadGenerator } from '../../lib/ai/leadGenerator'
import { AIEmailMarketingEngine } from '../../lib/ai/emailMarketing'
import { AICallingSystem } from '../../lib/ai/callingSystem'
import { IntelligentResponseAutomation } from '../../lib/ai/responseAutomation'
import { asyncHandler } from '../middleware/asyncHandler'
import { requireAuth, requireSubscriptionTier } from '../middleware/auth'
import { prisma } from '../../lib/database'

const router = Router()

// Initialize AI engines
const leadGenerator = new IntelligentLeadGenerator()
const emailEngine = new AIEmailMarketingEngine()
const callingSystem = new AICallingSystem()
const responseAutomation = new IntelligentResponseAutomation()

// LEAD GENERATION ROUTES

// Find prospects with AI
router.post('/prospects/search', requireAuth, requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { organizationId } = req.user as any
  const { criteria, limit = 50 } = req.body

  try {
    const searchResult = await leadGenerator.findProspects(criteria, limit)

    // Save search results to database
    await prisma.journeyEvent.create({
      data: {
        leadId: 'system',
        eventType: 'prospect_search',
        eventName: 'AI Prospect Search',
        description: `Found ${searchResult.prospects.length} prospects`,
        properties: {
          searchCriteria: criteria,
          totalFound: searchResult.totalFound,
          confidence: searchResult.confidence,
          sources: searchResult.sources
        }
      }
    })

    res.json(searchResult)
  } catch (error) {
    console.error('Prospect search failed:', error)
    res.status(500).json({ error: 'Failed to search for prospects' })
  }
}))

// Enrich prospect data
router.post('/prospects/:prospectId/enrich', requireAuth, asyncHandler(async (req, res) => {
  const { prospectId } = req.params
  const { prospectData } = req.body

  try {
    const enrichedProspect = await leadGenerator.enrichProspect(prospectData)
    
    res.json(enrichedProspect)
  } catch (error) {
    console.error('Prospect enrichment failed:', error)
    res.status(500).json({ error: 'Failed to enrich prospect data' })
  }
}))

// Batch enrich prospects
router.post('/prospects/batch-enrich', requireAuth, requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { prospects } = req.body

  try {
    const enrichedProspects = await leadGenerator.batchEnrichProspects(prospects)
    
    res.json({
      enriched: enrichedProspects.length,
      prospects: enrichedProspects
    })
  } catch (error) {
    console.error('Batch enrichment failed:', error)
    res.status(500).json({ error: 'Failed to enrich prospects' })
  }
}))

// Generate search suggestions
router.post('/prospects/search-suggestions', requireAuth, asyncHandler(async (req, res) => {
  const { currentCriteria } = req.body

  try {
    const suggestions = await leadGenerator.generateSearchSuggestions(currentCriteria)
    
    res.json(suggestions)
  } catch (error) {
    console.error('Search suggestions failed:', error)
    res.status(500).json({ error: 'Failed to generate search suggestions' })
  }
}))

// EMAIL MARKETING ROUTES

// Generate email template
router.post('/email/templates/generate', requireAuth, asyncHandler(async (req, res) => {
  const { purpose, targetAudience, tone, industry } = req.body

  try {
    const template = await emailEngine.generateEmailTemplate(purpose, targetAudience, tone, industry)
    
    // Save template to database
    await prisma.aiInsight.create({
      data: {
        leadId: 'system',
        insightType: 'email_template',
        title: template.name,
        description: `AI-generated email template for ${purpose}`,
        confidence: 0.85,
        priority: 'medium',
        data: {
          template: template,
          aiGenerated: true
        }
      }
    })

    res.json(template)
  } catch (error) {
    console.error('Email template generation failed:', error)
    res.status(500).json({ error: 'Failed to generate email template' })
  }
}))

// Create A/B test variants
router.post('/email/templates/:templateId/ab-variants', requireAuth, asyncHandler(async (req, res) => {
  const { templateId } = req.params
  const { testType, variantCount = 2 } = req.body

  try {
    // Get template from database
    const templateInsight = await prisma.aiInsight.findFirst({
      where: {
        insightType: 'email_template',
        data: {
          path: ['template', 'id'],
          equals: templateId
        }
      }
    })

    if (!templateInsight) {
      return res.status(404).json({ error: 'Template not found' })
    }

    const template = (templateInsight.data as any).template
    const variants = await emailEngine.createABTestVariants(template, testType, variantCount)
    
    res.json(variants)
  } catch (error) {
    console.error('A/B variant creation failed:', error)
    res.status(500).json({ error: 'Failed to create A/B test variants' })
  }
}))

// Send email campaign
router.post('/email/campaigns', requireAuth, requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { organizationId } = req.user as any
  const campaignData = req.body

  try {
    // Create campaign in database
    const campaign = await prisma.journeyEvent.create({
      data: {
        leadId: 'system',
        eventType: 'email_campaign',
        eventName: campaignData.name,
        description: `Email campaign with ${campaignData.recipients.length} recipients`,
        properties: {
          campaignData: campaignData,
          status: 'created'
        }
      }
    })

    // Send campaign
    await emailEngine.sendCampaign(campaignData)

    res.json({
      campaignId: campaign.id,
      status: 'sent',
      recipients: campaignData.recipients.length
    })
  } catch (error) {
    console.error('Email campaign failed:', error)
    res.status(500).json({ error: 'Failed to send email campaign' })
  }
}))

// Analyze campaign performance
router.get('/email/campaigns/:campaignId/analytics', requireAuth, asyncHandler(async (req, res) => {
  const { campaignId } = req.params

  try {
    const analytics = await emailEngine.analyzeCampaignPerformance(campaignId)
    
    res.json(analytics)
  } catch (error) {
    console.error('Campaign analytics failed:', error)
    res.status(500).json({ error: 'Failed to analyze campaign performance' })
  }
}))

// CALLING SYSTEM ROUTES

// Generate call script
router.post('/calling/scripts/generate', requireAuth, asyncHandler(async (req, res) => {
  const { purpose, targetAudience, product, tone } = req.body

  try {
    const script = await callingSystem.generateCallScript(purpose, targetAudience, product, tone)
    
    // Save script to database
    await prisma.aiInsight.create({
      data: {
        leadId: 'system',
        insightType: 'call_script',
        title: script.name,
        description: `AI-generated call script for ${purpose}`,
        confidence: 0.85,
        priority: 'medium',
        data: {
          script: script,
          aiGenerated: true
        }
      }
    })

    res.json(script)
  } catch (error) {
    console.error('Call script generation failed:', error)
    res.status(500).json({ error: 'Failed to generate call script' })
  }
}))

// Schedule call campaign
router.post('/calling/campaigns', requireAuth, requireSubscriptionTier('professional'), asyncHandler(async (req, res) => {
  const { organizationId } = req.user as any
  const campaignData = req.body

  try {
    // Create campaign in database
    const campaign = await prisma.journeyEvent.create({
      data: {
        leadId: 'system',
        eventType: 'call_campaign',
        eventName: campaignData.name,
        description: `Call campaign with ${campaignData.leads.length} leads`,
        properties: {
          campaignData: campaignData,
          status: 'scheduled'
        }
      }
    })

    // Schedule campaign
    await callingSystem.scheduleCallCampaign(campaignData)

    res.json({
      campaignId: campaign.id,
      status: 'scheduled',
      leads: campaignData.leads.length
    })
  } catch (error) {
    console.error('Call campaign scheduling failed:', error)
    res.status(500).json({ error: 'Failed to schedule call campaign' })
  }
}))

// Real-time call coaching
router.post('/calling/sessions/:sessionId/coaching', requireAuth, asyncHandler(async (req, res) => {
  const { sessionId } = req.params
  const { transcript, lastSpokenBy } = req.body

  try {
    // Get call session from database
    const session = await prisma.journeyEvent.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return res.status(404).json({ error: 'Call session not found' })
    }

    const callSession = (session.properties as any).callSession
    const coaching = await callingSystem.provideRealTimeCoaching(callSession, transcript, lastSpokenBy)
    
    res.json({ suggestions: coaching })
  } catch (error) {
    console.error('Real-time coaching failed:', error)
    res.status(500).json({ error: 'Failed to provide coaching' })
  }
}))

// Analyze call performance
router.get('/calling/campaigns/:campaignId/analytics', requireAuth, asyncHandler(async (req, res) => {
  const { campaignId } = req.params

  try {
    const analytics = await callingSystem.analyzeCampaignPerformance(campaignId)
    
    res.json(analytics)
  } catch (error) {
    console.error('Call analytics failed:', error)
    res.status(500).json({ error: 'Failed to analyze call performance' })
  }
}))

// RESPONSE AUTOMATION ROUTES

// Process incoming inquiry
router.post('/responses/inquiries', asyncHandler(async (req, res) => {
  const inquiryData = req.body

  try {
    // Classify inquiry
    const classifiedInquiry = await responseAutomation.classifyInquiry(inquiryData)
    
    // Save inquiry to database
    await prisma.journeyEvent.create({
      data: {
        leadId: classifiedInquiry.senderInfo.email || 'unknown',
        eventType: 'inquiry_received',
        eventName: 'Inquiry Received',
        description: `${classifiedInquiry.classification.type} inquiry from ${classifiedInquiry.source}`,
        properties: {
          inquiry: classifiedInquiry,
          classification: classifiedInquiry.classification,
          urgency: classifiedInquiry.urgency
        }
      }
    })

    // Get automation rules
    const rules = await getAutomationRules()
    
    // Process with automation
    const response = await responseAutomation.processInquiry(classifiedInquiry, rules)
    
    if (response) {
      // Save automated response
      await prisma.journeyEvent.create({
        data: {
          leadId: classifiedInquiry.senderInfo.email || 'unknown',
          eventType: 'automated_response',
          eventName: 'Automated Response Sent',
          description: `AI-generated response to ${classifiedInquiry.classification.type}`,
          properties: {
            response: response,
            inquiryId: classifiedInquiry.id
          }
        }
      })
    }

    res.json({
      inquiry: classifiedInquiry,
      response: response,
      automated: !!response
    })
  } catch (error) {
    console.error('Inquiry processing failed:', error)
    res.status(500).json({ error: 'Failed to process inquiry' })
  }
}))

// Generate automated response
router.post('/responses/generate', requireAuth, asyncHandler(async (req, res) => {
  const { inquiryId, templateId } = req.body

  try {
    // Get inquiry from database
    const inquiryEvent = await prisma.journeyEvent.findUnique({
      where: { id: inquiryId }
    })

    if (!inquiryEvent) {
      return res.status(404).json({ error: 'Inquiry not found' })
    }

    const inquiry = (inquiryEvent.properties as any).inquiry
    let template = undefined

    if (templateId) {
      // Get template from database
      const templateInsight = await prisma.aiInsight.findFirst({
        where: {
          insightType: 'response_template',
          data: {
            path: ['template', 'id'],
            equals: templateId
          }
        }
      })
      
      if (templateInsight) {
        template = (templateInsight.data as any).template
      }
    }

    const response = await responseAutomation.generateAutomatedResponse(inquiry, template)
    
    res.json(response)
  } catch (error) {
    console.error('Response generation failed:', error)
    res.status(500).json({ error: 'Failed to generate response' })
  }
}))

// Helper function to get automation rules
async function getAutomationRules(): Promise<any[]> {
  // This would fetch automation rules from database
  // For now, return default rules
  return [
    {
      id: 'rule_1',
      name: 'High Priority Inquiries',
      conditions: {
        urgency: ['high', 'critical'],
        inquiryType: ['demo_request', 'pricing_request']
      },
      actions: {
        responseTemplate: 'high_priority_template',
        assignTo: 'sales_team',
        delay: 0
      },
      isActive: true,
      priority: 10
    },
    {
      id: 'rule_2',
      name: 'General Inquiries',
      conditions: {
        urgency: ['low', 'medium']
      },
      actions: {
        responseTemplate: 'general_template',
        delay: 30
      },
      isActive: true,
      priority: 5
    }
  ]
}

export default router
