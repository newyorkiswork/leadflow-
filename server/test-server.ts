// LeadAI Pro - Simple Server Test
// Basic server test without database dependency

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()
const PORT = process.env.PORT || 3001

// Basic middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Test health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'LeadAI Pro API Server is running',
    version: '1.0.0',
  })
})

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`)
})

export default app
