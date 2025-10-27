// LeadAI Pro - Authentication Routes
// JWT-based authentication with Supabase integration

import express from 'express'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '../../lib/database'
import { generateToken } from '../middleware/auth'
import { ValidationError, AuthenticationError, ConflictError } from '../middleware/errorHandler'
import { asyncHandler } from '../middleware/errorHandler'
import { securityLogger } from '../middleware/logger'

const router = express.Router()

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('fullName').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('organizationName').isLength({ min: 2 }).withMessage('Organization name must be at least 2 characters'),
]

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

// Register new user and organization
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array())
  }

  const { email, password, fullName, organizationName, organizationDomain, industry } = req.body

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    throw new ConflictError('User with this email already exists')
  }

  // Check if organization domain is already taken
  if (organizationDomain) {
    const existingOrg = await prisma.organization.findFirst({
      where: { domain: organizationDomain }
    })

    if (existingOrg) {
      throw new ConflictError('Organization domain already taken')
    }
  }

  // Create Supabase user
  const { data: supabaseUser, error: supabaseError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (supabaseError) {
    throw new ValidationError(`Registration failed: ${supabaseError.message}`)
  }

  // Hash password for our database
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create organization and user in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        domain: organizationDomain,
        industry,
        size: 'startup', // Default size
      }
    })

    // Create user
    const user = await tx.user.create({
      data: {
        id: supabaseUser.user!.id,
        email,
        fullName,
        role: 'admin', // First user is admin
        organizationId: organization.id,
      }
    })

    return { organization, user }
  })

  // Generate JWT token
  const token = generateToken(result.user.id)

  // Log successful registration
  securityLogger.trackAuth('login', email, req.ip)

  res.status(201).json({
    message: 'Registration successful',
    user: {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
      organizationId: result.user.organizationId,
    },
    organization: {
      id: result.organization.id,
      name: result.organization.name,
      domain: result.organization.domain,
    },
    token,
  })
}))

// Login user
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array())
  }

  const { email, password } = req.body

  // Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    securityLogger.trackAuth('failed_login', email, req.ip)
    throw new AuthenticationError('Invalid email or password')
  }

  // Get user from our database
  const user = await prisma.user.findUnique({
    where: { id: authData.user.id },
    include: {
      organization: {
        select: { id: true, name: true, domain: true, subscriptionTier: true }
      },
      team: {
        select: { id: true, name: true }
      }
    }
  })

  if (!user) {
    throw new AuthenticationError('User not found')
  }

  // Update last active timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() }
  })

  // Generate JWT token
  const token = generateToken(user.id)

  // Log successful login
  securityLogger.trackAuth('login', email, req.ip)

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      teamId: user.teamId,
    },
    organization: user.organization,
    team: user.team,
    token,
  })
}))

// Logout user
router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // In a production app, you might want to blacklist the JWT token
    // For now, we'll just log the logout
    securityLogger.trackAuth('logout', 'unknown', req.ip)
  }

  res.json({ message: 'Logout successful' })
}))

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token required')
  }

  // Refresh Supabase session
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken
  })

  if (error || !data.user) {
    throw new AuthenticationError('Invalid refresh token')
  }

  // Generate new JWT token
  const token = generateToken(data.user.id)

  res.json({
    message: 'Token refreshed successfully',
    token,
    refreshToken: data.session?.refresh_token,
  })
}))

// Get current user profile
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided')
  }

  const token = authHeader.substring(7)

  // Verify Supabase token
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new AuthenticationError('Invalid token')
  }

  // Get user from our database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      organization: {
        select: { id: true, name: true, domain: true, subscriptionTier: true }
      },
      team: {
        select: { id: true, name: true }
      }
    }
  })

  if (!dbUser) {
    throw new AuthenticationError('User not found')
  }

  res.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: dbUser.role,
      organizationId: dbUser.organizationId,
      teamId: dbUser.teamId,
      preferences: dbUser.preferences,
      aiSettings: dbUser.aiSettings,
    },
    organization: dbUser.organization,
    team: dbUser.team,
  })
}))

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array())
  }

  const { email } = req.body

  // Send password reset email via Supabase
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXTAUTH_URL}/reset-password`,
  })

  if (error) {
    throw new ValidationError(`Password reset failed: ${error.message}`)
  }

  res.json({
    message: 'Password reset email sent successfully',
  })
}))

// Reset password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array())
  }

  const { token, password } = req.body

  // Update password via Supabase
  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    throw new ValidationError(`Password reset failed: ${error.message}`)
  }

  res.json({
    message: 'Password reset successful',
  })
}))

export default router
