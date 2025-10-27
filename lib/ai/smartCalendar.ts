// Lead AI Pro - Smart Calendar & Follow-up Management (2025)
// AI-powered scheduling and multi-channel follow-up automation

import { OpenAI } from 'openai'

export interface SmartCalendarEvent {
  id: string
  type: 'follow_up_call' | 'demo' | 'meeting' | 'email_sequence' | 'task' | 'reminder'
  title: string
  description: string
  leadId: string
  assignedTo: string
  scheduledFor: Date
  duration: number // minutes
  channel: 'phone' | 'email' | 'zoom' | 'in_person' | 'teams' | 'slack'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'
  
  // AI-powered features
  aiGenerated: boolean
  optimalTiming: {
    confidence: number
    reasoning: string[]
    alternativeTimes: Date[]
  }
  
  // Follow-up specific
  followUpSequence?: {
    sequenceId: string
    stepNumber: number
    totalSteps: number
    nextStep?: SmartCalendarEvent
  }
  
  // Meeting details
  meetingDetails?: {
    location?: string
    meetingUrl?: string
    agenda: string[]
    attendees: string[]
    preparationNotes: string[]
  }
  
  // Automation
  automation: {
    autoReminders: boolean
    reminderTimes: number[] // minutes before event
    autoReschedule: boolean
    maxReschedules: number
    rescheduleCount: number
  }
  
  // Analytics
  engagement: {
    remindersSent: number
    responseTime?: number
    attendanceRate?: number
    outcomeScore?: number
  }
  
  createdAt: Date
  updatedAt: Date
}

export interface FollowUpSequence {
  id: string
  name: string
  description: string
  leadId: string
  triggerEvent: 'lead_created' | 'demo_completed' | 'proposal_sent' | 'no_response' | 'meeting_completed'
  
  steps: FollowUpStep[]
  
  settings: {
    stopOnReply: boolean
    stopOnMeeting: boolean
    respectBusinessHours: boolean
    timezone: string
    maxDuration: number // days
  }
  
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  
  performance: {
    leadsEntered: number
    completionRate: number
    responseRate: number
    meetingRate: number
    averageResponseTime: number
  }
  
  createdAt: Date
  updatedAt: Date
}

export interface FollowUpStep {
  id: string
  stepNumber: number
  type: 'email' | 'call' | 'meeting' | 'task' | 'sms' | 'linkedin'
  title: string
  content: string
  
  timing: {
    delay: number // hours after previous step
    preferredTime?: string // HH:MM format
    daysOfWeek?: number[] // 0-6, Sunday = 0
  }
  
  conditions?: {
    leadScore?: { min?: number; max?: number }
    engagement?: 'high' | 'medium' | 'low'
    previousStepOutcome?: string[]
  }
  
  automation: {
    autoExecute: boolean
    requiresApproval: boolean
    template?: string
  }
  
  aiPersonalization: {
    enabled: boolean
    contextFactors: string[]
    personalizationLevel: 'basic' | 'advanced' | 'custom'
  }
}

export interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'apple' | 'calendly' | 'hubspot'
  accountId: string
  calendarId: string
  syncEnabled: boolean
  lastSyncAt?: Date
  settings: {
    autoCreateEvents: boolean
    syncDirection: 'one_way' | 'two_way'
    conflictResolution: 'manual' | 'auto_reschedule' | 'notify'
  }
}

export interface OptimalTimingAnalysis {
  leadId: string
  recommendedTimes: {
    dayOfWeek: number
    hour: number
    confidence: number
    reasoning: string
  }[]
  
  patterns: {
    emailOpenTimes: number[]
    callAnswerTimes: number[]
    meetingPreferences: string[]
    responseDelays: number[]
  }
  
  timezone: string
  businessHours: {
    start: string
    end: string
    daysOfWeek: number[]
  }
  
  lastAnalyzed: Date
  confidence: number
}

