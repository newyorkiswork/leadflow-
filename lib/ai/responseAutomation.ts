// Lead AI Pro - Intelligent Response Automation (2025)
// AI-powered automated responses for lead inquiries

import { OpenAI } from 'openai'

export interface IncomingInquiry {
  id: string
  source: 'email' | 'website_form' | 'chat' | 'social_media' | 'phone'
  content: string
  senderInfo: {
    name?: string
    email?: string
    phone?: string
    company?: string
    website?: string
  }
  metadata: {
    timestamp: Date
    ipAddress?: string
    userAgent?: string
    referrer?: string
    utmParams?: Record<string, string>
  }
  classification: InquiryClassification
  urgency: 'low' | 'medium' | 'high' | 'critical'
  sentiment: number
  confidence: number
}

export interface InquiryClassification {
  type: 'product_inquiry' | 'pricing_request' | 'demo_request' | 'support_question' | 'complaint' | 'partnership' | 'job_inquiry' | 'spam'
  intent: 'information_seeking' | 'purchase_ready' | 'comparison_shopping' | 'problem_solving' | 'relationship_building'
  topics: string[]
  buyingStage: 'awareness' | 'consideration' | 'decision' | 'post_purchase'
  qualificationScore: number
}

export interface AutomatedResponse {
  id: string
  inquiryId: string
  responseType: 'immediate' | 'scheduled' | 'escalated'
  content: {
    subject?: string
    body: string
    attachments?: string[]
  }
  personalization: {
    level: 'basic' | 'advanced' | 'custom'
    variables: Record<string, string>
    aiGenerated: boolean
  }
  followUpActions: FollowUpAction[]
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed'
  engagement: {
    opened?: Date
    clicked?: Date
    replied?: Date
    responseContent?: string
  }
  createdAt: Date
  sentAt?: Date
}

export interface FollowUpAction {
  type: 'email' | 'call' | 'meeting' | 'task' | 'notification'
  description: string
  scheduledFor: Date
  assignedTo?: string
  priority: 'low' | 'medium' | 'high'
  automated: boolean
}

