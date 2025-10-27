// LeadFlow AI - Property Search API Routes
// Real estate property search, filtering, and market analysis endpoints

import { Router } from 'express'
import { body, query, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth } from '../middleware/auth'
import { nationalProperties, searchProperties, getPropertiesByState, getPropertiesByCity } from '../../frontend/src/data/nationalPropertyDatabase'
import { nationalMarketData, getStateMarketData, getCityMarketData } from '../../frontend/src/data/nationalMarketData'

const router = Router()

// Property search with filters
router.post('/search', [
  body('filters').optional().isObject(),
  body('page').optional().isInt({ min: 1 }),
  body('pageSize').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    })
  }

  const { filters = {}, page = 1, pageSize = 20 } = req.body
  const startTime = Date.now()

  try {
    // Use national property database for search
    let results = [...nationalProperties]

    // Apply location filter
    if (filters.location) {
      results = searchProperties(filters.location)
    }

    // Apply price filters
    if (filters.minPrice) {
      results = results.filter(p => p.listPrice >= filters.minPrice)
    }
    if (filters.maxPrice) {
      results = results.filter(p => p.listPrice <= filters.maxPrice)
    }

    // Apply bedroom/bathroom filters
    if (filters.minBeds) {
      results = results.filter(p => p.bedrooms >= filters.minBeds)
    }
    if (filters.minBaths) {
      results = results.filter(p => p.bathrooms >= filters.minBaths)
    }

    // Apply property type filter
    if (filters.propertyType && filters.propertyType !== 'All') {
      results = results.filter(p => p.propertyType === filters.propertyType)
    }

    // Apply investment strategy filter
    if (filters.investmentStrategy && filters.investmentStrategy !== 'All') {
      results = results.filter(p => p.investmentStrategy === filters.investmentStrategy)
    }

    // Apply AI score filter
    if (filters.minAIScore) {
      results = results.filter(p => p.aiScore >= filters.minAIScore)
    }

    // Apply days on market filter
    if (filters.maxDaysOnMarket) {
      results = results.filter(p => p.daysOnMarket <= filters.maxDaysOnMarket)
    }

    // Apply condition filter
    if (filters.condition && filters.condition !== 'All') {
      results = results.filter(p => p.condition === filters.condition)
    }

    // Apply equity filter
    if (filters.hasEquity) {
      results = results.filter(p => p.equity > 0)
    }

    // Pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedResults = results.slice(startIndex, endIndex)

    const searchTime = Date.now() - startTime

    res.json({
      results: paginatedResults,
      totalCount: results.length,
      page,
      pageSize,
      searchTime,
      filters
    })
  } catch (error) {
    console.error('Property search error:', error)
    res.status(500).json({ error: 'Failed to search properties' })
  }
}))

// Get property details by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const property = nationalProperties.find(p => p.id === id)
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' })
    }

    // Add additional details for single property view
    const propertyDetails = {
      ...property,
      ownerInfo: {
        name: `Owner ${property.id}`,
        motivation: Math.random() > 0.5 ? 'High' : 'Medium',
        ownerOccupied: Math.random() > 0.5
      },
      marketTrends: {
        priceAppreciation: Math.random() * 10 - 2,
        rentGrowth: Math.random() * 8 + 2,
        marketHeat: property.marketTrend === 'Rising' ? 'Hot' : 'Warm',
        competitionLevel: 'Medium'
      },
      nearbyComps: nationalProperties
        .filter(p => p.city === property.city && p.id !== property.id)
        .slice(0, 5)
    }

    res.json(propertyDetails)
  } catch (error) {
    console.error('Get property details error:', error)
    res.status(500).json({ error: 'Failed to get property details' })
  }
}))

// Search properties near coordinates
router.post('/near', [
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 }),
  body('radius').optional().isFloat({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    })
  }

  const { lat, lng, radius = 5, filters = {} } = req.body

  try {
    // Calculate distance and filter properties
    const nearbyProperties = nationalProperties
      .map(property => {
        const distance = calculateDistance(lat, lng, property.coordinates.lat, property.coordinates.lng)
        return { ...property, distance }
      })
      .filter(property => property.distance <= radius * 1609.34) // Convert miles to meters
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50) // Limit to 50 nearest properties

    res.json({
      results: nearbyProperties,
      center: { lat, lng },
      radius,
      totalCount: nearbyProperties.length
    })
  } catch (error) {
    console.error('Nearby properties search error:', error)
    res.status(500).json({ error: 'Failed to search nearby properties' })
  }
}))

// Get market insights for location
router.post('/market-insights', [
  body('location').isString().isLength({ min: 1 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    })
  }

  const { location } = req.body

  try {
    // Get market data for location
    const marketData = nationalMarketData.find(m => 
      m.location.toLowerCase().includes(location.toLowerCase()) ||
      location.toLowerCase().includes(m.location.toLowerCase())
    )

    if (!marketData) {
      return res.status(404).json({ error: 'Market data not found for location' })
    }

    // Get properties in the area for additional insights
    const areaProperties = searchProperties(location)
    
    const insights = {
      location: marketData.location,
      medianPrice: marketData.medianPrice,
      priceChange: marketData.priceChange,
      medianRent: marketData.medianRent,
      rentYield: marketData.rentYield,
      daysOnMarket: marketData.daysOnMarket,
      inventoryLevel: marketData.inventoryLevel,
      marketTrend: marketData.marketTrend,
      investmentOpportunity: marketData.investmentOpportunity,
      competitionLevel: marketData.competitionLevel,
      totalProperties: areaProperties.length,
      averageAIScore: areaProperties.reduce((sum, p) => sum + p.aiScore, 0) / areaProperties.length || 0,
      hotDeals: areaProperties.filter(p => p.aiScore >= 90).length,
      recommendations: [
        'Focus on fix and flip opportunities',
        'Consider BRRRR strategy for cash flow',
        'Monitor market trends closely',
        'Target properties with high equity potential'
      ]
    }

    res.json(insights)
  } catch (error) {
    console.error('Market insights error:', error)
    res.status(500).json({ error: 'Failed to get market insights' })
  }
}))

// Get trending properties
router.get('/trending', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query

  try {
    const trendingProperties = nationalProperties
      .filter(p => p.aiScore >= 85 && p.daysOnMarket <= 30 && p.equity > 0)
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, Number(limit))

    res.json({
      results: trendingProperties,
      totalCount: trendingProperties.length,
      criteria: {
        minAIScore: 85,
        maxDaysOnMarket: 30,
        hasEquity: true
      }
    })
  } catch (error) {
    console.error('Trending properties error:', error)
    res.status(500).json({ error: 'Failed to get trending properties' })
  }
}))

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export default router
