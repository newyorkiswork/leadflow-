// LeadAI Pro - Intelligent Routing Engine
// AI-powered lead assignment and routing optimization

import { Lead, User } from '@prisma/client'

// Interfaces
export interface SalesRepProfile {
  user: User
  expertise: string[]
  performance: {
    conversionRate: number
    averageDealSize: number
    responseTime: number // hours
    customerSatisfaction: number
  }
  workload: {
    currentLeads: number
    capacity: number
    availability: 'available' | 'busy' | 'unavailable'
  }
  preferences: {
    industries: string[]
    leadSources: string[]
    dealSizes: string[]
  }
}

export interface RoutingCriteria {
  leadProfile: {
    industry?: string
    dealSize?: number
    source?: string
    urgency?: 'low' | 'medium' | 'high'
    complexity?: 'simple' | 'medium' | 'complex'
  }
  constraints: {
    requireExpertise?: string[]
    excludeReps?: string[]
    maxWorkload?: number
    responseTimeRequired?: number
  }
}

export interface RoutingRecommendation {
  primaryAssignment: {
    repId: string
    repName: string
    confidence: number
    reasoning: string[]
    expectedOutcome: {
      conversionProbability: number
      estimatedDealSize: number
      expectedCloseTime: number // days
    }
  }
  alternativeOptions: Array<{
    repId: string
    repName: string
    confidence: number
    reasoning: string[]
  }>
  routingScore: number
  riskFactors: string[]
}

export class IntelligentRoutingEngine {
  private industryExpertise = {
    'technology': ['software', 'saas', 'it services', 'cybersecurity'],
    'healthcare': ['medical devices', 'pharmaceuticals', 'healthcare services'],
    'finance': ['banking', 'insurance', 'fintech', 'investment'],
    'manufacturing': ['industrial', 'automotive', 'aerospace', 'chemicals'],
    'retail': ['e-commerce', 'consumer goods', 'fashion', 'food & beverage']
  }

  async findOptimalAssignment(
    lead: Lead,
    availableReps: SalesRepProfile[],
    criteria: RoutingCriteria
  ): Promise<RoutingRecommendation> {
    // Score each rep for this lead
    const repScores = await Promise.all(
      availableReps.map(rep => this.scoreRepForLead(lead, rep, criteria))
    )

    // Sort by score
    const sortedReps = repScores.sort((a, b) => b.totalScore - a.totalScore)

    // Build recommendation
    const primaryAssignment = sortedReps[0]
    const alternativeOptions = sortedReps.slice(1, 4) // Top 3 alternatives

    return {
      primaryAssignment: {
        repId: primaryAssignment.repId,
        repName: primaryAssignment.repName,
        confidence: primaryAssignment.confidence,
        reasoning: primaryAssignment.reasoning,
        expectedOutcome: primaryAssignment.expectedOutcome
      },
      alternativeOptions: alternativeOptions.map(rep => ({
        repId: rep.repId,
        repName: rep.repName,
        confidence: rep.confidence,
        reasoning: rep.reasoning
      })),
      routingScore: primaryAssignment.totalScore,
      riskFactors: this.identifyRoutingRisks(lead, primaryAssignment, criteria)
    }
  }

  private async scoreRepForLead(
    lead: Lead,
    rep: SalesRepProfile,
    criteria: RoutingCriteria
  ): Promise<{
    repId: string
    repName: string
    totalScore: number
    confidence: number
    reasoning: string[]
    expectedOutcome: {
      conversionProbability: number
      estimatedDealSize: number
      expectedCloseTime: number
    }
  }> {
    const scores = {
      expertise: this.scoreExpertiseMatch(lead, rep, criteria),
      performance: this.scorePerformance(rep),
      workload: this.scoreWorkloadCapacity(rep),
      preferences: this.scorePreferences(lead, rep),
      availability: this.scoreAvailability(rep, criteria)
    }

    const weights = {
      expertise: 0.3,
      performance: 0.25,
      workload: 0.2,
      preferences: 0.15,
      availability: 0.1
    }

    const totalScore = Object.entries(scores).reduce(
      (sum, [key, score]) => sum + score * weights[key as keyof typeof weights],
      0
    )

    const confidence = this.calculateConfidence(scores, lead, rep)
    const reasoning = this.generateReasoning(scores, lead, rep)
    const expectedOutcome = this.predictOutcome(lead, rep, totalScore)

    return {
      repId: rep.user.id,
      repName: rep.user.fullName,
      totalScore,
      confidence,
      reasoning,
      expectedOutcome
    }
  }

