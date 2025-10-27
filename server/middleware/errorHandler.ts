// LeadAI Pro - Error Handler Middleware
// Centralized error handling for the API

import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export class AppError extends Error implements ApiError {
  statusCode: number
  code: string
  details?: any

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message)
    this.statusCode = statusCode
    this.code = code || 'INTERNAL_ERROR'
    this.details = details
    this.name = 'AppError'

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

// Handle Prisma errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[]
      return new ConflictError(
        `A record with this ${field?.join(', ')} already exists`
      )
    
    case 'P2025':
      // Record not found
      return new NotFoundError('Record')
    
    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError('Invalid reference to related record')
    
    case 'P2021':
      // Table does not exist
      return new AppError('Database table not found', 500, 'DATABASE_ERROR')
    
    case 'P2022':
      // Column does not exist
      return new AppError('Database column not found', 500, 'DATABASE_ERROR')
    
    default:
      return new AppError(
        'Database operation failed',
        500,
        'DATABASE_ERROR',
        { code: error.code, meta: error.meta }
      )
  }
}

// Main error handler middleware
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let appError: ApiError

  // Handle different types of errors
  if (error instanceof AppError) {
    appError = error
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error)
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = new ValidationError('Invalid data provided')
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid token')
  } else if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Token expired')
  } else if (error.name === 'ValidationError') {
    // Express-validator errors
    appError = new ValidationError(error.message)
  } else {
    // Generic error
    appError = new AppError(
      process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      500,
      'INTERNAL_ERROR'
    )
  }

  // Log error (in production, you might want to use a proper logging service)
  if (appError.statusCode >= 500) {
    console.error('Server Error:', {
      message: appError.message,
      stack: appError.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    })
  } else {
    console.warn('Client Error:', {
      message: appError.message,
      code: appError.code,
      url: req.url,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    })
  }

  // Send error response
  const errorResponse: any = {
    error: {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
    }
  }

  // Include details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = appError.stack
    if (appError.details) {
      errorResponse.error.details = appError.details
    }
  }

  // Include request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.error.requestId = req.headers['x-request-id']
  }

  res.status(appError.statusCode || 500).json(errorResponse)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.originalUrl}`))
}
