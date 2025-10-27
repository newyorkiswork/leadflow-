// Lead AI Pro - Custom Jest Matchers (2025)
// Custom matchers for AI and business logic testing

import { expect } from '@jest/globals'

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidScore(): R
      toBeValidConfidence(): R
      toBeWithinRange(min: number, max: number): R
      toHaveValidAIInsight(): R
      toHaveValidLeadData(): R
      toHaveValidConversationAnalysis(): R
      toHaveValidVoiceCommand(): R
      toHaveValidSocialProfile(): R
      toHaveValidPrediction(): R
      toBeValidEmail(): R
      toBeValidPhoneNumber(): R
      toBeValidURL(): R
      toHaveValidTimestamp(): R
      toBeRecentTimestamp(withinMinutes?: number): R
      toHaveValidUUID(): R
      toBeValidJSON(): R
      toHaveValidPagination(): R
      toHaveValidAPIResponse(): R
      toHaveValidErrorResponse(): R
      toBeValidPerformanceMetric(): R
    }
  }
}

// Score validation (0-100)
expect.extend({
  toBeValidScore(received: any) {
    const pass = typeof received === 'number' && 
                 received >= 0 && 
                 received <= 100 && 
                 !isNaN(received)
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid score (0-100)`
          : `Expected ${received} to be a valid score (0-100), got ${typeof received}`,
      pass
    }
  }
})

// Confidence validation (0-1)
expect.extend({
  toBeValidConfidence(received: any) {
    const pass = typeof received === 'number' && 
                 received >= 0 && 
                 received <= 1 && 
                 !isNaN(received)
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid confidence (0-1)`
          : `Expected ${received} to be a valid confidence (0-1), got ${typeof received}`,
      pass
    }
  }
})

// Range validation
expect.extend({
  toBeWithinRange(received: any, min: number, max: number) {
    const pass = typeof received === 'number' && 
                 received >= min && 
                 received <= max && 
                 !isNaN(received)
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be within range ${min}-${max}`
          : `Expected ${received} to be within range ${min}-${max}`,
      pass
    }
  }
})

// AI Insight validation
expect.extend({
  toHaveValidAIInsight(received: any) {
    const requiredFields = ['id', 'type', 'title', 'description', 'confidence', 'priority']
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field))
    const hasValidConfidence = typeof received.confidence === 'number' && 
                              received.confidence >= 0 && 
                              received.confidence <= 1
    const hasValidPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(received.priority)
    
    const pass = hasAllFields && hasValidConfidence && hasValidPriority
    
    return {
      message: () => 
        pass 
          ? `Expected object not to be a valid AI insight`
          : `Expected object to be a valid AI insight. Missing or invalid: ${
              !hasAllFields ? 'required fields' : 
              !hasValidConfidence ? 'confidence' : 
              !hasValidPriority ? 'priority' : 'unknown'
            }`,
      pass
    }
  }
})

// Lead data validation
expect.extend({
  toHaveValidLeadData(received: any) {
    const requiredFields = ['id', 'firstName', 'lastName', 'status', 'organizationId']
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field))
    const hasValidStatus = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST'].includes(received.status)
    const hasValidEmail = !received.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received.email)
    
    const pass = hasAllFields && hasValidStatus && hasValidEmail
    
    return {
      message: () => 
        pass 
          ? `Expected object not to be valid lead data`
          : `Expected object to be valid lead data. Issues: ${
              !hasAllFields ? 'missing required fields' : 
              !hasValidStatus ? 'invalid status' : 
              !hasValidEmail ? 'invalid email' : 'unknown'
            }`,
      pass
    }
  }
})

// Conversation analysis validation
expect.extend({
  toHaveValidConversationAnalysis(received: any) {
    const requiredFields = ['sentiment', 'keyTopics', 'actionItems']
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field))
    const hasValidSentiment = typeof received.sentiment === 'number' && 
                             received.sentiment >= -1 && 
                             received.sentiment <= 1
    const hasValidArrays = Array.isArray(received.keyTopics) && 
                          Array.isArray(received.actionItems)
    
    const pass = hasAllFields && hasValidSentiment && hasValidArrays
    
    return {
      message: () => 
        pass 
          ? `Expected object not to be valid conversation analysis`
          : `Expected object to be valid conversation analysis`,
      pass
    }
  }
})

// Voice command validation
expect.extend({
  toHaveValidVoiceCommand(received: any) {
    const requiredFields = ['intent', 'entities', 'confidence']
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field))
    const hasValidConfidence = typeof received.confidence === 'number' && 
                              received.confidence >= 0 && 
                              received.confidence <= 1
    const hasValidEntities = typeof received.entities === 'object' && received.entities !== null
    
    const pass = hasAllFields && hasValidConfidence && hasValidEntities
    
    return {
      message: () => 
        pass 
          ? `Expected object not to be valid voice command`
          : `Expected object to be valid voice command`,
      pass
    }
  }
})

// Social profile validation
expect.extend({
  toHaveValidSocialProfile(received: any) {
    const requiredFields = ['platform', 'username', 'displayName']
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field))
    const hasValidPlatform = ['linkedin', 'twitter', 'facebook', 'instagram'].includes(received.platform)
    const hasValidCounts = typeof received.followerCount === 'number' && 
                          received.followerCount >= 0
    
    const pass = hasAllFields && hasValidPlatform && hasValidCounts
    
    return {
      message: () => 
        pass 
          ? `Expected object not to be valid social profile`
          : `Expected object to be valid social profile`,
      pass
    }
  }
})

// Prediction validation
expect.extend({
  toHaveValidPrediction(received: any) {
    const requiredFields = ['prediction', 'confidence', 'factors']
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field))
    const hasValidPrediction = typeof received.prediction === 'number' && 
                              received.prediction >= 0 && 
                              received.prediction <= 1
    const hasValidFactors = Array.isArray(received.factors)
    
    const pass = hasAllFields && hasValidPrediction && hasValidFactors
    
    return {
      message: () => 
        pass 
          ? `Expected object not to be valid prediction`
          : `Expected object to be valid prediction`,
      pass
    }
  }
})

// Email validation
expect.extend({
  toBeValidEmail(received: any) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pass = typeof received === 'string' && emailRegex.test(received)
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
      pass
    }
  }
})

// Phone number validation
expect.extend({
  toBeValidPhoneNumber(received: any) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    const pass = typeof received === 'string' && phoneRegex.test(received)
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid phone number`
          : `Expected ${received} to be a valid phone number`,
      pass
    }
  }
})

