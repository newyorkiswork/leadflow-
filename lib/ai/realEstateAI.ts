// LeadFlow AI - Real Estate AI Services (2025)
// Specialized AI for property analysis, deal evaluation, and investment insights

import { OpenAI } from 'openai'
import { PropStreamProperty } from '../integrations/propstream'
import { SkipTraceResult } from '../integrations/batchSkipTrace'

export interface PropertyAnalysis {
  propertyId: string
  analysis: {
    investmentScore: number
    confidence: number
    recommendation: 'buy' | 'pass' | 'investigate'
    reasoning: string[]
  }
  valuation: {
    estimatedARV: number
    repairCosts: number
    acquisitionCosts: number
    totalInvestment: number
    projectedProfit: number
    roi: number
    cashOnCash: number
  }
  marketAnalysis: {
    marketTrend: 'rising' | 'stable' | 'declining'
    comparablesSummary: string
    daysOnMarketPrediction: number
    priceAppreciationForecast: number
  }
  riskFactors: Array<{
    factor: string
    severity: 'low' | 'medium' | 'high'
    impact: string
    mitigation: string
  }>
  opportunities: Array<{
    opportunity: string
    potential: string
    actionRequired: string
  }>
  dealStructure: {
    recommendedStrategy: string
    financingOptions: string[]
    exitStrategy: string
    timeline: string
  }
}

export interface LeadScoringFactors {
  motivation: {
    score: number
    indicators: string[]
    urgency: 'low' | 'medium' | 'high'
  }
  property: {
    score: number
    equity: number
    condition: string
    marketability: number
  }
  financial: {
    score: number
    distressLevel: number
    timeframe: string
    priceFlexibility: number
  }
  communication: {
    score: number
    responsiveness: number
    engagement: number
    trustLevel: number
  }
}

export interface MarketInsights {
  area: {
    city: string
    state: string
    county: string
  }
  trends: {
    priceDirection: 'up' | 'down' | 'stable'
    velocityChange: number
    inventoryLevel: 'low' | 'normal' | 'high'
    demandLevel: 'low' | 'normal' | 'high'
  }
  investment: {
    hotness: number
    competition: 'low' | 'medium' | 'high'
    bestStrategies: string[]
    avgROI: number
    avgDaysOnMarket: number
  }
  forecast: {
    nextQuarter: {
      priceChange: number
      volumeChange: number
      confidence: number
    }
    nextYear: {
      priceChange: number
      volumeChange: number
      confidence: number
    }
  }
  recommendations: string[]
}

