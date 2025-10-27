// LeadAI Pro - Authentication Middleware
// JWT-based authentication with Supabase integration

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '../../lib/database'
import { AuthenticationError, AuthorizationError } from './errorHandler'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        organizationId: string
        teamId?: string
      }
    }
  }
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// JWT secret
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

// Authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided')
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token')
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: {
          select: { id: true, name: true, subscriptionTier: true }
        },
        team: {
          select: { id: true, name: true }
        }
      }
    })

    if (!user) {
      throw new AuthenticationError('User not found')
    }

    // Check if user is active (you can add more checks here)
    const now = new Date()
    const lastActive = new Date(user.lastActiveAt)
    const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSinceActive > 90) { // 90 days inactive
      throw new AuthenticationError('Account inactive')
    }

    // Update last active timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: now }
    })

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      teamId: user.teamId || undefined
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Role-based authorization middleware
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError())
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError(
        `Access denied. Required role: ${allowedRoles.join(' or ')}`
      ))
    }

    next()
  }
}

// Organization access middleware
export const requireOrganizationAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthenticationError())
  }

  // Check if the requested resource belongs to user's organization
  const organizationId = req.params.organizationId || req.body.organizationId
  
  if (organizationId && organizationId !== req.user.organizationId) {
    return next(new AuthorizationError('Access denied to this organization'))
  }

  next()
}

// Lead access middleware (user can only access leads in their organization)
export const requireLeadAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AuthenticationError())
    }

    const leadId = req.params.leadId || req.params.id
    if (!leadId) {
      return next()
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { organizationId: true, assignedTo: true }
    })

    if (!lead) {
      return next(new AuthenticationError('Lead not found'))
    }

    // Check organization access
    if (lead.organizationId !== req.user.organizationId) {
      return next(new AuthorizationError('Access denied to this lead'))
    }

    // Additional check: non-admin users can only access their assigned leads
    if (req.user.role === 'sales_rep' && lead.assignedTo !== req.user.id) {
      return next(new AuthorizationError('Access denied to this lead'))
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Generate JWT token
export const generateToken = (userId: string, expiresIn: string = '24h'): string => {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn }
  )
}

// Verify Supabase token (for additional security)
export const verifySupabaseToken = async (token: string) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new AuthenticationError('Invalid Supabase token')
    }

    return user
  } catch (error) {
    throw new AuthenticationError('Token verification failed')
  }
}

// Optional: Rate limiting per user
export const userRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next()
    }

    const userId = req.user.id
    const now = Date.now()
    const userLimit = userRequests.get(userId)

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize user limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }

    if (userLimit.count >= maxRequests) {
      return next(new AuthenticationError('User rate limit exceeded'))
    }

    userLimit.count++
    next()
  }
}

// Subscription tier middleware
export const requireSubscriptionTier = (requiredTier: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AuthenticationError())
      }

      const organization = await prisma.organization.findUnique({
        where: { id: req.user.organizationId },
        select: { subscriptionTier: true }
      })

      if (!organization) {
        return next(new AuthorizationError('Organization not found'))
      }

      const tierHierarchy = ['free', 'starter', 'professional', 'enterprise']
      const userTierIndex = tierHierarchy.indexOf(organization.subscriptionTier)
      const requiredTierIndex = tierHierarchy.indexOf(requiredTier)

      if (userTierIndex < requiredTierIndex) {
        return next(new AuthorizationError(
          `This feature requires ${requiredTier} subscription or higher`
        ))
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