// URL validation
expect.extend({
  toBeValidURL(received: any) {
    try {
      new URL(received)
      return { message: () => `Expected ${received} not to be a valid URL`, pass: true }
    } catch {
      return { message: () => `Expected ${received} to be a valid URL`, pass: false }
    }
  }
})

// Timestamp validation
expect.extend({
  toHaveValidTimestamp(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime())
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid timestamp`
          : `Expected ${received} to be a valid timestamp`,
      pass
    }
  }
})

// Recent timestamp validation
expect.extend({
  toBeRecentTimestamp(received: any, withinMinutes: number = 5) {
    const now = new Date()
    const timestamp = new Date(received)
    const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60)
    const pass = !isNaN(timestamp.getTime()) && diffMinutes >= 0 && diffMinutes <= withinMinutes
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be within ${withinMinutes} minutes`
          : `Expected ${received} to be within ${withinMinutes} minutes of now`,
      pass
    }
  }
})

// UUID validation
expect.extend({
  toHaveValidUUID(received: any) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const pass = typeof received === 'string' && uuidRegex.test(received)
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`,
      pass
    }
  }
})

// JSON validation
expect.extend({
  toBeValidJSON(received: any) {
    try {
      JSON.parse(received)
      return { message: () => `Expected ${received} not to be valid JSON`, pass: true }
    } catch {
      return { message: () => `Expected ${received} to be valid JSON`, pass: false }
    }
  }
})

// Pagination validation
expect.extend({
  toHaveValidPagination(received: any) {
    const requiredFields = ['page', 'limit', 'total', 'totalPages']
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field))
    const hasValidNumbers = typeof received.page === 'number' && 
                           typeof received.limit === 'number' && 
                           typeof received.total === 'number' && 
                           typeof received.totalPages === 'number'
    const hasValidValues = received.page > 0 && 
                          received.limit > 0 && 
                          received.total >= 0 && 
                          received.totalPages >= 0
    
    const pass = hasAllFields && hasValidNumbers && hasValidValues
    
    return {
      message: () => 
        pass 
          ? `Expected object not to have valid pagination`
          : `Expected object to have valid pagination`,
      pass
    }
  }
})

// API response validation
expect.extend({
  toHaveValidAPIResponse(received: any) {
    const hasData = received.hasOwnProperty('data') || received.hasOwnProperty('result')
    const hasNoError = !received.hasOwnProperty('error')
    const hasValidStructure = typeof received === 'object' && received !== null
    
    const pass = hasValidStructure && hasData && hasNoError
    
    return {
      message: () => 
        pass 
          ? `Expected object not to be a valid API response`
          : `Expected object to be a valid API response`,
      pass
    }
  }
})

// Error response validation
expect.extend({
  toHaveValidErrorResponse(received: any) {
    const hasError = received.hasOwnProperty('error')
    const hasMessage = received.hasOwnProperty('message') || 
                      (received.error && typeof received.error === 'string')
    const hasValidStructure = typeof received === 'object' && received !== null
    
    const pass = hasValidStructure && hasError && hasMessage
    
    return {
      message: () => 
        pass 
          ? `Expected object not to be a valid error response`
          : `Expected object to be a valid error response`,
      pass
    }
  }
})

// Performance metric validation
expect.extend({
  toBeValidPerformanceMetric(received: any) {
    const pass = typeof received === 'number' && 
                 received >= 0 && 
                 !isNaN(received) && 
                 isFinite(received)
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid performance metric`
          : `Expected ${received} to be a valid performance metric (positive number)`,
      pass
    }
  }
})

export {}
