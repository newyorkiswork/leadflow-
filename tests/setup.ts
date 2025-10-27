// LeadAI Pro - Test Setup
// Global test setup and configuration

import { jest } from '@jest/globals'

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
  
  toBeValidScore(received: number) {
    const pass = received >= 0 && received <= 100 && !isNaN(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid score (0-100)`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid score (0-100)`,
        pass: false,
      }
    }
  },
  
  toBeValidConfidence(received: number) {
    const pass = received >= 0 && received <= 1 && !isNaN(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid confidence (0-1)`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid confidence (0-1)`,
        pass: false,
      }
    }
  }
})

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R
      toBeValidScore(): R
      toBeValidConfidence(): R
    }
  }
}

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/leadai_test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret'

// Mock console methods in test environment
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  // Suppress console.error and console.warn in tests unless explicitly needed
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Global test utilities
global.testUtils = {
  // Create mock lead data
  createMockLead: (overrides = {}) => ({
    id: 'test-lead-1',
    organizationId: 'test-org-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    company: 'Example Corp',
    title: 'VP of Sales',
    phone: '+1234567890',
    industry: 'technology',
    status: 'qualified',
    source: 'website',
    currentScore: 75,
    scoreConfidence: 0.85,
    predictedValue: 50000,
    conversionProbability: 0.3,
    assignedTo: 'test-user-1',
    teamId: 'test-team-1',
    stage: 'prospect',
    tags: [],
    customFields: {},
    address: null,
    website: 'https://example.com',
    linkedinUrl: null,
    notes: null,
    lastContactedAt: null,
    lastScoredAt: null,
    optimalContactTime: null,
    engagementLevel: 'medium',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  }),

  // Create mock activity data
  createMockActivity: (overrides = {}) => ({
    id: 'test-activity-1',
    leadId: 'test-lead-1',
    userId: 'test-user-1',
    type: 'email_sent',
    subject: 'Test Email',
    description: 'Test email description',
    outcome: 'opened',
    scheduledAt: null,
    completedAt: new Date('2024-01-02T00:00:00Z'),
    durationMinutes: null,
    sentimentScore: 0.8,
    intentDetected: 'interest',
    buyingSignals: ['pricing_inquiry'],
    metadata: {},
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    ...overrides
  }),

  // Create mock conversation data
  createMockConversation: (overrides = {}) => ({
    id: 'test-conversation-1',
    leadId: 'test-lead-1',
    activityId: null,
    direction: 'inbound',
    channel: 'email',
    subject: 'Product Inquiry',
    content: 'I am interested in your product and would like to know more.',
    sentiment: { overall: 'positive', score: 0.8 },
    intent: { primaryIntent: 'information', confidence: 0.7 },
    topics: ['product', 'information'],
    entities: [],
    attachments: [],
    metadata: {},
    analyzedAt: new Date('2024-01-02T00:00:00Z'),
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    ...overrides
  }),

  // Create mock user data
  createMockUser: (overrides = {}) => ({
    id: 'test-user-1',
    email: 'user@example.com',
    fullName: 'Test User',
    avatarUrl: null,
    role: 'sales_rep',
    organizationId: 'test-org-1',
    teamId: 'test-team-1',
    preferences: {},
    aiSettings: {},
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastActiveAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  }),

  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random test data
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  randomEmail: () => {
    const domains = ['example.com', 'test.com', 'demo.org']
    const domain = domains[Math.floor(Math.random() * domains.length)]
    return `${global.testUtils.randomString(8)}@${domain}`
  },

  randomScore: () => Math.floor(Math.random() * 101), // 0-100

  randomConfidence: () => Math.random(), // 0-1

  // Mock API responses
  mockApiResponse: (data: any, status = 200) => ({
    status,
    data,
    headers: {},
    config: {},
    statusText: status === 200 ? 'OK' : 'Error'
  }),

  // Mock Prisma responses
  mockPrismaResponse: (data: any) => Promise.resolve(data),

  mockPrismaError: (message = 'Database error') => Promise.reject(new Error(message)),

  // AI-specific test utilities
  createMockAIInsight: (overrides = {}) => ({
    id: 'test-insight-1',
    type: 'LEAD_SCORING',
    title: 'High-Value Lead Identified',
    description: 'This lead shows strong buying signals and high engagement',
    confidence: 0.87,
    priority: 'HIGH',
    category: 'opportunity',
    tags: ['high-value', 'engaged'],
    data: {
      score: 85,
      factors: ['engagement', 'company_size', 'industry_fit'],
      buyingSignals: ['pricing_inquiry', 'demo_request']
    },
    recommendations: ['Schedule demo within 24 hours', 'Send pricing information'],
    status: 'ACTIVE',
    actionable: true,
    leadId: 'test-lead-1',
    userId: 'test-user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    expiresAt: new Date('2024-01-08T00:00:00Z'),
    ...overrides
  }),

  createMockVoiceCommand: (overrides = {}) => ({
    id: 'test-command-1',
    command: 'Call John Smith from Acme Corp',
    intent: 'call_lead',
    entities: {
      leadName: 'John Smith',
      company: 'Acme Corp'
    },
    confidence: 0.92,
    timestamp: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  }),

  createMockConversationCoaching: (overrides = {}) => ({
    sessionId: 'test-session-1',
    leadId: 'test-lead-1',
    transcript: 'Agent: Hello, this is Sarah from Lead AI Pro...',
    realTimeGuidance: {
      suggestions: ['Ask about their current challenges', 'Listen for buying signals'],
      warnings: ['Talking too much - let prospect speak'],
      opportunities: ['Prospect mentioned budget - explore further'],
      nextBestAction: 'Ask about decision timeline'
    },
    sentimentAnalysis: {
      overall: 0.7,
      trend: 'improving',
      keyMoments: [
        { timestamp: 30, sentiment: 0.5, trigger: 'pricing question' },
        { timestamp: 120, sentiment: 0.8, trigger: 'positive response' }
      ]
    },
    talkTimeRatio: {
      agent: 0.4,
      prospect: 0.6,
      optimal: true
    },
    keywordAnalysis: {
      buyingSignals: ['budget', 'timeline', 'decision'],
      objections: ['price', 'features'],
      interests: ['ROI', 'efficiency'],
      concerns: ['implementation', 'training']
    },
    coachingScore: 8,
    recommendations: [
      'Great job listening to prospect concerns',
      'Follow up on budget discussion',
      'Send ROI calculator after call'
    ],
    ...overrides
  }),

  createMockSocialProfile: (overrides = {}) => ({
    platform: 'linkedin',
    profileUrl: 'https://linkedin.com/in/johndoe',
    username: 'johndoe',
    displayName: 'John Doe',
    bio: 'VP of Sales at Acme Corp',
    followerCount: 1250,
    followingCount: 890,
    postCount: 156,
    verified: false,
    profileImage: 'https://example.com/avatar.jpg',
    lastActive: new Date('2024-01-01T00:00:00Z'),
    engagement: {
      averageLikes: 25,
      averageComments: 8,
      averageShares: 3,
      engagementRate: 0.028
    },
    ...overrides
  }),

  createMockPrediction: (overrides = {}) => ({
    id: 'test-prediction-1',
    modelId: 'lead_conversion_v1',
    targetId: 'test-lead-1',
    prediction: 0.73,
    confidence: 0.85,
    factors: [
      { feature: 'engagement_score', impact: 0.3, direction: 'positive', explanation: 'High email engagement' },
      { feature: 'company_size', impact: 0.25, direction: 'positive', explanation: 'Enterprise company' },
      { feature: 'industry_fit', impact: 0.2, direction: 'positive', explanation: 'Perfect industry match' }
    ],
    recommendations: [
      'Schedule demo within 48 hours',
      'Send enterprise case study',
      'Involve technical team in next call'
    ],
    timeframe: '30 days',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    expiresAt: new Date('2024-01-08T00:00:00Z'),
    ...overrides
  }),

  // Mock AI service responses
  mockAIServiceResponse: (type: string, data: any) => {
    const responses = {
      leadScoring: {
        score: 85,
        confidence: 0.87,
        factors: ['engagement', 'company_size', 'industry_fit'],
        recommendations: ['Follow up within 24 hours'],
        ...data
      },
      conversationAnalysis: {
        sentiment: 0.75,
        keyTopics: ['pricing', 'features', 'timeline'],
        actionItems: ['Send pricing proposal', 'Schedule demo'],
        coachingScore: 8,
        ...data
      },
      voiceCommand: {
        intent: 'call_lead',
        entities: { leadName: 'John Doe' },
        confidence: 0.92,
        ...data
      },
      socialIntelligence: {
        profiles: [global.testUtils.createMockSocialProfile()],
        interests: ['technology', 'sales'],
        opportunities: ['Recent post about challenges'],
        ...data
      },
      predictiveAnalytics: {
        conversionProbability: 0.73,
        expectedValue: 15000,
        timeToClose: 45,
        ...data
      }
    }
    return responses[type as keyof typeof responses] || data
  },

  // Performance testing utilities
  measurePerformance: async (fn: () => Promise<any>, iterations = 1) => {
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await fn()
      const end = performance.now()
      times.push(end - start)
    }

    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total: times.reduce((sum, time) => sum + time, 0)
    }
  }
}

// Declare global test utilities type
declare global {
  var testUtils: {
    createMockLead: (overrides?: any) => any
    createMockActivity: (overrides?: any) => any
    createMockConversation: (overrides?: any) => any
    createMockUser: (overrides?: any) => any
    waitFor: (ms: number) => Promise<void>
    randomString: (length?: number) => string
    randomEmail: () => string
    randomScore: () => number
    randomConfidence: () => number
    mockApiResponse: (data: any, status?: number) => any
    mockPrismaResponse: (data: any) => Promise<any>
    mockPrismaError: (message?: string) => Promise<never>
  }
}

// Mock fetch for API tests
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock as any

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock as any

// Mock window object for frontend tests (only in browser-like environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    writable: true
  })
} else {
  // Create global window mock for Node.js environment
  global.window = {
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    }
  } as any
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Increase timeout for integration tests
jest.setTimeout(30000)

export {}
