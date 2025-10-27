// LeadAI Pro - Request Logger Middleware
// Advanced logging for API requests and responses

import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

// Extend Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string
      startTime?: number
    }
  }
}

// Request logger middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique request ID
  req.requestId = uuidv4()
  req.startTime = Date.now()

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId)

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
  })

  // Override res.json to log responses
  const originalJson = res.json
  res.json = function(body: any) {
    const duration = Date.now() - (req.startTime || 0)
    
    // Log response
    console.log(`[${new Date().toISOString()}] Response ${res.statusCode}`, {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      method: req.method,
      url: req.url,
      userId: req.user?.id,
    })

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.url} took ${duration}ms`, {
        requestId: req.requestId,
        duration,
        userId: req.user?.id,
      })
    }

    return originalJson.call(this, body)
  }

  next()
}

// API metrics logger
export const metricsLogger = {
  // Track API endpoint usage
  trackEndpoint: (endpoint: string, method: string, userId?: string) => {
    console.log(`[METRICS] API Usage`, {
      endpoint,
      method,
      userId,
      timestamp: new Date().toISOString(),
    })
  },

  // Track AI service usage
  trackAIUsage: (service: string, userId: string, organizationId: string, tokens?: number) => {
    console.log(`[METRICS] AI Usage`, {
      service,
      userId,
      organizationId,
      tokens,
      timestamp: new Date().toISOString(),
    })
  },

  // Track database query performance
  trackQuery: (query: string, duration: number, userId?: string) => {
    console.log(`[METRICS] Database Query`, {
      query,
      duration: `${duration}ms`,
      userId,
      timestamp: new Date().toISOString(),
    })

    if (duration > 500) {
      console.warn(`[SLOW QUERY] ${query} took ${duration}ms`, {
        duration,
        userId,
      })
    }
  },

  // Track errors
  trackError: (error: Error, req: Request) => {
    console.error(`[METRICS] Error`, {
      message: error.message,
      stack: error.stack,
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      timestamp: new Date().toISOString(),
    })
  },
}

// Security logger
export const securityLogger = {
  // Track authentication attempts
  trackAuth: (event: 'login' | 'logout' | 'failed_login', email: string, ip: string) => {
    console.log(`[SECURITY] Auth Event: ${event}`, {
      event,
      email,
      ip,
      timestamp: new Date().toISOString(),
    })
  },

  // Track suspicious activity
  trackSuspicious: (event: string, details: any, req: Request) => {
    console.warn(`[SECURITY] Suspicious Activity: ${event}`, {
      event,
      details,
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    })
  },

  // Track permission violations
  trackPermissionViolation: (resource: string, action: string, req: Request) => {
    console.warn(`[SECURITY] Permission Violation`, {
      resource,
      action,
      requestId: req.requestId,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    })
  },
}

// Performance logger
export const performanceLogger = {
  // Track response times
  trackResponseTime: (endpoint: string, method: string, duration: number, userId?: string) => {
    const logLevel = duration > 1000 ? 'warn' : 'log'
    console[logLevel](`[PERFORMANCE] ${method} ${endpoint}`, {
      endpoint,
      method,
      duration: `${duration}ms`,
      userId,
      timestamp: new Date().toISOString(),
    })
  },

  // Track memory usage
  trackMemoryUsage: () => {
    const memUsage = process.memoryUsage()
    console.log(`[PERFORMANCE] Memory Usage`, {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString(),
    })
  },
}

// Business logic logger
export const businessLogger = {
  // Track lead activities
  trackLeadActivity: (leadId: string, activity: string, userId: string, organizationId: string) => {
    console.log(`[BUSINESS] Lead Activity`, {
      leadId,
      activity,
      userId,
      organizationId,
      timestamp: new Date().toISOString(),
    })
  },

  // Track AI insights
  trackAIInsight: (leadId: string, insightType: string, confidence: number, userId: string) => {
    console.log(`[BUSINESS] AI Insight Generated`, {
      leadId,
      insightType,
      confidence,
      userId,
      timestamp: new Date().toISOString(),
    })
  },

  // Track conversions
  trackConversion: (leadId: string, fromStatus: string, toStatus: string, userId: string) => {
    console.log(`[BUSINESS] Lead Conversion`, {
      leadId,
      fromStatus,
      toStatus,
      userId,
      timestamp: new Date().toISOString(),
    })
  },
}

// Initialize performance monitoring
setInterval(() => {
  performanceLogger.trackMemoryUsage()
}, 5 * 60 * 1000) // Every 5 minutes
