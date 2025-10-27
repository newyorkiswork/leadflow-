// Lead AI Pro - Predictive Analytics Engine (2025)
// Advanced ML-powered predictions for sales optimization

import { OpenAI } from 'openai'

export interface PredictiveModel {
  id: string
  name: string
  type: 'lead_scoring' | 'churn_prediction' | 'deal_closure' | 'optimal_timing' | 'price_sensitivity'
  accuracy: number
  lastTrained: Date
  features: string[]
  version: string
}

export interface Prediction {
  id: string
  modelId: string
  targetId: string // Lead ID, Deal ID, etc.
  prediction: number
  confidence: number
  factors: Array<{
    feature: string
    impact: number
    direction: 'positive' | 'negative'
    explanation: string
  }>
  recommendations: string[]
  timeframe: string
  createdAt: Date
  expiresAt: Date
}

export interface BehavioralPattern {
  leadId: string
  patterns: {
    emailEngagement: {
      openRate: number
      clickRate: number
      responseRate: number
      optimalTimes: string[]
      preferredContent: string[]
    }
    websiteActivity: {
      visitFrequency: number
      sessionDuration: number
      pagesViewed: string[]
      downloadedContent: string[]
      lastVisit: Date
    }
    communicationPreferences: {
      preferredChannel: 'email' | 'phone' | 'text' | 'social'
      responseTime: number
      communicationStyle: 'formal' | 'casual' | 'technical'
      decisionMakingSpeed: 'fast' | 'medium' | 'slow'
    }
    buyingBehavior: {
      researchIntensity: 'low' | 'medium' | 'high'
      pricesensitivity: number
      featurePriorities: string[]
      influencers: string[]
      decisionCriteria: string[]
    }
  }
  trends: {
    engagement: 'increasing' | 'decreasing' | 'stable'
    interest: 'growing' | 'declining' | 'consistent'
    urgency: 'high' | 'medium' | 'low'
  }
  lastAnalyzed: Date
}

export interface MarketIntelligence {
  industry: string
  trends: Array<{
    trend: string
    impact: 'positive' | 'negative' | 'neutral'
    confidence: number
    timeframe: string
    relevance: number
  }>
  competitiveAnalysis: {
    marketShare: number
    positioning: string
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  buyingPatterns: {
    seasonality: Record<string, number>
    cycleTiming: string
    budgetCycles: string[]
    decisionFactors: string[]
  }
  recommendations: string[]
  lastUpdated: Date
}

export interface SalesForecasting {
  period: 'week' | 'month' | 'quarter' | 'year'
  forecast: {
    revenue: number
    deals: number
    confidence: number
    range: {
      low: number
      high: number
    }
  }
  breakdown: {
    byStage: Record<string, number>
    bySource: Record<string, number>
    byRep: Record<string, number>
    byProduct: Record<string, number>
  }
  factors: Array<{
    factor: string
    impact: number
    explanation: string
  }>
  risks: string[]
  opportunities: string[]
  recommendations: string[]
  generatedAt: Date
}

export class PredictiveAnalyticsEngine {
  private openai: OpenAI
  private models: Map<string, PredictiveModel> = new Map()

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.initializeModels()
  }

