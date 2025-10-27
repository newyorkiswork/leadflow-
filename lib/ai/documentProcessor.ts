// Lead AI Pro - Advanced Document Processing Engine (2025)
// OCR, business card scanning, and AI-powered document analysis

import { OpenAI } from 'openai'
import Tesseract from 'tesseract.js'

export interface BusinessCardData {
  name: string
  title: string
  company: string
  email: string
  phone: string
  website?: string
  address?: string
  linkedIn?: string
  confidence: number
}

export interface DocumentAnalysis {
  type: 'contract' | 'proposal' | 'meeting_notes' | 'email' | 'other'
  summary: string
  keyInsights: string[]
  actionItems: string[]
  entities: {
    people: string[]
    companies: string[]
    dates: string[]
    amounts: string[]
    locations: string[]
  }
  sentiment: {
    overall: number
    confidence: number
  }
  urgency: 'low' | 'medium' | 'high' | 'critical'
  nextSteps: string[]
  confidence: number
}

export interface ProcessedDocument {
  id: string
  originalText: string
  analysis: DocumentAnalysis
  metadata: {
    fileName?: string
    fileSize?: number
    processedAt: Date
    processingTime: number
  }
}

export class DocumentProcessingEngine {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  // Business card OCR and data extraction
  async processBusinessCard(imageBuffer: Buffer | string): Promise<BusinessCardData> {
    try {
      const startTime = Date.now()

      // Step 1: OCR text extraction
      const ocrResult = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: m => console.log(m)
      })

      const extractedText = ocrResult.data.text

      // Step 2: AI-powered data extraction
      const businessCardData = await this.extractBusinessCardData(extractedText)

      const processingTime = Date.now() - startTime
      console.log(`Business card processed in ${processingTime}ms`)

