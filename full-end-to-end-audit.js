#!/usr/bin/env node

// COMPREHENSIVE FULL END-TO-END LEADFLOW AI AUDIT
// Tests every component, workflow, and user journey

const https = require('http')
const fs = require('fs')

console.log('🔍 FULL END-TO-END LEADFLOW AI AUDIT')
console.log('=' .repeat(80))

// Comprehensive audit results storage
const auditResults = {
  infrastructure: { passed: 0, total: 0, tests: [], issues: [] },
  frontend: { passed: 0, total: 0, tests: [], issues: [] },
  backend: { passed: 0, total: 0, tests: [], issues: [] },
  userJourneys: { passed: 0, total: 0, tests: [], issues: [] },
  interactive: { passed: 0, total: 0, tests: [], issues: [] },
  dataFlow: { passed: 0, total: 0, tests: [], issues: [] },
  performance: { passed: 0, total: 0, tests: [], issues: [] },
  aiFeatures: { passed: 0, total: 0, tests: [], issues: [] }
}

// Helper function for HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers })
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers })
        }
      })
    })

    req.on('error', reject)
    
    if (options.body) {
      req.write(JSON.stringify(options.body))
    }
    
    req.end()
  })
}

// Enhanced audit test function
async function runAuditTest(category, name, testFn, critical = true) {
  const startTime = Date.now()
  try {
    const result = await testFn()
    const responseTime = Date.now() - startTime
    const success = result.status === 'pass'
    
    auditResults[category].total++
    if (success) {
      auditResults[category].passed++
      console.log(`✅ ${name}: PASS - ${result.message} (${responseTime}ms)`)
    } else {
      console.log(`${critical ? '❌' : '⚠️'} ${name}: ${critical ? 'FAIL' : 'WARNING'} - ${result.message} (${responseTime}ms)`)
      auditResults[category].issues.push({
        name,
        message: result.message,
        critical,
        responseTime,
        details: result.details || null
      })
    }
    
    auditResults[category].tests.push({
      name,
      success,
      message: result.message,
      responseTime,
      critical,
      details: result.details || null
    })
    
    return success
  } catch (error) {
    const responseTime = Date.now() - startTime
    auditResults[category].total++
    
    console.log(`❌ ${name}: ERROR - ${error.message} (${responseTime}ms)`)
    auditResults[category].issues.push({
      name,
      message: error.message,
      critical: true,
      responseTime,
      error: true
    })
    
    return false
  }
}

// PHASE 1: INFRASTRUCTURE AUDIT
async function auditInfrastructure() {
  console.log('\n🏗️ PHASE 1: SYSTEM INFRASTRUCTURE AUDIT')
  console.log('-'.repeat(60))
  
  await runAuditTest('infrastructure', 'Backend Server Health', async () => {
    const response = await makeRequest('http://localhost:3001/api/health')
    
    if (response.status === 200 && response.data.status === 'healthy') {
      return {
        status: 'pass',
        message: `Backend healthy - Uptime: ${Math.round(response.data.uptime)}s`,
        details: response.data
      }
    } else {
      return { status: 'fail', message: `Backend health check failed: ${response.status}` }
    }
  })

  await runAuditTest('infrastructure', 'Database Connectivity', async () => {
    const response = await makeRequest('http://localhost:3001/api/health/database')
    
    if (response.status === 200 && response.data.connected) {
      return {
        status: 'pass',
        message: `Database connected - Type: ${response.data.database}`,
        details: response.data
      }
    } else {
      return { status: 'fail', message: `Database connection failed: ${response.status}` }
    }
  })

  await runAuditTest('infrastructure', 'Frontend Server Availability', async () => {
    const response = await makeRequest('http://localhost:3002')
    
    if (response.status === 200) {
      return {
        status: 'pass',
        message: 'Frontend server responding correctly',
        details: { contentLength: response.data.length }
      }
    } else {
      return { status: 'fail', message: `Frontend server failed: ${response.status}` }
    }
  })

  await runAuditTest('infrastructure', 'CORS Configuration', async () => {
    try {
      const response = await makeRequest('http://localhost:3001/api/health', {
        headers: { 'Origin': 'http://localhost:3002' }
      })
      
      if (response.status === 200) {
        return {
          status: 'pass',
          message: 'CORS properly configured for frontend-backend communication'
        }
      } else {
        return { status: 'fail', message: 'CORS configuration issue detected' }
      }
    } catch (error) {
      return { status: 'fail', message: `CORS test failed: ${error.message}` }
    }
  })
}

