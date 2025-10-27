// LeadAI Pro - Behavioral Analysis Engine
// Advanced behavioral pattern recognition and journey analysis

import { Lead, Activity, Conversation } from '@prisma/client'

// Interfaces
export interface BehaviorPattern {
  type: 'engagement_increasing' | 'engagement_decreasing' | 'consistent_engagement' | 'sporadic_activity' | 'high_intent' | 'research_phase'
  confidence: number
  description: string
  evidence: string[]
  timeframe: {
    start: Date
    end: Date
  }
}

export interface JourneyStage {
  current: 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase'
  confidence: number
  timeInStage: number // days
  progressIndicators: string[]
  blockers: string[]
}

export interface PredictedPath {
  nextStage: string
  probability: number
  timeToNextStage: number // days
  requiredActions: string[]
  riskFactors: string[]
}

export interface BehavioralInsights {
  patterns: BehaviorPattern[]
  currentStage: JourneyStage
  predictedPath: PredictedPath
  engagementScore: number
  velocityScore: number
  recommendations: string[]
  anomalies: string[]
}

export interface LeadBehaviorProfile {
  lead: Lead
  activities: Activity[]
  conversations: Conversation[]
}

export class BehavioralAnalysisEngine {
  private stageIndicators = {
    awareness: ['visited website', 'downloaded content', 'social media interaction'],
    interest: ['multiple page views', 'content engagement', 'email opens'],
    consideration: ['demo request', 'pricing inquiry', 'feature questions'],
    intent: ['trial signup', 'proposal request', 'budget discussion'],
    evaluation: ['competitor comparison', 'technical questions', 'stakeholder involvement'],
    purchase: ['contract review', 'implementation planning', 'purchase order']
  }

  async analyzeLeadBehavior(profile: LeadBehaviorProfile): Promise<BehavioralInsights> {
    const patterns = this.identifyBehaviorPatterns(profile)
    const currentStage = this.determineCurrentStage(profile)
    const predictedPath = this.predictNextSteps(profile, patterns, currentStage)
    const engagementScore = this.calculateEngagementScore(profile)
    const velocityScore = this.calculateVelocityScore(profile)

    return {
      patterns,
      currentStage,
      predictedPath,
      engagementScore,
      velocityScore,
      recommendations: this.generateRecommendations(patterns, currentStage, predictedPath),
      anomalies: this.detectAnomalies(profile, patterns)
    }
  }

  private identifyBehaviorPatterns(profile: LeadBehaviorProfile): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = []
    const { activities, conversations } = profile

    // Sort activities by date
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Analyze engagement trends
    const engagementPattern = this.analyzeEngagementTrend(sortedActivities)
    if (engagementPattern) patterns.push(engagementPattern)

    // Analyze activity frequency
    const frequencyPattern = this.analyzeActivityFrequency(sortedActivities)
    if (frequencyPattern) patterns.push(frequencyPattern)

    // Analyze conversation patterns
    const conversationPattern = this.analyzeConversationPatterns(conversations)
    if (conversationPattern) patterns.push(conversationPattern)

    // Analyze content consumption
    const contentPattern = this.analyzeContentConsumption(activities)
    if (contentPattern) patterns.push(contentPattern)