  private scoreExpertiseMatch(
    lead: Lead,
    rep: SalesRepProfile,
    criteria: RoutingCriteria
  ): number {
    let score = 0

    // Industry expertise
    const leadIndustry = criteria.leadProfile.industry || lead.industry
    if (leadIndustry) {
      const industryMatch = rep.expertise.some(expertise =>
        expertise.toLowerCase().includes(leadIndustry.toLowerCase()) ||
        this.industryExpertise[leadIndustry.toLowerCase()]?.includes(expertise.toLowerCase())
      )
      if (industryMatch) score += 40
    }

    // Deal size expertise
    const dealSize = criteria.leadProfile.dealSize || lead.predictedValue?.toNumber() || 0
    if (dealSize > 0) {
      const dealSizeCategory = this.categorizeDealSize(dealSize)
      if (rep.preferences.dealSizes.includes(dealSizeCategory)) {
        score += 30
      }
    }

    // Required expertise
    if (criteria.constraints.requireExpertise) {
      const hasRequiredExpertise = criteria.constraints.requireExpertise.every(required =>
        rep.expertise.some(expertise =>
          expertise.toLowerCase().includes(required.toLowerCase())
        )
      )
      if (hasRequiredExpertise) score += 30
      else score -= 50 // Heavy penalty for missing required expertise
    }

    return Math.max(0, Math.min(100, score))
  }

  private scorePerformance(rep: SalesRepProfile): number {
    const { performance } = rep
    
    // Weighted performance score
    const conversionScore = performance.conversionRate * 40 // 0-40 points
    const dealSizeScore = Math.min(30, (performance.averageDealSize / 50000) * 30) // 0-30 points
    const responseScore = Math.max(0, 20 - (performance.responseTime / 2)) // 0-20 points (faster = better)
    const satisfactionScore = performance.customerSatisfaction * 10 // 0-10 points

    return conversionScore + dealSizeScore + responseScore + satisfactionScore
  }

  private scoreWorkloadCapacity(rep: SalesRepProfile): number {
    const { workload } = rep
    
    if (workload.availability === 'unavailable') return 0
    if (workload.availability === 'busy') return 30

    // Calculate capacity utilization
    const utilization = workload.currentLeads / workload.capacity
    
    if (utilization >= 1) return 10 // Overloaded
    if (utilization >= 0.8) return 50 // Near capacity
    if (utilization >= 0.6) return 80 // Good utilization
    if (utilization >= 0.4) return 100 // Optimal capacity
    
    return 70 // Under-utilized
  }

  private scorePreferences(lead: Lead, rep: SalesRepProfile): number {
    let score = 50 // Base score

    // Industry preference
    const leadIndustry = lead.industry
    if (leadIndustry && rep.preferences.industries.includes(leadIndustry)) {
      score += 25
    }

    // Source preference
    const leadSource = lead.source
    if (leadSource && rep.preferences.leadSources.includes(leadSource)) {
      score += 25
    }

    return Math.min(100, score)
  }

