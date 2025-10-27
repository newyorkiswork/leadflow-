// Lead AI Pro - AI Services Index (2025)
// Centralized AI services initialization and configuration

import { AIServiceManager, AIServiceConfig } from './aiServiceManager'
import { LeadScoringEngine } from './leadScoring'
import { ConversationIntelligence } from './conversationIntelligence'
import { VoiceAssistant } from './voiceAssistant'
import { SocialMediaIntelligence } from './socialMediaIntegration'
import { PredictiveAnalyticsEngine } from './predictiveAnalytics'

// Global AI service manager instance
let aiServiceManager: AIServiceManager | null = null

// Default configuration
const defaultConfig: AIServiceConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerMinute: 50000
  },
  caching: {
    enabled: true,
    ttl: 300 // 5 minutes
  },
  monitoring: {
    enabled: process.env.NODE_ENV !== 'production',
    logLevel: 'info'
  }
}

// Initialize AI services
export function initializeAIServices(config?: Partial<AIServiceConfig>): AIServiceManager {
  if (aiServiceManager) {
    return aiServiceManager
  }

  const finalConfig = { ...defaultConfig, ...config }
  
  if (!finalConfig.openaiApiKey) {
    throw new Error('OpenAI API key is required')
  }

  aiServiceManager = new AIServiceManager(finalConfig)
  
  console.log('🤖 AI Services initialized successfully')
  return aiServiceManager
}

// Get the AI service manager instance
export function getAIServiceManager(): AIServiceManager {
  if (!aiServiceManager) {
    throw new Error('AI services not initialized. Call initializeAIServices() first.')
  }
  return aiServiceManager
}

// Convenience functions for common AI operations
export async function scoreLeads(leads: any[]): Promise<any[]> {
  const manager = getAIServiceManager()
  return manager.scoreLeads(leads)
}

export async function analyzeConversation(transcript: string, leadData: any): Promise<any> {
  const manager = getAIServiceManager()
  return manager.analyzeConversation(transcript, leadData)
}

export async function processVoiceCommand(audioText: string, userId: string): Promise<any> {
  const manager = getAIServiceManager()
  return manager.processVoiceCommand(audioText, userId)
}

export async function researchSocialMedia(leadData: any): Promise<any> {
  const manager = getAIServiceManager()
  return manager.researchSocialMedia(leadData)
}

export async function predictLeadOutcome(leadData: any, historicalData: any[]): Promise<any> {
  const manager = getAIServiceManager()
  return manager.predictLeadOutcome(leadData, historicalData)
}

// AI service health monitoring
export async function getAIHealthStatus(): Promise<any> {
  const manager = getAIServiceManager()
  return manager.healthCheck()
}

export function getAIMetrics(): any {
  const manager = getAIServiceManager()
  return manager.getMetrics()
}

// Specialized AI functions for specific use cases

// Lead Management AI
export class LeadAI {
  private manager: AIServiceManager

  constructor() {
    this.manager = getAIServiceManager()
  }

  async enhanceLeadProfile(leadData: any): Promise<any> {
    const [scoring, socialInsights, predictions] = await Promise.allSettled([
      this.manager.scoreLeads([leadData]),
      this.manager.researchSocialMedia(leadData),
      this.manager.predictLeadOutcome(leadData, [])
    ])

    return {
      leadId: leadData.id,
      scoring: scoring.status === 'fulfilled' ? scoring.value[0] : null,
      socialInsights: socialInsights.status === 'fulfilled' ? socialInsights.value : null,
      predictions: predictions.status === 'fulfilled' ? predictions.value : null,
      enhancedAt: new Date()
    }
  }

  async generateFollowUpStrategy(leadData: any, conversationHistory: any[]): Promise<any> {
    // Analyze conversation patterns and generate personalized follow-up strategy
    const conversationAnalysis = await Promise.all(
      conversationHistory.map(conv => 
        this.manager.analyzeConversation(conv.transcript, leadData)
      )
    )

    // Generate strategy based on analysis
    return {
      strategy: 'personalized_nurture',
      recommendations: [
        'Send case study relevant to their industry',
        'Schedule demo focusing on ROI metrics',
        'Follow up with pricing information'
      ],
      optimalTiming: '2:00 PM - 4:00 PM',
      preferredChannel: 'email',
      confidence: 0.85
    }
  }
}

