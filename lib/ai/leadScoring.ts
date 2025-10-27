// LeadAI Pro - Advanced Lead Scoring Engine
// Multi-dimensional AI-powered lead scoring with explainable results

import { Lead, Activity, Conversation } from '@prisma/client'

// Scoring interfaces
export interface ScoringFactors {
  demographic: number
  behavioral: number
  temporal: number
  conversational: number
}

export interface ScoringResult {
  score: number
  confidence: number
  factors: ScoringFactors
  explanation: string[]
  recommendations: string[]
  riskFactors: string[]
  nextBestActions: string[]
}

export interface LeadProfile {
  lead: Lead
  activities: Activity[]
  conversations: Conversation[]
  organizationData?: any
  industryBenchmarks?: any
}

// Advanced Lead Scoring Engine
export class AdvancedLeadScoringEngine {
  private static instance: AdvancedLeadScoringEngine

  private constructor() {}

  public static getInstance(): AdvancedLeadScoringEngine {
    if (!AdvancedLeadScoringEngine.instance) {
      AdvancedLeadScoringEngine.instance = new AdvancedLeadScoringEngine()
    }
    return AdvancedLeadScoringEngine.instance
  }

  // Main scoring function
  async calculateScore(profile: LeadProfile): Promise<ScoringResult> {
    const factors = await this.calculateFactors(profile)
    const score = this.calculateFinalScore(factors)
    const confidence = this.calculateConfidence(profile, factors)
    
    return {
      score,
      confidence,
      factors,
      explanation: this.generateExplanation(factors, profile),
      recommendations: this.generateRecommendations(factors, profile),
      riskFactors: this.identifyRiskFactors(profile),
      nextBestActions: this.suggestNextActions(factors, profile),
    }
  }

  // Calculate individual scoring factors
  private async calculateFactors(profile: LeadProfile): Promise<ScoringFactors> {
    return {
      demographic: await this.calculateDemographicScore(profile),
      behavioral: await this.calculateBehavioralScore(profile),
      temporal: await this.calculateTemporalScore(profile),
      conversational: await this.calculateConversationalScore(profile),
    }
  }

  // Demographic scoring (company, role, industry fit)
  private async calculateDemographicScore(profile: LeadProfile): Promise<number> {
    let score = 50 // Base score

    const { lead } = profile

    // Company size indicators
    if (lead.company) {
      score += 10 // Has company
      
      // Industry-specific scoring
      const industryScore = this.getIndustryScore(lead.company)
      score += industryScore
    }

    // Job title scoring
    if (lead.jobTitle) {
      const titleScore = this.getJobTitleScore(lead.jobTitle)
      score += titleScore
    }

    // Email domain scoring
    if (lead.email) {
      const domainScore = this.getEmailDomainScore(lead.email)
      score += domainScore
    }

    return Math.min(100, Math.max(0, score))
  }

