// LeadAI Pro - Conversation Intelligence Engine
// Advanced conversation analysis with sentiment, intent, and buying signals

import { Conversation } from '@prisma/client'

// Interfaces
export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral'
  score: number // -1 to 1
  confidence: number
  emotions: {
    joy: number
    anger: number
    fear: number
    sadness: number
    surprise: number
    trust: number
  }
}

export interface IntentAnalysis {
  primaryIntent: string
  confidence: number
  allIntents: {
    intent: string
    confidence: number
  }[]
  urgency: 'low' | 'medium' | 'high'
}

export interface BuyingSignal {
  type: 'budget_mentioned' | 'timeline_discussed' | 'decision_maker_involved' | 'competitor_comparison' | 'pain_point_expressed' | 'solution_interest'
  confidence: number
  evidence: string
  context: string
}

export interface TopicExtraction {
  mainTopics: string[]
  keywords: string[]
  entities: {
    people: string[]
    organizations: string[]
    products: string[]
    locations: string[]
  }
}

export interface ConversationInsights {
  sentiment: SentimentAnalysis
  intent: IntentAnalysis
  buyingSignals: BuyingSignal[]
  topics: TopicExtraction
  recommendations: string[]
  riskFlags: string[]
  nextBestActions: string[]
}

export class ConversationIntelligenceEngine {
  private sentimentKeywords = {
    positive: ['great', 'excellent', 'perfect', 'love', 'amazing', 'fantastic', 'wonderful', 'impressed', 'satisfied', 'happy'],
    negative: ['terrible', 'awful', 'hate', 'disappointed', 'frustrated', 'angry', 'concerned', 'worried', 'problem', 'issue'],
    neutral: ['okay', 'fine', 'alright', 'maybe', 'perhaps', 'consider', 'think', 'possible', 'might', 'could']
  }

  private intentPatterns = {
    purchase: ['buy', 'purchase', 'order', 'get started', 'sign up', 'proceed', 'move forward'],
    evaluate: ['compare', 'evaluate', 'assess', 'review', 'analyze', 'consider', 'look at'],
    information: ['tell me', 'explain', 'how does', 'what is', 'can you', 'help me understand'],
    pricing: ['cost', 'price', 'pricing', 'budget', 'expensive', 'affordable', 'investment'],
    demo: ['demo', 'demonstration', 'show me', 'see it', 'trial', 'test'],
    objection: ['but', 'however', 'concern', 'worry', 'problem', 'issue', 'not sure']
  }

  private buyingSignalPatterns = {
    budget_mentioned: ['budget', 'allocated', 'approved', 'funding', 'investment', '$', 'cost'],
    timeline_discussed: ['when', 'timeline', 'deadline', 'by', 'need it', 'launch', 'go live'],
    decision_maker_involved: ['boss', 'manager', 'CEO', 'director', 'team', 'decision', 'approve'],
    competitor_comparison: ['vs', 'versus', 'compared to', 'alternative', 'competitor', 'other options'],
    pain_point_expressed: ['problem', 'issue', 'challenge', 'difficulty', 'struggle', 'pain'],
    solution_interest: ['solution', 'solve', 'help', 'fix', 'improve', 'better', 'optimize']
  }

  async analyzeConversation(conversation: Conversation): Promise<ConversationInsights> {
    const content = conversation.content.toLowerCase()
    
    const sentiment = this.analyzeSentiment(content)
    const intent = this.analyzeIntent(content)
    const buyingSignals = this.detectBuyingSignals(content)
    const topics = this.extractTopics(content)
    
    return {
      sentiment,
      intent,
      buyingSignals,
      topics,
      recommendations: this.generateRecommendations(sentiment, intent, buyingSignals),
      riskFlags: this.identifyRiskFlags(sentiment, intent, buyingSignals),
      nextBestActions: this.suggestNextActions(sentiment, intent, buyingSignals)
    }
  }