export class SmartCalendarSystem {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  // AI-powered optimal timing analysis
  async analyzeOptimalTiming(leadId: string, historicalData: any): Promise<OptimalTimingAnalysis> {
    const prompt = `
Analyze this lead's historical interaction data to determine optimal follow-up timing:

Lead Data:
${JSON.stringify(historicalData, null, 2)}

Analyze patterns for:
- Email open times and response rates
- Call answer rates by time/day
- Meeting attendance and preferences
- Response delays and engagement patterns

Return JSON with optimal timing recommendations:
{
  "recommendedTimes": [
    {
      "dayOfWeek": 2,
      "hour": 10,
      "confidence": 0.85,
      "reasoning": "High email open rate on Tuesdays at 10 AM"
    }
  ],
  "patterns": {
    "emailOpenTimes": [9, 10, 14, 16],
    "callAnswerTimes": [10, 11, 15],
    "meetingPreferences": ["morning", "early_afternoon"],
    "responseDelays": [2, 4, 24]
  },
  "timezone": "America/New_York",
  "businessHours": {
    "start": "09:00",
    "end": "17:00",
    "daysOfWeek": [1, 2, 3, 4, 5]
  },
  "confidence": 0.8
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      })

      const analysis = JSON.parse(response.choices[0].message.content || '{}')

      return {
        leadId,
        ...analysis,
        lastAnalyzed: new Date()
      }
    } catch (error) {
      console.error('Optimal timing analysis failed:', error)
      throw new Error('Failed to analyze optimal timing')
    }
  }

  // Generate intelligent follow-up sequence
  async generateFollowUpSequence(
    leadData: any,
    objective: string,
    duration: number = 14 // days
  ): Promise<FollowUpSequence> {
    const prompt = `
Create an intelligent follow-up sequence for this lead:

Lead Data:
${JSON.stringify(leadData, null, 2)}

Objective: ${objective}
Duration: ${duration} days

Create a sequence with 5-7 steps using multiple channels (email, calls, meetings).
Consider:
- Lead's engagement level and preferences
- Optimal timing based on industry and role
- Escalation pattern from low-touch to high-touch
- Value-driven content at each step
- Clear calls-to-action

Return JSON:
{
  "name": "Sequence name",
  "description": "Sequence description",
  "steps": [
    {
      "stepNumber": 1,
      "type": "email",
      "title": "Initial follow-up",
      "content": "Email content with personalization",
      "timing": {
        "delay": 24,
        "preferredTime": "10:00"
      },
      "automation": {
        "autoExecute": true,
        "requiresApproval": false
      },
      "aiPersonalization": {
        "enabled": true,
        "contextFactors": ["company_news", "role_specific"],
        "personalizationLevel": "advanced"
      }
    }
  ],
  "settings": {
    "stopOnReply": true,
    "stopOnMeeting": true,
    "respectBusinessHours": true,
    "timezone": "America/New_York",
    "maxDuration": ${duration}
  }
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2000
      })

      const sequenceData = JSON.parse(response.choices[0].message.content || '{}')

