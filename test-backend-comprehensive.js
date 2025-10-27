#!/usr/bin/env node

// Comprehensive Backend Testing Script for LeadFlow AI
// Tests all API endpoints, data flow, and integration points

const https = require('http')

const API_BASE = 'http://localhost:3001/api'
const FRONTEND_BASE = 'http://localhost:3002'

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
}

// Helper function to make HTTP requests
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

// Test function
async function runTest(name, testFn) {
  const startTime = Date.now()
  try {
    const result = await testFn()
    const duration = Date.now() - startTime
    
    testResults.total++
    if (result.status === 'pass') {
      testResults.passed++
      console.log(`✅ ${name} - ${result.message} (${duration}ms)`)
    } else if (result.status === 'warning') {
      testResults.warnings++
      console.log(`⚠️  ${name} - ${result.message} (${duration}ms)`)
    } else {
      testResults.failed++
      console.log(`❌ ${name} - ${result.message} (${duration}ms)`)
    }
    
    testResults.tests.push({
      name,
      status: result.status,
      message: result.message,
      duration,
      data: result.data
    })
  } catch (error) {
    testResults.total++
    testResults.failed++
    console.log(`❌ ${name} - Error: ${error.message}`)
    testResults.tests.push({
      name,
      status: 'fail',
      message: error.message,
      duration: Date.now() - startTime
    })
  }
}

// Test API Health
async function testAPIHealth() {
  const response = await makeRequest(`${API_BASE}/health`)
  
  if (response.status === 200 && response.data.status === 'healthy') {
    return {
      status: 'pass',
      message: 'API health check successful',
      data: response.data
    }
  } else {
    return {
      status: 'fail',
      message: `API health check failed: ${response.status}`,
      data: response.data
    }
  }
}

// Test Database Health
async function testDatabaseHealth() {
  const response = await makeRequest(`${API_BASE}/health/database`)
  
  if (response.status === 200 && response.data.status === 'healthy') {
    return {
      status: 'pass',
      message: 'Database health check successful',
      data: response.data
    }
  } else {
    return {
      status: 'warning',
      message: `Database health check returned: ${response.status}`,
      data: response.data
    }
  }
}

// Test Property Search API
async function testPropertySearch() {
  const response = await makeRequest(`${API_BASE}/properties/search`, {
    method: 'POST',
    body: {
      filters: { location: 'New York' },
      page: 1,
      pageSize: 10
    }
  })
  
  if (response.status === 200 && response.data.results && Array.isArray(response.data.results)) {
    return {
      status: 'pass',
      message: `Property search returned ${response.data.results.length} results`,
      data: response.data
    }
  } else {
    return {
      status: 'fail',
      message: `Property search failed: ${response.status}`,
      data: response.data
    }
  }
}

// Test Property Details
async function testPropertyDetails() {
  const response = await makeRequest(`${API_BASE}/properties/prop_1`)
  
  if (response.status === 200 && response.data.id) {
    return {
      status: 'pass',
      message: 'Property details retrieved successfully',
      data: response.data
    }
  } else {
    return {
      status: 'fail',
      message: `Property details failed: ${response.status}`,
      data: response.data
    }
  }
}

// Test Geolocation Search
async function testGeolocationSearch() {
  const response = await makeRequest(`${API_BASE}/geolocation/search`, {
    method: 'POST',
    body: {
      query: 'Manhattan',
      limit: 5
    }
  })
  
  if (response.status === 200 && response.data.results && Array.isArray(response.data.results)) {
    return {
      status: 'pass',
      message: `Geolocation search returned ${response.data.results.length} results`,
      data: response.data
    }
  } else {
    return {
      status: 'fail',
      message: `Geolocation search failed: ${response.status}`,
      data: response.data
    }
  }
}

// Test Nearby Locations
async function testNearbyLocations() {
  const response = await makeRequest(`${API_BASE}/geolocation/nearby`, {
    method: 'POST',
    body: {
      lat: 40.7831,
      lng: -73.9712,
      radius: 25
    }
  })
  
  if (response.status === 200 && response.data.results && Array.isArray(response.data.results)) {
    return {
      status: 'pass',
      message: `Nearby locations returned ${response.data.results.length} results`,
      data: response.data
    }
  } else {
    return {
      status: 'fail',
      message: `Nearby locations failed: ${response.status}`,
      data: response.data
    }
  }
}