  private scoreAvailability(rep: SalesRepProfile, criteria: RoutingCriteria): number {
    const { workload } = rep
    
    if (workload.availability === 'unavailable') return 0
    if (workload.availability === 'busy') return 40
    
    // Check response time requirements
    if (criteria.constraints.responseTimeRequired) {
      if (rep.performance.responseTime <= criteria.constraints.responseTimeRequired) {
        return 100
      } else {
        return Math.max(20, 100 - (rep.performance.responseTime - criteria.constraints.responseTimeRequired) * 10)
      }
    }

    return 80 // Available
  }

  private calculateConfidence(
    scores: { [key: string]: number },
    lead: Lead,
    rep: SalesRepProfile
  ): number {
    // Base confidence from score consistency
    const scoreValues = Object.values(scores)
    const avgScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
    const variance = scoreValues.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scoreValues.length
    
    let confidence = Math.max(0.3, 1 - (variance / 1000)) // Lower variance = higher confidence

    // Adjust based on data quality
    if (rep.performance.conversionRate > 0) confidence += 0.1
    if (rep.expertise.length > 2) confidence += 0.1
    if (lead.industry) confidence += 0.1

    return Math.min(0.95, confidence)
  }

  private generateReasoning(
    scores: { [key: string]: number },
    lead: Lead,
    rep: SalesRepProfile
  ): string[] {
    const reasoning: string[] = []

    // Expertise reasoning
    if (scores.expertise > 70) {
      reasoning.push(`Strong expertise match for ${lead.industry || 'this industry'}`)
    } else if (scores.expertise < 30) {
      reasoning.push('Limited expertise match - may need support')
    }

    // Performance reasoning
    if (scores.performance > 80) {
      reasoning.push(`Excellent track record (${(rep.performance.conversionRate * 100).toFixed(1)}% conversion rate)`)
    } else if (scores.performance < 40) {
      reasoning.push('Below-average performance metrics')
    }

    // Workload reasoning
    if (scores.workload > 80) {
      reasoning.push('Optimal capacity for new leads')
    } else if (scores.workload < 30) {
      reasoning.push('High current workload - may impact response time')
    }

    // Availability reasoning
    if (rep.workload.availability === 'available') {
      reasoning.push('Currently available for immediate assignment')
    } else if (rep.workload.availability === 'busy') {
      reasoning.push('Busy but can handle additional leads')
    }

    return reasoning
  }

  private predictOutcome(
    lead: Lead,
    rep: SalesRepProfile,
    totalScore: number
  ): {
    conversionProbability: number
    estimatedDealSize: number
    expectedCloseTime: number
  } {
    // Base conversion probability from rep's historical performance
    let conversionProbability = rep.performance.conversionRate

    // Adjust based on routing score
    const scoreMultiplier = totalScore / 100
    conversionProbability *= scoreMultiplier

    // Adjust based on lead quality (if available)
    const leadScore = lead.currentScore || 50
    const leadMultiplier = leadScore / 100
    conversionProbability *= (0.7 + 0.3 * leadMultiplier) // 70% base + 30% from lead quality

    conversionProbability = Math.min(0.95, Math.max(0.05, conversionProbability))

    // Estimate deal size
    const baseDealSize = lead.predictedValue?.toNumber() || rep.performance.averageDealSize
    const estimatedDealSize = baseDealSize * (0.8 + 0.4 * scoreMultiplier) // Adjust based on fit

    // Estimate close time
    const baseCloseTime = this.getAverageCloseTime(lead.industry || 'general')
    const responseTimeFactor = Math.max(0.5, 2 - rep.performance.responseTime / 24) // Faster response = shorter cycle
    const expectedCloseTime = baseCloseTime * responseTimeFactor

    return {
      conversionProbability,
      estimatedDealSize,
      expectedCloseTime
    }
  }

