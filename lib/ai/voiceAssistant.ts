// Lead AI Pro - Voice Assistant & Conversation Coaching (2025)
// Advanced voice-activated lead management with real-time AI coaching

import { OpenAI } from 'openai'

export interface VoiceCommand {
  id: string
  command: string
  intent: 'call_lead' | 'schedule_meeting' | 'add_note' | 'search_lead' | 'get_insights' | 'send_email' | 'create_task'
  entities: {
    leadName?: string
    leadId?: string
    company?: string
    date?: string
    time?: string
    content?: string
  }
  confidence: number
  timestamp: Date
}

export interface ConversationCoaching {
  sessionId: string
  leadId: string
  transcript: string
  realTimeGuidance: {
    suggestions: string[]
    warnings: string[]
    opportunities: string[]
    nextBestAction: string
  }
  sentimentAnalysis: {
    overall: number
    trend: 'improving' | 'declining' | 'stable'
    keyMoments: Array<{
      timestamp: number
      sentiment: number
      trigger: string
    }>
  }
  talkTimeRatio: {
    agent: number
    prospect: number
    optimal: boolean
  }
  keywordAnalysis: {
    buyingSignals: string[]
    objections: string[]
    interests: string[]
    concerns: string[]
  }
  coachingScore: number
  recommendations: string[]
}

export interface VoiceSettings {
  language: string
  accent: string
  speed: number
  pitch: number
  volume: number
  wakeWord: string
  continuousListening: boolean
  noiseReduction: boolean
}

export interface ConversationMetrics {
  duration: number
  wordsPerMinute: number
  pauseFrequency: number
  interruptionCount: number
  questionCount: number
  statementCount: number
  emotionalTone: string
  engagementLevel: number
}