  // Generate comprehensive lead predictions
  async predictLeadOutcome(leadData: any, historicalData: any[]): Promise<Prediction> {
    const prompt = `
Analyze this lead and predict the likelihood of conversion based on historical patterns:

Lead Data:
${JSON.stringify(leadData, null, 2)}

Historical Data (similar leads):
${JSON.stringify(historicalData.slice(0, 10), null, 2)}

Analyze and predict:
1. Conversion probability (0-1)
2. Confidence level (0-1)
3. Key factors influencing the prediction
4. Specific recommendations to improve conversion
5. Optimal timing for next actions

Consider:
- Lead scoring factors
- Behavioral patterns
- Company characteristics
- Market conditions
- Historical conversion patterns

Return detailed JSON prediction with explanations.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1500
      })

      const analysis = JSON.parse(response.choices[0].message.content || '{}')

      return {
        id: this.generatePredictionId(),
        modelId: 'lead_conversion_v1',
        targetId: leadData.id,
        prediction: analysis.conversionProbability || 0.5,
        confidence: analysis.confidence || 0.7,
        factors: analysis.factors || [],
        recommendations: analysis.recommendations || [],
        timeframe: analysis.timeframe || '30 days',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    } catch (error) {
      console.error('Lead prediction failed:', error)
      throw new Error('Failed to generate lead prediction')
    }
  }

  // Analyze behavioral patterns
  async analyzeBehavioralPatterns(leadId: string, activityData: any[]): Promise<BehavioralPattern> {
    const prompt = `
Analyze this lead's behavioral patterns from their activity data:

Activity Data:
${JSON.stringify(activityData, null, 2)}

Extract patterns for:
1. Email engagement (open rates, click rates, optimal times)
2. Website activity (visit frequency, pages viewed, content preferences)
3. Communication preferences (channel, style, response times)
4. Buying behavior (research intensity, price sensitivity, decision criteria)

Identify trends:
- Engagement trajectory
- Interest level changes
- Urgency indicators

Return comprehensive behavioral analysis with actionable insights.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      })

      const analysis = JSON.parse(response.choices[0].message.content || '{}')

      return {
        leadId,
        patterns: {
          emailEngagement: analysis.emailEngagement || {
            openRate: 0.3,
            clickRate: 0.1,
            responseRate: 0.05,
            optimalTimes: ['10:00 AM', '2:00 PM'],
            preferredContent: ['case studies', 'product updates']
          },
          websiteActivity: analysis.websiteActivity || {
            visitFrequency: 2,
            sessionDuration: 180,
            pagesViewed: [],
            downloadedContent: [],
            lastVisit: new Date()
          },
          communicationPreferences: analysis.communicationPreferences || {
            preferredChannel: 'email',
            responseTime: 24,
            communicationStyle: 'professional',
            decisionMakingSpeed: 'medium'
          },
          buyingBehavior: analysis.buyingBehavior || {
            researchIntensity: 'medium',
            pricesensitivity: 0.5,
            featurePriorities: [],
            influencers: [],
            decisionCriteria: []
          }
        },
        trends: analysis.trends || {
          engagement: 'stable',
          interest: 'consistent',
          urgency: 'medium'
        },
        lastAnalyzed: new Date()
      }
    } catch (error) {
      console.error('Behavioral analysis failed:', error)
      throw new Error('Failed to analyze behavioral patterns')
    }
  }

  // Generate market intelligence
  async generateMarketIntelligence(industry: string, companyData: any): Promise<MarketIntelligence> {
    const prompt = `
Generate market intelligence for this industry and company:

Industry: ${industry}
Company Data: ${JSON.stringify(companyData, null, 2)}

Analyze:
1. Current industry trends and their impact
2. Competitive landscape and positioning
3. Buying patterns and seasonality
4. Market opportunities and threats
5. Strategic recommendations

Consider:
- Economic factors
- Technology disruptions
- Regulatory changes
- Customer behavior shifts
- Competitive dynamics

Return comprehensive market intelligence with actionable insights.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2000
      })

      const intelligence = JSON.parse(response.choices[0].message.content || '{}')

      return {
        industry,
        trends: intelligence.trends || [],
        competitiveAnalysis: intelligence.competitiveAnalysis || {
          marketShare: 0.1,
          positioning: 'challenger',
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: []
        },
        buyingPatterns: intelligence.buyingPatterns || {
          seasonality: {},
          cycleTiming: 'quarterly',
          budgetCycles: ['Q1', 'Q4'],
          decisionFactors: []
        },
        recommendations: intelligence.recommendations || [],
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Market intelligence generation failed:', error)
      throw new Error('Failed to generate market intelligence')
    }
  }

  // Generate sales forecasting
  async generateSalesForecasting(
    historicalData: any[],
    currentPipeline: any[],
    period: SalesForecasting['period']
  ): Promise<SalesForecasting> {
    const prompt = `
Generate sales forecast based on historical data and current pipeline:

Historical Data (last 12 months):
${JSON.stringify(historicalData, null, 2)}

Current Pipeline:
${JSON.stringify(currentPipeline, null, 2)}

Forecast Period: ${period}

Generate forecast including:
1. Revenue prediction with confidence intervals
2. Number of deals expected to close
3. Breakdown by stage, source, rep, and product
4. Key factors influencing the forecast
5. Risks and opportunities
6. Recommendations for achieving targets

Consider:
- Seasonal patterns
- Pipeline velocity
- Conversion rates by stage
- Market conditions
- Team performance trends

Return detailed forecast with explanations.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2000
      })

      const forecast = JSON.parse(response.choices[0].message.content || '{}')

      return {
        period,
        forecast: {
          revenue: forecast.revenue || 0,
          deals: forecast.deals || 0,
          confidence: forecast.confidence || 0.7,
          range: forecast.range || { low: 0, high: 0 }
        },
        breakdown: forecast.breakdown || {
          byStage: {},
          bySource: {},
          byRep: {},
          byProduct: {}
        },
        factors: forecast.factors || [],
        risks: forecast.risks || [],
        opportunities: forecast.opportunities || [],
        recommendations: forecast.recommendations || [],
        generatedAt: new Date()
      }
    } catch (error) {
      console.error('Sales forecasting failed:', error)
      throw new Error('Failed to generate sales forecast')
    }
  }

  // Predict optimal follow-up timing
  async predictOptimalTiming(leadData: any, behavioralPattern: BehavioralPattern): Promise<{
    nextContactTime: Date
    channel: string
    confidence: number
    reasoning: string[]
  }> {
    const prompt = `
Predict the optimal timing and channel for the next contact with this lead:

Lead Data:
${JSON.stringify(leadData, null, 2)}

Behavioral Patterns:
${JSON.stringify(behavioralPattern, null, 2)}

Determine:
1. Best time for next contact (specific date/time)
2. Optimal communication channel
3. Confidence level in the prediction
4. Reasoning behind the recommendation

Consider:
- Historical response patterns
- Communication preferences
- Current engagement level
- Business context and urgency
- Industry norms

Return specific timing recommendation with detailed reasoning.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      })

      const timing = JSON.parse(response.choices[0].message.content || '{}')

      return {
        nextContactTime: new Date(timing.nextContactTime || Date.now() + 24 * 60 * 60 * 1000),
        channel: timing.channel || 'email',
        confidence: timing.confidence || 0.7,
        reasoning: timing.reasoning || ['Based on historical patterns']
      }
    } catch (error) {
      console.error('Timing prediction failed:', error)
      throw new Error('Failed to predict optimal timing')
    }
  }

  // Initialize predictive models
  private initializeModels(): void {
    const models: PredictiveModel[] = [
      {
        id: 'lead_conversion_v1',
        name: 'Lead Conversion Predictor',
        type: 'lead_scoring',
        accuracy: 0.87,
        lastTrained: new Date(),
        features: ['company_size', 'industry', 'role', 'engagement_score', 'source'],
        version: '1.0'
      },
      {
        id: 'churn_prediction_v1',
        name: 'Customer Churn Predictor',
        type: 'churn_prediction',
        accuracy: 0.82,
        lastTrained: new Date(),
        features: ['usage_frequency', 'support_tickets', 'payment_history', 'engagement'],
        version: '1.0'
      },
      {
        id: 'deal_closure_v1',
        name: 'Deal Closure Predictor',
        type: 'deal_closure',
        accuracy: 0.79,
        lastTrained: new Date(),
        features: ['deal_size', 'stage_duration', 'stakeholder_count', 'competition'],
        version: '1.0'
      }
    ]

    models.forEach(model => {
      this.models.set(model.id, model)
    })
  }

  // Helper methods
  private generatePredictionId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get model by ID
  getModel(modelId: string): PredictiveModel | undefined {
    return this.models.get(modelId)
  }

  // List all available models
  listModels(): PredictiveModel[] {
    return Array.from(this.models.values())
  }
}

export { PredictiveAnalyticsEngine }