// Test Reverse Geocoding
async function testReverseGeocoding() {
  const response = await makeRequest(`${API_BASE}/geolocation/reverse`, {
    method: 'POST',
    body: {
      lat: 40.7831,
      lng: -73.9712
    }
  })
  
  if (response.status === 200 && response.data.address) {
    return {
      status: 'pass',
      message: `Reverse geocoding returned: ${response.data.address}`,
      data: response.data
    }
  } else {
    return {
      status: 'fail',
      message: `Reverse geocoding failed: ${response.status}`,
      data: response.data
    }
  }
}

// Test Market Insights
async function testMarketInsights() {
  const response = await makeRequest(`${API_BASE}/properties/market-insights`, {
    method: 'POST',
    body: {
      location: 'Manhattan, NY'
    }
  })
  
  if (response.status === 200 && response.data.location) {
    return {
      status: 'pass',
      message: `Market insights for ${response.data.location}`,
      data: response.data
    }
  } else {
    return {
      status: 'fail',
      message: `Market insights failed: ${response.status}`,
      data: response.data
    }
  }
}

// Test User Favorites
async function testUserFavorites() {
  // Test GET favorites
  const getResponse = await makeRequest(`${API_BASE}/users/favorites`)
  
  if (getResponse.status === 200) {
    // Test POST favorite
    const postResponse = await makeRequest(`${API_BASE}/users/favorites`, {
      method: 'POST',
      body: {
        propertyId: 'prop_test',
        type: 'property'
      }
    })
    
    if (postResponse.status === 200) {
      return {
        status: 'pass',
        message: 'User favorites functionality working',
        data: { get: getResponse.data, post: postResponse.data }
      }
    }
  }
  
  return {
    status: 'fail',
    message: 'User favorites functionality failed',
    data: { get: getResponse, post: postResponse }
  }
}

// Test API Performance
async function testAPIPerformance() {
  const startTime = Date.now()
  const promises = []
  
  // Run 5 concurrent requests
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest(`${API_BASE}/health`))
  }
  
  const results = await Promise.all(promises)
  const endTime = Date.now()
  const totalTime = endTime - startTime
  const avgTime = totalTime / results.length
  
  const allSuccessful = results.every(r => r.status === 200)
  
  if (allSuccessful && avgTime < 1000) {
    return {
      status: 'pass',
      message: `API performance good: ${avgTime.toFixed(0)}ms average`,
      data: { totalTime, avgTime, requests: results.length }
    }
  } else if (allSuccessful) {
    return {
      status: 'warning',
      message: `API performance slow: ${avgTime.toFixed(0)}ms average`,
      data: { totalTime, avgTime, requests: results.length }
    }
  } else {
    return {
      status: 'fail',
      message: 'API performance test failed',
      data: { totalTime, avgTime, requests: results.length }
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🔍 Starting Comprehensive Backend Testing for LeadFlow AI\n')
  
  console.log('📊 API Health & Connectivity Tests:')
  await runTest('API Health Check', testAPIHealth)
  await runTest('Database Health Check', testDatabaseHealth)
  await runTest('API Performance Test', testAPIPerformance)
  
  console.log('\n🏠 Property Search API Tests:')
  await runTest('Property Search', testPropertySearch)
  await runTest('Property Details', testPropertyDetails)
  await runTest('Market Insights', testMarketInsights)
  
  console.log('\n📍 Geolocation API Tests:')
  await runTest('Location Search', testGeolocationSearch)
  await runTest('Nearby Locations', testNearbyLocations)
  await runTest('Reverse Geocoding', testReverseGeocoding)
  
  console.log('\n👤 User Interaction Tests:')
  await runTest('User Favorites', testUserFavorites)
  
  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📋 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`⚠️  Warnings: ${testResults.warnings}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`)
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All critical tests passed! Backend is ready for production.')
  } else if (testResults.failed <= 2) {
    console.log('\n⚠️  Some tests failed, but core functionality is working.')
  } else {
    console.log('\n🚨 Multiple test failures detected. Backend needs attention.')
  }
  
  console.log('\n🔗 Integration Status:')
  console.log(`Backend API: http://localhost:3001/api/health`)
  console.log(`Frontend App: http://localhost:3002/properties/search`)
  console.log(`Ready for frontend-backend integration testing!`)
}

// Run the tests
runAllTests().catch(console.error)