  private analyzeSentiment(content: string): SentimentAnalysis {
    let positiveScore = 0
    let negativeScore = 0
    let neutralScore = 0

    // Count sentiment keywords
    this.sentimentKeywords.positive.forEach(word => {
      const matches = (content.match(new RegExp(word, 'g')) || []).length
      positiveScore += matches
    })

    this.sentimentKeywords.negative.forEach(word => {
      const matches = (content.match(new RegExp(word, 'g')) || []).length
      negativeScore += matches
    })

    this.sentimentKeywords.neutral.forEach(word => {
      const matches = (content.match(new RegExp(word, 'g')) || []).length
      neutralScore += matches
    })

    // Calculate overall sentiment
    const total = positiveScore + negativeScore + neutralScore
    let overall: 'positive' | 'negative' | 'neutral' = 'neutral'
    let score = 0
    let confidence = 0.5

    if (total > 0) {
      if (positiveScore > negativeScore && positiveScore > neutralScore) {
        overall = 'positive'
        score = positiveScore / total
        confidence = Math.min(0.9, 0.5 + (positiveScore / total) * 0.4)
      } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
        overall = 'negative'
        score = -negativeScore / total
        confidence = Math.min(0.9, 0.5 + (negativeScore / total) * 0.4)
      }
    }

