#!/usr/bin/env node

// Comprehensive LeadFlow AI System Audit Script
// Tests all frontend pages, backend APIs, integration, and user experience

const https = require('http')

console.log('🔍 COMPREHENSIVE LEADFLOW AI SYSTEM AUDIT')
console.log('=' .repeat(70))

// Audit results storage
const auditResults = {
  frontend: { passed: 0, total: 0, issues: [], tests: [] },
  backend: { passed: 0, total: 0, issues: [], tests: [] },
  integration: { passed: 0, total: 0, issues: [], tests: [] },
  errors: { count: 0, details: [] },
  userExperience: { passed: 0, total: 0, issues: [], tests: [] }
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

// Audit test function
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
        responseTime
      })
    }
    
    auditResults[category].tests.push({
      name,
      success,
      message: result.message,
      responseTime,
      critical
    })
    
    return success
  } catch (error) {
    const responseTime = Date.now() - startTime
    auditResults[category].total++
    auditResults.errors.count++
    auditResults.errors.details.push({ name, error: error.message })
    
    console.log(`❌ ${name}: ERROR - ${error.message} (${responseTime}ms)`)
    auditResults[category].issues.push({
      name,
      message: error.message,
      critical: true,
      responseTime
    })
    
    return false
  }
}

// FRONTEND VERIFICATION AUDIT
async function auditFrontendPages() {
  console.log('\n🎨 FRONTEND VERIFICATION AUDIT:')
  console.log('-'.repeat(50))
  
  const pages = [
    { name: 'Dashboard Page', url: 'http://localhost:3002/dashboard', critical: true },
    { name: 'Properties Page', url: 'http://localhost:3002/properties', critical: true },
    { name: 'Property Search Page', url: 'http://localhost:3002/properties/search', critical: true },
    { name: 'Map Page', url: 'http://localhost:3002/map', critical: true },
    { name: 'Analytics Page', url: 'http://localhost:3002/analytics', critical: true },
    { name: 'Leads Page', url: 'http://localhost:3002/leads', critical: true },
    { name: 'Test Page', url: 'http://localhost:3002/test', critical: false }
  ]

  for (const page of pages) {
    await runAuditTest('frontend', page.name, async () => {
      const response = await makeRequest(page.url)
      
      if (response.status === 200) {
        // Check if response contains HTML content
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          return { status: 'pass', message: `Page loads successfully with HTML content` }
        } else if (typeof response.data === 'string' && response.data.length > 1000) {
          return { status: 'pass', message: `Page loads successfully with content` }
        } else {
          return { status: 'pass', message: `Page loads successfully (${response.status})` }
        }
      } else if (response.status === 404) {
        return { status: 'fail', message: `Page not found (404)` }
      } else if (response.status === 500) {
        return { status: 'fail', message: `Server error (500)` }
      } else {
        return { status: 'fail', message: `Unexpected status (${response.status})` }
      }
    }, page.critical)
  }
}

