// LeadFlow AI - Database Seed Script
// Seeds the database with sample real estate data for development

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🏠 Seeding LeadFlow AI database with real estate data...')

  // Create sample organization
  const organization = await prisma.organization.upsert({
    where: { domain: 'demo-investors.com' },
    update: {},
    create: {
      name: 'Demo Real Estate Investors',
      domain: 'demo-investors.com',
      industry: 'Real Estate Investment',
      size: 'MEDIUM',
      subscriptionTier: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        defaultInvestmentStrategy: 'FIX_AND_FLIP'
      },
      aiConfig: {
        enablePropertyAnalysis: true,
        enableSkipTracing: true,
        enableMarketInsights: true,
        autoScoreLeads: true
      }
    }
  })

  console.log('✅ Created organization:', organization.name)

  // Create sample users
  const passwordHash = await bcrypt.hash('password123', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo-investors.com' },
    update: {},
    create: {
      email: 'admin@demo-investors.com',
      firstName: 'John',
      lastName: 'Investor',
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash,
      organizationId: organization.id,
      timezone: 'America/New_York',
      language: 'en',
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        dashboardLayout: 'grid'
      },
      aiSettings: {
        enableVoiceCommands: true,
        enableConversationCoaching: true,
        autoGenerateEmails: true
      }
    }
  })

  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@demo-investors.com' },
    update: {},
    create: {
      email: 'agent@demo-investors.com',
      firstName: 'Sarah',
      lastName: 'Agent',
      role: 'AGENT',
      status: 'ACTIVE',
      passwordHash,
      organizationId: organization.id,
      timezone: 'America/New_York',
      language: 'en',
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        dashboardLayout: 'list'
      },
      aiSettings: {
        enableVoiceCommands: true,
        enableConversationCoaching: true,
        autoGenerateEmails: false
      }
    }
  })

  console.log('✅ Created users:', adminUser.email, agentUser.email)

  // Create sample properties
  const properties = [
    {
      streetAddress: '123 Main Street',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30309',
      county: 'Fulton',
      propertyType: 'SINGLE_FAMILY',
      bedrooms: 3,
      bathrooms: 2.0,
      squareFootage: 1850,
      lotSize: 0.25,
      yearBuilt: 1995,
      listPrice: 285000,
      marketValue: 275000,
      taxAssessedValue: 250000,
      annualTaxes: 3200,
      arv: 320000,
      repairCosts: 25000,
      status: 'AVAILABLE',
      occupancyStatus: 'VACANT',
      dataSource: 'PROPSTREAM',
      propStreamId: 'PS123456'
    },
    {
      streetAddress: '456 Oak Avenue',
      city: 'Birmingham',
      state: 'AL',
      zipCode: '35203',
      county: 'Jefferson',
      propertyType: 'SINGLE_FAMILY',
      bedrooms: 4,
      bathrooms: 3.0,
      squareFootage: 2200,
      lotSize: 0.33,
      yearBuilt: 1988,
      listPrice: 195000,
      marketValue: 185000,
      taxAssessedValue: 170000,
      annualTaxes: 2100,
      arv: 240000,
      repairCosts: 35000,
      status: 'AVAILABLE',
      occupancyStatus: 'TENANT_OCCUPIED',
      dataSource: 'DRIVING_FOR_DOLLARS'
    },
    {
      streetAddress: '789 Pine Street',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37203',
      county: 'Davidson',
      propertyType: 'MULTI_FAMILY',
      bedrooms: 6,
      bathrooms: 4.0,
      squareFootage: 3200,
      lotSize: 0.18,
      yearBuilt: 1975,
      listPrice: 450000,
      marketValue: 425000,
      taxAssessedValue: 380000,
      annualTaxes: 5200,
      monthlyRent: 3200,
      arv: 480000,
      repairCosts: 15000,
      status: 'UNDER_CONTRACT',
      occupancyStatus: 'TENANT_OCCUPIED',
      dataSource: 'MLS'
    }
  ]

  const createdProperties = []
  for (const propertyData of properties) {
    const property = await prisma.property.create({
      data: {
        ...propertyData,
        organizationId: organization.id
      }
    })
    createdProperties.push(property)
  }

  console.log('✅ Created properties:', createdProperties.length)

  // Create property owners
  const owners = [
    {
      firstName: 'Michael',
      lastName: 'Johnson',
      ownerType: 'INDIVIDUAL',
      email: 'mjohnson@email.com',
      phone: '+1-404-555-0123',
      mailingAddress: '123 Main Street',
      mailingCity: 'Atlanta',
      mailingState: 'GA',
      mailingZip: '30309',
      ownershipType: 'FEE_SIMPLE',
      ownershipPercent: 100.0,
      acquisitionDate: new Date('2018-03-15'),
      acquisitionPrice: 220000,
      skipTraceStatus: 'COMPLETED',
      propertyId: createdProperties[0].id
    },
    {
      firstName: 'Jennifer',
      lastName: 'Williams',
      ownerType: 'INDIVIDUAL',
      email: 'jwilliams@email.com',
      phone: '+1-205-555-0456',
      mailingAddress: '789 Different Street',
      mailingCity: 'Birmingham',
      mailingState: 'AL',
      mailingZip: '35204',
      ownershipType: 'FEE_SIMPLE',
      ownershipPercent: 100.0,
      acquisitionDate: new Date('2015-08-22'),
      acquisitionPrice: 145000,
      skipTraceStatus: 'NOT_TRACED',
      propertyId: createdProperties[1].id
    },
    {
      companyName: 'Nashville Holdings LLC',
      ownerType: 'LLC',
      phone: '+1-615-555-0789',
      mailingAddress: '100 Business Plaza',
      mailingCity: 'Nashville',
      mailingState: 'TN',
      mailingZip: '37201',
      ownershipType: 'FEE_SIMPLE',
      ownershipPercent: 100.0,
      acquisitionDate: new Date('2020-01-10'),
      acquisitionPrice: 380000,
      skipTraceStatus: 'COMPLETED',
      propertyId: createdProperties[2].id
    }
  ]

  const createdOwners = []
  for (const ownerData of owners) {
    const owner = await prisma.propertyOwner.create({
      data: ownerData
    })
    createdOwners.push(owner)
  }

  console.log('✅ Created property owners:', createdOwners.length)

  // Create real estate leads
  const leads = [
    {
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'mjohnson@email.com',
      phone: '+1-404-555-0123',
      address: '123 Main Street',
      city: 'Atlanta',
      state: 'GA',
      postalCode: '30309',
      leadType: 'SELLER',
      source: 'PROPSTREAM',
      status: 'QUALIFIED',
      stage: 'INTEREST',
      priority: 'HIGH',
      motivationLevel: 'HIGH',
      timeframe: 'WITHIN_90_DAYS',
      sellingReason: 'RELOCATION',
      priceExpectation: 280000,
      propertyCondition: 'FAIR',
      score: 85,
      qualificationScore: 90,
      engagementScore: 80,
      dealProbability: 0.75,
      organizationId: organization.id,
      assignedToId: agentUser.id,
      propertyId: createdProperties[0].id,
      propertyOwnerId: createdOwners[0].id
    },
    {
      firstName: 'Jennifer',
      lastName: 'Williams',
      email: 'jwilliams@email.com',
      phone: '+1-205-555-0456',
      address: '456 Oak Avenue',
      city: 'Birmingham',
      state: 'AL',
      postalCode: '35203',
      leadType: 'SELLER',
      source: 'DRIVING_FOR_DOLLARS',
      status: 'NEW',
      stage: 'AWARENESS',
      priority: 'MEDIUM',
      motivationLevel: 'MEDIUM',
      timeframe: 'WITHIN_6_MONTHS',
      sellingReason: 'FINANCIAL_DISTRESS',
      priceExpectation: 190000,
      propertyCondition: 'POOR',
      score: 65,
      qualificationScore: 70,
      engagementScore: 60,
      dealProbability: 0.45,
      organizationId: organization.id,
      assignedToId: agentUser.id,
      propertyId: createdProperties[1].id,
      propertyOwnerId: createdOwners[1].id
    },
    {
      firstName: 'David',
      lastName: 'Chen',
      email: 'dchen@email.com',
      phone: '+1-615-555-0321',
      address: '321 Investor Lane',
      city: 'Nashville',
      state: 'TN',
      postalCode: '37205',
      leadType: 'BUYER',
      source: 'WEBSITE',
      status: 'CONTACTED',
      stage: 'CONSIDERATION',
      priority: 'HIGH',
      buyingCriteria: {
        propertyTypes: ['SINGLE_FAMILY', 'MULTI_FAMILY'],
        strategies: ['BUY_AND_HOLD', 'BRRRR'],
        targetROI: 12,
        preferredAreas: ['Nashville', 'Franklin', 'Brentwood']
      },
      maxBudget: 500000,
      investmentGoals: ['Cash Flow', 'Appreciation', 'Tax Benefits'],
      score: 78,
      qualificationScore: 85,
      engagementScore: 75,
      dealProbability: 0.60,
      organizationId: organization.id,
      assignedToId: adminUser.id
    }
  ]

  const createdLeads = []
  for (const leadData of leads) {
    const lead = await prisma.lead.create({
      data: leadData
    })
    createdLeads.push(lead)
  }

  console.log('✅ Created leads:', createdLeads.length)

  // Create sample deals
  const deals = [
    {
      dealName: 'Atlanta Fix & Flip - Main Street',
      dealType: 'FIX_AND_FLIP',
      strategy: 'HARD_MONEY',
      status: 'ANALYZING',
      purchasePrice: 275000,
      downPayment: 55000,
      loanAmount: 220000,
      interestRate: 8.5,
      loanTerm: 12,
      arv: 320000,
      repairCosts: 25000,
      holdingCosts: 8000,
      sellingCosts: 19200,
      grossProfit: 45000,
      netProfit: 17800,
      roi: 32.4,
      propertyId: createdProperties[0].id,
      leadId: createdLeads[0].id,
      organizationId: organization.id,
      assignedToId: agentUser.id
    },
    {
      dealName: 'Birmingham Buy & Hold - Oak Avenue',
      dealType: 'BUY_AND_HOLD',
      strategy: 'CONVENTIONAL_LOAN',
      status: 'OFFER_MADE',
      purchasePrice: 185000,
      downPayment: 37000,
      loanAmount: 148000,
      interestRate: 6.75,
      loanTerm: 360,
      arv: 240000,
      repairCosts: 35000,
      holdingCosts: 12000,
      monthlyRent: 1650,
      capRate: 8.2,
      cashOnCash: 11.5,
      propertyId: createdProperties[1].id,
      leadId: createdLeads[1].id,
      organizationId: organization.id,
      assignedToId: agentUser.id
    }
  ]

  const createdDeals = []
  for (const dealData of deals) {
    const deal = await prisma.deal.create({
      data: dealData
    })
    createdDeals.push(deal)
  }

  console.log('✅ Created deals:', createdDeals.length)

  // Create sample AI insights
  const insights = [
    {
      type: 'LEAD_SCORING',
      title: 'High-Value Seller Lead Identified',
      description: 'Michael Johnson shows strong selling motivation with high equity property. Excellent conversion potential.',
      confidence: 0.87,
      priority: 'HIGH',
      category: 'opportunity',
      tags: ['high-equity', 'motivated-seller', 'quick-close'],
      data: {
        leadScore: 85,
        equityAmount: 95000,
        motivationFactors: ['relocation', 'timeline-pressure'],
        riskFactors: ['market-competition']
      },
      recommendations: [
        'Schedule property visit within 48 hours',
        'Prepare cash offer at 95% of asking price',
        'Emphasize quick closing timeline'
      ],
      status: 'ACTIVE',
      leadId: createdLeads[0].id,
      userId: agentUser.id
    },
    {
      type: 'PREDICTIVE_ANALYTICS',
      title: 'Market Opportunity Alert - Birmingham',
      description: 'Birmingham market showing increased investor activity. Properties moving 15% faster than last quarter.',
      confidence: 0.92,
      priority: 'MEDIUM',
      category: 'market-trend',
      tags: ['market-opportunity', 'birmingham', 'velocity-increase'],
      data: {
        marketTrend: 'rising',
        velocityChange: 15,
        competitionLevel: 'medium',
        recommendedAction: 'increase-activity'
      },
      recommendations: [
        'Increase marketing budget for Birmingham area',
        'Accelerate deal evaluation process',
        'Consider raising offer amounts by 2-3%'
      ],
      status: 'ACTIVE',
      userId: adminUser.id
    }
  ]

  const createdInsights = []
  for (const insightData of insights) {
    const insight = await prisma.aiInsight.create({
      data: insightData
    })
    createdInsights.push(insight)
  }

  console.log('✅ Created AI insights:', createdInsights.length)

  console.log('🎉 Database seeding completed successfully!')
  console.log('')
  console.log('Sample login credentials:')
  console.log('Admin: admin@demo-investors.com / password123')
  console.log('Agent: agent@demo-investors.com / password123')
  console.log('')
  console.log('Sample data created:')
  console.log(`- ${createdProperties.length} properties`)
  console.log(`- ${createdOwners.length} property owners`)
  console.log(`- ${createdLeads.length} leads`)
  console.log(`- ${createdDeals.length} deals`)
  console.log(`- ${createdInsights.length} AI insights`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
