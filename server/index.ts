// LeadAI Pro - Backend Server
// Express.js server with TypeScript, middleware, and API routes

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { checkDatabaseConnection } from '../lib/database'

// Load environment variables
dotenv.config()

// Import routes
import authRoutes from './routes/auth'
import leadRoutes from './routes/leads'
import userRoutes from './routes/users'
import organizationRoutes from './routes/organizations'
import activityRoutes from './routes/activities'
import analyticsRoutes from './routes/analytics'
import aiRoutes from './routes/ai'
import propertyRoutes from './routes/properties'
import geolocationRoutes from './routes/geolocation'

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { authMiddleware } from './middleware/auth'
import { requestLogger } from './middleware/logger'

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
app.use(morgan('combined'))
app.use(requestLogger)

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection()
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbConnected ? 'connected' : 'disconnected',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    })
  }
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/leads', authMiddleware, leadRoutes)
app.use('/api/users', authMiddleware, userRoutes)
app.use('/api/organizations', authMiddleware, organizationRoutes)
app.use('/api/activities', authMiddleware, activityRoutes)
app.use('/api/analytics', authMiddleware, analyticsRoutes)
app.use('/api/ai', authMiddleware, aiRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/geolocation', geolocationRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Database health check
app.get('/api/health/database', async (req, res) => {
  try {
    const isConnected = await checkDatabaseConnection()
    res.json({
      status: isConnected ? 'healthy' : 'unhealthy',
      database: 'postgresql',
      connected: isConnected,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'postgresql',
      connected: false,
      error: String(error),
      timestamp: new Date().toISOString()
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist.`,
  })
})

// Global error handler
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  process.exit(0)
})

// Start server
const startServer = async () => {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection()
    if (!dbConnected) {
      console.error('❌ Database connection failed')
      process.exit(1)
    }

    app.listen(PORT, () => {
      console.log(`🚀 LeadAI Pro API Server running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🗄️  Database: Connected`)
      console.log(`🔗 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()

export default app
