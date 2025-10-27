// Simple JavaScript server for LeadFlow AI Backend Testing
const express = require('express')
const cors = require('cors')

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
    environment: process.env.NODE_ENV || 'development',
    message: 'LeadFlow AI Backend is running successfully!'
  })
})

// Database health check
app.get('/api/health/database', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'mock',
    connected: true,
    timestamp: new Date().toISOString(),
    message: 'Mock database connection successful'
  })
})

// Performance health check
app.get('/api/health/performance', (req, res) => {
  res.json({
    status: 'healthy',
    responseTime: Math.random() * 100 + 50,
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  })
})

// Mock property search endpoint
app.post('/api/properties/search', (req, res) => {
  const { filters = {}, page = 1, pageSize = 20 } = req.body
  
  // Enhanced mock property data
  const mockProperties = [
    {
      id: 'prop_1',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      coordinates: { lat: 40.7831, lng: -73.9712 },
      listPrice: 450000,
      marketValue: 520000,
      equity: 70000,
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1200,
      aiScore: 92,
      investmentStrategy: 'Fix & Flip',
      daysOnMarket: 15,
      propertyType: 'Single Family',
      condition: 'Good',
      images: ['https://via.placeholder.com/400x300/0066cc/ffffff?text=Property+1'],
      isHot: true
    },
    {
      id: 'prop_2',
      address: '456 Oak Ave',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201',
      coordinates: { lat: 40.6782, lng: -73.9442 },
      listPrice: 320000,
      marketValue: 380000,
      equity: 60000,
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 900,
      aiScore: 88,
      investmentStrategy: 'BRRRR',
      daysOnMarket: 22,
      propertyType: 'Condo',
      condition: 'Fair',
      images: ['https://via.placeholder.com/400x300/009966/ffffff?text=Property+2'],
      isHot: false
    },
    {
      id: 'prop_3',
      address: '789 Park Blvd',
      city: 'Manhattan',
      state: 'NY',
      zipCode: '10002',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      listPrice: 680000,
      marketValue: 750000,
      equity: 70000,
      bedrooms: 4,
      bathrooms: 3,
      squareFootage: 1800,
      aiScore: 95,
      investmentStrategy: 'Buy & Hold',
      daysOnMarket: 8,
      propertyType: 'Townhouse',
      condition: 'Excellent',
      images: ['https://via.placeholder.com/400x300/cc6600/ffffff?text=Property+3'],
      isHot: true
    }
  ]

  // Apply filters
  let filteredProperties = [...mockProperties]

  if (filters.location) {
    filteredProperties = filteredProperties.filter(p => 
      p.city.toLowerCase().includes(filters.location.toLowerCase()) ||
      p.state.toLowerCase().includes(filters.location.toLowerCase()) ||
      p.address.toLowerCase().includes(filters.location.toLowerCase())
    )
  }

  if (filters.minPrice) {
    filteredProperties = filteredProperties.filter(p => p.listPrice >= filters.minPrice)
  }

  if (filters.maxPrice) {
    filteredProperties = filteredProperties.filter(p => p.listPrice <= filters.maxPrice)
  }

  if (filters.minAIScore) {
    filteredProperties = filteredProperties.filter(p => p.aiScore >= filters.minAIScore)
  }

  res.json({
    results: filteredProperties,
    totalCount: filteredProperties.length,
    page,
    pageSize,
    searchTime: Math.random() * 2 + 0.5,
    filters
  })
})

// Get property details
app.get('/api/properties/:id', (req, res) => {
  const { id } = req.params
  
  const property = {
    id,
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    coordinates: { lat: 40.7831, lng: -73.9712 },
    listPrice: 450000,
    marketValue: 520000,
    equity: 70000,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1200,
    aiScore: 92,
    investmentStrategy: 'Fix & Flip',
    daysOnMarket: 15,
    propertyType: 'Single Family',
    condition: 'Good',
    images: ['https://via.placeholder.com/400x300/0066cc/ffffff?text=Property+Details'],
    description: 'Beautiful property with great investment potential.',
    ownerInfo: {
      name: 'John Doe',
      motivation: 'High',
      ownerOccupied: false
    }
  }

  res.json(property)
})

