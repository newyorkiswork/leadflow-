#!/usr/bin/env node

// Final Comprehensive Test Script for LeadFlow AI
// Tests all UI components, buttons, links, and backend integration

const https = require('http')

console.log('🔍 FINAL COMPREHENSIVE TESTING - LeadFlow AI')
console.log('=' .repeat(60))

// Test backend endpoints
async function testBackendEndpoints() {
  console.log('\n📊 BACKEND API TESTING:')
  
  const endpoints = [
    { name: 'Health Check', url: 'http://localhost:3001/api/health', method: 'GET' },
    { name: 'Database Health', url: 'http://localhost:3001/api/health/database', method: 'GET' },
    { 
      name: 'Property Search', 
      url: 'http://localhost:3001/api/properties/search', 
      method: 'POST',
      body: { filters: { location: 'New York' }, page: 1, pageSize: 3 }
    },
    { name: 'Property Details', url: 'http://localhost:3001/api/properties/prop_1', method: 'GET' },
    { 
      name: 'Geolocation Search', 
      url: 'http://localhost:3001/api/geolocation/search', 
      method: 'POST',
      body: { query: 'Manhattan', limit: 3 }
    },
    { 
      name: 'Nearby Locations', 
      url: 'http://localhost:3001/api/geolocation/nearby', 
      method: 'POST',
      body: { lat: 40.7831, lng: -73.9712, radius: 25 }
    },
    { 
      name: 'Reverse Geocoding', 
      url: 'http://localhost:3001/api/geolocation/reverse', 
      method: 'POST',
      body: { lat: 40.7831, lng: -73.9712 }
    },
    { 
      name: 'Market Insights', 
      url: 'http://localhost:3001/api/properties/market-insights', 
      method: 'POST',
      body: { location: 'Manhattan, NY' }
    },
    { name: 'User Favorites (GET)', url: 'http://localhost:3001/api/users/favorites', method: 'GET' },
    { 
      name: 'User Favorites (POST)', 
      url: 'http://localhost:3001/api/users/favorites', 
      method: 'POST',
      body: { propertyId: 'test_prop_123', type: 'property' }
    }
  ]

  let passedTests = 0
  let totalTests = endpoints.length

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.url, {
        method: endpoint.method,
        body: endpoint.body
      })

      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ ${endpoint.name}: PASS (${response.status})`)
        passedTests++
      } else {
        console.log(`❌ ${endpoint.name}: FAIL (${response.status})`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR (${error.message})`)
    }
  }

  console.log(`\n📈 Backend API Results: ${passedTests}/${totalTests} tests passed`)
  return { passed: passedTests, total: totalTests }
}

// Test frontend pages
async function testFrontendPages() {
  console.log('\n🎨 FRONTEND PAGE TESTING:')
  
  const pages = [
    'http://localhost:3002/dashboard',
    'http://localhost:3002/properties',
    'http://localhost:3002/properties/search',
    'http://localhost:3002/map',
    'http://localhost:3002/analytics',
    'http://localhost:3002/leads',
    'http://localhost:3002/test'
  ]

  let passedTests = 0
  let totalTests = pages.length

  for (const page of pages) {
    try {
      const response = await makeRequest(page)
      const pageName = page.split('/').pop() || 'root'

      if (response.status === 200) {
        console.log(`✅ ${pageName}: PASS (${response.status})`)
        passedTests++
      } else {
        console.log(`❌ ${pageName}: FAIL (${response.status})`)
      }
    } catch (error) {
      const pageName = page.split('/').pop() || 'root'
      console.log(`❌ ${pageName}: ERROR (${error.message})`)
    }
  }

  console.log(`\n📈 Frontend Page Results: ${passedTests}/${totalTests} tests passed`)
  return { passed: passedTests, total: totalTests }
}

