// Lead AI Pro - AI-Powered Email Marketing Engine (2025)
// Advanced personalization, A/B testing, and automation

import { OpenAI } from 'openai'
import nodemailer from 'nodemailer'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
  category: 'cold_outreach' | 'follow_up' | 'nurture' | 'promotion' | 'event'
  aiGenerated: boolean
  performance: {
    sent: number
    opened: number
    clicked: number
    replied: number
    bounced: number
    unsubscribed: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface EmailCampaign {
  id: string
  name: string
  description: string
  templateId: string
  recipients: EmailRecipient[]
  schedule: {
    type: 'immediate' | 'scheduled' | 'drip'
    sendAt?: Date
    dripSettings?: {
      interval: number // hours
      maxEmails: number
      stopOnReply: boolean
    }
  }
  abTest?: {
    enabled: boolean
    variants: EmailVariant[]
    testPercentage: number
    winnerCriteria: 'open_rate' | 'click_rate' | 'reply_rate'
  }
  personalization: {
    enabled: boolean
    aiPersonalization: boolean
    customFields: Record<string, string>
  }
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'completed'
  analytics: CampaignAnalytics
  createdAt: Date
  updatedAt: Date
}

export interface EmailRecipient {
  id: string
  email: string
  firstName: string
  lastName: string
  company: string
  jobTitle: string
  customData: Record<string, any>
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed'
  sentAt?: Date
  openedAt?: Date
  clickedAt?: Date
  repliedAt?: Date
}

export interface EmailVariant {
  id: string
  name: string
  subject: string
  content: string
  percentage: number
  performance: {
    sent: number
    opened: number
    clicked: number
    replied: number
  }
}

export interface CampaignAnalytics {
  totalSent: number
  totalDelivered: number
  totalOpened: number
  totalClicked: number
  totalReplied: number
  totalBounced: number
  totalUnsubscribed: number
  openRate: number
  clickRate: number
  replyRate: number
  bounceRate: number
  unsubscribeRate: number
  bestSendTime: string
  topPerformingVariant?: string
}

export interface PersonalizationData {
  prospect: {
    firstName: string
    lastName: string
    company: string
    jobTitle: string
    industry: string
    location: string
    interests?: string[]
    recentActivity?: string[]
  }
  sender: {
    firstName: string
    lastName: string
    company: string
    jobTitle: string
  }
  context: {
    referralSource?: string
    commonConnections?: string[]
    recentNews?: string[]
    companyUpdates?: string[]
  }
}

export class AIEmailMarketingEngine {
  private openai: OpenAI
  private transporter: nodemailer.Transporter

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Configure email transporter (using SendGrid, Mailgun, or similar)
    this.transporter = nodemailer.createTransporter({
      service: 'gmail', // Replace with your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  }

  // Generate AI-powered email templates
  async generateEmailTemplate(
    purpose: string,
    targetAudience: string,
    tone: 'professional' | 'casual' | 'friendly' | 'urgent',
    industry: string
  ): Promise<EmailTemplate> {
    const prompt = `
Create a high-converting email template for ${purpose}.

Target Audience: ${targetAudience}
Tone: ${tone}
Industry: ${industry}

Requirements:
- Subject line that gets opened (avoid spam words)
- Personalized greeting with {{firstName}} variable
- Value proposition in first 2 sentences
- Clear call-to-action
- Professional signature
- Include relevant variables like {{company}}, {{jobTitle}}, etc.

Return JSON with:
{
  "subject": "Subject line",
  "htmlContent": "HTML email content",
  "textContent": "Plain text version",
  "variables": ["firstName", "company", "jobTitle"]
}

Make it compelling and conversion-focused.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      })

      const templateData = JSON.parse(response.choices[0].message.content || '{}')

      return {
        id: this.generateTemplateId(),
        name: `AI Generated - ${purpose}`,
        subject: templateData.subject,
        htmlContent: templateData.htmlContent,
        textContent: templateData.textContent,
        variables: templateData.variables || [],
        category: this.categorizeTemplate(purpose),
        aiGenerated: true,
        performance: {
          sent: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          bounced: 0,
          unsubscribed: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      console.error('Template generation failed:', error)
      throw new Error('Failed to generate email template')
    }
  }

  // Personalize email content using AI
  async personalizeEmail(
    template: EmailTemplate,
    personalizationData: PersonalizationData
  ): Promise<{ subject: string; content: string }> {
    const prompt = `
Personalize this email template using the provided data:

Template Subject: ${template.subject}
Template Content: ${template.htmlContent}

Personalization Data:
${JSON.stringify(personalizationData, null, 2)}

Instructions:
- Replace variables with actual data
- Add 1-2 personalized sentences based on prospect's company, role, or industry
- Mention relevant context if available (recent news, common connections)
- Keep the core message and CTA intact
- Maintain the original tone and style

Return JSON with:
{
  "subject": "Personalized subject line",
  "content": "Personalized email content"
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      })

      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      console.error('Email personalization failed:', error)
      // Fallback to basic variable replacement
      return this.basicPersonalization(template, personalizationData)
    }
  }

  // Create A/B test variants
  async createABTestVariants(
    originalTemplate: EmailTemplate,
    testType: 'subject' | 'content' | 'cta',
    variantCount: number = 2
  ): Promise<EmailVariant[]> {
    const prompt = `
Create ${variantCount} A/B test variants for this email template, focusing on ${testType}:

Original Subject: ${originalTemplate.subject}
Original Content: ${originalTemplate.htmlContent}

For ${testType} testing, create variants that:
- Test different approaches (emotional vs logical, short vs long, etc.)
- Maintain the core message and value proposition
- Are significantly different to produce meaningful test results

Return JSON array of variants:
[
  {
    "name": "Variant A",
    "subject": "Subject line",
    "content": "Email content",
    "percentage": 50
  }
]
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000
      })

      const variants = JSON.parse(response.choices[0].message.content || '[]')

      return variants.map((variant: any, index: number) => ({
        id: `variant_${index + 1}_${Date.now()}`,
        name: variant.name,
        subject: variant.subject,
        content: variant.content,
        percentage: variant.percentage,
        performance: {
          sent: 0,
          opened: 0,
          clicked: 0,
          replied: 0
        }
      }))
    } catch (error) {
      console.error('A/B variant creation failed:', error)
      return []
    }
  }

  // Send bulk email campaign
  async sendCampaign(campaign: EmailCampaign): Promise<void> {
    try {
      const template = await this.getTemplate(campaign.templateId)
      if (!template) throw new Error('Template not found')

      // Handle A/B testing
      const variants = campaign.abTest?.enabled ? campaign.abTest.variants : []
      
      for (const recipient of campaign.recipients) {
        if (recipient.status !== 'pending') continue

        try {
          // Select variant for A/B testing
          const variant = this.selectVariantForRecipient(variants, recipient)
          const emailContent = variant || template

          // Personalize email
          const personalizationData = this.buildPersonalizationData(recipient)
          const personalizedEmail = await this.personalizeEmail(emailContent, personalizationData)

          // Send email
          await this.sendEmail({
            to: recipient.email,
            subject: personalizedEmail.subject,
            html: personalizedEmail.content,
            text: this.htmlToText(personalizedEmail.content)
          })

          // Update recipient status
          recipient.status = 'sent'
          recipient.sentAt = new Date()

          // Update analytics
          this.updateCampaignAnalytics(campaign, 'sent')
          if (variant) {
            variant.performance.sent++
          }

          // Add delay to avoid rate limits
          await this.delay(1000)

        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error)
          recipient.status = 'bounced'
          this.updateCampaignAnalytics(campaign, 'bounced')
        }
      }

      campaign.status = 'sent'
      campaign.updatedAt = new Date()

    } catch (error) {
      console.error('Campaign sending failed:', error)
      campaign.status = 'paused'
      throw error
    }
  }

  // Schedule drip campaign
  async scheduleDripCampaign(campaign: EmailCampaign): Promise<void> {
    if (!campaign.schedule.dripSettings) {
      throw new Error('Drip settings required for drip campaign')
    }

    const { interval, maxEmails, stopOnReply } = campaign.schedule.dripSettings

    for (let emailIndex = 0; emailIndex < maxEmails; emailIndex++) {
      const sendTime = new Date(Date.now() + (interval * 60 * 60 * 1000 * emailIndex))

      // Schedule each email in the sequence
      setTimeout(async () => {
        const activeRecipients = campaign.recipients.filter(r => 
          r.status === 'pending' || 
          (r.status === 'sent' && (!stopOnReply || r.status !== 'replied'))
        )

        if (activeRecipients.length === 0) return

        // Send to active recipients
        for (const recipient of activeRecipients) {
          try {
            const template = await this.getTemplate(campaign.templateId)
            if (!template) continue

            const personalizationData = this.buildPersonalizationData(recipient)
            const personalizedEmail = await this.personalizeEmail(template, personalizationData)

            await this.sendEmail({
              to: recipient.email,
              subject: personalizedEmail.subject,
              html: personalizedEmail.content,
              text: this.htmlToText(personalizedEmail.content)
            })

            recipient.status = 'sent'
            recipient.sentAt = new Date()

          } catch (error) {
            console.error(`Drip email failed for ${recipient.email}:`, error)
          }
        }
      }, sendTime.getTime() - Date.now())
    }
  }

  // Analyze campaign performance
  async analyzeCampaignPerformance(campaignId: string): Promise<CampaignAnalytics> {
    const campaign = await this.getCampaign(campaignId)
    if (!campaign) throw new Error('Campaign not found')

    const analytics: CampaignAnalytics = {
      totalSent: campaign.recipients.filter(r => r.status === 'sent').length,
      totalDelivered: campaign.recipients.filter(r => ['delivered', 'opened', 'clicked', 'replied'].includes(r.status)).length,
      totalOpened: campaign.recipients.filter(r => ['opened', 'clicked', 'replied'].includes(r.status)).length,
      totalClicked: campaign.recipients.filter(r => ['clicked', 'replied'].includes(r.status)).length,
      totalReplied: campaign.recipients.filter(r => r.status === 'replied').length,
      totalBounced: campaign.recipients.filter(r => r.status === 'bounced').length,
      totalUnsubscribed: campaign.recipients.filter(r => r.status === 'unsubscribed').length,
      openRate: 0,
      clickRate: 0,
      replyRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0,
      bestSendTime: await this.calculateBestSendTime(campaign),
      topPerformingVariant: await this.getTopPerformingVariant(campaign)
    }

    // Calculate rates
    if (analytics.totalSent > 0) {
      analytics.openRate = (analytics.totalOpened / analytics.totalSent) * 100
      analytics.clickRate = (analytics.totalClicked / analytics.totalSent) * 100
      analytics.replyRate = (analytics.totalReplied / analytics.totalSent) * 100
      analytics.bounceRate = (analytics.totalBounced / analytics.totalSent) * 100
      analytics.unsubscribeRate = (analytics.totalUnsubscribed / analytics.totalSent) * 100
    }

    return analytics
  }

  // Generate follow-up recommendations
  async generateFollowUpRecommendations(campaignId: string): Promise<string[]> {
    const analytics = await this.analyzeCampaignPerformance(campaignId)
    
    const prompt = `
Based on these email campaign analytics, provide 3-5 specific recommendations for follow-up actions:

Analytics:
${JSON.stringify(analytics, null, 2)}

Consider:
- Performance metrics and what they indicate
- Segments that need different approaches
- Timing optimizations
- Content improvements
- Next steps for different recipient groups

Return an array of actionable recommendations.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      })

      return JSON.parse(response.choices[0].message.content || '[]')
    } catch (error) {
      console.error('Follow-up recommendations failed:', error)
      return ['Review campaign performance and adjust strategy']
    }
  }

  // Helper methods
  private async sendEmail(emailData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(emailData, (error, info) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  private basicPersonalization(template: EmailTemplate, data: PersonalizationData): { subject: string; content: string } {
    let subject = template.subject
    let content = template.htmlContent

    // Replace common variables
    const replacements = {
      '{{firstName}}': data.prospect.firstName,
      '{{lastName}}': data.prospect.lastName,
      '{{company}}': data.prospect.company,
      '{{jobTitle}}': data.prospect.jobTitle
    }

    Object.entries(replacements).forEach(([variable, value]) => {
      subject = subject.replace(new RegExp(variable, 'g'), value)
      content = content.replace(new RegExp(variable, 'g'), value)
    })

    return { subject, content }
  }

  private selectVariantForRecipient(variants: EmailVariant[], recipient: EmailRecipient): EmailVariant | null {
    if (!variants.length) return null
    
    // Simple random selection based on percentages
    const random = Math.random() * 100
    let cumulative = 0
    
    for (const variant of variants) {
      cumulative += variant.percentage
      if (random <= cumulative) {
        return variant
      }
    }
    
    return variants[0] // Fallback
  }

  private buildPersonalizationData(recipient: EmailRecipient): PersonalizationData {
    return {
      prospect: {
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        company: recipient.company,
        jobTitle: recipient.jobTitle,
        industry: recipient.customData.industry || '',
        location: recipient.customData.location || '',
        interests: recipient.customData.interests || [],
        recentActivity: recipient.customData.recentActivity || []
      },
      sender: {
        firstName: 'John', // Would come from user data
        lastName: 'Doe',
        company: 'Lead AI Pro',
        jobTitle: 'Sales Representative'
      },
      context: {
        referralSource: recipient.customData.referralSource,
        commonConnections: recipient.customData.commonConnections || [],
        recentNews: recipient.customData.recentNews || [],
        companyUpdates: recipient.customData.companyUpdates || []
      }
    }
  }

  private updateCampaignAnalytics(campaign: EmailCampaign, event: string): void {
    switch (event) {
      case 'sent':
        campaign.analytics.totalSent++
        break
      case 'opened':
        campaign.analytics.totalOpened++
        break
      case 'clicked':
        campaign.analytics.totalClicked++
        break
      case 'replied':
        campaign.analytics.totalReplied++
        break
      case 'bounced':
        campaign.analytics.totalBounced++
        break
      case 'unsubscribed':
        campaign.analytics.totalUnsubscribed++
        break
    }
  }

  private htmlToText(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private categorizeTemplate(purpose: string): EmailTemplate['category'] {
    if (purpose.toLowerCase().includes('cold')) return 'cold_outreach'
    if (purpose.toLowerCase().includes('follow')) return 'follow_up'
    if (purpose.toLowerCase().includes('nurture')) return 'nurture'
    if (purpose.toLowerCase().includes('event')) return 'event'
    return 'promotion'
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    // This would fetch from database
    return null
  }

  private async getCampaign(campaignId: string): Promise<EmailCampaign | null> {
    // This would fetch from database
    return null
  }

  private async calculateBestSendTime(campaign: EmailCampaign): Promise<string> {
    // Analyze open times to determine best send time
    return '10:00 AM'
  }

  private async getTopPerformingVariant(campaign: EmailCampaign): Promise<string | undefined> {
    // Analyze variant performance
    return campaign.abTest?.variants[0]?.id
  }
}

export { AIEmailMarketingEngine }