      return {
        id: this.generateSequenceId(),
        leadId: leadData.id,
        triggerEvent: 'lead_created',
        status: 'active',
        performance: {
          leadsEntered: 0,
          completionRate: 0,
          responseRate: 0,
          meetingRate: 0,
          averageResponseTime: 0
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...sequenceData
      }
    } catch (error) {
      console.error('Follow-up sequence generation failed:', error)
      throw new Error('Failed to generate follow-up sequence')
    }
  }

  // Schedule smart calendar event with AI optimization
  async scheduleSmartEvent(
    eventData: Partial<SmartCalendarEvent>,
    leadData: any,
    preferences?: any
  ): Promise<SmartCalendarEvent> {
    // Analyze optimal timing
    const timingAnalysis = await this.analyzeOptimalTiming(eventData.leadId!, leadData)
    
    // Find optimal time slot
    const optimalTime = await this.findOptimalTimeSlot(
      eventData.scheduledFor!,
      eventData.duration || 30,
      timingAnalysis,
      preferences
    )

    // Generate AI-powered agenda and preparation notes
    const meetingDetails = await this.generateMeetingDetails(eventData, leadData)

    return {
      id: this.generateEventId(),
      type: eventData.type || 'follow_up_call',
      title: eventData.title || 'Follow-up Call',
      description: eventData.description || '',
      leadId: eventData.leadId!,
      assignedTo: eventData.assignedTo || 'system',
      scheduledFor: optimalTime.recommendedTime,
      duration: eventData.duration || 30,
      channel: eventData.channel || 'phone',
      priority: eventData.priority || 'medium',
      status: 'scheduled',
      aiGenerated: true,
      optimalTiming: {
        confidence: optimalTime.confidence,
        reasoning: optimalTime.reasoning,
        alternativeTimes: optimalTime.alternatives
      },
      meetingDetails,
      automation: {
        autoReminders: true,
        reminderTimes: [1440, 60, 15], // 1 day, 1 hour, 15 minutes
        autoReschedule: false,
        maxReschedules: 2,
        rescheduleCount: 0
      },
      engagement: {
        remindersSent: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  // Execute follow-up sequence step
  async executeFollowUpStep(
    sequence: FollowUpSequence,
    step: FollowUpStep,
    leadData: any
  ): Promise<SmartCalendarEvent> {
    // Check conditions
    if (!this.stepConditionsMet(step, leadData)) {
      throw new Error('Step conditions not met')
    }

    // Calculate execution time
    const executionTime = this.calculateStepExecutionTime(step, sequence.settings)

    // Personalize content if AI personalization is enabled
    let personalizedContent = step.content
    if (step.aiPersonalization.enabled) {
      personalizedContent = await this.personalizeStepContent(step, leadData)
    }

    // Create calendar event for this step
    const event = await this.scheduleSmartEvent({
      type: this.mapStepTypeToEventType(step.type),
      title: step.title,
      description: personalizedContent,
      leadId: sequence.leadId,
      scheduledFor: executionTime,
      channel: this.mapStepTypeToChannel(step.type),
      followUpSequence: {
        sequenceId: sequence.id,
        stepNumber: step.stepNumber,
        totalSteps: sequence.steps.length
      }
    }, leadData)

    // Execute step if auto-execution is enabled
    if (step.automation.autoExecute && !step.automation.requiresApproval) {
      await this.executeStep(event, step)
    }

    return event
  }

  // Smart rescheduling with AI
  async smartReschedule(
    eventId: string,
    reason: 'conflict' | 'no_response' | 'request' | 'optimization',
    leadData?: any
  ): Promise<SmartCalendarEvent> {
    const event = await this.getEvent(eventId)
    if (!event) throw new Error('Event not found')

    // Analyze rescheduling patterns and preferences
    const rescheduleAnalysis = await this.analyzeReschedulePatterns(event, reason, leadData)

    // Find new optimal time
    const newTime = await this.findOptimalTimeSlot(
      new Date(Date.now() + 24 * 60 * 60 * 1000), // Start from tomorrow
      event.duration,
      rescheduleAnalysis.timingAnalysis,
      rescheduleAnalysis.preferences
    )

    // Update event
    event.scheduledFor = newTime.recommendedTime
    event.status = 'rescheduled'
    event.automation.rescheduleCount++
    event.optimalTiming = {
      confidence: newTime.confidence,
      reasoning: [...event.optimalTiming.reasoning, `Rescheduled due to ${reason}`],
      alternativeTimes: newTime.alternatives
    }
    event.updatedAt = new Date()

    return event
  }

  // Generate meeting agenda and preparation notes
  private async generateMeetingDetails(
    eventData: Partial<SmartCalendarEvent>,
    leadData: any
  ): Promise<SmartCalendarEvent['meetingDetails']> {
    const prompt = `
Generate meeting agenda and preparation notes for this event:

Event Type: ${eventData.type}
Event Title: ${eventData.title}
Duration: ${eventData.duration} minutes

Lead Data:
${JSON.stringify(leadData, null, 2)}

Create:
1. Detailed agenda with time allocations
2. Preparation notes for the sales rep
3. Key talking points and questions
4. Potential objections and responses

Return JSON:
{
  "agenda": ["5 min: Introductions", "15 min: Discovery", "10 min: Demo"],
  "preparationNotes": ["Review lead's recent activity", "Prepare demo environment"],
  "attendees": ["lead_email@company.com"]
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      })

      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      console.error('Meeting details generation failed:', error)
      return {
        agenda: ['Introduction', 'Discussion', 'Next Steps'],
        attendees: [],
        preparationNotes: ['Review lead information']
      }
    }
  }

  // Find optimal time slot considering multiple factors
  private async findOptimalTimeSlot(
    preferredTime: Date,
    duration: number,
    timingAnalysis: OptimalTimingAnalysis,
    preferences?: any
  ): Promise<{
    recommendedTime: Date
    confidence: number
    reasoning: string[]
    alternatives: Date[]
  }> {
    const reasoning: string[] = []
    let confidence = 0.5

    // Start with preferred time
    let recommendedTime = new Date(preferredTime)

    // Adjust based on timing analysis
    const optimalHours = timingAnalysis.recommendedTimes
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)

    if (optimalHours.length > 0) {
      const bestTime = optimalHours[0]
      recommendedTime.setHours(bestTime.hour, 0, 0, 0)
      
      // Adjust day of week if needed
      const dayDiff = bestTime.dayOfWeek - recommendedTime.getDay()
      if (dayDiff !== 0) {
        recommendedTime.setDate(recommendedTime.getDate() + dayDiff)
      }

      confidence = bestTime.confidence
      reasoning.push(bestTime.reasoning)
    }

    // Ensure it's within business hours
    const businessStart = parseInt(timingAnalysis.businessHours.start.split(':')[0])
    const businessEnd = parseInt(timingAnalysis.businessHours.end.split(':')[0])
    
    if (recommendedTime.getHours() < businessStart) {
      recommendedTime.setHours(businessStart)
      reasoning.push('Adjusted to business hours start')
    } else if (recommendedTime.getHours() >= businessEnd) {
      recommendedTime.setHours(businessStart)
      recommendedTime.setDate(recommendedTime.getDate() + 1)
      reasoning.push('Moved to next business day')
    }

    // Generate alternatives
    const alternatives: Date[] = []
    for (let i = 1; i <= 3; i++) {
      const alt = new Date(recommendedTime)
      alt.setHours(alt.getHours() + i * 2)
      alternatives.push(alt)
    }

    return {
      recommendedTime,
      confidence,
      reasoning,
      alternatives
    }
  }

  // Helper methods
  private stepConditionsMet(step: FollowUpStep, leadData: any): boolean {
    if (!step.conditions) return true

    // Check lead score conditions
    if (step.conditions.leadScore) {
      const score = leadData.score || 0
      if (step.conditions.leadScore.min && score < step.conditions.leadScore.min) return false
      if (step.conditions.leadScore.max && score > step.conditions.leadScore.max) return false
    }

    // Check engagement conditions
    if (step.conditions.engagement) {
      const engagement = leadData.engagement || 'low'
      if (engagement !== step.conditions.engagement) return false
    }

    return true
  }

  private calculateStepExecutionTime(step: FollowUpStep, settings: FollowUpSequence['settings']): Date {
    const now = new Date()
    const executionTime = new Date(now.getTime() + step.timing.delay * 60 * 60 * 1000)

    // Adjust for preferred time
    if (step.timing.preferredTime) {
      const [hours, minutes] = step.timing.preferredTime.split(':').map(Number)
      executionTime.setHours(hours, minutes, 0, 0)
    }

    // Adjust for days of week
    if (step.timing.daysOfWeek) {
      while (!step.timing.daysOfWeek.includes(executionTime.getDay())) {
        executionTime.setDate(executionTime.getDate() + 1)
      }
    }

    return executionTime
  }

  private async personalizeStepContent(step: FollowUpStep, leadData: any): Promise<string> {
    const prompt = `
Personalize this follow-up step content for the specific lead:

Original Content: ${step.content}
Step Type: ${step.type}
Personalization Level: ${step.aiPersonalization.personalizationLevel}
Context Factors: ${step.aiPersonalization.contextFactors.join(', ')}

Lead Data:
${JSON.stringify(leadData, null, 2)}

Return personalized content that:
- Includes relevant context from lead data
- Maintains the original intent and CTA
- Feels natural and conversational
- Addresses lead's specific situation
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 600
      })

      return response.choices[0].message.content || step.content
    } catch (error) {
      console.error('Content personalization failed:', error)
      return step.content
    }
  }

  private mapStepTypeToEventType(stepType: string): SmartCalendarEvent['type'] {
    const mapping: Record<string, SmartCalendarEvent['type']> = {
      'email': 'email_sequence',
      'call': 'follow_up_call',
      'meeting': 'meeting',
      'task': 'task',
      'sms': 'reminder',
      'linkedin': 'task'
    }
    return mapping[stepType] || 'task'
  }

  private mapStepTypeToChannel(stepType: string): SmartCalendarEvent['channel'] {
    const mapping: Record<string, SmartCalendarEvent['channel']> = {
      'email': 'email',
      'call': 'phone',
      'meeting': 'zoom',
      'task': 'email',
      'sms': 'phone',
      'linkedin': 'email'
    }
    return mapping[stepType] || 'email'
  }

  private async executeStep(event: SmartCalendarEvent, step: FollowUpStep): Promise<void> {
    // Execute the step based on type
    switch (step.type) {
      case 'email':
        await this.sendEmail(event)
        break
      case 'call':
        await this.scheduleCall(event)
        break
      case 'meeting':
        await this.scheduleMeeting(event)
        break
      case 'task':
        await this.createTask(event)
        break
    }

    event.status = 'completed'
    event.updatedAt = new Date()
  }

  private async analyzeReschedulePatterns(
    event: SmartCalendarEvent,
    reason: string,
    leadData?: any
  ): Promise<any> {
    // Analyze patterns and return recommendations
    return {
      timingAnalysis: await this.analyzeOptimalTiming(event.leadId, leadData),
      preferences: { flexibleTiming: true }
    }
  }

  private async sendEmail(event: SmartCalendarEvent): Promise<void> {
    console.log('Sending email for event:', event.id)
  }

  private async scheduleCall(event: SmartCalendarEvent): Promise<void> {
    console.log('Scheduling call for event:', event.id)
  }

  private async scheduleMeeting(event: SmartCalendarEvent): Promise<void> {
    console.log('Scheduling meeting for event:', event.id)
  }

  private async createTask(event: SmartCalendarEvent): Promise<void> {
    console.log('Creating task for event:', event.id)
  }

  private async getEvent(eventId: string): Promise<SmartCalendarEvent | null> {
    // Fetch from database
    return null
  }

  private generateSequenceId(): string {
    return `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export { SmartCalendarSystem }