    return {
      overall,
      score,
      confidence,
      emotions: {
        joy: positiveScore * 0.3,
        anger: negativeScore * 0.4,
        fear: negativeScore * 0.2,
        sadness: negativeScore * 0.1,
        surprise: positiveScore * 0.2,
        trust: positiveScore * 0.5
      }
    }
  }

  private analyzeIntent(content: string): IntentAnalysis {
    const intentScores: { [key: string]: number } = {}

    // Score each intent based on keyword matches
    Object.entries(this.intentPatterns).forEach(([intent, keywords]) => {
      let score = 0
      keywords.forEach(keyword => {
        const matches = (content.match(new RegExp(keyword, 'g')) || []).length
        score += matches
      })
      intentScores[intent] = score
    })

    // Find primary intent
    const sortedIntents = Object.entries(intentScores)
      .sort(([, a], [, b]) => b - a)
      .map(([intent, score]) => ({ intent, confidence: Math.min(0.95, score * 0.2) }))

    const primaryIntent = sortedIntents[0]?.intent || 'information'
    const confidence = sortedIntents[0]?.confidence || 0.3

    // Determine urgency
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'quickly', 'soon', 'deadline']
    const urgencyScore = urgencyKeywords.reduce((score, keyword) => {
      return score + (content.match(new RegExp(keyword, 'g')) || []).length
    }, 0)

    let urgency: 'low' | 'medium' | 'high' = 'low'
    if (urgencyScore >= 3) urgency = 'high'
    else if (urgencyScore >= 1) urgency = 'medium'

    return {
      primaryIntent,
      confidence,
      allIntents: sortedIntents.slice(0, 3),
      urgency
    }
  }

  private detectBuyingSignals(content: string): BuyingSignal[] {
    const signals: BuyingSignal[] = []

    Object.entries(this.buyingSignalPatterns).forEach(([type, keywords]) => {
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        const matches = content.match(regex)
        
        if (matches) {
          // Find context around the keyword
          const keywordIndex = content.indexOf(keyword.toLowerCase())
          const contextStart = Math.max(0, keywordIndex - 50)
          const contextEnd = Math.min(content.length, keywordIndex + 50)
          const context = content.substring(contextStart, contextEnd)

          signals.push({
            type: type as any,
            confidence: Math.min(0.9, matches.length * 0.3),
            evidence: matches[0],
            context: context.trim()
          })
        }
      })
    })

    // Remove duplicates and sort by confidence
    const uniqueSignals = signals.reduce((acc, signal) => {
      const existing = acc.find(s => s.type === signal.type)
      if (!existing || existing.confidence < signal.confidence) {
        return [...acc.filter(s => s.type !== signal.type), signal]
      }
      return acc
    }, [] as BuyingSignal[])

    return uniqueSignals.sort((a, b) => b.confidence - a.confidence)
  }

  private extractTopics(content: string): TopicExtraction {
    // Simple topic extraction (in production, use NLP libraries)
    const words = content.split(/\s+/).filter(word => word.length > 3)
    const wordFreq: { [key: string]: number } = {}

    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1
    })

    const sortedWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)

    // Extract entities (simplified)
    const peoplePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
    const orgPattern = /\b[A-Z][a-z]+ (Inc|Corp|LLC|Ltd|Company|Solutions|Systems)\b/g
    const productPattern = /\b(software|platform|system|tool|application|service)\b/gi

    return {
      mainTopics: sortedWords.slice(0, 5),
      keywords: sortedWords,
      entities: {
        people: content.match(peoplePattern) || [],
        organizations: content.match(orgPattern) || [],
        products: content.match(productPattern) || [],
        locations: [] // Would need more sophisticated extraction
      }
    }
  }

  private generateRecommendations(
    sentiment: SentimentAnalysis,
    intent: IntentAnalysis,
    buyingSignals: BuyingSignal[]
  ): string[] {
    const recommendations: string[] = []

    // Sentiment-based recommendations
    if (sentiment.overall === 'negative') {
      recommendations.push('Address concerns and objections proactively')
      recommendations.push('Schedule a call to discuss issues in detail')
    } else if (sentiment.overall === 'positive') {
      recommendations.push('Strike while the iron is hot - accelerate the process')
      recommendations.push('Prepare proposal or next steps')
    }

    // Intent-based recommendations
    if (intent.primaryIntent === 'purchase') {
      recommendations.push('Prepare contract and pricing information')
      recommendations.push('Schedule implementation planning call')
    } else if (intent.primaryIntent === 'demo') {
      recommendations.push('Schedule personalized demo session')
      recommendations.push('Prepare relevant use cases and examples')
    } else if (intent.primaryIntent === 'pricing') {
      recommendations.push('Send detailed pricing proposal')
      recommendations.push('Highlight ROI and value proposition')
    }

    // Buying signal recommendations
    if (buyingSignals.some(s => s.type === 'budget_mentioned')) {
      recommendations.push('Align solution with stated budget parameters')
    }
    if (buyingSignals.some(s => s.type === 'timeline_discussed')) {
      recommendations.push('Create implementation timeline matching their needs')
    }

    return [...new Set(recommendations)] // Remove duplicates
  }

  private identifyRiskFlags(
    sentiment: SentimentAnalysis,
    intent: IntentAnalysis,
    buyingSignals: BuyingSignal[]
  ): string[] {
    const risks: string[] = []

    if (sentiment.overall === 'negative' && sentiment.confidence > 0.7) {
      risks.push('High negative sentiment detected')
    }

    if (intent.primaryIntent === 'objection' && intent.confidence > 0.6) {
      risks.push('Strong objections raised')
    }

    if (buyingSignals.some(s => s.type === 'competitor_comparison' && s.confidence > 0.7)) {
      risks.push('Actively comparing with competitors')
    }

    if (intent.urgency === 'low' && buyingSignals.length < 2) {
      risks.push('Low engagement and buying intent')
    }

    return risks
  }

  private suggestNextActions(
    sentiment: SentimentAnalysis,
    intent: IntentAnalysis,
    buyingSignals: BuyingSignal[]
  ): string[] {
    const actions: string[] = []

    // High-intent actions
    if (intent.primaryIntent === 'purchase' || buyingSignals.length >= 3) {
      actions.push('Send contract and close the deal')
      actions.push('Schedule implementation kickoff')
      return actions
    }

    // Medium-intent actions
    if (intent.primaryIntent === 'demo' || intent.primaryIntent === 'evaluate') {
      actions.push('Schedule product demonstration')
      actions.push('Send relevant case studies')
    }

    if (intent.primaryIntent === 'pricing') {
      actions.push('Prepare customized pricing proposal')
      actions.push('Schedule pricing discussion call')
    }

    // Low-intent nurturing actions
    if (buyingSignals.length < 2) {
      actions.push('Send educational content')
      actions.push('Schedule discovery call')
    }

    // Risk mitigation actions
    if (sentiment.overall === 'negative') {
      actions.push('Address concerns immediately')
      actions.push('Schedule problem-solving session')
    }

    return actions.slice(0, 3) // Limit to top 3 actions
  }
}
