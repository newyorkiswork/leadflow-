// Simple test server for LeadFlow AI
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}))

app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Mock property search endpoint
app.post('/api/properties/search', (req, res) => {
  const { filters = {}, page = 1, pageSize = 20 } = req.body
  
  // Mock property data
  const mockProperties = [
    {
      id: 'prop_1',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      coordinates: { lat: 40.7831, lng: -73.9712 },
      price: 450000,
      marketValue: 520000,
      equity: 70000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      aiScore: 92,
      investmentStrategy: 'Fix & Flip',
      daysOnMarket: 15,
      photos: ['https://via.placeholder.com/400x300']
    },
    {
      id: 'prop_2',
      address: '456 Oak Ave',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201',
      coordinates: { lat: 40.6782, lng: -73.9442 },
      price: 320000,
      marketValue: 380000,
      equity: 60000,
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 900,
      aiScore: 88,
      investmentStrategy: 'BRRRR',
      daysOnMarket: 22,
      photos: ['https://via.placeholder.com/400x300']
    }
  ]

  res.json({
    results: mockProperties,
    totalCount: mockProperties.length,
    page,
    pageSize,
    searchTime: 0.5,
    filters
  })
})

// Mock geolocation search
app.post('/api/geolocation/search', (req, res) => {
  const { query, limit = 10 } = req.body
  
  const mockLocations = [
    { id: 'nyc', name: 'New York City', state: 'NY', type: 'city' },
    { id: 'manhattan', name: 'Manhattan', state: 'NY', type: 'neighborhood' },
    { id: 'brooklyn', name: 'Brooklyn', state: 'NY', type: 'neighborhood' }
  ]

  const filtered = mockLocations.filter(loc => 
    loc.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, limit)

  res.json({
    results: filtered,
    query,
    totalCount: filtered.length
  })
})

// Mock nearby locations
app.post('/api/geolocation/nearby', (req, res) => {
  const { lat, lng, radius = 25 } = req.body
  
  const mockNearby = [
    { id: 'loc_1', name: 'Manhattan', distance: 2.5, type: 'neighborhood' },
    { id: 'loc_2', name: 'Brooklyn', distance: 8.3, type: 'neighborhood' },
    { id: 'loc_3', name: 'Queens', distance: 12.1, type: 'neighborhood' }
  ]

  res.json({
    results: mockNearby,
    center: { lat, lng },
    radius,
    totalCount: mockNearby.length
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LeadFlow AI Backend Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🏠 Property search: http://localhost:${PORT}/api/properties/search`)
  console.log(`📍 Geolocation: http://localhost:${PORT}/api/geolocation/search`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  process.exit(0)
})