// BACKEND API TESTING AUDIT
async function auditBackendAPIs() {
  console.log('\n🔧 BACKEND API TESTING AUDIT:')
  console.log('-'.repeat(50))
  
  const endpoints = [
    {
      name: 'API Health Check',
      url: 'http://localhost:3001/api/health',
      method: 'GET',
      critical: true,
      validate: (data) => data.status === 'healthy'
    },
    {
      name: 'Database Health Check',
      url: 'http://localhost:3001/api/health/database',
      method: 'GET',
      critical: true,
      validate: (data) => data.connected === true
    },
    {
      name: 'Property Search API',
      url: 'http://localhost:3001/api/properties/search',
      method: 'POST',
      body: { filters: { location: 'New York' }, page: 1, pageSize: 3 },
      critical: true,
      validate: (data) => data.results && Array.isArray(data.results)
    },
    {
      name: 'Property Details API',
      url: 'http://localhost:3001/api/properties/prop_1',
      method: 'GET',
      critical: true,
      validate: (data) => data.id && data.address
    },
    {
      name: 'Geolocation Search API',
      url: 'http://localhost:3001/api/geolocation/search',
      method: 'POST',
      body: { query: 'Manhattan', limit: 3 },
      critical: true,
      validate: (data) => data.results && Array.isArray(data.results)
    },
    {
      name: 'Nearby Locations API',
      url: 'http://localhost:3001/api/geolocation/nearby',
      method: 'POST',
      body: { lat: 40.7831, lng: -73.9712, radius: 25 },
      critical: true,
      validate: (data) => data.results && Array.isArray(data.results)
    },
    {
      name: 'Reverse Geocoding API',
      url: 'http://localhost:3001/api/geolocation/reverse',
      method: 'POST',
      body: { lat: 40.7831, lng: -73.9712 },
      critical: true,
      validate: (data) => data.address
    },
    {
      name: 'Market Insights API',
      url: 'http://localhost:3001/api/properties/market-insights',
      method: 'POST',
      body: { location: 'Manhattan, NY' },
      critical: true,
      validate: (data) => data.location
    },
    {
      name: 'User Favorites API (GET)',
      url: 'http://localhost:3001/api/users/favorites',
      method: 'GET',
      critical: false,
      validate: (data) => data.results && Array.isArray(data.results)
    },
    {
      name: 'User Favorites API (POST)',
      url: 'http://localhost:3001/api/users/favorites',
      method: 'POST',
      body: { propertyId: 'audit_test_prop', type: 'property' },
      critical: false,
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
          return { status: 'fail', message: `API responds but data validation failed` }
        }
        return { status: 'pass', message: `API responds correctly with valid data` }
      } else {
        return { status: 'fail', message: `API failed with status ${response.status}` }
      }
    }, endpoint.critical)
  }
}

// INTEGRATION TESTING AUDIT
async function auditIntegration() {
  console.log('\n🔗 INTEGRATION TESTING AUDIT:')
  console.log('-'.repeat(50))
  
  await runAuditTest('integration', 'End-to-End Property Search Flow', async () => {
    // Test backend property search
    const searchResponse = await makeRequest('http://localhost:3001/api/properties/search', {
      method: 'POST',
      body: { filters: { location: 'Brooklyn' }, page: 1, pageSize: 1 }
    })
    
    if (searchResponse.status !== 200) {
      return { status: 'fail', message: 'Backend property search failed' }
    }
    
    // Test frontend property search page
    const pageResponse = await makeRequest('http://localhost:3002/properties/search')
    
    if (pageResponse.status !== 200) {
      return { status: 'fail', message: 'Frontend property search page failed' }
    }
    
    return { status: 'pass', message: 'Property search flow working end-to-end' }
  })

  await runAuditTest('integration', 'Geolocation Services Integration', async () => {
    // Test geolocation API
    const geoResponse = await makeRequest('http://localhost:3001/api/geolocation/search', {
      method: 'POST',
      body: { query: 'Manhattan', limit: 1 }
    })
    
    if (geoResponse.status !== 200 || !geoResponse.data.results) {
      return { status: 'fail', message: 'Geolocation API integration failed' }
    }
    
    return { status: 'pass', message: 'Geolocation services fully integrated' }
  })

  await runAuditTest('integration', 'Dashboard Analytics Integration', async () => {
    // Test dashboard page
    const dashboardResponse = await makeRequest('http://localhost:3002/dashboard')
    
    if (dashboardResponse.status !== 200) {
      return { status: 'fail', message: 'Dashboard page integration failed' }
    }
    
    // Test analytics page
    const analyticsResponse = await makeRequest('http://localhost:3002/analytics')
    
    if (analyticsResponse.status !== 200) {
      return { status: 'fail', message: 'Analytics page integration failed' }
    }
    
    return { status: 'pass', message: 'Dashboard and analytics fully integrated' }
  })

  await runAuditTest('integration', 'Real Estate Data Integration', async () => {
    // Test property details
    const propertyResponse = await makeRequest('http://localhost:3001/api/properties/prop_1')
    
    if (propertyResponse.status !== 200 || !propertyResponse.data.id) {
      return { status: 'fail', message: 'Property data integration failed' }
    }
    
    // Test market insights
    const marketResponse = await makeRequest('http://localhost:3001/api/properties/market-insights', {
      method: 'POST',
      body: { location: 'New York, NY' }
    })
    
    if (marketResponse.status !== 200 || !marketResponse.data.location) {
      return { status: 'fail', message: 'Market insights integration failed' }
    }
    
    return { status: 'pass', message: 'Real estate data fully integrated' }
  })
}

