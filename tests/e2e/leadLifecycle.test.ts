// Lead AI Pro - End-to-End Lead Lifecycle Tests (2025)
// Complete user journey testing from lead creation to conversion

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { Browser, Page, chromium } from 'playwright'
import '../setup'

describe('Lead Lifecycle E2E Tests', () => {
  let browser: Browser
  let page: Page
  let baseURL: string

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.CI === 'true',
      slowMo: process.env.CI ? 0 : 100
    })
    baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    
    // Mock authentication
    await page.goto(`${baseURL}/login`)
    await page.fill('[data-testid="email"]', 'test@leadaipro.com')
    await page.fill('[data-testid="password"]', 'testpassword')
    await page.click('[data-testid="login-button"]')
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]')
  })

  afterEach(async () => {
    await page.close()
  })

  describe('Lead Creation and Initial Processing', () => {
    test('should create lead from business card scan', async () => {
      // Navigate to business card scanner
      await page.click('[data-testid="scan-card-button"]')
      await page.waitForSelector('[data-testid="camera-scanner"]')

      // Mock camera input with business card data
      await page.evaluate(() => {
        const mockCardData = {
          name: 'John Smith',
          title: 'VP of Sales',
          company: 'Acme Corporation',
          email: 'john.smith@acme.com',
          phone: '+1-555-123-4567'
        }
        
        // Simulate successful scan
        window.dispatchEvent(new CustomEvent('cardScanned', { 
          detail: mockCardData 
        }))
      })

      // Verify lead creation form is populated
      await page.waitForSelector('[data-testid="lead-form"]')
      expect(await page.inputValue('[data-testid="first-name"]')).toBe('John')
      expect(await page.inputValue('[data-testid="last-name"]')).toBe('Smith')
      expect(await page.inputValue('[data-testid="company"]')).toBe('Acme Corporation')
      expect(await page.inputValue('[data-testid="email"]')).toBe('john.smith@acme.com')

      // Save the lead
      await page.click('[data-testid="save-lead-button"]')
      
      // Verify lead appears in dashboard
      await page.waitForSelector('[data-testid="lead-card"]')
      const leadCard = page.locator('[data-testid="lead-card"]').first()
      await expect(leadCard).toContainText('John Smith')
      await expect(leadCard).toContainText('Acme Corporation')
    })

    test('should automatically score new lead', async () => {
      // Create a lead manually
      await page.click('[data-testid="add-lead-button"]')
      await page.fill('[data-testid="first-name"]', 'Jane')
      await page.fill('[data-testid="last-name"]', 'Doe')
      await page.fill('[data-testid="company"]', 'Tech Startup Inc')
      await page.fill('[data-testid="email"]', 'jane.doe@techstartup.com')
      await page.fill('[data-testid="job-title"]', 'CTO')
      await page.click('[data-testid="save-lead-button"]')

      // Wait for AI scoring to complete
      await page.waitForSelector('[data-testid="lead-score"]', { timeout: 10000 })
      
      // Verify score is displayed
      const scoreElement = page.locator('[data-testid="lead-score"]')
      const scoreText = await scoreElement.textContent()
      const score = parseInt(scoreText?.match(/\d+/)?.[0] || '0')
      
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    test('should generate AI insights for new lead', async () => {
      // Navigate to lead details
      await page.click('[data-testid="lead-card"]')
      await page.waitForSelector('[data-testid="lead-details"]')

      // Wait for AI insights to load
      await page.waitForSelector('[data-testid="ai-insights"]', { timeout: 15000 })
      
      // Verify insights are displayed
      const insights = page.locator('[data-testid="ai-insight-card"]')
      const insightCount = await insights.count()
      
      expect(insightCount).toBeGreaterThan(0)
      
      // Check first insight
      const firstInsight = insights.first()
      await expect(firstInsight).toContainText(/confidence/i)
      await expect(firstInsight).toContainText(/recommendation/i)
    })
  })

  describe('Lead Engagement and Communication', () => {
    test('should initiate call with voice coaching', async () => {
      // Navigate to lead and start call
      await page.click('[data-testid="lead-card"]')
      await page.click('[data-testid="call-button"]')
      
      // Wait for call interface
      await page.waitForSelector('[data-testid="call-interface"]')
      
      // Mock call connection
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('callConnected'))
      })
      
      // Verify coaching interface appears
      await page.waitForSelector('[data-testid="conversation-coaching"]')
      
      // Simulate conversation transcript
      await page.evaluate(() => {
        const mockTranscript = 'Agent: Hello, this is Sarah from Lead AI Pro. Customer: Hi, I received your email about the demo.'
        window.dispatchEvent(new CustomEvent('transcriptUpdate', { 
          detail: { transcript: mockTranscript }
        }))
      })
      
      // Verify coaching suggestions appear
      await page.waitForSelector('[data-testid="coaching-suggestions"]')
      const suggestions = page.locator('[data-testid="coaching-suggestion"]')
      const suggestionCount = await suggestions.count()
      
      expect(suggestionCount).toBeGreaterThan(0)
    })

    test('should send personalized email', async () => {
      // Navigate to lead and compose email
      await page.click('[data-testid="lead-card"]')
      await page.click('[data-testid="email-button"]')
      
      // Wait for email composer
      await page.waitForSelector('[data-testid="email-composer"]')
      
      // Click AI generate button
      await page.click('[data-testid="ai-generate-email"]')
      
      // Wait for AI-generated content
      await page.waitForSelector('[data-testid="email-content"]', { timeout: 10000 })
      
      // Verify content is personalized
      const emailContent = await page.textContent('[data-testid="email-content"]')
      expect(emailContent).toContain('John') // Lead's name
      expect(emailContent).toContain('Acme') // Company name
      
      // Send email
      await page.click('[data-testid="send-email-button"]')
      
      // Verify email sent confirmation
      await page.waitForSelector('[data-testid="email-sent-confirmation"]')
    })

    test('should schedule follow-up meeting', async () => {
      // Navigate to calendar
      await page.click('[data-testid="calendar-nav"]')
      await page.waitForSelector('[data-testid="calendar-view"]')
      
      // Click schedule meeting
      await page.click('[data-testid="schedule-meeting-button"]')
      
      // Select lead
      await page.click('[data-testid="lead-selector"]')
      await page.click('[data-testid="lead-option"]')
      
      // AI suggests optimal time
      await page.waitForSelector('[data-testid="ai-time-suggestions"]')
      const timeSuggestions = page.locator('[data-testid="time-suggestion"]')
      
      // Select first suggested time
      await timeSuggestions.first().click()
      
      // Add meeting details
      await page.fill('[data-testid="meeting-title"]', 'Product Demo')
      await page.fill('[data-testid="meeting-description"]', 'Demonstrate key features and ROI')
      
      // Schedule meeting
      await page.click('[data-testid="schedule-button"]')
      
      // Verify meeting appears in calendar
      await page.waitForSelector('[data-testid="calendar-event"]')
      const event = page.locator('[data-testid="calendar-event"]')
      await expect(event).toContainText('Product Demo')
    })
  })

  describe('Social Media Intelligence', () => {
    test('should research lead social profiles', async () => {
      // Navigate to lead details
      await page.click('[data-testid="lead-card"]')
      await page.waitForSelector('[data-testid="lead-details"]')
      
      // Click social research button
      await page.click('[data-testid="social-research-button"]')
      
      // Wait for social intelligence results
      await page.waitForSelector('[data-testid="social-profiles"]', { timeout: 15000 })
      
      // Verify social profiles are displayed
      const profiles = page.locator('[data-testid="social-profile"]')
      const profileCount = await profiles.count()
      
      expect(profileCount).toBeGreaterThan(0)
      
      // Check profile details
      const firstProfile = profiles.first()
      await expect(firstProfile).toContainText(/linkedin|twitter|facebook/i)
    })

    test('should generate engagement strategy', async () => {
      // From social research results, generate strategy
      await page.click('[data-testid="generate-strategy-button"]')
      
      // Wait for strategy generation
      await page.waitForSelector('[data-testid="engagement-strategy"]', { timeout: 10000 })
      
      // Verify strategy components
      await expect(page.locator('[data-testid="strategy-approach"]')).toBeVisible()
      await expect(page.locator('[data-testid="strategy-timeline"]')).toBeVisible()
      await expect(page.locator('[data-testid="strategy-messages"]')).toBeVisible()
      
      // Verify timeline has steps
      const timelineSteps = page.locator('[data-testid="timeline-step"]')
      const stepCount = await timelineSteps.count()
      
      expect(stepCount).toBeGreaterThan(0)
    })
  })

  describe('Voice Commands and Automation', () => {
    test('should process voice commands', async () => {
      // Click voice activation button
      await page.click('[data-testid="voice-button"]')
      
      // Wait for voice interface
      await page.waitForSelector('[data-testid="voice-interface"]')
      
      // Simulate voice command
      await page.evaluate(() => {
        const mockCommand = 'Call John Smith from Acme Corporation'
        window.dispatchEvent(new CustomEvent('voiceCommand', { 
          detail: { command: mockCommand }
        }))
      })
      
      // Wait for command processing
      await page.waitForSelector('[data-testid="command-result"]', { timeout: 10000 })
      
      // Verify command was understood
      const result = await page.textContent('[data-testid="command-result"]')
      expect(result).toContain('call')
      expect(result).toContain('John Smith')
    })

    test('should execute automated follow-up sequence', async () => {
      // Navigate to follow-up sequences
      await page.click('[data-testid="sequences-nav"]')
      await page.waitForSelector('[data-testid="sequences-list"]')
      
      // Create new sequence
      await page.click('[data-testid="create-sequence-button"]')
      
      // Add sequence steps
      await page.fill('[data-testid="sequence-name"]', 'Demo Follow-up')
      await page.click('[data-testid="add-step-button"]')
      
      // Configure first step
      await page.selectOption('[data-testid="step-type"]', 'email')
      await page.fill('[data-testid="step-title"]', 'Thank you for the demo')
      await page.fill('[data-testid="step-delay"]', '24')
      
      // Save sequence
      await page.click('[data-testid="save-sequence-button"]')
      
      // Activate sequence for lead
      await page.click('[data-testid="activate-sequence-button"]')
      
      // Verify sequence is active
      await page.waitForSelector('[data-testid="active-sequence"]')
      const activeSequence = page.locator('[data-testid="active-sequence"]')
      await expect(activeSequence).toContainText('Demo Follow-up')
    })
  })

  describe('Analytics and Reporting', () => {
    test('should display performance dashboard', async () => {
      // Navigate to analytics
      await page.click('[data-testid="analytics-nav"]')
      await page.waitForSelector('[data-testid="analytics-dashboard"]')
      
      // Verify key metrics are displayed
      await expect(page.locator('[data-testid="total-leads"]')).toBeVisible()
      await expect(page.locator('[data-testid="conversion-rate"]')).toBeVisible()
      await expect(page.locator('[data-testid="avg-deal-size"]')).toBeVisible()
      
      // Verify charts are rendered
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="pipeline-chart"]')).toBeVisible()
    })

    test('should generate sales forecast', async () => {
      // Click forecast button
      await page.click('[data-testid="generate-forecast-button"]')
      
      // Wait for forecast generation
      await page.waitForSelector('[data-testid="sales-forecast"]', { timeout: 15000 })
      
      // Verify forecast components
      await expect(page.locator('[data-testid="forecast-revenue"]')).toBeVisible()
      await expect(page.locator('[data-testid="forecast-deals"]')).toBeVisible()
      await expect(page.locator('[data-testid="forecast-confidence"]')).toBeVisible()
      
      // Verify confidence level is reasonable
      const confidenceText = await page.textContent('[data-testid="forecast-confidence"]')
      const confidence = parseInt(confidenceText?.match(/\d+/)?.[0] || '0')
      
      expect(confidence).toBeGreaterThan(50)
      expect(confidence).toBeLessThanOrEqual(100)
    })
  })

  describe('Mobile Experience', () => {
    test('should work on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Navigate to dashboard
      await page.goto(`${baseURL}/dashboard`)
      await page.waitForSelector('[data-testid="mobile-dashboard"]')
      
      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
      
      // Test mobile lead card interaction
      await page.click('[data-testid="lead-card"]')
      await page.waitForSelector('[data-testid="mobile-lead-details"]')
      
      // Verify mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-actions"]')).toBeVisible()
    })

    test('should support touch gestures', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Test swipe gesture on lead card
      const leadCard = page.locator('[data-testid="lead-card"]').first()
      
      // Simulate swipe left
      await leadCard.hover()
      await page.mouse.down()
      await page.mouse.move(100, 0)
      await page.mouse.up()
      
      // Verify swipe actions appear
      await expect(page.locator('[data-testid="swipe-actions"]')).toBeVisible()
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      // Try to perform an action
      await page.click('[data-testid="add-lead-button"]')
      
      // Verify error message is displayed
      await page.waitForSelector('[data-testid="error-message"]')
      const errorMessage = await page.textContent('[data-testid="error-message"]')
      expect(errorMessage).toContain('network')
      
      // Verify retry mechanism
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    })

    test('should recover from AI service failures', async () => {
      // Mock AI service failure
      await page.route('**/api/ai/**', route => 
        route.fulfill({ status: 503, body: 'AI service unavailable' })
      )
      
      // Try to use AI feature
      await page.click('[data-testid="ai-generate-email"]')
      
      // Verify fallback behavior
      await page.waitForSelector('[data-testid="ai-fallback"]')
      const fallbackMessage = await page.textContent('[data-testid="ai-fallback"]')
      expect(fallbackMessage).toContain('temporarily unavailable')
    })
  })
})
