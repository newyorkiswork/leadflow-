// Lead AI Pro - AI Middleware (2025)
// Express middleware for AI service integration with monitoring and optimization

import { Request, Response, NextFunction } from 'express'
import { getAIServiceManager, getAIHealthStatus, getAIMetrics } from '../../lib/ai'
import { prisma } from '../../lib/database'

// Extend Request interface to include AI context
declare global {
  namespace Express {
    interface Request {
      ai?: {
        manager: any
        metrics: any
        rateLimitStatus: any
        userId?: string
        organizationId?: string
      }
    }
  }
}

// AI service initialization middleware
export const initializeAI = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const manager = getAIServiceManager()
    const metrics = manager.getMetrics()
    const rateLimitStatus = manager.getRateLimitStatus()

    req.ai = {
      manager,
      metrics,
      rateLimitStatus,
      userId: req.user?.id,
      organizationId: req.user?.organizationId
    }

    next()
  } catch (error) {
    console.error('AI initialization failed:', error)
    res.status(503).json({
      error: 'AI services unavailable',
      message: 'AI services are currently unavailable. Please try again later.'
    })
  }
}

// Rate limiting middleware for AI requests
export const aiRateLimit = (req: Request, res: Response, next: NextFunction) => {
  if (!req.ai?.rateLimitStatus) {
    return res.status(500).json({ error: 'AI context not initialized' })
  }

  if (req.ai.rateLimitStatus.isLimited) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many AI requests. Please try again later.',
      retryAfter: 60 // seconds
    })
  }

  next()
}

// Subscription tier validation for AI features
export const validateAIFeature = (requiredTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const organization = await prisma.organization.findUnique({
        where: { id: req.user.organizationId },
        select: { subscriptionTier: true, subscriptionStatus: true }
      })

      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
      }

      if (organization.subscriptionStatus !== 'ACTIVE') {
        return res.status(403).json({
          error: 'Subscription inactive',
          message: 'Your subscription is not active. Please update your billing information.'
        })
      }

      const tierHierarchy = {
        STARTER: 1,
        PROFESSIONAL: 2,
        ENTERPRISE: 3,
        CUSTOM: 4
      }

      const userTier = tierHierarchy[organization.subscriptionTier as keyof typeof tierHierarchy] || 0
      const requiredTierLevel = tierHierarchy[requiredTier]

      if (userTier < requiredTierLevel) {
        return res.status(403).json({
          error: 'Upgrade required',
          message: `This feature requires ${requiredTier} subscription or higher.`,
          currentTier: organization.subscriptionTier,
          requiredTier
        })
      }

      next()
    } catch (error) {
      console.error('Subscription validation failed:', error)
      res.status(500).json({ error: 'Subscription validation failed' })
    }
  }
}

// AI request logging and monitoring
export const logAIRequest = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  const originalSend = res.send

  res.send = function(data) {
    const responseTime = Date.now() - startTime
    
    // Log AI request
    const logData = {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      responseTime,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date()
    }

    // Log to database asynchronously
    setImmediate(async () => {
      try {
        await prisma.journeyEvent.create({
          data: {
            leadId: 'system',
            eventType: 'ai_request',
            eventName: 'AI API Request',
            description: `${req.method} ${req.path}`,
            properties: logData
          }
        })
      } catch (error) {
        console.error('Failed to log AI request:', error)
      }
    })

    return originalSend.call(this, data)
  }

  next()
}

// AI health check middleware
export const aiHealthCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await getAIHealthStatus()
    
    if (health.status === 'unhealthy') {
      return res.status(503).json({
        error: 'AI services unhealthy',
        message: 'AI services are experiencing issues. Some features may be unavailable.',
        health
      })
    }

    if (health.status === 'degraded') {
      // Add warning header but continue
      res.set('X-AI-Status', 'degraded')
      res.set('X-AI-Message', 'AI services are experiencing degraded performance')
    }

    next()
  } catch (error) {
    console.error('AI health check failed:', error)
    res.status(503).json({
      error: 'AI health check failed',
      message: 'Unable to verify AI service health'
    })
  }
}

// Error handling for AI requests
export const handleAIError = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('AI request error:', error)

  // Update AI metrics
  if (req.ai?.manager) {
    // Error is already tracked in AIServiceManager
  }

  // Determine error type and response
  if (error.name === 'OpenAIError') {
    return res.status(502).json({
      error: 'AI service error',
      message: 'The AI service is temporarily unavailable. Please try again.',
      code: 'AI_SERVICE_ERROR'
    })
  }

  if (error.message?.includes('rate limit')) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: 60
    })
  }

  if (error.message?.includes('timeout')) {
    return res.status(504).json({
      error: 'Request timeout',
      message: 'The AI request took too long to process. Please try again.',
      code: 'AI_TIMEOUT'
    })
  }

  // Generic AI error
  res.status(500).json({
    error: 'AI processing failed',
    message: 'An error occurred while processing your AI request.',
    code: 'AI_PROCESSING_ERROR'
  })
}

// AI metrics endpoint middleware
export const aiMetricsEndpoint = async (req: Request, res: Response) => {
  try {
    const metrics = getAIMetrics()
    const health = await getAIHealthStatus()
    const manager = getAIServiceManager()
    const cacheStats = manager.getCacheStats()
    const rateLimitStatus = manager.getRateLimitStatus()

    res.json({
      health,
      metrics,
      cacheStats,
      rateLimitStatus,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Failed to get AI metrics:', error)
    res.status(500).json({ error: 'Failed to retrieve AI metrics' })
  }
}

// AI feature usage tracking
export const trackAIUsage = (featureName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Track feature usage
      await prisma.journeyEvent.create({
        data: {
          leadId: 'system',
          eventType: 'ai_feature_usage',
          eventName: `AI Feature Used: ${featureName}`,
          description: `User accessed ${featureName} AI feature`,
          properties: {
            feature: featureName,
            userId: req.user?.id,
            organizationId: req.user?.organizationId,
            timestamp: new Date()
          }
        }
      })

      next()
    } catch (error) {
      console.error('Failed to track AI usage:', error)
      // Don't fail the request if tracking fails
      next()
    }
  }
}

// AI request validation
export const validateAIRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      })
    }

    next()
  }
}

// AI response optimization
export const optimizeAIResponse = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json

  res.json = function(data) {
    // Optimize response based on client capabilities
    const acceptsCompression = req.get('Accept-Encoding')?.includes('gzip')
    const isMobile = req.get('User-Agent')?.includes('Mobile')

    if (isMobile && data.insights) {
      // Reduce data for mobile clients
      data.insights = data.insights.slice(0, 5)
    }

    // Add AI metadata
    data._ai = {
      processingTime: res.get('X-Response-Time'),
      confidence: data.confidence || 0.8,
      cached: res.get('X-Cache-Status') === 'HIT',
      version: '2025.1'
    }

    return originalJson.call(this, data)
  }

  next()
}

export {
  initializeAI,
  aiRateLimit,
  validateAIFeature,
  logAIRequest,
  aiHealthCheck,
  handleAIError,
  aiMetricsEndpoint,
  trackAIUsage,
  validateAIRequest,
  optimizeAIResponse
}