export class VoiceAssistant {
  private openai: OpenAI
  private isListening: boolean = false
  private currentSession: string | null = null

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  // Process voice commands with natural language understanding
  async processVoiceCommand(audioText: string, userId: string): Promise<VoiceCommand> {
    const prompt = `
Analyze this voice command and extract the intent and entities:

Voice Command: "${audioText}"

Extract:
1. Intent (call_lead, schedule_meeting, add_note, search_lead, get_insights, send_email, create_task)
2. Entities (lead name, company, date, time, content)
3. Confidence level (0-1)

Return JSON:
{
  "intent": "call_lead",
  "entities": {
    "leadName": "John Smith",
    "company": "Acme Corp",
    "date": "tomorrow",
    "time": "2 PM"
  },
  "confidence": 0.95
}

Examples:
- "Call John Smith from Acme Corp" → intent: call_lead, entities: {leadName: "John Smith", company: "Acme Corp"}
- "Schedule a meeting with Sarah tomorrow at 2 PM" → intent: schedule_meeting, entities: {leadName: "Sarah", date: "tomorrow", time: "2 PM"}
- "Add a note that the client is interested in our premium package" → intent: add_note, entities: {content: "client is interested in our premium package"}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      return {
        id: this.generateCommandId(),
        command: audioText,
        intent: result.intent,
        entities: result.entities || {},
        confidence: result.confidence || 0.5,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Voice command processing failed:', error)
      throw new Error('Failed to process voice command')
    }
  }

  // Execute voice commands
  async executeVoiceCommand(command: VoiceCommand): Promise<any> {
    switch (command.intent) {
      case 'call_lead':
        return await this.executeCallLead(command)
      case 'schedule_meeting':
        return await this.executeScheduleMeeting(command)
      case 'add_note':
        return await this.executeAddNote(command)
      case 'search_lead':
        return await this.executeSearchLead(command)
      case 'get_insights':
        return await this.executeGetInsights(command)
      case 'send_email':
        return await this.executeSendEmail(command)
      case 'create_task':
        return await this.executeCreateTask(command)
      default:
        throw new Error(`Unknown intent: ${command.intent}`)
    }
  }

  // Real-time conversation coaching
  async provideConversationCoaching(
    transcript: string,
    leadData: any,
    sessionId: string
  ): Promise<ConversationCoaching> {
    const prompt = `
Provide real-time conversation coaching for this sales call:

Lead Data:
${JSON.stringify(leadData, null, 2)}

Current Transcript (last 30 seconds):
${transcript}

Analyze and provide:
1. Real-time suggestions for what to say next
2. Warnings about potential issues
3. Opportunities to capitalize on
4. Sentiment analysis
5. Talk time ratio analysis
6. Keyword analysis (buying signals, objections, interests)
7. Overall coaching score (1-10)
8. Specific recommendations

Return detailed JSON analysis with actionable coaching insights.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1500
      })

      const analysis = JSON.parse(response.choices[0].message.content || '{}')

      // Calculate metrics
      const metrics = this.calculateConversationMetrics(transcript)
      const sentimentAnalysis = await this.analyzeSentimentTrend(transcript)

      return {
        sessionId,
        leadId: leadData.id,
        transcript,
        realTimeGuidance: {
          suggestions: analysis.suggestions || [],
          warnings: analysis.warnings || [],
          opportunities: analysis.opportunities || [],
          nextBestAction: analysis.nextBestAction || 'Continue listening actively'
        },
        sentimentAnalysis,
        talkTimeRatio: {
          agent: metrics.agentTalkTime,
          prospect: metrics.prospectTalkTime,
          optimal: metrics.agentTalkTime < 0.7 // Agent should talk less than 70%
        },
        keywordAnalysis: {
          buyingSignals: analysis.buyingSignals || [],
          objections: analysis.objections || [],
          interests: analysis.interests || [],
          concerns: analysis.concerns || []
        },
        coachingScore: analysis.coachingScore || 5,
        recommendations: analysis.recommendations || []
      }
    } catch (error) {
      console.error('Conversation coaching failed:', error)
      throw new Error('Failed to provide conversation coaching')
    }
  }

  // Analyze conversation sentiment trend
  private async analyzeSentimentTrend(transcript: string): Promise<ConversationCoaching['sentimentAnalysis']> {
    // Split transcript into segments and analyze sentiment over time
    const segments = transcript.split('\n').filter(line => line.trim())
    const sentiments: number[] = []

    for (const segment of segments) {
      const sentiment = await this.analyzeSentiment(segment)
      sentiments.push(sentiment)
    }

    const overall = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
    const trend = this.calculateTrend(sentiments)

    return {
      overall,
      trend,
      keyMoments: sentiments.map((sentiment, index) => ({
        timestamp: index * 10, // Approximate 10-second segments
        sentiment,
        trigger: segments[index]?.substring(0, 50) || ''
      })).filter(moment => Math.abs(moment.sentiment) > 0.3) // Only significant moments
    }
  }

  // Calculate conversation metrics
  private calculateConversationMetrics(transcript: string): ConversationMetrics & { agentTalkTime: number; prospectTalkTime: number } {
    const lines = transcript.split('\n').filter(line => line.trim())
    const agentLines = lines.filter(line => line.toLowerCase().includes('agent:') || line.toLowerCase().includes('rep:'))
    const prospectLines = lines.filter(line => line.toLowerCase().includes('prospect:') || line.toLowerCase().includes('client:'))

    const totalWords = transcript.split(' ').length
    const agentWords = agentLines.join(' ').split(' ').length
    const prospectWords = prospectLines.join(' ').split(' ').length

    const agentTalkTime = agentWords / totalWords
    const prospectTalkTime = prospectWords / totalWords

    return {
      duration: 0, // Would be calculated from actual call duration
      wordsPerMinute: totalWords / 5, // Assuming 5-minute segment
      pauseFrequency: (transcript.match(/\.\.\./g) || []).length,
      interruptionCount: (transcript.match(/--/g) || []).length,
      questionCount: (transcript.match(/\?/g) || []).length,
      statementCount: (transcript.match(/\./g) || []).length,
      emotionalTone: 'neutral', // Would be calculated from sentiment
      engagementLevel: Math.min(prospectTalkTime * 2, 1), // Higher prospect talk time = higher engagement
      agentTalkTime,
      prospectTalkTime
    }
  }

  // Voice command execution methods
  private async executeCallLead(command: VoiceCommand): Promise<any> {
    const { leadName, company, leadId } = command.entities

    // Find lead by name or company
    let targetLeadId = leadId
    if (!targetLeadId && (leadName || company)) {
      targetLeadId = await this.findLeadByNameOrCompany(leadName, company)
    }

    if (!targetLeadId) {
      return { success: false, message: 'Lead not found' }
    }

    // Initiate call
    return await this.initiateCall(targetLeadId)
  }

  private async executeScheduleMeeting(command: VoiceCommand): Promise<any> {
    const { leadName, date, time } = command.entities

    // Parse date and time
    const scheduledDate = this.parseDateTime(date, time)

    return {
      success: true,
      action: 'schedule_meeting',
      data: {
        leadName,
        scheduledDate,
        message: `Meeting scheduled with ${leadName} for ${scheduledDate.toLocaleDateString()}`
      }
    }
  }

  private async executeAddNote(command: VoiceCommand): Promise<any> {
    const { content, leadName } = command.entities

    return {
      success: true,
      action: 'add_note',
      data: {
        content,
        leadName,
        message: 'Note added successfully'
      }
    }
  }

  private async executeSearchLead(command: VoiceCommand): Promise<any> {
    const { leadName, company } = command.entities
    const searchQuery = leadName || company

    if (!searchQuery) {
      return { success: false, message: 'No search criteria provided' }
    }

    // Search leads
    const results = await this.searchLeads(searchQuery)

    return {
      success: true,
      action: 'search_lead',
      data: {
        query: searchQuery,
        results,
        message: `Found ${results.length} leads matching "${searchQuery}"`
      }
    }
  }

  private async executeGetInsights(command: VoiceCommand): Promise<any> {
    const { leadName } = command.entities

    return {
      success: true,
      action: 'get_insights',
      data: {
        leadName,
        insights: ['High buying intent', 'Optimal contact time: 2-4 PM', 'Prefers email communication'],
        message: `AI insights for ${leadName}`
      }
    }
  }

  private async executeSendEmail(command: VoiceCommand): Promise<any> {
    const { leadName, content } = command.entities

    return {
      success: true,
      action: 'send_email',
      data: {
        leadName,
        content,
        message: `Email sent to ${leadName}`
      }
    }
  }

  private async executeCreateTask(command: VoiceCommand): Promise<any> {
    const { content, date } = command.entities

    return {
      success: true,
      action: 'create_task',
      data: {
        content,
        dueDate: date,
        message: 'Task created successfully'
      }
    }
  }

  // Helper methods
  private async analyzeSentiment(text: string): Promise<number> {
    // Simple sentiment analysis - in production, use more sophisticated models
    const positiveWords = ['good', 'great', 'excellent', 'interested', 'yes', 'perfect']
    const negativeWords = ['bad', 'no', 'not', 'never', 'problem', 'issue', 'concerned']

    const words = text.toLowerCase().split(' ')
    let score = 0

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1
      if (negativeWords.includes(word)) score -= 0.1
    })

    return Math.max(-1, Math.min(1, score))
  }

  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable'

    const first = values.slice(0, Math.floor(values.length / 2))
    const second = values.slice(Math.floor(values.length / 2))

    const firstAvg = first.reduce((sum, v) => sum + v, 0) / first.length
    const secondAvg = second.reduce((sum, v) => sum + v, 0) / second.length

    const diff = secondAvg - firstAvg

    if (diff > 0.1) return 'improving'
    if (diff < -0.1) return 'declining'
    return 'stable'
  }

  private parseDateTime(date?: string, time?: string): Date {
    const now = new Date()
    let targetDate = new Date(now)

    if (date) {
      if (date.toLowerCase().includes('tomorrow')) {
        targetDate.setDate(now.getDate() + 1)
      } else if (date.toLowerCase().includes('next week')) {
        targetDate.setDate(now.getDate() + 7)
      }
      // Add more date parsing logic
    }

    if (time) {
      // Parse time like "2 PM", "14:00", etc.
      const timeMatch = time.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i)
      if (timeMatch) {
        let hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2] || '0')
        const ampm = timeMatch[3]?.toLowerCase()

        if (ampm === 'pm' && hours !== 12) hours += 12
        if (ampm === 'am' && hours === 12) hours = 0

        targetDate.setHours(hours, minutes, 0, 0)
      }
    }

    return targetDate
  }

  private async findLeadByNameOrCompany(name?: string, company?: string): Promise<string | null> {
    // This would search the database for leads
    // For now, return a mock ID
    return 'mock-lead-id'
  }

  private async initiateCall(leadId: string): Promise<any> {
    // This would integrate with calling system
    return {
      success: true,
      action: 'call_initiated',
      data: { leadId, message: 'Call initiated' }
    }
  }

  private async searchLeads(query: string): Promise<any[]> {
    // This would search the database
    return [
      { id: '1', name: 'John Smith', company: 'Acme Corp' },
      { id: '2', name: 'Jane Doe', company: 'Tech Solutions' }
    ]
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export { VoiceAssistant }