    return patterns
  }

  private analyzeEngagementTrend(activities: Activity[]): BehaviorPattern | null {
    if (activities.length < 3) return null

    const recentActivities = activities.slice(0, Math.floor(activities.length / 2))
    const olderActivities = activities.slice(Math.floor(activities.length / 2))

    const recentEngagement = recentActivities.length
    const olderEngagement = olderActivities.length

    const trend = recentEngagement - olderEngagement
    const confidence = Math.min(0.9, Math.abs(trend) / activities.length)

    if (trend > 2) {
      return {
        type: 'engagement_increasing',
        confidence,
        description: 'Lead engagement is increasing over time',
        evidence: [`${recentEngagement} recent activities vs ${olderEngagement} older activities`],
        timeframe: {
          start: new Date(activities[activities.length - 1].createdAt),
          end: new Date(activities[0].createdAt)
        }
      }
    } else if (trend < -2) {
      return {
        type: 'engagement_decreasing',
        confidence,
        description: 'Lead engagement is decreasing over time',
        evidence: [`${recentEngagement} recent activities vs ${olderEngagement} older activities`],
        timeframe: {
          start: new Date(activities[activities.length - 1].createdAt),
          end: new Date(activities[0].createdAt)
        }
      }
    } else {
      return {
        type: 'consistent_engagement',
        confidence: 0.7,
        description: 'Lead maintains consistent engagement levels',
        evidence: ['Steady activity pattern over time'],
        timeframe: {
          start: new Date(activities[activities.length - 1].createdAt),
          end: new Date(activities[0].createdAt)
        }
      }
    }
  }

  private analyzeActivityFrequency(activities: Activity[]): BehaviorPattern | null {
    if (activities.length < 2) return null

    // Calculate average time between activities
    const timeDiffs = []
    for (let i = 0; i < activities.length - 1; i++) {
      const diff = new Date(activities[i].createdAt).getTime() - new Date(activities[i + 1].createdAt).getTime()
      timeDiffs.push(diff / (1000 * 60 * 60 * 24)) // Convert to days
    }

    const avgTimeBetween = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length
    const variance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgTimeBetween, 2), 0) / timeDiffs.length

    if (variance > avgTimeBetween * 2) {
      return {
        type: 'sporadic_activity',
        confidence: 0.8,
        description: 'Lead shows irregular activity patterns',
        evidence: [`High variance in activity timing (${variance.toFixed(1)} days)`],
        timeframe: {
          start: new Date(activities[activities.length - 1].createdAt),
          end: new Date(activities[0].createdAt)
        }
      }
    }

    return null
  }

  private analyzeConversationPatterns(conversations: Conversation[]): BehaviorPattern | null {
    if (conversations.length < 2) return null

    // Analyze conversation sentiment progression
    const sentiments = conversations.map(c => {
      const sentiment = (c.sentiment as any)?.overall || 'neutral'
      return sentiment === 'positive' ? 1 : sentiment === 'negative' ? -1 : 0
    })

    const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length

    if (avgSentiment > 0.3) {
      return {
        type: 'high_intent',
        confidence: 0.8,
        description: 'Conversations show high buying intent',
        evidence: ['Positive sentiment trend in conversations'],
        timeframe: {
          start: new Date(conversations[conversations.length - 1].createdAt),
          end: new Date(conversations[0].createdAt)
        }
      }
    }

    return null
  }

  private analyzeContentConsumption(activities: Activity[]): BehaviorPattern | null {
    const contentActivities = activities.filter(a => 
      a.type === 'email_opened' || a.type === 'content_downloaded' || a.type === 'page_viewed'
    )

    if (contentActivities.length >= 3) {
      return {
        type: 'research_phase',
        confidence: 0.7,
        description: 'Lead is actively researching and consuming content',
        evidence: [`${contentActivities.length} content consumption activities`],
        timeframe: {
          start: new Date(contentActivities[contentActivities.length - 1].createdAt),
          end: new Date(contentActivities[0].createdAt)
        }
      }
    }

    return null
  }

  private determineCurrentStage(profile: LeadBehaviorProfile): JourneyStage {
    const { activities, conversations } = profile
    const allActivities = [...activities, ...conversations.map(c => ({ ...c, type: 'conversation' as any }))]
    
    // Score each stage based on activity types
    const stageScores: { [key: string]: number } = {
      awareness: 0,
      interest: 0,
      consideration: 0,
      intent: 0,
      evaluation: 0,
      purchase: 0
    }

    allActivities.forEach(activity => {
      const activityType = activity.type.toString().toLowerCase()
      
      // Awareness indicators
      if (['page_viewed', 'content_downloaded', 'social_interaction'].includes(activityType)) {
        stageScores.awareness += 1
      }
      
      // Interest indicators
      if (['email_opened', 'multiple_visits', 'content_engagement'].includes(activityType)) {
        stageScores.interest += 1
      }
      
      // Consideration indicators
      if (['demo_requested', 'pricing_inquiry', 'feature_question'].includes(activityType)) {
        stageScores.consideration += 2
      }
      
      // Intent indicators
      if (['trial_signup', 'proposal_request', 'budget_discussion'].includes(activityType)) {
        stageScores.intent += 3
      }
      
      // Evaluation indicators
      if (['competitor_comparison', 'technical_question', 'stakeholder_meeting'].includes(activityType)) {
        stageScores.evaluation += 3
      }
      
      // Purchase indicators
      if (['contract_review', 'implementation_planning', 'purchase_order'].includes(activityType)) {
        stageScores.purchase += 5
      }
    })

    // Find the stage with highest score
    const sortedStages = Object.entries(stageScores)
      .sort(([, a], [, b]) => b - a)

    const currentStage = sortedStages[0][0] as any
    const stageScore = sortedStages[0][1]
    const confidence = Math.min(0.95, stageScore / Math.max(1, allActivities.length))

    // Calculate time in current stage
    const stageActivities = allActivities.filter(a => {
      const indicators = this.stageIndicators[currentStage] || []
      return indicators.some(indicator => 
        a.type.toString().toLowerCase().includes(indicator.replace(' ', '_'))
      )
    })

    const timeInStage = stageActivities.length > 0 
      ? (Date.now() - new Date(stageActivities[stageActivities.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0

    return {
      current: currentStage,
      confidence,
      timeInStage,
      progressIndicators: this.getProgressIndicators(currentStage, activities),
      blockers: this.identifyBlockers(currentStage, activities)
    }
  }

  private getProgressIndicators(stage: string, activities: Activity[]): string[] {
    const indicators: string[] = []
    
    switch (stage) {
      case 'awareness':
        if (activities.some(a => a.type === 'email_opened')) indicators.push('Email engagement')
        if (activities.some(a => a.type === 'page_viewed')) indicators.push('Website visits')
        break
      case 'interest':
        if (activities.some(a => a.type === 'content_downloaded')) indicators.push('Content downloads')
        if (activities.length > 3) indicators.push('Multiple touchpoints')
        break
      case 'consideration':
        if (activities.some(a => a.type === 'demo_requested')) indicators.push('Demo interest')
        if (activities.some(a => a.type === 'pricing_inquiry')) indicators.push('Pricing questions')
        break
    }
    
    return indicators
  }

  private identifyBlockers(stage: string, activities: Activity[]): string[] {
    const blockers: string[] = []
    
    // Generic blockers
    const lastActivity = activities[0]
    if (lastActivity) {
      const daysSinceLastActivity = (Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastActivity > 7) {
        blockers.push('No recent activity')
      }
    }
    
    // Stage-specific blockers
    switch (stage) {
      case 'consideration':
        if (!activities.some(a => a.type === 'demo_requested')) {
          blockers.push('No demo scheduled')
        }
        break
      case 'intent':
        if (!activities.some(a => a.type === 'proposal_request')) {
          blockers.push('No proposal requested')
        }
        break
    }
    
    return blockers
  }

  private predictNextSteps(
    profile: LeadBehaviorProfile, 
    patterns: BehaviorPattern[], 
    currentStage: JourneyStage
  ): PredictedPath {
    const stageProgression = {
      awareness: 'interest',
      interest: 'consideration',
      consideration: 'intent',
      intent: 'evaluation',
      evaluation: 'purchase',
      purchase: 'purchase'
    }

    const nextStage = stageProgression[currentStage.current] || 'interest'
    
    // Calculate probability based on patterns and current stage confidence
    let probability = currentStage.confidence * 0.7
    
    // Adjust based on patterns
    if (patterns.some(p => p.type === 'engagement_increasing')) {
      probability += 0.2
    }
    if (patterns.some(p => p.type === 'high_intent')) {
      probability += 0.3
    }
    if (patterns.some(p => p.type === 'engagement_decreasing')) {
      probability -= 0.3
    }

    probability = Math.min(0.95, Math.max(0.05, probability))

    // Estimate time to next stage
    const avgTimeInStage = {
      awareness: 14,
      interest: 21,
      consideration: 30,
      intent: 14,
      evaluation: 21,
      purchase: 7
    }

    const baseTime = avgTimeInStage[currentStage.current] || 21
    let timeToNextStage = baseTime - currentStage.timeInStage

    // Adjust based on engagement patterns
    if (patterns.some(p => p.type === 'engagement_increasing')) {
      timeToNextStage *= 0.7
    }
    if (patterns.some(p => p.type === 'engagement_decreasing')) {
      timeToNextStage *= 1.5
    }

    timeToNextStage = Math.max(1, timeToNextStage)

    return {
      nextStage,
      probability,
      timeToNextStage,
      requiredActions: this.getRequiredActions(currentStage.current, nextStage),
      riskFactors: this.getRiskFactors(patterns, currentStage)
    }
  }

  private getRequiredActions(currentStage: string, nextStage: string): string[] {
    const actionMap: { [key: string]: string[] } = {
      'awareness->interest': ['Send educational content', 'Schedule discovery call'],
      'interest->consideration': ['Provide product demo', 'Share case studies'],
      'consideration->intent': ['Present pricing options', 'Discuss implementation'],
      'intent->evaluation': ['Provide trial access', 'Connect with technical team'],
      'evaluation->purchase': ['Prepare contract', 'Schedule closing call']
    }

    return actionMap[`${currentStage}->${nextStage}`] || ['Follow up with lead']
  }

  private getRiskFactors(patterns: BehaviorPattern[], currentStage: JourneyStage): string[] {
    const risks: string[] = []

    if (patterns.some(p => p.type === 'engagement_decreasing')) {
      risks.push('Decreasing engagement trend')
    }

    if (currentStage.timeInStage > 30) {
      risks.push('Extended time in current stage')
    }

    if (currentStage.blockers.length > 0) {
      risks.push('Multiple blockers identified')
    }

    return risks
  }

  private calculateEngagementScore(profile: LeadBehaviorProfile): number {
    const { activities, conversations } = profile
    const totalInteractions = activities.length + conversations.length

    // Base score from interaction count
    let score = Math.min(50, totalInteractions * 2)

    // Bonus for recent activity
    const recentActivities = activities.filter(a => 
      new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
    score += Math.min(25, recentActivities.length * 5)

    // Bonus for conversation engagement
    score += Math.min(25, conversations.length * 3)

    return Math.min(100, score)
  }

  private calculateVelocityScore(profile: LeadBehaviorProfile): number {
    const { activities } = profile
    
    if (activities.length < 2) return 0

    // Calculate time between first and last activity
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    const timeSpan = new Date(sortedActivities[sortedActivities.length - 1].createdAt).getTime() - 
                    new Date(sortedActivities[0].createdAt).getTime()
    const days = timeSpan / (1000 * 60 * 60 * 24)

    // Calculate velocity (activities per day)
    const velocity = activities.length / Math.max(1, days)

    // Convert to 0-100 score
    return Math.min(100, velocity * 20)
  }

  private generateRecommendations(
    patterns: BehaviorPattern[], 
    currentStage: JourneyStage, 
    predictedPath: PredictedPath
  ): string[] {
    const recommendations: string[] = []

    // Pattern-based recommendations
    if (patterns.some(p => p.type === 'engagement_decreasing')) {
      recommendations.push('Re-engage with personalized outreach')
      recommendations.push('Address potential concerns or objections')
    }

    if (patterns.some(p => p.type === 'high_intent')) {
      recommendations.push('Accelerate sales process')
      recommendations.push('Prepare proposal or demo')
    }

    // Stage-based recommendations
    recommendations.push(...predictedPath.requiredActions)

    // Risk mitigation
    if (predictedPath.riskFactors.length > 0) {
      recommendations.push('Address identified risk factors')
    }

    return [...new Set(recommendations)] // Remove duplicates
  }

  private detectAnomalies(profile: LeadBehaviorProfile, patterns: BehaviorPattern[]): string[] {
    const anomalies: string[] = []
    const { activities, lead } = profile

    // Unusual activity spikes
    const recentActivities = activities.filter(a => 
      new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    if (recentActivities.length > activities.length * 0.5) {
      anomalies.push('Unusual spike in recent activity')
    }

    // Long periods of inactivity
    if (activities.length > 0) {
      const lastActivity = activities[0]
      const daysSinceLastActivity = (Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceLastActivity > 30) {
        anomalies.push('Extended period of inactivity')
      }
    }

    // Inconsistent patterns
    if (patterns.some(p => p.type === 'sporadic_activity')) {
      anomalies.push('Irregular engagement patterns detected')
    }

    return anomalies
  }
}