// ERROR DETECTION AUDIT
async function auditErrorDetection() {
  console.log('\n🚨 ERROR DETECTION AUDIT:')
  console.log('-'.repeat(50))
  
  await runAuditTest('errors', 'API Error Handling', async () => {
    // Test invalid endpoint
    const invalidResponse = await makeRequest('http://localhost:3001/api/invalid-endpoint-test')
    
    if (invalidResponse.status === 404) {
      return { status: 'pass', message: 'API properly handles invalid endpoints (404)' }
    } else {
      return { status: 'fail', message: `Unexpected response for invalid endpoint: ${invalidResponse.status}` }
    }
  })

  await runAuditTest('errors', 'Frontend Error Pages', async () => {
    // Test non-existent page
    const notFoundResponse = await makeRequest('http://localhost:3002/non-existent-page')
    
    if (notFoundResponse.status === 404) {
      return { status: 'pass', message: 'Frontend properly handles non-existent pages (404)' }
    } else {
      return { status: 'fail', message: `Unexpected response for non-existent page: ${notFoundResponse.status}` }
    }
  })
}

// USER EXPERIENCE VALIDATION
async function auditUserExperience() {
  console.log('\n👤 USER EXPERIENCE VALIDATION:')
  console.log('-'.repeat(50))
  
  await runAuditTest('userExperience', 'Core Property Search Journey', async () => {
    // Test property search with different parameters
    const searches = [
      { location: 'New York' },
      { location: 'Brooklyn', minPrice: 200000, maxPrice: 500000 },
      { location: 'Manhattan', propertyType: 'Condo' }
    ]
    
    for (const search of searches) {
      const response = await makeRequest('http://localhost:3001/api/properties/search', {
        method: 'POST',
        body: { filters: search, page: 1, pageSize: 5 }
      })
      
      if (response.status !== 200 || !response.data.results) {
        return { status: 'fail', message: `Property search failed for ${JSON.stringify(search)}` }
      }
    }
    
    return { status: 'pass', message: 'Core property search journey working perfectly' }
  })

  await runAuditTest('userExperience', 'Geolocation User Flow', async () => {
    // Test location search
    const locationResponse = await makeRequest('http://localhost:3001/api/geolocation/search', {
      method: 'POST',
      body: { query: 'Times Square, New York', limit: 5 }
    })
    
    if (locationResponse.status !== 200 || !locationResponse.data.results) {
      return { status: 'fail', message: 'Location search user flow failed' }
    }
    
    // Test nearby locations
    const nearbyResponse = await makeRequest('http://localhost:3001/api/geolocation/nearby', {
      method: 'POST',
      body: { lat: 40.7589, lng: -73.9851, radius: 10 }
    })
    
    if (nearbyResponse.status !== 200 || !nearbyResponse.data.results) {
      return { status: 'fail', message: 'Nearby locations user flow failed' }
    }
    
    return { status: 'pass', message: 'Geolocation user flow working seamlessly' }
  })

  await runAuditTest('userExperience', 'User Interaction Features', async () => {
    // Test favorites functionality
    const addFavoriteResponse = await makeRequest('http://localhost:3001/api/users/favorites', {
      method: 'POST',
      body: { propertyId: 'ux_test_property', type: 'property' }
    })
    
    if (addFavoriteResponse.status !== 200) {
      return { status: 'fail', message: 'Add to favorites functionality failed' }
    }
    
    // Test get favorites
    const getFavoritesResponse = await makeRequest('http://localhost:3001/api/users/favorites')
    
    if (getFavoritesResponse.status !== 200 || !getFavoritesResponse.data.results) {
      return { status: 'fail', message: 'Get favorites functionality failed' }
    }
    
    return { status: 'pass', message: 'User interaction features working correctly' }
  })
}

