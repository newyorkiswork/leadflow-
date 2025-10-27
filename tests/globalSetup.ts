// LeadAI Pro - Global Test Setup
// Setup test environment and database

import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

export default async function globalSetup() {
  console.log('🚀 Setting up test environment...')

  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/leadai_test'
  
  try {
    // Initialize test database
    console.log('📊 Setting up test database...')
    
    // Create test database if it doesn't exist
    try {
      execSync('createdb leadai_test', { stdio: 'ignore' })
    } catch (error) {
      // Database might already exist, continue
    }

    // Run database migrations
    console.log('🔄 Running database migrations...')
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit'
    })

    // Generate Prisma client
    console.log('⚙️ Generating Prisma client...')
    execSync('npx prisma generate', {
      stdio: 'inherit'
    })

    // Seed test data
    console.log('🌱 Seeding test data...')
    await seedTestData()

    console.log('✅ Test environment setup complete!')

  } catch (error) {
    console.error('❌ Failed to setup test environment:', error)
    process.exit(1)
  }
}

async function seedTestData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  try {
    // Clean existing test data
    await prisma.leadScore.deleteMany()
    await prisma.conversation.deleteMany()
    await prisma.activity.deleteMany()
    await prisma.lead.deleteMany()
    await prisma.user.deleteMany()
    await prisma.team.deleteMany()
    await prisma.organization.deleteMany()

    // Create test organization
    const testOrg = await prisma.organization.create({
      data: {
        id: 'test-org-1',
        name: 'Test Organization',
        domain: 'test.com',
        industry: 'technology',
        size: 'medium',
        subscriptionTier: 'professional'
      }
    })

    // Create test team
    const testTeam = await prisma.team.create({
      data: {
        id: 'test-team-1',
        name: 'Test Sales Team',
        organizationId: testOrg.id,
        managerId: null
      }
    })

    // Create test users
    const testUsers = await Promise.all([
      prisma.user.create({
        data: {
          id: 'test-user-1',
          email: 'user1@test.com',
          fullName: 'Test User 1',
          role: 'sales_rep',
          organizationId: testOrg.id,
          teamId: testTeam.id
        }
      }),
      prisma.user.create({
        data: {
          id: 'test-user-2',
          email: 'user2@test.com',
          fullName: 'Test User 2',
          role: 'sales_rep',
          organizationId: testOrg.id,
          teamId: testTeam.id
        }
      }),
      prisma.user.create({
        data: {
          id: 'test-manager-1',
          email: 'manager@test.com',
          fullName: 'Test Manager',
          role: 'manager',
          organizationId: testOrg.id,
          teamId: testTeam.id
        }
      })
    ])

    // Update team manager
    await prisma.team.update({
      where: { id: testTeam.id },
      data: { managerId: testUsers[2].id }
    })

    // Create test leads
    const testLeads = await Promise.all([
      prisma.lead.create({
        data: {
          id: 'test-lead-1',
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
          organizationId: testOrg.id,
          assignedTo: testUsers[0].id,
          teamId: testTeam.id
        }
      }),
      prisma.lead.create({
        data: {
          id: 'test-lead-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@demo.com',
          company: 'Demo Inc',
          title: 'CTO',
          phone: '+1987654321',
          industry: 'technology',
          status: 'contacted',
          source: 'linkedin',
          currentScore: 60,
          scoreConfidence: 0.7,
          predictedValue: 75000,
          organizationId: testOrg.id,
          assignedTo: testUsers[1].id,
          teamId: testTeam.id
        }
      })
    ])

    // Create test activities
    await Promise.all([
      prisma.activity.create({
        data: {
          id: 'test-activity-1',
          leadId: testLeads[0].id,
          userId: testUsers[0].id,
          type: 'email_sent',
          subject: 'Follow up email',
          description: 'Sent follow up email to lead',
          outcome: 'opened',
          completedAt: new Date('2024-01-02T10:00:00Z'),
          sentimentScore: 0.8,
          intentDetected: 'interest',
          buyingSignals: ['pricing_inquiry']
        }
      }),
      prisma.activity.create({
        data: {
          id: 'test-activity-2',
          leadId: testLeads[0].id,
          userId: testUsers[0].id,
          type: 'call_completed',
          subject: 'Discovery call',
          description: 'Had discovery call with lead',
          outcome: 'positive',
          scheduledAt: new Date('2024-01-03T14:00:00Z'),
          completedAt: new Date('2024-01-03T14:30:00Z'),
          durationMinutes: 30,
          sentimentScore: 0.9,
          intentDetected: 'purchase',
          buyingSignals: ['budget_mentioned', 'timeline_discussed']
        }
      })
    ])

    // Create test conversations
    await Promise.all([
      prisma.conversation.create({
        data: {
          id: 'test-conversation-1',
          leadId: testLeads[0].id,
          direction: 'inbound',
          channel: 'email',
          subject: 'Product inquiry',
          content: 'Hi, I am interested in your product and would like to know more about pricing and features.',
          sentiment: {
            overall: 'positive',
            score: 0.8,
            confidence: 0.9
          },
          intent: {
            primaryIntent: 'pricing',
            confidence: 0.8,
            urgency: 'medium'
          },
          topics: ['pricing', 'features', 'product'],
          entities: {
            people: [],
            organizations: ['Example Corp'],
            products: [],
            locations: []
          },
          analyzedAt: new Date('2024-01-02T10:05:00Z')
        }
      }),
      prisma.conversation.create({
        data: {
          id: 'test-conversation-2',
          leadId: testLeads[1].id,
          direction: 'outbound',
          channel: 'email',
          subject: 'Demo invitation',
          content: 'Thank you for your interest. Would you like to schedule a demo of our platform?',
          sentiment: {
            overall: 'neutral',
            score: 0.1,
            confidence: 0.7
          },
          intent: {
            primaryIntent: 'demo',
            confidence: 0.9,
            urgency: 'low'
          },
          topics: ['demo', 'platform', 'schedule'],
          entities: {
            people: [],
            organizations: [],
            products: ['platform'],
            locations: []
          },
          analyzedAt: new Date('2024-01-04T09:00:00Z')
        }
      })
    ])

    // Create test lead scores
    await Promise.all([
      prisma.leadScore.create({
        data: {
          id: 'test-score-1',
          leadId: testLeads[0].id,
          score: 75,
          confidence: 0.85,
          factors: {
            demographic: 70,
            behavioral: 80,
            temporal: 75,
            conversational: 85
          },
          explanation: ['High engagement level', 'Strong buying signals', 'Recent activity'],
          recommendations: ['Schedule demo', 'Send pricing proposal']
        }
      }),
      prisma.leadScore.create({
        data: {
          id: 'test-score-2',
          leadId: testLeads[1].id,
          score: 60,
          confidence: 0.7,
          factors: {
            demographic: 65,
            behavioral: 55,
            temporal: 60,
            conversational: 70
          },
          explanation: ['Moderate engagement', 'Some buying signals', 'Regular activity'],
          recommendations: ['Follow up call', 'Send case studies']
        }
      })
    ])

    console.log('✅ Test data seeded successfully')

  } catch (error) {
    console.error('❌ Failed to seed test data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}