      return businessCardData
    } catch (error) {
      console.error('Business card processing failed:', error)
      throw new Error('Failed to process business card')
    }
  }

  // Extract structured data from OCR text using AI
  private async extractBusinessCardData(text: string): Promise<BusinessCardData> {
    const prompt = `
Extract contact information from this business card text. Return a JSON object with the following structure:
{
  "name": "Full name",
  "title": "Job title",
  "company": "Company name",
  "email": "Email address",
  "phone": "Phone number",
  "website": "Website URL",
  "address": "Physical address",
  "linkedIn": "LinkedIn profile URL",
  "confidence": 0.95
}

Business card text:
${text}

Rules:
- Extract only information that is clearly present
- Use null for missing information
- Confidence should be 0-1 based on text clarity
- Clean and format phone numbers
- Ensure email addresses are valid format
- Extract full company names, not abbreviations
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
        name: result.name || '',
        title: result.title || '',
        company: result.company || '',
        email: result.email || '',
        phone: result.phone || '',
        website: result.website || undefined,
        address: result.address || undefined,
        linkedIn: result.linkedIn || undefined,
        confidence: result.confidence || 0.5
      }
    } catch (error) {
      console.error('AI extraction failed:', error)
      throw new Error('Failed to extract business card data')
    }
  }

  // Advanced document analysis
  async analyzeDocument(text: string, fileName?: string): Promise<DocumentAnalysis> {
    try {
      const documentType = await this.classifyDocument(text, fileName)
      const analysis = await this.performDeepAnalysis(text, documentType)
      
      return analysis
    } catch (error) {
      console.error('Document analysis failed:', error)
      throw new Error('Failed to analyze document')
    }
  }

  // Classify document type
  private async classifyDocument(text: string, fileName?: string): Promise<string> {
    const prompt = `
Classify this document into one of these categories:
- contract: Legal agreements, terms of service, contracts
- proposal: Business proposals, quotes, estimates
- meeting_notes: Meeting minutes, call notes, discussion summaries
- email: Email communications, correspondence
- other: Any other type of document

Document content (first 500 characters):
${text.substring(0, 500)}

File name: ${fileName || 'unknown'}

Return only the category name.
`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 50
    })

    return response.choices[0].message.content?.trim().toLowerCase() || 'other'
  }

  // Perform comprehensive document analysis
  private async performDeepAnalysis(text: string, documentType: string): Promise<DocumentAnalysis> {
    const prompt = `
Analyze this ${documentType} document and extract the following information in JSON format:

{
  "type": "${documentType}",
  "summary": "Brief 2-3 sentence summary",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "actionItems": ["action1", "action2"],
  "entities": {
    "people": ["person1", "person2"],
    "companies": ["company1", "company2"],
    "dates": ["2024-01-15", "2024-02-20"],
    "amounts": ["$50,000", "$1,200"],
    "locations": ["New York", "San Francisco"]
  },
  "sentiment": {
    "overall": 0.7,
    "confidence": 0.9
  },
  "urgency": "medium",
  "nextSteps": ["step1", "step2"],
  "confidence": 0.85
}

Document content:
${text}

Analysis guidelines:
- Extract only factual information present in the document
- Sentiment: -1 (very negative) to +1 (very positive)
- Urgency: low, medium, high, critical
- Confidence: 0-1 based on document clarity and completeness
- Focus on business-relevant insights and actionable items
- Extract specific dates, amounts, and proper nouns
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        type: result.type || documentType,
        summary: result.summary || '',
        keyInsights: result.keyInsights || [],
        actionItems: result.actionItems || [],
        entities: {
          people: result.entities?.people || [],
          companies: result.entities?.companies || [],
          dates: result.entities?.dates || [],
          amounts: result.entities?.amounts || [],
          locations: result.entities?.locations || []
        },
        sentiment: {
          overall: result.sentiment?.overall || 0,
          confidence: result.sentiment?.confidence || 0.5
        },
        urgency: result.urgency || 'medium',
        nextSteps: result.nextSteps || [],
        confidence: result.confidence || 0.5
      }
    } catch (error) {
      console.error('Deep analysis failed:', error)
      throw new Error('Failed to perform document analysis')
    }
  }

  // Process multiple documents in batch
  async batchProcessDocuments(documents: Array<{ text: string; fileName?: string }>): Promise<ProcessedDocument[]> {
    const results: ProcessedDocument[] = []

    for (const doc of documents) {
      try {
        const startTime = Date.now()
        const analysis = await this.analyzeDocument(doc.text, doc.fileName)
        const processingTime = Date.now() - startTime

        results.push({
          id: this.generateDocumentId(),
          originalText: doc.text,
          analysis,
          metadata: {
            fileName: doc.fileName,
            fileSize: doc.text.length,
            processedAt: new Date(),
            processingTime
          }
        })
      } catch (error) {
        console.error(`Failed to process document ${doc.fileName}:`, error)
        // Continue processing other documents
      }
    }

    return results
  }

  // Extract text from various file formats
  async extractTextFromFile(fileBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      switch (mimeType) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
          return await this.extractTextFromImage(fileBuffer)
        
        case 'application/pdf':
          return await this.extractTextFromPDF(fileBuffer)
        
        case 'text/plain':
          return fileBuffer.toString('utf-8')
        
        default:
          throw new Error(`Unsupported file type: ${mimeType}`)
      }
    } catch (error) {
      console.error('Text extraction failed:', error)
      throw new Error('Failed to extract text from file')
    }
  }

  // Extract text from images using OCR
  private async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    const result = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: m => console.log(m)
    })
    
    return result.data.text
  }

  // Extract text from PDF (placeholder - would use pdf-parse or similar)
  private async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    // This would typically use a library like pdf-parse
    // For now, return a placeholder
    return "PDF text extraction would be implemented here using pdf-parse library"
  }

  // Generate unique document ID
  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Smart document categorization for CRM context
  async categorizeForCRM(analysis: DocumentAnalysis): Promise<{
    category: string
    priority: number
    suggestedActions: string[]
    relatedLeads: string[]
  }> {
    const prompt = `
Based on this document analysis, categorize it for CRM purposes:

Document Analysis:
${JSON.stringify(analysis, null, 2)}

Return JSON with:
{
  "category": "lead_generation|customer_communication|contract_negotiation|support_ticket|marketing_material",
  "priority": 1-10,
  "suggestedActions": ["action1", "action2"],
  "relatedLeads": ["potential lead identifiers"]
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 300
      })

      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      console.error('CRM categorization failed:', error)
      return {
        category: 'other',
        priority: 5,
        suggestedActions: [],
        relatedLeads: []
      }
    }
  }
}

export { DocumentProcessingEngine }