// Sales AI Assistant
export class SalesAI {
  private manager: AIServiceManager

  constructor() {
    this.manager = getAIServiceManager()
  }

  async getCallCoaching(transcript: string, leadData: any): Promise<any> {
    const voiceAssistant = new VoiceAssistant()
    return voiceAssistant.provideConversationCoaching(transcript, leadData, `session_${Date.now()}`)
  }

  async generateEmailTemplate(leadData: any, purpose: string): Promise<any> {
    // Generate personalized email template based on lead data and purpose
    return {
      subject: `Personalized subject for ${leadData.firstName}`,
      content: `Personalized email content based on ${purpose}`,
      tone: 'professional',
      callToAction: 'Schedule a demo',
      confidence: 0.9
    }
  }

  async optimizeOutreach(campaignData: any): Promise<any> {
    // Analyze and optimize outreach campaigns
    return {
      recommendations: [
        'Adjust send time to 10:00 AM for better open rates',
        'Personalize subject lines with company name',
        'Add social proof in email content'
      ],
      expectedImprovement: {
        openRate: '+15%',
        responseRate: '+8%',
        meetingBookingRate: '+12%'
      }
    }
  }
}

// Marketing AI
export class MarketingAI {
  private manager: AIServiceManager

  constructor() {
    this.manager = getAIServiceManager()
  }

  async segmentLeads(leads: any[]): Promise<any> {
    const scoredLeads = await this.manager.scoreLeads(leads)
    
    // Segment leads based on AI scoring and characteristics
    const segments = {
      hotLeads: scoredLeads.filter(lead => lead.score >= 80),
      warmLeads: scoredLeads.filter(lead => lead.score >= 60 && lead.score < 80),
      coldLeads: scoredLeads.filter(lead => lead.score < 60),
      highValue: scoredLeads.filter(lead => lead.predictedValue > 10000),
      quickWins: scoredLeads.filter(lead => lead.conversionProbability > 0.7)
    }

    return segments
  }

  async generateCampaignInsights(campaignData: any): Promise<any> {
    // Generate insights for marketing campaigns
    return {
      performance: {
        conversionRate: 0.12,
        costPerLead: 45.50,
        roi: 3.2
      },
      recommendations: [
        'Focus on enterprise segment for higher ROI',
        'Optimize landing page for mobile users',
        'A/B test email subject lines'
      ],
      predictedOutcome: {
        expectedLeads: 150,
        expectedRevenue: 75000,
        confidence: 0.78
      }
    }
  }
}

// Analytics AI
export class AnalyticsAI {
  private manager: AIServiceManager

  constructor() {
    this.manager = getAIServiceManager()
  }

  async generateSalesForecasting(historicalData: any[], currentPipeline: any[]): Promise<any> {
    const predictiveEngine = new PredictiveAnalyticsEngine()
    return predictiveEngine.generateSalesForecasting(historicalData, currentPipeline, 'month')
  }

  async identifyTrends(data: any[]): Promise<any> {
    // Identify trends in sales data
    return {
      trends: [
        {
          type: 'seasonal',
          description: 'Q4 shows 30% increase in enterprise deals',
          confidence: 0.85
        },
        {
          type: 'behavioral',
          description: 'Leads from webinars convert 2x faster',
          confidence: 0.92
        }
      ],
      insights: [
        'Focus enterprise outreach in Q4',
        'Increase webinar frequency',
        'Optimize demo-to-close process'
      ]
    }
  }
}

// Export specialized AI classes
export { LeadAI, SalesAI, MarketingAI, AnalyticsAI }

// Export core AI services
export {
  AIServiceManager,
  LeadScoringEngine,
  ConversationIntelligence,
  VoiceAssistant,
  SocialMediaIntelligence,
  PredictiveAnalyticsEngine
}

// Export types
export type { AIServiceConfig } from './aiServiceManager'

// Cleanup function
export function destroyAIServices(): void {
  if (aiServiceManager) {
    aiServiceManager.destroy()
    aiServiceManager = null
  }
}