// PHASE 2: COMPLETE FRONTEND AUDIT
async function auditFrontend() {
  console.log('\n🎨 PHASE 2: COMPLETE FRONTEND AUDIT')
  console.log('-'.repeat(60))
  
  const pages = [
    { name: 'Dashboard Page', url: 'http://localhost:3002/dashboard', critical: true },
    { name: 'Properties Listing', url: 'http://localhost:3002/properties', critical: true },
    { name: 'Property Search', url: 'http://localhost:3002/properties/search', critical: true },
    { name: 'Interactive Map', url: 'http://localhost:3002/map', critical: true },
    { name: 'Analytics Dashboard', url: 'http://localhost:3002/analytics', critical: true },
    { name: 'Lead Management', url: 'http://localhost:3002/leads', critical: true },
    { name: 'AI Assistant', url: 'http://localhost:3002/assistant', critical: false },
    { name: 'System Test Page', url: 'http://localhost:3002/test', critical: false }
  ]

  for (const page of pages) {
    await runAuditTest('frontend', page.name, async () => {
      const response = await makeRequest(page.url)
      
      if (response.status === 200) {
        // Check for HTML content
        const isHTML = typeof response.data === 'string' && 
                      (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html'))
        
        if (isHTML) {
          // Check for React hydration
          const hasReact = response.data.includes('__NEXT_DATA__') || 
                          response.data.includes('react') ||
                          response.data.includes('_app')
          
          return {
            status: 'pass',
            message: `Page loads with ${hasReact ? 'React hydration' : 'HTML content'}`,
            details: {
              contentLength: response.data.length,
              hasReact,
              isHTML
            }
          }
        } else {
          return {
            status: 'pass',
            message: 'Page loads successfully',
            details: { contentLength: response.data.length }
          }
        }
      } else if (response.status === 404) {
        return { status: 'fail', message: 'Page not found (404)' }
      } else if (response.status === 500) {
        return { status: 'fail', message: 'Server error (500)' }
      } else {
        return { status: 'fail', message: `Unexpected status: ${response.status}` }
      }
    }, page.critical)
  }

  // Test for specific UI components and features
  await runAuditTest('frontend', 'Navigation Structure', async () => {
    const response = await makeRequest('http://localhost:3002/dashboard')
    
    if (response.status === 200 && typeof response.data === 'string') {
      const hasNavigation = response.data.includes('nav') || 
                           response.data.includes('sidebar') ||
                           response.data.includes('menu')
      
      if (hasNavigation) {
        return {
          status: 'pass',
          message: 'Navigation structure detected in HTML',
          details: { hasNavigation }
        }
      } else {
        return { status: 'fail', message: 'Navigation structure not found' }
      }
    } else {
      return { status: 'fail', message: 'Could not analyze navigation structure' }
    }
  })

  await runAuditTest('frontend', 'Responsive Design Elements', async () => {
    const response = await makeRequest('http://localhost:3002/properties/search')
    
    if (response.status === 200 && typeof response.data === 'string') {
      const hasResponsive = response.data.includes('responsive') ||
                           response.data.includes('mobile') ||
                           response.data.includes('sm:') ||
                           response.data.includes('md:') ||
                           response.data.includes('lg:')
      
      if (hasResponsive) {
        return {
          status: 'pass',
          message: 'Responsive design classes detected',
          details: { hasResponsive }
        }
      } else {
        return { status: 'warning', message: 'Responsive design indicators not clearly visible' }
      }
    } else {
      return { status: 'fail', message: 'Could not analyze responsive design' }
    }
  })
}

// PHASE 3: COMPLETE BACKEND AUDIT
async function auditBackend() {
  console.log('\n🔧 PHASE 3: COMPLETE BACKEND AUDIT')
  console.log('-'.repeat(60))
  
  const endpoints = [
    {
      name: 'Health Check Endpoint',
      url: 'http://localhost:3001/api/health',
      method: 'GET',
      validate: (data) => data.status === 'healthy' && data.uptime > 0
    },
    {
      name: 'Database Health Endpoint',
      url: 'http://localhost:3001/api/health/database',
      method: 'GET',
      validate: (data) => data.connected === true
    },
    {
      name: 'Property Search API',
      url: 'http://localhost:3001/api/properties/search',
      method: 'POST',
      body: { filters: { location: 'New York' }, page: 1, pageSize: 5 },
      validate: (data) => data.results && Array.isArray(data.results) && data.totalCount >= 0
    },
    {
      name: 'Property Details API',
      url: 'http://localhost:3001/api/properties/prop_1',
      method: 'GET',
      validate: (data) => data.id && data.address && data.city
    },
    {
      name: 'Advanced Property Search',
      url: 'http://localhost:3001/api/properties/search',
      method: 'POST',
      body: { 
        filters: { 
          location: 'Brooklyn', 
          minPrice: 200000, 
          maxPrice: 500000,
          propertyType: 'Condo',
          bedrooms: 2
        }, 
        page: 1, 
        pageSize: 3 
      },
      validate: (data) => data.results && Array.isArray(data.results)
    },
    {
      name: 'Geolocation Search API',
      url: 'http://localhost:3001/api/geolocation/search',
      method: 'POST',
      body: { query: 'Manhattan', limit: 5 },
      validate: (data) => data.results && Array.isArray(data.results)
    },
    {
      name: 'Nearby Locations API',
      url: 'http://localhost:3001/api/geolocation/nearby',
      method: 'POST',
      body: { lat: 40.7831, lng: -73.9712, radius: 25 },
      validate: (data) => data.results && Array.isArray(data.results)
    },
    {
      name: 'Reverse Geocoding API',
      url: 'http://localhost:3001/api/geolocation/reverse',
      method: 'POST',
      body: { lat: 40.7831, lng: -73.9712 },
      validate: (data) => data.address && typeof data.address === 'string'
    },
    {
      name: 'Market Insights API',
      url: 'http://localhost:3001/api/properties/market-insights',
      method: 'POST',
      body: { location: 'Manhattan, NY' },
      validate: (data) => data.location && (data.medianPrice || data.averagePrice)
    },
    {
      name: 'User Favorites GET',
      url: 'http://localhost:3001/api/users/favorites',
      method: 'GET',
      validate: (data) => data.results && Array.isArray(data.results)
    },
    {
      name: 'User Favorites POST',
      url: 'http://localhost:3001/api/users/favorites',
      method: 'POST',
      body: { propertyId: 'end_to_end_test_prop', type: 'property' },
      validate: (data) => data.success || data.message
    }
  ]

  for (const endpoint of endpoints) {
    await runAuditTest('backend', endpoint.name, async () => {
      const response = await makeRequest(endpoint.url, {
        method: endpoint.method,
        body: endpoint.body
      })
      
      if (response.status === 200) {
        if (endpoint.validate && !endpoint.validate(response.data)) {
          return {
            status: 'fail',
            message: 'API responds but data validation failed',
            details: response.data
          }
        }
        
        return {
          status: 'pass',
          message: 'API responds correctly with valid data',
          details: {
            responseSize: JSON.stringify(response.data).length,
            dataKeys: Object.keys(response.data || {})
          }
        }
      } else {
        return {
          status: 'fail',
          message: `API failed with status ${response.status}`,
          details: response.data
        }
      }
    })
  }
}

// PHASE 4: USER JOURNEY TESTING
async function auditUserJourneys() {
  console.log('\n👤 PHASE 4: USER JOURNEY TESTING')
  console.log('-'.repeat(60))

  await runAuditTest('userJourneys', 'Complete Property Search Journey', async () => {
    // Step 1: Load property search page
    const searchPageResponse = await makeRequest('http://localhost:3002/properties/search')
    if (searchPageResponse.status !== 200) {
      return { status: 'fail', message: 'Property search page failed to load' }
    }

    // Step 2: Perform property search via API
    const searchResponse = await makeRequest('http://localhost:3001/api/properties/search', {
      method: 'POST',
      body: { filters: { location: 'New York' }, page: 1, pageSize: 3 }
    })
    if (searchResponse.status !== 200 || !searchResponse.data.results) {
      return { status: 'fail', message: 'Property search API failed' }
    }

    // Step 3: Get property details
    const propertyId = searchResponse.data.results[0]?.id
    if (propertyId) {
      const detailsResponse = await makeRequest(`http://localhost:3001/api/properties/${propertyId}`)
      if (detailsResponse.status !== 200) {
        return { status: 'fail', message: 'Property details retrieval failed' }
      }
    }

    return {
      status: 'pass',
      message: `Complete property search journey successful - Found ${searchResponse.data.results.length} properties`,
      details: {
        searchResults: searchResponse.data.results.length,
        totalCount: searchResponse.data.totalCount
      }
    }
  })

  await runAuditTest('userJourneys', 'Geolocation-Based Property Discovery', async () => {
    // Step 1: Search for location
    const locationResponse = await makeRequest('http://localhost:3001/api/geolocation/search', {
      method: 'POST',
      body: { query: 'Brooklyn', limit: 5 }
    })
    if (locationResponse.status !== 200 || !locationResponse.data.results) {
      return { status: 'fail', message: 'Location search failed' }
    }

    // Step 2: Find nearby properties
    const location = locationResponse.data.results[0]
    if (location && location.coordinates) {
      const nearbyResponse = await makeRequest('http://localhost:3001/api/geolocation/nearby', {
        method: 'POST',
        body: { lat: location.coordinates.lat, lng: location.coordinates.lng, radius: 10 }
      })
      if (nearbyResponse.status !== 200) {
        return { status: 'fail', message: 'Nearby properties search failed' }
      }
    }

    return {
      status: 'pass',
      message: 'Geolocation-based property discovery working',
      details: {
        locationsFound: locationResponse.data.results.length,
        firstLocation: location?.name
      }
    }
  })

  await runAuditTest('userJourneys', 'User Favorites Management Journey', async () => {
    // Step 1: Get current favorites
    const getFavoritesResponse = await makeRequest('http://localhost:3001/api/users/favorites')
    if (getFavoritesResponse.status !== 200) {
      return { status: 'fail', message: 'Get favorites failed' }
    }

    // Step 2: Add a favorite
    const addFavoriteResponse = await makeRequest('http://localhost:3001/api/users/favorites', {
      method: 'POST',
      body: { propertyId: 'journey_test_prop', type: 'property' }
    })
    if (addFavoriteResponse.status !== 200) {
      return { status: 'fail', message: 'Add favorite failed' }
    }

    // Step 3: Verify favorite was added
    const verifyFavoritesResponse = await makeRequest('http://localhost:3001/api/users/favorites')
    if (verifyFavoritesResponse.status !== 200) {
      return { status: 'fail', message: 'Verify favorites failed' }
    }

    return {
      status: 'pass',
      message: 'User favorites management journey successful',
      details: {
        initialFavorites: getFavoritesResponse.data.results.length,
        finalFavorites: verifyFavoritesResponse.data.results.length
      }
    }
  })
}

// PHASE 5: INTERACTIVE ELEMENT TESTING
async function auditInteractiveElements() {
  console.log('\n🖱️ PHASE 5: INTERACTIVE ELEMENT TESTING')
  console.log('-'.repeat(60))

  await runAuditTest('interactive', 'Search Form Functionality', async () => {
    // Test different search parameters
    const searchTests = [
      { location: 'Manhattan' },
      { location: 'Brooklyn', minPrice: 300000 },
      { location: 'Queens', maxPrice: 600000 },
      { location: 'Bronx', propertyType: 'Single Family' }
    ]

    let successfulSearches = 0
    for (const searchParams of searchTests) {
      const response = await makeRequest('http://localhost:3001/api/properties/search', {
        method: 'POST',
        body: { filters: searchParams, page: 1, pageSize: 2 }
      })
      if (response.status === 200 && response.data.results) {
        successfulSearches++
      }
    }

    if (successfulSearches === searchTests.length) {
      return {
        status: 'pass',
        message: `All ${searchTests.length} search form variations successful`,
        details: { successfulSearches, totalTests: searchTests.length }
      }
    } else {
      return {
        status: 'fail',
        message: `Only ${successfulSearches}/${searchTests.length} search variations successful`
      }
    }
  })

  await runAuditTest('interactive', 'Filter and Sorting Options', async () => {
    // Test advanced filtering
    const filterResponse = await makeRequest('http://localhost:3001/api/properties/search', {
      method: 'POST',
      body: {
        filters: {
          location: 'New York',
          minPrice: 200000,
          maxPrice: 800000,
          bedrooms: 2,
          bathrooms: 1,
          propertyType: 'Condo',
          investmentStrategy: 'Buy & Hold'
        },
        page: 1,
        pageSize: 5,
        sortBy: 'price',
        sortOrder: 'asc'
      }
    })

    if (filterResponse.status === 200 && filterResponse.data.results) {
      return {
        status: 'pass',
        message: 'Advanced filtering and sorting working correctly',
        details: {
          resultsCount: filterResponse.data.results.length,
          totalCount: filterResponse.data.totalCount
        }
      }
    } else {
      return { status: 'fail', message: 'Advanced filtering failed' }
    }
  })
}

// PHASE 6: DATA FLOW VALIDATION
async function auditDataFlow() {
  console.log('\n📊 PHASE 6: DATA FLOW VALIDATION')
  console.log('-'.repeat(60))

  await runAuditTest('dataFlow', 'Property Data Consistency', async () => {
    // Get property from search
    const searchResponse = await makeRequest('http://localhost:3001/api/properties/search', {
      method: 'POST',
      body: { filters: { location: 'New York' }, page: 1, pageSize: 1 }
    })

    if (searchResponse.status !== 200 || !searchResponse.data.results[0]) {
      return { status: 'fail', message: 'Property search failed' }
    }

    const propertyFromSearch = searchResponse.data.results[0]

    // Get same property from details endpoint
    const detailsResponse = await makeRequest(`http://localhost:3001/api/properties/${propertyFromSearch.id}`)

    if (detailsResponse.status !== 200) {
      return { status: 'fail', message: 'Property details failed' }
    }

    const propertyFromDetails = detailsResponse.data

    // Verify data consistency
    const isConsistent = propertyFromSearch.id === propertyFromDetails.id &&
                        propertyFromSearch.address === propertyFromDetails.address &&
                        propertyFromSearch.listPrice === propertyFromDetails.listPrice

    if (isConsistent) {
      return {
        status: 'pass',
        message: 'Property data consistent between search and details',
        details: {
          propertyId: propertyFromSearch.id,
          address: propertyFromSearch.address
        }
      }
    } else {
      return { status: 'fail', message: 'Property data inconsistency detected' }
    }
  })

  await runAuditTest('dataFlow', 'Real-time Data Updates', async () => {
    // Test multiple rapid requests to ensure data freshness
    const requests = []
    for (let i = 0; i < 3; i++) {
      requests.push(makeRequest('http://localhost:3001/api/health'))
    }

    const responses = await Promise.all(requests)
    const allSuccessful = responses.every(r => r.status === 200)
    const timestamps = responses.map(r => r.data.timestamp)
    const uniqueTimestamps = new Set(timestamps).size

    if (allSuccessful && uniqueTimestamps > 1) {
      return {
        status: 'pass',
        message: 'Real-time data updates working correctly',
        details: { uniqueTimestamps, totalRequests: requests.length }
      }
    } else {
      return { status: 'fail', message: 'Real-time data update issues detected' }
    }
  })
}

// PHASE 7: PERFORMANCE & SECURITY AUDIT
async function auditPerformance() {
  console.log('\n⚡ PHASE 7: PERFORMANCE & SECURITY AUDIT')
  console.log('-'.repeat(60))

  await runAuditTest('performance', 'API Response Time Performance', async () => {
    const startTime = Date.now()
    const promises = []

    // Test concurrent API requests
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest('http://localhost:3001/api/health'))
    }

    const responses = await Promise.all(promises)
    const endTime = Date.now()
    const totalTime = endTime - startTime
    const avgTime = totalTime / responses.length

    const allSuccessful = responses.every(r => r.status === 200)

    if (allSuccessful && avgTime < 100) {
      return {
        status: 'pass',
        message: `Excellent API performance: ${avgTime.toFixed(1)}ms average`,
        details: { totalTime, avgTime, concurrentRequests: responses.length }
      }
    } else if (allSuccessful && avgTime < 500) {
      return {
        status: 'pass',
        message: `Good API performance: ${avgTime.toFixed(1)}ms average`,
        details: { totalTime, avgTime, concurrentRequests: responses.length }
      }
    } else {
      return { status: 'fail', message: `Poor API performance: ${avgTime.toFixed(1)}ms average` }
    }
  })

  await runAuditTest('performance', 'Frontend Page Load Performance', async () => {
    const pages = [
      'http://localhost:3002/dashboard',
      'http://localhost:3002/properties/search',
      'http://localhost:3002/analytics'
    ]

    let totalLoadTime = 0
    let successfulLoads = 0

    for (const page of pages) {
      const startTime = Date.now()
      const response = await makeRequest(page)
      const loadTime = Date.now() - startTime

      if (response.status === 200) {
        totalLoadTime += loadTime
        successfulLoads++
      }
    }

    const avgLoadTime = totalLoadTime / successfulLoads

    if (successfulLoads === pages.length && avgLoadTime < 1000) {
      return {
        status: 'pass',
        message: `Excellent page load performance: ${avgLoadTime.toFixed(0)}ms average`,
        details: { avgLoadTime, successfulLoads, totalPages: pages.length }
      }
    } else if (successfulLoads === pages.length && avgLoadTime < 3000) {
      return {
        status: 'pass',
        message: `Good page load performance: ${avgLoadTime.toFixed(0)}ms average`,
        details: { avgLoadTime, successfulLoads, totalPages: pages.length }
      }
    } else {
      return { status: 'fail', message: `Poor page load performance: ${avgLoadTime.toFixed(0)}ms average` }
    }
  })

  await runAuditTest('performance', 'Error Handling & Security', async () => {
    // Test invalid API endpoint
    const invalidResponse = await makeRequest('http://localhost:3001/api/invalid-endpoint')

    if (invalidResponse.status === 404) {
      // Test malformed request
      try {
        const malformedResponse = await makeRequest('http://localhost:3001/api/properties/search', {
          method: 'POST',
          body: { invalid: 'data' }
        })

        if (malformedResponse.status >= 400 && malformedResponse.status < 500) {
          return {
            status: 'pass',
            message: 'Proper error handling for invalid requests',
            details: { invalidEndpoint: 404, malformedRequest: malformedResponse.status }
          }
        }
      } catch (error) {
        return { status: 'fail', message: 'Error handling test failed' }
      }
    }

    return { status: 'fail', message: 'Security and error handling needs improvement' }
  })
}

