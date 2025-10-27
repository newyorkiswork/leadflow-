// LeadAI Pro - Database Utility
// Prisma client configuration and database utilities

import { PrismaClient } from '@prisma/client'

// Global Prisma client instance
declare global {
  var prisma: PrismaClient | undefined
}

// Create Prisma client with optimized configuration
export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

// Database utilities for common operations
export const db = {
  // Organization utilities
  organization: {
    async findByDomain(domain: string) {
      return prisma.organization.findFirst({
        where: { domain },
        include: {
          users: true,
          teams: true,
        }
      })
    },

    async getWithStats(organizationId: string) {
      const [organization, leadCount, userCount] = await Promise.all([
        prisma.organization.findUnique({
          where: { id: organizationId },
          include: {
            users: {
              select: { id: true, fullName: true, role: true, lastActiveAt: true }
            },
            teams: {
              select: { id: true, name: true, members: { select: { id: true } } }
            }
          }
        }),
        prisma.lead.count({ where: { organizationId } }),
        prisma.user.count({ where: { organizationId } })
      ])

      return {
        ...organization,
        stats: {
          totalLeads: leadCount,
          totalUsers: userCount,
          totalTeams: organization?.teams.length || 0
        }
      }
    }
  },

  // Lead utilities
  lead: {
    async findWithDetails(leadId: string) {
      return prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          assignedUser: {
            select: { id: true, fullName: true, email: true, avatarUrl: true }
          },
          team: {
            select: { id: true, name: true }
          },
          scores: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          insights: {
            where: { acknowledgedAt: null },
            orderBy: { priority: 'desc' }
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              user: {
                select: { fullName: true, avatarUrl: true }
              }
            }
          },
          conversations: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })
    },

    async searchLeads(organizationId: string, query: string, filters?: any) {
      const whereClause: any = {
        organizationId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } }
        ]
      }

      // Apply additional filters
      if (filters?.status) {
        whereClause.status = filters.status
      }
      if (filters?.assignedTo) {
        whereClause.assignedTo = filters.assignedTo
      }
      if (filters?.minScore) {
        whereClause.currentScore = { gte: filters.minScore }
      }

      return prisma.lead.findMany({
        where: whereClause,
        include: {
          assignedUser: {
            select: { fullName: true, avatarUrl: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      })
    },

    async updateScore(leadId: string, scoreData: {
      score: number
      confidence: number
      modelVersion: string
      explanation: any
      recommendations?: any
    }) {
      const [leadScore, updatedLead] = await Promise.all([
        prisma.leadScore.create({
          data: {
            leadId,
            ...scoreData
          }
        }),
        prisma.lead.update({
          where: { id: leadId },
          data: {
            currentScore: scoreData.score,
            scoreConfidence: scoreData.confidence,
            updatedAt: new Date()
          }
        })
      ])

      return { leadScore, updatedLead }
    }
  },

  // Activity utilities
  activity: {
    async createWithAnalysis(activityData: any) {
      return prisma.activity.create({
        data: activityData,
        include: {
          lead: {
            select: { id: true, firstName: true, lastName: true, company: true }
          },
          user: {
            select: { fullName: true, avatarUrl: true }
          }
        }
      })
    },

    async getLeadTimeline(leadId: string) {
      return prisma.activity.findMany({
        where: { leadId },
        include: {
          user: {
            select: { fullName: true, avatarUrl: true }
          },
          conversations: true
        },
        orderBy: { createdAt: 'desc' }
      })
    }
  },

  // Analytics utilities
  analytics: {
    async getLeadMetrics(organizationId: string, dateRange?: { start: Date; end: Date }) {
      const whereClause: any = { organizationId }
      
      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      const [
        totalLeads,
        qualifiedLeads,
        convertedLeads,
        averageScore
      ] = await Promise.all([
        prisma.lead.count({ where: whereClause }),
        prisma.lead.count({ 
          where: { ...whereClause, status: { in: ['qualified', 'proposal', 'negotiation'] } }
        }),
        prisma.lead.count({ 
          where: { ...whereClause, status: 'closed_won' }
        }),
        prisma.lead.aggregate({
          where: whereClause,
          _avg: { currentScore: true }
        })
      ])

      return {
        totalLeads,
        qualifiedLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        averageScore: averageScore._avg.currentScore || 0
      }
    },

    async getUserPerformance(userId: string, dateRange?: { start: Date; end: Date }) {
      const whereClause: any = { assignedTo: userId }
      
      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      const [leads, activities] = await Promise.all([
        prisma.lead.findMany({
          where: whereClause,
          select: { status: true, currentScore: true, predictedValue: true }
        }),
        prisma.activity.count({
          where: {
            userId,
            ...(dateRange && {
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end
              }
            })
          }
        })
      ])

      const totalLeads = leads.length
      const convertedLeads = leads.filter(l => l.status === 'closed_won').length
      const totalRevenue = leads
        .filter(l => l.status === 'closed_won')
        .reduce((sum, l) => sum + (Number(l.predictedValue) || 0), 0)

      return {
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        totalRevenue,
        averageDealSize: convertedLeads > 0 ? totalRevenue / convertedLeads : 0,
        totalActivities: activities
      }
    }
  }
}

// Export Prisma client as default
export default prisma