  // Behavioral scoring (engagement, activity patterns)
  private async calculateBehavioralScore(profile: LeadProfile): Promise<number> {
    let score = 30 // Base score

    const { activities } = profile
    
    if (activities.length === 0) return score

    // Activity frequency scoring
    const recentActivities = activities.filter(
      a => new Date(a.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    
    score += Math.min(30, recentActivities.length * 3)

    // Activity type diversity
    const activityTypes = new Set(activities.map(a => a.type))
    score += activityTypes.size * 5

    // Engagement quality
    const highValueActivities = activities.filter(
      a => ['demo', 'proposal', 'meeting'].includes(a.type)
    )
    score += highValueActivities.length * 15

    // Response rate (if available)
    const outboundActivities = activities.filter(a => a.type === 'email')
    const responses = activities.filter(a => a.type === 'email' && a.outcome === 'responded')
    
    if (outboundActivities.length > 0) {
      const responseRate = responses.length / outboundActivities.length
      score += responseRate * 20
    }

    return Math.min(100, Math.max(0, score))
  }

  // Temporal scoring (timing patterns, urgency indicators)
  private async calculateTemporalScore(profile: LeadProfile): Promise<number> {
    let score = 40 // Base score

    const { lead, activities } = profile
    const now = new Date()

    // Recency of last contact
    if (lead.lastContactedAt) {
      const daysSinceContact = (now.getTime() - new Date(lead.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceContact <= 1) score += 30
      else if (daysSinceContact <= 7) score += 20
      else if (daysSinceContact <= 30) score += 10
      else score -= 15
    }

    // Lead age (time since creation)
    const leadAge = (now.getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    
    if (leadAge <= 7) score += 15 // Fresh leads
    else if (leadAge <= 30) score += 10
    else if (leadAge > 90) score -= 15 // Stale leads

    // Activity momentum (increasing vs decreasing activity)
    if (activities.length >= 3) {
      const recentActivities = activities.slice(0, 3)
      const olderActivities = activities.slice(3, 6)
      
      if (recentActivities.length > olderActivities.length) {
        score += 15 // Increasing momentum
      }
    }

    // Optimal contact time alignment
    const optimalTime = lead.optimalContactTime as any
    if (optimalTime?.timezone && optimalTime?.preferredHours) {
      score += 5 // Has timing preferences
    }

    return Math.min(100, Math.max(0, score))
  }

  // Conversational scoring (sentiment, intent, buying signals)
  private async calculateConversationalScore(profile: LeadProfile): Promise<number> {
    let score = 35 // Base score

    const { conversations } = profile

    if (conversations.length === 0) return score

    // Sentiment analysis
    const sentiments = conversations
      .map(c => c.sentiment as any)
      .filter(s => s && s.overall)

    if (sentiments.length > 0) {
      const avgSentiment = sentiments.reduce((sum, s) => sum + this.parseSentiment(s.overall), 0) / sentiments.length
      score += avgSentiment * 20 // -20 to +20 based on sentiment
    }

    // Buying signals detection
    const buyingSignals = conversations
      .flatMap(c => (c.intent as any)?.buyingSignals || [])
      .filter(Boolean)

    score += Math.min(25, buyingSignals.length * 5)

    // Conversation frequency
    const recentConversations = conversations.filter(
      c => new Date(c.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    )
    score += Math.min(15, recentConversations.length * 3)

    // Intent analysis
    const intents = conversations
      .map(c => (c.intent as any)?.primaryIntent)
      .filter(Boolean)

    const purchaseIntents = intents.filter(i => 
      ['purchase', 'evaluate', 'compare'].includes(i)
    )
    score += purchaseIntents.length * 8

    return Math.min(100, Math.max(0, score))
  }

  // Calculate final weighted score
  private calculateFinalScore(factors: ScoringFactors): number {
    const weights = {
      demographic: 0.25,
      behavioral: 0.35,
      temporal: 0.20,
      conversational: 0.20,
    }

    const weightedScore = 
      factors.demographic * weights.demographic +
      factors.behavioral * weights.behavioral +
      factors.temporal * weights.temporal +
      factors.conversational * weights.conversational

    return Math.round(weightedScore)
  }

  // Calculate confidence level
  private calculateConfidence(profile: LeadProfile, factors: ScoringFactors): number {
    let confidence = 0.5 // Base confidence

    // More data = higher confidence
    const dataPoints = [
      profile.lead.email,
      profile.lead.phone,
      profile.lead.company,
      profile.lead.jobTitle,
      profile.activities.length > 0,
      profile.conversations.length > 0,
    ].filter(Boolean).length

    confidence += (dataPoints / 6) * 0.3

    // Consistency across factors increases confidence
    const factorValues = Object.values(factors)
    const variance = this.calculateVariance(factorValues)
    confidence += (1 - variance / 1000) * 0.2 // Lower variance = higher confidence

    return Math.min(1, Math.max(0.1, confidence))
  }

  // Generate human-readable explanation
  private generateExplanation(factors: ScoringFactors, profile: LeadProfile): string[] {
    const explanations: string[] = []

    // Demographic explanations
    if (factors.demographic > 70) {
      explanations.push("Strong demographic fit with ideal customer profile")
    } else if (factors.demographic < 40) {
      explanations.push("Demographic profile needs improvement")
    }

    // Behavioral explanations
    if (factors.behavioral > 70) {
      explanations.push("High engagement with multiple touchpoints")
    } else if (factors.behavioral < 40) {
      explanations.push("Low engagement - needs nurturing")
    }

    // Temporal explanations
    if (factors.temporal > 70) {
      explanations.push("Optimal timing with recent activity")
    } else if (factors.temporal < 40) {
      explanations.push("Timing concerns - lead may be cooling")
    }

    // Conversational explanations
    if (factors.conversational > 70) {
      explanations.push("Positive sentiment with buying signals detected")
    } else if (factors.conversational < 40) {
      explanations.push("Limited conversation data or negative sentiment")
    }

    return explanations
  }

  // Generate actionable recommendations
  private generateRecommendations(factors: ScoringFactors, profile: LeadProfile): string[] {
    const recommendations: string[] = []

    if (factors.behavioral < 50) {
      recommendations.push("Increase engagement with personalized content")
    }

    if (factors.conversational < 50) {
      recommendations.push("Schedule a discovery call to understand needs")
    }

    if (factors.temporal < 50) {
      recommendations.push("Re-engage with timely follow-up")
    }

    if (factors.demographic > 70 && factors.behavioral > 60) {
      recommendations.push("Fast-track to proposal stage")
    }

    return recommendations
  }

  // Identify risk factors
  private identifyRiskFactors(profile: LeadProfile): string[] {
    const risks: string[] = []

    const daysSinceLastContact = profile.lead.lastContactedAt 
      ? (Date.now() - new Date(profile.lead.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity

    if (daysSinceLastContact > 14) {
      risks.push("No recent contact - lead may be cooling")
    }

    if (profile.activities.length === 0) {
      risks.push("No recorded activities - engagement unknown")
    }

    const negativeConversations = profile.conversations.filter(
      c => this.parseSentiment((c.sentiment as any)?.overall) < -0.3
    )

    if (negativeConversations.length > 0) {
      risks.push("Negative sentiment detected in conversations")
    }

    return risks
  }

  // Suggest next best actions
  private suggestNextActions(factors: ScoringFactors, profile: LeadProfile): string[] {
    const actions: string[] = []

    const totalScore = this.calculateFinalScore(factors)

    if (totalScore > 80) {
      actions.push("Schedule demo or proposal meeting")
      actions.push("Prepare customized pricing proposal")
    } else if (totalScore > 60) {
      actions.push("Send relevant case studies")
      actions.push("Schedule discovery call")
    } else if (totalScore > 40) {
      actions.push("Nurture with educational content")
      actions.push("Identify decision makers")
    } else {
      actions.push("Re-qualify lead requirements")
      actions.push("Consider lead recycling program")
    }

    return actions
  }

  // Helper methods
  private getIndustryScore(company: string): number {
    // Industry-specific scoring logic
    const techKeywords = ['tech', 'software', 'saas', 'digital', 'ai', 'data']
    const companyLower = company.toLowerCase()

    return techKeywords.some(keyword => companyLower.includes(keyword)) ? 25 : 5
  }

  private getJobTitleScore(title: string): number {
    const titleLower = title.toLowerCase()

    if (['ceo', 'founder', 'president'].some(t => titleLower.includes(t))) return 30
    if (['cto', 'vp', 'director', 'head'].some(t => titleLower.includes(t))) return 25
    if (['manager', 'lead', 'senior'].some(t => titleLower.includes(t))) return 15
    
    return 5
  }

  private getEmailDomainScore(email: string): number {
    const domain = email.split('@')[1]?.toLowerCase()
    
    if (!domain) return 0
    
    // Corporate domains score higher than free email providers
    const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    return freeProviders.includes(domain) ? 0 : 10
  }

  private parseSentiment(sentiment: string): number {
    // Convert sentiment string to numeric value (-1 to 1)
    switch (sentiment?.toLowerCase()) {
      case 'very_positive': return 1
      case 'positive': return 0.5
      case 'neutral': return 0
      case 'negative': return -0.5
      case 'very_negative': return -1
      default: return 0
    }
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }
}

// Export singleton instance
export const leadScoringEngine = AdvancedLeadScoringEngine.getInstance()
