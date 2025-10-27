// LeadAI Pro - Leads Routes
// CRUD operations for lead management with AI integration

import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { prisma, db } from '../../lib/database'
import { requireRole, requireLeadAccess } from '../middleware/auth'
import { ValidationError, NotFoundError } from '../middleware/errorHandler'
import { asyncHandler } from '../middleware/errorHandler'
import { businessLogger, metricsLogger } from '../middleware/logger'

const router = express.Router()

// Validation rules
const createLeadValidation = [
  body('firstName').isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').isLength({ min: 1 }).withMessage('Last name is required'),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone('any'),
  body('company').optional().isLength({ min: 1 }),
  body('jobTitle').optional().isLength({ min: 1 }),
  body('source').optional().isLength({ min: 1 }),
  body('campaign').optional().isLength({ min: 1 }),
]

const updateLeadValidation = [
  body('firstName').optional().isLength({ min: 1 }),
  body('lastName').optional().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone('any'),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'nurturing', 'unqualified']),
]

// Get all leads for organization
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ min: 1 }),
  query('status').optional().isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'nurturing', 'unqualified']),
  query('assignedTo').optional().isUUID(),
  query('minScore').optional().isInt({ min: 0, max: 100 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array())
  }

  const {
    page = 1,
    limit = 20,
    search,
    status,
    assignedTo,
    minScore,
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = req.query

  const skip = (Number(page) - 1) * Number(limit)

  // Build where clause
  const whereClause: any = {
    organizationId: req.user!.organizationId,
  }

  // Apply filters
  if (search) {
    whereClause.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { company: { contains: search as string, mode: 'insensitive' } },
    ]
  }

  if (status) {
    whereClause.status = status
  }

  if (assignedTo) {
    whereClause.assignedTo = assignedTo
  }

  if (minScore) {
    whereClause.currentScore = { gte: Number(minScore) }
  }

  // For sales reps, only show their assigned leads
  if (req.user!.role === 'sales_rep') {
    whereClause.assignedTo = req.user!.id
  }

  // Get leads with pagination
  const [leads, totalCount] = await Promise.all([
    prisma.lead.findMany({
      where: whereClause,
      include: {
        assignedUser: {
          select: { id: true, fullName: true, email: true, avatarUrl: true }
        },
        team: {
          select: { id: true, name: true }
        },
        scores: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        insights: {
          where: { acknowledgedAt: null },
          orderBy: { priority: 'desc' },
          take: 3
        },
        _count: {
          select: { activities: true, conversations: true }
        }
      },
      orderBy: { [sortBy as string]: sortOrder },
      skip,
      take: Number(limit),
    }),
    prisma.lead.count({ where: whereClause })
  ])

  // Track API usage
  metricsLogger.trackEndpoint('/api/leads', 'GET', req.user!.id)

  res.json({
    leads,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: totalCount,
      pages: Math.ceil(totalCount / Number(limit)),
    },
    filters: {
      search,
      status,
      assignedTo,
      minScore,
    }
  })
}))

// Get single lead by ID
router.get('/:id', requireLeadAccess, asyncHandler(async (req, res) => {
  const { id } = req.params

  const lead = await db.lead.findWithDetails(id)

  if (!lead) {
    throw new NotFoundError('Lead')
  }

  res.json({ lead })
}))

// Create new lead
router.post('/', createLeadValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array())
  }

  const leadData = {
    ...req.body,
    organizationId: req.user!.organizationId,
    assignedTo: req.body.assignedTo || req.user!.id, // Default to current user
    teamId: req.user!.teamId,
  }

  // Create lead
  const lead = await prisma.lead.create({
    data: leadData,
    include: {
      assignedUser: {
        select: { id: true, fullName: true, email: true, avatarUrl: true }
      },
      team: {
        select: { id: true, name: true }
      }
    }
  })

  // Log business activity
  businessLogger.trackLeadActivity(lead.id, 'created', req.user!.id, req.user!.organizationId)

  // TODO: Trigger AI scoring in background
  // await triggerAIScoring(lead.id)

  res.status(201).json({
    message: 'Lead created successfully',
    lead,
  })
}))

// Update lead
router.put('/:id', requireLeadAccess, updateLeadValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array())
  }

  const { id } = req.params
  const updateData = req.body

  // Get current lead for comparison
  const currentLead = await prisma.lead.findUnique({
    where: { id },
    select: { status: true }
  })

  if (!currentLead) {
    throw new NotFoundError('Lead')
  }

  // Update lead
  const updatedLead = await prisma.lead.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
    include: {
      assignedUser: {
        select: { id: true, fullName: true, email: true, avatarUrl: true }
      },
      team: {
        select: { id: true, name: true }
      }
    }
  })

  // Log status change if applicable
  if (updateData.status && updateData.status !== currentLead.status) {
    businessLogger.trackConversion(id, currentLead.status, updateData.status, req.user!.id)
  }

  // Log business activity
  businessLogger.trackLeadActivity(id, 'updated', req.user!.id, req.user!.organizationId)

  res.json({
    message: 'Lead updated successfully',
    lead: updatedLead,
  })
}))