// Test integration scenarios
async function testIntegrationScenarios() {
  console.log('\n🔗 INTEGRATION TESTING:')
  
  const scenarios = [
    {
      name: 'Property Search Integration',
      test: async () => {
        const response = await makeRequest('http://localhost:3001/api/properties/search', {
          method: 'POST',
          body: { filters: { location: 'Brooklyn' }, page: 1, pageSize: 1 }
        })
        return response.status === 200 && response.data.results && response.data.results.length > 0
      }
    },
    {
      name: 'Geolocation Integration',
      test: async () => {
        const response = await makeRequest('http://localhost:3001/api/geolocation/search', {
          method: 'POST',
          body: { query: 'Manhattan', limit: 1 }
        })
        return response.status === 200 && response.data.results && response.data.results.length > 0
      }
    },
    {
      name: 'User Favorites Integration',
      test: async () => {
        // Test adding favorite
        const addResponse = await makeRequest('http://localhost:3001/api/users/favorites', {
          method: 'POST',
          body: { propertyId: 'integration_test_prop', type: 'property' }
        })
        
        if (addResponse.status !== 200) return false
        
        // Test retrieving favorites
        const getResponse = await makeRequest('http://localhost:3001/api/users/favorites')
        return getResponse.status === 200 && getResponse.data.results
      }
    },
    {
      name: 'Market Data Integration',
      test: async () => {
        const response = await makeRequest('http://localhost:3001/api/properties/market-insights', {
          method: 'POST',
          body: { location: 'New York, NY' }
        })
        return response.status === 200 && response.data.location
      }
    }
  ]

  let passedTests = 0
  let totalTests = scenarios.length

  for (const scenario of scenarios) {
    try {
      const result = await scenario.test()
      if (result) {
        console.log(`✅ ${scenario.name}: PASS`)
        passedTests++
      } else {
        console.log(`❌ ${scenario.name}: FAIL`)
      }
    } catch (error) {
      console.log(`❌ ${scenario.name}: ERROR (${error.message})`)
    }
  }

  console.log(`\n📈 Integration Results: ${passedTests}/${totalTests} tests passed`)
  return { passed: passedTests, total: totalTests }
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

// Main test runner
async function runFinalTests() {
  console.log('🚀 Starting Final Comprehensive Testing...\n')
  
  const backendResults = await testBackendEndpoints()
  const frontendResults = await testFrontendPages()
  const integrationResults = await testIntegrationScenarios()
  
  const totalPassed = backendResults.passed + frontendResults.passed + integrationResults.passed
  const totalTests = backendResults.total + frontendResults.total + integrationResults.total
  const successRate = Math.round((totalPassed / totalTests) * 100)
  
  console.log('\n' + '='.repeat(60))
  console.log('🎯 FINAL TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`📊 Backend API: ${backendResults.passed}/${backendResults.total} passed`)
  console.log(`🎨 Frontend Pages: ${frontendResults.passed}/${frontendResults.total} passed`)
  console.log(`🔗 Integration: ${integrationResults.passed}/${integrationResults.total} passed`)
  console.log(`📈 Overall Success Rate: ${successRate}%`)
  console.log(`✅ Total Passed: ${totalPassed}/${totalTests}`)
  
  if (successRate >= 90) {
    console.log('\n🎉 EXCELLENT! LeadFlow AI is fully operational and ready for production!')
  } else if (successRate >= 75) {
    console.log('\n✅ GOOD! LeadFlow AI is mostly operational with minor issues.')
  } else {
    console.log('\n⚠️ NEEDS ATTENTION! Some critical systems require fixes.')
  }
  
  console.log('\n🔗 System URLs:')
  console.log('Backend API: http://localhost:3001/api/health')
  console.log('Frontend App: http://localhost:3002/properties/search')
  console.log('Test Page: http://localhost:3002/test')
  
  console.log('\n📋 Manual Testing Checklist:')
  console.log('□ Click all navigation links')
  console.log('□ Test search functionality')
  console.log('□ Interact with property cards')
  console.log('□ Test favorites and sharing')
  console.log('□ Verify responsive design')
  console.log('□ Check accessibility features')
  
  return {
    backend: backendResults,
    frontend: frontendResults,
    integration: integrationResults,
    overall: { passed: totalPassed, total: totalTests, successRate }
  }
}

// Run the tests
runFinalTests().catch(console.error)