// Mock geolocation search
app.post('/api/geolocation/search', (req, res) => {
  const { query, limit = 10 } = req.body
  
  const mockLocations = [
    { id: 'nyc', name: 'New York City', state: 'NY', type: 'city', coordinates: { lat: 40.7831, lng: -73.9712 } },
    { id: 'manhattan', name: 'Manhattan', state: 'NY', type: 'neighborhood', coordinates: { lat: 40.7831, lng: -73.9712 } },
    { id: 'brooklyn', name: 'Brooklyn', state: 'NY', type: 'neighborhood', coordinates: { lat: 40.6782, lng: -73.9442 } },
    { id: 'queens', name: 'Queens', state: 'NY', type: 'neighborhood', coordinates: { lat: 40.7282, lng: -73.7949 } },
    { id: 'bronx', name: 'Bronx', state: 'NY', type: 'neighborhood', coordinates: { lat: 40.8448, lng: -73.8648 } }
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
    { id: 'loc_1', name: 'Manhattan', distance: 2.5, type: 'neighborhood', coordinates: { lat: 40.7831, lng: -73.9712 } },
    { id: 'loc_2', name: 'Brooklyn', distance: 8.3, type: 'neighborhood', coordinates: { lat: 40.6782, lng: -73.9442 } },
    { id: 'loc_3', name: 'Queens', distance: 12.1, type: 'neighborhood', coordinates: { lat: 40.7282, lng: -73.7949 } }
  ]

  res.json({
    results: mockNearby,
    center: { lat, lng },
    radius,
    totalCount: mockNearby.length
  })
})

// Mock reverse geocoding
app.post('/api/geolocation/reverse', (req, res) => {
  const { lat, lng } = req.body
  
  res.json({
    address: `${Math.floor(Math.random() * 999) + 1} Main St, New York, NY 10001`,
    coordinates: { lat, lng },
    nearbyLocations: [
      { name: 'Manhattan', distance: 0.5 },
      { name: 'Central Park', distance: 1.2 },
      { name: 'Times Square', distance: 2.1 }
    ]
  })
})

// Mock user favorites
app.get('/api/users/favorites', (req, res) => {
  res.json({
    results: [
      { id: 'prop_1', type: 'property', addedAt: new Date().toISOString() },
      { id: 'prop_3', type: 'property', addedAt: new Date().toISOString() }
    ]
  })
})

app.post('/api/users/favorites', (req, res) => {
  const { propertyId, type } = req.body
  res.json({
    success: true,
    message: 'Added to favorites',
    propertyId,
    type
  })
})

app.delete('/api/users/favorites/:id', (req, res) => {
  const { id } = req.params
  res.json({
    success: true,
    message: 'Removed from favorites',
    propertyId: id
  })
})

// Mock market insights
app.post('/api/properties/market-insights', (req, res) => {
  const { location } = req.body
  
  res.json({
    location,
    medianPrice: 450000,
    priceChange: 5.2,
    medianRent: 2800,
    rentYield: 7.5,
    daysOnMarket: 25,
    inventoryLevel: 'Low',
    marketTrend: 'Rising',
    investmentOpportunity: 'High',
    competitionLevel: 'Medium',
    totalProperties: 1247,
    averageAIScore: 87,
    hotDeals: 23,
    recommendations: [
      'Focus on fix and flip opportunities',
      'Consider BRRRR strategy for cash flow',
      'Monitor market trends closely',
      'Target properties with high equity potential'
    ]
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LeadFlow AI Backend Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🏠 Property search: http://localhost:${PORT}/api/properties/search`)
  console.log(`📍 Geolocation: http://localhost:${PORT}/api/geolocation/search`)
  console.log(`💡 Ready for frontend integration testing!`)
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
