// LeadAI Pro - Global Test Teardown
// Cleanup test environment and database

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...')

  try {
    // Clean up test database
    console.log('🗑️ Cleaning up test database...')
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
        }
      }
    })

    try {
      // Clean all test data in correct order (respecting foreign key constraints)
      await prisma.leadScore.deleteMany()
      await prisma.conversation.deleteMany()
      await prisma.activity.deleteMany()
      await prisma.lead.deleteMany()
      await prisma.user.deleteMany()
      await prisma.team.deleteMany()
      await prisma.organization.deleteMany()

      console.log('✅ Test data cleaned successfully')
    } catch (error) {
      console.warn('⚠️ Warning: Could not clean test data:', error)
    } finally {
      await prisma.$disconnect()
    }

    // Optionally drop test database (uncomment if needed)
    // try {
    //   execSync('dropdb leadai_test', { stdio: 'ignore' })
    //   console.log('✅ Test database dropped')
    // } catch (error) {
    //   console.warn('⚠️ Warning: Could not drop test database:', error)
    // }

    console.log('✅ Test environment cleanup complete!')

  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error)
    // Don't exit with error code as this might prevent test results from being reported
  }
}