  private identifyRoutingRisks(
    lead: Lead,
    assignment: any,
    criteria: RoutingCriteria
  ): string[] {
    const risks: string[] = []

    if (assignment.confidence < 0.6) {
      risks.push('Low confidence in assignment match')
    }

    if (assignment.totalScore < 50) {
      risks.push('Suboptimal rep assignment due to constraints')
    }

    if (criteria.constraints.responseTimeRequired && assignment.expectedOutcome.expectedCloseTime > 60) {
      risks.push('Extended sales cycle expected')
    }

    const urgency = criteria.leadProfile.urgency
    if (urgency === 'high' && assignment.reasoning.includes('High current workload')) {
      risks.push('High-urgency lead assigned to busy rep')
    }

    return risks
  }

  private categorizeDealSize(dealSize: number): string {
    if (dealSize < 10000) return 'small'
    if (dealSize < 50000) return 'medium'
    if (dealSize < 200000) return 'large'
    return 'enterprise'
  }

  private getAverageCloseTime(industry: string): number {
    const closeTimes: { [key: string]: number } = {
      'technology': 45,
      'healthcare': 90,
      'finance': 60,
      'manufacturing': 75,
      'retail': 30,
      'general': 60
    }

    return closeTimes[industry.toLowerCase()] || closeTimes.general
  }

  // Utility methods for workload balancing
  async rebalanceWorkloads(reps: SalesRepProfile[]): Promise<{
    recommendations: Array<{
      action: 'reassign' | 'redistribute' | 'hire'
      details: string
      priority: 'low' | 'medium' | 'high'
    }>
  }> {
    const recommendations: Array<{
      action: 'reassign' | 'redistribute' | 'hire'
      details: string
      priority: 'low' | 'medium' | 'high'
    }> = []

    // Identify overloaded reps
    const overloadedReps = reps.filter(rep => 
      rep.workload.currentLeads / rep.workload.capacity > 0.9
    )

    // Identify underutilized reps
    const underutilizedReps = reps.filter(rep => 
      rep.workload.currentLeads / rep.workload.capacity < 0.4
    )

    if (overloadedReps.length > 0 && underutilizedReps.length > 0) {
      recommendations.push({
        action: 'redistribute',
        details: `Redistribute leads from ${overloadedReps.length} overloaded reps to ${underutilizedReps.length} underutilized reps`,
        priority: 'high'
      })
    }

    if (overloadedReps.length > underutilizedReps.length) {
      recommendations.push({
        action: 'hire',
        details: 'Consider hiring additional sales reps to handle workload',
        priority: 'medium'
      })
    }

    return { recommendations }
  }

  // Performance optimization
  async optimizeRouting(
    historicalData: Array<{
      leadId: string
      assignedRepId: string
      outcome: 'won' | 'lost'
      dealSize: number
      cycleTime: number
    }>
  ): Promise<{
    insights: string[]
    optimizations: string[]
  }> {
    const insights: string[] = []
    const optimizations: string[] = []

    // Analyze conversion rates by rep
    const repPerformance = new Map<string, { wins: number; total: number; avgDealSize: number; avgCycleTime: number }>()

    historicalData.forEach(record => {
      if (!repPerformance.has(record.assignedRepId)) {
        repPerformance.set(record.assignedRepId, { wins: 0, total: 0, avgDealSize: 0, avgCycleTime: 0 })
      }
      
      const perf = repPerformance.get(record.assignedRepId)!
      perf.total++
      if (record.outcome === 'won') perf.wins++
      perf.avgDealSize = (perf.avgDealSize * (perf.total - 1) + record.dealSize) / perf.total
      perf.avgCycleTime = (perf.avgCycleTime * (perf.total - 1) + record.cycleTime) / perf.total
    })

    // Generate insights
    const topPerformer = Array.from(repPerformance.entries())
      .sort(([, a], [, b]) => (b.wins / b.total) - (a.wins / a.total))[0]

    if (topPerformer) {
      insights.push(`Top performer has ${((topPerformer[1].wins / topPerformer[1].total) * 100).toFixed(1)}% conversion rate`)
      optimizations.push('Route high-value leads to top performers')
    }

    return { insights, optimizations }
  }
}