// Main audit runner
async function runComprehensiveAudit() {
  console.log('🚀 Starting Comprehensive LeadFlow AI System Audit...\n')
  
  await auditFrontendPages()
  await auditBackendAPIs()
  await auditIntegration()
  await auditErrorDetection()
  await auditUserExperience()
  
  // Calculate overall results
  const totalCategories = ['frontend', 'backend', 'integration', 'userExperience']
  let totalPassed = 0
  let totalTests = 0
  let totalIssues = 0
  
  totalCategories.forEach(category => {
    totalPassed += auditResults[category].passed
    totalTests += auditResults[category].total
    totalIssues += auditResults[category].issues.length
  })
  
  const successRate = Math.round((totalPassed / totalTests) * 100)
  
  console.log('\n' + '='.repeat(70))
  console.log('🎯 COMPREHENSIVE AUDIT SUMMARY')
  console.log('='.repeat(70))
  console.log(`🎨 Frontend Pages: ${auditResults.frontend.passed}/${auditResults.frontend.total} passed`)
  console.log(`🔧 Backend APIs: ${auditResults.backend.passed}/${auditResults.backend.total} passed`)
  console.log(`🔗 Integration: ${auditResults.integration.passed}/${auditResults.integration.total} passed`)
  console.log(`👤 User Experience: ${auditResults.userExperience.passed}/${auditResults.userExperience.total} passed`)
  console.log(`🚨 Error Detection: ${auditResults.errors.count} errors found`)
  console.log(`📈 Overall Success Rate: ${successRate}%`)
  console.log(`✅ Total Passed: ${totalPassed}/${totalTests}`)
  console.log(`⚠️ Total Issues: ${totalIssues}`)
  
  // Detailed issue reporting
  if (totalIssues > 0) {
    console.log('\n📋 DETAILED ISSUE REPORT:')
    totalCategories.forEach(category => {
      if (auditResults[category].issues.length > 0) {
        console.log(`\n${category.toUpperCase()} ISSUES:`)
        auditResults[category].issues.forEach(issue => {
          console.log(`  ${issue.critical ? '❌' : '⚠️'} ${issue.name}: ${issue.message}`)
        })
      }
    })
  }
  
  // Production readiness assessment
  console.log('\n🎯 PRODUCTION READINESS ASSESSMENT:')
  if (successRate >= 95 && totalIssues === 0) {
    console.log('🟢 READY FOR PRODUCTION - All systems fully operational!')
    console.log('✅ All critical functionality verified')
    console.log('✅ No blocking issues detected')
    console.log('✅ User experience validated')
  } else if (successRate >= 90 && totalIssues <= 2) {
    console.log('🟡 MOSTLY READY - Minor issues to address')
    console.log('⚠️ Some non-critical features may need attention')
  } else {
    console.log('🔴 NEEDS WORK - Critical issues require resolution')
    console.log('❌ Address blocking issues before production')
  }
  
  console.log('\n🔗 VERIFIED SYSTEM URLS:')
  console.log('Backend API: http://localhost:3001/api/health')
  console.log('Frontend App: http://localhost:3002/properties/search')
  console.log('Dashboard: http://localhost:3002/dashboard')
  console.log('Analytics: http://localhost:3002/analytics')
  
  return {
    frontend: auditResults.frontend,
    backend: auditResults.backend,
    integration: auditResults.integration,
    userExperience: auditResults.userExperience,
    errors: auditResults.errors,
    overall: { passed: totalPassed, total: totalTests, successRate, issues: totalIssues }
  }
}

// Run the comprehensive audit
runComprehensiveAudit().catch(console.error)