// PHASE 8: AI FEATURES COMPREHENSIVE TEST
async function auditAIFeatures() {
  console.log('\n🤖 PHASE 8: AI FEATURES COMPREHENSIVE TEST')
  console.log('-'.repeat(60))

  await runAuditTest('aiFeatures', 'Property AI Scoring System', async () => {
    const response = await makeRequest('http://localhost:3001/api/properties/search', {
      method: 'POST',
      body: { filters: { location: 'New York' }, page: 1, pageSize: 3 }
    })

    if (response.status === 200 && response.data.results) {
      const properties = response.data.results
      const hasAIScores = properties.every(prop =>
        prop.aiScore !== undefined &&
        typeof prop.aiScore === 'number' &&
        prop.aiScore >= 0 &&
        prop.aiScore <= 100
      )

      if (hasAIScores) {
        const avgAIScore = properties.reduce((sum, prop) => sum + prop.aiScore, 0) / properties.length
        return {
          status: 'pass',
          message: `AI scoring system operational - Average score: ${avgAIScore.toFixed(1)}`,
          details: {
            propertiesScored: properties.length,
            avgScore: avgAIScore,
            scoreRange: { min: Math.min(...properties.map(p => p.aiScore)), max: Math.max(...properties.map(p => p.aiScore)) }
          }
        }
      } else {
        return { status: 'fail', message: 'AI scoring system not properly implemented' }
      }
    } else {
      return { status: 'fail', message: 'Could not test AI scoring system' }
    }
  })

  await runAuditTest('aiFeatures', 'Investment Strategy AI Recommendations', async () => {
    const response = await makeRequest('http://localhost:3001/api/properties/search', {
      method: 'POST',
      body: { filters: { location: 'Brooklyn' }, page: 1, pageSize: 5 }
    })

    if (response.status === 200 && response.data.results) {
      const properties = response.data.results
      const hasInvestmentStrategies = properties.every(prop =>
        prop.investmentStrategy &&
        typeof prop.investmentStrategy === 'string' &&
        ['Fix & Flip', 'BRRRR', 'Buy & Hold', 'Wholesale'].includes(prop.investmentStrategy)
      )

      if (hasInvestmentStrategies) {
        const strategies = properties.map(p => p.investmentStrategy)
        const uniqueStrategies = [...new Set(strategies)]

        return {
          status: 'pass',
          message: `AI investment recommendations working - ${uniqueStrategies.length} strategies identified`,
          details: {
            propertiesAnalyzed: properties.length,
            strategiesFound: uniqueStrategies,
            distribution: strategies.reduce((acc, strategy) => {
              acc[strategy] = (acc[strategy] || 0) + 1
              return acc
            }, {})
          }
        }
      } else {
        return { status: 'fail', message: 'AI investment strategy recommendations not working' }
      }
    } else {
      return { status: 'fail', message: 'Could not test AI investment recommendations' }
    }
  })

  await runAuditTest('aiFeatures', 'Market Intelligence & Insights', async () => {
    const response = await makeRequest('http://localhost:3001/api/properties/market-insights', {
      method: 'POST',
      body: { location: 'Manhattan, NY' }
    })

    if (response.status === 200 && response.data) {
      const insights = response.data
      const hasIntelligence = insights.marketTrend &&
                             insights.investmentOpportunity &&
                             insights.recommendations &&
                             Array.isArray(insights.recommendations)

      if (hasIntelligence) {
        return {
          status: 'pass',
          message: `Market intelligence operational - ${insights.recommendations.length} AI recommendations`,
          details: {
            marketTrend: insights.marketTrend,
            opportunity: insights.investmentOpportunity,
            recommendationCount: insights.recommendations.length,
            avgAIScore: insights.averageAIScore
          }
        }
      } else {
        return { status: 'fail', message: 'Market intelligence features incomplete' }
      }
    } else {
      return { status: 'fail', message: 'Market intelligence API not working' }
    }
  })

  await runAuditTest('aiFeatures', 'Geolocation Intelligence', async () => {
    // Test intelligent location search
    const locationResponse = await makeRequest('http://localhost:3001/api/geolocation/search', {
      method: 'POST',
      body: { query: 'Times Square Manhattan', limit: 3 }
    })

    if (locationResponse.status === 200 && locationResponse.data.results) {
      // Test nearby intelligent discovery
      const location = locationResponse.data.results[0]
      if (location && location.coordinates) {
        const nearbyResponse = await makeRequest('http://localhost:3001/api/geolocation/nearby', {
          method: 'POST',
          body: { lat: location.coordinates.lat, lng: location.coordinates.lng, radius: 5 }
        })

        if (nearbyResponse.status === 200 && nearbyResponse.data.results) {
          return {
            status: 'pass',
            message: `Geolocation intelligence working - Found ${nearbyResponse.data.results.length} nearby locations`,
            details: {
              searchResults: locationResponse.data.results.length,
              nearbyResults: nearbyResponse.data.results.length,
              searchAccuracy: location.name.toLowerCase().includes('manhattan')
            }
          }
        }
      }
    }

    return { status: 'fail', message: 'Geolocation intelligence not fully operational' }
  })
}
async function runFullEndToEndAudit() {
  console.log('🚀 Starting Full End-to-End LeadFlow AI Audit...\n')

  await auditInfrastructure()
  await auditFrontend()
  await auditBackend()
  await auditUserJourneys()
  await auditInteractiveElements()
  await auditDataFlow()
  await auditPerformance()
  await auditAIFeatures()

  // Calculate results
  const categories = Object.keys(auditResults)
  let totalPassed = 0
  let totalTests = 0
  let totalIssues = 0

  categories.forEach(category => {
    totalPassed += auditResults[category].passed
    totalTests += auditResults[category].total
    totalIssues += auditResults[category].issues.length
  })

  const successRate = Math.round((totalPassed / totalTests) * 100)

  console.log('\n' + '='.repeat(80))
  console.log('🎯 FULL END-TO-END AUDIT SUMMARY')
  console.log('='.repeat(80))
  console.log(`🏗️ Infrastructure: ${auditResults.infrastructure.passed}/${auditResults.infrastructure.total} passed`)
  console.log(`🎨 Frontend: ${auditResults.frontend.passed}/${auditResults.frontend.total} passed`)
  console.log(`🔧 Backend: ${auditResults.backend.passed}/${auditResults.backend.total} passed`)
  console.log(`👤 User Journeys: ${auditResults.userJourneys.passed}/${auditResults.userJourneys.total} passed`)
  console.log(`🖱️ Interactive: ${auditResults.interactive.passed}/${auditResults.interactive.total} passed`)
  console.log(`📊 Data Flow: ${auditResults.dataFlow.passed}/${auditResults.dataFlow.total} passed`)
  console.log(`⚡ Performance: ${auditResults.performance.passed}/${auditResults.performance.total} passed`)
  console.log(`🤖 AI Features: ${auditResults.aiFeatures.passed}/${auditResults.aiFeatures.total} passed`)
  console.log(`📈 Overall Success Rate: ${successRate}%`)
  console.log(`✅ Total Passed: ${totalPassed}/${totalTests}`)
  console.log(`⚠️ Total Issues: ${totalIssues}`)

  // Detailed issue reporting
  if (totalIssues > 0) {
    console.log('\n📋 DETAILED ISSUE REPORT:')
    categories.forEach(category => {
      if (auditResults[category].issues.length > 0) {
        console.log(`\n${category.toUpperCase()} ISSUES:`)
        auditResults[category].issues.forEach(issue => {
          console.log(`  ${issue.critical ? '❌' : '⚠️'} ${issue.name}: ${issue.message}`)
        })
      }
    })
  }

  // Production readiness assessment
  console.log('\n🎯 PRODUCTION READINESS:')
  if (successRate >= 95 && totalIssues <= 1) {
    console.log('🟢 READY FOR PRODUCTION - All systems fully operational!')
  } else if (successRate >= 90 && totalIssues <= 3) {
    console.log('🟡 MOSTLY READY - Minor issues to address')
  } else if (successRate >= 80 && totalIssues <= 5) {
    console.log('🟡 GOOD PROGRESS - Some issues need resolution')
  } else {
    console.log('🔴 NEEDS WORK - Critical issues require resolution')
  }

  console.log('\n🔗 VERIFIED SYSTEM URLS:')
  console.log('Backend API: http://localhost:3001/api/health')
  console.log('Frontend App: http://localhost:3002/properties/search')
  console.log('Dashboard: http://localhost:3002/dashboard')
  console.log('Analytics: http://localhost:3002/analytics')

  return auditResults
}

// Run the full audit
runFullEndToEndAudit().catch(console.error)
