// Lead AI Pro - Document Processing API Routes (2025)
// Advanced OCR, business card scanning, and document analysis endpoints

import { Router } from 'express'
import multer from 'multer'
import { DocumentProcessingEngine } from '../../lib/ai/documentProcessor'
import { asyncHandler } from '../middleware/asyncHandler'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../../lib/database'

const router = Router()
const documentProcessor = new DocumentProcessingEngine()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Unsupported file type'))
    }
  }
})

// Business card scanning endpoint
router.post('/scan-business-card', requireAuth, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' })
  }

  try {
    const businessCardData = await documentProcessor.processBusinessCard(req.file.buffer)
    
    // Log the scan for analytics
    await prisma.journeyEvent.create({
      data: {
        leadId: req.body.leadId || 'unknown',
        eventType: 'business_card_scan',
        eventName: 'Business Card Scanned',
        description: 'Business card processed with OCR',
        properties: {
          confidence: businessCardData.confidence,
          extractedFields: Object.keys(businessCardData).filter(key => businessCardData[key as keyof typeof businessCardData])
        }
      }
    })

    res.json(businessCardData)
  } catch (error) {
    console.error('Business card scanning failed:', error)
    res.status(500).json({ error: 'Failed to process business card' })
  }
}))

// Document analysis endpoint
router.post('/analyze', requireAuth, upload.single('document'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No document file provided' })
  }

  const { organizationId } = req.user as any
  const fileName = req.body.fileName || req.file.originalname

  try {
    const startTime = Date.now()

    // Extract text from file
    const extractedText = await documentProcessor.extractTextFromFile(
      req.file.buffer, 
      req.file.mimetype
    )

    // Analyze document
    const analysis = await documentProcessor.analyzeDocument(extractedText, fileName)

    // Categorize for CRM
    const crmCategory = await documentProcessor.categorizeForCRM(analysis)

    const processingTime = Date.now() - startTime

    // Create processed document object
    const processedDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalText: extractedText,
      analysis: {
        ...analysis,
        crmCategory
      },
      metadata: {
        fileName,
        fileSize: req.file.size,
        processedAt: new Date(),
        processingTime
      }
    }

    // Save to database
    await prisma.aiInsight.create({
      data: {
        leadId: req.body.leadId || 'system',
        insightType: 'document_analysis',
        title: `Document Analysis: ${fileName}`,
        description: analysis.summary,
        confidence: analysis.confidence,
        priority: analysis.urgency === 'critical' ? 'urgent' : 
                 analysis.urgency === 'high' ? 'high' : 'medium',
        data: {
          documentId: processedDocument.id,
          analysis: analysis,
          crmCategory: crmCategory,
          fileName: fileName
        }
      }
    })

    // Log the analysis for analytics
    await prisma.journeyEvent.create({
      data: {
        leadId: req.body.leadId || 'system',
        eventType: 'document_analysis',
        eventName: 'Document Analyzed',
        description: `${analysis.type} document processed with AI`,
        properties: {
          documentType: analysis.type,
          confidence: analysis.confidence,
          urgency: analysis.urgency,
          keyInsightsCount: analysis.keyInsights.length,
          actionItemsCount: analysis.actionItems.length,
          processingTime
        }
      }
    })

    res.json(processedDocument)
  } catch (error) {
    console.error('Document analysis failed:', error)
    res.status(500).json({ error: 'Failed to analyze document' })
  }
}))