export class RealEstateAI {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  // Analyze property for investment potential
  async analyzeProperty(
    property: PropStreamProperty,
    comparables: PropStreamProperty[],
    marketData?: any
  ): Promise<PropertyAnalysis> {
    const prompt = `
Analyze this real estate investment opportunity:

Property Details:
${JSON.stringify(property, null, 2)}

Comparable Properties:
${JSON.stringify(comparables.slice(0, 5), null, 2)}

Market Data:
${JSON.stringify(marketData, null, 2)}

Provide comprehensive investment analysis including:
1. Investment score (0-100) and recommendation
2. ARV estimation and repair cost analysis
3. ROI and cash-on-cash return projections
4. Market trend analysis and positioning
5. Risk factors and mitigation strategies
6. Investment opportunities and action items
7. Recommended deal structure and exit strategy

Consider:
- Property condition and repair needs
- Market comparables and pricing
- Neighborhood trends and growth potential
- Investment strategy optimization
- Risk/reward balance
- Current market conditions

Return detailed JSON analysis with specific numbers and actionable insights.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2000
      })

      const analysis = JSON.parse(response.choices[0].message.content || '{}')

      return {
        propertyId: property.id,
        analysis: {
          investmentScore: analysis.investmentScore || 50,
          confidence: analysis.confidence || 0.7,
          recommendation: analysis.recommendation || 'investigate',
          reasoning: analysis.reasoning || []
        },
        valuation: {
          estimatedARV: analysis.valuation?.estimatedARV || property.valuation.estimatedValue,
          repairCosts: analysis.valuation?.repairCosts || 0,
          acquisitionCosts: analysis.valuation?.acquisitionCosts || 0,
          totalInvestment: analysis.valuation?.totalInvestment || 0,
          projectedProfit: analysis.valuation?.projectedProfit || 0,
          roi: analysis.valuation?.roi || 0,
          cashOnCash: analysis.valuation?.cashOnCash || 0
        },
        marketAnalysis: {
          marketTrend: analysis.marketAnalysis?.marketTrend || 'stable',
          comparablesSummary: analysis.marketAnalysis?.comparablesSummary || '',
          daysOnMarketPrediction: analysis.marketAnalysis?.daysOnMarketPrediction || 30,
          priceAppreciationForecast: analysis.marketAnalysis?.priceAppreciationForecast || 0
        },
        riskFactors: analysis.riskFactors || [],
        opportunities: analysis.opportunities || [],
        dealStructure: {
          recommendedStrategy: analysis.dealStructure?.recommendedStrategy || 'cash purchase',
          financingOptions: analysis.dealStructure?.financingOptions || [],
          exitStrategy: analysis.dealStructure?.exitStrategy || 'flip',
          timeline: analysis.dealStructure?.timeline || '6 months'
        }
      }
    } catch (error) {
      console.error('Property analysis failed:', error)
      throw new Error('Failed to analyze property')
    }
  }

  // Score real estate leads
  async scoreRealEstateLead(
    leadData: any,
    propertyData?: PropStreamProperty,
    skipTraceData?: SkipTraceResult
  ): Promise<{ score: number; factors: LeadScoringFactors; recommendations: string[] }> {
    const prompt = `
Score this real estate lead for conversion potential:

Lead Information:
${JSON.stringify(leadData, null, 2)}

Property Information:
${JSON.stringify(propertyData, null, 2)}

Skip Trace Data:
${JSON.stringify(skipTraceData, null, 2)}

Analyze and score based on:
1. Motivation level and selling urgency
2. Property equity and marketability
3. Financial distress indicators
4. Communication responsiveness
5. Deal probability factors

Provide detailed scoring breakdown and specific recommendations for engagement.

Return JSON with overall score (0-100) and detailed factor analysis.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500
      })

      const scoring = JSON.parse(response.choices[0].message.content || '{}')

      return {
        score: scoring.score || 50,
        factors: {
          motivation: {
            score: scoring.factors?.motivation?.score || 50,
            indicators: scoring.factors?.motivation?.indicators || [],
            urgency: scoring.factors?.motivation?.urgency || 'medium'
          },
          property: {
            score: scoring.factors?.property?.score || 50,
            equity: scoring.factors?.property?.equity || 0,
            condition: scoring.factors?.property?.condition || 'unknown',
            marketability: scoring.factors?.property?.marketability || 50
          },
          financial: {
            score: scoring.factors?.financial?.score || 50,
            distressLevel: scoring.factors?.financial?.distressLevel || 0,
            timeframe: scoring.factors?.financial?.timeframe || 'unknown',
            priceFlexibility: scoring.factors?.financial?.priceFlexibility || 50
          },
          communication: {
            score: scoring.factors?.communication?.score || 50,
            responsiveness: scoring.factors?.communication?.responsiveness || 50,
            engagement: scoring.factors?.communication?.engagement || 50,
            trustLevel: scoring.factors?.communication?.trustLevel || 50
          }
        },
        recommendations: scoring.recommendations || []
      }
    } catch (error) {
      console.error('Lead scoring failed:', error)
      throw new Error('Failed to score real estate lead')
    }
  }

  // Generate market insights for area
  async generateMarketInsights(
    city: string,
    state: string,
    marketData: any,
    recentSales: PropStreamProperty[]
  ): Promise<MarketInsights> {
    const prompt = `
Generate comprehensive market insights for real estate investing:

Location: ${city}, ${state}

Market Data:
${JSON.stringify(marketData, null, 2)}

Recent Sales:
${JSON.stringify(recentSales.slice(0, 10), null, 2)}

Analyze:
1. Current market trends and direction
2. Investment opportunity assessment
3. Competition level and market dynamics
4. Price and volume forecasts
5. Best investment strategies for this market
6. Specific recommendations for investors

Provide actionable insights for real estate investors targeting this area.

Return detailed JSON analysis with specific metrics and recommendations.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500
      })

      const insights = JSON.parse(response.choices[0].message.content || '{}')

      return {
        area: {
          city,
          state,
          county: insights.area?.county || ''
        },
        trends: {
          priceDirection: insights.trends?.priceDirection || 'stable',
          velocityChange: insights.trends?.velocityChange || 0,
          inventoryLevel: insights.trends?.inventoryLevel || 'normal',
          demandLevel: insights.trends?.demandLevel || 'normal'
        },
        investment: {
          hotness: insights.investment?.hotness || 50,
          competition: insights.investment?.competition || 'medium',
          bestStrategies: insights.investment?.bestStrategies || [],
          avgROI: insights.investment?.avgROI || 0,
          avgDaysOnMarket: insights.investment?.avgDaysOnMarket || 30
        },
        forecast: {
          nextQuarter: {
            priceChange: insights.forecast?.nextQuarter?.priceChange || 0,
            volumeChange: insights.forecast?.nextQuarter?.volumeChange || 0,
            confidence: insights.forecast?.nextQuarter?.confidence || 0.5
          },
          nextYear: {
            priceChange: insights.forecast?.nextYear?.priceChange || 0,
            volumeChange: insights.forecast?.nextYear?.volumeChange || 0,
            confidence: insights.forecast?.nextYear?.confidence || 0.5
          }
        },
        recommendations: insights.recommendations || []
      }
    } catch (error) {
      console.error('Market insights generation failed:', error)
      throw new Error('Failed to generate market insights')
    }
  }

  // Generate personalized outreach messages
  async generateOutreachMessage(
    leadData: any,
    propertyData: PropStreamProperty,
    messageType: 'initial' | 'follow_up' | 'offer' | 'closing',
    context?: string
  ): Promise<{
    subject: string
    message: string
    callToAction: string
    tone: string
    personalizations: string[]
  }> {
    const prompt = `
Generate a personalized ${messageType} message for this real estate lead:

Lead Information:
${JSON.stringify(leadData, null, 2)}

Property Information:
${JSON.stringify(propertyData, null, 2)}

Context: ${context || 'Standard outreach'}

Create a compelling, personalized message that:
1. Addresses the lead by name and references their specific property
2. Demonstrates knowledge of their situation and property
3. Provides value and builds trust
4. Has a clear, compelling call to action
5. Uses appropriate tone for the situation

Message Type: ${messageType}

Return JSON with subject, message content, call to action, tone, and personalization elements used.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1000
      })

      const messageData = JSON.parse(response.choices[0].message.content || '{}')

      return {
        subject: messageData.subject || `Regarding your property at ${propertyData.address.street}`,
        message: messageData.message || 'Hello, I wanted to reach out about your property.',
        callToAction: messageData.callToAction || 'Would you be interested in discussing this further?',
        tone: messageData.tone || 'professional',
        personalizations: messageData.personalizations || []
      }
    } catch (error) {
      console.error('Outreach message generation failed:', error)
      throw new Error('Failed to generate outreach message')
    }
  }

  // Analyze deal structure and financing options
  async analyzeDealStructure(
    property: PropStreamProperty,
    investorProfile: any,
    marketConditions: any
  ): Promise<{
    recommendedStructure: string
    financingOptions: Array<{
      type: string
      downPayment: number
      interestRate: number
      loanTerm: number
      monthlyPayment: number
      totalCost: number
      pros: string[]
      cons: string[]
    }>
    exitStrategies: Array<{
      strategy: string
      timeline: string
      expectedReturn: number
      riskLevel: string
      requirements: string[]
    }>
    recommendations: string[]
  }> {
    const prompt = `
Analyze optimal deal structure for this real estate investment:

Property: ${JSON.stringify(property, null, 2)}
Investor Profile: ${JSON.stringify(investorProfile, null, 2)}
Market Conditions: ${JSON.stringify(marketConditions, null, 2)}

Analyze and recommend:
1. Best deal structure approach
2. Financing options with detailed analysis
3. Exit strategies with timelines and returns
4. Risk mitigation strategies
5. Specific action recommendations

Consider investor experience, capital availability, market conditions, and property characteristics.

Return comprehensive JSON analysis with specific numbers and actionable recommendations.
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
        recommendedStructure: analysis.recommendedStructure || 'cash purchase',
        financingOptions: analysis.financingOptions || [],
        exitStrategies: analysis.exitStrategies || [],
        recommendations: analysis.recommendations || []
      }
    } catch (error) {
      console.error('Deal structure analysis failed:', error)
      throw new Error('Failed to analyze deal structure')
    }
  }
}

export { RealEstateAI }