// Delete lead
router.delete('/:id', requireLeadAccess, requireRole(['admin', 'manager']), asyncHandler(async (req, res) => {
  const { id } = req.params

  // Check if lead exists
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true }
  })

  if (!lead) {
    throw new NotFoundError('Lead')
  }

  // Delete lead (cascade will handle related records)
  await prisma.lead.delete({
    where: { id }
  })

  // Log business activity
  businessLogger.trackLeadActivity(id, 'deleted', req.user!.id, req.user!.organizationId)

  res.json({
    message: 'Lead deleted successfully',
  })
}))

// Bulk update leads
router.patch('/bulk', [
  body('leadIds').isArray({ min: 1 }).withMessage('Lead IDs array is required'),
  body('leadIds.*').isUUID().withMessage('Invalid lead ID format'),
  body('updates').isObject().withMessage('Updates object is required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array())
  }

  const { leadIds, updates } = req.body

  // Verify all leads belong to user's organization
  const leads = await prisma.lead.findMany({
    where: {
      id: { in: leadIds },
      organizationId: req.user!.organizationId,
    },
    select: { id: true }
  })

  if (leads.length !== leadIds.length) {
    throw new ValidationError('Some leads not found or access denied')
  }

  // Perform bulk update
  const result = await prisma.lead.updateMany({
    where: {
      id: { in: leadIds },
      organizationId: req.user!.organizationId,
    },
    data: {
      ...updates,
      updatedAt: new Date(),
    }
  })

  // Log business activity
  leadIds.forEach((leadId: string) => {
    businessLogger.trackLeadActivity(leadId, 'bulk_updated', req.user!.id, req.user!.organizationId)
  })

  res.json({
    message: `${result.count} leads updated successfully`,
    updatedCount: result.count,
  })
}))

// Get lead analytics
router.get('/:id/analytics', requireLeadAccess, asyncHandler(async (req, res) => {
  const { id } = req.params

  // Get lead with analytics data
  const [lead, activities, conversations, scores] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        status: true,
        currentScore: true,
        engagementLevel: true,
        createdAt: true,
        lastContactedAt: true,
      }
    }),
    prisma.activity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { fullName: true } }
      }
    }),
    prisma.conversation.count({
      where: { leadId: id }
    }),
    prisma.leadScore.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
  ])

  if (!lead) {
    throw new NotFoundError('Lead')
  }

  // Calculate engagement metrics
  const totalActivities = activities.length
  const lastActivity = activities[0]?.createdAt
  const scoreHistory = scores.map(s => ({
    score: s.score,
    confidence: s.confidence,
    createdAt: s.createdAt,
  }))

  res.json({
    lead,
    analytics: {
      totalActivities,
      totalConversations: conversations,
      lastActivity,
      scoreHistory,
      engagementTrend: lead.engagementLevel,
    },
    recentActivities: activities,
  })
}))

// Import/Export leads
router.post('/import', asyncHandler(async (req, res) => {
  // TODO: Implement CSV/Excel import with validation
  res.json({ message: 'Import endpoint - Coming soon' })
}))

router.get('/export', asyncHandler(async (req, res) => {
  // TODO: Implement CSV/Excel export
  res.json({ message: 'Export endpoint - Coming soon' })
}))

// Lead scoring trigger
router.post('/:id/score', requireLeadAccess, asyncHandler(async (req, res) => {
  const { id } = req.params

  // TODO: Trigger AI scoring
  res.json({
    message: 'Lead scoring triggered',
    leadId: id
  })
}))

// Lead assignment
router.post('/:id/assign', requireLeadAccess, requireRole(['admin', 'manager']), asyncHandler(async (req, res) => {
  const { id } = req.params
  const { assignedTo } = req.body

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: {
      assignedTo,
      updatedAt: new Date(),
    },
    include: {
      assignedUser: {
        select: { id: true, fullName: true, email: true, avatarUrl: true }
      }
    }
  })

  businessLogger.trackLeadActivity(id, 'assigned', req.user!.id, req.user!.organizationId)

  res.json({
    message: 'Lead assigned successfully',
    lead: updatedLead,
  })
}))

// Lead status progression
router.post('/:id/advance-stage', requireLeadAccess, asyncHandler(async (req, res) => {
  const { id } = req.params

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { status: true }
  })

  if (!lead) {
    throw new NotFoundError('Lead')
  }

  // Define status progression
  const statusProgression: Record<string, string> = {
    'new': 'contacted',
    'contacted': 'qualified',
    'qualified': 'proposal',
    'proposal': 'negotiation',
    'negotiation': 'closed_won',
  }

  const nextStatus = statusProgression[lead.status]
  if (!nextStatus) {
    throw new ValidationError('Cannot advance lead stage further')
  }

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: {
      status: nextStatus as any,
      updatedAt: new Date(),
    },
    include: {
      assignedUser: {
        select: { id: true, fullName: true, email: true, avatarUrl: true }
      }
    }
  })

  businessLogger.trackConversion(id, lead.status, nextStatus, req.user!.id)

  res.json({
    message: 'Lead stage advanced successfully',
    lead: updatedLead,
    previousStatus: lead.status,
    newStatus: nextStatus,
  })
}))

export default router