// Batch document processing
router.post('/batch-analyze', requireAuth, upload.array('documents', 10), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No documents provided' })
  }

  const { organizationId } = req.user as any
  const files = req.files as Express.Multer.File[]

  try {
    const results = []

    for (const file of files) {
      try {
        const extractedText = await documentProcessor.extractTextFromFile(
          file.buffer, 
          file.mimetype
        )

        const analysis = await documentProcessor.analyzeDocument(extractedText, file.originalname)
        const crmCategory = await documentProcessor.categorizeForCRM(analysis)

        results.push({
          fileName: file.originalname,
          success: true,
          analysis: {
            ...analysis,
            crmCategory
          }
        })
      } catch (error) {
        results.push({
          fileName: file.originalname,
          success: false,
          error: 'Processing failed'
        })
      }
    }

    // Log batch processing
    await prisma.journeyEvent.create({
      data: {
        leadId: 'system',
        eventType: 'batch_document_analysis',
        eventName: 'Batch Document Analysis',
        description: `Processed ${files.length} documents`,
        properties: {
          totalDocuments: files.length,
          successfulProcessing: results.filter(r => r.success).length,
          failedProcessing: results.filter(r => !r.success).length
        }
      }
    })

    res.json({
      totalProcessed: files.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    })
  } catch (error) {
    console.error('Batch document processing failed:', error)
    res.status(500).json({ error: 'Failed to process documents' })
  }
}))

// Get document analysis history
router.get('/history', requireAuth, asyncHandler(async (req, res) => {
  const { organizationId } = req.user as any
  const { page = 1, limit = 20, type } = req.query

  const where: any = {
    insightType: 'document_analysis'
  }

  if (type) {
    where.data = {
      path: ['analysis', 'type'],
      equals: type
    }
  }

  const insights = await prisma.aiInsight.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true
        }
      }
    }
  })

  const total = await prisma.aiInsight.count({ where })

  res.json({
    insights,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  })
}))

// Get specific document analysis
router.get('/:documentId', requireAuth, asyncHandler(async (req, res) => {
  const { documentId } = req.params

  const insight = await prisma.aiInsight.findFirst({
    where: {
      insightType: 'document_analysis',
      data: {
        path: ['documentId'],
        equals: documentId
      }
    },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          email: true
        }
      }
    }
  })

  if (!insight) {
    return res.status(404).json({ error: 'Document not found' })
  }

  res.json(insight)
}))

// Update document analysis
router.put('/:documentId', requireAuth, asyncHandler(async (req, res) => {
  const { documentId } = req.params
  const { analysis, notes } = req.body

  const insight = await prisma.aiInsight.findFirst({
    where: {
      insightType: 'document_analysis',
      data: {
        path: ['documentId'],
        equals: documentId
      }
    }
  })

  if (!insight) {
    return res.status(404).json({ error: 'Document not found' })
  }

  const updatedInsight = await prisma.aiInsight.update({
    where: { id: insight.id },
    data: {
      data: {
        ...insight.data as any,
        analysis: analysis || (insight.data as any).analysis,
        notes: notes || (insight.data as any).notes,
        updatedAt: new Date()
      }
    }
  })

  res.json(updatedInsight)
}))

// Delete document analysis
router.delete('/:documentId', requireAuth, asyncHandler(async (req, res) => {
  const { documentId } = req.params

  const insight = await prisma.aiInsight.findFirst({
    where: {
      insightType: 'document_analysis',
      data: {
        path: ['documentId'],
        equals: documentId
      }
    }
  })

  if (!insight) {
    return res.status(404).json({ error: 'Document not found' })
  }

  await prisma.aiInsight.delete({
    where: { id: insight.id }
  })

  res.json({ message: 'Document analysis deleted successfully' })
}))

// Search documents
router.get('/search', requireAuth, asyncHandler(async (req, res) => {
  const { q, type, urgency, dateFrom, dateTo } = req.query

  if (!q) {
    return res.status(400).json({ error: 'Search query required' })
  }

  const where: any = {
    insightType: 'document_analysis',
    OR: [
      { title: { contains: q as string, mode: 'insensitive' } },
      { description: { contains: q as string, mode: 'insensitive' } }
    ]
  }

  if (type) {
    where.data = {
      path: ['analysis', 'type'],
      equals: type
    }
  }

  if (urgency) {
    where.data = {
      ...where.data,
      path: ['analysis', 'urgency'],
      equals: urgency
    }
  }

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom as string)
    if (dateTo) where.createdAt.lte = new Date(dateTo as string)
  }

  const results = await prisma.aiInsight.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true
        }
      }
    }
  })

  res.json(results)
}))

export default router