export interface ResponseTemplate {
  id: string
  name: string
  category: string
  triggers: {
    keywords: string[]
    inquiryTypes: string[]
    sentimentRange: [number, number]
    urgencyLevels: string[]
  }
  content: {
    subject: string
    body: string
    variables: string[]
  }
  personalization: {
    enabled: boolean
    aiEnhancement: boolean
    contextualInserts: string[]
  }
  followUpSequence: FollowUpAction[]
  performance: {
    used: number
    responseRate: number
    conversionRate: number
    satisfaction: number
  }
  aiGenerated: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AutomationRule {
  id: string
  name: string
  description: string
  conditions: {
    source?: string[]
    inquiryType?: string[]
    urgency?: string[]
    sentiment?: [number, number]
    keywords?: string[]
    businessHours?: boolean
  }
  actions: {
    responseTemplate?: string
    assignTo?: string
    escalate?: boolean
    delay?: number // minutes
    requireApproval?: boolean
  }
  isActive: boolean
  priority: number
  createdAt: Date
  updatedAt: Date
}

export class IntelligentResponseAutomation {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  // Classify and analyze incoming inquiries
  async classifyInquiry(inquiry: Partial<IncomingInquiry>): Promise<IncomingInquiry> {
    const prompt = `
Analyze this incoming inquiry and provide detailed classification:

Content: ${inquiry.content}
Source: ${inquiry.source}
Sender: ${JSON.stringify(inquiry.senderInfo, null, 2)}

Classify and return JSON:
{
  "classification": {
    "type": "product_inquiry|pricing_request|demo_request|support_question|complaint|partnership|job_inquiry|spam",
    "intent": "information_seeking|purchase_ready|comparison_shopping|problem_solving|relationship_building",
    "topics": ["topic1", "topic2"],
    "buyingStage": "awareness|consideration|decision|post_purchase",
    "qualificationScore": 85
  },
  "urgency": "low|medium|high|critical",
  "sentiment": 0.7,
  "confidence": 0.9,
  "keyInsights": ["insight1", "insight2"],
  "suggestedResponse": "immediate|scheduled|escalated"
}

Consider:
- Language tone and urgency indicators
- Business context and buying signals
- Qualification factors (company size, role, budget indicators)
- Sentiment and emotional state
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
        id: this.generateInquiryId(),
        source: inquiry.source || 'email',
        content: inquiry.content || '',
        senderInfo: inquiry.senderInfo || {},
        metadata: {
          timestamp: new Date(),
          ...inquiry.metadata
        },
        classification: analysis.classification,
        urgency: analysis.urgency,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence
      }
    } catch (error) {
      console.error('Inquiry classification failed:', error)
      throw new Error('Failed to classify inquiry')
    }
  }

  // Generate personalized automated response
  async generateAutomatedResponse(
    inquiry: IncomingInquiry,
    template?: ResponseTemplate
  ): Promise<AutomatedResponse> {
    let responseContent: { subject?: string; body: string }

    if (template) {
      responseContent = await this.personalizeTemplate(template, inquiry)
    } else {
      responseContent = await this.generateCustomResponse(inquiry)
    }

    const followUpActions = await this.generateFollowUpActions(inquiry)

    return {
      id: this.generateResponseId(),
      inquiryId: inquiry.id,
      responseType: this.determineResponseType(inquiry),
      content: {
        subject: responseContent.subject,
        body: responseContent.body,
        attachments: await this.selectRelevantAttachments(inquiry)
      },
      personalization: {
        level: 'advanced',
        variables: this.extractPersonalizationVariables(inquiry),
        aiGenerated: true
      },
      followUpActions,
      deliveryStatus: 'pending',
      engagement: {},
      createdAt: new Date()
    }
  }

  // Personalize response template with AI
  private async personalizeTemplate(
    template: ResponseTemplate,
    inquiry: IncomingInquiry
  ): Promise<{ subject?: string; body: string }> {
    const prompt = `
Personalize this response template for the specific inquiry:

Template Subject: ${template.content.subject}
Template Body: ${template.content.body}

Inquiry Details:
- Type: ${inquiry.classification.type}
- Content: ${inquiry.content}
- Sender: ${JSON.stringify(inquiry.senderInfo)}
- Sentiment: ${inquiry.sentiment}
- Urgency: ${inquiry.urgency}

Personalization Instructions:
- Replace variables with actual data
- Add 1-2 personalized sentences based on inquiry content
- Match the tone to the inquiry sentiment
- Include relevant context from the inquiry
- Maintain professional but warm tone

Return JSON:
{
  "subject": "Personalized subject line",
  "body": "Personalized email body"
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1200
      })

      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      console.error('Template personalization failed:', error)
      return {
        subject: template.content.subject,
        body: template.content.body
      }
    }
  }

  // Generate completely custom response
  private async generateCustomResponse(inquiry: IncomingInquiry): Promise<{ subject?: string; body: string }> {
    const prompt = `
Generate a professional, helpful response to this inquiry:

Inquiry Type: ${inquiry.classification.type}
Intent: ${inquiry.classification.intent}
Urgency: ${inquiry.urgency}
Sentiment: ${inquiry.sentiment}
Content: ${inquiry.content}
Sender: ${JSON.stringify(inquiry.senderInfo)}

Response Requirements:
- Professional and helpful tone
- Address the specific inquiry directly
- Provide value and next steps
- Include appropriate call-to-action
- Match the urgency level
- Be concise but comprehensive

Return JSON:
{
  "subject": "Response subject line",
  "body": "Complete email response"
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1500
      })

      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      console.error('Custom response generation failed:', error)
      return {
        subject: 'Thank you for your inquiry',
        body: 'Thank you for reaching out. We have received your inquiry and will respond shortly.'
      }
    }
  }

  // Process inquiry through automation rules
  async processInquiry(inquiry: IncomingInquiry, rules: AutomationRule[]): Promise<AutomatedResponse | null> {
    // Find matching automation rule
    const matchingRule = this.findMatchingRule(inquiry, rules)
    
    if (!matchingRule) {
      // No automation rule matches, escalate to human
      return null
    }

    // Check if response requires approval
    if (matchingRule.actions.requireApproval) {
      await this.queueForApproval(inquiry, matchingRule)
      return null
    }

    // Apply delay if specified
    if (matchingRule.actions.delay && matchingRule.actions.delay > 0) {
      setTimeout(async () => {
        await this.executeAutomatedResponse(inquiry, matchingRule)
      }, matchingRule.actions.delay * 60 * 1000)
      return null
    }

    // Execute immediate response
    return await this.executeAutomatedResponse(inquiry, matchingRule)
  }

  // Execute automated response based on rule
  private async executeAutomatedResponse(
    inquiry: IncomingInquiry,
    rule: AutomationRule
  ): Promise<AutomatedResponse> {
    let template: ResponseTemplate | undefined

    if (rule.actions.responseTemplate) {
      template = await this.getResponseTemplate(rule.actions.responseTemplate)
    }

    const response = await this.generateAutomatedResponse(inquiry, template)

    // Send the response
    await this.sendResponse(response)

    // Assign to team member if specified
    if (rule.actions.assignTo) {
      await this.assignInquiry(inquiry.id, rule.actions.assignTo)
    }

    // Escalate if required
    if (rule.actions.escalate) {
      await this.escalateInquiry(inquiry.id)
    }

    return response
  }

  // Find matching automation rule
  private findMatchingRule(inquiry: IncomingInquiry, rules: AutomationRule[]): AutomationRule | null {
    const activeRules = rules.filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority)

    for (const rule of activeRules) {
      if (this.ruleMatches(inquiry, rule)) {
        return rule
      }
    }

    return null
  }

  // Check if rule conditions match inquiry
  private ruleMatches(inquiry: IncomingInquiry, rule: AutomationRule): boolean {
    const conditions = rule.conditions

    // Check source
    if (conditions.source && !conditions.source.includes(inquiry.source)) {
      return false
    }

    // Check inquiry type
    if (conditions.inquiryType && !conditions.inquiryType.includes(inquiry.classification.type)) {
      return false
    }

    // Check urgency
    if (conditions.urgency && !conditions.urgency.includes(inquiry.urgency)) {
      return false
    }

    // Check sentiment range
    if (conditions.sentiment) {
      const [min, max] = conditions.sentiment
      if (inquiry.sentiment < min || inquiry.sentiment > max) {
        return false
      }
    }

    // Check keywords
    if (conditions.keywords) {
      const contentLower = inquiry.content.toLowerCase()
      const hasKeyword = conditions.keywords.some(keyword => 
        contentLower.includes(keyword.toLowerCase())
      )
      if (!hasKeyword) {
        return false
      }
    }

    // Check business hours
    if (conditions.businessHours !== undefined) {
      const isBusinessHours = this.isBusinessHours()
      if (conditions.businessHours !== isBusinessHours) {
        return false
      }
    }

    return true
  }

  // Generate follow-up actions
  private async generateFollowUpActions(inquiry: IncomingInquiry): Promise<FollowUpAction[]> {
    const actions: FollowUpAction[] = []

    // Based on inquiry type and urgency, suggest follow-ups
    switch (inquiry.classification.type) {
      case 'demo_request':
        actions.push({
          type: 'call',
          description: 'Schedule demo call',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          priority: 'high',
          automated: false
        })
        break

      case 'pricing_request':
        actions.push({
          type: 'email',
          description: 'Send detailed pricing information',
          scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          priority: 'medium',
          automated: true
        })
        break

      case 'support_question':
        actions.push({
          type: 'task',
          description: 'Follow up on support resolution',
          scheduledFor: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days
          priority: 'medium',
          automated: false
        })
        break
    }

    return actions
  }

  // Helper methods
  private determineResponseType(inquiry: IncomingInquiry): 'immediate' | 'scheduled' | 'escalated' {
    if (inquiry.urgency === 'critical' || inquiry.classification.type === 'complaint') {
      return 'escalated'
    }
    
    if (inquiry.urgency === 'high' || inquiry.classification.qualificationScore > 80) {
      return 'immediate'
    }

    return 'scheduled'
  }

  private extractPersonalizationVariables(inquiry: IncomingInquiry): Record<string, string> {
    return {
      firstName: inquiry.senderInfo.name?.split(' ')[0] || 'there',
      company: inquiry.senderInfo.company || 'your company',
      inquiryType: inquiry.classification.type.replace('_', ' '),
      urgency: inquiry.urgency
    }
  }

  private async selectRelevantAttachments(inquiry: IncomingInquiry): Promise<string[]> {
    // Logic to select relevant attachments based on inquiry type
    const attachments: string[] = []

    switch (inquiry.classification.type) {
      case 'pricing_request':
        attachments.push('pricing-guide.pdf')
        break
      case 'demo_request':
        attachments.push('product-overview.pdf')
        break
      case 'product_inquiry':
        attachments.push('feature-comparison.pdf')
        break
    }

    return attachments
  }

  private async sendResponse(response: AutomatedResponse): Promise<void> {
    // Send email using email service
    console.log('Sending automated response:', response.id)
    response.deliveryStatus = 'sent'
    response.sentAt = new Date()
  }

  private async queueForApproval(inquiry: IncomingInquiry, rule: AutomationRule): Promise<void> {
    // Queue inquiry for human approval
    console.log('Queued for approval:', inquiry.id)
  }

  private async assignInquiry(inquiryId: string, assignTo: string): Promise<void> {
    // Assign inquiry to team member
    console.log('Assigned inquiry:', inquiryId, 'to:', assignTo)
  }

  private async escalateInquiry(inquiryId: string): Promise<void> {
    // Escalate inquiry to manager
    console.log('Escalated inquiry:', inquiryId)
  }

  private isBusinessHours(): boolean {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    
    // Monday-Friday, 9 AM - 5 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour < 17
  }

  private async getResponseTemplate(templateId: string): Promise<ResponseTemplate | undefined> {
    // Fetch template from database
    return undefined
  }

  private generateInquiryId(): string {
    return `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateResponseId(): string {
    return `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export { IntelligentResponseAutomation }
